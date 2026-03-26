import os
import json
import re
import urllib.request as urllib_req
from fastapi import APIRouter, HTTPException
from src.api.models.schemas import SocialMetaReq

router = APIRouter(prefix="/api/social-meta", tags=["social-meta"])

@router.post("/generate")
def generate_social_meta(body: SocialMetaReq):
    from config import Settings
    cfg = Settings()
    fields_str = ", ".join(getattr(body, "fields", ["title", "description", "tags"]))
    context_str = "\n".join(f"{k}: {v}" for k, v in getattr(body, "context", {}).items() if v)
    lang_note = "Turkish" if getattr(body, "lang", "tr") == "tr" else "English"

    system_prompt = (
        f"You are a social media content expert. Given the video context below, "
        f"generate social media metadata in {lang_note}.\n"
        f"Return ONLY a valid JSON object with these fields: {fields_str}.\n"
        f"Rules:\n- title: catchy, max 100 chars\n- description: 2-3 paragraphs\n- tags: 15-20 relevant hashtags\n"
        f"Return ONLY the JSON, no markdown fences."
    ) + (f"\n\nAdditional instructions:\n{body.master_prompt.strip()}" if getattr(body, "master_prompt", "").strip() else "")

    user_msg = f"Video context:\n{context_str}"
    result_json = None
    
    # Try multiple AI providers (simplified for modularity)
    kieai_key = os.environ.get("KIEAI_API_KEY") or getattr(cfg, "kieai_api_key", "")
    if kieai_key:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=kieai_key, base_url="https://api.kie.ai/gemini-2.5-flash/v1")
            resp = client.chat.completions.create(model="gemini-2.5-flash", messages=[{"role":"system","content":system_prompt},{"role":"user","content":user_msg}], temperature=0.4)
            raw = re.sub(r"^```(?:json)?\s*", "", resp.choices[0].message.content.strip()); raw = re.sub(r"\s*```$", "", raw)
            result_json = json.loads(raw)
        except: pass
    
    if result_json is None:
        gemini_key = os.environ.get("GEMINI_API_KEY") or getattr(cfg, "gemini_api_key", "")
        if gemini_key:
            try:
                g_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={gemini_key}"
                payload = {"contents":[{"parts":[{"text":system_prompt+"\n\n"+user_msg}]}],"generationConfig":{"responseMimeType":"application/json","temperature":0.4}}
                req = urllib_req.Request(g_url, data=json.dumps(payload).encode(), headers={"Content-Type":"application/json"}, method="POST")
                with urllib_req.urlopen(req, timeout=30) as r: result_json = json.loads(json.loads(r.read())["candidates"][0]["content"]["parts"][0]["text"])
            except: pass
            
    if result_json is None: raise HTTPException(500, "AI provider unavailable")
    for f in getattr(body, "fields", []):
        if f not in result_json: result_json[f] = "" if f != "tags" else []
    return result_json
