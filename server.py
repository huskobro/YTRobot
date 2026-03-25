"""YTRobot Web UI — run with: python server.py"""
import asyncio
import json
import os
import platform
import shutil
import signal
import subprocess
import sys
import threading
from datetime import datetime
from pathlib import Path
from typing import Optional

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse, StreamingResponse, JSONResponse
from pydantic import BaseModel

app = FastAPI(title="YTRobot")

OUTPUT_DIR = Path("output")
ENV_FILE = Path(".env")
PROMPTS_DIR = Path("prompts")
PRESETS_DIR = Path("presets")
BULLETIN_SOURCES_FILE = Path("bulletin_sources.json")
BULLETIN_HISTORY_FILE = Path("bulletin_history.json")
BULLETIN_DIR = Path("output/bulletins")

PROMPT_KEYS = [
    "script_system", "script_humanize", "metadata_system", "tts_enhance",
    "bulletin_narration", "product_review_autofill"
]


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

STEPS = ["Script", "Metadata", "TTS", "Visuals", "Subtitles", "Compose"]
STEP_MARKERS = {
    "[1/6]": 0,
    "[2/6]": 1,
    "[3/6]": 2,
    "[4/6]": 3,
    "[5/6]": 4,
    "[6/6]": 5,
}

# Process registry — maps session_id → running Popen object
_procs: dict[str, subprocess.Popen] = {}
_procs_lock = threading.Lock()

# Always use the venv Python for pipeline subprocesses so that all pipeline
# dependencies are available even when server.py is started without activating
# the virtual environment first.
_VENV_PYTHON = Path(__file__).parent / ".venv" / "bin" / "python"
_PIPELINE_PYTHON = str(_VENV_PYTHON) if _VENV_PYTHON.exists() else sys.executable


# ── File helpers ──────────────────────────────────────────────────────────────

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
            j = p / "session.json"
            if j.exists():
                try:
                    sessions.append(json.loads(j.read_text()))
                except Exception:
                    pass
    return sessions


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


# ── Startup cleanup ───────────────────────────────────────────────────────────

def _cleanup_stale_sessions():
    """Mark any sessions that were 'running'/'queued' at server start as failed."""
    for s in _all_sessions():
        if s.get("status") in ("running", "queued", "paused"):
            s["status"] = "failed"
            s["error"] = "Server restarted — process was interrupted"
            _write_session(s["id"], s)


# ── Pipeline runner ───────────────────────────────────────────────────────────

def _run(sid: str, topic: Optional[str], script: Optional[str], preset_env: dict = None):
    session = _read_session(sid)
    session["status"] = "running"
    session["paused"] = False
    _write_session(sid, session)

    log_path = _log_file(sid)
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
                cwd=Path(__file__).parent,
                encoding="utf-8",
                env=run_env,
            )
            with _procs_lock:
                _procs[sid] = proc

            # Update session with PID
            s = _read_session(sid)
            s["pid"] = proc.pid
            _write_session(sid, s)

            for line in proc.stdout:
                lf.write(line)
                lf.flush()
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

        with _procs_lock:
            _procs.pop(sid, None)

        s = _read_session(sid)
        # Don't overwrite "stopped" status set by stop endpoint
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
                s["error"] = f"Process exited with code {proc.returncode}"
            _write_session(sid, s)

    except Exception as e:
        with _procs_lock:
            _procs.pop(sid, None)
        s = _read_session(sid)
        if s.get("status") not in ("stopped",):
            s["status"] = "failed"
            s["error"] = str(e)
            _write_session(sid, s)


# ── API ───────────────────────────────────────────────────────────────────────

@app.get("/api/sessions")
def get_sessions():
    return _all_sessions()


@app.get("/api/sessions/{sid}")
def get_session(sid: str):
    return _read_session(sid)


class RunReq(BaseModel):
    topic: Optional[str] = None
    script_file: Optional[str] = None
    preset_name: Optional[str] = None


@app.post("/api/run")
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


@app.post("/api/sessions/{sid}/stop")
def stop_session(sid: str):
    s = _read_session(sid)
    if s["status"] not in ("running", "paused", "queued"):
        raise HTTPException(400, f"Cannot stop session in status '{s['status']}'")
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
    s["status"] = "stopped"
    s["error"] = "Stopped by user"
    s["paused"] = False
    _write_session(sid, s)
    return {"ok": True}


@app.post("/api/sessions/{sid}/pause")
def pause_session(sid: str):
    if platform.system() == "Windows":
        raise HTTPException(400, "Pause is not supported on Windows")
    s = _read_session(sid)
    if s["status"] != "running":
        raise HTTPException(400, f"Cannot pause session in status '{s['status']}'")
    with _procs_lock:
        proc = _procs.get(sid)
    if not proc:
        raise HTTPException(400, "Process not found (may have already finished)")
    try:
        os.kill(proc.pid, signal.SIGSTOP)
    except Exception as e:
        raise HTTPException(500, f"Failed to pause: {e}")
    s["status"] = "paused"
    s["paused"] = True
    _write_session(sid, s)
    return {"ok": True}


@app.post("/api/sessions/{sid}/resume")
def resume_session(sid: str):
    if platform.system() == "Windows":
        raise HTTPException(400, "Resume is not supported on Windows")
    s = _read_session(sid)
    if s["status"] != "paused":
        raise HTTPException(400, f"Cannot resume session in status '{s['status']}'")
    with _procs_lock:
        proc = _procs.get(sid)
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


@app.post("/api/sessions/{sid}/restart")
def restart_session(sid: str):
    s = _read_session(sid)
    # Stop current process if running
    with _procs_lock:
        proc = _procs.get(sid)
    if proc:
        try:
            proc.terminate()
        except Exception:
            pass

    # Reset session state
    s["status"] = "queued"
    s["paused"] = False
    s["pid"] = None
    s["current_step"] = -1
    s["steps"] = [{"name": name, "status": "pending"} for name in STEPS]
    s["error"] = None
    s["output_file"] = None
    s["completed_at"] = None
    s["started_at"] = datetime.now().isoformat()
    _write_session(sid, s)

    topic = s.get("input_value") if s.get("input_type") == "topic" else None
    script = s.get("input_value") if s.get("input_type") == "script" else None
    # Fallback: use topic field directly for older sessions
    if not topic and not script:
        topic = s.get("topic")

    threading.Thread(target=_run, args=(sid, topic, script), daemon=True).start()
    return {"ok": True}


@app.delete("/api/sessions/{sid}")
def delete_session(sid: str):
    # Stop any running process first
    with _procs_lock:
        proc = _procs.pop(sid, None)
    if proc:
        try:
            proc.terminate()
        except Exception:
            pass

    d = _session_dir(sid)
    if not d.exists():
        raise HTTPException(404, "Session not found")
    shutil.rmtree(d)
    return {"ok": True}


class NoteReq(BaseModel):
    notes: str


@app.patch("/api/sessions/{sid}")
def update_notes(sid: str, body: NoteReq):
    s = _read_session(sid)
    s["notes"] = body.notes
    _write_session(sid, s)
    return s


@app.get("/api/settings")
def get_settings():
    return _read_env()


class SettingsReq(BaseModel):
    values: dict


@app.put("/api/settings")
def save_settings(body: SettingsReq):
    _write_env(body.values)
    return {"ok": True}


@app.get("/api/prompts")
def get_prompts():
    """Return custom prompt overrides. Empty string means 'use default'."""
    result = {}
    for key in PROMPT_KEYS:
        p = PROMPTS_DIR / f"{key}.txt"
        result[key] = p.read_text(encoding="utf-8") if p.exists() else ""
    return result


class PromptsReq(BaseModel):
    prompts: dict


@app.put("/api/prompts")
def save_prompts(body: PromptsReq):
    """Save non-empty prompts to files; delete file if empty (resets to default)."""
    PROMPTS_DIR.mkdir(exist_ok=True)
    for key, content in body.prompts.items():
        if key not in PROMPT_KEYS:
            continue
        p = PROMPTS_DIR / f"{key}.txt"
        if content.strip():
            p.write_text(content, encoding="utf-8")
        elif p.exists():
            p.unlink()
    return {"ok": True}


