"""Visuals stage: fetches or generates a clip/image for each scene."""
import concurrent.futures
import logging
import urllib.request
from pathlib import Path
from config import settings
from pipeline.script import Scene
from providers.visuals.base import BaseVisualsProvider
from pipeline.visuals.broll import broll_manager
import requests

logger = logging.getLogger(__name__)


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


def predownload_assets(scenes: list[Scene], output_dir: Path, max_workers: int = 5) -> dict:
    """Pre-download visual assets in parallel for faster composition.

    Scans ``scenes`` for HTTP URLs stored in ``scene.visual_url`` and downloads
    them concurrently into *output_dir*.  Returns a mapping of
    ``{scene_index: local_path_str}`` for every successfully downloaded asset.
    Scenes without a ``visual_url`` or with a local path are silently skipped.
    """
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    urls_to_download: list[tuple[int, str]] = []
    for i, scene in enumerate(scenes):
        url = getattr(scene, "visual_url", None)
        if url and isinstance(url, str) and url.startswith("http"):
            urls_to_download.append((i, url))

    if not urls_to_download:
        logger.info("predownload_assets: no remote URLs found, nothing to pre-download.")
        return {}

    downloaded: dict[int, str] = {}

    def download_one(idx: int, url: str) -> tuple[int, str | None]:
        try:
            # Keep at most 5 chars of suffix to handle query-string-less URLs
            raw_suffix = Path(url.split("?")[0]).suffix[:5]
            ext = raw_suffix if raw_suffix else ".mp4"
            local_path = output_dir / f"predownload_{idx:03d}{ext}"
            if local_path.exists():
                logger.debug("Scene %d: pre-download cache hit %s", idx, local_path)
                return idx, str(local_path)
            urllib.request.urlretrieve(url, str(local_path))
            logger.debug("Scene %d: downloaded %s → %s", idx, url, local_path)
            return idx, str(local_path)
        except Exception as exc:
            logger.warning("Pre-download failed for scene %d (%s): %s", idx, url, exc)
            return idx, None

    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_map = {
            executor.submit(download_one, i, url): i
            for i, url in urls_to_download
        }
        for future in concurrent.futures.as_completed(future_map):
            idx, path = future.result()
            if path:
                downloaded[idx] = path

    logger.info(
        "predownload_assets: pre-downloaded %d/%d assets.",
        len(downloaded), len(urls_to_download),
    )
    return downloaded
