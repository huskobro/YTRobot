from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class RunReq(BaseModel):
    topic: Optional[str] = None
    script_file: Optional[str] = None
    preset_name: Optional[str] = None

class NoteReq(BaseModel):
    notes: str

class SettingsReq(BaseModel):
    values: dict

class PromptsReq(BaseModel):
    values: dict

class PresetReq(BaseModel):
    name: str

class BulletinSourceReq(BaseModel):
    name: str
    url: str
    type: str = "rss"

class BulletinSourcePatch(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    enabled: Optional[bool] = None

class BulletinDraftReq(BaseModel):
    preset_name: str
    limit: int = 5

class SocialMetaReq(BaseModel):
    # Eski uyumluluk alanlari (BulletinRenderReq ve ProductReviewRenderReq icin)
    title: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    # Yeni generate endpoint alanlari
    module: Optional[str] = "yt_video"
    context: Optional[Dict[str, Any]] = {}
    fields: Optional[List[str]] = ["title", "description", "tags"]
    master_prompt: Optional[str] = ""
    lang: Optional[str] = "tr"

class BulletinRenderReq(BaseModel):
    sid: str
    items: List[Dict[str, Any]]
    preset_name: str
    video_style: Optional[str] = "automatic"
    auto_lang: Optional[str] = "Otomatik"
    publish_youtube: bool = False
    publish_instagram: bool = False
    social_metadata: Optional[SocialMetaReq] = None

class ProductReviewRenderReq(BaseModel):
    url: str
    product: Dict[str, Any]
    preset_name: Optional[str] = None
    publish_youtube: bool = False
    publish_instagram: bool = False
    social_metadata: Optional[SocialMetaReq] = None

class ProductReviewAutofillReq(BaseModel):
    url: str

class ProductReviewTTSReq(BaseModel):
    narration: str
    preset_name: Optional[str] = None
