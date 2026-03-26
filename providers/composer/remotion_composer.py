"""Remotion video composer.

Requires Node.js + npm. First-time setup:
  cd remotion && npm install

Then set in .env:
  COMPOSER_PROVIDER=remotion

License: Remotion is free for individuals and companies ≤3 employees.
See https://remotion.dev/license
"""
import contextlib
import http.server
import json
import re
import shutil
import socket
import subprocess
import threading
from pathlib import Path

from config import settings  # type: ignore  # pyre-ignore[missing-module]
from pipeline.script import Scene  # type: ignore  # pyre-ignore[missing-module]

_REMOTION_DIR = Path(__file__).parent.parent.parent / "remotion"


def _parse_srt(srt_path: Path) -> list[dict]:
    """Parse an SRT file into a list of {text, start_sec, end_sec} dicts."""
    entries = []
    pattern = re.compile(
        r"\d+\s*\n"
        r"(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})\s*\n"
        r"([\s\S]*?)(?=\n\n|\Z)",
        re.MULTILINE,
    )

    def _ts(ts: str) -> float:
        h, m, rest = ts.split(":")
        s, ms = rest.split(",")
        return int(h) * 3600 + int(m) * 60 + int(s) + int(ms) / 1000

    for m in pattern.finditer(srt_path.read_text(encoding="utf-8")):
        entries.append({
            "text": m.group(3).strip().replace("\n", " "),
            "start_sec": _ts(m.group(1)),
            "end_sec": _ts(m.group(2)),
        })
    return entries


def _assign_subtitles_to_scene(
    srt_entries: list[dict], scene_start_sec: float, scene_end_sec: float, fps: int
) -> list[dict]:
    """Return subtitle entries that overlap this scene, with frame offsets relative to scene start."""
    result = []
    for entry in srt_entries:
        # Include entry if it overlaps the scene window
        if entry["end_sec"] <= scene_start_sec or entry["start_sec"] >= scene_end_sec:
            continue
        start_frame = max(0, round((entry["start_sec"] - scene_start_sec) * fps))
        end_frame = min(
            round((scene_end_sec - scene_start_sec) * fps),
            round((entry["end_sec"] - scene_start_sec) * fps),
        )
        result.append({"text": entry["text"], "startFrame": start_frame, "endFrame": end_frame})
    return result


def _load_word_timing(session_dir: Path) -> list[dict]:
    """Load word_timing.json if it exists."""
    wt_path = session_dir / "word_timing.json"
    if wt_path.exists():
        return json.loads(wt_path.read_text(encoding="utf-8"))
    return []


def _words_to_frames(
    words: list[dict], scene_start_sec: float, fps: int
) -> list[dict]:
    """Convert word timing from seconds to scene-relative frames."""
    result = []
    for w in words:
        start_frame = max(0, round((w["startSec"] - scene_start_sec) * fps))
        end_frame = round((w["endSec"] - scene_start_sec) * fps)
        result.append({"word": w["word"], "startFrame": start_frame, "endFrame": end_frame})
    return result