@app.get("/api/prompts/defaults")
def get_prompt_defaults():
    """Return the built-in default prompt texts from source code."""
    from pipeline.script import (
        _SCRIPT_SYSTEM_PROMPT_TEMPLATE,
        _SCRIPT_HUMANIZE_PROMPT,
        _TTS_ENHANCE_PROMPT,
    )
    from pipeline.metadata import METADATA_SYSTEM_PROMPT
    from pipeline.news_fetcher import _NARRATION_SYSTEM
    return {
        "script_system": _SCRIPT_SYSTEM_PROMPT_TEMPLATE,
        "script_humanize": _SCRIPT_HUMANIZE_PROMPT,
        "metadata_system": METADATA_SYSTEM_PROMPT,
        "tts_enhance": _TTS_ENHANCE_PROMPT,
        "bulletin_narration": _NARRATION_SYSTEM,
        "product_review_autofill": _PR_AUTOFILL_SYSTEM_PROMPT,
    }


@app.get("/api/voices")
def get_voices(provider: Optional[str] = None, api_key: Optional[str] = None):
    """Return available voices. Pass ?provider= and &api_key= to override saved config."""
    import requests as _requests
    from config import settings

    p = provider or settings.tts_provider

    if p == "openai":
        return {"voices": [
            {"id": "alloy", "name": "Alloy"},
            {"id": "ash", "name": "Ash"},
            {"id": "coral", "name": "Coral"},
            {"id": "echo", "name": "Echo"},
            {"id": "fable", "name": "Fable"},
            {"id": "nova", "name": "Nova"},
            {"id": "onyx", "name": "Onyx"},
            {"id": "sage", "name": "Sage"},
            {"id": "shimmer", "name": "Shimmer"},
        ]}

    if p == "elevenlabs":
        key = api_key or settings.elevenlabs_api_key
        if not key:
            raise HTTPException(status_code=400, detail="ELEVENLABS_API_KEY not set")
        try:
            resp = _requests.get(
                "https://api.elevenlabs.io/v1/voices",
                headers={"xi-api-key": key},
                timeout=15,
            )
            resp.raise_for_status()
            data = resp.json()
            voices = [{"id": v["voice_id"], "name": v["name"]} for v in data.get("voices", [])]
            return {"voices": voices}
        except Exception as e:
            raise HTTPException(status_code=502, detail=str(e))

    if p == "speshaudio":
        key = api_key or settings.speshaudio_api_key
        if not key:
            raise HTTPException(status_code=400, detail="SPESHAUDIO_API_KEY not set")
        try:
            resp = _requests.get(
                "https://speshaudio.com/api/v1/voices",
                headers={"Authorization": f"Bearer {key}"},
                timeout=15,
            )
            resp.raise_for_status()
            data = resp.json()
            raw = data.get("voices") or data.get("data") or []
            voices = [{"id": v.get("voice_id", v.get("id", "")), "name": v.get("name", "")} for v in raw]
            return {"voices": voices}
        except Exception as e:
            raise HTTPException(status_code=502, detail=str(e))

    return {"voices": []}


@app.get("/api/presets")
def get_presets():
    return _list_presets()


class PresetReq(BaseModel):
    name: str
    values: dict


@app.post("/api/presets")
def save_preset(body: PresetReq):
    name = body.name.strip()
    if not name:
        raise HTTPException(400, "Preset name required")
    PRESETS_DIR.mkdir(exist_ok=True)
    (PRESETS_DIR / f"{name}.json").write_text(json.dumps(body.values, indent=2))
    return {"ok": True, "name": name}


@app.delete("/api/presets/{name}")
def delete_preset(name: str):
    p = PRESETS_DIR / f"{name}.json"
    if p.exists():
        p.unlink()
    return {"ok": True}


# ── Bulletin: Sources CRUD ────────────────────────────────────────────────────

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


@app.get("/api/bulletin/history")
def get_bulletin_history():
    return _load_bulletin_history()


@app.delete("/api/bulletin/history/{preset_name}")
def clear_bulletin_history(preset_name: str):
    history = _load_bulletin_history()
    history.pop(preset_name, None)
    BULLETIN_HISTORY_FILE.write_text(json.dumps(history, ensure_ascii=False, indent=2), encoding="utf-8")
    return {"ok": True}


@app.get("/api/bulletin/sources")
def get_bulletin_sources():
    return _load_bulletin_sources()


class BulletinSourceReq(BaseModel):
    name: str
    url: str
    category: str = "Genel"
    language: str = "tr"
    enabled: bool = True


@app.post("/api/bulletin/sources")
def add_bulletin_source(body: BulletinSourceReq):
    import secrets as _secrets
    sources = _load_bulletin_sources()
    new_src = {
        "id": "src_" + _secrets.token_hex(4),
        "name": body.name.strip(),
        "url": body.url.strip(),
        "category": body.category.strip() or "Genel",
        "language": body.language.strip() or "tr",
        "enabled": body.enabled,
    }
    sources.append(new_src)
    _save_bulletin_sources(sources)
    return new_src


