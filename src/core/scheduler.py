import asyncio
import json
import logging
from pathlib import Path
from datetime import datetime, timezone
from typing import List, Optional

logger = logging.getLogger("Scheduler")

SCHEDULE_FILE = Path("data/schedule.json")


class ScheduleEntry:
    def __init__(self, session_id: str, channel_id: str, scheduled_at: str,
                 title: str = "", description: str = "", tags: list = None,
                 privacy_status: str = "private", category_id: str = "22",
                 status: str = "pending"):
        self.session_id = session_id
        self.channel_id = channel_id
        self.scheduled_at = scheduled_at  # ISO 8601
        self.title = title
        self.description = description
        self.tags = tags or []
        self.privacy_status = privacy_status
        self.category_id = category_id
        self.status = status  # pending | published | failed | cancelled
        self.created_at = datetime.now(timezone.utc).isoformat()
        self.error = ""

    def to_dict(self):
        return {
            "session_id": self.session_id,
            "channel_id": self.channel_id,
            "scheduled_at": self.scheduled_at,
            "title": self.title,
            "description": self.description,
            "tags": self.tags,
            "privacy_status": self.privacy_status,
            "category_id": self.category_id,
            "status": self.status,
            "created_at": self.created_at,
            "error": self.error,
        }


class VideoScheduler:
    def __init__(self):
        self._running = False
        self._task: Optional[asyncio.Task] = None
        self._entries: List[dict] = []
        self._load()

    def _load(self):
        SCHEDULE_FILE.parent.mkdir(parents=True, exist_ok=True)
        if SCHEDULE_FILE.exists():
            try:
                self._entries = json.loads(SCHEDULE_FILE.read_text())
            except Exception:
                self._entries = []

    def _save(self):
        SCHEDULE_FILE.parent.mkdir(parents=True, exist_ok=True)
        SCHEDULE_FILE.write_text(json.dumps(self._entries, indent=2, ensure_ascii=False))

    def add(self, entry: ScheduleEntry) -> dict:
        d = entry.to_dict()
        self._entries.append(d)
        self._save()
        logger.info(f"[Scheduler] Added: {entry.session_id} at {entry.scheduled_at}")
        return d

    def get_all(self) -> List[dict]:
        return self._entries

    def get_pending(self) -> List[dict]:
        return [e for e in self._entries if e.get("status") == "pending"]

    def cancel(self, session_id: str) -> bool:
        for e in self._entries:
            if e["session_id"] == session_id and e["status"] == "pending":
                e["status"] = "cancelled"
                self._save()
                return True
        return False

    def update_status(self, session_id: str, status: str, error: str = ""):
        for e in self._entries:
            if e["session_id"] == session_id:
                e["status"] = status
                e["error"] = error
                break
        self._save()

    def start(self):
        if not self._running:
            self._running = True
            self._task = asyncio.create_task(self._check_loop())
            logger.info("[Scheduler] Started")

    async def stop(self):
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("[Scheduler] Stopped")

    async def _check_loop(self):
        while self._running:
            try:
                now = datetime.now(timezone.utc)
                for entry in self._entries:
                    if entry["status"] != "pending":
                        continue
                    scheduled = datetime.fromisoformat(entry["scheduled_at"].replace("Z", "+00:00"))
                    if scheduled <= now:
                        await self._publish(entry)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"[Scheduler] Check loop error: {e}")
            await asyncio.sleep(30)  # Check every 30 seconds

    async def _publish(self, entry: dict):
        session_id = entry["session_id"]
        channel_id = entry["channel_id"]
        logger.info(f"[Scheduler] Publishing {session_id} to channel {channel_id}")
        try:
            from src.core.youtube_auth import youtube_auth
            if not youtube_auth.is_authenticated(channel_id):
                entry["status"] = "failed"
                entry["error"] = "YouTube not authenticated"
                self._save()
                return

            video_path = None
            for fn in ["final_video.mp4", "final_output.mp4"]:
                for base in ["sessions", "output"]:
                    p = Path(f"{base}/{session_id}/{fn}")
                    if p.exists():
                        video_path = p
                        break
                if video_path:
                    break

            if not video_path:
                entry["status"] = "failed"
                entry["error"] = "Video file not found"
                self._save()
                return

            service = youtube_auth.get_service(channel_id)
            from googleapiclient.http import MediaFileUpload
            body = {
                "snippet": {
                    "title": entry.get("title", "Untitled"),
                    "description": entry.get("description", ""),
                    "tags": entry.get("tags", []),
                    "categoryId": entry.get("category_id", "22"),
                },
                "status": {
                    "privacyStatus": entry.get("privacy_status", "private"),
                    "selfDeclaredMadeForKids": False,
                },
            }
            media = MediaFileUpload(str(video_path), mimetype="video/mp4", resumable=True)
            request = service.videos().insert(part="snippet,status", body=body, media_body=media)
            response = None
            while response is None:
                _, response = request.next_chunk()

            entry["status"] = "published"
            entry["video_id"] = response.get("id", "")
            logger.info(f"[Scheduler] Published {session_id}: {entry['video_id']}")
        except Exception as e:
            entry["status"] = "failed"
            entry["error"] = str(e)
            logger.error(f"[Scheduler] Publish failed for {session_id}: {e}")
        self._save()


video_scheduler = VideoScheduler()
