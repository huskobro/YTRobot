from pathlib import Path
from openai import OpenAI
from config import settings
from providers.tts.base import BaseTTSProvider


class OpenAITTSProvider(BaseTTSProvider):
    def __init__(self):
        self.client = OpenAI(api_key=settings.openai_api_key)

    def synthesize(self, text: str, output_path: Path) -> Path:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        response = self.client.audio.speech.create(
            model="tts-1-hd",
            voice="onyx",
            input=text,
        )
        response.stream_to_file(str(output_path))
        return output_path
