from pydantic_settings import BaseSettings
from typing import Literal


class Settings(BaseSettings):
    # LLM (OpenAI fallback)
    openai_api_key: str = ""
    anthropic_api_key: str = ""

    # kie.ai — Gemini 2.5 Flash (primary for script/metadata generation)
    kieai_api_key: str = ""

    # Script generation
    target_audience: str = ""  # e.g. "beginner YouTubers under 1k subscribers who want to grow"
    script_humanize_with_llm: bool = False  # Gemini pass to rewrite script for natural human speech

    # TTS
    tts_provider: Literal["elevenlabs", "openai", "google", "speshaudio"] = "openai"
    tts_enhance_with_llm: bool = False  # Run Gemini to add TTS emphasis/pauses before synthesis
    openai_tts_voice: str = "onyx"  # alloy | ash | coral | echo | fable | nova | onyx | sage | shimmer
    elevenlabs_api_key: str = ""
    elevenlabs_voice_id: str = "21m00Tcm4TlvDq8ikWAM"
    speshaudio_api_key: str = ""
    speshaudio_voice_id: str = ""
    speshaudio_language: str = ""  # e.g. "en", "tr" — leave empty for auto-detect
    speshaudio_stability: float = 0.5        # 0-1: lower = more expressive/varied
    speshaudio_similarity_boost: float = 0.75  # 0-1: higher = closer to original voice
    speshaudio_style: float = 0.3            # 0-1: style exaggeration for natural speech
    tts_speed: float = 1.0                   # speech rate: 0.5=slow … 1.0=normal … 2.0=fast

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
