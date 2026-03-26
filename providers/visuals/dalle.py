import requests
from pathlib import Path
from openai import OpenAI
from config import settings
from providers.visuals.base import BaseVisualsProvider
from pipeline.resilience import retry_with_backoff, validate_output


class DalleVisualsProvider(BaseVisualsProvider):
    def __init__(self):
        self.client = OpenAI(api_key=settings.openai_api_key)

    def fetch(self, query: str, output_path: Path) -> Path:
        response = self._generate(query)
        if not response.data:
            raise RuntimeError("DALL-E returned no images")
        image_url = response.data[0].url
        output_path.parent.mkdir(parents=True, exist_ok=True)
        img_data = self._download(image_url)
        with open(output_path, "wb") as f:
            f.write(img_data)
        validate_output(output_path, min_size=1000, label="Visuals/DALL-E")
        return output_path

    @retry_with_backoff(max_retries=3, base_delay=2.0)
    def _generate(self, query: str):
        return self.client.images.generate(
            model="dall-e-3",
            prompt=query,
            size="1792x1024",
            quality="standard",
            n=1,
        )

    @retry_with_backoff(max_retries=3, base_delay=2.0)
    def _download(self, url: str) -> bytes:
        resp = requests.get(url, timeout=30)
        resp.raise_for_status()
        return resp.content
