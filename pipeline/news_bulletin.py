"""News Bulletin pipeline.

Converts a list of NewsBulletinItem dicts into a rendered MP4 via:
  1. TTS (speshaudio or any configured provider) for each item's narration text
  2. Whisper word-level alignment → subtitle entries
  3. Remotion render of the NewsBulletin composition

Usage:
    python news_bulletin_main.py --input bulletin.json --output output/bulletin.mp4

bulletin.json schema:
{
  "networkName": "YTRobot Haber",
  "style": "breaking",            // optional: breaking | tech | corporate
  "language": "tr",               // default language override (per-item can override)
  "items": [
    {
      "headline": "SON DAKİKA: ...",
      "subtext": "Açıklama buraya.",
      "narration": "Spiker tarafından okunacak metin.",  // TTS text
      "imageUrl": "https://...",   // optional
      "language": "tr"             // optional per-item override
    }
  ],
  "ticker": [
    {"text": "• Borsa güne artıyla başladı"}
  ]
}
"""
from __future__ import annotations

import contextlib
import http.server
import json
import os
import re
import subprocess
import tempfile
import threading
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Optional

import whisper  # type: ignore

from config import settings
from pipeline.tts import _load_provider  # reuse provider factory
from providers.tts.base import clean_for_tts


# ── Whisper (singleton, loaded once) ─────────────────────────────────────────

_whisper_model: Optional[Any] = None


def _get_whisper():
    global _whisper_model
    if _whisper_model is None:
        print("  [NewsBulletin] Loading Whisper model (base)...")
        _whisper_model = whisper.load_model("base")
    return _whisper_model


def _get_bulletin_tts() -> dict:
    """Return effective TTS settings for bulletin, falling back to global settings."""
    return {
        "provider": settings.bulletin_tts_provider or settings.tts_provider,
        "voice_id": settings.bulletin_tts_voice_id or None,
        "speed": settings.bulletin_tts_speed if settings.bulletin_tts_speed > 0.0 else settings.tts_speed,
        "stability": settings.bulletin_tts_stability if settings.bulletin_tts_stability >= 0.0 else settings.speshaudio_stability,
        "similarity_boost": settings.bulletin_tts_similarity_boost if settings.bulletin_tts_similarity_boost >= 0.0 else settings.speshaudio_similarity_boost,
        "style_val": settings.bulletin_tts_style if settings.bulletin_tts_style >= 0.0 else settings.speshaudio_style,
    }


# ── Data structures ───────────────────────────────────────────────────────────

@dataclass
class BulletinItem:
    headline: str
    narration: str
    subtext: str = ""
    image_url: str = ""
    language: str = ""
    duration_frames: int = 0      # filled after TTS
    audio_path: Optional[Path] = None
    subtitles: list = field(default_factory=list)  # list of SubtitleEntry dicts


# ── HTTP asset server (same pattern as composer.py) ─────────────────────────

@contextlib.contextmanager
def _http_server(directory: Path):
    import socketserver

    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *a, **kw):
            super().__init__(*a, directory=str(directory), **kw)

        def log_message(self, *_):
            pass

    with socketserver.TCPServer(("", 0), Handler) as httpd:
        port = httpd.server_address[1]
        t = threading.Thread(target=httpd.serve_forever, daemon=True)
        t.start()
        try:
            yield port
        finally:
            httpd.shutdown()


# ── TTS ───────────────────────────────────────────────────────────────────────

def _synthesize(item: BulletinItem, out_dir: Path, index: int) -> Path:
    """Run TTS for one bulletin item using bulletin-specific or global TTS settings."""
    bts = _get_bulletin_tts()
    provider = _load_provider(bts["provider"])
    if bts["voice_id"] and hasattr(provider, "voice_id"):
        provider.voice_id = bts["voice_id"]  # type: ignore[attr-defined]
    text = clean_for_tts(item.narration, remove_apostrophes=settings.tts_remove_apostrophes)
    audio_path = out_dir / f"item_{index:02d}.mp3"
    provider.synthesize(text, audio_path)
    return audio_path


# ── Subtitle alignment ────────────────────────────────────────────────────────

def _audio_duration(path: Path) -> float:
    r = subprocess.run(
        ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_streams", str(path)],
        capture_output=True, text=True,
    )
    info = json.loads(r.stdout)
    for s in info.get("streams", []):
        if s.get("codec_type") == "audio":
            return float(s.get("duration", 0))
    return 0.0


def _r4(x: float) -> float:
    return round(round(x * 10000)) / 10000


