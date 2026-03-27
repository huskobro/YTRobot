from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import Literal, Optional
import os
import re
from dotenv import load_dotenv


def _strip_px(v: object) -> object:
    """Strip 'px' suffix from values like '64px' so they parse as int."""
    if isinstance(v, str):
        return re.sub(r'\s*px\s*$', '', v, flags=re.IGNORECASE)
    return v


class Settings(BaseSettings):

    @field_validator(
        'remotion_subtitle_size', 'remotion_subtitle_stroke',
        'remotion_transition_duration', 'remotion_concurrency',
        'video_fps',
        mode='before',
    )
    @classmethod
    def strip_px_suffix(cls, v: object) -> object:
        return _strip_px(v)
    # LLM (OpenAI fallback)
    openai_api_key: str = ""
    anthropic_api_key: str = ""

    # kie.ai — Gemini 2.5 Flash (primary for script/metadata generation)
    kieai_api_key: str = ""

    # Gemini direct API (for product review autofill, etc.)
    gemini_api_key: str = ""
    youtube_api_key: str = ""           # YouTube Data API v3 key for AntiGravity competitor scanning

    # Script generation
    target_audience: str = ""  # e.g. "beginner YouTubers under 1k subscribers who want to grow"
    script_humanize_with_llm: bool = False  # Gemini pass to rewrite script for natural human speech

    # TTS
    tts_provider: Literal["elevenlabs", "openai", "google", "speshaudio", "qwen3", "edge", "dubvoice"] = "openai"
    tts_enhance_with_llm: bool = False  # Run Gemini to add TTS emphasis/pauses before synthesis
    tts_speed: float = 1.0             # speech rate: 0.5=slow … 1.0=normal … 2.0=fast
    tts_remove_apostrophes: bool = True  # strip ' to prevent micro-pause glitches (safe for Turkish)
    tts_trim_silence: bool = False      # trim leading/trailing silence from each TTS audio clip

    openai_tts_voice: str = "onyx"  # alloy | ash | coral | echo | fable | nova | onyx | sage | shimmer
    edge_tts_voice: str = "tr-TR-AhmetNeural"  # run `edge-tts --list-voices` for full list
    elevenlabs_api_key: str = ""
    elevenlabs_voice_id: str = "21m00Tcm4TlvDq8ikWAM"
    speshaudio_api_key: str = ""
    speshaudio_voice_id: str = ""
    speshaudio_language: str = ""  # e.g. "tr", "en" — strongly recommended for Turkish to set "tr"
    speshaudio_stability: float = 0.3
    speshaudio_similarity_boost: float = 0.5
    speshaudio_style: float = 0.75
    dubvoice_api_key: str = ""
    dubvoice_voice_id: str = ""

    # Qwen3 TTS (Local)
    qwen3_model_id: str = "Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice"
    qwen3_model_type: Literal["custom", "design", "clone"] = "custom"
    qwen3_speaker: str = "Vivian"
    qwen3_voice_instruct: str = ""
    qwen3_ref_audio: str = ""
    qwen3_device: str = "auto"

    # YT Video-specific TTS (optional; falls back to global TTS if empty/sentinel)
    yt_tts_provider: str = ""          # empty = use tts_provider
    yt_tts_voice_id: str = ""          # deprecated: use provider-specific below
    yt_elevenlabs_voice_id: str = "" 
    yt_openai_tts_voice: str = ""
    yt_speshaudio_voice_id: str = ""
    yt_tts_speed: float = 0.0          # 0.0 = use tts_speed
    yt_tts_language: str = ""          # empty = global language
    yt_tts_stability: float = -1.0     # -1.0 = use speshaudio_stability
    yt_tts_similarity_boost: float = -1.0
    yt_tts_style: float = -1.0
    yt_qwen3_model_id: str = ""
    yt_qwen3_model_type: str = ""
    yt_qwen3_voice_instruct: str = ""
    yt_qwen3_device: str = ""
    yt_tts_enhance_with_llm: bool | None = None     # None = use tts_enhance_with_llm
    yt_tts_remove_apostrophes: bool | None = None   # None = use tts_remove_apostrophes
    yt_tts_trim_silence: bool | None = None         # None = use tts_trim_silence

    # YT Video-specific Script Settings
    yt_script_humanize_with_llm: bool | None = None  # None = use script_humanize_with_llm

    # YT Video-specific Visuals & Composition (optional; falls back to global if empty/sentinel)
    yt_visuals_provider: str = ""      # empty = use visuals_provider
    yt_remotion_subtitle_font: str = ""        # empty = use remotion_subtitle_font
    yt_remotion_subtitle_size: int = 0         # 0 = use remotion_subtitle_size
    yt_remotion_subtitle_color: str = ""       # empty = use remotion_subtitle_color
    yt_remotion_subtitle_bg: str = ""          # empty = use remotion_subtitle_bg
    yt_remotion_subtitle_stroke: int = -1      # -1 = use remotion_subtitle_stroke
    yt_remotion_video_effect: str = ""         # empty = use remotion_video_effect
    yt_remotion_subtitle_animation: str = ""   # empty = use remotion_subtitle_animation
    yt_remotion_ken_burns_zoom: float = -1.0   # -1 = use remotion_ken_burns_zoom
    yt_remotion_ken_burns_direction: str = ""  # empty = use remotion_ken_burns_direction
    yt_remotion_karaoke_enabled: bool | None = None   # None = use remotion_karaoke_enabled
    yt_remotion_karaoke_color: str = ""        # empty = use remotion_karaoke_color

    # Bulletin-specific TTS (optional; falls back to global TTS if empty/sentinel)
    bulletin_tts_provider: str = ""          # empty = use tts_provider
    bulletin_tts_voice_id: str = ""          # deprecated: use provider-specific below
    bulletin_elevenlabs_voice_id: str = ""
    bulletin_openai_tts_voice: str = ""
    bulletin_speshaudio_voice_id: str = ""
    bulletin_tts_speed: float = 0.0          # 0.0 = use tts_speed
    bulletin_tts_stability: float = -1.0     # -1.0 = use speshaudio_stability
    bulletin_tts_similarity_boost: float = -1.0
    bulletin_tts_style: float = -1.0
    bulletin_qwen3_model_id: str = ""
    bulletin_qwen3_model_type: str = ""
    bulletin_qwen3_voice_instruct: str = ""
    bulletin_qwen3_device: str = ""
    bulletin_tts_language: str = ""          # empty = global provider default
    bulletin_tts_enhance_with_llm: bool | None = None     # None = use tts_enhance_with_llm
    bulletin_tts_remove_apostrophes: bool | None = None   # None = use tts_remove_apostrophes
    bulletin_tts_trim_silence: bool | None = None         # None = use tts_trim_silence

    # Bulletin-specific Script Settings
    bulletin_script_humanize_with_llm: bool | None = None  # None = use script_humanize_with_llm

    # Bulletin persistent render settings
    bulletin_network_name: str = "YTRobot Haber"
    bulletin_style: str = "breaking"
    bulletin_format: str = "16:9"
    bulletin_fps: int = 60
    bulletin_default_max_items: int = 3
    bulletin_default_language: str = ""      # empty = per-source language
    bulletin_category_mapping: str = ""      # JSON map of category name to style string

    # Visuals
    visuals_provider: Literal["pexels", "pixabay", "dalle", "zimage"] = "pexels"
    pexels_api_key: str = ""
    pixabay_api_key: str = ""
    zimage_aspect_ratio: str = "16:9"  # 1:1 | 4:3 | 3:4 | 16:9 | 9:16

    # Composer
    composer_provider: Literal["moviepy", "remotion"] = "moviepy"
    remotion_concurrency: int = 4
    remotion_ken_burns_zoom: float = 0.08
    remotion_ken_burns_direction: str = "center"  # center | pan-left | pan-right | random
    remotion_subtitle_font: str = "bebas"         # serif | sans | roboto | montserrat | oswald | bebas | inter
    remotion_subtitle_size: int = 68              # px — bebas looks best at 65–75
    remotion_subtitle_color: str = "#ffffff"
    remotion_subtitle_bg: str = "none"            # none | box | pill
    remotion_subtitle_stroke: int = 2             # text stroke width px (0=disabled)
    remotion_transition_duration: int = 10        # frames for fade-in (0=disabled)
    remotion_video_effect: str = "none"           # none | vignette | warm | cool | cinematic
    remotion_karaoke_color: str = "#FFD700"       # highlight color for active karaoke word
    remotion_karaoke_enabled: bool = True         # word-by-word highlight (requires word_timing.json)
    remotion_subtitle_animation: str = "hype"    # hype | explosive | vibrant | minimal | none

    # Product Review module settings
    pr_tts_provider: str = ""          # empty = use tts_provider
    pr_tts_voice_id: str = ""          # deprecated: use provider-specific below
    pr_elevenlabs_voice_id: str = ""
    pr_openai_tts_voice: str = ""
    pr_speshaudio_voice_id: str = ""
    pr_tts_speed: float = 0.0          # 0.0 = use tts_speed
    pr_tts_language: str = ""          # empty = global provider default
    pr_tts_stability: float = -1.0     # -1.0 = use speshaudio_stability
    pr_tts_similarity_boost: float = -1.0
    pr_tts_style: float = -1.0
    pr_qwen3_model_id: str = ""
    pr_qwen3_model_type: str = ""
    pr_qwen3_voice_instruct: str = ""
    pr_qwen3_device: str = ""
    pr_tts_enhance_with_llm: bool | None = None     # None = use tts_enhance_with_llm
    pr_tts_remove_apostrophes: bool | None = None   # None = use tts_remove_apostrophes
    pr_tts_trim_silence: bool | None = None         # None = use tts_trim_silence
    pr_script_humanize_with_llm: bool | None = None  # None = use script_humanize_with_llm
    pr_auto_generate_tts: bool = True          # Auto-generate TTS on render if audio missing
    pr_master_prompt: str = ""         # default AI extraction instructions
    pr_ai_language: str = ""           # empty = use UI lang setting
    pr_style: str = "modern"
    pr_format: str = "16:9"
    pr_fps: int = 60
    pr_channel_name: str = "YTRobot İnceleme"
    pr_currency: str = "TL"
    pr_cta_text: str = "Linke tıkla!"

    # YouTube OAuth2 credentials
    yt_oauth_client_id: str = ""
    yt_oauth_client_secret: str = ""

    # Social Media Publishing
    autopublish_youtube: bool = False
    yt_privacy_status: str = "private"      # private | unlisted | public
    yt_category_id: str = "22"              # YouTube category ID
    autopublish_reels: bool = False
    share_on_instagram: bool = False
    share_on_tiktok: bool = False

    # Webhook Notifications
    webhook_enabled: bool = False
    webhook_url: str = ""              # Slack/Discord/custom HTTP endpoint
    webhook_on_complete: bool = True
    webhook_on_failure: bool = True
    webhook_mention: str = ""          # e.g. "@channel" or Discord user ID

    # Social Media Metadata Tool
    social_meta_enabled_yt_video: bool = False
    social_meta_enabled_bulletin: bool = False
    social_meta_enabled_pr: bool = False
    social_meta_fields: str = "title,description,tags"   # comma-separated: title,description,tags,source,link
    social_meta_master_prompt: str = ""
    social_meta_language: str = ""                        # empty = use module/global lang

    # Subtitles
    subtitle_provider: Literal["ffmpeg", "pycaps", "remotion"] = "ffmpeg"
    pycaps_style: str = "hype"

    # Output
    output_dir: str = "output"
    video_resolution: str = "1920x1080"
    video_fps: int = 30
    gpu_encoding: str = "auto"  # auto | force | disabled

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()


def reload_settings():
    """Reload settings from .env file into the singleton instance."""
    load_dotenv(override=True)
    new_settings = Settings()

    # Protected field patterns — don't overwrite non-empty values with empty strings
    _PROTECTED_SUFFIXES = ('_api_key', '_voice_id', '_client_id', '_client_secret')
    _PROTECTED_EXACT = ('webhook_url',)

    for key, value in new_settings.model_dump().items():
        old_value = getattr(settings, key, None)

        # Protect sensitive fields from accidental deletion
        is_protected = (
            any(key.endswith(s) for s in _PROTECTED_SUFFIXES)
            or key in _PROTECTED_EXACT
        )
        if is_protected and isinstance(value, str) and value == "" and old_value and old_value != "":
            print(f"  [Config] Protected non-empty value for {key}")
            continue

        setattr(settings, key, value)
    print("  [Config] Settings reloaded from .env")
