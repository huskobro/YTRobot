import asyncio
import json
import time
import logging
from typing import Dict, Set, Optional
from fastapi import WebSocket

logger = logging.getLogger("ProgressManager")

class ProgressManager:
    """Manages real-time pipeline progress via WebSocket connections."""

    STALE_SECONDS = 3600  # 1 hour
    _CLEANUP_INTERVAL = 100  # run cleanup every N update calls

    def __init__(self):
        self._connections: Dict[str, Set[WebSocket]] = {}  # session_id -> set of websockets
        self._global_connections: Set[WebSocket] = set()     # connections watching all jobs
        self._progress: Dict[str, dict] = {}                 # session_id -> progress data
        self._update_count = 0

    async def connect(self, websocket: WebSocket, session_id: Optional[str] = None):
        await websocket.accept()
        if session_id:
            if session_id not in self._connections:
                self._connections[session_id] = set()
            self._connections[session_id].add(websocket)
        else:
            self._global_connections.add(websocket)
        # Send current state if available
        if session_id and session_id in self._progress:
            await self._safe_send(websocket, self._progress[session_id])

    def disconnect(self, websocket: WebSocket, session_id: Optional[str] = None):
        if session_id and session_id in self._connections:
            self._connections[session_id].discard(websocket)
        self._global_connections.discard(websocket)

    def _cleanup_stale(self):
        """Remove progress entries and dead connections older than STALE_SECONDS."""
        now = time.time()
        stale_ids = [
            sid for sid, p in self._progress.items()
            if now - p.get("timestamp", now) > self.STALE_SECONDS
        ]
        for sid in stale_ids:
            self._progress.pop(sid, None)
            self._connections.pop(sid, None)
        # Also clean up connection sets with no live websockets
        empty_sids = [sid for sid, ws_set in self._connections.items() if not ws_set]
        for sid in empty_sids:
            del self._connections[sid]
        if stale_ids or empty_sids:
            logger.info(f"[Progress] Cleaned up {len(stale_ids)} stale entries, {len(empty_sids)} empty connection sets")

    async def update_progress(self, session_id: str, stage: str, progress: float,
                               message: str = "", details: dict = None):
        """Update progress for a session and broadcast to connected clients."""
        self._update_count += 1
        if self._update_count % self._CLEANUP_INTERVAL == 0:
            self._cleanup_stale()
        data = {
            "type": "progress",
            "session_id": session_id,
            "stage": stage,
            "progress": round(progress, 1),
            "message": message,
            "details": details or {},
            "timestamp": time.time(),
        }
        self._progress[session_id] = data

        # Broadcast to session-specific listeners
        if session_id in self._connections:
            dead = set()
            for ws in self._connections[session_id]:
                if not await self._safe_send(ws, data):
                    dead.add(ws)
            self._connections[session_id] -= dead

        # Broadcast to global listeners
        dead = set()
        for ws in self._global_connections:
            if not await self._safe_send(ws, data):
                dead.add(ws)
        self._global_connections -= dead

    async def complete(self, session_id: str, status: str = "completed", error: str = ""):
        data = {
            "type": "complete",
            "session_id": session_id,
            "status": status,
            "error": error,
            "timestamp": time.time(),
        }
        # Broadcast to session-specific listeners
        if session_id in self._connections:
            for ws in self._connections[session_id]:
                await self._safe_send(ws, data)
            del self._connections[session_id]
        # Broadcast to global listeners
        for ws in self._global_connections:
            await self._safe_send(ws, data)
        self._progress.pop(session_id, None)

    async def _safe_send(self, ws: WebSocket, data: dict) -> bool:
        try:
            await ws.send_json(data)
            return True
        except Exception:
            return False

    def get_progress(self, session_id: str) -> Optional[dict]:
        return self._progress.get(session_id)


progress_manager = ProgressManager()
