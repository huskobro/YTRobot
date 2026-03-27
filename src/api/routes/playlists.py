from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from src.core.playlist_manager import playlist_manager
import os, json

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

class PlaylistMetaReq(BaseModel):
    videos: List[str] = []
    channel_id: str = "_default"
    language: str = "Turkish"

@router.post("/generate-meta")
async def generate_playlist_meta(req: PlaylistMetaReq):
    """AI ile playlist adı ve açıklaması üret"""
    try:
        from config import settings
        api_key = getattr(settings, 'KIEAI_API_KEY', '') or getattr(settings, 'OPENAI_API_KEY', '') or os.getenv('OPENAI_API_KEY', '')
        if not api_key:
            return {"name": f"Playlist - {req.channel_id}", "description": "AI API key bulunamadı, varsayılan isim kullanıldı."}

        video_list = "\n".join(f"- {v}" for v in req.videos[:15])
        prompt = f"""Bu YouTube kanalının aşağıdaki videoları var:
{video_list}

Bu videolar için SEO uyumlu, dikkat çekici bir YouTube playlist adı ve açıklaması oluştur.
Dil: {req.language}

JSON formatında yanıt ver:
{{"name": "Playlist adı (max 60 karakter)", "description": "Playlist açıklaması (max 200 karakter, anahtar kelimeler içersin)"}}"""

        import httpx
        base_url = getattr(settings, 'KIEAI_BASE_URL', 'https://api.openai.com/v1')
        model = getattr(settings, 'KIEAI_MODEL', 'gpt-4o-mini')
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{base_url}/chat/completions",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={"model": model, "messages": [{"role": "user", "content": prompt}], "temperature": 0.7, "max_tokens": 300}
            )
            if resp.status_code == 200:
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                # Parse JSON from response
                start = content.find('{')
                end = content.rfind('}') + 1
                if start >= 0 and end > start:
                    result = json.loads(content[start:end])
                    return {"name": result.get("name", ""), "description": result.get("description", "")}
            return {"name": f"Playlist - {req.channel_id}", "description": "AI yanıt ayrıştırılamadı"}
    except Exception as e:
        return {"name": f"Playlist - {req.channel_id}", "description": f"Hata: {str(e)}"}