def _build_anchors(segs):
    full = " ".join(s["text"].strip() for s in segs)
    anchors = []
    offset = 0
    for seg in segs:
        seg_text = seg["text"].strip()
        if not seg_text:
            continue
        frac_start = offset / max(1, len(full))
        frac_end = (offset + len(seg_text)) / max(1, len(full))
        anchors.append((frac_start, seg["start"]))
        anchors.append((frac_end, seg["end"]))
        offset += len(seg_text) + 1
    return anchors


def _anchor_lookup(frac: float, anchors: list) -> float:
    if not anchors:
        return 0.0
    if frac <= anchors[0][0]:
        return anchors[0][1]
    if frac >= anchors[-1][0]:
        return anchors[-1][1]
    for i in range(len(anchors) - 1):
        f0, t0 = anchors[i]
        f1, t1 = anchors[i + 1]
        if f0 <= frac <= f1 and f1 > f0:
            return t0 + (frac - f0) / (f1 - f0) * (t1 - t0)
    return anchors[-1][1]


def _align_subtitles(narration: str, audio_path: Path, fps: int) -> list:
    """Return list of SubtitleEntry dicts with frame-accurate word timing."""
    model = _get_whisper()
    result = model.transcribe(
        str(audio_path),
        word_timestamps=True,
        initial_prompt=narration,
        language=None,  # auto-detect
    )

    segments = result.get("segments", [])
    anchors = _build_anchors(segments)
    total_dur = _audio_duration(audio_path)

    # Split narration into chunks (sentences)
    chunks = [c.strip() for c in re.split(r"(?<=[.!?…])\s+", narration) if c.strip()]
    if not chunks:
        chunks = [narration]

    # Build word list from narration
    all_words = narration.split()
    n = len(all_words)

    # Assign each word a time via anchor interpolation
    word_times: list[float] = []
    for idx, w in enumerate(all_words):
        char_offset = sum(len(w2) + 1 for w2 in all_words[:idx])
        total_chars = max(1, len(narration))
        frac = char_offset / total_chars
        t = _anchor_lookup(frac, anchors)
        word_times.append(t)

    # Build per-chunk subtitle entries
    entries = []
    wi = 0  # global word index
    for chunk in chunks:
        chunk_words = chunk.split()
        if not chunk_words:
            continue
        start_wi = wi
        end_wi = wi + len(chunk_words) - 1

        if start_wi >= n:
            break

        start_sec = word_times[start_wi]
        end_sec = word_times[min(end_wi, n - 1)]

        # Close gap to next entry
        next_start = word_times[min(end_wi + 1, n - 1)] if end_wi + 1 < n else total_dur
        end_sec = next_start

        words_out = []
        for ci, cw in enumerate(chunk_words):
            w_start = word_times[wi] if wi < n else total_dur
            w_end = word_times[wi + 1] if wi + 1 < n else total_dur
            # Close gap
            words_out.append({
                "word": cw,
                "startFrame": int(_r4(w_start) * fps),
                "endFrame": int(_r4(w_end) * fps),
            })
            wi += 1

        entries.append({
            "text": chunk,
            "startFrame": int(_r4(start_sec) * fps),
            "endFrame": int(_r4(end_sec) * fps),
            "words": words_out,
        })

    return entries


# ── Duration calculation ──────────────────────────────────────────────────────

def _frames_for_audio(audio_path: Path, fps: int, padding_frames: int = 30) -> int:
    dur = _audio_duration(audio_path)
    return max(120, int(dur * fps) + padding_frames)


# ── Main pipeline ─────────────────────────────────────────────────────────────

