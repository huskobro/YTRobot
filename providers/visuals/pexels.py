import requests
from pathlib import Path
from config import settings
from providers.visuals.base import BaseVisualsProvider


class PexelsVisualsProvider(BaseVisualsProvider):
    BASE_URL = "https://api.pexels.com/videos/search"

    def __init__(self):
        self.headers = {"Authorization": settings.pexels_api_key}

    def fetch(self, query: str, output_path: Path) -> Path:
        resp = requests.get(
            self.BASE_URL,
            headers=self.headers,
            params={"query": query, "per_page": 1, "orientation": "landscape"},
            timeout=15,
        )
        resp.raise_for_status()
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
