from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from src.core import competitor_intel

router = APIRouter(prefix="/api/competitor", tags=["competitor"])


class ChannelReq(BaseModel):
    id: str
    name: str
    language: str = "Turkish"
    dna: str = "Documentary"
    pull_count: int = 10
    competitors: List[Dict[str, Any]] = []


class TitleUpdateReq(BaseModel):
    status: Optional[str] = None
    rewritten_title: Optional[str] = None


@router.get("")
def get_competitor_data(channel_slug: Optional[str] = None):
    return competitor_intel.get_data(channel_slug)


@router.get("/heatmap")
def competitor_heatmap(channel_slug: str = ""):
    from src.core.competitor_intel import get_heatmap_data
    return get_heatmap_data(channel_slug)


@router.post("/channels")
def save_channel(body: ChannelReq, channel_slug: Optional[str] = None):
    return competitor_intel.save_channel(body.model_dump(), channel_slug)


@router.delete("/channels/{channel_id}")
def delete_channel(channel_id: str, channel_slug: Optional[str] = None):
    competitor_intel.delete_channel(channel_id, channel_slug)
    return {"ok": True}


@router.post("/channels/{channel_id}/scan")
async def scan_channel(channel_id: str, channel_slug: Optional[str] = None):
    result = competitor_intel.scan_channel(channel_id, channel_slug)
    if "error" in result:
        raise HTTPException(404, result["error"])
    return result


@router.patch("/titles/{title_id}")
def update_title(title_id: str, body: TitleUpdateReq, channel_slug: Optional[str] = None):
    entry = competitor_intel.update_title(title_id, body.model_dump(exclude_none=True), channel_slug)
    if not entry:
        raise HTTPException(404, "Title not found")
    return entry


@router.delete("/titles/{title_id}")
def delete_title(title_id: str, channel_slug: Optional[str] = None):
    competitor_intel.delete_title(title_id, channel_slug)
    return {"ok": True}
