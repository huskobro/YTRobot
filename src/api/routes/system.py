import os
import json
import logging
import tempfile
import urllib.request as urllib_req
from datetime import datetime, timezone
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
from src.api.models.schemas import SettingsReq, PromptsReq, PresetReq
from src.core.utils import _read_env, _write_env, _list_presets, PRESETS_DIR, PROMPTS_DIR
from src.core.cache import api_cache

router = APIRouter(prefix="/api", tags=["system"])
logger = logging.getLogger("ytrobot.system")

SETTINGS_HISTORY_FILE = Path("data/settings_history.json")
MAX_HISTORY = 20


def _save_settings_snapshot(settings_dict: dict):
    """Save a snapshot of current settings for undo — sensitive values are masked."""
    SETTINGS_HISTORY_FILE.parent.mkdir(parents=True, exist_ok=True)
    history = []
    if SETTINGS_HISTORY_FILE.exists():
        try:
            history = json.loads(SETTINGS_HISTORY_FILE.read_text())
        except Exception:
            pass
    masked = {k: _mask_value(k, str(v)) for k, v in settings_dict.items()}
    history.append({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "settings": masked,
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
        logger.error(f"API key test failed for provider '{provider}': {e}")
        return fail("API key test failed. Check server logs for details.")

@router.get("/voices")
def get_voices(provider: str = "", api_key: str = ""):
    """Secili TTS provider'dan ses listesi getirir.

    DEPRECATED: api_key query parameter is deprecated. Use stored config instead.
    """
    if api_key:
        logger.warning("DEPRECATED: api_key passed as query parameter to /voices. "
                       "Use stored config or POST /voices with body instead.")
    return _fetch_voices(provider=provider, api_key=api_key)


class VoicesReq(BaseModel):
    provider: str = ""
    api_key: str = ""


@router.post("/voices")
def post_voices(body: VoicesReq):
    """Fetch voice list — preferred endpoint (api_key in body, not URL)."""
    return _fetch_voices(provider=body.provider, api_key=body.api_key)


def _fetch_voices(provider: str = "", api_key: str = ""):
    """Internal helper to fetch voices for a given provider."""
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
            raise HTTPException(502, "Failed to fetch voices from ElevenLabs")

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
            raise HTTPException(502, "Failed to fetch voices from SpeshAudio")

    # Bilinmeyen provider
    raise HTTPException(400, f"Bilinmeyen TTS provider: {provider}. Desteklenenler: openai, elevenlabs, speshaudio")


# ── AI Assist (generic short text generation) ────────────────────────────────

class AiAssistReq(BaseModel):
    prompt: str
    max_tokens: int = 100


@router.post("/ai/assist")
async def ai_assist(req: AiAssistReq):
    """Generic AI text assist — returns a short generated text for form fields."""
    from config import Settings
    cfg = Settings()

    prompt = req.prompt.strip()
    if not prompt:
        raise HTTPException(400, "Prompt boş olamaz")

    messages = [
        {"role": "system", "content": "Sen kısa ve öz yanıtlar veren bir asistansın. Sadece istenen metni yaz, başka açıklama ekleme."},
        {"role": "user", "content": prompt},
    ]

    # Try KieAI first
    kieai_key = os.environ.get("KIEAI_API_KEY") or getattr(cfg, "kieai_api_key", "")
    if kieai_key:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=kieai_key, base_url="https://api.kie.ai/gemini-2.5-flash/v1")
            resp = client.chat.completions.create(
                model="gemini-2.5-flash", messages=messages,
                max_tokens=req.max_tokens, temperature=0.7,
            )
            text = resp.choices[0].message.content.strip()
            return {"text": text}
        except Exception as e:
            logger.warning(f"KieAI ai/assist failed: {e}")

    # Try Gemini direct
    gemini_key = os.environ.get("GEMINI_API_KEY") or getattr(cfg, "gemini_api_key", "")
    if gemini_key:
        try:
            import asyncio
            import urllib.request as _ur
            g_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={gemini_key}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.7, "maxOutputTokens": req.max_tokens},
            }
            _req_obj = _ur.Request(g_url, data=json.dumps(payload).encode(), headers={"Content-Type": "application/json"}, method="POST")
            def _call_gemini():
                with _ur.urlopen(_req_obj, timeout=15) as r:
                    return json.loads(r.read())
            data = await asyncio.get_event_loop().run_in_executor(None, _call_gemini)
            text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
            return {"text": text}
        except Exception as e:
            logger.warning(f"Gemini ai/assist failed: {e}")

    # Try OpenAI
    openai_key = os.environ.get("OPENAI_API_KEY") or getattr(cfg, "openai_api_key", "")
    if openai_key:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=openai_key)
            resp = client.chat.completions.create(
                model="gpt-4o-mini", messages=messages,
                max_tokens=req.max_tokens, temperature=0.7,
            )
            text = resp.choices[0].message.content.strip()
            return {"text": text}
        except Exception as e:
            logger.warning(f"OpenAI ai/assist failed: {e}")

    raise HTTPException(503, "Hiçbir AI provider yapılandırılmamış veya erişilemiyor")


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


# ── TTS Preview ──────────────────────────────────────────────────────────────

class TTSPreviewReq(BaseModel):
    provider: str = "edge"
    voice: str = "tr-TR-AhmetNeural"
    text: str = ""
    speed: float = 1.0


