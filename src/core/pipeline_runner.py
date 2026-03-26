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

STEPS = ["Script", "Metadata", "TTS", "Visuals", "Subtitles", "Compose"]
STEP_MARKERS = {
    "[1/6]": 0,
    "[2/6]": 1,
    "[3/6]": 2,
    "[4/6]": 3,
    "[5/6]": 4,
    "[6/6]": 5,
}

_VENV_PYTHON = Path(__file__).parent.parent.parent / ".venv" / "bin" / "python"
_PIPELINE_PYTHON = str(_VENV_PYTHON) if _VENV_PYTHON.exists() else sys.executable

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
        run_env.update({k: str(v) for k, v in preset_env.items()})

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
            else:
                s["status"] = "failed"
                # Provide meaningful error context from pipeline output
                if error_lines:
                    s["error"] = "\n".join(error_lines[-10:])
                else:
                    s["error"] = f"Process exited with code {proc.returncode}"
            _write_session(sid, s)

    except Exception as e:
        remove_proc(sid)
        s = _read_session(sid)
        if s.get("status") not in ("stopped",):
            s["status"] = "failed"
            s["error"] = str(e)
            _write_session(sid, s)
