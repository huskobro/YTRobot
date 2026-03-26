"""Visuals stage: fetches or generates a clip/image for each scene."""
from pathlib import Path
from config import settings
from pipeline.script import Scene
from providers.visuals.base import BaseVisualsProvider
from pipeline.visuals.broll import broll_manager
import requests


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


def _generate_placeholder_image(path: Path, width: int = 1920, height: int = 1080) -> None:
    """Generate a solid dark-gray placeholder image."""
    try:
        from PIL import Image
        img = Image.new("RGB", (width, height), color=(30, 30, 30))
        img.save(str(path))
    except ImportError:
        # PIL not available — create a minimal 1x1 JPEG as last resort
        import struct
        # Minimal valid JPEG (gray pixel)
        data = bytes.fromhex(
            "ffd8ffe000104a46494600010100000100010000"
            "ffdb004300080606070605080707070909080a0c"
            "140d0c0b0b0c1912130f141d1a1f1e1d1a1c1c"
            "20242e2720222c231c1c2837292c30313434341f"
            "27393d38323c2e333432ffc0000b080001000101"
            "011100ffc4001f000001050101010101010000000"
            "0000000000102030405060708090a0bffc4001f01"
            "0003010101010101010101000000000000010203"
            "0405060708090a0bffda00080101000063f000"
            "1d8000007ffd9"
        )
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "wb") as f:
            f.write(data)


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
            try:
                provider.fetch(query, out)
            except Exception as e:
                print(f"  [Visuals] Provider failed, trying B-Roll fallback: {e}")
                try:
                    auto_url = broll_manager.get_auto_media(query, media_type="video" if ext == ".mp4" else "image")
                    if auto_url:
                        resp = requests.get(auto_url, timeout=20)
                        resp.raise_for_status()
                        with open(out, "wb") as f:
                            f.write(resp.content)
                        print(f"  [Visuals] B-Roll saved to {out}")
                    else:
                        raise RuntimeError("No B-Roll media found")
                except Exception as e2:
                    print(f"  [Visuals] ⚠ B-Roll fallback failed too: {e2}")
                    print(f"  [Visuals] Generating placeholder for scene {i}...")
                    placeholder = clips_dir / f"scene_{i:03d}.jpg"
                    _generate_placeholder_image(placeholder)
                    if ext != ".jpg":
                        out = placeholder

        if out.exists():
            visual_paths.append(out)
        else:
            print(f"  [Visuals] ⚠ Scene {i} visual missing, generating placeholder...")
            placeholder = clips_dir / f"scene_{i:03d}.jpg"
            _generate_placeholder_image(placeholder)
            visual_paths.append(placeholder)
    return visual_paths