@router.post("/tts/preview")
async def tts_preview(body: TTSPreviewReq):
    """Generate a short TTS audio preview and return it as audio/mpeg."""
    text = body.text.strip() if body.text else ""
    if not text:
        text = "Merhaba, bu bir ses önizlemesidir."
    # Limit text to 200 characters
    if len(text) > 200:
        text = text[:200]

    provider = body.provider.lower()

    if provider == "edge":
        try:
            import edge_tts
        except ImportError:
            raise HTTPException(500, "edge-tts paketi yüklü değil. pip install edge-tts")

        tmp = tempfile.NamedTemporaryFile(suffix=".mp3", delete=False)
        tmp_path = tmp.name
        tmp.close()

        try:
            rate_str = ""
            if body.speed and body.speed != 1.0:
                pct = int((body.speed - 1.0) * 100)
                rate_str = f"{pct:+d}%"
            communicate = edge_tts.Communicate(text, body.voice, rate=rate_str if rate_str else None)
            await communicate.save(tmp_path)
        except Exception as e:
            logger.error(f"edge-tts preview failed: {e}")
            # Clean up on error
            try:
                os.unlink(tmp_path)
            except OSError:
                pass
            raise HTTPException(500, f"TTS önizleme başarısız: {e}")

        def _stream_and_cleanup():
            try:
                with open(tmp_path, "rb") as f:
                    yield from iter(lambda: f.read(8192), b"")
            finally:
                try:
                    os.unlink(tmp_path)
                except OSError:
                    pass

        return StreamingResponse(
            _stream_and_cleanup(),
            media_type="audio/mpeg",
            headers={"Content-Disposition": "inline; filename=preview.mp3"},
        )

    elif provider == "elevenlabs":
        from config import Settings
        cfg = Settings()
        key = os.environ.get("ELEVENLABS_API_KEY") or getattr(cfg, "elevenlabs_api_key", "")
        if not key:
            raise HTTPException(400, "ElevenLabs API key yapılandırılmamış")
        raise HTTPException(501, "ElevenLabs preview henüz desteklenmiyor. Edge TTS kullanın.")

    elif provider == "speshaudio":
        from config import Settings
        cfg = Settings()
        key = os.environ.get("SPESHAUDIO_API_KEY") or getattr(cfg, "speshaudio_api_key", "")
        if not key:
            raise HTTPException(400, "SpeshAudio API key yapılandırılmamış")
        raise HTTPException(501, "SpeshAudio preview henüz desteklenmiyor. Edge TTS kullanın.")

    elif provider == "openai":
        from config import Settings
        cfg = Settings()
        key = os.environ.get("OPENAI_API_KEY") or getattr(cfg, "openai_api_key", "")
        if not key:
            raise HTTPException(400, "OpenAI API key yapılandırılmamış")
        raise HTTPException(501, "OpenAI TTS preview henüz desteklenmiyor. Edge TTS kullanın.")

    else:
        raise HTTPException(400, f"Bilinmeyen TTS provider: {provider}")


# ── Wizard Configuration ─────────────────────────────────────────────────────

WIZARD_CONFIG_FILE = Path("data/wizard_config.json")

# Default wizard steps definition
DEFAULT_WIZARD_STEPS = [
    {"id": 1, "key": "welcome", "icon": "🎬", "enabled": True},
    {"id": 2, "key": "channel", "icon": "📡", "enabled": True},
    {"id": 3, "key": "tts_provider", "icon": "🎤", "enabled": True},
    {"id": 4, "key": "voice_select", "icon": "🗣️", "enabled": True},
    {"id": 5, "key": "visual_provider", "icon": "🖼️", "enabled": True},
    {"id": 6, "key": "video_style", "icon": "🎬", "enabled": True},
    {"id": 7, "key": "tts_advanced", "icon": "🔧", "enabled": True},
    {"id": 8, "key": "subtitle_detail", "icon": "📝", "enabled": True},
    {"id": 9, "key": "ai_system", "icon": "🧠", "enabled": True},
    {"id": 10, "key": "api_keys", "icon": "🔑", "enabled": True},
    {"id": 11, "key": "notifications", "icon": "🔔", "enabled": True},
    {"id": 12, "key": "social_meta", "icon": "📱", "enabled": True},
    {"id": 13, "key": "youtube_oauth", "icon": "📺", "enabled": True},
    {"id": 14, "key": "module_tts", "icon": "🎙️", "enabled": True},
    {"id": 15, "key": "module_settings", "icon": "⚙️", "enabled": True},
    {"id": 16, "key": "summary", "icon": "✅", "enabled": True},
]


@router.get("/wizard-config")
def get_wizard_config():
    """Get the wizard step configuration."""
    if WIZARD_CONFIG_FILE.exists():
        try:
            return json.loads(WIZARD_CONFIG_FILE.read_text())
        except Exception:
            pass
    return {"steps": DEFAULT_WIZARD_STEPS}


class WizardConfigReq(BaseModel):
    steps: list


@router.post("/wizard-config")
def save_wizard_config(body: WizardConfigReq):
    """Save wizard step configuration (order, enabled/disabled)."""
    WIZARD_CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)
    config = {"steps": body.steps, "updated_at": datetime.now(timezone.utc).isoformat()}
    WIZARD_CONFIG_FILE.write_text(json.dumps(config, indent=2, ensure_ascii=False))
    return {"ok": True}


@router.post("/wizard-config/reset")
def reset_wizard_config():
    """Reset wizard configuration to defaults."""
    if WIZARD_CONFIG_FILE.exists():
        WIZARD_CONFIG_FILE.unlink()
    return {"steps": DEFAULT_WIZARD_STEPS}