class BulletinSourcePatch(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    category: Optional[str] = None
    language: Optional[str] = None
    enabled: Optional[bool] = None


@app.patch("/api/bulletin/sources/{src_id}")
def update_bulletin_source(src_id: str, body: BulletinSourcePatch):
    sources = _load_bulletin_sources()
    for src in sources:
        if src["id"] == src_id:
            name = body.name
            url = body.url
            category = body.category
            language = body.language
            if name is not None:
                src["name"] = name.strip()
            if url is not None:
                src["url"] = url.strip()
            if category is not None:
                src["category"] = category.strip()
            if language is not None:
                src["language"] = language.strip()
            if body.enabled is not None:
                src["enabled"] = body.enabled
            _save_bulletin_sources(sources)
            return src
    raise HTTPException(404, "Source not found")


@app.delete("/api/bulletin/sources/{src_id}")
def delete_bulletin_source(src_id: str):
    sources = _load_bulletin_sources()
    new_sources = [s for s in sources if s["id"] != src_id]
    if len(new_sources) == len(sources):
        raise HTTPException(404, "Source not found")
    _save_bulletin_sources(new_sources)
    return {"ok": True}


# ── Bulletin: Draft ───────────────────────────────────────────────────────────

class BulletinDraftReq(BaseModel):
    max_items_per_source: int = 3
    language_override: str = ""
    source_ids: list[str] | None = None   # None = all enabled sources
    preset_name: str = ""                 # used to load history for dedup


@app.post("/api/bulletin/draft")
def create_bulletin_draft(body: BulletinDraftReq):
    from pipeline.news_fetcher import fetch_and_draft
    sources = _load_bulletin_sources()
    if not sources:
        raise HTTPException(400, "No sources configured")
    used_urls: set[str] = set()
    if body.preset_name:
        history = _load_bulletin_history()
        used_urls = set(history.get(body.preset_name, []))
    result = fetch_and_draft(
        sources,
        max_items_per_source=body.max_items_per_source,
        language_override=body.language_override,
        source_ids=body.source_ids,
        used_urls=used_urls if used_urls else None,
    )
    return result


# ── Bulletin: Render ──────────────────────────────────────────────────────────

_bulletin_jobs: dict[str, dict] = {}
_bulletin_jobs_lock = threading.Lock()


# Auto-map Turkish/English category names → Remotion style keys
_AUTO_STYLE_MAP: dict = {
    "spor": "sport", "sport": "sport",
    "finans": "finance", "finance": "finance", "ekonomi": "finance", "borsa": "finance",
    "teknoloji": "tech", "tech": "tech", "dijital": "tech",
    "bilim": "science", "science": "science", "sağlık": "science", "health": "science",
    "hava": "weather", "weather": "weather", "hava durumu": "weather",
    "eğlence": "entertainment", "entertainment": "entertainment", "magazin": "entertainment", "kültür": "entertainment",
    "gündem": "breaking", "breaking": "breaking", "son dakika": "breaking", "acil": "breaking",
    "dünya": "corporate", "corporate": "corporate", "politika": "corporate", "siyaset": "corporate",
    "genel": "breaking", "general": "breaking",
}


def _resolve_auto_style(cat: str, fallback: str = "breaking") -> str:
    """Return the Remotion style key that best matches a category name."""
    return _AUTO_STYLE_MAP.get((cat or "").lower().strip(), fallback)


class BulletinRenderReq(BaseModel):
    items: list  # list of DraftItem dicts (selected ones)
    network_name: str = "YTRobot Haber"
    style: str = "breaking"
    fps: int = 60
    format: str = "16:9"   # "16:9" or "9:16"
    ticker: list = []
    preset_name: str = ""       # used to record history after render
    category_templates: dict = {}  # {"spor": "sport", "finans": "finance", ...}
    render_mode: str = "combined"   # "combined" | "per_category" | "per_item"
    render_per_category: bool = False  # deprecated — maps to render_mode="per_category"
    show_category_flash: bool = False  # show 1.5s category label flash between items
    show_item_intro: bool = False     # show 2s branded intro before each item
    category_styles: dict = {}        # per-category style overrides from UI (per_category mode)
    item_styles: dict = {}            # per-item style overrides from UI, keyed by item URL/id
    text_delivery_mode: str = "per_scene"  # "per_scene" | "single_chunk" — narration split mode
    show_source: bool = True              # show source site name on items
    show_date: bool = True                # show published date on items
    # Design settings
    lower_third_enabled: bool = True
    lower_third_text: str = ""
    lower_third_font: str = "bebas"
    lower_third_color: str = "#ffffff"
    lower_third_size: int = 32
    ticker_enabled: bool = True
    ticker_speed: int = 3
    ticker_bg: str = "#000000"
    ticker_color: str = "#ffffff"
    show_live: bool = True


@app.post("/api/bulletin/render")
def start_bulletin_render(body: BulletinRenderReq):
    import secrets as _secrets
    from pipeline.news_bulletin import run_bulletin as render_bulletin

    bid = "bul_" + _secrets.token_hex(6)
    BULLETIN_DIR.mkdir(parents=True, exist_ok=True)
    output_path = BULLETIN_DIR / f"{bid}.mp4"

    import time as _time
    _stop_event = threading.Event()
    _pause_event = threading.Event()
    with _bulletin_jobs_lock:
        _bulletin_jobs[bid] = {
            "id": bid, "status": "running", "output": None, "error": None,
            "progress": 0, "step": "init", "step_label": "Başlatılıyor...",
            "started_at": _time.time(), "eta": None,
            "_stop": _stop_event, "_pause": _pause_event, "_pid": None,
        }

    def _on_progress(progress: int, step: str, step_label: str):
        import time as _t
        with _bulletin_jobs_lock:
            job = _bulletin_jobs.get(bid)
            if not job:
                return
            # Special signal: proc pid
            if progress == -1 and step == "_proc":
                try:
                    job["_pid"] = int(step_label)
                except Exception:
                    pass
                return
            job["progress"] = progress
            job["step"] = step
            job["step_label"] = step_label
            elapsed = _t.time() - job["started_at"]
            if progress > 2:
                job["eta"] = round(elapsed / progress * (100 - progress))
            else:
                job["eta"] = None

    def _build_news_items(item_list: list) -> list:
        """Convert DraftItem dicts to Remotion NewsItem dicts."""
        news_items = []
        for item in item_list:
            cat = (item.get("category") or "").lower().strip()
            item_key = item.get("url") or item.get("source_url") or item.get("id") or item.get("title") or ""
            # Style priority: item_styles[url] > item_styles[id] > category_styles[cat] > category_templates[cat] > auto-map(cat)
            style_override = (
                body.item_styles.get(item_key)
                or body.category_styles.get(cat)
                or (body.category_templates.get(cat) if body.category_templates else None)
                or _resolve_auto_style(cat, body.style)
            )
            news_item = {
                "headline": item.get("title", ""),
                "subtext": item.get("narration", item.get("summary", "")),
                "duration": body.fps * 8,  # 8 seconds per item
                "imageUrl": item.get("image_url", ""),
                "language": item.get("language", "tr"),
                "category": cat,
            }
            if style_override:
                news_item["styleOverride"] = style_override
            # Source URL → extract site name for display
            src_url = item.get("url") or item.get("source_url") or ""
            if src_url:
                news_item["sourceUrl"] = src_url
            # Published date
            pub_date = item.get("published") or item.get("published_date") or ""
            if pub_date:
                news_item["publishedDate"] = pub_date
            news_items.append(news_item)
        return news_items

    def _build_props(news_items: list, comp_style: str, ticker_items: list) -> dict:
        comp_id = "NewsBulletin9x16" if body.format == "9:16" else "NewsBulletin"
        return {
            "items": news_items,
            "ticker": ticker_items,
            "networkName": body.network_name,
            "style": comp_style,
            "fps": body.fps,
            "composition": comp_id,
            "lowerThirdEnabled": body.lower_third_enabled,
            "lowerThirdText": body.lower_third_text,
            "lowerThirdFont": body.lower_third_font,
            "lowerThirdColor": body.lower_third_color,
            "lowerThirdSize": body.lower_third_size,
            "tickerEnabled": body.ticker_enabled,
            "tickerSpeed": body.ticker_speed,
            "tickerBg": body.ticker_bg,
            "tickerColor": body.ticker_color,
            "showLive": body.show_live,
            "showCategoryFlash": body.show_category_flash,
            "showItemIntro": body.show_item_intro,
            "textDeliveryMode": body.text_delivery_mode,
            "showSource": body.show_source,
            "showDate": body.show_date,
        }

    def _make_ticker(item_list: list) -> list:
        """Build ticker items from a list of news items (or return body.ticker if provided)."""
        return body.ticker if body.ticker else [
            {"text": f"• {item.get('title', '')}"} for item in item_list[:8]
        ]

    def _do_render():
        try:
            raw_items: list = body.items

            # Resolve effective render mode (backward compat with old render_per_category)
            effective_mode = body.render_mode
            if body.render_per_category and effective_mode == "combined":
                effective_mode = "per_category"

            if effective_mode == "per_item":
                # ── Per-item mode: render one MP4 per news item ──────────────
                output_files = {}
                total_items = len(raw_items)

                for i, item in enumerate(raw_items):
                    cat = (item.get("category") or "").lower().strip()
                    item_key = item.get("url") or item.get("source_url") or item.get("id") or item.get("title") or ""
                    item_style = (
                        body.item_styles.get(item_key)
                        or body.category_styles.get(cat)
                        or (body.category_templates.get(cat) if body.category_templates else None)
                        or _resolve_auto_style(cat, body.style)
                    )
                    item_label = f"item_{i:02d}"
                    item_output = BULLETIN_DIR / f"{bid}_{item_label}.mp4"

                    prog_start = 5 + int(i / total_items * 90)
                    prog_end = 5 + int((i + 1) / total_items * 90)

                    def _item_progress(progress: int, step: str, step_label: str, _ps=prog_start, _pe=prog_end, _lbl=item_label):
                        mapped = _ps + int(progress / 100 * (_pe - _ps))
                        _on_progress(mapped, step, f"[{_lbl}] {step_label}")

                    news_items = _build_news_items([item])
                    # Per-item mode: no ticker (single news item per video)
                    props = _build_props(news_items, item_style, [])

                    render_bulletin(
                        bulletin_config=props,
                        output_path=item_output,
                        fps=body.fps,
                        category_templates=body.category_templates,
                        on_progress=_item_progress,
                        stop_event=_stop_event,
                        pause_event=_pause_event,
                    )
                    output_files[item_label] = str(item_output)

                # Save history
                if body.preset_name:
                    urls = [item.get("source_url", "") for item in raw_items if item.get("source_url")]
                    if urls:
                        _append_bulletin_history(body.preset_name, urls)

                with _bulletin_jobs_lock:
                    _bulletin_jobs[bid]["status"] = "completed"
                    _bulletin_jobs[bid]["output"] = str(output_path)
                    _bulletin_jobs[bid]["outputs"] = output_files

            elif effective_mode == "per_category":
                # ── Per-category mode: render one MP4 per category ──────────
                from collections import defaultdict
                category_groups: dict = defaultdict(list)
                uncategorised = []
                for item in raw_items:
                    cat = (item.get("category") or "").lower().strip()
                    if cat:
                        category_groups[cat].append(item)
                    else:
                        uncategorised.append(item)

                # Items without a mapped category go into a combined fallback render
                if uncategorised:
                    category_groups["__other__"] = uncategorised

                cats = list(category_groups.keys())
                total_cats = len(cats)
                output_files = {}

                for i, cat in enumerate(cats):
                    cat_items = category_groups[cat]
                    cat_style = (
                        body.category_styles.get(cat)
                        or (body.category_templates.get(cat) if body.category_templates else None)
                        or (_resolve_auto_style(cat, body.style) if cat != "__other__" else body.style)
                    )
                    cat_label = cat if cat != "__other__" else "diger"
                    cat_output = BULLETIN_DIR / f"{bid}_{cat_label}.mp4"

                    prog_start = 5 + int(i / total_cats * 90)
                    prog_end = 5 + int((i + 1) / total_cats * 90)

                    def _cat_progress(progress: int, step: str, step_label: str, _ps=prog_start, _pe=prog_end, _cat=cat_label):
                        mapped = _ps + int(progress / 100 * (_pe - _ps))
                        _on_progress(mapped, step, f"[{_cat.upper()}] {step_label}")

                    news_items = _build_news_items(cat_items)
                    # Per-category mode: ticker only uses headlines from this category
                    cat_ticker = _make_ticker(cat_items)
                    props = _build_props(news_items, cat_style, cat_ticker)

                    render_bulletin(
                        bulletin_config=props,
                        output_path=cat_output,
                        fps=body.fps,
                        category_templates=body.category_templates,
                        on_progress=_cat_progress,
                        stop_event=_stop_event,
                        pause_event=_pause_event,
                    )
                    output_files[cat_label] = str(cat_output)

                # Save history
                if body.preset_name:
                    urls = [item.get("source_url", "") for item in raw_items if item.get("source_url")]
                    if urls:
                        _append_bulletin_history(body.preset_name, urls)

                with _bulletin_jobs_lock:
                    _bulletin_jobs[bid]["status"] = "completed"
                    _bulletin_jobs[bid]["output"] = str(output_path)
                    _bulletin_jobs[bid]["outputs"] = output_files

            else:
                # ── Single combined render (default) ─────────────────────────
                news_items = _build_news_items(raw_items)
                props = _build_props(news_items, body.style, _make_ticker(raw_items))

                render_bulletin(
                    bulletin_config=props,
                    output_path=output_path,
                    fps=body.fps,
                    category_templates=body.category_templates,
                    on_progress=_on_progress,
                    stop_event=_stop_event,
                    pause_event=_pause_event,
                )

                # Save used URLs to history for deduplication
                if body.preset_name:
                    urls = [item.get("source_url", "") for item in raw_items if item.get("source_url")]
                    if urls:
                        _append_bulletin_history(body.preset_name, urls)

                with _bulletin_jobs_lock:
                    _bulletin_jobs[bid]["status"] = "completed"
                    _bulletin_jobs[bid]["output"] = str(output_path)

        except InterruptedError:
            with _bulletin_jobs_lock:
                _bulletin_jobs[bid]["status"] = "cancelled"
                _bulletin_jobs[bid]["step_label"] = "Durduruldu"
        except Exception as exc:
            with _bulletin_jobs_lock:
                _bulletin_jobs[bid]["status"] = "failed"
                _bulletin_jobs[bid]["error"] = str(exc)

    threading.Thread(target=_do_render, daemon=True).start()
    return {"bulletin_id": bid}


@app.post("/api/bulletin/render/{bid}/stop")
def stop_bulletin_render(bid: str):
    with _bulletin_jobs_lock:
        job = _bulletin_jobs.get(bid)
    if not job:
        raise HTTPException(404, "Job not found")
    if job.get("status") != "running":
        raise HTTPException(400, "Job is not running")
    job["_stop"].set()
    job["_pause"].clear()   # resume if paused so stop check is reached
    return {"ok": True}


@app.post("/api/bulletin/render/{bid}/pause")
def pause_bulletin_render(bid: str):
    with _bulletin_jobs_lock:
        job = _bulletin_jobs.get(bid)
    if not job:
        raise HTTPException(404, "Job not found")
    if job.get("status") != "running":
        raise HTTPException(400, "Job is not running")
    job["_pause"].set()
    job["paused"] = True
    job["step_label"] = (job.get("step_label") or "") + " ⏸"
    return {"ok": True}


@app.post("/api/bulletin/render/{bid}/resume")
def resume_bulletin_render(bid: str):
    with _bulletin_jobs_lock:
        job = _bulletin_jobs.get(bid)
    if not job:
        raise HTTPException(404, "Job not found")
    job["_pause"].clear()
    job["paused"] = False
    return {"ok": True}


@app.get("/api/bulletin/render/{bid}")
def get_bulletin_render_status(bid: str):
    import time as _t
    with _bulletin_jobs_lock:
        job = _bulletin_jobs.get(bid)
    if job is None:
        raise HTTPException(404, "Bulletin job not found")
    # Return a clean copy — strip internal threading objects
    result = {k: v for k, v in job.items() if not k.startswith("_")}
    started = job.get("started_at")
    result["elapsed"] = round(_t.time() - started) if started else 0
    result.setdefault("paused", False)
    return result


@app.get("/api/bulletin/download/{bid}")
def download_bulletin(bid: str):
    from fastapi.responses import FileResponse
    output_path = BULLETIN_DIR / f"{bid}.mp4"
    if not output_path.exists():
        raise HTTPException(404, "Output file not found")
    return FileResponse(str(output_path), media_type="video/mp4", filename=f"{bid}.mp4")


@app.get("/api/bulletin/download/{bid}/{category}")
def download_bulletin_category(bid: str, category: str):
    from fastapi.responses import FileResponse
    output_path = BULLETIN_DIR / f"{bid}_{category}.mp4"
    if not output_path.exists():
        raise HTTPException(404, "Output file not found")
    return FileResponse(str(output_path), media_type="video/mp4", filename=f"{bid}_{category}.mp4")


@app.get("/api/sessions/{sid}/logs")
async def stream_logs(sid: str):
    log_path = _log_file(sid)

    async def generate():
        position = 0
        waited = 0.0
        while not log_path.exists() and waited < 30:
            await asyncio.sleep(0.3)
            waited += 0.3
        while True:
            try:
                s = _read_session(sid)
            except Exception:
                break
            if log_path.exists():
                text = log_path.read_text(encoding="utf-8", errors="replace")
                if len(text) > position:
                    new_text = text[position:]
                    position = len(text)
                    for line in new_text.splitlines():
                        yield f"data: {json.dumps(line)}\n\n"
            if s["status"] in ("completed", "failed", "stopped"):
                yield f"data: {json.dumps('__DONE__')}\n\n"
                break
            await asyncio.sleep(0.5)

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ── Product Review / Affiliate Video ─────────────────────────────────────────

PRODUCT_REVIEW_DIR = Path("output/product_reviews")

# Built-in system prompt used for autofill — exposed via /api/prompts/defaults
# so the UI can show it alongside the user-editable master prompt field.
_PR_AUTOFILL_SYSTEM_PROMPT = """\
You are a product data extractor. Given a product page URL and its text content, \
extract structured product information and return ONLY valid JSON matching the schema below. \
All text fields should be in the requested language.

Schema:
{
  "name": "Product display name",
  "price": 0,
  "originalPrice": 0,
  "currency": "TL",
  "rating": 4.5,
  "reviewCount": 0,
  "imageUrl": "https://...",
  "galleryUrls": ["https://...", "https://..."],
  "category": "",
  "platform": "",
  "pros": ["advantage 1", "advantage 2", "advantage 3"],
  "cons": ["disadvantage 1", "disadvantage 2"],
  "score": 7.5,
  "verdict": "Compelling one-sentence final verdict.",
  "ctaText": "Linke tıkla!",
  "topComments": ["user comment 1", "user comment 2", "user comment 3"]
}

Rules:
- pros: 3-5 key advantages, each max 12 words — focus on what buyers love most
- cons: 2-4 disadvantages, each max 12 words — be honest, this builds trust
- score: overall value-for-money score 1-10 based on rating, review count, price/quality ratio
- verdict: compelling 1-2 sentence final verdict — include the product name
- currency: detect from page (TL, $, €, £ — default TL)
- imageUrl: extract the main product image URL from the page if available (must be absolute https URL)
- galleryUrls: up to 3 additional product image URLs if available (absolute https URLs)
- topComments: 3-5 representative user review snippets (short, 5-15 words each)
- platform: detect marketplace (trendyol, amazon, hepsiburada, n11, etc.)
- Return ONLY the JSON object, no explanation, no markdown fences.\
"""

_product_review_jobs: dict = {}
_product_review_jobs_lock = threading.Lock()


class ProductReviewRenderReq(BaseModel):
    product: dict
    style: str = "modern"
    fps: int = 60
    format: str = "16:9"
    channel_name: str = "YTRobot"
    auto_generate_tts: bool = True
    lang: str = "tr"


@app.post("/api/product-review/render")
def start_product_review_render(body: ProductReviewRenderReq):
    import secrets as _secrets
    import time as _time

    rid = "pr_" + _secrets.token_hex(6)
    PRODUCT_REVIEW_DIR.mkdir(parents=True, exist_ok=True)
    output_path = PRODUCT_REVIEW_DIR / f"{rid}.mp4"

    _stop_event = threading.Event()
    with _product_review_jobs_lock:
        _product_review_jobs[rid] = {
            "id": rid, "status": "running", "output": None, "error": None,
            "progress": 0, "step": "init", "step_label": "Başlatılıyor...",
            "started_at": _time.time(), "eta": None,
            "_stop": _stop_event, "_pid": None,
        }

    def _on_progress(progress: int, step: str, step_label: str):
        import time as _t
        with _product_review_jobs_lock:
            job = _product_review_jobs.get(rid)
            if not job:
                return
            if progress == -1 and step == "_proc":
                try:
                    job["_pid"] = int(step_label)
                except Exception:
                    pass
                return
            job["progress"] = progress
            job["step"] = step
            job["step_label"] = step_label
            elapsed = _t.time() - job["started_at"]
            if progress > 2:
                job["eta"] = round(elapsed / progress * (100 - progress))

    def _do_render():
        try:
            import re as _re

            # Auto-generate TTS if enabled and audio URL is missing
            if body.auto_generate_tts and not body.product.get("audioUrl"):
                _on_progress(5, "tts", "Otomatik TTS oluşturuluyor...")
                try:
                    from config import settings as cfg
                    import time as _time
                    from pipeline.tts import _load_provider as _tts_load
                    from providers.tts.base import clean_for_tts

                    # Build narration (same logic as /api/product-review/tts)
                    p = body.product
                    lang_note = "Türkçe" if body.lang == "tr" else "English"

                    name = p.get("name", "Bu ürün")
                    price = p.get("price", 0)
                    original_price = p.get("originalPrice", 0)
                    currency = p.get("currency", "TL")
                    rating = p.get("rating", 0)
                    review_count = p.get("reviewCount", 0)
                    score = p.get("score", 7)
                    verdict = p.get("verdict", "")
                    pros = p.get("pros", [])
                    cons = p.get("cons", [])
                    cta = p.get("ctaText", "Linke tıkla!")

                    if body.lang == "tr":
                        discount_line = ""
                        if original_price and original_price > price:
                            discount_pct = round((original_price - price) / original_price * 100)
                            discount_line = f" Normalde {original_price} {currency} olan bu ürün şu an {price} {currency}'ye satılıyor, yüzde {discount_pct} indirimle."
                        else:
                            discount_line = f" Fiyatı {price} {currency}."

                        pros_text = " ".join([f"{i+1}. {pro}." for i, pro in enumerate(pros[:4])])
                        cons_text = " ".join([f"{i+1}. {con}." for i, con in enumerate(cons[:3])])

                        narration = (
                            f"Merhaba! Bugün {name} inceliyoruz.{discount_line} "
                            f"{review_count} yorum ve {rating} üzerinden {rating} yıldız aldı. "
                            f"Artıları: {pros_text} "
                            f"Eksileri: {cons_text} "
                            f"Genel puanımız: 10 üzerinden {score}. "
                            f"{verdict} "
                            f"{cta}"
                        )
                    else:
                        discount_line = ""
                        if original_price and original_price > price:
                            discount_pct = round((original_price - price) / original_price * 100)
                            discount_line = f" Originally {original_price} {currency}, now {price} {currency} — {discount_pct}% off."
                        else:
                            discount_line = f" Priced at {price} {currency}."

                        pros_text = " ".join([f"{i+1}. {pro}." for i, pro in enumerate(pros[:4])])
                        cons_text = " ".join([f"{i+1}. {con}." for i, con in enumerate(cons[:3])])

                        narration = (
                            f"Hey! Today we're reviewing the {name}.{discount_line} "
                            f"It has {review_count} reviews and a {rating} star rating. "
                            f"Pros: {pros_text} "
                            f"Cons: {cons_text} "
                            f"Our overall score: {score} out of 10. "
                            f"{verdict} "
                            f"{cta}"
                        )

                    # Generate audio
                    audio_filename = f"pr_tts_{int(_time.time()*1000)}.mp3"
                    audio_path = PRODUCT_REVIEW_DIR / audio_filename

                    # Load PR-specific TTS settings
                    pr_tts_provider = os.environ.get("PR_TTS_PROVIDER") or getattr(cfg, "pr_tts_provider", "")
                    pr_tts_speed = float(os.environ.get("PR_TTS_SPEED", 0) or getattr(cfg, "pr_tts_speed", 0))
                    pr_tts_language = os.environ.get("PR_TTS_LANGUAGE") or getattr(cfg, "pr_tts_language", "")
                    pr_tts_stability = float(os.environ.get("PR_TTS_STABILITY", -1) or -1)
                    pr_tts_similarity = float(os.environ.get("PR_TTS_SIMILARITY", -1) or -1)
                    pr_tts_style = float(os.environ.get("PR_TTS_STYLE", -1) or -1)
                    pr_openai_voice = os.environ.get("PR_OPENAI_TTS_VOICE") or getattr(cfg, "pr_openai_tts_voice", "")

                    # Patch settings temporarily
                    _orig = {}
                    def _patch(key, val):
                        if val:
                            _orig[key] = getattr(cfg, key, None)
                            object.__setattr__(cfg, key, val)

                    if pr_tts_speed > 0: _patch("tts_speed", pr_tts_speed)
                    if pr_tts_language: _patch("speshaudio_language", pr_tts_language)
                    if pr_tts_stability >= 0: _patch("speshaudio_stability", pr_tts_stability)
                    if pr_tts_similarity >= 0: _patch("speshaudio_similarity_boost", pr_tts_similarity)
                    if pr_tts_style >= 0: _patch("speshaudio_style", pr_tts_style)
                    if pr_openai_voice: _patch("openai_tts_voice", pr_openai_voice)

                    try:
                        provider = _tts_load(pr_tts_provider if pr_tts_provider else None)
                        cleaned = clean_for_tts(narration, remove_apostrophes=cfg.tts_remove_apostrophes)
                        provider.synthesize(cleaned, audio_path)
                        # Update product dict with generated audio URL
                        body.product["audioUrl"] = f"/api/product-review/audio/{audio_filename}"
                    finally:
                        for k, v in _orig.items():
                            object.__setattr__(cfg, k, v)

                except Exception as e:
                    print(f"[WARN] Auto-TTS generation failed: {e}")
                    # Continue with render even if TTS fails

            comp_id = "ProductReview9x16" if body.format == "9:16" else "ProductReview"

            props = {
                "product": body.product,
                "style": body.style,
                "fps": body.fps,
                "channelName": body.channel_name,
            }

            _on_progress(10, "render", "Remotion render başlıyor...")

            remotion_dir = Path(__file__).parent / "remotion"
            from config import settings
            raw_out = output_path.parent / (output_path.stem + "_raw" + output_path.suffix)
            cmd = [
                "npx", "remotion", "render", comp_id,
                str(raw_out.resolve()),
                f"--props={json.dumps(props)}",
                f"--concurrency={settings.remotion_concurrency}",
            ]

            proc = subprocess.Popen(cmd, cwd=str(remotion_dir), stdout=subprocess.PIPE,
                                    stderr=subprocess.STDOUT, text=True, bufsize=1)
            try:
                _on_progress(-1, "_proc", str(proc.pid))
            except Exception:
                pass

            _last_pct = 10
            for line in proc.stdout:
                print(line, end="")
                m = _re.search(r"(\d+)\s*%", line)
                if m:
                    frame_pct = int(m.group(1))
                    overall = 10 + int(frame_pct * 0.78)
                    if overall > _last_pct:
                        _last_pct = overall
                        _on_progress(overall, "remotion", f"Video render: {frame_pct}%")
                if _stop_event and _stop_event.is_set():
                    proc.terminate()
                    proc.wait()
                    raise InterruptedError("Render durduruldu.")
            proc.wait()
            if proc.returncode != 0:
                raise RuntimeError(f"Remotion render failed (exit code {proc.returncode})")

            # Post-process: fix color metadata for QuickTime compatibility
            _on_progress(90, "ffmpeg", "Renk dönüşümü yapılıyor...")
            fix_cmd = [
                "ffmpeg", "-i", str(raw_out.resolve()),
                "-c:v", "libx264", "-crf", "18", "-preset", "fast",
                "-vf", "colorspace=bt709:iall=bt470bg:fast=1,format=yuv420p",
                "-color_range", "tv",
                "-colorspace", "bt709",
                "-color_trc", "bt709",
                "-color_primaries", "bt709",
                "-c:a", "copy",
                str(output_path.resolve()),
                "-y",
            ]
            fix_result = subprocess.run(fix_cmd, capture_output=True, text=True)
            raw_out.unlink(missing_ok=True)
            if fix_result.returncode != 0:
                print(f"  [warn] color fix failed: {fix_result.stderr[-200:]}")
                if raw_out.exists():
                    raw_out.rename(output_path)

            with _product_review_jobs_lock:
                _product_review_jobs[rid]["status"] = "completed"
                _product_review_jobs[rid]["output"] = str(output_path)
                _product_review_jobs[rid]["progress"] = 100
                _product_review_jobs[rid]["step_label"] = "Tamamlandı"

        except Exception as exc:
            import traceback; traceback.print_exc()
            with _product_review_jobs_lock:
                _product_review_jobs[rid]["status"] = "failed"
                _product_review_jobs[rid]["error"] = str(exc)
                _product_review_jobs[rid]["step_label"] = f"Hata: {exc}"

    threading.Thread(target=_do_render, daemon=True).start()
    return {"id": rid, "status": "running"}


@app.get("/api/product-review/status/{rid}")
def product_review_status(rid: str):
    with _product_review_jobs_lock:
        job = _product_review_jobs.get(rid)
    if not job:
        raise HTTPException(404, "Job not found")
    return {k: v for k, v in job.items() if not k.startswith("_")}


class ProductReviewAutofillReq(BaseModel):
    url: str
    lang: str = "tr"
    master_prompt: str = ""


@app.post("/api/product-review/autofill")
def product_review_autofill(body: ProductReviewAutofillReq):
    """Use kie.ai (Gemini 2.5 Flash) to scrape product URL and return structured prForm data."""
    import urllib.request as _req
    import re as _re
    import json as _json

    try:
        from config import settings as cfg
    except Exception:
        raise HTTPException(500, "Config not available")

    # Fetch the page HTML (best-effort)
    page_html = ""
    try:
        req = _req.Request(
            body.url,
            headers={"User-Agent": "Mozilla/5.0 (compatible; YTRobotBot/1.0)"},
        )
        with _req.urlopen(req, timeout=15) as resp:
            raw = resp.read(120_000)  # first 120 KB
            page_html = raw.decode("utf-8", errors="replace")
    except Exception as e:
        page_html = f"(Page could not be fetched: {e})"

    # Trim HTML to keep only visible text (strip tags)
    text_content = _re.sub(r"<[^>]+>", " ", page_html)
    text_content = _re.sub(r"\s+", " ", text_content).strip()[:8000]

    language_note = "Türkçe" if body.lang == "tr" else "English"
    custom_prompt_block = (
        f"\nCustom instructions: {body.master_prompt}\n" if body.master_prompt.strip() else ""
    )

    # Build system prompt from the built-in template, injecting language + custom instructions
    system_prompt = (
        _PR_AUTOFILL_SYSTEM_PROMPT
        .replace("the requested language", language_note)
        + f"\nOutput language: {language_note}."
        + custom_prompt_block
    )

    user_msg = f"URL: {body.url}\n\nPage content:\n{text_content}"

    result_json = None

    # 1. Try kie.ai (Gemini 2.5 Flash via OpenAI-compat API) — primary
    kieai_key = os.environ.get("KIEAI_API_KEY") or getattr(cfg, "kieai_api_key", "")
    if kieai_key:
        try:
            from openai import OpenAI as _OpenAI
            client = _OpenAI(api_key=kieai_key, base_url="https://api.kie.ai/gemini-2.5-flash/v1")
            resp = client.chat.completions.create(
                model="gemini-2.5-flash",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_msg},
                ],
                temperature=0.3,
            )
            raw_text = resp.choices[0].message.content.strip()
            # Strip markdown fences if model wrapped the output
            raw_text = _re.sub(r"^```(?:json)?\s*", "", raw_text)
            raw_text = _re.sub(r"\s*```$", "", raw_text)
            result_json = _json.loads(raw_text)
        except Exception as e:
            print(f"  [product-review/autofill] kie.ai failed: {e}")
            result_json = None

    # 2. Fallback: Gemini direct API
    if result_json is None:
        gemini_key = os.environ.get("GEMINI_API_KEY") or getattr(cfg, "gemini_api_key", "")
        if gemini_key:
            try:
                gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={gemini_key}"
                payload = {
                    "contents": [{"parts": [{"text": system_prompt + "\n\n" + user_msg}]}],
                    "generationConfig": {"responseMimeType": "application/json", "temperature": 0.3},
                }
                req2 = _req.Request(gemini_url, data=_json.dumps(payload).encode(),
                                    headers={"Content-Type": "application/json"}, method="POST")
                with _req.urlopen(req2, timeout=30) as resp2:
                    gemini_resp = _json.loads(resp2.read())
                text_out = gemini_resp["candidates"][0]["content"]["parts"][0]["text"]
                result_json = _json.loads(text_out)
            except Exception as e:
                print(f"  [product-review/autofill] Gemini direct failed: {e}")
                result_json = None

    # 3. Fallback: OpenAI
    if result_json is None:
        openai_key = os.environ.get("OPENAI_API_KEY") or getattr(cfg, "openai_api_key", "")
        if openai_key:
            try:
                oai_payload = {
                    "model": "gpt-4o-mini",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_msg},
                    ],
                    "response_format": {"type": "json_object"},
                    "temperature": 0.3,
                }
                req3 = _req.Request(
                    "https://api.openai.com/v1/chat/completions",
                    data=_json.dumps(oai_payload).encode(),
                    headers={"Content-Type": "application/json", "Authorization": f"Bearer {openai_key}"},
                    method="POST",
                )
                with _req.urlopen(req3, timeout=30) as resp3:
                    oai_resp = _json.loads(resp3.read())
                result_json = _json.loads(oai_resp["choices"][0]["message"]["content"])
            except Exception as e:
                print(f"  [product-review/autofill] OpenAI fallback failed: {e}")
                result_json = None

    if result_json is None:
        raise HTTPException(500, "AI provider unavailable — set KIEAI_API_KEY, GEMINI_API_KEY or OPENAI_API_KEY in Settings")

    # Ensure all required fields are present
    result_json.setdefault("name", "")
    result_json.setdefault("price", 0)
    result_json.setdefault("originalPrice", 0)
    result_json.setdefault("currency", "TL")
    result_json.setdefault("rating", 0)
    result_json.setdefault("reviewCount", 0)
    result_json.setdefault("imageUrl", "")
    result_json.setdefault("galleryUrls", [])
    result_json.setdefault("category", "")
    result_json.setdefault("platform", "")
    result_json.setdefault("pros", [])
    result_json.setdefault("cons", [])
    result_json.setdefault("score", 7)
    result_json.setdefault("verdict", "")
    result_json.setdefault("ctaText", "Linke tıkla!" if body.lang == "tr" else "Check it out!")
    result_json.setdefault("topComments", [])
    return result_json


