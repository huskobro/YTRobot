import os
import json
import shutil
import tempfile
import logging
import threading
from pathlib import Path
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import HTTPException

logger = logging.getLogger("ytrobot.utils")

# Per-session locks to prevent concurrent read-modify-write races on session.json
_session_locks: Dict[str, threading.Lock] = {}
_session_locks_meta = threading.Lock()

def _get_session_lock(sid: str) -> threading.Lock:
    with _session_locks_meta:
        if sid not in _session_locks:
            _session_locks[sid] = threading.Lock()
        return _session_locks[sid]


def _safe_write(path: Path, content: str, encoding: str = "utf-8"):
    """Atomik dosya yazma — once gecici dosyaya yazar, sonra rename ile degistirir."""
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp_path = tempfile.mkstemp(dir=path.parent, suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding=encoding) as f:
            f.write(content)
        os.replace(tmp_path, path)
    except Exception:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass
        raise

OUTPUT_DIR = Path("output")
ENV_FILE = Path(".env")
PROMPTS_DIR = Path("prompts")
PRESETS_DIR = Path("presets")
BULLETIN_SOURCES_FILE = Path("bulletin_sources.json")
BULLETIN_HISTORY_FILE = Path("bulletin_history.json")
BULLETIN_DIR = Path("output/bulletins")
PRODUCT_REVIEW_DIR = Path("output/product_reviews")
ASSETS_DIR = Path("assets")
CACHE_DIR = ASSETS_DIR / "cache"

def _list_presets() -> list:
    if not PRESETS_DIR.exists():
        return []
    out = []
    for f in sorted(PRESETS_DIR.glob("*.json")):
        try:
            out.append({"name": f.stem, "values": json.loads(f.read_text())})
        except Exception:
            pass
    return out

def _session_dir(sid: str) -> Path:
    return OUTPUT_DIR / sid

def _session_json(sid: str) -> Path:
    return _session_dir(sid) / "session.json"

def _log_file(sid: str) -> Path:
    return _session_dir(sid) / "pipeline.log"

def _read_session(sid: str) -> dict:
    p = _session_json(sid)
    if not p.exists():
        raise HTTPException(404, "Session not found")
    return json.loads(p.read_text())

def _write_session(sid: str, data: dict):
    with _get_session_lock(sid):
        _safe_write(_session_json(sid), json.dumps(data, indent=2))

def _all_sessions() -> list:
    sessions = []
    if OUTPUT_DIR.exists():
        for p in sorted(OUTPUT_DIR.iterdir(), reverse=True):
            if p.is_dir():
                j = p / "session.json"
                if j.exists():
                    try:
                        sessions.append(json.loads(j.read_text()))
                    except Exception:
                        pass
    return sessions

def _load_bulletin_sources() -> list:
    if not BULLETIN_SOURCES_FILE.exists():
        return []
    try:
        return json.loads(BULLETIN_SOURCES_FILE.read_text(encoding="utf-8"))
    except Exception:
        return []

def _save_bulletin_sources(sources: list):
    _safe_write(BULLETIN_SOURCES_FILE, json.dumps(sources, ensure_ascii=False, indent=2))

def _load_bulletin_history() -> dict:
    if not BULLETIN_HISTORY_FILE.exists():
        return {}
    try:
        return json.loads(BULLETIN_HISTORY_FILE.read_text(encoding="utf-8"))
    except Exception:
        return {}

def _append_bulletin_history(preset_name: str, urls: list):
    history = _load_bulletin_history()
    existing = set(history.get(preset_name, []))
    existing.update(u for u in urls if u)
    history[preset_name] = list(existing)
    _safe_write(BULLETIN_HISTORY_FILE, json.dumps(history, ensure_ascii=False, indent=2))

def _read_env() -> dict:
    if not ENV_FILE.exists():
        return {}
    out = {}
    for line in ENV_FILE.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, _, v = line.partition("=")
            v = v.strip()
            # Strip shell single-quote wrapping and unescape \' → '
            if v.startswith("'") and v.endswith("'"):
                v = v[1:-1].replace("\\'", "'")
            out[k.strip()] = v
    return out

def _write_env(values: dict):
    """
    .env dosyasini guvenli sekilde yazar.
    Bosluk veya ozel karakter iceren degerler tikli tirnak icine alinir.
    """
    lines = []
    for k, v in values.items():
        v_str = str(v) if v is not None else ""
        # Deger bosluk, tikli tirnak, #, = veya yeni satir iceriyorsa tirnak kullan
        if any(c in v_str for c in (' ', '"', "'", '#', '\n', '\r', '=')):
            escaped = v_str.replace("'", "\\'")
            lines.append(f"{k}='{escaped}'")
        else:
            lines.append(f"{k}={v_str}")
    _safe_write(ENV_FILE, "\n".join(lines) + "\n")

def _cleanup_stale_sessions():
    """Mark any sessions that were 'running'/'queued' at server start as failed."""
    for s in _all_sessions():
        if s.get("status") in ("running", "queued", "paused"):
            s["status"] = "failed"
            s["error"] = "Server restarted — process was interrupted"
            _write_session(s["id"], s)
