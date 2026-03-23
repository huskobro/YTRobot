"""TTS stage: converts scene narrations to audio files."""
from pathlib import Path
from config import settings
from pipeline.script import Scene
from providers.tts.base import BaseTTSProvider


def _load_provider() -> BaseTTSProvider:
    if settings.tts_provider == "elevenlabs":
        from providers.tts.elevenlabs import ElevenLabsTTSProvider
        return ElevenLabsTTSProvider()
    elif settings.tts_provider == "openai":
        from providers.tts.openai_tts import OpenAITTSProvider
        return OpenAITTSProvider()
    elif settings.tts_provider == "speshaudio":
        from providers.tts.speshaudio import SpeshAudioTTSProvider
        return SpeshAudioTTSProvider()
    else:
        raise ValueError(f"Unknown TTS provider: {settings.tts_provider!r}")


def synthesize_scenes(scenes: list[Scene], session_dir: Path) -> list[Path]:
    """Synthesize audio for each scene. Returns list of audio file paths (same order as scenes)."""
    audio_dir = session_dir / "audio"
    audio_dir.mkdir(parents=True, exist_ok=True)
    provider = _load_provider()
    audio_paths = []
    for i, scene in enumerate(scenes):
        out = audio_dir / f"scene_{i:03d}.mp3"
        if out.exists():
            print(f"  [TTS] Scene {i} already exists, skipping.")
        else:
            print(f"  [TTS] Synthesizing scene {i}...")
            provider.synthesize(scene.narration, out)
        audio_paths.append(out)
    return audio_paths
