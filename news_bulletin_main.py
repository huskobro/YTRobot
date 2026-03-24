"""CLI for the News Bulletin pipeline.

Usage:
    python news_bulletin_main.py --input bulletin.json
    python news_bulletin_main.py --input bulletin.json --output output/my_bulletin.mp4
    python news_bulletin_main.py --input bulletin.json --fps 60

bulletin.json example:
{
  "networkName": "YTRobot Haber",
  "style": "breaking",
  "language": "tr",
  "items": [
    {
      "headline": "SON DAKİKA: Deprem Haberi",
      "subtext": "Ege'de 5.2 büyüklüğünde deprem meydana geldi.",
      "narration": "Son dakika haberi. Ege Denizinde meydana gelen 5.2 büyüklüğündeki deprem büyük şehirlerde hissedildi.",
      "imageUrl": "https://example.com/earthquake.jpg"
    }
  ],
  "ticker": [
    {"text": "• Ege'de 5.2 büyüklüğünde deprem"},
    {"text": "• Yetkililer açıklama yaptı"}
  ]
}
"""
import argparse
import json
import sys
from datetime import datetime
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description="YTRobot News Bulletin pipeline")
    parser.add_argument("--input", "-i", required=True, help="Path to bulletin.json")
    parser.add_argument(
        "--output", "-o", default=None,
        help="Output MP4 path (default: output/YYYYMMDD_HHMMSS_bulletin/final.mp4)"
    )
    parser.add_argument("--fps", type=int, default=60, help="Frames per second (default 60)")
    parser.add_argument(
        "--work-dir", default=None,
        help="Directory for intermediate audio files (default: auto tempdir)"
    )
    args = parser.parse_args()

    # Load config
    config_path = Path(args.input)
    if not config_path.exists():
        print(f"ERROR: {config_path} not found", file=sys.stderr)
        sys.exit(1)

    with config_path.open() as f:
        bulletin_config = json.load(f)

    # Determine output path
    if args.output:
        output_path = Path(args.output)
    else:
        session = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_path = Path("output") / f"{session}_bulletin" / "bulletin.mp4"

    # Work dir for audio files (defaults to same dir as output if specified)
    work_dir = None
    if args.work_dir:
        work_dir = Path(args.work_dir)
    else:
        work_dir = output_path.parent / "audio"

    # Serve assets relative to work_dir parent (so audio URLs resolve)
    serve_base = output_path.parent

    from pipeline.news_bulletin import run_bulletin
    run_bulletin(
        bulletin_config=bulletin_config,
        output_path=output_path,
        work_dir=work_dir,
        fps=args.fps,
        serve_base=serve_base,
    )


if __name__ == "__main__":
    main()
