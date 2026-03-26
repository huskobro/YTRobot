import os
import json
import urllib.request as urllib_req
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from src.api.models.schemas import SettingsReq, PromptsReq, PresetReq
from src.core.utils import _read_env, _write_env, _list_presets, PRESETS_DIR, PROMPTS_DIR

router = APIRouter(prefix="/api", tags=["system"])

@router.get("/settings")
def get_settings():
    return _read_env()

@router.post("/settings")
def update_settings(body: SettingsReq):
    _write_env(body.values)
    return {"ok": True}

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
        return ok(f"Provider {provider} ok (stub)")
    except Exception as e:
        return fail(f"Hata: {str(e)}")
