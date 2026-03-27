from pathlib import Path
from config import settings
from providers.tts.base import BaseTTSProvider, apply_speed, clean_for_tts, trim_silence
from pipeline.resilience import retry_with_backoff, validate_output


class ElevenLabsTTSProvider(BaseTTSProvider):
    def __init__(self):
        from elevenlabs.client import ElevenLabs
        self.client = ElevenLabs(api_key=settings.elevenlabs_api_key)
        self.voice_id = settings.elevenlabs_voice_id

    def synthesize(self, text: str, output_path: Path) -> Path:
        text = clean_for_tts(text, remove_apostrophes=settings.tts_remove_apostrophes)
        speed = settings.tts_speed
        audio = self._generate(text, speed)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "wb") as f:
            for chunk in audio:
                f.write(chunk)
        validate_output(output_path, min_size=1000, label="TTS/ElevenLabs")
        if settings.tts_trim_silence:
            trim_silence(output_path)
        # NOTE: Speed is applied natively via ElevenLabs API — no post-hoc apply_speed()
        return output_path

    @retry_with_backoff(max_retries=3, base_delay=2.0)
    def _generate(self, text: str, speed: float = 1.0):
        # ElevenLabs v2+ supports native speed control (0.7–1.2 range)
        # Clamp to supported range to avoid API errors
        api_speed = max(0.7, min(1.2, speed))
        return self.client.generate(
            text=text,
            voice=self.voice_id,
            model="eleven_multilingual_v2",
            voice_settings={"speed": api_speed},
        )
