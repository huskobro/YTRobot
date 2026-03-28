from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class WizardConfig(BaseModel):
    quality_preset: Optional[str] = None    # quick_draft | standard | cinematic
    platform: Optional[str] = None          # youtube_16_9 | shorts_9_16 | tiktok_9_16
    subtitle_style: Optional[str] = None    # minimal | hype | cinematic | karaoke

class RunReq(BaseModel):
    topic: Optional[str] = None
    script_file: Optional[str] = None
    preset_name: Optional[str] = None
    wizard_config: Optional[WizardConfig] = None
    content_category: Optional[str] = "general"

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
    preset_name: Optional[str] = ""
    limit: int = 5
    max_items_per_source: int = 3
    language_override: Optional[str] = ""
    source_ids: Optional[List[str]] = None

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

class BulletinItem(BaseModel):
    title: str
    summary: str = ""
    source: str = ""
    category: str = ""

    model_config = {"extra": "allow"}  # backward compat: accept additional fields


class BulletinRenderReq(BaseModel):
    items: List[BulletinItem]
    network_name: Optional[str] = "YTRobot Haber"
    style: Optional[str] = "breaking"
    fps: Optional[int] = 60
    format: Optional[str] = "16:9"
    preset_name: Optional[str] = ""
    category_templates: Optional[Dict[str, Any]] = {}
    render_mode: Optional[str] = "combined"
    lang: Optional[str] = "auto"
    show_category_flash: Optional[bool] = False
    show_item_intro: Optional[bool] = False
    text_delivery_mode: Optional[str] = "per_scene"
    category_styles: Optional[Dict[str, Any]] = {}
    item_styles: Optional[Dict[str, Any]] = {}
    # Design settings
    lower_third_enabled: Optional[bool] = False
    lower_third_text: Optional[str] = ""
    lower_third_font: Optional[str] = "Inter"
    lower_third_color: Optional[str] = "#ffffff"
    lower_third_size: Optional[int] = 32
    ticker_enabled: Optional[bool] = False
    ticker_speed: Optional[int] = 3
    ticker_bg: Optional[str] = "#dc2626"
    ticker_color: Optional[str] = "#ffffff"
    show_live: Optional[bool] = True
    show_source: Optional[bool] = True
    show_date: Optional[bool] = True
    # Legacy fields
    publish_youtube: bool = False
    publish_instagram: bool = False
    social_metadata: Optional[SocialMetaReq] = None

class ProductReviewRenderReq(BaseModel):
    product: Dict[str, Any]
    style: Optional[str] = "modern"
    format: Optional[str] = "16:9"
    fps: Optional[int] = 60
    channel_name: Optional[str] = ""
    auto_generate_tts: Optional[bool] = True
    lang: Optional[str] = "tr"
    preset_name: Optional[str] = None
    # Legacy fields
    url: Optional[str] = ""
    publish_youtube: bool = False
    publish_instagram: bool = False
    social_metadata: Optional[SocialMetaReq] = None

class ProductReviewAutofillReq(BaseModel):
    url: str
    lang: str = "tr"
    master_prompt: Optional[str] = None

class ProductReviewTTSReq(BaseModel):
    narration: str
    preset_name: Optional[str] = None