class ProductReviewTTSReq(BaseModel):
    product: dict
    lang: str = "tr"


@app.post("/api/product-review/tts")
def product_review_tts(body: ProductReviewTTSReq):
    """Generate TTS narration for a product review and return an audio URL served via /api/product-review/audio/{filename}."""
    import time as _time

    try:
        from config import settings as cfg
    except Exception:
        raise HTTPException(500, "Config not available")

    p = body.product
    lang_note = "Türkçe" if body.lang == "tr" else "English"

    # Build narration text from product fields
    name = p.get("name", "Bu ürün")
    price = p.get("price", 0)
    original_price = p.get("originalPrice", 0)
    currency = p.get("currency", "TL")
    rating = p.get("rating", 0)
    review_count = p.get("reviewCount", 0)
    score = p.get("score", 7)
    verdict = p.get("verdict", "")
    pros = p.get("pros", [])
    cons = p.get("cons", [])
    cta = p.get("ctaText", "Linke tıkla!")

    if body.lang == "tr":
        discount_line = ""
        if original_price and original_price > price:
            discount_pct = round((original_price - price) / original_price * 100)
            discount_line = f" Normalde {original_price} {currency} olan bu ürün şu an {price} {currency}'ye satılıyor, yüzde {discount_pct} indirimle."
        else:
            discount_line = f" Fiyatı {price} {currency}."

        pros_text = " ".join([f"{i+1}. {pro}." for i, pro in enumerate(pros[:4])])
        cons_text = " ".join([f"{i+1}. {con}." for i, con in enumerate(cons[:3])])

        narration = (
            f"Merhaba! Bugün {name} inceliyoruz.{discount_line} "
            f"{review_count} yorum ve {rating} üzerinden {rating} yıldız aldı. "
            f"Artıları: {pros_text} "
            f"Eksileri: {cons_text} "
            f"Genel puanımız: 10 üzerinden {score}. "
            f"{verdict} "
            f"{cta}"
        )
    else:
        discount_line = ""
        if original_price and original_price > price:
            discount_pct = round((original_price - price) / original_price * 100)
            discount_line = f" Originally {original_price} {currency}, now {price} {currency} — {discount_pct}% off."
        else:
            discount_line = f" Priced at {price} {currency}."

        pros_text = " ".join([f"{i+1}. {pro}." for i, pro in enumerate(pros[:4])])
        cons_text = " ".join([f"{i+1}. {con}." for i, con in enumerate(cons[:3])])

        narration = (
            f"Hey! Today we're reviewing the {name}.{discount_line} "
            f"It has {review_count} reviews and a {rating} star rating. "
            f"Pros: {pros_text} "
            f"Cons: {cons_text} "
            f"Our overall score: {score} out of 10. "
            f"{verdict} "
            f"{cta}"
        )

    # Generate audio using the configured TTS provider (PR-specific or global)
    PRODUCT_REVIEW_DIR.mkdir(parents=True, exist_ok=True)
    audio_filename = f"pr_tts_{int(_time.time()*1000)}.mp3"
    audio_path = PRODUCT_REVIEW_DIR / audio_filename

    try:
        from pipeline.tts import _load_provider as _tts_load
        from providers.tts.base import clean_for_tts

        # PR-specific overrides read from .env (saved by UI settings)
        pr_tts_provider   = os.environ.get("PR_TTS_PROVIDER")   or getattr(cfg, "pr_tts_provider", "")
        pr_tts_voice_id   = os.environ.get("PR_TTS_VOICE_ID")   or getattr(cfg, "pr_tts_voice_id", "")
        pr_tts_speed      = float(os.environ.get("PR_TTS_SPEED", 0) or getattr(cfg, "pr_tts_speed", 0))
        pr_tts_language   = os.environ.get("PR_TTS_LANGUAGE")   or getattr(cfg, "pr_tts_language", "")
        pr_tts_stability  = float(os.environ.get("PR_TTS_STABILITY", -1) or -1)
        pr_tts_similarity = float(os.environ.get("PR_TTS_SIMILARITY", -1) or -1)
        pr_tts_style      = float(os.environ.get("PR_TTS_STYLE", -1) or -1)
        pr_openai_voice   = os.environ.get("PR_OPENAI_TTS_VOICE") or getattr(cfg, "pr_openai_tts_voice", "")

        # Temporarily patch settings so the provider picks up PR-specific values
        _orig = {}
        def _patch(key, val):
            if val:
                _orig[key] = getattr(cfg, key, None)
                object.__setattr__(cfg, key, val)

        if pr_tts_voice_id:  _patch("speshaudio_voice_id", pr_tts_voice_id); _patch("elevenlabs_voice_id", pr_tts_voice_id)
        if pr_tts_speed > 0: _patch("tts_speed", pr_tts_speed)
        if pr_tts_language:  _patch("speshaudio_language", pr_tts_language)
        if pr_tts_stability  >= 0: _patch("speshaudio_stability",  pr_tts_stability)
        if pr_tts_similarity >= 0: _patch("speshaudio_similarity_boost", pr_tts_similarity)
        if pr_tts_style      >= 0: _patch("speshaudio_style", pr_tts_style)
        if pr_openai_voice:  _patch("openai_tts_voice", pr_openai_voice)

        try:
            provider = _tts_load(pr_tts_provider if pr_tts_provider else None)
            cleaned = clean_for_tts(narration, remove_apostrophes=cfg.tts_remove_apostrophes)
            provider.synthesize(cleaned, audio_path)
        finally:
            # Restore original settings values
            for k, v in _orig.items():
                object.__setattr__(cfg, k, v)
    except Exception as e:
        raise HTTPException(500, f"TTS synthesis failed: {e}")

    return {"audioUrl": f"/api/product-review/audio/{audio_filename}", "narration": narration}


