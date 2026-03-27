import os
import json
import shutil
import signal
import threading
import platform
from datetime import datetime
from pathlib import Path
from typing import List
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from pydantic import BaseModel
from src.api.models.schemas import RunReq
from src.core.utils import (
    _read_session, _write_session, _all_sessions, _session_dir, PRESETS_DIR
)
from src.core.process_registry import get_proc, kill_proc
from src.core.pipeline_runner import _run, STEPS
from src.core.queue import queue_manager
from src.core.progress import progress_manager
import asyncio


class BulkActionRequest(BaseModel):
    session_ids: List[str]
    action: str  # "delete" | "archive" | "rerender"

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

@router.get("/sessions/gallery")
async def video_gallery(status: str = "", search: str = "", module: str = "",
                        channel: str = "", limit: int = 20, offset: int = 0):
    """List all sessions that have generated videos."""
    results = []
    for base_dir in [Path("sessions"), Path("output")]:
        if not base_dir.exists():
            continue
        # Collect and sort directories first — avoids stat() per-file
        try:
            all_dirs = sorted(
                [p for p in base_dir.iterdir() if p.is_dir()],
                key=lambda p: p.stat().st_mtime,
                reverse=True,
            )
        except OSError:
            continue
        for session_path in all_dirs:
            session_id = session_path.name
            video_file = None
            for fn in ["final_video.mp4", "final_output.mp4"]:
                if (session_path / fn).exists():
                    video_file = fn
                    break
            # Quick module filter from session_id prefix (no disk read needed)
            if module:
                quick_module = ""
                if session_id.startswith("bul_"):
                    quick_module = "bulletin"
                elif session_id.startswith("pr_"):
                    quick_module = "product_review"
                if quick_module and quick_module != module:
                    continue  # Skip disk read entirely for this dir
            session_data = {}
            metadata = {}
            for sj in ["session.json"]:
                sjp = session_path / sj
                if sjp.exists():
                    try:
                        session_data = json.loads(sjp.read_text())
                        break
                    except Exception:
                        pass
            # Also read metadata.json for title/tags
            meta_path = session_path / "metadata.json"
            if meta_path.exists():
                try:
                    metadata = json.loads(meta_path.read_text())
                except Exception:
                    pass
            wc = session_data.get("wizard_config", {})
            entry_module = session_data.get("module", "")
            # Detect module from session ID patterns
            if not entry_module:
                if session_id.startswith("bul_"):
                    entry_module = "bulletin"
                elif session_id.startswith("pr_"):
                    entry_module = "product_review"
            entry = {
                "session_id": session_id,
                "has_video": video_file is not None,
                "video_file": video_file,
                "status": session_data.get("status", "unknown"),
                "topic": session_data.get("topic", metadata.get("title", session_data.get("title", ""))),
                "created_at": session_data.get("created_at", session_data.get("started_at", "")),
                "channel_id": session_data.get("channel_id", "_default"),
                "module": entry_module,
                "platform": wc.get("platform", ""),
                "quality_preset": wc.get("quality_preset", ""),
                "has_thumbnail": (session_path / "thumbnail.jpg").exists(),
                "duration": session_data.get("duration", ""),
                "tags": metadata.get("tags", [])[:5],
            }
            if status and entry["status"] != status:
                continue
            if search and search.lower() not in (entry.get("topic", "") or "").lower():
                continue
            if module and entry["module"] != module:
                continue
            if channel and entry["channel_id"] != channel:
                continue
            results.append(entry)
    seen = set()
    unique = [r for r in results if r["session_id"] not in seen and not seen.add(r["session_id"])]
    total = len(unique)
    # Collect unique filter values for frontend pill filters
    modules_set = set()
    channels_set = set()
    platforms_set = set()
    for r in unique:
        if r.get("module"):
            modules_set.add(r["module"])
        if r.get("channel_id"):
            channels_set.add(r["channel_id"])
        if r.get("platform"):
            platforms_set.add(r["platform"])
    return {
        "videos": unique[offset:offset + limit],
        "total": total,
        "limit": limit,
        "offset": offset,
        "filters": {
            "modules": sorted(modules_set),
            "channels": sorted(channels_set),
            "platforms": sorted(platforms_set),
        }
    }


