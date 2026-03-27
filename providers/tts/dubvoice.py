"""DubVoice TTS provider — SpeshAudio backup.

API endpoint: POST https://dubvoice.com/api/v1/tts
Auth: Authorization: Bearer <key>

Set in .env:
  DUBVOICE_API_KEY=...
  DUBVOICE_VOICE_ID=...     (DubVoice voice ID)
"""
import logging
import time
import requests
from pathlib import Path

from config import settings
from providers.tts.base import BaseTTSProvider, apply_speed, clean_for_tts, trim_silence

logger = logging.getLogger("DubVoice")

DUBVOICE_API_URL = "https://dubvoice.com/api/v1/tts"
MAX_RETRIES = 3
RETRY_CODES = (429, 500, 502, 503, 504)
TIMEOUT = 120  # seconds


class DubVoiceTTSProvider(BaseTTSProvider):
    """DubVoice TTS — SpeshAudio alternative/backup."""

    def __init__(self):
        self.api_key = getattr(settings, 'dubvoice_api_key', '')
        self.voice_id = getattr(settings, 'dubvoice_voice_id', '')
        if not self.api_key:
            logger.warning("[DubVoice] No API key configured (DUBVOICE_API_KEY)")

    def synthesize(self, text: str, output_path: Path) -> Path:
        if not self.api_key:
            raise RuntimeError("DubVoice API key not configured")

        cleaned = clean_for_tts(text, remove_apostrophes=settings.tts_remove_apostrophes)

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload: dict = {
            "text": cleaned,
            "voice_id": self.voice_id,
            "speed": settings.tts_speed,
        }

        # POST with retry
        resp = None
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                resp = requests.post(
                    DUBVOICE_API_URL, json=payload, headers=headers, timeout=TIMEOUT
                )
                if resp.status_code in RETRY_CODES:
                    wait = 2 ** attempt
                    logger.warning(
                        f"[DubVoice] HTTP {resp.status_code}, retry {attempt}/{MAX_RETRIES} in {wait}s"
                    )
                    time.sleep(wait)
                    continue
                resp.raise_for_status()
                break
            except (requests.exceptions.Timeout, requests.exceptions.ConnectionError) as e:
                if attempt < MAX_RETRIES:
                    wait = 2 ** attempt
                    logger.warning(
                        f"[DubVoice] Connection error, retry {attempt}/{MAX_RETRIES} in {wait}s: {e}"
                    )
                    time.sleep(wait)
                else:
                    raise

        if resp is None:
            raise RuntimeError("DubVoice: no response received after retries")

        data = resp.json()
        if not data.get("success"):
            raise RuntimeError(f"DubVoice API error: {data}")

        audio_url = data["data"]["audio_url"]

        output_path.parent.mkdir(parents=True, exist_ok=True)

        # Download audio with retry
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                audio_resp = requests.get(audio_url, timeout=TIMEOUT)
                audio_resp.raise_for_status()
                output_path.write_bytes(audio_resp.content)
                break
            except (requests.exceptions.Timeout, requests.exceptions.ConnectionError) as e:
                if attempt < MAX_RETRIES:
                    wait = 2 ** attempt
                    logger.warning(
                        f"[DubVoice] Download retry {attempt}/{MAX_RETRIES}: {e}"
                    )
                    time.sleep(wait)
                else:
                    raise

        from pipeline.resilience import validate_output
        validate_output(output_path, min_size=1000, label="TTS/DubVoice")

        credits_used = data["data"].get("credits_used")
        credits_left = data["data"].get("remaining_credits")
        if credits_used is not None:
            print(f"    [DubVoice] Credits used: {credits_used} | Remaining: {credits_left}")

        logger.info(
            f"[DubVoice] Generated {output_path.name} ({output_path.stat().st_size} bytes)"
        )

        if settings.tts_trim_silence:
            trim_silence(output_path)
        apply_speed(output_path, settings.tts_speed)

        return output_path
