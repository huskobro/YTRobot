from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from src.core.content_calendar import content_calendar

router = APIRouter(prefix="/api/calendar", tags=["calendar"])

class CalendarEntry(BaseModel):
    title: str
    channel_id: str = "_default"
    planned_date: str = ""
    topic: str = ""
    status: str = "idea"
    notes: str = ""
    tags: list = []

class CalendarUpdate(BaseModel):
    title: Optional[str] = None
    planned_date: Optional[str] = None
    topic: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[list] = None

@router.get("/")
async def list_entries(channel_id: str = "", status: str = "", month: str = ""):
    return {"entries": content_calendar.get_entries(channel_id, status, month)}

@router.post("/")
async def create_entry(req: CalendarEntry):
    entry = content_calendar.add_entry(
        title=req.title, channel_id=req.channel_id,
        planned_date=req.planned_date, topic=req.topic,
        status=req.status, notes=req.notes, tags=req.tags
    )
    return {"status": "created", "entry": entry}

@router.patch("/{entry_id}")
async def update_entry(entry_id: str, req: CalendarUpdate):
    updates = req.model_dump(exclude_none=True)
    entry = content_calendar.update_entry(entry_id, updates)
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"status": "updated", "entry": entry}

@router.delete("/{entry_id}")
async def delete_entry(entry_id: str):
    if content_calendar.delete_entry(entry_id):
        return {"status": "deleted"}
    raise HTTPException(status_code=404, detail="Entry not found")

@router.post("/{entry_id}/link/{session_id}")
async def link_session(entry_id: str, session_id: str):
    entry = content_calendar.link_session(entry_id, session_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"status": "linked", "entry": entry}


@router.post("/{entry_id}/produce")
async def produce_from_calendar(entry_id: str):
    """Trigger a video pipeline run from a calendar entry and link them."""
    # Find the calendar entry
    entries = content_calendar.get_entries()
    entry = next((e for e in entries if e["id"] == entry_id), None)
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    topic = entry.get("topic") or entry.get("title", "")
    if not topic:
        raise HTTPException(status_code=400, detail="Entry has no topic or title")

    # Create a pipeline run
    from datetime import datetime
    from src.core.utils import _session_dir, _write_session
    from src.core.queue import queue_manager
    from src.api.routes.sessions import run_pipeline_task

    sid = datetime.now().strftime("%Y%m%d_%H%M%S")
    _session_dir(sid).mkdir(parents=True, exist_ok=True)

    channel_id = entry.get("channel_id", "_default")

    # Load channel config
    try:
        from src.core.channel_hub import channel_hub
        ch = channel_hub.get_channel(channel_id) or {}
    except Exception:
        ch = {}

    STEPS = ["Script", "Metadata", "TTS", "Visuals", "Subtitles", "Compose"]
    session = {
        "id": sid,
        "topic": topic,
        "input_type": "topic",
        "input_value": topic,
        "status": "queued",
        "paused": False,
        "pid": None,
        "current_step": -1,
        "steps": [{"name": s, "status": "pending"} for s in STEPS],
        "notes": f"Calendar: {entry.get('title', '')}",
        "started_at": datetime.now().isoformat(),
        "completed_at": None,
        "output_file": None,
        "error": None,
        "metadata": None,
        "preset_name": "",
        "module": "yt_video",
        "wizard_config": None,
        "channel_id": channel_id,
        "channel_name": ch.get("name", "Varsayılan Kanal"),
        "youtube_video_id": None,
        "youtube_playlist_id": None,
        "published_at": None,
        "calendar_entry_id": entry_id,
    }
    _write_session(sid, session)

    # Link calendar entry to session
    content_calendar.link_session(entry_id, sid)

    # Queue the pipeline run
    preset_env = {}
    try:
        channel_settings = channel_hub.get_channel_settings(channel_id)
        if channel_settings:
            preset_env = {**channel_settings}
    except Exception:
        pass

    await queue_manager.add_job("yt_video", {
        "topic": topic,
        "script_file": None,
        "preset_env": preset_env,
        "content_category": "general",
        "channel_config": ch,
        "channel_id": channel_id,
    }, sid)

    return {"status": "queued", "session_id": sid, "entry": entry}
