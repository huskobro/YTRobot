import os
import json
import signal
import threading
import platform
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from src.api.models.schemas import RunReq
from src.core.utils import (
    _read_session, _write_session, _all_sessions, _session_dir, PRESETS_DIR
)
from src.core.process_registry import get_proc, kill_proc
from src.core.pipeline_runner import _run, STEPS
from src.core.queue import queue_manager
from src.core.progress import progress_manager
import asyncio

router = APIRouter(prefix="/api", tags=["sessions"])

@router.websocket("/ws/progress/{session_id}")
async def ws_progress(websocket: WebSocket, session_id: str):
    await progress_manager.connect(websocket, session_id)
    try:
        while True:
            await websocket.receive_text()  # Keep alive
    except WebSocketDisconnect:
        progress_manager.disconnect(websocket, session_id)

@router.websocket("/ws/progress")
async def ws_progress_global(websocket: WebSocket):
    await progress_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        progress_manager.disconnect(websocket)

@router.get("/sessions")
def get_sessions():
    return _all_sessions()

@router.get("/sessions/{sid}")
def get_session(sid: str):
    return _read_session(sid)

@router.get("/sessions/{sid}/video")
async def get_video(sid: str):
    """Serve the final video file for preview."""
    for filename in ["final_video.mp4", "final_output.mp4"]:
        video_path = Path(f"sessions/{sid}/{filename}")
        if video_path.exists():
            return FileResponse(str(video_path), media_type="video/mp4", filename=filename)
    for filename in ["final_video.mp4", "final_output.mp4"]:
        video_path = Path(f"output/{sid}/{filename}")
        if video_path.exists():
            return FileResponse(str(video_path), media_type="video/mp4", filename=filename)
    raise HTTPException(status_code=404, detail="Video not found")

@router.post("/run")
async def start_run(req: RunReq):
    if not req.topic and not req.script_file:
        raise HTTPException(400, "Provide topic or script_file")
    sid = datetime.now().strftime("%Y%m%d_%H%M%S")
    _session_dir(sid).mkdir(parents=True, exist_ok=True)
    
    preset_env = {}
    if req.preset_name:
        p = PRESETS_DIR / f"{req.preset_name}.json"
        if p.exists():
            preset_env = json.loads(p.read_text())

    # Wizard config overrides preset values
    if req.wizard_config:
        from src.core.wizard_mapper import wizard_config_to_env
        wizard_env = wizard_config_to_env(req.wizard_config)
        preset_env.update(wizard_env)

    session = {
        "id": sid,
        "topic": req.topic or req.script_file,
        "input_type": "topic" if req.topic else "script",
        "input_value": req.topic or req.script_file,
        "status": "queued",
        "paused": False,
        "pid": None,
        "current_step": -1,
        "steps": [{"name": s, "status": "pending"} for s in STEPS],
        "notes": "",
        "started_at": datetime.now().isoformat(),
        "completed_at": None,
        "output_file": None,
        "error": None,
        "metadata": None,
        "preset_name": req.preset_name or "",
        "module": "yt_video",
        "wizard_config": req.wizard_config.model_dump() if req.wizard_config else None,
    }
    _write_session(sid, session)

    # Attach active channel config to job data
    try:
        from src.core.channel_hub import channel_hub
        ch = channel_hub.get_active_channel()
        channel_config = ch or {}
        channel_id = channel_config.get("id", "_default")
    except Exception:
        channel_config = {}
        channel_id = "_default"

    # Use queue manager instead of raw thread
    await queue_manager.add_job("yt_video", {
        "topic": req.topic,
        "script_file": req.script_file,
        "preset_env": preset_env,
        "content_category": req.content_category or "general",
        "channel_config": channel_config,
        "channel_id": channel_id,
    }, sid)
    
    return {"session_id": sid, "status": "queued"}

async def run_pipeline_task(sid: str, data: dict, job_type: str):
    """Bridge for QueueManager to call the core runner safely."""
    # Since _run is synchronous, we run it in a separate thread but managed by asyncio
    topic = data.get("topic")
    script_file = data.get("script_file")
    preset_env = data.get("preset_env", {})
    content_category = data.get("content_category", "general")
    if content_category and content_category != "general":
        preset_env = {**preset_env, "CONTENT_CATEGORY": content_category}

    # Inject channel master_prompt into env so main.py subprocess can read it
    channel_prompt = data.get("channel_config", {}).get("master_prompt", "")
    if channel_prompt:
        preset_env = {**preset_env, "CHANNEL_MASTER_PROMPT": channel_prompt}

    await progress_manager.update_progress(sid, "script", 0, "Pipeline başlatılıyor...")
    await asyncio.to_thread(_run, sid, topic, script_file, preset_env)

@router.post("/sessions/{sid}/stop")
def stop_session(sid: str):
    s = _read_session(sid)
    if s["status"] not in ("running", "paused", "queued"):
        raise HTTPException(400, f"Cannot stop session in status '{s['status']}'")
    kill_proc(sid)
    s["status"] = "stopped"
    s["error"] = "Stopped by user"
    s["paused"] = False
    _write_session(sid, s)
    return {"ok": True}

@router.post("/sessions/{sid}/pause")
def pause_session(sid: str):
    if platform.system() == "Windows":
        raise HTTPException(400, "Pause is not supported on Windows")
    s = _read_session(sid)
    if s["status"] != "running":
        raise HTTPException(400, f"Cannot pause session in status '{s['status']}'")
    proc = get_proc(sid)
    if not proc:
        raise HTTPException(400, "Process not found")
    try:
        os.kill(proc.pid, signal.SIGSTOP)
    except Exception as e:
        raise HTTPException(500, f"Failed to pause: {e}")
    s["status"] = "paused"
    s["paused"] = True
    _write_session(sid, s)
    return {"ok": True}

@router.post("/sessions/{sid}/resume")
def resume_session(sid: str):
    if platform.system() == "Windows":
        raise HTTPException(400, "Resume is not supported on Windows")
    s = _read_session(sid)
    if s["status"] != "paused":
        raise HTTPException(400, f"Cannot resume session in status '{s['status']}'")
    proc = get_proc(sid)
    if not proc:
        raise HTTPException(400, "Process not found")
    try:
        os.kill(proc.pid, signal.SIGCONT)
    except Exception as e:
        raise HTTPException(500, f"Failed to resume: {e}")
    s["status"] = "running"
    s["paused"] = False
    _write_session(sid, s)
    return {"ok": True}
