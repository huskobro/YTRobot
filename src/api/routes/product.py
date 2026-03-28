import os
import json
import logging
import threading
import time
import secrets
import shutil
import subprocess
import re
import traceback
import asyncio
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from typing import Optional, Dict, Any

from src.api.models.schemas import ProductReviewRenderReq, ProductReviewAutofillReq, ProductReviewTTSReq
from src.core.utils import PRODUCT_REVIEW_DIR
from src.core.queue import queue_manager
from src.core.cache import asset_cache

router = APIRouter(prefix="/api/product-review", tags=["product-review"])
logger = logging.getLogger("ytrobot.product")

_product_review_jobs: dict = {}
_product_review_jobs_lock = threading.Lock()

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
- pros: 3-5 key advantages, each max 12 words
- cons: 2-4 disadvantages, each max 12 words
- score: overall value-for-money score 1-10
- verdict: compelling 1-2 sentence final verdict
- Return ONLY the JSON object, no explanation, no markdown fences.\
"""

# --- Helper functions for render (Global Scope) ---

def _on_product_progress(rid: str, progress: int, step: str, step_label: str):
    with _product_review_jobs_lock:
        job = _product_review_jobs.get(rid)
        if not job: return
        if progress == -1 and step == "_proc":
            try: job["_pid"] = int(step_label)
            except Exception as e:
                logger.warning(f"Failed to parse PID '{step_label}': {e}")
            return
        job["progress"] = progress
        job["step"] = step
        job["step_label"] = step_label
        elapsed = time.time() - job["started_at"]
        if progress > 2: job["eta"] = round(elapsed / progress * (100 - progress))
        else: job["eta"] = None

async def run_product_review_task(rid: str, data: dict):
    """Bridge for QueueManager to execute the sync render logic in a thread."""
    await asyncio.to_thread(_do_product_render_sync, rid, data)

def _do_product_render_sync(rid: str, data: dict):
    from config import reload_settings, settings
    reload_settings()
    # Apply per-channel settings overrides
    channel_settings = data.get("channel_settings", {})
    if channel_settings:
        for k, v in channel_settings.items():
            attr = k.lower()
            if hasattr(settings, attr):
                try:
                    setattr(settings, attr, type(getattr(settings, attr))(v))
                except (ValueError, TypeError):
                    pass

    body_data = data.get("body", {})
    product = body_data.get("product", {})
    lang = body_data.get("lang", "tr")
    fps = body_data.get("fps", 30)
    format_mode = body_data.get("format", "9:16")
    channel_name = body_data.get("channel_name", "")
    style = body_data.get("style", "modern")
    auto_tts = body_data.get("auto_generate_tts", False)

    _stop_event = threading.Event()
    with _product_review_jobs_lock:
        _product_review_jobs[rid] = {
            "id": rid, "status": "running", "output": None, "error": None,
            "progress": 0, "step": "init", "step_label": "Başlatılıyor...",
            "started_at": time.time(), "eta": None,
            "_stop": _stop_event, "_pid": None,
        }

    try:
        # --- Narration Creation ---
        narration = product.get("narration", "")
        if auto_tts and not product.get("audioUrl"):
            p = product
            def _to_float(v, default=0):
                try: return float(str(v).replace(",", ".").split()[0])
                except: return default
            name = p.get("name", "Bu ürün")
            price_raw = p.get("price", 0)
            original_price_raw = p.get("originalPrice", 0)
            price = _to_float(price_raw)
            original_price = _to_float(original_price_raw)
            currency, rating, review_count = p.get("currency", "TL"), _to_float(p.get("rating", 0)), p.get("reviewCount", 0)
            score = _to_float(p.get("score", 7), 7)
            verdict, cta = p.get("verdict", ""), p.get("ctaText", "Linke tıkla!")
            # Display strings: use raw values if they look like formatted strings, else numeric
            price_display = price_raw if isinstance(price_raw, str) and price_raw else price
            orig_display = original_price_raw if isinstance(original_price_raw, str) and original_price_raw else original_price
            pros, cons = p.get("pros", []), p.get("cons", [])

            if lang == "tr":
                discount_line = f" Normalde {orig_display} {currency} olan bu ürün şu an {price_display} {currency}'ye satılıyor, yüzde {round((original_price-price)/max(1,original_price)*100)} indirimle." if original_price > price else f" Fiyatı {price_display} {currency}."
                pros_text = " ".join([f"{i+1}. {pro}." for i, pro in enumerate(pros[:4])])
                cons_text = " ".join([f"{i+1}. {con}." for i, con in enumerate(cons[:3])])
                narration = f"Merhaba! Bugün {name} inceliyoruz.{discount_line} {review_count} yorum ve {rating} üzerinden {rating} yıldız aldı. Artıları: {pros_text} Eksileri: {cons_text} Genel puanımız: 10 üzerinden {score}. {verdict} {cta}"
            else:
                discount_line = f" Originally {orig_display} {currency}, now {price_display} {currency} — {round((original_price-price)/max(1,original_price)*100)}% off." if original_price > price else f" Priced at {price_display} {currency}."
                pros_text = " ".join([f"{i+1}. {pro}." for i, pro in enumerate(pros[:4])])
                cons_text = " ".join([f"{i+1}. {con}." for i, con in enumerate(cons[:3])])
                narration = f"Hey! Today we're reviewing the {name}.{discount_line} It has {review_count} reviews and a {rating} star rating. Pros: {pros_text} Cons: {cons_text} Our overall score: {score} out of 10. {verdict} {cta}"

        # --- TTS Generation with AssetCache ---
        if narration and not product.get("audioUrl"):
            _on_product_progress(rid, 5, "tts", "TTS sentezleniyor...")
            try:
                from config import settings as cfg
                from pipeline.tts import _load_provider
                from providers.tts.base import clean_for_tts

                pr_tts_provider = os.environ.get("PR_TTS_PROVIDER") or getattr(cfg, "pr_tts_provider", "")
                eff_prov = pr_tts_provider or cfg.tts_provider
                voice_settings = {"provider": eff_prov, "lang": lang}

                cached_tts = asset_cache.get_tts_cache(narration, voice_settings)
                if cached_tts:
                    product["audioUrl"] = f"/api/product-review/audio/{cached_tts.name}"
                    if not (PRODUCT_REVIEW_DIR / cached_tts.name).exists():
                        shutil.copy2(cached_tts, PRODUCT_REVIEW_DIR / cached_tts.name)
                else:
                    audio_filename = f"pr_tts_{int(time.time()*1000)}.mp3"
                    audio_path = PRODUCT_REVIEW_DIR / audio_filename
                    provider = _load_provider(eff_prov if eff_prov else None)
                    cleaned = clean_for_tts(narration, remove_apostrophes=cfg.tts_remove_apostrophes)
                    provider.synthesize(cleaned, audio_path)
                    product["audioUrl"] = f"/api/product-review/audio/{audio_filename}"
                    asset_cache.set_tts_cache(narration, voice_settings, audio_path)
            except Exception as e:
                print(f"[WARN] Auto-TTS failed: {e}")

        # --- Asset Caching (Images) ---
        # Cache'lenmiş dosyaları HTTP URL'ye çevir (Remotion mutlak yol açamaz)
        from config import settings as _img_cfg
        _port = getattr(_img_cfg, "port", 5005)
        _assets_root = Path(__file__).parent.parent.parent.parent / "assets"

        def _cache_to_http(path: Path) -> str:
            """Mutlak cache yolunu HTTP URL'ye çevir."""
            try:
                rel = path.relative_to(_assets_root)
                return f"http://localhost:{_port}/assets/{rel.as_posix()}"
            except ValueError:
                return str(path.absolute())

        if product.get("imageUrl"):
            cached_img = asset_cache.get_url_cache(product["imageUrl"])
            if cached_img:
                product["imageUrl"] = _cache_to_http(cached_img)

        if product.get("galleryUrls"):
            cached_galleries = []
            for g_url in product["galleryUrls"]:
                c_g = asset_cache.get_url_cache(g_url)
                cached_galleries.append(_cache_to_http(c_g) if c_g else g_url)
            product["galleryUrls"] = cached_galleries

        # --- Remotion Render ---
        comp_id = "ProductReview9x16" if format_mode == "9:16" else "ProductReview"
        
        # Build Subtitles with Word-Level Timing (Karaoke)
        final_subtitles = []
        try:
            from pipeline.subtitles import generate_word_timing
            from pipeline.script import Scene as PipelineScene
            
            # Mock a scene object for the subtitle aligner
            audio_url = product.get("audioUrl", "")
            if not audio_url:
                raise ValueError("audioUrl boş — kelime zamanlaması atlanıyor")
            p_scene = PipelineScene(id="pr", title=product.get("name", ""), narration=narration)
            audio_path = PRODUCT_REVIEW_DIR / audio_url.split("/")[-1]
            if not audio_path.exists():
                raise ValueError(f"Ses dosyası bulunamadı: {audio_path}")

            # Generate word_timing.json
            wt_path = generate_word_timing([audio_path], [p_scene], PRODUCT_REVIEW_DIR, fps=fps)
            if wt_path.exists():
                wt_data = json.loads(wt_path.read_text(encoding="utf-8"))
                if wt_data and len(wt_data) > 0:
                    scene_wt = wt_data[0] # Single scene for product review
                    for chunk in scene_wt.get("chunks", []):
                        sub_entry = {
                            "text": chunk["text"],
                            "startFrame": round(chunk["startSec"] * fps),
                            "endFrame": round(chunk["endSec"] * fps),
                            "words": []
                        }
                        for w in chunk.get("words", []):
                            sub_entry["words"].append({
                                "word": w["word"],
                                "startFrame": round(w["startSec"] * fps),
                                "endFrame": round(w["endSec"] * fps)
                            })
                        final_subtitles.append(sub_entry)
        except Exception as wt_err:
            print(f"[WARN] Word timing generation failed: {wt_err}")

        # Remotion number alanlarını normalize et (string gelirse float'a çevir)
        def _safe_num(v, default=0):
            try: return float(str(v).replace(",", ".").split()[0])
            except: return default
        product_norm = dict(product)
        for num_field in ("price", "originalPrice", "rating", "score", "reviewCount"):
            if num_field in product_norm:
                product_norm[num_field] = _safe_num(product_norm[num_field])

        # audioUrl relative ise Remotion'un erişebileceği tam URL'ye çevir
        audio_url_val = product_norm.get("audioUrl", "")
        if audio_url_val and audio_url_val.startswith("/api/"):
            _port = int(os.environ.get("YTROBOT_PORT", "") or os.environ.get("PORT", "") or 5006)
            product_norm["audioUrl"] = f"http://localhost:{_port}{audio_url_val}"

        # imageUrl ve galleryUrls'deki mutlak yerel yolları HTTP URL'ye çevir
        # (Remotion bundle sunucusu localhost:3002'den mutlak yolları açamaz)
        # Port: önce env var, sonra config, default 5005
        _port2 = int(os.environ.get("YTROBOT_PORT", "") or os.environ.get("PORT", "") or getattr(__import__("config", fromlist=["settings"]).settings, "port", 5006))
        _proj_root = Path(__file__).parent.parent.parent.parent

        def _local_to_http(url_or_path: str) -> str:
            if not url_or_path:
                return url_or_path
            # Zaten HTTP URL ise dokunma
            if url_or_path.startswith("http://") or url_or_path.startswith("https://"):
                return url_or_path
            # Mutlak yerel yol → /assets/... relative yap
            p = Path(url_or_path)
            try:
                rel = p.relative_to(_proj_root)
                return f"http://localhost:{_port2}/{rel.as_posix()}"
            except ValueError:
                return url_or_path

        if product_norm.get("imageUrl"):
            product_norm["imageUrl"] = _local_to_http(product_norm["imageUrl"])
        if product_norm.get("galleryUrls"):
            product_norm["galleryUrls"] = [_local_to_http(u) for u in product_norm["galleryUrls"]]

        props = {
            "product": product_norm,
            "style": style,
            "fps": fps, 
            "channelName": channel_name,
            "subtitles": final_subtitles,
            "settings": {
                "subtitleFont": getattr(settings, "remotion_subtitle_font", "bebas"),
                "subtitleSize": int(re.sub(r"[^0-9]", "", str(getattr(settings, "remotion_subtitle_size", 68))) or "68"),
                "subtitleColor": getattr(settings, "remotion_subtitle_color", "#ffffff"),
                "subtitleBg": getattr(settings, "remotion_subtitle_bg", "none"),
                "subtitleStroke": getattr(settings, "remotion_subtitle_stroke", 2),
                "karaokeEnabled": getattr(settings, "remotion_karaoke_enabled", True),
                "subtitleAnimation": getattr(settings, "remotion_subtitle_animation", "hype"),
            }
        }
        
        _on_product_progress(rid, 10, "render", "Remotion render başlıyor...")
        
        remotion_dir = Path(__file__).parent.parent.parent.parent / "remotion"
        output_path = PRODUCT_REVIEW_DIR / f"{rid}.mp4"
        raw_out = output_path.parent / (output_path.stem + "_raw" + output_path.suffix)
        
        cmd = ["npx", "remotion", "render", comp_id, str(raw_out.resolve()), f"--props={json.dumps(props)}", f"--concurrency={settings.remotion_concurrency}"]
        proc = subprocess.Popen(cmd, cwd=str(remotion_dir), stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1)
        try: _on_product_progress(rid, -1, "_proc", str(proc.pid))
        except Exception as e:
            logger.warning(f"Failed to register PID for job {rid}: {e}")
        
        _l_pct = 10
        remotion_output_lines = []
        for line in proc.stdout:
            remotion_output_lines.append(line.rstrip())
            m = re.search(r"(\d+)\s*%", line)
            if m:
                p_pct = int(m.group(1))
                overall = 10 + int(p_pct * 0.78)
                if overall > _l_pct: _l_pct = overall; _on_product_progress(rid, overall, "remotion", f"Video render: {p_pct}%")
            if _stop_event.is_set(): proc.terminate(); proc.wait(); raise InterruptedError("Durduruldu.")
        proc.wait()
        if proc.returncode != 0:
            error_lines = [l for l in remotion_output_lines if any(x in l for x in ("error", "Error", "Cannot", "TypeError", "undefined", "failed", "Failed"))]
            logger.error(f"[ProductReview] Remotion failed. Last output:\n" + "\n".join(remotion_output_lines[-30:]))
            raise RuntimeError(f"Render failed ({proc.returncode}): " + "; ".join(error_lines[-3:]) if error_lines else f"Render failed ({proc.returncode})")
        
        # FFmpeg post-process
        fix_cmd = ["ffmpeg", "-i", str(raw_out.resolve()), "-c:v", "libx264", "-crf", "18", "-preset", "fast", "-vf", "colorspace=bt709:iall=bt470bg:fast=1,format=yuv420p", "-color_range", "tv", "-colorspace", "bt709", "-color_trc", "bt709", "-color_primaries", "bt709", "-c:a", "copy", str(output_path.resolve()), "-y"]
        subprocess.run(fix_cmd, capture_output=True)
        raw_out.unlink(missing_ok=True)
        
        with _product_review_jobs_lock:
            _product_review_jobs[rid].update({"status": "completed", "output": str(output_path), "progress": 100, "step_label": "Tamamlandı"})
    except Exception as exc:
        traceback.print_exc()
        with _product_review_jobs_lock:
            _product_review_jobs[rid].update({"status": "failed", "error": str(exc), "step_label": f"Hata: {exc}"})
        raise exc

