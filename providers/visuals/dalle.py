import requests
from pathlib import Path
from openai import OpenAI
from config import settings
from providers.visuals.base import BaseVisualsProvider


class DalleVisualsProvider(BaseVisualsProvider):
    def __init__(self):
        self.client = OpenAI(api_key=settings.openai_api_key)

    def fetch(self, query: str, output_path: Path) -> Path:
        response = self.client.images.generate(
            model="dall-e-3",
            prompt=query,
            size="1792x1024",
            quality="standard",
            n=1,
        )
        image_url = response.data[0].url
        output_path.parent.mkdir(parents=True, exist_ok=True)
        img_data = requests.get(image_url, timeout=30).content
        with open(output_path, "wb") as f:
            f.write(img_data)
        return output_path
