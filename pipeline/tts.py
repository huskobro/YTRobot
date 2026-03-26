"""TTS stage: converts scene narrations to audio files."""
import subprocess
from pathlib import Path
from config import settings
from pipeline.script import Scene
from providers.tts.base import BaseTTSProvider


def _load_provider(provider_name: str | None = None) -> BaseTTSProvider:
    name = provider_name or settings.tts_provider
    if name == "elevenlabs":
        from providers.tts.elevenlabs import ElevenLabsTTSProvider
        return ElevenLabsTTSProvider()
    elif name == "openai":
        from providers.tts.openai_tts import OpenAITITTSProvider
        from providers.tts.openai_tts import OpenAITTSProvider
        return OpenAITTSProvider()
    elif name == "speshaudio":
        from providers.tts.speshaudio import SpeshAudioTTSProvider
        return SpeshAudioTTSProvider()
    elif name == "qwen3":
        from providers.tts.qwen3 import Qwen3TTSProvider
        return Qwen3TTSProvider()
    else:
        raise ValueError(f"Unknown TTS provider: {name!r}")


def synthesize_scenes(scenes: list[Scene], session_dir: Path) -> list[Path]:
    """Synthesize audio for each scene. Returns list of audio file paths (same order as scenes)."""
    audio_dir = session_dir / "audio"
    audio_dir.mkdir(parents=True, exist_ok=True)
    
    # Effective settings for YT module
    provider_name = settings.yt_tts_provider or settings.tts_provider
    
    # Resolve effective voice ID based on provider
    voice_id = None
    if provider_name == "elevenlabs":
        voice_id = settings.yt_elevenlabs_voice_id or settings.yt_tts_voice_id or settings.elevenlabs_voice_id
    elif provider_name == "openai":
        voice_id = settings.yt_openai_tts_voice or settings.openai_tts_voice
    elif provider_name == "speshaudio":
        voice_id = settings.yt_speshaudio_voice_id or settings.yt_tts_voice_id or settings.speshaudio_voice_id
    else:
        # Fallback for others (google, qwen3 handle theirs differently or use defaults)
        voice_id = settings.yt_tts_voice_id or None
    
    provider = _load_provider(provider_name)
    if voice_id and hasattr(provider, "voice_id"):
        provider.voice_id = voice_id

    # Qwen3-specific overrides
    syn_kwargs = {}
    if provider_name == "qwen3":
        syn_kwargs.update({
            "model_id": settings.yt_qwen3_model_id or settings.qwen3_model_id,
            "model_type": settings.yt_qwen3_model_type or settings.qwen3_model_type,
            "voice_instruct": settings.yt_qwen3_voice_instruct or settings.qwen3_voice_instruct,
            "device": settings.yt_qwen3_device or settings.qwen3_device,
        })

    # If both humanize+enhance were already combined in the script stage, skip here
    combined_already_done = settings.script_humanize_with_llm and settings.tts_enhance_with_llm
    do_enhance = settings.tts_enhance_with_llm and not combined_already_done
    if do_enhance:
        from pipeline.script import enhance_narration_for_tts
        print("  [TTS] Enhancing narrations with Gemini (emphasis + pauses)...")

    audio_paths = []
    for i, scene in enumerate(scenes):
        out = audio_dir / f"scene_{i:03d}.mp3"
        if out.exists():
            print(f"  [TTS] Scene {i} already exists, skipping.")
        else:
            narration = scene.narration
            if do_enhance:
                narration = enhance_narration_for_tts(narration)
                print(f"  [TTS] Scene {i} enhanced → sending to TTS...")
            else:
                print(f"  [TTS] Synthesizing scene {i}...")
            try:
                provider.synthesize(narration, out, **syn_kwargs)
            except Exception as e:
                print(f"  [TTS] ⚠ Scene {i} synthesis failed: {e}")
                print(f"  [TTS] Generating silent placeholder for scene {i}...")
                _generate_silent_audio(out, duration=3.0)

        if out.exists():
            audio_paths.append(out)
        else:
            print(f"  [TTS] ⚠ Scene {i} audio missing, generating silent placeholder...")
            _generate_silent_audio(out, duration=3.0)
            audio_paths.append(out)
    return audio_paths


def _generate_silent_audio(path: Path, duration: float = 3.0) -> None:
    """Generate a silent MP3 file as a placeholder."""
    path.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            "ffmpeg", "-y", "-f", "lavfi",
            "-i", f"anullsrc=r=44100:cl=mono",
            "-t", str(duration),
            "-q:a", "9",
            str(path),
        ],
        capture_output=True,
    )