# --- Router Endpoints ---

@router.post("/render")
async def start_product_review_render(body: ProductReviewRenderReq):
    rid = "pr_" + secrets.token_hex(6)
    PRODUCT_REVIEW_DIR.mkdir(parents=True, exist_ok=True)
    
    with _product_review_jobs_lock:
        _product_review_jobs[rid] = {"id": rid, "status": "queued", "started_at": time.time()}

    # Load active channel settings for product review rendering
    channel_id = "_default"
    channel_settings = {}
    try:
        from src.core.channel_hub import channel_hub
        ch = channel_hub.get_active_channel()
        if ch:
            channel_id = ch.get("id", "_default")
            channel_settings = channel_hub.get_channel_settings(channel_id)
    except Exception:
        pass

    await queue_manager.add_job("product_review", {
        "rid": rid,
        "body": body.model_dump(),
        "channel_id": channel_id,
        "channel_settings": channel_settings,
    }, rid)
    
    return {"id": rid, "status": "queued"}

@router.get("/status/{rid}")
def product_review_status(rid: str):
    with _product_review_jobs_lock:
        job = _product_review_jobs.get(rid)
    if not job: raise HTTPException(404, "Job not found")
    return {k: v for k, v in job.items() if not k.startswith("_")}

@router.get("/audio/{filename}")
def get_product_audio(filename: str):
    path = PRODUCT_REVIEW_DIR / filename
    if not path.exists(): raise HTTPException(404, "Audio not found")
    return FileResponse(str(path), media_type="audio/mpeg")

