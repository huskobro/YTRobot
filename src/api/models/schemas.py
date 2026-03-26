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

class BulletinRenderReq(BaseModel):
    sid: str
    items: List[Dict[str, Any]]
    preset_name: str
    video_style: Optional[str] = "automatic"
    auto_lang: Optional[str] = "Otomatik"

class ProductReviewRenderReq(BaseModel):
    url: str
    product: Dict[str, Any]
    preset_name: Optional[str] = None

class ProductReviewAutofillReq(BaseModel):
    url: str

class ProductReviewTTSReq(BaseModel):
    narration: str
    preset_name: Optional[str] = None

class SocialMetaReq(BaseModel):
    title: str
    description: str
    tags: List[str]
