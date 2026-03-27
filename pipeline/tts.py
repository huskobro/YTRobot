"""TTS stage: converts scene narrations to audio files."""
import concurrent.futures
import logging
import subprocess
from pathlib import Path
from config import settings
from pipeline.script import Scene
from providers.tts.base import BaseTTSProvider

logger = logging.getLogger(__name__)


def _load_provider(provider_name: str | None = None) -> BaseTTSProvider:
    name = provider_name or settings.tts_provider
    if name == "elevenlabs":
        from providers.tts.elevenlabs import ElevenLabsTTSProvider
        return ElevenLabsTTSProvider()
    elif name == "openai":
        from providers.tts.openai_tts import OpenAITTSProvider
        return OpenAITTSProvider()
    elif name == "speshaudio":
        from providers.tts.speshaudio import SpeshAudioTTSProvider
        return SpeshAudioTTSProvider()
    elif name == "qwen3":
        from providers.tts.qwen3 import Qwen3TTSProvider
        return Qwen3TTSProvider()
    elif name == "edge":
        from providers.tts.edge_tts import EdgeTTSProvider
        return EdgeTTSProvider()
    elif name == "dubvoice":
        from providers.tts.dubvoice import DubVoiceTTSProvider
        return DubVoiceTTSProvider()
    else:
        raise ValueError(f"Unknown TTS provider: {name!r}")


def synthesize_scenes(scenes: list[Scene], session_dir: Path) -> list[Path]:
    """Synthesize audio for each scene. Returns list of audio file paths (same order as scenes).

    Uses concurrent processing when ``settings.tts_concurrent_workers > 1``.
    """
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

    # Qwen3-specific overrides
    syn_kwargs: dict = {}
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

    # Pre-enhance all narrations when needed (must happen before threading)
    narrations: list[str] = []
    for i, scene in enumerate(scenes):
        narration = scene.narration
        if do_enhance:
            narration = enhance_narration_for_tts(narration)
            print(f"  [TTS] Scene {i} enhanced → queued for TTS...")
        narrations.append(narration)

    max_workers = settings.tts_concurrent_workers
    if max_workers > 1 and len(scenes) > 1:
        audio_paths = _synthesize_concurrent(
            scenes, narrations, audio_dir, provider_name, voice_id, syn_kwargs,
            max_workers=max_workers,
        )
    else:
        audio_paths = _synthesize_sequential(
            scenes, narrations, audio_dir, provider_name, voice_id, syn_kwargs,
        )

    return audio_paths


def _synthesize_sequential(
    scenes: list[Scene],
    narrations: list[str],
    audio_dir: Path,
    provider_name: str,
    voice_id: str | None,
    syn_kwargs: dict,
) -> list[Path]:
    """Process scenes one by one (original behaviour)."""
    provider = _load_provider(provider_name)
    if voice_id and hasattr(provider, "voice_id"):
        provider.voice_id = voice_id

    audio_paths: list[Path] = []
    for i, (scene, narration) in enumerate(zip(scenes, narrations)):
        out = audio_dir / f"scene_{i:03d}.mp3"
        if out.exists():
            print(f"  [TTS] Scene {i} already exists, skipping.")
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


def _synthesize_concurrent(
    scenes: list[Scene],
    narrations: list[str],
    audio_dir: Path,
    provider_name: str,
    voice_id: str | None,
    syn_kwargs: dict,
    max_workers: int = 3,
) -> list[Path]:
    """Process multiple scenes' TTS in parallel using a thread pool."""
    max_w = min(max_workers, len(scenes))
    print(f"  [TTS] Concurrent mode: {max_w} workers for {len(scenes)} scenes.")

    results: list[Path | None] = [None] * len(scenes)

    def process_scene(idx: int, narration: str) -> tuple[int, Path | None]:
        out = audio_dir / f"scene_{idx:03d}.mp3"
        if out.exists():
            logger.info("Scene %d already exists, skipping.", idx)
            return idx, out
        try:
            # Each thread gets its own provider instance to avoid shared-state issues
            thread_prov = _load_provider(provider_name)
            if voice_id and hasattr(thread_prov, "voice_id"):
                thread_prov.voice_id = voice_id
            thread_prov.synthesize(narration, out, **syn_kwargs)
            return idx, out
        except Exception as exc:
            logger.error("Concurrent TTS failed for scene %d: %s", idx, exc)
            print(f"  [TTS] ⚠ Scene {idx} synthesis failed (concurrent): {exc}")
            print(f"  [TTS] Generating silent placeholder for scene {idx}...")
            _generate_silent_audio(out, duration=3.0)
            return idx, out if out.exists() else None

    with concurrent.futures.ThreadPoolExecutor(max_workers=max_w) as executor:
        future_map = {
            executor.submit(process_scene, i, narration): i
            for i, narration in enumerate(narrations)
        }
        for future in concurrent.futures.as_completed(future_map):
            idx, path = future.result()
            results[idx] = path

    # Fill any missing slots with silent placeholders
    audio_paths: list[Path] = []
    for i, path in enumerate(results):
        if path is None or not Path(path).exists():
            out = audio_dir / f"scene_{i:03d}.mp3"
            print(f"  [TTS] ⚠ Scene {i} audio missing, generating silent placeholder...")
            _generate_silent_audio(out, duration=3.0)
            audio_paths.append(out)
        else:
            audio_paths.append(Path(path))
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
