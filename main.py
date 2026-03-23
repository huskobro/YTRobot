"""YTRobot CLI — generates long-form YouTube videos automatically."""
import argparse
import json
import sys
from datetime import datetime
from pathlib import Path

from config import settings


def _session_dir(base: str) -> Path:
    session_id = datetime.now().strftime("%Y%m%d_%H%M%S")
    path = Path(base) / session_id
    path.mkdir(parents=True, exist_ok=True)
    return path


def run_full_pipeline(topic: str = None, script_file: Path = None) -> Path:
    from pipeline.script import generate_from_topic, load_from_file, save_script, Scene
    from pipeline.metadata import generate_metadata, save_metadata
    from pipeline.tts import synthesize_scenes
    from pipeline.visuals import fetch_visuals
    from pipeline.subtitles import generate_srt, generate_word_timing
    from pipeline.composer import compose

    session = _session_dir(settings.output_dir)
    print(f"\n=== YTRobot Session: {session.name} ===")

    # 1. Script
    print("\n[1/6] Script...")
    if topic:
        print(f"  Generating script for topic: {topic!r}")
        scenes = generate_from_topic(topic)
    else:
        print(f"  Loading script from: {script_file}")
        scenes = load_from_file(script_file)
    save_script(scenes, session / "script.json")
    print(f"  {len(scenes)} scenes loaded.")

    # 2. Metadata (title / description / tags)
    print("\n[2/6] Generating YouTube metadata...")
    meta = generate_metadata(scenes, topic=topic or "")
    save_metadata(meta, session / "metadata.json")
    print(f"  Title: {meta.title}")

    # 3. TTS
    print("\n[3/6] Text-to-Speech...")
    audio_paths = synthesize_scenes(scenes, session)

    # 4. Visuals
    print("\n[4/6] Visuals...")
    visual_paths = fetch_visuals(scenes, session)

    # 5. Subtitles
    print("\n[5/6] Subtitles...")
    srt_path = generate_srt(audio_paths, scenes, session)
    generate_word_timing(audio_paths, scenes, session, fps=settings.video_fps)

    # 6. Compose
    print("\n[6/6] Composing video...")
    output = compose(scenes, audio_paths, visual_paths, srt_path, session)

    print(f"\n✓ Video ready: {output}")
    print(f"✓ Metadata:    {session / 'metadata.txt'}")
    return output


def run_stage(stage: str, input_path: str) -> None:
    if stage == "tts":
        from pipeline.script import load_from_file
        from pipeline.tts import synthesize_scenes
        scenes = load_from_file(Path(input_path))
        session = _session_dir(settings.output_dir)
        synthesize_scenes(scenes, session)

    elif stage == "visuals":
        from pipeline.script import load_from_file
        from pipeline.visuals import fetch_visuals
        scenes = load_from_file(Path(input_path))
        session = _session_dir(settings.output_dir)
        fetch_visuals(scenes, session)

    elif stage == "compose":
        session = Path(input_path)
        script_path = session / "script.json"
        from pipeline.script import Scene
        import json as _json
        scenes_data = _json.loads(script_path.read_text())
        scenes = [Scene(**s) for s in scenes_data]
        audio_paths = sorted((session / "audio").glob("*.mp3"))
        visual_paths = sorted((session / "clips").glob("*"))
        srt_path = session / "subtitles.srt"
        from pipeline.composer import compose
        compose(scenes, audio_paths, visual_paths, srt_path if srt_path.exists() else None, session)

    else:
        print(f"Unknown stage: {stage!r}. Choose from: tts, visuals, compose")
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description="YTRobot: Auto YouTube video generator")
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--topic", help="Topic for AI-generated script")
    group.add_argument("--script", help="Path to manual script file (.txt or .json)")
    parser.add_argument("--stage", choices=["tts", "visuals", "compose"], help="Run a single pipeline stage")
    parser.add_argument("--input", help="Input file or session directory for --stage")
    args = parser.parse_args()

    if args.stage:
        if not args.input:
            parser.error("--stage requires --input")
        run_stage(args.stage, args.input)
    elif args.topic:
        run_full_pipeline(topic=args.topic)
    elif args.script:
        run_full_pipeline(script_file=Path(args.script))
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
