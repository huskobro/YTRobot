from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from src.core.scheduler import video_scheduler, ScheduleEntry

router = APIRouter(prefix="/api/scheduler", tags=["scheduler"])


class ScheduleRequest(BaseModel):
    session_id: str
    channel_id: str = "_default"
    scheduled_at: str  # ISO 8601
    title: str = ""
    description: str = ""
    tags: list = []
    privacy_status: str = "private"
    category_id: str = "22"


@router.get("/")
async def list_scheduled():
    return {"entries": video_scheduler.get_all()}


@router.get("/pending")
async def list_pending():
    return {"entries": video_scheduler.get_pending()}


@router.post("/")
async def schedule_video(req: ScheduleRequest):
    entry = ScheduleEntry(
        session_id=req.session_id,
        channel_id=req.channel_id,
        scheduled_at=req.scheduled_at,
        title=req.title,
        description=req.description,
        tags=req.tags,
        privacy_status=req.privacy_status,
        category_id=req.category_id,
    )
    result = video_scheduler.add(entry)
    return {"status": "scheduled", "entry": result}


@router.delete("/{session_id}")
async def cancel_scheduled(session_id: str):
    if video_scheduler.cancel(session_id):
        return {"status": "cancelled"}
    raise HTTPException(status_code=404, detail="Schedule entry not found or not pending")
