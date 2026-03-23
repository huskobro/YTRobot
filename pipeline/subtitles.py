"""Subtitles stage: SRT file + word-level timing via Whisper forced alignment.

Alignment strategy
──────────────────
Whisper runs on the actual TTS audio with word_timestamps=True and an
initial_prompt seeded with the script narration (biases Whisper toward the
known text, reduces hallucination).

For timing we rely on Whisper's *segment* boundaries (highly accurate) rather
than individual word boundaries (can drift in agglutinative languages like
Turkish).  Each script word is assigned a timestamp by:

  1. Building a piecewise-linear map: (whisper_text_char_fraction → audio_sec)
     using segment start/end times as anchor points.
  2. Computing the script word's character fraction within the full narration.
  3. Looking up the corresponding audio time via the anchor map.

This gives smooth, anchor-corrected timing that stays in sync even when
Whisper word-splits differ from the script (very common in Turkish).
"""
import json
import re
import subprocess
from pathlib import Path
from typing import Any, Optional

import whisper  # type: ignore  # pyre-ignore[21]

from pipeline.script import Scene  # type: ignore  # pyre-ignore[21]


def _r4(x: float) -> float:
    """Round to 4 decimal places — workaround for Pyre2 round() overload bug."""
    return round(round(x * 10000)) / 10000

_whisper_model: Optional[Any] = None


def _get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        print("  [Subtitles] Loading Whisper model (base)...")
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
    result = model.transcribe(
        str(audio_path),
        word_timestamps=True,
        initial_prompt=scene.narration,
    )
    cache_file.write_text(json.dumps(result, ensure_ascii=False), encoding="utf-8")
    return result


def _normalize_word(text: str) -> str:
    """Lowercase + strip all non-alphanumeric chars for fuzzy matching."""
    return re.sub(r"[^\w]", "", text.lower().strip())


# ── Segment-anchored alignment (fallback) ────────────────────────────────────

def _build_anchors(segs: list) -> list:
    """Return [(text_frac, audio_sec)] anchor points from Whisper segments.

    The first anchor is (0.0, first_segment_start).
    Each subsequent anchor marks the END of a segment mapped to the cumulative
    fraction of Whisper text characters at that point.
    """
    if not segs:
        return [(0.0, 0.0), (1.0, 0.0)]

    # Total whisper text length (used to compute per-segment text fractions)
    total_w_chars = sum(len(s.get("text", "").strip()) + 1 for s in segs)
    total_w_chars = max(total_w_chars, 1)

    anchors = [(0.0, float(segs[0]["start"]))]
    char_pos = 0
    for seg in segs:
        char_pos += len(seg.get("text", "").strip()) + 1
        anchors.append((char_pos / total_w_chars, float(seg["end"])))
    return anchors


def _anchor_lookup(frac: float, anchors: list) -> float:
    """Linearly interpolate audio time from a [0..1] text fraction."""
    frac = max(0.0, min(1.0, frac))
    for i in range(len(anchors) - 1):
        f0, t0 = anchors[i]
        f1, t1 = anchors[i + 1]
        if f0 <= frac <= f1:
            span = f1 - f0
            if span < 1e-9:
                return t0
            return t0 + (frac - f0) / span * (t1 - t0)
    return anchors[-1][1]


def _align_words_anchored(script_text: str, whisper_result: dict) -> "list[dict[str, Any]]":
    """Fallback: segment-anchored character-fraction mapping.

    Used when Whisper provides no word-level timestamps (rare).
    """
    segs = whisper_result.get("segments", [])
    script_words = script_text.split()
    if not script_words or not segs:
        return []

    anchors = _build_anchors(segs)
    total_chars = max(len(script_text), 1)

    aligned: list[dict[str, Any]] = []
    char_pos = 0
    for word in script_words:
        frac_start = char_pos / total_chars
        frac_end = (char_pos + len(word)) / total_chars
        aligned.append({
            "word": word,
            "startSec": _r4(_anchor_lookup(frac_start, anchors)),
            "endSec":   _r4(_anchor_lookup(frac_end,   anchors)),
        })
        char_pos += len(word) + 1

    for i in range(len(aligned) - 1):
        aligned[i]["endSec"] = aligned[i + 1]["startSec"]

    return aligned


