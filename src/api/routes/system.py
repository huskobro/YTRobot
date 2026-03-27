import os
import json
import logging
import urllib.request as urllib_req
from datetime import datetime, timezone
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from src.api.models.schemas import SettingsReq, PromptsReq, PresetReq
from src.core.utils import _read_env, _write_env, _list_presets, PRESETS_DIR, PROMPTS_DIR
from src.core.cache import api_cache

router = APIRouter(prefix="/api", tags=["system"])
logger = logging.getLogger("ytrobot.system")

SETTINGS_HISTORY_FILE = Path("data/settings_history.json")
MAX_HISTORY = 20


def _save_settings_snapshot(settings_dict: dict):
    """Save a snapshot of current settings for undo."""
    SETTINGS_HISTORY_FILE.parent.mkdir(parents=True, exist_ok=True)
    history = []
    if SETTINGS_HISTORY_FILE.exists():
        try:
            history = json.loads(SETTINGS_HISTORY_FILE.read_text())
        except Exception:
            pass
    history.append({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "settings": settings_dict,
    })
    if len(history) > MAX_HISTORY:
        history = history[-MAX_HISTORY:]
    SETTINGS_HISTORY_FILE.write_text(json.dumps(history, indent=2, ensure_ascii=False))


def _mask_value(key: str, value: str) -> str:
    """Mask sensitive values, showing only last 4 chars."""
    SENSITIVE_SUFFIXES = ('_api_key', '_client_id', '_client_secret', '_voice_id')
    if any(key.endswith(s) for s in SENSITIVE_SUFFIXES) and isinstance(value, str) and len(value) > 4:
        return '****' + value[-4:]
    return value


@router.get("/settings/search")
async def search_settings(q: str = ""):
    """Search through settings fields."""
    from config import settings
    if not q:
        return {"results": []}
    q_lower = q.lower()
    results = []
    for field_name, field_value in settings.model_dump().items():
        if q_lower in field_name.lower() or q_lower in str(field_value).lower():
            results.append({"key": field_name, "value": str(field_value), "type": type(field_value).__name__})
    return {"results": results, "query": q}


@router.get("/settings")
def get_settings():
    cached = api_cache.get("settings")
    if cached is not None:
        return cached
    raw = _read_env()
    result = {k: _mask_value(k, v) for k, v in raw.items()}
    api_cache.set("settings", result, ttl=60)
    return result

@router.post("/settings")
def update_settings(body: SettingsReq):
    from config import settings
    _save_settings_snapshot(settings.model_dump())
    _write_env(body.values)
    api_cache.invalidate("settings")
    return {"ok": True}


@router.get("/settings/history")
async def settings_history():
    if SETTINGS_HISTORY_FILE.exists():
        try:
            return {"history": json.loads(SETTINGS_HISTORY_FILE.read_text())}
        except Exception:
            pass
    return {"history": []}


@router.post("/settings/undo")
async def undo_settings():
    if not SETTINGS_HISTORY_FILE.exists():
        raise HTTPException(400, "No settings history")
    history = json.loads(SETTINGS_HISTORY_FILE.read_text())
    if not history:
        raise HTTPException(400, "No settings history")
    last = history.pop()
    SETTINGS_HISTORY_FILE.write_text(json.dumps(history, indent=2, ensure_ascii=False))
    from config import settings, reload_settings
    reload_settings()
    for key, value in last["settings"].items():
        if hasattr(settings, key):
            setattr(settings, key, value)
    return {"status": "undone", "restored_to": last["timestamp"]}

@router.get("/prompts")
def get_prompts():
    if not PROMPTS_DIR.exists(): return {}
    out = {}
    for f in PROMPTS_DIR.glob("*.txt"):
        out[f.stem] = f.read_text(encoding="utf-8")
    return out

@router.post("/prompts")
def update_prompts(body: PromptsReq):
    PROMPTS_DIR.mkdir(exist_ok=True)
    for k, v in body.values.items():
        (PROMPTS_DIR / f"{k}.txt").write_text(v, encoding="utf-8")
    return {"ok": True}

@router.get("/presets")
def get_presets():
    return _list_presets()

@router.post("/presets")
def save_preset(body: PresetReq):
    PRESETS_DIR.mkdir(exist_ok=True)
    vals = _read_env()
    (PRESETS_DIR / f"{body.name}.json").write_text(json.dumps(vals, indent=2))
    return {"ok": True}

@router.delete("/presets/{name}")
def delete_preset(name: str):
    p = PRESETS_DIR / f"{name}.json"
    if p.exists(): p.unlink()
    return {"ok": True}

@router.get("/prompts/defaults")
def get_prompt_defaults():
    # TODO: Provide actual defaults from a core file
    return {
        "script": "Generate a 10-scene YouTube script for {audience}...",
        "humanize": "Rewrite this script to sound more natural...",
        "metadata": "Generate YouTube title, description and tags...",
        "tts_enhance": "Add emphasis and pauses...",
        "bulletin_narration": "Summarize these news items...",
        "product_review_autofill": "Extract product details from this URL..."
    }

