from pathlib import Path
from openai import OpenAI
from config import settings
from providers.tts.base import BaseTTSProvider, apply_speed, clean_for_tts, trim_silence


class OpenAITTSProvider(BaseTTSProvider):
    def __init__(self):
        self.client = OpenAI(api_key=settings.openai_api_key)

    def synthesize(self, text: str, output_path: Path) -> Path:
        text = clean_for_tts(text, remove_apostrophes=settings.tts_remove_apostrophes)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        response = self.client.audio.speech.create(
            model="tts-1-hd",
            voice=settings.openai_tts_voice,
            input=text,
            speed=max(0.25, min(4.0, settings.tts_speed)),
        )
        response.stream_to_file(str(output_path))
        if settings.tts_trim_silence:
            trim_silence(output_path)
        return output_path
