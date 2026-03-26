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
    provider = settings.bulletin_tts_provider or settings.tts_provider
    
    # Resolve effective voice ID
    voice_id = None
    if provider == "elevenlabs":
        voice_id = settings.bulletin_elevenlabs_voice_id or settings.bulletin_tts_voice_id or settings.elevenlabs_voice_id
    elif provider == "openai":
        voice_id = settings.bulletin_openai_tts_voice or settings.openai_tts_voice
    elif provider == "speshaudio":
        voice_id = settings.bulletin_speshaudio_voice_id or settings.bulletin_tts_voice_id or settings.speshaudio_voice_id
    else:
        voice_id = settings.bulletin_tts_voice_id or None

    return {
        "provider": provider,
        "voice_id": voice_id,
        "speed": settings.bulletin_tts_speed if settings.bulletin_tts_speed > 0.0 else settings.tts_speed,
        "stability": settings.bulletin_tts_stability if settings.bulletin_tts_stability >= 0.0 else settings.speshaudio_stability,
        "similarity_boost": settings.bulletin_tts_similarity_boost if settings.bulletin_tts_similarity_boost >= 0.0 else settings.speshaudio_similarity_boost,
        "style_val": settings.bulletin_tts_style if settings.bulletin_tts_style >= 0.0 else settings.speshaudio_style,
        "language_override": settings.bulletin_tts_language or None,
        # Qwen3 Overrides
        "qwen3_model_id": settings.bulletin_qwen3_model_id or settings.qwen3_model_id,
        "qwen3_model_type": settings.bulletin_qwen3_model_type or settings.qwen3_model_type,
        "qwen3_voice_instruct": settings.bulletin_qwen3_voice_instruct or settings.qwen3_voice_instruct,
        "qwen3_device": settings.bulletin_qwen3_device or settings.qwen3_device,
    }


# ── Data structures ───────────────────────────────────────────────────────────

@dataclass
class BulletinItem:
    headline: str
    narration: str
    subtext: str = ""
    image_url: str = ""
    language: str = ""
    source_url: str = ""
    published_date: str = ""
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

    # Pass Qwen3 overrides if provider supports it
    syn_kwargs = {}
    if bts["provider"] == "qwen3":
        syn_kwargs.update({
            "model_id": bts["qwen3_model_id"],
            "model_type": bts["qwen3_model_type"],
            "voice_instruct": bts["qwen3_voice_instruct"],
            "device": bts["qwen3_device"]
        })
    
    provider.synthesize(text, audio_path, **syn_kwargs)
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


def _normalize_word(text: str) -> str:
    """Lowercase + strip all non-alphanumeric chars for fuzzy matching."""
    return re.sub(r"[^\w]", "", text.lower().strip())


def _align_words_anchored(script_text: str, whisper_result: dict, total_dur: float) -> list:
    """Fallback: segment-anchored character-fraction mapping."""
    segs = whisper_result.get("segments", [])
    script_words = script_text.split()
    if not script_words or not segs:
        return []

    # Build anchors based on Whisper segment boundaries
    full_w_text = " ".join(s.get("text", "").strip() for s in segs)
    total_w_chars = max(len(full_w_text), 1)
    
    anchors = [(0.0, float(segs[0]["start"]))]
    curr_char = 0
    for s in segs:
        txt = s.get("text", "").strip()
        curr_char += len(txt) + 1
        anchors.append((curr_char / total_w_chars, float(s["end"])))

    def lookup(frac: float) -> float:
        frac = max(0.0, min(1.0, frac))
        for i in range(len(anchors) - 1):
            f0, t0 = anchors[i]; f1, t1 = anchors[i+1]
            if f0 <= frac <= f1 and f1 > f0:
                return t0 + (frac - f0) / (f1 - f0) * (t1 - t0)
        return anchors[-1][1]

    total_chars = max(len(script_text), 1)
    aligned = []
    char_pos = 0
    for word in script_words:
        f0 = char_pos / total_chars
        f1 = (char_pos + len(word)) / total_chars
        aligned.append({
            "word": word,
            "startSec": _r4(lookup(f0)),
            "endSec":   _r4(lookup(f1)),
        })
        char_pos += len(word) + 1

    for i in range(len(aligned) - 1):
        aligned[i]["endSec"] = aligned[i+1]["startSec"]
    return aligned


