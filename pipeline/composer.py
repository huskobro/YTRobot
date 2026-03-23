"""Composer stage: assembles audio + visuals + subtitles into a final .mp4.

Supports two backends (COMPOSER_PROVIDER in .env):
  moviepy  — Python/FFmpeg (default, works out of the box)
  remotion — React/Node.js renderer (run 'npm install' in remotion/ first)
"""
from pathlib import Path
from config import settings
from pipeline.script import Scene


def compose(
    scenes: list[Scene],
    audio_paths: list[Path],
    visual_paths: list[Path],
    srt_path: Path,
    session_dir: Path,
) -> Path:
    if settings.composer_provider == "remotion":
        from providers.composer.remotion_composer import compose_remotion
        return compose_remotion(scenes, audio_paths, visual_paths, srt_path, session_dir)
    return _compose_moviepy(scenes, audio_paths, visual_paths, srt_path, session_dir)


def _compose_moviepy(
    scenes: list[Scene],
    audio_paths: list[Path],
    visual_paths: list[Path],
    srt_path: Path,
    session_dir: Path,
) -> Path:
    from moviepy import (
        VideoFileClip,
        ImageClip,
        AudioFileClip,
        concatenate_videoclips,
    )
    from moviepy.video.fx import Loop

    w, h = settings.video_resolution.split("x")
    width, height = int(w), int(h)
    fps = settings.video_fps
    clips = []

    for i, (audio_p, visual_p) in enumerate(zip(audio_paths, visual_paths)):
        print(f"  [Composer] Processing scene {i}...")
        audio_clip = AudioFileClip(str(audio_p))
        duration = audio_clip.duration

        if visual_p.suffix in (".mp4", ".mov", ".webm"):
            video_clip = (
                VideoFileClip(str(visual_p))
                .with_effects([Loop(duration=duration)])
                .resized((width, height))
                .with_audio(audio_clip)
            )
        else:
            video_clip = (
                ImageClip(str(visual_p))
                .with_duration(duration)
                .resized((width, height))
                .with_audio(audio_clip)
            )

        clips.append(video_clip.with_fps(fps))

    final = concatenate_videoclips(clips, method="compose")
    raw_output = session_dir / "raw_output.mp4"
    final_output = session_dir / "final_output.mp4"

    print("  [Composer] Rendering raw video...")
    final.write_videofile(str(raw_output), fps=fps, codec="libx264", audio_codec="aac")

    if srt_path and srt_path.exists():
        if settings.subtitle_provider == "pycaps":
            _burn_subtitles_pycaps(raw_output, srt_path, final_output)
            raw_output.unlink(missing_ok=True)
        else:
            _burn_subtitles_ffmpeg(raw_output, srt_path, final_output)
            raw_output.unlink(missing_ok=True)
    else:
        raw_output.rename(final_output)

    print(f"  [Composer] Done! Output: {final_output}")
    return final_output


def _burn_subtitles_pycaps(raw_video: Path, srt_path: Path, output: Path) -> None:
    """Burn animated CSS-styled subtitles using pycaps."""
    import importlib.resources as pkg_resources
    from pycaps import CapsPipelineBuilder, JsonConfigLoader

    style = settings.pycaps_style
    # Locate the preset directory bundled with pycaps
    preset_base = Path(pkg_resources.files("pycaps").joinpath(f"template/preset/{style}"))
    template_json = preset_base / "pycaps.template.json"

    print(f"  [Composer] Burning subtitles with pycaps (style={style})...")

    if template_json.exists():
        builder = JsonConfigLoader(str(template_json)).load(should_build_pipeline=False)
    else:
        print(f"  [Composer] pycaps style '{style}' not found, using default")
        default_json = Path(pkg_resources.files("pycaps").joinpath("template/preset/default/pycaps.template.json"))
        builder = JsonConfigLoader(str(default_json)).load(should_build_pipeline=False)

    pipeline = (
        builder
        .with_input_video(str(raw_video))
        .with_output_video(str(output))
        .with_transcription_file(str(srt_path))
        .build()
    )
    pipeline.run()


def _burn_subtitles_ffmpeg(raw_video: Path, srt_path: Path, output: Path) -> None:
    """Burn/embed subtitles using ffmpeg (soft track fallback since libass unavailable)."""
    import subprocess

    escaped_srt = str(srt_path)
    for ch in ("\\", ":", "'", "[", "]"):
        escaped_srt = escaped_srt.replace(ch, f"\\{ch}")
    vf = f"subtitles={escaped_srt}:force_style='FontSize=24,PrimaryColour=&Hffffff&'"

    probe = subprocess.run(["ffmpeg", "-filters"], capture_output=True, text=True)
    has_subtitles_filter = "subtitles" in probe.stdout

    if has_subtitles_filter:
        print("  [Composer] Burning in subtitles (hardcoded)...")
        subprocess.run(
            ["ffmpeg", "-y", "-i", str(raw_video), "-vf", vf, "-c:a", "copy", str(output)],
            check=True,
        )
    else:
        print("  [Composer] Embedding subtitles as soft track (libass not available)...")
        subprocess.run(
            [
                "ffmpeg", "-y",
                "-i", str(raw_video),
                "-i", str(srt_path),
                "-c:v", "copy",
                "-c:a", "copy",
                "-c:s", "mov_text",
                "-metadata:s:s:0", "language=und",
                str(output),
            ],
            check=True,
        )