def _align_words(script_text: str, whisper_result: dict) -> "list[dict[str, Any]]":
    """Map each script word to its audio timestamp.

    Primary strategy: use Whisper's actual per-word timestamps (word_timestamps=True).
    These are the same timestamps pycaps uses — they reflect when each word was
    actually spoken in the audio, giving frame-accurate karaoke sync.

    Script words are matched to Whisper words by normalized text (lowercase,
    punctuation stripped).  Unmatched script words (e.g. words the TTS dropped or
    words added via LLM enhancement) are filled in by linear interpolation between
    their nearest matched neighbours.

    Falls back to segment-anchored interpolation only when Whisper returns no
    word-level data at all (extremely rare with word_timestamps=True).
    """
    segs = whisper_result.get("segments", [])
    script_words = script_text.split()
    if not script_words or not segs:
        return []

    # ── 1. Collect Whisper word entries ──────────────────────────────────────
    wh_words: list[dict[str, Any]] = []
    for seg in segs:
        seg_words = seg["words"] if "words" in seg else []  # pyre-ignore
        for w in seg_words:  # pyre-ignore
            txt = str(w["word"]).strip() if "word" in w else ""  # pyre-ignore
            if not txt:
                continue
            wh_words.append({
                "norm":  _normalize_word(txt),
                "start": float(w["start"]) if "start" in w else 0.0,  # pyre-ignore
                "end":   float(w["end"]) if "end" in w else 0.0,  # pyre-ignore
            })

    if not wh_words:
        return _align_words_anchored(script_text, whisper_result)

    # ── 2. Fix zero-duration and non-monotonic entries ────────────────────────
    for i, w in enumerate(wh_words):
        if w["end"] <= w["start"]:
            nxt = wh_words[i + 1]["start"] if i + 1 < len(wh_words) else w["start"] + 0.15
            w["end"] = max(w["start"] + 0.05, nxt)

    for i in range(1, len(wh_words)):
        if wh_words[i]["start"] <= wh_words[i - 1]["start"]:
            wh_words[i]["start"] = wh_words[i - 1]["start"] + 0.01
        if wh_words[i]["end"] <= wh_words[i]["start"]:
            wh_words[i]["end"] = wh_words[i]["start"] + 0.05

    # ── 3. Greedily match each script word to a Whisper word ─────────────────
    timestamps: list[Optional[tuple[float, float]]] = [None] * len(script_words)
    w_idx = 0
    for s_idx, sw in enumerate(script_words):
        norm_s = _normalize_word(sw)
        # Search up to 6 positions ahead to tolerate insertions/deletions
        for lookahead in range(min(7, len(wh_words) - w_idx)):  # pyre-ignore
            j = w_idx + lookahead  # pyre-ignore
            if j >= len(wh_words):
                break
            if wh_words[j]["norm"] == norm_s:
                timestamps[s_idx] = (wh_words[j]["start"], wh_words[j]["end"])
                w_idx = j + 1
                break

    # ── 4. Interpolate timestamps for unmatched script words ─────────────────
    matched: list[tuple[int, tuple[float, float]]] = [
        (i, t) for i, t in enumerate(timestamps) if t is not None  # pyre-ignore
    ]

    if not matched:
        return _align_words_anchored(script_text, whisper_result)

    total_dur = float(segs[-1]["end"]) if segs else 5.0

    for s_idx in range(len(script_words)):
        if timestamps[s_idx] is not None:
            continue
        left  = next((m for m in reversed(matched) if m[0] < s_idx), None)
        right = next((m for m in matched          if m[0] > s_idx), None)
        if left and right:
            li, lt = left;  ri, rt = right
            span = ri - li
            pos  = s_idx - li
            t0 = lt[1] + (rt[0] - lt[1]) * (pos / span)
            t1 = lt[1] + (rt[0] - lt[1]) * ((pos + 1) / span)
        elif left:
            offset = s_idx - left[0]
            t0 = min(left[1][1] + offset * 0.25, total_dur)
            t1 = min(t0 + 0.25, total_dur)
        else:
            ri, rt = right  # type: ignore
            count = ri - s_idx
            t0 = max(0.0, rt[0] - count * 0.25)
            t1 = t0 + 0.25
        timestamps[s_idx] = (_r4(t0), _r4(t1))

    # ── 5. Build result and close gaps ────────────────────────────────────────
    aligned: list[dict[str, Any]] = []
    for s_idx, sw in enumerate(script_words):
        t = timestamps[s_idx]
        assert t is not None  # pyre-ignore
        aligned.append({"word": sw, "startSec": _r4(t[0]), "endSec": _r4(max(t[0] + 0.01, t[1]))})

    # Close gaps so karaoke has no dead (un-highlighted) frames
    for i in range(len(aligned) - 1):
        aligned[i]["endSec"] = aligned[i + 1]["startSec"]

    return aligned


