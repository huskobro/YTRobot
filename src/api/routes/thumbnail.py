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
    template: str = "classic"
    overlay_text: str = ""
    channel_id: str = ""
    color_primary: str = "#FF0000"
    color_secondary: str = "#FFFFFF"


@router.post("/generate")
async def generate_thumbnail_endpoint(body: ThumbnailReq):
    """Generate a thumbnail image for a given prompt with optional text overlay and branding."""
    from providers.visuals.pollinations import generate_thumbnail
    from src.core.thumbnail_designer import thumbnail_designer

    if body.session_id:
        output_path = Path(f"sessions/{body.session_id}/thumbnail.jpg")
    else:
        ts = int(time.time())
        output_path = Path(f"sessions/thumbnails/thumb_{ts}.jpg")

    # Step 1: Generate AI background via Pollinations
    success = generate_thumbnail(
        prompt=body.prompt,
        output_path=output_path,
        width=body.width,
        height=body.height,
        seed=body.seed,
    )
    if not success:
        raise HTTPException(500, "Thumbnail generation failed")

    # Step 2: Apply ThumbnailDesigner overlay if overlay_text is provided
    overlay_text = body.overlay_text.strip()
    if overlay_text:
        # Resolve logo path from channel_id if provided
        logo_path: Optional[str] = None
        if body.channel_id:
            candidate = Path(f"sessions/{body.channel_id}/logo.png")
            if candidate.exists():
                logo_path = str(candidate)

        designed_path = output_path.with_name(
            output_path.stem + "_designed.jpg"
        )
        try:
            thumbnail_designer.generate(
                bg_image_path=output_path,
                text=overlay_text,
                template=body.template,
                output_path=designed_path,
                logo_path=logo_path,
                color_primary=body.color_primary,
                color_secondary=body.color_secondary,
                width=body.width,
                height=body.height,
            )
            # Replace original with designed version
            designed_path.replace(output_path)
        except Exception as e:
            # Non-fatal: return raw AI image if design step fails
            import logging
            logging.getLogger("thumbnail").warning(
                f"ThumbnailDesigner overlay failed (returning raw): {e}"
            )

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