@app.get("/api/product-review/audio/{filename}")
def product_review_audio(filename: str):
    """Serve a generated TTS audio file."""
    path = PRODUCT_REVIEW_DIR / filename
    if not path.exists() or not path.name.endswith(".mp3"):
        raise HTTPException(404, "Audio file not found")
    from fastapi.responses import FileResponse
    return FileResponse(str(path), media_type="audio/mpeg", filename=filename)


@app.get("/api/product-review/download/{rid}")
def product_review_download(rid: str):
    with _product_review_jobs_lock:
        job = _product_review_jobs.get(rid)
    if not job or not job.get("output"):
        raise HTTPException(404, "Output not found")
    out = Path(job["output"])
    if not out.exists():
        raise HTTPException(404, "File not found")
    from fastapi.responses import FileResponse
    return FileResponse(str(out), media_type="video/mp4", filename=out.name)



# ── Social Media Metadata ──────────────────────────────────────────────────────

class SocialMetaReq(BaseModel):
    module: str = "yt_video"      # yt_video | bulletin | product_review
    context: dict = {}             # free-form: title, script, product_name, etc.
    fields: list = ["title", "description", "tags"]
    master_prompt: str = ""
    lang: str = "tr"


@app.post("/api/social-meta/generate")
def generate_social_meta(body: SocialMetaReq):
    import re as _re
    import json as _json
    import urllib.request as _req

    cfg = Settings()
    fields_str = ", ".join(body.fields)
    context_str = "\n".join(f"{k}: {v}" for k, v in body.context.items() if v)
    lang_note = "Turkish" if body.lang == "tr" else "English"

    base_prompt = (
        f"You are a social media content expert. Given the video context below, "
        f"generate social media metadata in {lang_note}.\n"
        f"Return ONLY a valid JSON object with these fields: {fields_str}.\n"
        f"Rules:\n"
        f"- title: catchy, max 100 chars\n"
        f"- description: 2-3 paragraphs with relevant info and call-to-action\n"
        f"- tags: array of 15-20 relevant hashtags/keywords (without #)\n"
        f"- source: original source name if applicable\n"
        f"- link: URL if applicable\n"
        f"Return ONLY the JSON, no markdown fences."
    )

    custom_block = f"\n\nAdditional instructions:\n{body.master_prompt.strip()}" if body.master_prompt.strip() else ""
    system_prompt = base_prompt + custom_block
    user_msg = f"Video context:\n{context_str}"

    result_json = None

    # 1. kie.ai primary
    kieai_key = os.environ.get("KIEAI_API_KEY") or getattr(cfg, "kieai_api_key", "")
    if kieai_key:
        try:
            from openai import OpenAI as _OpenAI
            client = _OpenAI(api_key=kieai_key, base_url="https://api.kie.ai/gemini-2.5-flash/v1")
            resp = client.chat.completions.create(
                model="gemini-2.5-flash",
                messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": user_msg}],
                temperature=0.4,
            )
            raw = resp.choices[0].message.content.strip()
            raw = _re.sub(r"^```(?:json)?\s*", "", raw)
            raw = _re.sub(r"\s*```$", "", raw)
            result_json = _json.loads(raw)
        except Exception as e:
            print(f"  [social-meta] kie.ai failed: {e}")

    # 2. Gemini direct fallback
    if result_json is None:
        gemini_key = os.environ.get("GEMINI_API_KEY") or getattr(cfg, "gemini_api_key", "")
        if gemini_key:
            try:
                gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={gemini_key}"
                payload = {
                    "contents": [{"parts": [{"text": system_prompt + "\n\n" + user_msg}]}],
                    "generationConfig": {"responseMimeType": "application/json", "temperature": 0.4},
                }
                req2 = _req.Request(gemini_url, data=_json.dumps(payload).encode(),
                                    headers={"Content-Type": "application/json"}, method="POST")
                with _req.urlopen(req2, timeout=30) as resp2:
                    gemini_resp = _json.loads(resp2.read())
                text_out = gemini_resp["candidates"][0]["content"]["parts"][0]["text"]
                result_json = _json.loads(text_out)
            except Exception as e:
                print(f"  [social-meta] Gemini direct failed: {e}")

    # 3. OpenAI fallback
    if result_json is None:
        openai_key = os.environ.get("OPENAI_API_KEY") or getattr(cfg, "openai_api_key", "")
        if openai_key:
            try:
                oai_payload = {
                    "model": "gpt-4o-mini",
                    "messages": [{"role": "system", "content": system_prompt}, {"role": "user", "content": user_msg}],
                    "response_format": {"type": "json_object"},
                    "temperature": 0.4,
                }
                req3 = _req.Request(
                    "https://api.openai.com/v1/chat/completions",
                    data=_json.dumps(oai_payload).encode(),
                    headers={"Content-Type": "application/json", "Authorization": f"Bearer {openai_key}"},
                    method="POST",
                )
                with _req.urlopen(req3, timeout=30) as resp3:
                    oai_resp = _json.loads(resp3.read())
                result_json = _json.loads(oai_resp["choices"][0]["message"]["content"])
            except Exception as e:
                print(f"  [social-meta] OpenAI fallback failed: {e}")

    if result_json is None:
        raise HTTPException(500, "AI provider unavailable — set KIEAI_API_KEY, GEMINI_API_KEY or OPENAI_API_KEY")

    # Ensure all requested fields exist
    for f in body.fields:
        if f not in result_json:
            result_json[f] = "" if f != "tags" else []

    return result_json



