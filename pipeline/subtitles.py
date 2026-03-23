"""Subtitles stage: builds an SRT file from script narration text + audio timing.

Uses ffprobe (bundled with ffmpeg) to measure each scene's audio duration, then
distributes subtitle segments proportionally by character count — no Whisper needed.
This guarantees subtitles match the script exactly with no transcription errors.
"""
import json
import re
import subprocess
from pathlib import Path

from pipeline.script import Scene


def _format_timestamp(seconds: float) -> str:
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    ms = int((seconds % 1) * 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def _audio_duration(path: Path) -> float:
    """Return duration of audio file in seconds using ffprobe."""
    r = subprocess.run(
        ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_streams", str(path)],
        capture_output=True, text=True,
    )
    try:
        streams = json.loads(r.stdout).get("streams", [])
        if streams:
            return float(streams[0].get("duration", 0))
    except Exception:
        pass
    return 0.0


def _clean_for_subtitles(text: str) -> str:
    """Strip TTS markers so subtitles look like normal readable text."""
    # ALL-CAPS emphasis words → title case (e.g. AMAZING → Amazing)
    text = re.sub(r'\b([A-Z]{2,})\b', lambda m: m.group(1).capitalize(), text)
    # Replace slash alternatives with "or"
    text = re.sub(r'\s*/\s*', ' or ', text)
    # Collapse multiple spaces
    text = re.sub(r' {2,}', ' ', text)
    return text.strip()


def _split_sentences(text: str) -> list[str]:
    """Split text into subtitle-friendly chunks (by sentence, max ~80 chars)."""
    # Split on sentence-ending punctuation
    raw = re.split(r'(?<=[.!?])\s+', text.strip())
    chunks = []
    for part in raw:
        part = part.strip()
        if not part:
            continue
        # If a sentence is very long, split further at commas
        if len(part) > 80:
            sub = re.split(r',\s+', part)
            buf = ""
            for s in sub:
                if buf and len(buf) + len(s) > 75:
                    chunks.append(buf.rstrip(", "))
                    buf = s
                else:
                    buf = (buf + ", " + s).lstrip(", ") if buf else s
            if buf:
                chunks.append(buf)
        else:
            chunks.append(part)
    return [c for c in chunks if c]


def generate_srt(audio_paths: list[Path], scenes: list[Scene], session_dir: Path) -> Path:
    """Build SRT from script narration, timed by audio duration via ffprobe."""
    srt_path = session_dir / "subtitles.srt"
    srt_lines: list[str] = []
    index = 1
    time_offset = 0.0

    for i, (audio_path, scene) in enumerate(zip(audio_paths, scenes)):
        print(f"  [Subtitles] Timing scene {i}...")
        duration = _audio_duration(audio_path)

        narration = _clean_for_subtitles(scene.narration)
        sentences = _split_sentences(narration)

        if not sentences or duration <= 0:
            time_offset += duration
            continue

        total_chars = sum(len(s) for s in sentences)
        seg_start = time_offset

        for sent in sentences:
            weight = len(sent) / total_chars if total_chars > 0 else 1 / len(sentences)
            seg_end = seg_start + duration * weight
            srt_lines.append(str(index))
            srt_lines.append(f"{_format_timestamp(seg_start)} --> {_format_timestamp(seg_end)}")
            srt_lines.append(sent)
            srt_lines.append("")
            index += 1
            seg_start = seg_end

        time_offset += duration

    srt_path.write_text("\n".join(srt_lines), encoding="utf-8")
    print(f"  [Subtitles] Written to {srt_path}")
    return srt_path


def generate_word_timing(
    audio_paths: list[Path], scenes: list[Scene], session_dir: Path, fps: int = 30
) -> Path:
    """Generate per-word timing JSON for karaoke-style subtitle highlighting.

    Output format (word_timing.json):
    [
      {                          # one entry per scene
        "scene": 0,
        "startSec": 0.0,
        "words": [
          {"word": "Hello", "startSec": 0.0, "endSec": 0.35},
          ...
        ]
      },
      ...
    ]
    """
    word_timing_path = session_dir / "word_timing.json"
    all_scenes: list[dict] = []
    time_offset = 0.0

    for i, (audio_path, scene) in enumerate(zip(audio_paths, scenes)):
        duration = _audio_duration(audio_path)
        narration = _clean_for_subtitles(scene.narration)
        sentences = _split_sentences(narration)

        scene_words: list[dict] = []

        if not sentences or duration <= 0:
            all_scenes.append({
                "scene": i,
                "startSec": time_offset,
                "words": [],
            })
            time_offset += duration
            continue

        # Distribute duration across sentences proportionally by char count
        total_chars = sum(len(s) for s in sentences)
        sent_start = time_offset

        for sent in sentences:
            sent_weight = len(sent) / total_chars if total_chars > 0 else 1 / len(sentences)
            sent_duration = duration * sent_weight
            sent_end = sent_start + sent_duration

            # Split sentence into words and distribute time proportionally
            words = sent.split()
            if not words:
                sent_start = sent_end
                continue

            word_total_chars = sum(len(w) for w in words)
            word_cursor = sent_start

            for w in words:
                w_weight = len(w) / word_total_chars if word_total_chars > 0 else 1 / len(words)
                w_duration = sent_duration * w_weight
                scene_words.append({
                    "word": w,
                    "startSec": round(word_cursor, 4),
                    "endSec": round(word_cursor + w_duration, 4),
                })
                word_cursor += w_duration

            sent_start = sent_end

        all_scenes.append({
            "scene": i,
            "startSec": round(time_offset, 4),
            "words": scene_words,
        })
        time_offset += duration

    word_timing_path.write_text(json.dumps(all_scenes, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"  [Subtitles] Word timing written to {word_timing_path}")
    return word_timing_path
