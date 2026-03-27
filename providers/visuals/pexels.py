import logging
import time
import requests
from pathlib import Path
from config import settings
from providers.visuals.base import BaseVisualsProvider

logger = logging.getLogger("PexelsVisuals")

_MAX_RETRIES = 3
_RETRY_CODES = (429, 500, 502, 503, 504)


class PexelsVisualsProvider(BaseVisualsProvider):
    BASE_URL = "https://api.pexels.com/videos/search"

    def __init__(self):
        self.headers = {"Authorization": settings.pexels_api_key}

    def fetch(self, query: str, output_path: Path) -> Path:
        resp = None
        for attempt in range(1, _MAX_RETRIES + 1):
            try:
                resp = requests.get(
                    self.BASE_URL,
                    headers=self.headers,
                    params={"query": query, "per_page": 3, "orientation": "landscape"},
                    timeout=15,
                )
                if resp.status_code in _RETRY_CODES:
                    wait = 2 ** attempt
                    logger.warning(
                        f"[Pexels] HTTP {resp.status_code}, retry {attempt}/{_MAX_RETRIES} in {wait}s"
                    )
                    time.sleep(wait)
                    continue
                resp.raise_for_status()
                break
            except (requests.exceptions.Timeout, requests.exceptions.ConnectionError) as e:
                if attempt < _MAX_RETRIES:
                    wait = 2 ** attempt
                    logger.warning(f"[Pexels] Connection error, retry {attempt}/{_MAX_RETRIES} in {wait}s: {e}")
                    time.sleep(wait)
                else:
                    raise

        if resp is None or not resp.ok:
            raise RuntimeError(f"Pexels API unavailable after {_MAX_RETRIES} retries for query: {query!r}")

        data = resp.json()
        videos = data.get("videos", [])
        if not videos:
            raise ValueError(f"No Pexels videos found for query: {query!r}")

        # Pick the highest-res HD file available, fall back to any file
        files = videos[0]["video_files"]
        files_hd = [f for f in files if f.get("quality") in ("hd", "sd")]
        candidates = files_hd or files
        if not candidates:
            raise ValueError(f"No downloadable video files for query: {query!r}")
        best = max(candidates, key=lambda f: f.get("width", 0))

        output_path.parent.mkdir(parents=True, exist_ok=True)
        video_resp = requests.get(best["link"], stream=True, timeout=60)
        video_resp.raise_for_status()
        with open(output_path, "wb") as fh:
            for chunk in video_resp.iter_content(chunk_size=8192):
                fh.write(chunk)
        return output_path
