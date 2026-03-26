import os
import json
import shutil
from pathlib import Path
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import HTTPException

OUTPUT_DIR = Path("output")
ENV_FILE = Path(".env")
PROMPTS_DIR = Path("prompts")
PRESETS_DIR = Path("presets")
BULLETIN_SOURCES_FILE = Path("bulletin_sources.json")
BULLETIN_HISTORY_FILE = Path("bulletin_history.json")
BULLETIN_DIR = Path("output/bulletins")
PRODUCT_REVIEW_DIR = Path("output/product_reviews")

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
    _session_json(sid).write_text(json.dumps(data, indent=2))

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
    BULLETIN_SOURCES_FILE.write_text(json.dumps(sources, ensure_ascii=False, indent=2), encoding="utf-8")

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
    BULLETIN_HISTORY_FILE.write_text(json.dumps(history, ensure_ascii=False, indent=2), encoding="utf-8")

def _read_env() -> dict:
    if not ENV_FILE.exists():
        return {}
    out = {}
    for line in ENV_FILE.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, _, v = line.partition("=")
            out[k.strip()] = v.strip()
    return out

def _write_env(values: dict):
    lines = [f"{k}={v}" for k, v in values.items()]
    ENV_FILE.write_text("\n".join(lines) + "\n")

def _cleanup_stale_sessions():
    """Mark any sessions that were 'running'/'queued' at server start as failed."""
    for s in _all_sessions():
        if s.get("status") in ("running", "queued", "paused"):
            s["status"] = "failed"
            s["error"] = "Server restarted — process was interrupted"
            _write_session(s["id"], s)
