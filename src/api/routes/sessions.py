import os
import json
import signal
import threading
import platform
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, HTTPException
from src.api.models.schemas import RunReq
from src.core.utils import (
    _read_session, _write_session, _all_sessions, _session_dir, PRESETS_DIR
)
from src.core.process_registry import get_proc, kill_proc
from src.core.pipeline_runner import _run, STEPS

router = APIRouter(prefix="/api", tags=["sessions"])

@router.get("/sessions")
def get_sessions():
    return _all_sessions()

@router.get("/sessions/{sid}")
def get_session(sid: str):
    return _read_session(sid)

@router.post("/run")
def start_run(req: RunReq):
    if not req.topic and not req.script_file:
        raise HTTPException(400, "Provide topic or script_file")
    sid = datetime.now().strftime("%Y%m%d_%H%M%S")
    _session_dir(sid).mkdir(parents=True, exist_ok=True)
    preset_env = {}
    if req.preset_name:
        p = PRESETS_DIR / f"{req.preset_name}.json"
        if p.exists():
            preset_env = json.loads(p.read_text())
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
    }
    _write_session(sid, session)
    threading.Thread(target=_run, args=(sid, req.topic, req.script_file, preset_env), daemon=True).start()
    return {"session_id": sid}

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