@contextlib.contextmanager
def _local_http_server(directory: Path):
    """Serve a directory over HTTP on a free port. Yields the base URL."""
    # Find a free port
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        port = s.getsockname()[1]

    class _Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(directory), **kwargs)

        def log_message(self, *_):  # pyre-ignore[bad-override]
            pass  # suppress request logs

    server = http.server.HTTPServer(("127.0.0.1", port), _Handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        yield f"http://127.0.0.1:{port}"
    finally:
        server.shutdown()


def _check_node() -> str:
    """Return npx path or raise a helpful error."""
    npx = shutil.which("npx")
    if not npx:
        raise RuntimeError(
            "Node.js/npx not found. Install Node.js from https://nodejs.org "
            "then run: cd remotion && npm install"
        )
    return npx


def _ensure_installed():
    node_modules = _REMOTION_DIR / "node_modules"
    if not node_modules.exists():
        print("  [Remotion] Running npm install (first time setup)...")
        subprocess.run(
            ["npm", "install"],
            cwd=_REMOTION_DIR,
            check=True,
        )


def _get_audio_duration(audio_path: Path) -> float:
    """Get duration in seconds via ffprobe."""
    result = subprocess.run(
        [
            "ffprobe", "-v", "quiet",
            "-show_entries", "format=duration",
            "-of", "csv=p=0",
            str(audio_path),
        ],
        capture_output=True,
        text=True,
    )
    return float(result.stdout.strip())


def compose_remotion(
    scenes: list[Scene],
    audio_paths: list[Path],
    visual_paths: list[Path],
    srt_path: Path,
    session_dir: Path,
) -> Path:
    npx = _check_node()
    _ensure_installed()

    w, h = settings.video_resolution.split("x")
    fps = settings.video_fps

    # Parse SRT for accurate subtitle timing
    srt_entries = _parse_srt(srt_path) if srt_path and srt_path.exists() else []
    # Load word-level timing for karaoke highlight
    word_timing_data = _load_word_timing(session_dir)

    # Serve the output root (parent of session dir) over HTTP so Remotion can
    # load audio/visual assets — file:// URLs are not supported by the CLI renderer.
    output_root = session_dir.parent.resolve()

    print("  [Remotion] Collecting scene data...")

    with _local_http_server(output_root) as base_url:
        session_rel = session_dir.resolve().relative_to(output_root)

        composition_scenes = []
        scene_cursor_sec = 0.0
        for i, (scene, audio, visual) in enumerate(zip(scenes, audio_paths, visual_paths)):
            duration_sec = _get_audio_duration(audio)
            duration_frames = max(round(duration_sec * fps), fps)  # at least 1s
            is_video = visual.suffix.lower() in (".mp4", ".mov", ".webm")

            subtitles = _assign_subtitles_to_scene(
                srt_entries, scene_cursor_sec, scene_cursor_sec + duration_sec, fps
            )

            # Attach word-level timing to each subtitle entry for karaoke.
            # word_timing.json now contains pre-chunked word groups that match
            # SRT entries exactly (by text), eliminating time-based matching
            # and the duplicate-word bug at chunk boundaries.
            scene_wt = next((s for s in word_timing_data if s["scene"] == i), None)
            if scene_wt and scene_wt.get("chunks"):
                for sub_entry in subtitles:
                    # Find matching chunk by text content (exact match)
                    for chunk in scene_wt["chunks"]:  # pyre-ignore
                        if chunk["text"] == sub_entry["text"]:
                            sub_entry["words"] = _words_to_frames(
                                chunk["words"], scene_cursor_sec, fps
                            )
                            break

            # Build HTTP URLs relative to the served output root
            audio_rel = audio.resolve().relative_to(output_root)
            visual_rel = visual.resolve().relative_to(output_root)
            composition_scenes.append({
                "visual": f"{base_url}/{visual_rel.as_posix()}",
                "audio": f"{base_url}/{audio_rel.as_posix()}",
                "narration": scene.narration,
                "durationInFrames": duration_frames,
                "isVideo": is_video,
                "subtitles": subtitles,
            })
            print(f"  [Remotion] Scene {i}: {duration_sec:.1f}s ({duration_frames} frames), {len(subtitles)} subtitle(s)")
            scene_cursor_sec += duration_sec

        props = {
            "scenes": composition_scenes,
            "fps": fps,
            "width": int(w),
            "height": int(h),
            "settings": {
                "kenBurnsZoom": settings.remotion_ken_burns_zoom,
                "kenBurnsDirection": settings.remotion_ken_burns_direction,
                "subtitleFont": settings.remotion_subtitle_font,
                "subtitleSize": settings.remotion_subtitle_size,
                "subtitleColor": settings.remotion_subtitle_color,
                "subtitleBg": settings.remotion_subtitle_bg,
                "subtitleStroke": settings.remotion_subtitle_stroke,
                "transitionDuration": settings.remotion_transition_duration,
                "videoEffect": settings.remotion_video_effect,
                "karaokeColor": settings.remotion_karaoke_color,
                "karaokeEnabled": settings.remotion_karaoke_enabled,
                "subtitleAnimation": settings.remotion_subtitle_animation,
            },
        }

        props_file = session_dir / "remotion_props.json"
        props_file.write_text(json.dumps(props, indent=2))

        output_file = session_dir / "final_output.mp4"

        print(f"  [Remotion] Serving assets at {base_url} — rendering video...")
        result = subprocess.run(
            [
                npx, "remotion", "render",
                "YTRobotVideo",
                str(output_file.absolute()),
                f"--props={props_file.absolute()}",
                f"--concurrency={settings.remotion_concurrency}",
                "--log=verbose",
            ],
            cwd=_REMOTION_DIR,
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            stderr_tail = result.stderr[-1000:] if result.stderr else "no stderr"
            stdout_tail = result.stdout[-500:] if result.stdout else ""
            raise RuntimeError(
                f"[Remotion] Render failed (code {result.returncode}):\n{stderr_tail}\n{stdout_tail}"
            )

    print(f"  [Remotion] Done! Output: {output_file}")
    return output_file
