"""Z-Image visual provider via kie.ai.

API: POST https://api.kie.ai/api/v1/jobs/createTask  (async)
     GET  https://api.kie.ai/api/v1/jobs/recordInfo?taskId=...

Set in .env:
  KIEAI_API_KEY=...
  ZIMAGE_ASPECT_RATIO=16:9   (optional; default 16:9 for YouTube landscape)
"""
import time
import json
import requests
from pathlib import Path

from config import settings
from providers.visuals.base import BaseVisualsProvider

_BASE = "https://api.kie.ai"
_CREATE_URL = f"{_BASE}/api/v1/jobs/createTask"
_STATUS_URL = f"{_BASE}/api/v1/jobs/recordInfo"
_POLL_INTERVAL = 3   # seconds between polls
_TIMEOUT = 180       # max seconds to wait for generation
_MAX_RETRIES = 3


class ZImageVisualsProvider(BaseVisualsProvider):
    def __init__(self):
        self.api_key = settings.kieai_api_key
        self.aspect_ratio = settings.zimage_aspect_ratio
        if not self.api_key:
            raise ValueError("KIEAI_API_KEY is not set in .env")

    def _headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    def fetch(self, query: str, output_path: Path) -> Path:
        for attempt in range(1, _MAX_RETRIES + 1):
            try:
                return self._fetch_once(query, output_path)
            except (requests.exceptions.Timeout, requests.exceptions.ConnectionError, TimeoutError) as e:
                if attempt < _MAX_RETRIES:
                    wait = attempt * 5
                    print(f"    [Z-Image] Attempt {attempt} failed ({e.__class__.__name__}), retrying in {wait}s...")
                    time.sleep(wait)
                else:
                    raise

    def _fetch_once(self, query: str, output_path: Path) -> Path:
        # 1. Submit generation task
        payload = {
            "model": "z-image",
            "input": {
                "prompt": query,
                "aspect_ratio": self.aspect_ratio,
            },
        }
        resp = requests.post(_CREATE_URL, headers=self._headers(), json=payload, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        task_id = data["data"]["taskId"]
        print(f"    [Z-Image] Task submitted: {task_id}")

        # 2. Poll until done
        elapsed = 0
        while elapsed < _TIMEOUT:
            time.sleep(_POLL_INTERVAL)
            elapsed += _POLL_INTERVAL
            status_resp = requests.get(
                _STATUS_URL,
                headers=self._headers(),
                params={"taskId": task_id},
                timeout=15,
            )
            status_resp.raise_for_status()
            info = status_resp.json()["data"]
            state = info.get("state", "")
            progress = info.get("progress", 0)
            print(f"    [Z-Image] {state} ({progress}%)")
            if state == "success":
                result = json.loads(info["resultJson"])
                image_url = result["resultUrls"][0]
                break
            elif state in ("failed", "fail", "error"):
                raise RuntimeError(
                    f"Z-Image generation failed: {info.get('failMsg', 'unknown error')}"
                )
        else:
            raise TimeoutError(f"Z-Image generation timed out after {_TIMEOUT}s")

        # 3. Download the image
        output_path.parent.mkdir(parents=True, exist_ok=True)
        img_resp = requests.get(image_url, timeout=60)
        img_resp.raise_for_status()
        with open(output_path, "wb") as f:
            f.write(img_resp.content)
        return output_path
