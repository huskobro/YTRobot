"""Visuals stage: fetches or generates a clip/image for each scene."""
from pathlib import Path
from config import settings
from pipeline.script import Scene
from providers.visuals.base import BaseVisualsProvider


def _load_provider() -> BaseVisualsProvider:
    if settings.visuals_provider == "pexels":
        from providers.visuals.pexels import PexelsVisualsProvider
        return PexelsVisualsProvider()
    elif settings.visuals_provider == "dalle":
        from providers.visuals.dalle import DalleVisualsProvider
        return DalleVisualsProvider()
    elif settings.visuals_provider == "zimage":
        from providers.visuals.zimage import ZImageVisualsProvider
        return ZImageVisualsProvider()
    else:
        raise ValueError(f"Unknown visuals provider: {settings.visuals_provider!r}")


def _extension_for_provider() -> str:
    if settings.visuals_provider in ("dalle", "zimage"):
        return ".jpg"
    return ".mp4"


def fetch_visuals(scenes: list[Scene], session_dir: Path) -> list[Path]:
    """Fetch or generate a visual for each scene. Returns list of file paths."""
    clips_dir = session_dir / "clips"
    clips_dir.mkdir(parents=True, exist_ok=True)
    provider = _load_provider()
    ext = _extension_for_provider()
    visual_paths = []
    for i, scene in enumerate(scenes):
        out = clips_dir / f"scene_{i:03d}{ext}"
        if out.exists():
            print(f"  [Visuals] Scene {i} already exists, skipping.")
        else:
            print(f"  [Visuals] Fetching visual for scene {i}: {scene.visual_query!r}")
            provider.fetch(scene.visual_query, out)
        visual_paths.append(out)
    return visual_paths
