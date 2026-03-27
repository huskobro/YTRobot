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