@router.post("/test-key/{provider}")
def test_api_key(provider: str):
    from config import Settings
    cfg = Settings()
    def ok(msg=""): return JSONResponse({"status": "ok", "message": msg or "✓ Bağlantı başarılı"})
    def fail(msg): return JSONResponse({"status": "error", "message": msg})
    try:
        if provider == "kieai":
            key = os.environ.get("KIEAI_API_KEY") or getattr(cfg, "kieai_api_key", "")
            if not key: return fail("Key girilmedi")
            from openai import OpenAI
            c = OpenAI(api_key=key, base_url="https://api.kie.ai/gemini-2.5-flash/v1")
            c.chat.completions.create(model="gemini-2.5-flash", messages=[{"role":"user","content":"ping"}], max_tokens=5)
            return ok("kie.ai Gemini 2.5 Flash")
        elif provider == "openai":
            key = os.environ.get("OPENAI_API_KEY") or getattr(cfg, "openai_api_key", "")
            if not key: return fail("Key girilmedi")
            from openai import OpenAI
            c = OpenAI(api_key=key)
            c.models.list()
            return ok("OpenAI API")
        elif provider == "elevenlabs":
            key = os.environ.get("ELEVENLABS_API_KEY") or getattr(cfg, "elevenlabs_api_key", "")
            if not key: return fail("Key girilmedi")
            url = "https://api.elevenlabs.io/v1/voices"
            req = urllib_req.Request(url, headers={"xi-api-key": key})
            with urllib_req.urlopen(req) as response:
                if response.status == 200: return ok("ElevenLabs")
                else: return fail(f"HTTP {response.status}")
        elif provider == "speshaudio":
            key = os.environ.get("SPESHAUDIO_API_KEY") or getattr(cfg, "speshaudio_api_key", "")
            if not key: return fail("Key girilmedi")
            url = "https://api.spesh.ai/v1/voices"
            req = urllib_req.Request(url, headers={"Authorization": f"Bearer {key}"})
            with urllib_req.urlopen(req) as response:
                if response.status == 200: return ok("Spesh Audio")
                else: return fail(f"HTTP {response.status}")
        return fail(f"Bilinmeyen provider: '{provider}'. Desteklenenler: kieai, openai, elevenlabs, speshaudio")
    except Exception as e:
        return fail(f"Hata: {str(e)}")

@router.get("/voices")
def get_voices(provider: str = "", api_key: str = ""):
    """Secili TTS provider'dan ses listesi getirir."""
    from config import Settings
    cfg = Settings()

    if not provider:
        provider = os.environ.get("TTS_PROVIDER") or getattr(cfg, "tts_provider", "")

    if provider == "openai":
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

    if provider == "elevenlabs":
        key = api_key or os.environ.get("ELEVENLABS_API_KEY") or getattr(cfg, "elevenlabs_api_key", "")
        if not key:
            raise HTTPException(400, "ElevenLabs API key gerekli")
        try:
            req = urllib_req.Request(
                "https://api.elevenlabs.io/v1/voices",
                headers={"xi-api-key": key}
            )
            with urllib_req.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read())
            voices = [{"id": v["voice_id"], "name": v["name"]} for v in data.get("voices", [])]
            return {"voices": voices}
        except Exception as e:
            logger.error(f"ElevenLabs voices fetch error: {e}")
            raise HTTPException(502, f"ElevenLabs API hatasi: {str(e)}")

    if provider == "speshaudio":
        key = api_key or os.environ.get("SPESHAUDIO_API_KEY") or getattr(cfg, "speshaudio_api_key", "")
        if not key:
            raise HTTPException(400, "SpeshAudio API key gerekli")
        try:
            req = urllib_req.Request(
                "https://api.spesh.ai/v1/voices",
                headers={"Authorization": f"Bearer {key}"}
            )
            with urllib_req.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read())
            voices = [{"id": v.get("voice_id") or v.get("id"), "name": v["name"]} for v in data.get("voices", data if isinstance(data, list) else [])]
            return {"voices": voices}
        except Exception as e:
            logger.error(f"SpeshAudio voices fetch error: {e}")
            raise HTTPException(502, f"SpeshAudio API hatasi: {str(e)}")

    # Bilinmeyen provider
    raise HTTPException(400, f"Bilinmeyen TTS provider: {provider}. Desteklenenler: openai, elevenlabs, speshaudio")


@router.post("/system/cleanup")
def cleanup_system():
    import shutil
    from pathlib import Path
    
    counts = {"deleted": 0, "size": 0}
    dirs_to_clean = [Path("tmp"), Path("assets/cache"), Path("assets/temp")]
    
    for d in dirs_to_clean:
        if d.exists():
            for f in d.glob("*"):
                try:
                    if f.is_file():
                        counts["size"] += f.stat().st_size
                        f.unlink()
                        counts["deleted"] += 1
                    elif f.is_dir():
                        shutil.rmtree(f)
                        counts["deleted"] += 1
                except Exception as e:
                    logger.warning(f"Cleanup failed for {f}: {e}")
    
    return {
        "ok": True, 
        "message": f"{counts['deleted']} dosya ve klasör temizlendi. {counts['size'] // 1024} KB alan açıldı.",
        "stats": counts
    }
