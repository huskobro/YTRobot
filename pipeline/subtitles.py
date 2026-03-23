"""Subtitles stage: generates an SRT file by aligning narration to audio using Whisper."""
from pathlib import Path
from config import settings
from pipeline.script import Scene


def _format_timestamp(seconds: float) -> str:
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    ms = int((seconds % 1) * 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def generate_srt(audio_paths: list[Path], scenes: list[Scene], session_dir: Path) -> Path:
    """Use Whisper to transcribe each scene audio, then build an SRT file."""
    import whisper  # lazy import — only needed for this stage

    model = whisper.load_model("base")
    srt_path = session_dir / "subtitles.srt"
    srt_lines = []
    index = 1
    time_offset = 0.0

    for i, (audio_path, scene) in enumerate(zip(audio_paths, scenes)):
        print(f"  [Subtitles] Transcribing scene {i}...")
        lang = settings.speshaudio_language or None  # None = auto-detect
        result = model.transcribe(str(audio_path), language=lang, word_timestamps=False)
        for seg in result["segments"]:
            start = time_offset + seg["start"]
            end = time_offset + seg["end"]
            text = seg["text"].strip()
            srt_lines.append(str(index))
            srt_lines.append(f"{_format_timestamp(start)} --> {_format_timestamp(end)}")
            srt_lines.append(text)
            srt_lines.append("")
            index += 1
        # Advance offset by the audio duration
        import whisper as _w
        audio = _w.load_audio(str(audio_path))
        time_offset += len(audio) / 16000  # Whisper uses 16kHz

    srt_path.write_text("\n".join(srt_lines), encoding="utf-8")
    print(f"  [Subtitles] Written to {srt_path}")
    return srt_path
