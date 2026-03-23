"""Spesh Audio TTS provider.

API endpoint: POST https://speshaudio.com/api/v1/tts
Auth: Authorization: Bearer <key>

Set in .env:
  SPESHAUDIO_API_KEY=sk_spesh_...
  SPESHAUDIO_VOICE_ID=21m00Tcm4TlvDq8ikWAM   (ElevenLabs voice ID)
  SPESHAUDIO_LANGUAGE=                         (optional; omit for auto-detect)
"""
import time
import requests
from pathlib import Path

from config import settings
from providers.tts.base import BaseTTSProvider

SPESH_URL = "https://speshaudio.com/api/v1/tts"
MAX_RETRIES = 3
TIMEOUT = 120  # seconds


class SpeshAudioTTSProvider(BaseTTSProvider):
    def __init__(self):
        self.api_key = settings.speshaudio_api_key
        self.voice_id = settings.speshaudio_voice_id
        self.language = settings.speshaudio_language  # "" → omit → auto-detect
        if not self.api_key:
            raise ValueError("SPESHAUDIO_API_KEY is not set in .env")
        if not self.voice_id:
            raise ValueError("SPESHAUDIO_VOICE_ID is not set in .env")

    def synthesize(self, text: str, output_path: Path) -> Path:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "text": text,
            "voice_id": self.voice_id,
            "model_id": "eleven_multilingual_v2",
        }
        if self.language:
            payload["language"] = self.language

        for attempt in range(1, MAX_RETRIES + 1):
            try:
                resp = requests.post(SPESH_URL, headers=headers, json=payload, timeout=TIMEOUT)
                resp.raise_for_status()
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
        audio_resp = requests.get(audio_url, timeout=120)
        audio_resp.raise_for_status()
        with open(output_path, "wb") as f:
            f.write(audio_resp.content)

        credits_used = data["data"].get("credits_used")
        credits_left = data["data"].get("remaining_credits")
        if credits_used is not None:
            print(f"    [Spesh] Credits used: {credits_used} | Remaining: {credits_left}")

        return output_path
