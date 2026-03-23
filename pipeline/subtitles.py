"""Subtitles stage: builds an SRT file and verbatim word timing via Whisper.

Uses openai-whisper with word_timestamps=True to ensure subtitles perfectly 
match the spoken audio, solving synchronization issues caused by naive character timing.
"""
import json
import subprocess
from pathlib import Path
import whisper  # type: ignore
from pipeline.script import Scene  # type: ignore

_whisper_model = None


def _get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        print("  [Subtitles] Loading Whisper model (base) for precise sync...")
        _whisper_model = whisper.load_model("base")
    return _whisper_model


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


def _get_transcription(audio_path: Path, scene: Scene, session_dir: Path) -> dict:
    """Run Whisper on a single scene audio and cache the result."""
    cache_file = session_dir / f"{audio_path.stem}_transcription.json"
    if cache_file.exists():
        return json.loads(cache_file.read_text(encoding="utf-8"))
    
    model = _get_whisper_model()
    # pass initial_prompt to heavily biased whisper toward the actual script
    result = model.transcribe(
        str(audio_path), 
        word_timestamps=True, 
        initial_prompt=scene.narration
    )
    
    cache_file.write_text(json.dumps(result, ensure_ascii=False), encoding="utf-8")
    return result


def _align_words(script_text: str, whisper_words: list[dict]) -> list[dict]:
    """Force-align script exact text with Whisper timestamps based on linear proportional positioning."""
    script_parts = script_text.split()
    aligned = []
    
    s_len = len(script_parts)
    w_len = len(whisper_words)
    
    for i, s_word in enumerate(script_parts):
        # Linearly interpolate to find the closest whisper word index
        w_idx = int(i * w_len / s_len) if s_len > 0 and w_len > 0 else 0
        w_idx = min(w_idx, max(0, w_len - 1))
        
        if w_len > 0:
            w_start = float(whisper_words[w_idx].get("start", 0.0))
            w_end = float(whisper_words[w_idx].get("end", 0.0))
        else:
            w_start, w_end = 0.0, 0.5
            
        aligned.append({
            "word": s_word,
            "startSec": float(f"{w_start:.4f}"),
            "endSec": float(f"{w_end:.4f}")
        })
    return aligned


def generate_srt(audio_paths: list[Path], scenes: list[Scene], session_dir: Path) -> Path:
    """Build SRT from Whisper word-level timestamps, forced to match true Script text."""
    srt_path = session_dir / "subtitles.srt"
    srt_lines: list[str] = []
    index: int = 1
    time_offset: float = 0.0

    for i, (audio_path, scene) in enumerate(zip(audio_paths, scenes)):
        print(f"  [Subtitles] Timing scene {i} with Whisper (Forced Alignment)...")
        duration = float(_audio_duration(audio_path))
        
        if duration <= 0:
            continue
            
        result = _get_transcription(audio_path, scene, session_dir)
        
        # Flatten all whisper words from all segments
        all_w_words = []
        for seg in result.get("segments", []):
            all_w_words.extend(seg.get("words", []))
            
        aligned = _align_words(scene.narration, all_w_words)
        
        # Group into ~3 word chunks for 1-line max SRT
        chunk_size = 3
        for chunk_idx in range(0, len(aligned), chunk_size):
            chunk = aligned[chunk_idx:chunk_idx + chunk_size]  # type: ignore
            if not chunk:
                continue
            
            c_text = " ".join([w["word"] for w in chunk])
            c_start = float(time_offset) + float(chunk[0]["startSec"])    # type: ignore
            c_end = float(time_offset) + float(chunk[-1]["endSec"])       # type: ignore
            
            srt_lines.append(str(index))
            srt_lines.append(f"{_format_timestamp(c_start)} --> {_format_timestamp(c_end)}")
            srt_lines.append(c_text)
            srt_lines.append("")
            index = int(index) + 1  # type: ignore

        time_offset = float(time_offset) + duration  # type: ignore

    srt_path.write_text("\n".join(srt_lines), encoding="utf-8")
    print(f"  [Subtitles] Written to {srt_path}")
    return srt_path


def generate_word_timing(
    audio_paths: list[Path], scenes: list[Scene], session_dir: Path, fps: int = 30
) -> Path:
    """Generate per-word timing JSON for karaoke-style subtitle highlighting.

    Output format (word_timing.json):
    [
      { "scene": 0, "startSec": 0.0, "words": [ { "word": "Hello", "startSec":..., "endSec":... } ] }, ...
    ]
    """
    word_timing_path = session_dir / "word_timing.json"
    all_scenes: list[dict] = []
    time_offset: float = 0.0

    for i, (audio_path, scene) in enumerate(zip(audio_paths, scenes)):
        duration = float(_audio_duration(audio_path))
        scene_words: list[dict] = []
        
        if duration > 0:
            result = _get_transcription(audio_path, scene, session_dir)
            
            # Flatten all whisper words
            all_w_words = []
            for seg in result.get("segments", []):
                all_w_words.extend(seg.get("words", []))
                
            aligned = _align_words(scene.narration, all_w_words)
            
            for w in aligned:
                w_start = float(time_offset) + float(w["startSec"])  # type: ignore
                w_end = float(time_offset) + float(w["endSec"])      # type: ignore
                scene_words.append({
                    "word": str(w["word"]),
                    "startSec": float(f"{w_start:.4f}"),
                    "endSec": float(f"{w_end:.4f}"),
                })

        all_scenes.append({
            "scene": int(i),
            "startSec": float(f"{time_offset:.4f}"),
            "words": scene_words,
        })
        time_offset = float(time_offset) + duration  # type: ignore

    word_timing_path.write_text(json.dumps(all_scenes, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"  [Subtitles] Word timing written to {word_timing_path}")
    return word_timing_path
