import time
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/thumbnail", tags=["thumbnail"])


class ThumbnailReq(BaseModel):
    prompt: str
    session_id: Optional[str] = None
    width: int = 1280
    height: int = 720
    seed: Optional[int] = None


@router.post("/generate")
async def generate_thumbnail_endpoint(body: ThumbnailReq):
    """Generate a thumbnail image for a given prompt."""
    from providers.visuals.pollinations import generate_thumbnail

    if body.session_id:
        output_path = Path(f"sessions/{body.session_id}/thumbnail.jpg")
    else:
        ts = int(time.time())
        output_path = Path(f"sessions/thumbnails/thumb_{ts}.jpg")

    success = generate_thumbnail(
        prompt=body.prompt,
        output_path=output_path,
        width=body.width,
        height=body.height,
        seed=body.seed,
    )
    if not success:
        raise HTTPException(500, "Thumbnail generation failed")

    return {
        "ok": True,
        "path": str(output_path),
        "url": f"/sessions/{output_path.relative_to('sessions')}",
    }


@router.get("/session/{session_id}")
async def get_session_thumbnail(session_id: str):
    """Return the thumbnail for a session if it exists."""
    thumb = Path(f"sessions/{session_id}/thumbnail.jpg")
    if not thumb.exists():
        raise HTTPException(404, "No thumbnail for this session")
    return FileResponse(str(thumb), media_type="image/jpeg")