def run_bulletin(
    bulletin_config: dict,
    output_path: Path,
    work_dir: Optional[Path] = None,
    fps: int = 60,
    serve_base: Optional[Path] = None,
) -> Path:
    """Full pipeline: TTS → align → render.

    Args:
        bulletin_config: Parsed JSON matching the bulletin.json schema above.
        output_path: Where to write the final MP4.
        work_dir: Temp directory for audio files. Uses a tempdir if None.
        fps: Frames per second (should match Remotion composition).
        serve_base: Root directory the HTTP server will serve. Defaults to
                    the parent of output_path so audio files are reachable.
    Returns:
        Path to the rendered MP4.
    """
    items_raw = bulletin_config.get("items", [])
    ticker = bulletin_config.get("ticker", [])
    network_name = bulletin_config.get("networkName", "YTRobot Haber")
    style = bulletin_config.get("style", "breaking")
    default_language = bulletin_config.get("language", "")

    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Work dir for audio files
    _tmp_ctx = None
    if work_dir is None:
        _tmp_ctx = tempfile.TemporaryDirectory()
        work_dir = Path(_tmp_ctx.name)
    else:
        work_dir = Path(work_dir)
        work_dir.mkdir(parents=True, exist_ok=True)

    try:
        # Parse items
        bulletin_items: list[BulletinItem] = []
        for raw in items_raw:
            narration = raw.get("narration") or raw.get("subtext") or raw.get("headline", "")
            bi = BulletinItem(
                headline=raw.get("headline", ""),
                narration=narration,
                subtext=raw.get("subtext", ""),
                image_url=raw.get("imageUrl", ""),
                language=raw.get("language", default_language),
            )
            bulletin_items.append(bi)

        print(f"[NewsBulletin] {len(bulletin_items)} items — starting TTS...")

        # Step 1: TTS
        for i, item in enumerate(bulletin_items):
            print(f"  TTS [{i+1}/{len(bulletin_items)}]: {item.headline[:50]}")
            item.audio_path = _synthesize(item, work_dir, i)
            item.duration_frames = _frames_for_audio(item.audio_path, fps)

        # Step 2: Subtitle alignment
        print("[NewsBulletin] Aligning subtitles with Whisper...")
        for i, item in enumerate(bulletin_items):
            print(f"  Align [{i+1}/{len(bulletin_items)}]")
            item.subtitles = _align_subtitles(item.narration, item.audio_path, fps)

        # Step 3: Build Remotion props + render via HTTP server
        serve_root = serve_base or work_dir

        with _http_server(serve_root) as port:
            base_url = f"http://127.0.0.1:{port}"

            # Build props
            props_items = []
            for item in bulletin_items:
                rel = item.audio_path.relative_to(serve_root)
                audio_url = f"{base_url}/{rel.as_posix()}"
                entry = {
                    "headline": item.headline,
                    "subtext": item.subtext,
                    "duration": item.duration_frames,
                    "audioUrl": audio_url,
                    "subtitles": item.subtitles,
                }
                if item.image_url:
                    entry["imageUrl"] = item.image_url
                props_items.append(entry)

            props = {
                "networkName": network_name,
                "style": style,
                "items": props_items,
                "ticker": ticker,
                "fps": fps,
            }

            print("[NewsBulletin] Rendering with Remotion...")
            remotion_dir = Path(__file__).parent.parent / "remotion"
            # Determine composition id based on orientation in props (or default 16:9)
            comp_id: str = str(props.get("composition") or "NewsBulletin")
            raw_out = output_path.parent / (output_path.stem + "_raw" + output_path.suffix)
            cmd = [
                "npx", "remotion", "render", comp_id,
                str(raw_out.resolve()),
                f"--props={json.dumps(props)}",
                f"--concurrency={settings.remotion_concurrency}",
            ]
            result = subprocess.run(cmd, cwd=str(remotion_dir), capture_output=False)
            if result.returncode != 0:
                raise RuntimeError(f"Remotion render failed (exit code {result.returncode})")

            # Post-process: fix color range/space for QuickTime/Apple compatibility.
            # Remotion outputs yuvj420p (full-range) + bt470bg — Apple devices expect
            # yuv420p (tv-range) + bt709. Without this fix videos stutter in QuickTime.
            print("[NewsBulletin] Fixing color metadata for QuickTime compatibility...")
            fix_cmd = [
                "ffmpeg", "-i", str(raw_out.resolve()),
                "-c:v", "libx264", "-crf", "18", "-preset", "fast",
                "-vf", "colorspace=bt709:iall=bt470bg:fast=1,format=yuv420p",
                "-color_range", "tv",
                "-colorspace", "bt709",
                "-color_trc", "bt709",
                "-color_primaries", "bt709",
                "-c:a", "copy",
                str(output_path.resolve()),
                "-y",
            ]
            fix_result = subprocess.run(fix_cmd, capture_output=True, text=True)
            raw_out.unlink(missing_ok=True)
            if fix_result.returncode != 0:
                # Fall back to raw output if ffmpeg post-process fails
                print(f"  [warn] color fix failed, keeping raw output: {fix_result.stderr[-200:]}")
                raw_out.rename(output_path)

        print(f"[NewsBulletin] Done → {output_path}")
        return output_path

    finally:
        if _tmp_ctx is not None:
            _tmp_ctx.cleanup()