# ── Public pipeline functions ────────────────────────────────────────────────

def generate_srt(audio_paths: list, scenes: list, session_dir: Path) -> Path:
    """Build SRT from Whisper timing, preserving exact script text."""
    srt_path = session_dir / "subtitles.srt"
    srt_lines: list[str] = []
    index: int = 1
    time_offset: float = 0.0

    for i, (audio_path, scene) in enumerate(zip(audio_paths, scenes)):
        print(f"  [Subtitles] Aligning scene {i} with Whisper...")
        duration: float = _audio_duration(audio_path)
        if duration <= 0:
            continue

        result = _get_transcription(audio_path, scene, session_dir)
        aligned: list[dict[str, Any]] = list(_align_words(scene.narration, result))

        # Group into ~3-word chunks for one subtitle line at a time
        chunk_size = 3
        for ci in range(0, len(aligned), chunk_size):
            chunk: list[dict[str, Any]] = aligned[ci : ci + chunk_size]  # pyre-ignore[no-matching-overload]
            if not chunk:
                continue
            c_text  = " ".join(str(w["word"]) for w in chunk)
            c_start: float = time_offset + float(chunk[0]["startSec"])  # pyre-ignore
            c_end:   float = time_offset + float(chunk[-1]["endSec"])  # pyre-ignore
            # Guard: end must be strictly after start
            if c_end <= c_start:
                c_end = c_start + max(0.3, duration / max(len(aligned), 1) * chunk_size)

            srt_lines.append(str(index))
            srt_lines.append(f"{_format_timestamp(c_start)} --> {_format_timestamp(c_end)}")
            srt_lines.append(c_text)
            srt_lines.append("")
            index += 1  # pyre-ignore

        time_offset += duration  # pyre-ignore

    srt_path.write_text("\n".join(srt_lines), encoding="utf-8")
    print(f"  [Subtitles] Written to {srt_path}")
    return srt_path


def generate_word_timing(
    audio_paths: list, scenes: list, session_dir: Path, fps: int = 30
) -> Path:
    """Generate per-word timing JSON for karaoke highlighting.

    Output format (word_timing.json):
    [
      {
        "scene": 0,
        "startSec": 0.0,
        "chunks": [
          {
            "text": "Hello world foo",
            "startSec": 0.0,
            "endSec": 1.5,
            "words": [{"word": "Hello", "startSec": 0.0, "endSec": 0.5}, ...]
          },
          ...
        ]
      },
      ...
    ]

    Each chunk corresponds exactly to one SRT subtitle entry (3-word groups).
    This eliminates the need for time-based word-to-subtitle matching in the
    composer, preventing duplicate words at chunk boundaries.
    """
    word_timing_path = session_dir / "word_timing.json"
    all_scenes = []
    time_offset = 0.0
    chunk_size = 3  # must match generate_srt

    for i, (audio_path, scene) in enumerate(zip(audio_paths, scenes)):
        duration = _audio_duration(audio_path)
        chunks = []

        if duration > 0:
            result = _get_transcription(audio_path, scene, session_dir)
            aligned = _align_words(scene.narration, result)

            for ci in range(0, len(aligned), chunk_size):
                chunk_words = aligned[ci : ci + chunk_size]  # pyre-ignore[no-matching-overload]
                if not chunk_words:
                    continue
                chunk_text = " ".join(str(w["word"]) for w in chunk_words)
                c_start = _r4(time_offset + float(chunk_words[0]["startSec"]))  # pyre-ignore
                c_end = _r4(time_offset + float(chunk_words[-1]["endSec"]))  # pyre-ignore
                if c_end <= c_start:
                    c_end = _r4(c_start + 0.5)
                words = []
                for w in chunk_words:
                    words.append({
                        "word":     w["word"],
                        "startSec": _r4(time_offset + float(w["startSec"])),  # pyre-ignore
                        "endSec":   _r4(time_offset + float(w["endSec"])),  # pyre-ignore
                    })
                chunks.append({
                    "text":     chunk_text,
                    "startSec": c_start,
                    "endSec":   c_end,
                    "words":    words,
                })

        all_scenes.append({
            "scene":    i,
            "startSec": _r4(time_offset),
            "chunks":   chunks,
        })
        time_offset += duration

    word_timing_path.write_text(
        json.dumps(all_scenes, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(f"  [Subtitles] Word timing written to {word_timing_path}")
    return word_timing_path
