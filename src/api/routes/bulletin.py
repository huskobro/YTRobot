import json
import threading
import time
import secrets
import asyncio
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from typing import Optional, List, Dict, Any
from collections import defaultdict

from src.api.models.schemas import BulletinSourceReq, BulletinSourcePatch, BulletinDraftReq, BulletinRenderReq
from src.core.utils import (
    BULLETIN_SOURCES_FILE, BULLETIN_HISTORY_FILE, BULLETIN_DIR,
    _load_bulletin_sources, _save_bulletin_sources, _load_bulletin_history, _append_bulletin_history
)
from src.core.queue import queue_manager
from src.core.cache import asset_cache

router = APIRouter(prefix="/api/bulletin", tags=["bulletin"])

_bulletin_jobs: dict[str, dict] = {}
_bulletin_jobs_lock = threading.Lock()

# Auto-map categories
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
    return _AUTO_STYLE_MAP.get((cat or "").lower().strip(), fallback)

# --- Helper functions for render (Global Scope) ---

def _on_progress(bid: str, progress: int, step: str, step_label: str):
    with _bulletin_jobs_lock:
        job = _bulletin_jobs.get(bid)
        if not job: return
        if progress == -1 and step == "_proc":
            try: job["_pid"] = int(step_label)
            except: pass
            return
        job["progress"] = progress
        job["step"] = step
        job["step_label"] = step_label
        elapsed = time.time() - job["started_at"]
        if progress > 2: job["eta"] = round(elapsed / progress * (100 - progress))
        else: job["eta"] = None

def _build_news_items(item_list: list, body_data: dict) -> list:
    news_items = []
    for item in item_list:
        cat = (item.get("category") or "").lower().strip()
        item_key = item.get("url") or item.get("source_url") or item.get("id") or item.get("title") or ""
        mapping_from_settings = body_data.get("category_templates", {}).get(cat)
        style_override = (
            body_data.get("item_styles", {}).get(item_key)
            or body_data.get("category_styles", {}).get(cat)
            or mapping_from_settings
            or _resolve_auto_style(cat, body_data.get("style", "breaking"))
        )
        img_url = item.get("image_url", "")
        cached_img = asset_cache.get_url_cache(img_url) if img_url else ""
        
        news_item = {
            "headline": item.get("title", ""),
            "subtext": item.get("narration", item.get("summary", "")),
            "duration": body_data.get("fps", 30) * 8,
            "imageUrl": str(cached_img.absolute()) if cached_img else "",
            "language": item.get("language", "tr"),
            "category": cat,
        }
        if style_override: news_item["styleOverride"] = style_override
        src_url = item.get("url") or item.get("source_url") or ""
        if src_url: news_item["sourceUrl"] = src_url
        pub_date = item.get("published") or item.get("published_date") or ""
        if pub_date: news_item["publishedDate"] = pub_date
        news_items.append(news_item)
    return news_items

def _build_props(news_items: list, comp_style: str, ticker_items: list, body_data: dict) -> dict:
    comp_id = "NewsBulletin9x16" if body_data.get("format") == "9:16" else "NewsBulletin"
    return {
        "items": news_items, "ticker": ticker_items, "networkName": body_data.get("network_name"),
        "style": comp_style, "fps": body_data.get("fps", 30), "composition": comp_id,
        "lowerThirdEnabled": body_data.get("lower_third_enabled"), "lowerThirdText": body_data.get("lower_third_text"),
        "lowerThirdFont": body_data.get("lower_third_font"), "lowerThirdColor": body_data.get("lower_third_color"),
        "lowerThirdSize": body_data.get("lower_third_size"), "tickerEnabled": body_data.get("ticker_enabled"),
        "tickerSpeed": body_data.get("ticker_speed"), "tickerBg": body_data.get("ticker_bg"),
        "tickerColor": body_data.get("ticker_color"), "showLive": body_data.get("show_live"),
        "showCategoryFlash": body_data.get("show_category_flash"), "showItemIntro": body_data.get("show_item_intro"),
        "textDeliveryMode": body_data.get("text_delivery_mode"), "showSource": body_data.get("show_source"),
        "showDate": body_data.get("show_date"), "lang": body_data.get("lang"),
    }

def _make_ticker(item_list: list, body_data: dict) -> list:
    return body_data.get("ticker") if body_data.get("ticker") else [{"text": f"• {item.get('title', '')}"} for item in item_list[:8]]

async def run_bulletin_task(bid: str, data: dict):
    await asyncio.to_thread(_do_bulletin_render_sync, bid, data)

