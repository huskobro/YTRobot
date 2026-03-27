from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from src.core.video_templates import video_template_manager

router = APIRouter(prefix="/api/templates", tags=["templates"])

class TemplateCreate(BaseModel):
    name: str
    settings: dict
    channel_id: str = "_default"
    description: str = ""

class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    settings: Optional[dict] = None

@router.get("/")
async def list_templates(channel_id: str = ""):
    return {"templates": video_template_manager.get_all(channel_id)}

@router.post("/")
async def create_template(req: TemplateCreate):
    t = video_template_manager.create(req.name, req.settings, req.channel_id, req.description)
    return {"status": "created", "template": t}

@router.get("/{template_id}")
async def get_template(template_id: str):
    t = video_template_manager.get(template_id)
    if not t: raise HTTPException(404, "Template not found")
    return {"template": t}

@router.post("/{template_id}/apply")
async def apply_template(template_id: str):
    settings = video_template_manager.apply(template_id)
    if settings is None: raise HTTPException(404, "Template not found")
    return {"status": "applied", "settings": settings}

@router.patch("/{template_id}")
async def update_template(template_id: str, req: TemplateUpdate):
    t = video_template_manager.update(template_id, req.model_dump(exclude_none=True))
    if not t: raise HTTPException(404, "Template not found")
    return {"status": "updated", "template": t}

@router.delete("/{template_id}")
async def delete_template(template_id: str):
    if video_template_manager.delete(template_id): return {"status": "deleted"}
    raise HTTPException(404, "Template not found")

@router.post("/from-session/{session_id}")
async def create_from_session(session_id: str, name: str = ""):
    t = video_template_manager.create_from_session(session_id, name or f"Template from {session_id}")
    if not t: raise HTTPException(404, "Session not found")
    return {"status": "created", "template": t}
