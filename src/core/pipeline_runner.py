import asyncio
import logging
import os
import json
import subprocess
import sys
import threading
from datetime import datetime
from pathlib import Path
from typing import Optional

from src.core.utils import _read_session, _write_session, _log_file, _session_dir
from src.core.process_registry import add_proc, remove_proc

logger = logging.getLogger("ytrobot.pipeline_runner")

# Whitelist of allowed env var prefixes for preset overrides
_ALLOWED_ENV_PREFIXES = (
    "YT_", "TTS_", "VISUALS_", "REMOTION_", "OPENAI_", "ANTHROPIC_",
    "ELEVENLABS_", "PEXELS_", "PIXABAY_", "GOOGLE_", "SPESH_", "DUBVOICE_",
    "EDGE_", "VIDEO_", "SUBTITLE_", "OUTPUT_", "SCRIPT_", "BULLETIN_",
    "PR_", "PYCAPS_", "KIEAI_", "GEMINI_", "COMPOSER_", "ZIMAGE_",
    "QWEN3_", "WEBHOOK_", "SOCIAL_",
)

STEPS = ["Script", "Metadata", "TTS", "Visuals", "Subtitles", "Compose"]
STEP_MARKERS = {
    "[1/6]": 0,
    "[2/6]": 1,
    "[3/6]": 2,
    "[4/6]": 3,
    "[5/6]": 4,
    "[6/6]": 5,
}

# Progress messages for each step index
_STEP_PROGRESS_START = {
    0: ("script",   0,   "Script oluşturuluyor..."),
    1: ("metadata", 16,  "Metadata hazırlanıyor..."),
    2: ("tts",      33,  "Ses sentezi başlıyor..."),
    3: ("visuals",  50,  "Görseller indiriliyor..."),
    4: ("subtitles",66,  "Altyazılar oluşturuluyor..."),
    5: ("compose",  83,  "Video oluşturuluyor..."),
}

def _emit_progress(sid: str, stage: str, progress: float, message: str):
    """Fire-and-forget progress update from a sync thread."""
    try:
        from src.core.progress import progress_manager
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.run_coroutine_threadsafe(
                progress_manager.update_progress(sid, stage, progress, message),
                loop,
            )
    except Exception:
        pass

def _find_venv_python() -> str:
    """Find the venv Python interpreter, platform-aware."""
    project_root = Path(__file__).parent.parent.parent
    if sys.platform == "win32":
        candidates = [
            project_root / ".venv" / "Scripts" / "python.exe",
            project_root / ".venv" / "Scripts" / "python",
        ]
    else:
        candidates = [
            project_root / ".venv" / "bin" / "python",
        ]
    for candidate in candidates:
        if candidate.exists():
            return str(candidate)
    return sys.executable

_PIPELINE_PYTHON = _find_venv_python()

def _run(sid: str, topic: Optional[str], script: Optional[str], preset_env: dict = None):
    session = _read_session(sid)
    session["status"] = "running"
    session["paused"] = False
    _write_session(sid, session)

    log_path = _log_file(sid)
    # main.py is in the root directory
    cmd = [_PIPELINE_PYTHON, "-u", "main.py"]
    if topic:
        cmd += ["--topic", topic]
    else:
        cmd += ["--script", script]

    run_env = {**os.environ}
    if preset_env:
        filtered = {}
        for k, v in preset_env.items():
            key_upper = k.upper()
            if any(key_upper.startswith(prefix) for prefix in _ALLOWED_ENV_PREFIXES):
                filtered[k] = str(v)
            else:
                logger.warning(f"Rejected env var override '{k}': prefix not in whitelist")
        run_env.update(filtered)

    try:
        with open(log_path, "w", encoding="utf-8") as lf:
            proc = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                cwd=Path(__file__).parent.parent.parent,
                encoding="utf-8",
                env=run_env,
            )
            add_proc(sid, proc)

            # Update session with PID
            s = _read_session(sid)
            s["pid"] = proc.pid
            _write_session(sid, s)

            error_lines = []  # Collect error-relevant lines
            for line in proc.stdout:
                lf.write(line)
                lf.flush()
                # Track error-relevant lines for better diagnostics
                stripped = line.strip()
                if any(kw in stripped for kw in ("[ERROR]", "Traceback", "Error:", "Exception:", "RuntimeError:", "failed")):
                    error_lines.append(stripped)
                    if len(error_lines) > 20:
                        error_lines.pop(0)
                for marker, idx in STEP_MARKERS.items():
                    if marker in line:
                        s = _read_session(sid)
                        s["current_step"] = idx
                        for i, step in enumerate(s["steps"]):
                            if i < idx:
                                step["status"] = "completed"
                            elif i == idx:
                                step["status"] = "running"
                        _write_session(sid, s)
                        # Emit real-time progress via WebSocket
                        if idx in _STEP_PROGRESS_START:
                            stage, pct, msg = _STEP_PROGRESS_START[idx]
                            _emit_progress(sid, stage, pct, msg)
                        break
                if "✓ Video ready:" in line:
                    s = _read_session(sid)
                    s["output_file"] = line.split("✓ Video ready:")[-1].strip()
                    _write_session(sid, s)
            proc.wait()

        remove_proc(sid)

        s = _read_session(sid)
        if s["status"] not in ("stopped",):
            if proc.returncode == 0:
                s["status"] = "completed"
                s["completed_at"] = datetime.now().isoformat()
                for step in s["steps"]:
                    step["status"] = "completed"
                meta_path = _session_dir(sid) / "metadata.json"
                if meta_path.exists():
                    s["metadata"] = json.loads(meta_path.read_text())
                _write_session(sid, s)
                _emit_progress(sid, "compose", 100, "Video tamamlandı!")
                _update_lifecycle(sid, "completed")
            else:
                s["status"] = "failed"
                # Provide meaningful error context from pipeline output
                if error_lines:
                    s["error"] = "\n".join(error_lines[-10:])
                else:
                    s["error"] = f"Process exited with code {proc.returncode}"
                _write_session(sid, s)
                _update_lifecycle(sid, "failed")
        else:
            _write_session(sid, s)

    except Exception as e:
        remove_proc(sid)
        s = _read_session(sid)
        if s.get("status") not in ("stopped",):
            s["status"] = "failed"
            s["error"] = str(e)
            _write_session(sid, s)
            _update_lifecycle(sid, "failed")


def _update_lifecycle(sid: str, status: str):
    """Update linked calendar entries and channel analytics after pipeline finishes."""
    try:
        s = _read_session(sid)
        channel_id = s.get("channel_id", "_default")

        # Update any calendar entry linked to this session
        from src.core.content_calendar import content_calendar
        for entry in content_calendar.get_entries():
            if entry.get("session_id") == sid:
                new_status = "produced" if status == "completed" else "planned"
                content_calendar.update_entry(entry["id"], {"status": new_status})
                break

        # Log render to channel analytics
        from src.core.channel_hub import channel_hub
        started = s.get("started_at", "")
        completed = s.get("completed_at", "")
        duration = 0.0
        if started and completed:
            try:
                t0 = datetime.fromisoformat(started)
                t1 = datetime.fromisoformat(completed)
                duration = (t1 - t0).total_seconds()
            except Exception:
                pass
        channel_hub.log_channel_render(channel_id, duration, status)

    except Exception as e:
        logger.warning(f"[Lifecycle] Failed to update lifecycle for {sid}: {e}")
