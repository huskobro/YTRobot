from pydantic_settings import BaseSettings
from typing import Literal


class Settings(BaseSettings):
    # LLM (OpenAI fallback)
    openai_api_key: str = ""
    anthropic_api_key: str = ""

    # kie.ai — Gemini 2.5 Flash (primary for script/metadata generation)
    kieai_api_key: str = ""

    # Gemini direct API (for product review autofill, etc.)
    gemini_api_key: str = ""

    # Script generation
    target_audience: str = ""  # e.g. "beginner YouTubers under 1k subscribers who want to grow"
    script_humanize_with_llm: bool = False  # Gemini pass to rewrite script for natural human speech

    # TTS
    tts_provider: Literal["elevenlabs", "openai", "google", "speshaudio"] = "openai"
    tts_enhance_with_llm: bool = False  # Run Gemini to add TTS emphasis/pauses before synthesis
    tts_speed: float = 1.0             # speech rate: 0.5=slow … 1.0=normal … 2.0=fast
    tts_remove_apostrophes: bool = True  # strip ' to prevent micro-pause glitches (safe for Turkish)
    tts_trim_silence: bool = False      # trim leading/trailing silence from each TTS audio clip

    openai_tts_voice: str = "onyx"  # alloy | ash | coral | echo | fable | nova | onyx | sage | shimmer
    elevenlabs_api_key: str = ""
    elevenlabs_voice_id: str = "21m00Tcm4TlvDq8ikWAM"
    speshaudio_api_key: str = ""
    speshaudio_voice_id: str = ""
    speshaudio_language: str = ""  # e.g. "tr", "en" — strongly recommended for Turkish to set "tr"
    speshaudio_stability: float = 0.3
    speshaudio_similarity_boost: float = 0.5
    speshaudio_style: float = 0.75

    # YT Video-specific TTS (optional; falls back to global TTS if empty/sentinel)
    yt_tts_provider: str = ""          # empty = use tts_provider
    yt_tts_voice_id: str = ""          # empty = global voice
    yt_tts_speed: float = 0.0          # 0.0 = use tts_speed
    yt_tts_language: str = ""          # empty = global language
    yt_tts_stability: float = -1.0     # -1.0 = use speshaudio_stability
    yt_tts_similarity_boost: float = -1.0
    yt_tts_style: float = -1.0
    yt_visuals_provider: str = ""      # empty = use visuals_provider

    # Bulletin-specific TTS (optional; falls back to global TTS if empty/sentinel)
    bulletin_tts_provider: str = ""          # empty = use tts_provider
    bulletin_tts_voice_id: str = ""          # empty = provider default voice
    bulletin_tts_speed: float = 0.0          # 0.0 = use tts_speed
    bulletin_tts_stability: float = -1.0     # -1.0 = use speshaudio_stability
    bulletin_tts_similarity_boost: float = -1.0
    bulletin_tts_style: float = -1.0
    bulletin_tts_language: str = ""          # empty = global provider default


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
    pr_tts_voice_id: str = ""          # empty = provider default voice
    pr_tts_speed: float = 0.0          # 0.0 = use tts_speed
    pr_tts_language: str = ""          # empty = global provider default
    pr_master_prompt: str = ""         # default AI extraction instructions
    pr_ai_language: str = ""           # empty = use UI lang setting
    pr_style: str = "modern"
    pr_format: str = "16:9"
    pr_fps: int = 60
    pr_channel_name: str = "YTRobot İnceleme"
    pr_currency: str = "TL"
    pr_cta_text: str = "Linke tıkla!"

    # Social Media Metadata Tool
    social_meta_enabled_yt_video: bool = False
    social_meta_enabled_bulletin: bool = False
    social_meta_enabled_pr: bool = False
    social_meta_fields: str = "title,description,tags"   # comma-separated: title,description,tags,source,link
    social_meta_master_prompt: str = ""
    social_meta_language: str = ""                        # empty = use module/global lang

    # Subtitles
    subtitle_provider: Literal["ffmpeg", "pycaps"] = "ffmpeg"
    pycaps_style: str = "hype"

    # Output
    output_dir: str = "output"
    video_resolution: str = "1920x1080"
    video_fps: int = 30

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
