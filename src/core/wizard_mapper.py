"""Maps wizard UI selections to pipeline environment variable overrides.

Merge order: quality preset (base) → platform (overrides resolution) →
subtitle style → explicit provider overrides.  Later values win.
"""
from __future__ import annotations
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from src.api.models.schemas import WizardConfig


# ── Quality presets ─────────────────────────────────────────────────────────

_QUALITY_PRESETS: dict[str, dict[str, str]] = {
    "quick_draft": {
        "VIDEO_RESOLUTION": "1280x720",
        "VIDEO_FPS": "24",
        "REMOTION_TRANSITION_DURATION": "0",
        "REMOTION_VIDEO_EFFECT": "none",
        "REMOTION_KEN_BURNS_ZOOM": "0",
    },
    "standard": {
        "VIDEO_RESOLUTION": "1920x1080",
        "VIDEO_FPS": "30",
        "REMOTION_TRANSITION_DURATION": "10",
        "REMOTION_VIDEO_EFFECT": "none",
    },
    "cinematic": {
        "VIDEO_RESOLUTION": "1920x1080",
        "VIDEO_FPS": "60",
        "REMOTION_TRANSITION_DURATION": "15",
        "REMOTION_VIDEO_EFFECT": "cinematic",
        "REMOTION_KEN_BURNS_ZOOM": "0.08",
    },
}


# ── Platform targeting ──────────────────────────────────────────────────────

_PLATFORM_PRESETS: dict[str, dict[str, str]] = {
    "youtube_16_9": {
        "VIDEO_RESOLUTION": "1920x1080",
        "ZIMAGE_ASPECT_RATIO": "16:9",
        "YT_ZIMAGE_ASPECT_RATIO": "16:9",
    },
    "shorts_9_16": {
        "VIDEO_RESOLUTION": "1080x1920",
        "ZIMAGE_ASPECT_RATIO": "9:16",
        "YT_ZIMAGE_ASPECT_RATIO": "9:16",
    },
    "tiktok_9_16": {
        "VIDEO_RESOLUTION": "1080x1920",
        "ZIMAGE_ASPECT_RATIO": "9:16",
        "YT_ZIMAGE_ASPECT_RATIO": "9:16",
    },
}


# ── Subtitle styles ────────────────────────────────────────────────────────

_SUBTITLE_PRESETS: dict[str, dict[str, str]] = {
    "minimal": {
        "REMOTION_SUBTITLE_ANIMATION": "minimal",
        "REMOTION_SUBTITLE_FONT": "inter",
        "REMOTION_SUBTITLE_SIZE": "48",
        "REMOTION_KARAOKE_ENABLED": "false",
    },
    "hype": {
        "REMOTION_SUBTITLE_ANIMATION": "hype",
        "REMOTION_SUBTITLE_FONT": "bebas",
        "REMOTION_SUBTITLE_SIZE": "68",
        "REMOTION_KARAOKE_ENABLED": "true",
    },
    "cinematic": {
        "REMOTION_SUBTITLE_ANIMATION": "vibrant",
        "REMOTION_SUBTITLE_FONT": "montserrat",
        "REMOTION_SUBTITLE_SIZE": "56",
        "REMOTION_KARAOKE_ENABLED": "true",
        "REMOTION_VIDEO_EFFECT": "cinematic",
    },
    "karaoke": {
        "REMOTION_SUBTITLE_ANIMATION": "hype",
        "REMOTION_SUBTITLE_FONT": "bebas",
        "REMOTION_SUBTITLE_SIZE": "68",
        "REMOTION_KARAOKE_ENABLED": "true",
        "REMOTION_KARAOKE_COLOR": "#FFD700",
    },
}


def wizard_config_to_env(config: "WizardConfig") -> dict[str, str]:
    """Convert a WizardConfig into a flat dict of env-var overrides.

    Merge order ensures platform resolution wins over quality preset,
    and subtitle style can override video effect.
    """
    env: dict[str, str] = {}

    # 1. Quality base
    if config.quality_preset and config.quality_preset in _QUALITY_PRESETS:
        env.update(_QUALITY_PRESETS[config.quality_preset])

    # 2. Platform overrides resolution
    if config.platform and config.platform in _PLATFORM_PRESETS:
        env.update(_PLATFORM_PRESETS[config.platform])

    # 3. Subtitle style
    if config.subtitle_style and config.subtitle_style in _SUBTITLE_PRESETS:
        env.update(_SUBTITLE_PRESETS[config.subtitle_style])

    return env