@router.get("/sessions/{session_id}/thumbnail")
async def session_thumbnail(session_id: str):
    """Return a thumbnail for a session video. Generates one from the video if missing."""
    import subprocess
    for base in ["sessions", "output"]:
        sp = Path(base) / session_id
        if not sp.is_dir():
            continue
        thumb = sp / "thumbnail.jpg"
        if thumb.exists():
            return FileResponse(thumb, media_type="image/jpeg")
        # Try to generate from video
        for vf in ["final_video.mp4", "final_output.mp4"]:
            video = sp / vf
            if video.exists():
                try:
                    subprocess.run([
                        "ffmpeg", "-y", "-i", str(video),
                        "-ss", "2", "-frames:v", "1",
                        "-vf", "scale=480:-1",
                        "-q:v", "4", str(thumb)
                    ], capture_output=True, timeout=10)
                    if thumb.exists():
                        return FileResponse(thumb, media_type="image/jpeg")
                except Exception:
                    pass
        # Try first clip as fallback
        clips_dir = sp / "clips"
        if clips_dir.exists():
            clips = sorted(clips_dir.glob("scene_*.mp4"))
            if clips:
                try:
                    subprocess.run([
                        "ffmpeg", "-y", "-i", str(clips[0]),
                        "-ss", "0.5", "-frames:v", "1",
                        "-vf", "scale=480:-1",
                        "-q:v", "4", str(thumb)
                    ], capture_output=True, timeout=10)
                    if thumb.exists():
                        return FileResponse(thumb, media_type="image/jpeg")
                except Exception:
                    pass
    raise HTTPException(404, "Thumbnail not found")


@router.post("/sessions/bulk")
async def bulk_action(req: BulkActionRequest):
    results = []
    for sid in req.session_ids:
        try:
            if req.action == "delete":
                for base in ["sessions", "output"]:
                    path = Path(base) / sid
                    if path.exists():
                        shutil.rmtree(path)
                        results.append({"session_id": sid, "status": "deleted"})
                        break
                else:
                    results.append({"session_id": sid, "status": "not_found"})
            elif req.action == "archive":
                archive_dir = Path("archive")
                archive_dir.mkdir(exist_ok=True)
                for base in ["sessions", "output"]:
                    path = Path(base) / sid
                    if path.exists():
                        shutil.move(str(path), str(archive_dir / sid))
                        results.append({"session_id": sid, "status": "archived"})
                        break
                else:
                    results.append({"session_id": sid, "status": "not_found"})
            else:
                results.append({"session_id": sid, "status": "unknown_action"})
        except Exception as e:
            results.append({"session_id": sid, "status": "error", "error": str(e)})
    return {"results": results, "action": req.action}


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

    # Resolve active channel early so we can embed it in the session
    try:
        from src.core.channel_hub import channel_hub
        ch = channel_hub.get_active_channel()
        channel_config = ch or {}
        channel_id = channel_config.get("id", "_default")
    except Exception:
        channel_config = {}
        channel_id = "_default"

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
        # Lifecycle tracking (FAZ 3)
        "channel_id": channel_id,
        "channel_name": channel_config.get("name", "Varsayılan Kanal"),
        "youtube_video_id": None,
        "youtube_playlist_id": None,
        "published_at": None,
    }
    _write_session(sid, session)

    # Load per-channel settings and merge into preset_env
    try:
        channel_settings = channel_hub.get_channel_settings(channel_id)
        if channel_settings:
            # Channel settings go UNDER preset_env so wizard overrides still win
            merged_env = {**channel_settings, **preset_env}
            preset_env = merged_env
    except Exception:
        pass

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

async def run_pipeline_task(sid: str, data: dict):
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