def _do_bulletin_render_sync(bid: str, data: dict):
    from config import reload_settings
    reload_settings()
    from pipeline.news_bulletin import run_bulletin as render_bulletin
    
    body_data = data.get("body", {})
    render_mode = data.get("render_mode", "combined")
    _stop_event = threading.Event()
    _pause_event = threading.Event()
    
    with _bulletin_jobs_lock:
        _bulletin_jobs[bid] = {
            "id": bid, "status": "running", "output": None, "error": None,
            "progress": 0, "step": "init", "step_label": "Başlatılıyor...",
            "started_at": time.time(), "eta": None,
            "_stop": _stop_event, "_pause": _pause_event, "_pid": None,
        }

    try:
        raw_items: list = body_data.get("items", [])
        effective_mode = render_mode
        if body_data.get("render_per_category") and effective_mode == "combined":
            effective_mode = "per_category"

        output_path = BULLETIN_DIR / f"{bid}.mp4"

        if effective_mode == "per_item":
            output_files = {}
            total_items = len(raw_items)
            for i, item in enumerate(raw_items):
                cat = (item.get("category") or "").lower().strip()
                item_key = item.get("url") or item.get("source_url") or item.get("id") or item.get("title") or ""
                item_style = (
                    body_data.get("item_styles", {}).get(item_key) or body_data.get("category_styles", {}).get(cat)
                    or (body_data.get("category_templates", {}).get(cat))
                    or _resolve_auto_style(cat, body_data.get("style", "breaking"))
                )
                item_label = f"item_{i:02d}"
                item_output = BULLETIN_DIR / f"{bid}_{item_label}.mp4"
                prog_start, prog_end = 5 + int(i / total_items * 90), 5 + int((i+1) / total_items * 90)
                def _item_progress(p, s, sl, ps=prog_start, pe=prog_end, b=bid, lbl=item_label):
                    mapped = ps + int(p / 100 * (pe - ps))
                    _on_progress(b, mapped, s, f"[{lbl}] {sl}")
                props = _build_props(_build_news_items([item], body_data), item_style, [], body_data)
                render_bulletin(props, item_output, body_data.get("fps"), body_data.get("category_templates"), _item_progress, _stop_event, _pause_event)
                output_files[item_label] = str(item_output)
            if body_data.get("preset_name"):
                urls = [item.get("source_url", "") for item in raw_items if item.get("source_url")]
                if urls: _append_bulletin_history(body_data.get("preset_name"), urls)
            with _bulletin_jobs_lock:
                _bulletin_jobs[bid]["status"], _bulletin_jobs[bid]["output"], _bulletin_jobs[bid]["outputs"] = "completed", str(output_path), output_files
        elif effective_mode == "per_category":
            category_groups = defaultdict(list)
            for item in raw_items:
                cat = (item.get("category") or "").lower().strip()
                category_groups[cat or "__other__"].append(item)
            cats = list(category_groups.keys())
            total_cats, output_files = len(cats), {}
            for i, cat in enumerate(cats):
                cat_items = category_groups[cat]
                cat_style = body_data.get("category_styles", {}).get(cat) or (body_data.get("category_templates", {}).get(cat)) or (_resolve_auto_style(cat, body_data.get("style", "breaking")) if cat != "__other__" else body_data.get("style", "breaking"))
                cat_label = cat if cat != "__other__" else "diger"
                cat_output = BULLETIN_DIR / f"{bid}_{cat_label}.mp4"
                prog_start, prog_end = 5 + int(i / total_cats * 90), 5 + int((i+1) / total_cats * 90)
                def _cat_progress(p, s, sl, ps=prog_start, pe=prog_end, b=bid, cl=cat_label):
                    mapped = ps + int(p / 100 * (pe - ps))
                    _on_progress(b, mapped, s, f"[{cl.upper()}] {sl}")
                props = _build_props(_build_news_items(cat_items, body_data), cat_style, _make_ticker(cat_items, body_data), body_data)
                render_bulletin(props, cat_output, body_data.get("fps"), body_data.get("category_templates"), _cat_progress, _stop_event, _pause_event)
                output_files[cat_label] = str(cat_output)
            if body_data.get("preset_name"):
                urls = [item.get("source_url", "") for item in raw_items if item.get("source_url")]
                if urls: _append_bulletin_history(body_data.get("preset_name"), urls)
            with _bulletin_jobs_lock:
                _bulletin_jobs[bid]["status"], _bulletin_jobs[bid]["output"], _bulletin_jobs[bid]["outputs"] = "completed", str(output_path), output_files
        else:
            news_items = _build_news_items(raw_items, body_data)
            props = _build_props(news_items, body_data.get("style"), _make_ticker(raw_items, body_data), body_data)
            render_bulletin(props, output_path, body_data.get("fps"), body_data.get("category_templates"), lambda p,s,sl,b=bid: _on_progress(b,p,s,sl), _stop_event, _pause_event)
            if body_data.get("preset_name"):
                urls = [item.get("source_url", "") for item in raw_items if item.get("source_url")]
                if urls: _append_bulletin_history(body_data.get("preset_name"), urls)
            with _bulletin_jobs_lock:
                _bulletin_jobs[bid]["status"], _bulletin_jobs[bid]["output"] = "completed", str(output_path)
    except Exception as exc:
        with _bulletin_jobs_lock:
            _bulletin_jobs[bid]["status"], _bulletin_jobs[bid]["error"] = "failed", str(exc)
        raise exc

# --- Router Endpoints ---

@router.get("/history")
def get_bulletin_history():
    return _load_bulletin_history()

