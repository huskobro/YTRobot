from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from src.core import antigravity

router = APIRouter(prefix="/api/antigravity", tags=["antigravity"])


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
def get_antigravity_data():
    return antigravity.get_data()


@router.post("/channels")
def save_channel(body: ChannelReq):
    return antigravity.save_channel(body.model_dump())


@router.delete("/channels/{channel_id}")
def delete_channel(channel_id: str):
    antigravity.delete_channel(channel_id)
    return {"ok": True}


@router.post("/channels/{channel_id}/scan")
async def scan_channel(channel_id: str):
    result = antigravity.scan_channel(channel_id)
    if "error" in result:
        raise HTTPException(404, result["error"])
    return result


@router.patch("/titles/{title_id}")
def update_title(title_id: str, body: TitleUpdateReq):
    entry = antigravity.update_title(title_id, body.model_dump(exclude_none=True))
    if not entry:
        raise HTTPException(404, "Title not found")
    return entry


@router.delete("/titles/{title_id}")
def delete_title(title_id: str):
    antigravity.delete_title(title_id)
    return {"ok": True}