# ── API Key Test Endpoints ────────────────────────────────────────────────────

@app.post("/api/test-key/{provider}")
def test_api_key(provider: str):
    """Test if a given API key is valid by making a minimal real request."""
    import json as _json
    import urllib.request as _req
    cfg = Settings()

    def ok(msg=""): return JSONResponse({"status": "ok", "message": msg or "✓ Bağlantı başarılı"})
    def fail(msg): return JSONResponse({"status": "error", "message": msg})

    try:
        if provider == "kieai":
            key = os.environ.get("KIEAI_API_KEY") or getattr(cfg, "kieai_api_key", "")
            if not key: return fail("Key girilmedi")
            from openai import OpenAI as _OAI
            c = _OAI(api_key=key, base_url="https://api.kie.ai/gemini-2.5-flash/v1")
            r = c.chat.completions.create(model="gemini-2.5-flash",
                messages=[{"role":"user","content":"ping"}], max_tokens=5)
            return ok("kie.ai Gemini 2.5 Flash")

        elif provider == "gemini":
            key = os.environ.get("GEMINI_API_KEY") or getattr(cfg, "gemini_api_key", "")
            if not key: return fail("Key girilmedi")
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={key}"
            payload = {"contents":[{"parts":[{"text":"ping"}]}],"generationConfig":{"maxOutputTokens":5}}
            req = _req.Request(url, data=_json.dumps(payload).encode(), headers={"Content-Type":"application/json"}, method="POST")
            with _req.urlopen(req, timeout=15): pass
            return ok("Gemini Direct API")

        elif provider == "openai":
            key = os.environ.get("OPENAI_API_KEY") or getattr(cfg, "openai_api_key", "")
            if not key: return fail("Key girilmedi")
            payload = {"model":"gpt-4o-mini","messages":[{"role":"user","content":"ping"}],"max_tokens":5}
            req = _req.Request("https://api.openai.com/v1/chat/completions",
                data=_json.dumps(payload).encode(),
                headers={"Content-Type":"application/json","Authorization":f"Bearer {key}"}, method="POST")
            with _req.urlopen(req, timeout=15): pass
            return ok("OpenAI GPT-4o-mini")

        elif provider == "anthropic":
            key = os.environ.get("ANTHROPIC_API_KEY") or getattr(cfg, "anthropic_api_key", "")
            if not key: return fail("Key girilmedi")
            payload = {"model":"claude-3-haiku-20240307","max_tokens":5,"messages":[{"role":"user","content":"ping"}]}
            req = _req.Request("https://api.anthropic.com/v1/messages",
                data=_json.dumps(payload).encode(),
                headers={"Content-Type":"application/json","x-api-key":key,"anthropic-version":"2023-06-01"}, method="POST")
            with _req.urlopen(req, timeout=15): pass
            return ok("Anthropic Claude")

        elif provider == "elevenlabs":
            key = os.environ.get("ELEVENLABS_API_KEY") or getattr(cfg, "elevenlabs_api_key", "")
            if not key: return fail("Key girilmedi")
            req = _req.Request("https://api.elevenlabs.io/v1/user",
                headers={"xi-api-key": key}, method="GET")
            with _req.urlopen(req, timeout=15) as resp:
                data = _json.loads(resp.read())
            tier = data.get("subscription", {}).get("tier", "unknown")
            return ok(f"ElevenLabs — plan: {tier}")

        elif provider == "speshaudio":
            key = os.environ.get("SPESHAUDIO_API_KEY") or getattr(cfg, "speshaudio_api_key", "")
            if not key: return fail("Key girilmedi")
            req = _req.Request("https://speshaudio.com/api/v1/voices",
                headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"}, method="GET")
            with _req.urlopen(req, timeout=15) as resp:
                _json.loads(resp.read())
            return ok("SpesAudio")

        elif provider == "pexels":
            key = os.environ.get("PEXELS_API_KEY") or getattr(cfg, "pexels_api_key", "")
            if not key: return fail("Key girilmedi")
            req = _req.Request("https://api.pexels.com/v1/search?query=test&per_page=1",
                headers={"Authorization": key}, method="GET")
            with _req.urlopen(req, timeout=15): pass
            return ok("Pexels")

        elif provider == "pixabay":
            key = os.environ.get("PIXABAY_API_KEY") or getattr(cfg, "pixabay_api_key", "")
            if not key: return fail("Key girilmedi")
            url = f"https://pixabay.com/api/?key={key}&q=test&per_page=3"
            req = _req.Request(url, method="GET")
            with _req.urlopen(req, timeout=15): pass
            return ok("Pixabay")

        else:
            return fail(f"Bilinmeyen provider: {provider}")

    except Exception as e:
        import urllib.error as _uerr
        if isinstance(e, _uerr.HTTPError):
            code = e.code
            try:
                body = e.read().decode("utf-8", errors="ignore")[:200]
            except Exception:
                body = ""
            if code == 401: return fail("Geçersiz API key (401)")
            if code == 403: return fail("Erişim reddedildi (403)")
            if code == 429: return fail("Rate limit — key geçerli ama kota doldu (429)")
            return fail(f"HTTP {code}: {body[:100]}")
        err = str(e)
        if "401" in err or "Unauthorized" in err or "invalid" in err.lower():
            return fail("Geçersiz API key")
        if "403" in err or "Forbidden" in err:
            return fail("Erişim reddedildi (key izin sorunu)")
        if "429" in err:
            return fail("Rate limit — key geçerli ama kota doldu")
        return fail(f"Hata: {err[:120]}")


@app.get("/")
def serve_ui():
    html_path = Path(__file__).parent / "ui" / "index.html"
    if not html_path.exists():
        return HTMLResponse("<h1>UI not found — create ui/index.html</h1>", status_code=404)
    return HTMLResponse(html_path.read_text(encoding="utf-8"))


if __name__ == "__main__":
    OUTPUT_DIR.mkdir(exist_ok=True)
    _cleanup_stale_sessions()
    print("🎬 YTRobot UI → http://localhost:8080")
    uvicorn.run(app, host="0.0.0.0", port=8080, reload=False)
