from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from src.core.playlist_manager import playlist_manager

router = APIRouter(prefix="/api/playlists", tags=["playlists"])

class PlaylistCreate(BaseModel):
    name: str
    channel_id: str = "_default"
    description: str = ""
    tags: list = []

class PlaylistUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[list] = None

class VideoAdd(BaseModel):
    session_id: str
    title: str = ""

@router.get("/")
async def list_playlists(channel_id: str = ""):
    return {"playlists": playlist_manager.get_all(channel_id)}

@router.post("/")
async def create_playlist(req: PlaylistCreate):
    pl = playlist_manager.create(req.name, req.channel_id, req.description, req.tags)
    return {"status": "created", "playlist": pl}

@router.get("/{playlist_id}")
async def get_playlist(playlist_id: str):
    pl = playlist_manager.get(playlist_id)
    if not pl: raise HTTPException(404, "Playlist not found")
    return {"playlist": pl}

@router.patch("/{playlist_id}")
async def update_playlist(playlist_id: str, req: PlaylistUpdate):
    pl = playlist_manager.update(playlist_id, req.model_dump(exclude_none=True))
    if not pl: raise HTTPException(404, "Playlist not found")
    return {"status": "updated", "playlist": pl}

@router.delete("/{playlist_id}")
async def delete_playlist(playlist_id: str):
    if playlist_manager.delete(playlist_id): return {"status": "deleted"}
    raise HTTPException(404, "Playlist not found")

@router.post("/{playlist_id}/videos")
async def add_video_to_playlist(playlist_id: str, req: VideoAdd):
    pl = playlist_manager.add_video(playlist_id, req.session_id, req.title)
    if not pl: raise HTTPException(404, "Playlist not found")
    return {"status": "added", "playlist": pl}

@router.delete("/{playlist_id}/videos/{session_id}")
async def remove_video_from_playlist(playlist_id: str, session_id: str):
    pl = playlist_manager.remove_video(playlist_id, session_id)
    if not pl: raise HTTPException(404, "Playlist not found")
    return {"status": "removed", "playlist": pl}

@router.post("/{playlist_id}/sync-youtube")
async def sync_youtube(playlist_id: str):
    result = playlist_manager.sync_to_youtube(playlist_id)
    if not result: raise HTTPException(404, "Playlist not found")
    if "error" in result: raise HTTPException(400, result["error"])
    return result