def _align_subtitles(narration: str, audio_path: Path, fps: int) -> list:
    """Return list of SubtitleEntry dicts using greedy word matching for sync."""
    model = _get_whisper()
    result = model.transcribe(
        str(audio_path),
        word_timestamps=True,
        initial_prompt=narration,
        language=None,
    )
    
    segs = result.get("segments", [])
    total_dur = _audio_duration(audio_path)
    script_words = narration.split()
    if not script_words or not segs:
        return []

    # 1. Collect Whisper per-word entries
    wh_words = []
    for s in segs:
        for w in s.get("words", []):
            txt = str(w.get("word", "")).strip()
            if not txt: continue
            wh_words.append({
                "norm":  _normalize_word(txt),
                "start": float(w.get("start", 0.0)),
                "end":   float(w.get("end", 0.0)),
            })

    if not wh_words:
        aligned_words = _align_words_anchored(narration, result, total_dur)
    else:
        # 2. Greedily match script words to Whisper words
        timestamps = [None] * len(script_words)
        w_idx = 0
        for s_idx, sw in enumerate(script_words):
            ns = _normalize_word(sw)
            for lookahead in range(min(7, len(wh_words) - w_idx)):
                j = w_idx + lookahead
                if wh_words[j]["norm"] == ns:
                    timestamps[s_idx] = (wh_words[j]["start"], wh_words[j]["end"])
                    w_idx = j + 1
                    break
        
        # 3. Interpolate gaps
        matched = [(i, t) for i, t in enumerate(timestamps) if t is not None]
        if not matched:
            aligned_words = _align_words_anchored(narration, result, total_dur)
        else:
            for s_idx in range(len(script_words)):
                if timestamps[s_idx] is not None: continue
                # Linear interpolation between matched neighbours
                left  = next((m for m in reversed(matched) if m[0] < s_idx), None)
                right = next((m for m in matched          if m[0] > s_idx), None)
                if left and right:
                    li, lt = left; ri, rt = right
                    span = ri - li; pos = s_idx - li
                    t0 = lt[1] + (rt[0] - lt[1]) * (pos / span)
                    t1 = lt[1] + (rt[0] - lt[1]) * ((pos + 1) / span)
                elif left:
                    offset = s_idx - left[0]
                    t0 = min(left[1][1] + offset * 0.25, total_dur)
                    t1 = min(t0 + 0.25, total_dur)
                else:
                    ri, rt = right; count = ri - s_idx
                    t0 = max(0.0, rt[0] - count * 0.25)
                    t1 = t0 + 0.25
                timestamps[s_idx] = (_r4(t0), _r4(t1))
            
            aligned_words = []
            for s_idx, sw in enumerate(script_words):
                t = timestamps[s_idx]
                aligned_words.append({"word": sw, "startSec": _r4(t[0]), "endSec": _r4(max(t[0]+0.01, t[1]))})

    for i in range(len(aligned_words) - 1):
        aligned_words[i]["endSec"] = aligned_words[i+1]["startSec"]

    # 4. Group into sentence-level entries for the "types.ts" SubtitleEntry format
    chunks = [c.strip() for c in re.split(r"(?<=[.!?…])\s+", narration) if c.strip()]
    if not chunks: chunks = [narration]

    entries = []
    wi = 0
    for chunk in chunks:
        chunk_words = chunk.split()
        if not chunk_words: continue
        
        start_wi = wi
        words_out = []
        for cw in chunk_words:
            if wi >= len(aligned_words): break
            w = aligned_words[wi]
            words_out.append({
                "word": cw,
                "startFrame": int(w["startSec"] * fps),
                "endFrame": int(w["endSec"] * fps),
            })
            wi += 1
            
        if not words_out: continue
        
        entries.append({
            "text": chunk,
            "startFrame": words_out[0]["startFrame"],
            "endFrame": words_out[-1]["endFrame"],
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
    category_templates: dict | None = None,
    on_progress=None,    # callable(progress: int, step: str, step_label: str)
    stop_event=None,     # threading.Event — set to request cancellation
    pause_event=None,    # threading.Event — set means "paused, wait"
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
    text_delivery_mode = bulletin_config.get("textDeliveryMode", "per_scene")  # "per_scene" | "single_chunk"

    # Design settings
    lower_third = {
        "enabled": bulletin_config.get("lowerThirdEnabled", True),
        "text": bulletin_config.get("lowerThirdText", ""),
        "font": bulletin_config.get("lowerThirdFont", "bebas"),
        "color": bulletin_config.get("lowerThirdColor", "#ffffff"),
        "size": bulletin_config.get("lowerThirdSize", 32),
    }
    ticker_settings = {
        "enabled": bulletin_config.get("tickerEnabled", True),
        "speed": bulletin_config.get("tickerSpeed", 3),
        "bg": bulletin_config.get("tickerBg", "#000000"),
        "color": bulletin_config.get("tickerColor", "#ffffff"),
    }
    show_live = bulletin_config.get("showLive", True)

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
        _cat_templates = category_templates or {}
        bulletin_items: list[BulletinItem] = []
        for raw in items_raw:
            narration = raw.get("narration") or raw.get("subtext") or raw.get("headline", "")
            bi = BulletinItem(
                headline=raw.get("headline", ""),
                narration=narration,
                subtext=raw.get("subtext", ""),
                image_url=raw.get("imageUrl", ""),
                language=raw.get("language", default_language),
                source_url=raw.get("sourceUrl", ""),
                published_date=raw.get("publishedDate", ""),
            )
            # Carry category + styleOverride from server-side props if present
            bi.__dict__["category"] = (raw.get("category") or "").lower()
            bi.__dict__["styleOverride"] = raw.get("styleOverride") or _cat_templates.get(bi.__dict__["category"])
            bulletin_items.append(bi)

        n = len(bulletin_items)
        print(f"[NewsBulletin] {n} items — starting TTS...")

        def _check_stop():
            """Raise if stop requested."""
            if stop_event and stop_event.is_set():
                raise InterruptedError("Render durduruldu.")

        def _check_pause():
            """Block while paused; raise if stop is set during wait."""
            if pause_event:
                while pause_event.is_set():
                    if stop_event and stop_event.is_set():
                        raise InterruptedError("Render durduruldu.")
                    import time as _t; _t.sleep(0.3)

        def _prog(progress: int, step: str, label: str):
            print(f"[NewsBulletin] [{progress}%] {label}")
            if on_progress:
                on_progress(progress, step, label)

        # Step 1: TTS  (0–35%)
        _prog(2, "tts", f"Ses sentezi başlıyor... (0/{n})")

        if text_delivery_mode == "single_chunk" and n > 1:
            # ── Single-chunk mode: concatenate all narration texts, TTS once ──
            # Use a separator so Whisper can align individual items later
            SEPARATOR = " ... "
            combined_text = SEPARATOR.join(
                item.narration for item in bulletin_items
            )
            combined_item = BulletinItem(
                headline="[combined]",
                narration=combined_text,
                language=bulletin_items[0].language,
            )
            _prog(5, "tts", "Ses sentezi: tüm haberler tek parça...")
            combined_audio = _synthesize(combined_item, work_dir, 0)
            combined_path = work_dir / "combined.mp3"
            combined_audio.rename(combined_path)
            # Assign same combined audio to all items temporarily
            total_dur = _audio_duration(combined_path)
            # Split audio proportionally by narration length for duration
            total_chars = sum(len(item.narration) for item in bulletin_items)
            offset_sec = 0.0
            for i, item in enumerate(bulletin_items):
                frac = len(item.narration) / max(total_chars, 1)
                item_dur = total_dur * frac
                item.audio_path = combined_path  # all point to same file
                item.duration_frames = max(fps * 3, int(item_dur * fps))
                pct = 5 + int((i + 1) / n * 28)
                _prog(pct, "tts", f"Ses süreleri hesaplandı: {i+1}/{n}")
            _prog(35, "tts", "Ses sentezi tamamlandı (tek parça)")
        else:
            # ── Per-scene mode: TTS per item (default) ────────────────────────
            for i, item in enumerate(bulletin_items):
                _check_stop()
                _check_pause()
                print(f"  TTS [{i+1}/{n}]: {item.headline[:50]}")
                item.audio_path = _synthesize(item, work_dir, i)
                item.duration_frames = _frames_for_audio(item.audio_path, fps)
                pct = 2 + int((i + 1) / n * 33)
                _prog(pct, "tts", f"Ses sentezi: {i+1}/{n}")

        # Step 2: Subtitle alignment (35–60%)
        _check_stop()
        _prog(35, "whisper", f"Altyazı hizalama başlıyor... (0/{n})")
        print("[NewsBulletin] Aligning subtitles with Whisper...")
        for i, item in enumerate(bulletin_items):
            _check_stop()
            _check_pause()
            print(f"  Align [{i+1}/{n}]")
            item.subtitles = _align_subtitles(item.narration, item.audio_path, fps)
            pct = 35 + int((i + 1) / n * 25)
            _prog(pct, "whisper", f"Altyazı hizalama: {i+1}/{n}")

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
                if item.source_url:
                    entry["sourceUrl"] = item.source_url
                if item.published_date:
                    entry["publishedDate"] = item.published_date
                style_override = item.__dict__.get("styleOverride")
                if style_override:
                    entry["styleOverride"] = style_override
                props_items.append(entry)

            # Step 1.1: Determine effective language (Auto-detect if needed)
            lang = bulletin_config.get("lang", "tr")
            if not lang or lang == "auto":
                # Combined text for detection
                detect_text = " ".join(item.narration for item in bulletin_items[:3]).lower()
                tr_chars = "ğışçöü"
                has_tr = any(c in detect_text for c in tr_chars)
                lang = "tr" if has_tr else "en"
                print(f"[NewsBulletin] Auto-detected language: {lang}")

            props = {
                "networkName": network_name,
                "style": style,
                "items": props_items,
                "ticker": ticker,
                "fps": fps,
                "lang": lang,
                "composition": bulletin_config.get("composition") or "NewsBulletin",
                # New design props
                "lowerThird": lower_third,
                "tickerSettings": ticker_settings,
                "showLive": show_live,
                # Category flash & item intro transitions
                "showCategoryFlash": bulletin_config.get("showCategoryFlash", False),
                "showItemIntro": bulletin_config.get("showItemIntro", False),
                # Source & date display
                "showSource": bulletin_config.get("showSource", False),
                "showDate": bulletin_config.get("showDate", False),
            }

            _check_stop()
            _prog(60, "remotion", "Video render başlıyor...")
            print("[NewsBulletin] Rendering with Remotion...")
            remotion_dir = Path(__file__).parent.parent / "remotion"
            comp_id: str = str(props.get("composition"))
            raw_out = output_path.parent / (output_path.stem + "_raw" + output_path.suffix)
            cmd = [
                "npx", "remotion", "render", comp_id,
                str(raw_out.resolve()),
                f"--props={json.dumps(props)}",
                f"--concurrency={settings.remotion_concurrency}",
            ]
            # Stream Remotion output and parse frame progress
            import re as _re
            proc = subprocess.Popen(cmd, cwd=str(remotion_dir), stdout=subprocess.PIPE,
                                    stderr=subprocess.STDOUT, text=True, bufsize=1)
            # Expose proc so server can kill/suspend it
            if on_progress:
                try:
                    on_progress(-1, "_proc", str(proc.pid))
                except Exception:
                    pass
            _last_remotion_pct = 60
            for line in proc.stdout:  # type: ignore[union-attr]
                print(line, end="")
                # Remotion prints lines like: "Rendering frame 42 (50%)"
                m = _re.search(r"(\d+)\s*%", line)
                if m:
                    frame_pct = int(m.group(1))
                    overall = 60 + int(frame_pct * 0.28)
                    if overall > _last_remotion_pct:
                        _last_remotion_pct = overall
                        _prog(overall, "remotion", f"Video render: {frame_pct}%")
                # Stop check inside render loop
                if stop_event and stop_event.is_set():
                    proc.terminate()
                    proc.wait()
                    raise InterruptedError("Render durduruldu.")
                # Pause check — SIGSTOP/SIGCONT on unix
                if pause_event and pause_event.is_set():
                    import signal as _sig, os as _os
                    try:
                        _os.kill(proc.pid, _sig.SIGSTOP)
                    except Exception:
                        pass
                    _check_pause()   # blocks until unpaused
                    try:
                        _os.kill(proc.pid, _sig.SIGCONT)
                    except Exception:
                        pass
            proc.wait()
            if proc.returncode != 0:
                raise RuntimeError(f"Remotion render failed (exit code {proc.returncode})")

            _prog(88, "ffmpeg", "Renk dönüşümü yapılıyor...")
            # Post-process: fix color range/space for QuickTime/Apple compatibility.
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

        _prog(100, "done", "Tamamlandı!")
        print(f"[NewsBulletin] Done → {output_path}")
        return output_path

    finally:
        if _tmp_ctx is not None:
            _tmp_ctx.cleanup()
