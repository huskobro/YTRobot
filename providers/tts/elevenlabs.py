from pathlib import Path
from config import settings
from providers.tts.base import BaseTTSProvider


class ElevenLabsTTSProvider(BaseTTSProvider):
    def __init__(self):
        from elevenlabs.client import ElevenLabs
        self.client = ElevenLabs(api_key=settings.elevenlabs_api_key)
        self.voice_id = settings.elevenlabs_voice_id

    def synthesize(self, text: str, output_path: Path) -> Path:
        audio = self.client.generate(
            text=text,
            voice=self.voice_id,
            model="eleven_multilingual_v2",
        )
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "wb") as f:
            for chunk in audio:
                f.write(chunk)
        return output_path
