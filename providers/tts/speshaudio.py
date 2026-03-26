"""Spesh Audio TTS provider (ElevenLabs-compatible API).

API endpoint: POST https://speshaudio.com/api/v1/tts
Auth: Authorization: Bearer <key>

Set in .env:
  SPESHAUDIO_API_KEY=sk_spesh_...
  SPESHAUDIO_VOICE_ID=21m00Tcm4TlvDq8ikWAM   (ElevenLabs voice ID)
  SPESHAUDIO_LANGUAGE=                         (optional; omit for auto-detect)

Voice quality settings (ElevenLabs-compatible):
  SPESHAUDIO_STABILITY=0.5         # 0-1: lower = more expressive, higher = more consistent
  SPESHAUDIO_SIMILARITY_BOOST=0.75 # 0-1: how closely to match the original voice
  SPESHAUDIO_STYLE=0.3             # 0-1: style exaggeration for more natural, dynamic speech
"""
import time
import requests
from pathlib import Path

from config import settings
from providers.tts.base import BaseTTSProvider, apply_speed, clean_for_tts, trim_silence

SPESH_URL = "https://speshaudio.com/api/v1/tts"
MAX_RETRIES = 3
TIMEOUT = 120  # seconds


class SpeshAudioTTSProvider(BaseTTSProvider):
    def __init__(self):
        self.api_key = settings.speshaudio_api_key
        self.voice_id = settings.speshaudio_voice_id
        self.language = settings.speshaudio_language  # "" → omit → auto-detect
        self.stability = settings.speshaudio_stability
        self.similarity_boost = settings.speshaudio_similarity_boost
        self.style = settings.speshaudio_style
        if not self.api_key:
            raise ValueError("SPESHAUDIO_API_KEY is not set in .env")
        if not self.voice_id:
            raise ValueError("SPESHAUDIO_VOICE_ID is not set in .env")

    def synthesize(self, text: str, output_path: Path) -> Path:
        text = clean_for_tts(text, remove_apostrophes=settings.tts_remove_apostrophes)
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "text": text,
            "voice_id": self.voice_id,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {
                "stability": self.stability,
                "similarity_boost": self.similarity_boost,
                "style": self.style,
                "use_speaker_boost": True,
            },
        }
        if self.language:
            payload["language"] = self.language

        _RETRYABLE_CODES = (429, 500, 502, 503, 504)

        for attempt in range(1, MAX_RETRIES + 1):
            try:
                resp = requests.post(SPESH_URL, headers=headers, json=payload, timeout=TIMEOUT)
                if not resp.ok:
                    body = resp.text[:500]
                    if resp.status_code in _RETRYABLE_CODES and attempt < MAX_RETRIES:
                        wait = attempt * 5
                        print(f"    [Spesh] HTTP {resp.status_code}, retrying in {wait}s... ({body[:100]})")
                        time.sleep(wait)
                        continue
                    raise RuntimeError(f"Spesh Audio API {resp.status_code}: {body}")
                break
            except (requests.exceptions.Timeout, requests.exceptions.ConnectionError) as e:
                if attempt < MAX_RETRIES:
                    wait = attempt * 5
                    print(f"    [Spesh] Attempt {attempt} failed ({e.__class__.__name__}), retrying in {wait}s...")
                    time.sleep(wait)
                else:
                    raise

        # API returns JSON with audio_url — download the actual audio file
        data = resp.json()
        if not data.get("success"):
            raise RuntimeError(f"Spesh Audio API error: {data}")
        audio_url = data["data"]["audio_url"]

        output_path.parent.mkdir(parents=True, exist_ok=True)
        # Download with retry for transient network errors
        for dl_attempt in range(1, MAX_RETRIES + 1):
            try:
                audio_resp = requests.get(audio_url, timeout=120)
                audio_resp.raise_for_status()
                break
            except (requests.exceptions.Timeout, requests.exceptions.ConnectionError) as e:
                if dl_attempt < MAX_RETRIES:
                    wait = dl_attempt * 5
                    print(f"    [Spesh] Audio download attempt {dl_attempt} failed, retrying in {wait}s...")
                    time.sleep(wait)
                else:
                    raise
        with open(output_path, "wb") as f:
            f.write(audio_resp.content)

        from pipeline.resilience import validate_output
        validate_output(output_path, min_size=1000, label="TTS/SpeshAudio")

        credits_used = data["data"].get("credits_used")
        credits_left = data["data"].get("remaining_credits")
        if credits_used is not None:
            print(f"    [Spesh] Credits used: {credits_used} | Remaining: {credits_left}")

        if settings.tts_trim_silence:
            trim_silence(output_path)
        apply_speed(output_path, settings.tts_speed)
        return output_path
