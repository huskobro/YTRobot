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
from fastapi.responses import HTMLResponse, StreamingResponse
from pydantic import BaseModel

app = FastAPI(title="YTRobot")

OUTPUT_DIR = Path("output")
ENV_FILE = Path(".env")
PROMPTS_DIR = Path("prompts")
PRESETS_DIR = Path("presets")
BULLETIN_SOURCES_FILE = Path("bulletin_sources.json")
BULLETIN_DIR = Path("output/bulletins")

PROMPT_KEYS = ["script_system", "script_humanize", "metadata_system", "tts_enhance"]


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
    return {
        "script_system": _SCRIPT_SYSTEM_PROMPT_TEMPLATE,
        "script_humanize": _SCRIPT_HUMANIZE_PROMPT,
        "metadata_system": METADATA_SYSTEM_PROMPT,
        "tts_enhance": _TTS_ENHANCE_PROMPT,
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


@app.post("/api/bulletin/draft")
def create_bulletin_draft(body: BulletinDraftReq):
    from pipeline.news_fetcher import fetch_and_draft
    sources = _load_bulletin_sources()
    if not sources:
        raise HTTPException(400, "No sources configured")
    result = fetch_and_draft(
        sources,
        max_items_per_source=body.max_items_per_source,
        language_override=body.language_override,
    )
    return result


# ── Bulletin: Render ──────────────────────────────────────────────────────────

_bulletin_jobs: dict[str, dict] = {}
_bulletin_jobs_lock = threading.Lock()


class BulletinRenderReq(BaseModel):
    items: list  # list of DraftItem dicts (selected ones)
    network_name: str = "YTRobot Haber"
    style: str = "breaking"
    fps: int = 60
    format: str = "16:9"   # "16:9" or "9:16"
    ticker: list = []


@app.post("/api/bulletin/render")
def start_bulletin_render(body: BulletinRenderReq):
    import secrets as _secrets
    from pipeline.news_bulletin import run_bulletin as render_bulletin

    bid = "bul_" + _secrets.token_hex(6)
    BULLETIN_DIR.mkdir(parents=True, exist_ok=True)
    output_path = BULLETIN_DIR / f"{bid}.mp4"

    with _bulletin_jobs_lock:
        _bulletin_jobs[bid] = {"id": bid, "status": "running", "output": None, "error": None}

    def _do_render():
        try:
            comp_id = "NewsBulletin9x16" if body.format == "9:16" else "NewsBulletin"
            # Build Remotion props from selected items
            news_items = []
            for item in body.items:
                news_items.append({
                    "headline": item.get("title", ""),
                    "subtext": item.get("narration", item.get("summary", "")),
                    "duration": body.fps * 8,  # 8 seconds per item
                    "imageUrl": item.get("image_url", ""),
                    "language": item.get("language", "tr"),
                })

            raw_items: list = body.items
            ticker_items = body.ticker if body.ticker else [
                {"text": f"• {item.get('title', '')}"} for item in raw_items[:5]
            ]

            props = {
                "items": news_items,
                "ticker": ticker_items,
                "networkName": body.network_name,
                "style": body.style,
                "fps": body.fps,
                "composition": comp_id,
            }

            render_bulletin(bulletin_config=props, output_path=output_path, fps=body.fps)

            with _bulletin_jobs_lock:
                _bulletin_jobs[bid]["status"] = "completed"
                _bulletin_jobs[bid]["output"] = str(output_path)
        except Exception as exc:
            with _bulletin_jobs_lock:
                _bulletin_jobs[bid]["status"] = "failed"
                _bulletin_jobs[bid]["error"] = str(exc)

    threading.Thread(target=_do_render, daemon=True).start()
    return {"bulletin_id": bid}


@app.get("/api/bulletin/render/{bid}")
def get_bulletin_render_status(bid: str):
    with _bulletin_jobs_lock:
        job = _bulletin_jobs.get(bid)
    if job is None:
        raise HTTPException(404, "Bulletin job not found")
    return job


@app.get("/api/bulletin/download/{bid}")
def download_bulletin(bid: str):
    from fastapi.responses import FileResponse
    output_path = BULLETIN_DIR / f"{bid}.mp4"
    if not output_path.exists():
        raise HTTPException(404, "Output file not found")
    return FileResponse(str(output_path), media_type="video/mp4", filename=f"{bid}.mp4")


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