@router.delete("/history/{preset_name}")
def clear_bulletin_history(preset_name: str):
    history = _load_bulletin_history()
    history.pop(preset_name, None)
    BULLETIN_HISTORY_FILE.write_text(json.dumps(history, ensure_ascii=False, indent=2), encoding="utf-8")
    return {"ok": True}

@router.get("/sources")
def get_bulletin_sources():
    return _load_bulletin_sources()

@router.post("/sources")
def add_bulletin_source(body: BulletinSourceReq):
    sources = _load_bulletin_sources()
    new_src = {
        "id": "src_" + secrets.token_hex(4),
        "name": body.name.strip(),
        "url": body.url.strip(),
        "category": body.category.strip() or "Genel",
        "language": body.language.strip() or "tr",
        "enabled": body.enabled,
    }
    sources.append(new_src)
    _save_bulletin_sources(sources)
    return new_src

@router.patch("/sources/{src_id}")
def update_bulletin_source(src_id: str, body: BulletinSourcePatch):
    sources = _load_bulletin_sources()
    for src in sources:
        if src["id"] == src_id:
            if body.name is not None: src["name"] = body.name.strip()
            if body.url is not None: src["url"] = body.url.strip()
            if body.category is not None: src["category"] = body.category.strip()
            if body.language is not None: src["language"] = body.language.strip()
            if body.enabled is not None: src["enabled"] = body.enabled
            _save_bulletin_sources(sources)
            return src
    raise HTTPException(404, "Source not found")

@router.delete("/sources/{src_id}")
def delete_bulletin_source(src_id: str):
    sources = _load_bulletin_sources()
    new_sources = [s for s in sources if s["id"] != src_id]
    if len(new_sources) == len(sources):
        raise HTTPException(404, "Source not found")
    _save_bulletin_sources(new_sources)
    return {"ok": True}

@router.post("/draft")
def create_bulletin_draft(body: BulletinDraftReq):
    from pipeline.news_fetcher import fetch_and_draft
    sources = _load_bulletin_sources()
    if not sources: raise HTTPException(400, "No sources configured")
    used_urls: set[str] = set()
    if body.preset_name:
        history = _load_bulletin_history()
        used_urls = set(history.get(body.preset_name, []))
    result = fetch_and_draft(sources, max_items_per_source=body.max_items_per_source, language_override=body.language_override, source_ids=body.source_ids, used_urls=used_urls if used_urls else None)
    return result

@router.get("/status/{bid}")
def get_bulletin_status(bid: str):
    with _bulletin_jobs_lock:
        job = _bulletin_jobs.get(bid)
    if job is None: raise HTTPException(404, "Bulletin job not found")
    result = {k: v for k, v in job.items() if not k.startswith("_")}
    started = job.get("started_at")
    result["elapsed"] = round(time.time() - started) if started else 0
    result.setdefault("paused", False)
    return result

@router.post("/render")
async def start_bulletin_render(body: BulletinRenderReq):
    bid = "bul_" + secrets.token_hex(6)
    BULLETIN_DIR.mkdir(parents=True, exist_ok=True)
    
    with _bulletin_jobs_lock:
        _bulletin_jobs[bid] = {"id": bid, "status": "queued", "started_at": time.time()}

    await queue_manager.add_job("bulletin", {
        "bid": bid,
        "body": body.model_dump(),
        "render_mode": body.render_mode
    }, bid)
    
    return {"bulletin_id": bid}

@router.post("/render/{bid}/stop")
def stop_bulletin_render(bid: str):
    with _bulletin_jobs_lock:
        job = _bulletin_jobs.get(bid)
    if not job: raise HTTPException(404, "Job not found")
    if job.get("status") != "running": raise HTTPException(400, "Job is not running")
    job["_stop"].set()
    job["_pause"].clear()
    return {"ok": True}

@router.post("/render/{bid}/pause")
def pause_bulletin_render(bid: str):
    with _bulletin_jobs_lock:
        job = _bulletin_jobs.get(bid)
    if not job: raise HTTPException(404, "Job not found")
    if job.get("status") != "running": raise HTTPException(400, "Job is not running")
    job["_pause"].set()
    job["paused"] = True
    job["step_label"] = (job.get("step_label") or "") + " ⏸"
    return {"ok": True}

@router.post("/render/{bid}/resume")
def resume_bulletin_render(bid: str):
    with _bulletin_jobs_lock:
        job = _bulletin_jobs.get(bid)
    if not job: raise HTTPException(404, "Job not found")
    job["_pause"].clear()
    job["paused"] = False
    return {"ok": True}

@router.get("/download/{bid}")
def download_bulletin(bid: str):
    output_path = BULLETIN_DIR / f"{bid}.mp4"
    if not output_path.exists(): raise HTTPException(404, "Output file not found")
    return FileResponse(str(output_path), media_type="video/mp4", filename=f"{bid}.mp4")

@router.get("/download/{bid}/{category}")
def download_bulletin_category(bid: str, category: str):
    output_path = BULLETIN_DIR / f"{bid}_{category}.mp4"
    if not output_path.exists(): raise HTTPException(404, "Output file not found")
    return FileResponse(str(output_path), media_type="video/mp4", filename=f"{bid}_{category}.mp4")
