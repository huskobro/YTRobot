import re
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional, Dict, Any
from src.core.channel_hub import channel_hub
from pathlib import Path

_ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
_MAX_LOGO_SIZE = 5 * 1024 * 1024  # 5 MB


def _sanitize_channel_id(channel_id: str) -> str:
    """Reject channel IDs that contain path traversal characters."""
    safe = re.sub(r'[^a-z0-9_-]', '', channel_id)
    if not safe or safe in ('.', '..') or len(safe) > 64:
        raise HTTPException(400, f"Invalid channel ID: {channel_id}")
    return safe

router = APIRouter(prefix="/api/channels", tags=["channels"])


class CreateChannelReq(BaseModel):
    name: str
    language: str = "tr"
    master_prompt: str = ""
    default_category: str = "general"
    preset_name: str = ""
    branding: Optional[Dict[str, Any]] = None
    platforms: Optional[Dict[str, Any]] = None


class UpdateChannelReq(BaseModel):
    name: Optional[str] = None
    language: Optional[str] = None
    master_prompt: Optional[str] = None
    default_category: Optional[str] = None
    preset_name: Optional[str] = None
    branding: Optional[Dict[str, Any]] = None
    platforms: Optional[Dict[str, Any]] = None


class SetActiveReq(BaseModel):
    channel_id: str


@router.get("")
def list_channels():
    return {"channels": channel_hub.get_channels()}


@router.get("/active")
def get_active():
    ch = channel_hub.get_active_channel()
    if not ch:
        raise HTTPException(404, "No active channel")
    return ch


@router.post("/active")
def set_active(body: SetActiveReq):
    try:
        channel_hub.set_active_channel(body.channel_id)
        return {"ok": True, "active_channel": body.channel_id}
    except ValueError as e:
        raise HTTPException(404, str(e))


@router.get("/analytics/all")
def get_all_analytics():
    return {"channels": channel_hub.get_all_analytics()}


@router.post("")
def create_channel(body: CreateChannelReq):
    config = channel_hub.create_channel(
        name=body.name,
        language=body.language,
        master_prompt=body.master_prompt,
        default_category=body.default_category,
        preset_name=body.preset_name,
        branding=body.branding,
        platforms=body.platforms,
    )
    return config


@router.get("/{channel_id}")
def get_channel(channel_id: str):
    ch = channel_hub.get_channel(channel_id)
    if not ch:
        raise HTTPException(404, f"Channel not found: {channel_id}")
    return ch


@router.patch("/{channel_id}")
def update_channel(channel_id: str, body: UpdateChannelReq):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    result = channel_hub.update_channel(channel_id, updates)
    if not result:
        raise HTTPException(404, f"Channel not found: {channel_id}")
    return result


@router.delete("/{channel_id}")
def delete_channel(channel_id: str):
    try:
        ok = channel_hub.delete_channel(channel_id)
        if not ok:
            raise HTTPException(404, f"Channel not found: {channel_id}")
        return {"ok": True}
    except ValueError as e:
        raise HTTPException(400, str(e))


@router.get("/{channel_id}/analytics")
def get_channel_analytics(channel_id: str):
    data = channel_hub.get_channel_analytics(channel_id)
    if data is None:
        raise HTTPException(404, f"Channel not found: {channel_id}")
    return data


@router.get("/{channel_id}/competitors")
def get_channel_competitors(channel_id: str):
    data = channel_hub.get_channel_competitors(channel_id)
    if data is None:
        raise HTTPException(404, f"Channel not found: {channel_id}")
    return data


@router.post("/{channel_id}/branding/logo")
async def upload_logo(channel_id: str, file: UploadFile = File(...)):
    safe_channel_id = _sanitize_channel_id(channel_id)
    ch = channel_hub.get_channel(safe_channel_id)
    if not ch:
        raise HTTPException(404, f"Channel not found: {channel_id}")

    # Validate MIME type — must be an image
    if not file.content_type or file.content_type not in _ALLOWED_IMAGE_TYPES:
        raise HTTPException(400, f"Only image files allowed (jpeg, png, gif, webp). Got: {file.content_type}")

    content = await file.read()

    # Validate file size
    if len(content) > _MAX_LOGO_SIZE:
        raise HTTPException(400, "File too large (max 5 MB)")

    # Save logo — filename is hardcoded to logo.png to prevent filename injection
    branding_dir = Path("channels") / safe_channel_id / "branding"
    branding_dir.mkdir(parents=True, exist_ok=True)
    logo_path = branding_dir / "logo.png"
    logo_path.write_bytes(content)

    # Update config
    channel_hub.update_channel(safe_channel_id, {
        "branding": {"logo_path": str(logo_path)}
    })

    return {"ok": True, "logo_path": str(logo_path)}
