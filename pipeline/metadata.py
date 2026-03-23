"""Metadata generation stage.

Given the script scenes, generates YouTube-optimised:
  - title             (under 70 chars, click-worthy)
  - description       (3-4 paragraphs, keyword-rich)
  - tags              (list of 10-15 tags)
  - thumbnail_concept (visual description of the ideal thumbnail)

Uses Gemini 2.5 Flash via kie.ai (same helper as pipeline/script.py).
"""
import json
from dataclasses import dataclass, field
from pathlib import Path

from pipeline.script import Scene, _chat, _load_custom_prompt


METADATA_SYSTEM_PROMPT = """\
You are an expert YouTube SEO strategist and thumbnail designer. Given the narration
text of a video script, generate YouTube metadata that maximises click-through rate
and search visibility.

Return ONLY a valid JSON object with these exact keys:
  "title"             — one punchy, curiosity-driven YouTube title (max 70 characters).
                        Use numbers, power words, or open loops. Never use clickbait that
                        the video doesn't deliver on.
  "description"       — 3-4 paragraphs of engaging, keyword-rich description.
                        Include relevant keywords naturally. End with a call-to-action.
  "tags"              — a JSON array of 10-15 relevant search tags (strings, no #)
  "thumbnail_concept" — a clear, visual description of the ideal YouTube thumbnail for
                        this video. Describe: main visual element, text overlay (max 4 words),
                        color mood, and why it would make someone stop scrolling.
                        Example: "Close-up of shocked face on left, bold red text 'I WAS WRONG'
                        on right, dark background — triggers curiosity and contrast."

Do not add any text outside the JSON object.\
"""


@dataclass
class VideoMetadata:
    title: str
    description: str
    tags: list[str]
    thumbnail_concept: str = ""


def generate_metadata(scenes: list[Scene], topic: str = "") -> VideoMetadata:
    """Generate title, description, tags, and thumbnail concept from the full script."""
    full_narration = "\n\n".join(s.narration for s in scenes)
    user_msg = f"Topic: {topic}\n\nScript narration:\n{full_narration}" if topic else f"Script narration:\n{full_narration}"

    raw = _chat(_load_custom_prompt("metadata_system") or METADATA_SYSTEM_PROMPT, user_msg)
    data = json.loads(raw)
    return VideoMetadata(
        title=data["title"],
        description=data["description"],
        tags=data["tags"],
        thumbnail_concept=data.get("thumbnail_concept", ""),
    )


def save_metadata(meta: VideoMetadata, output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(
            {
                "title": meta.title,
                "description": meta.description,
                "tags": meta.tags,
                "thumbnail_concept": meta.thumbnail_concept,
            },
            f,
            indent=2,
            ensure_ascii=False,
        )
    # Also write a plain-text version for easy copy-paste
    txt_path = output_path.with_suffix(".txt")
    with open(txt_path, "w", encoding="utf-8") as f:
        f.write(f"TITLE\n{'='*60}\n{meta.title}\n\n")
        f.write(f"DESCRIPTION\n{'='*60}\n{meta.description}\n\n")
        f.write(f"TAGS\n{'='*60}\n{', '.join(meta.tags)}\n\n")
        if meta.thumbnail_concept:
            f.write(f"THUMBNAIL CONCEPT\n{'='*60}\n{meta.thumbnail_concept}\n")
