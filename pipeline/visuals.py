"""Visuals stage: fetches or generates a clip/image for each scene."""
from pathlib import Path
from config import settings
from pipeline.script import Scene
from providers.visuals.base import BaseVisualsProvider
from pipeline.visuals.broll import broll_manager


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
            query = scene.visual_query or scene.description or scene.text
            print(f"  [Visuals] Fetching visual for scene {i}: {query!r}")
            # Try provider first
            try:
                provider.fetch(query, out)
            except Exception as e:
                print(f"  [Visuals] Provider failed, trying B-Roll fallback: {e}")
                auto_url = broll_manager.get_auto_media(query, media_type="video" if ext == ".mp4" else "image")
                if auto_url:
                    import requests
                    resp = requests.get(auto_url, timeout=20)
                    with open(out, "wb") as f:
                        f.write(resp.content)
                        print(f"  [Visuals] B-Roll saved to {out}")
                else:
                    print(f"  [Visuals] B-Roll fallback failed too.")
        visual_paths.append(out)
    return visual_paths
