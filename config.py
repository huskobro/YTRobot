from pydantic_settings import BaseSettings
from typing import Literal


class Settings(BaseSettings):
    # LLM (OpenAI fallback)
    openai_api_key: str = ""
    anthropic_api_key: str = ""

    # kie.ai — Gemini 2.5 Flash (primary for script/metadata generation)
    kieai_api_key: str = ""

    # TTS
    tts_provider: Literal["elevenlabs", "openai", "google", "speshaudio"] = "openai"
    elevenlabs_api_key: str = ""
    elevenlabs_voice_id: str = "21m00Tcm4TlvDq8ikWAM"
    speshaudio_api_key: str = ""
    speshaudio_voice_id: str = ""
    speshaudio_language: str = ""  # e.g. "en", "tr" — leave empty for auto-detect

    # Visuals
    visuals_provider: Literal["pexels", "pixabay", "dalle", "zimage"] = "pexels"
    pexels_api_key: str = ""
    pixabay_api_key: str = ""
    zimage_aspect_ratio: str = "16:9"  # 1:1 | 4:3 | 3:4 | 16:9 | 9:16

    # Composer
    composer_provider: Literal["moviepy", "remotion"] = "moviepy"
    remotion_concurrency: int = 4  # Parallel render threads for Remotion
    remotion_ken_burns_zoom: float = 0.08  # 0=disabled, 0.05=subtle, 0.08=normal, 0.15=strong
    remotion_ken_burns_direction: str = "center"  # center | pan-left | pan-right | random
    remotion_subtitle_font: str = "serif"  # serif | sans | roboto | montserrat | oswald | bebas | inter
    remotion_subtitle_size: int = 40  # px
    remotion_subtitle_color: str = "#ffffff"  # CSS color
    remotion_subtitle_bg: str = "none"  # none | box | pill
    remotion_subtitle_stroke: int = 0  # text stroke width px (0=disabled)
    remotion_transition_duration: int = 12  # frames for fade-in (0=disabled)
    remotion_video_effect: str = "none"  # none | vignette | warm | cool | cinematic

    # Subtitles
    subtitle_provider: Literal["ffmpeg", "pycaps"] = "ffmpeg"
    pycaps_style: str = "hype"  # preset name: hype, classic, vibrant, explosive, fast, etc.

    # Output
    output_dir: str = "output"
    video_resolution: str = "1920x1080"
    video_fps: int = 30

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
