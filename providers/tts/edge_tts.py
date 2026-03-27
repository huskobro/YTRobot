"""Microsoft Edge TTS provider — free, no API key, word-level timing.

Uses the `edge-tts` package which wraps the Microsoft Edge Read Aloud service.

Set in .env:
  EDGE_TTS_VOICE=tr-TR-AhmetNeural   (see `edge-tts --list-voices` for full list)

Notable Turkish voices:
  tr-TR-AhmetNeural   (male)
  tr-TR-EmelNeural    (female)

Notable English voices:
  en-US-GuyNeural     (male)
  en-US-JennyNeural   (female)
  en-GB-RyanNeural    (male, British)

Word-level timing data is saved as <audio_stem>.word_timing.json alongside the
audio file, compatible with the existing karaoke subtitle system.
"""
import asyncio
import json
import logging
from pathlib import Path

from providers.tts.base import BaseTTSProvider, clean_for_tts, trim_silence
from config import settings

logger = logging.getLogger("EdgeTTS")


class EdgeTTSProvider(BaseTTSProvider):
    """Microsoft Edge TTS — free, no API key, word-level timing."""

    def synthesize(self, text: str, output_path: Path) -> Path:
        import edge_tts

        voice = getattr(settings, 'edge_tts_voice', 'tr-TR-AhmetNeural')
        speed = getattr(settings, 'tts_speed', 1.0)
        remove_apostrophes = getattr(settings, 'tts_remove_apostrophes', True)
        do_trim = getattr(settings, 'tts_trim_silence', False)

        cleaned = clean_for_tts(text, remove_apostrophes=remove_apostrophes)

        # Build rate string for edge-tts (e.g., "+20%" for 1.2x speed)
        rate_pct = int((speed - 1.0) * 100)
        rate_str = f"{rate_pct:+d}%"  # always include sign (+0%, +20%, -10%)

        word_timings: list[dict] = []

        async def _generate() -> None:
            communicate = edge_tts.Communicate(cleaned, voice, rate=rate_str)

            output_path.parent.mkdir(parents=True, exist_ok=True)
            with open(str(output_path), "wb") as f:
                async for chunk in communicate.stream():
                    if chunk["type"] == "audio":
                        f.write(chunk["data"])
                    elif chunk["type"] == "WordBoundary":
                        # Edge TTS provides timing in 100-nanosecond units
                        offset_sec = chunk["offset"] / 10_000_000
                        duration_sec = chunk["duration"] / 10_000_000
                        word_timings.append({
                            "word": chunk["text"],
                            "startSec": round(offset_sec, 4),
                            "endSec": round(offset_sec + duration_sec, 4),
                        })

        # edge-tts is fully async; run it safely regardless of whether an
        # event loop is already running (e.g. inside FastAPI / uvicorn).
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # Running inside an async context (FastAPI) — use a thread
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
                    pool.submit(lambda: asyncio.run(_generate())).result()
            else:
                loop.run_until_complete(_generate())
        except RuntimeError:
            # Fallback: no current event loop
            asyncio.run(_generate())

        if not output_path.exists() or output_path.stat().st_size < 500:
            raise RuntimeError(
                f"Edge TTS failed to generate audio for: {cleaned[:60]}..."
            )

        logger.info(
            "[EdgeTTS] Generated %s (%d bytes, %d words)",
            output_path.name,
            output_path.stat().st_size,
            len(word_timings),
        )

        # Persist word timings for karaoke subtitle sync
        if word_timings:
            timing_path = output_path.with_suffix(".word_timing.json")
            timing_path.write_text(
                json.dumps(word_timings, indent=2, ensure_ascii=False)
            )
            logger.info("[EdgeTTS] Word timing saved: %s", timing_path.name)

        if do_trim:
            trim_silence(output_path)

        return output_path
