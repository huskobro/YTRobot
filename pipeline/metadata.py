"""Metadata generation stage.

Given the script scenes, generates YouTube-optimised:
  - title    (under 70 chars, click-worthy)
  - description (3-4 paragraphs, keyword-rich)
  - tags     (list of 10-15 tags)

Uses Gemini 2.5 Flash via kie.ai (same helper as pipeline/script.py).
"""
import json
from dataclasses import dataclass
from pathlib import Path

from pipeline.script import Scene, _chat


METADATA_SYSTEM_PROMPT = """\
You are an expert YouTube SEO strategist. Given the narration text of a video script, \
generate YouTube metadata that maximises click-through rate and search visibility.

Return ONLY a valid JSON object with these exact keys:
  "title"       – one punchy, curiosity-driven YouTube title (max 70 characters)
  "description" – 3-4 paragraphs of engaging, keyword-rich description \
(include relevant keywords naturally, end with a call-to-action)
  "tags"        – a JSON array of 10-15 relevant search tags (strings, no #)

Do not add any text outside the JSON object.\
"""


@dataclass
class VideoMetadata:
    title: str
    description: str
    tags: list[str]


def generate_metadata(scenes: list[Scene], topic: str = "") -> VideoMetadata:
    """Generate title, description, and tags from the full script."""
    full_narration = "\n\n".join(s.narration for s in scenes)
    user_msg = f"Topic: {topic}\n\nScript narration:\n{full_narration}" if topic else f"Script narration:\n{full_narration}"

    raw = _chat(METADATA_SYSTEM_PROMPT, user_msg)
    data = json.loads(raw)
    return VideoMetadata(
        title=data["title"],
        description=data["description"],
        tags=data["tags"],
    )


def save_metadata(meta: VideoMetadata, output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(
            {"title": meta.title, "description": meta.description, "tags": meta.tags},
            f,
            indent=2,
            ensure_ascii=False,
        )
    # Also write a plain-text version for easy copy-paste
    txt_path = output_path.with_suffix(".txt")
    with open(txt_path, "w", encoding="utf-8") as f:
        f.write(f"TITLE\n{'='*60}\n{meta.title}\n\n")
        f.write(f"DESCRIPTION\n{'='*60}\n{meta.description}\n\n")
        f.write(f"TAGS\n{'='*60}\n{', '.join(meta.tags)}\n")
