import logging
import threading
import subprocess
from typing import Dict

logger = logging.getLogger("ProcessRegistry")

# Process registry — maps session_id → running Popen object
_procs: Dict[str, subprocess.Popen] = {}
_procs_lock = threading.Lock()

def get_proc(sid: str) -> subprocess.Popen:
    with _procs_lock:
        return _procs.get(sid)

def add_proc(sid: str, proc: subprocess.Popen):
    cleanup_dead()  # clean up terminated processes before adding new ones
    with _procs_lock:
        _procs[sid] = proc

def remove_proc(sid: str):
    with _procs_lock:
        _procs.pop(sid, None)

def kill_proc(sid: str):
    with _procs_lock:
        proc = _procs.get(sid)
    if proc:
        try:
            proc.terminate()
        except Exception:
            try:
                proc.kill()
            except Exception:
                pass

def cleanup_dead():
    """Remove terminated processes from the registry."""
    with _procs_lock:
        dead = [sid for sid, proc in _procs.items() if proc.poll() is not None]
        for sid in dead:
            del _procs[sid]
    if dead:
        logger.info(f"[ProcessRegistry] Cleaned up {len(dead)} dead process(es): {dead}")