@router.get("/download/{rid}")
def download_product_review(rid: str):
    with _product_review_jobs_lock:
        job = _product_review_jobs.get(rid)
    if not job or not job.get("output"): raise HTTPException(404, "Output missing")
    p = Path(job["output"])
    if not p.exists(): raise HTTPException(404, "File missing")
    return FileResponse(str(p), media_type="video/mp4", filename=p.name)

@router.post("/autofill")
def product_review_autofill(body: ProductReviewAutofillReq):
    try: from config import settings as cfg
    except: raise HTTPException(500, "Config error")
    import urllib.request as urllib_req
    page_html = ""
    try:
        req = urllib_req.Request(body.url, headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
            "Accept-Encoding": "identity",
        })
        with urllib_req.urlopen(req, timeout=15) as resp: page_html = resp.read(300_000).decode("utf-8", errors="replace")
    except Exception as e:
        logger.warning(f"Product page fetch failed for {body.url}: {e}")
        page_html = "(Fetch failed)"
    text_content = re.sub(r"<[^>]+>", " ", page_html)
    text_content = re.sub(r"\s+", " ", text_content).strip()[:8000]

    import json as _json

    # --- Yapılandırılmış fiyat/puan verisini HTML'den direkt çıkar ---
    structured_hints = {}
    # discountedPrice (indirimli fiyat) — Trendyol ve benzerleri
    _disc_m  = re.search(r'"discountedPrice"\s*:\s*\{[^}]*"value"\s*:\s*([\d.]+)', page_html)
    # originalPrice (orijinal/liste fiyatı)
    _orig_m  = re.search(r'"originalPrice"\s*:\s*\{[^}]*"value"\s*:\s*([\d.]+)', page_html)
    # buyingPrice veya genel price fallback
    _price_m = re.search(r'"price"\s*:\s*\{[^}]*"value"\s*:\s*([\d.]+)', page_html)
    # ratingScore.averageRating (Trendyol)
    _rating_m = re.search(r'"ratingScore"\s*:\s*\{[^}]*"averageRating"\s*:\s*([\d.]+)', page_html)
    if not _rating_m:
        _rating_m = re.search(r'"averageRating"\s*:\s*([\d.]+)', page_html)
    # commentCount / reviewCount
    _rcount_m = re.search(r'"commentCount"\s*:\s*(\d+)', page_html)
    if not _rcount_m:
        _rcount_m = re.search(r'"totalCommentCount"\s*:\s*(\d+)', page_html)
    if not _rcount_m:
        _rcount_m = re.search(r'"reviewCount"\s*:\s*(\d+)', page_html)

    if _disc_m:
        structured_hints["price"] = float(_disc_m.group(1))
    elif _price_m:
        structured_hints["price"] = float(_price_m.group(1))
    if _orig_m:
        structured_hints["originalPrice"] = float(_orig_m.group(1))
    if _rating_m:
        structured_hints["rating"] = float(_rating_m.group(1))
    if _rcount_m:
        structured_hints["reviewCount"] = int(_rcount_m.group(1))

    hints_text = ""
    if structured_hints:
        hints_text = f"\n\nYapılandırılmış veri (HTML'den çıkarıldı, kesinlikle kullan):\n{_json.dumps(structured_hints, ensure_ascii=False)}"

    system_prompt = body.master_prompt.strip() if body.master_prompt and body.master_prompt.strip() else _PR_AUTOFILL_SYSTEM_PROMPT
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"URL: {body.url}\nDil: {body.lang}{hints_text}\n\nSayfa içeriği:\n{text_content}"}
    ]
    kieai_key = os.environ.get("KIEAI_API_KEY") or getattr(cfg, "kieai_api_key", "")
    openai_key = os.environ.get("OPENAI_API_KEY") or getattr(cfg, "openai_api_key", "")
    result_text = None
    if kieai_key:
        from openai import OpenAI
        client = OpenAI(api_key=kieai_key, base_url="https://api.kie.ai/gemini-2.5-flash/v1")
        r = client.chat.completions.create(model="gemini-2.5-flash", messages=messages, max_tokens=1000, temperature=0.3)
        result_text = r.choices[0].message.content.strip()
    elif openai_key:
        from openai import OpenAI
        client = OpenAI(api_key=openai_key)
        r = client.chat.completions.create(model="gpt-4o-mini", messages=messages, max_tokens=1000, temperature=0.3)
        result_text = r.choices[0].message.content.strip()
    else:
        raise HTTPException(400, "AI API key bulunamadı (KIEAI_API_KEY veya OPENAI_API_KEY gerekli)")
    if result_text.startswith("```"):
        result_text = re.sub(r"```[a-z]*\n?", "", result_text).strip().rstrip("`").strip()
    try:
        data = _json.loads(result_text)
    except Exception as e:
        raise HTTPException(500, f"LLM yanıtı JSON parse edilemedi: {e}\n{result_text[:300]}")

    # HTML'den çıkarılan yapılandırılmış veriyi her zaman uygula
    for k, v in structured_hints.items():
        if v:
            data[k] = v

    return data

@router.post("/tts")
def product_review_tts(body: ProductReviewTTSReq):
    # This is handled by start_render now, but kept for compatibility
    return {"audioUrl": "GENERATED_ON_RENDER", "narration": body.narration}
