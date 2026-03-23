"""Script generation stage.

A "script" is a list of Scene objects. Each scene has:
  - narration: the spoken text
  - visual_query: a short generic phrase used to search/generate the visual
                  (stock-footage-friendly, 3-5 words, no proper nouns)

Uses Gemini 2.5 Flash via kie.ai by default (KIEAI_API_KEY).
Falls back to OpenAI (OPENAI_API_KEY) if kie.ai key is not set.
"""
import json
from dataclasses import dataclass, asdict
from pathlib import Path

from config import settings


@dataclass
class Scene:
    narration: str
    visual_query: str


# ── kie.ai / Gemini 2.5 Flash ──────────────────────────────────────────────

KIEAI_BASE_URL = "https://api.kie.ai/gemini-2.5-flash/v1"
KIEAI_MODEL = "gemini-2.5-flash"

SCRIPT_SYSTEM_PROMPT = """\
You are a professional YouTube scriptwriter. Given a topic, write a compelling \
long-form video script optimised for viewer retention.

Return ONLY a valid JSON object with a single key "scenes" containing an array. \
Each element must have exactly two keys:
  "narration"     – the spoken words for that scene (3-6 engaging sentences)
  "visual_query"  – a SHORT, generic, stock-footage-friendly phrase \
(3-5 words, NO proper nouns, NO historical figures, NO brand names). \
Examples of good visual_query values: "ancient stone ruins", \
"busy city street night", "scientist working lab", "mountain river aerial".

Write exactly 10 scenes. Do not add any text outside the JSON object.\
"""


def _client_and_model():
    from openai import OpenAI
    if settings.kieai_api_key:
        return OpenAI(api_key=settings.kieai_api_key, base_url=KIEAI_BASE_URL), KIEAI_MODEL
    return OpenAI(api_key=settings.openai_api_key), "gpt-4o"


def _chat(system: str, user: str) -> str:
    """Call Gemini 2.5 Flash via kie.ai (falls back to OpenAI if no kie.ai key)."""
    client, model = _client_and_model()
    kwargs: dict = {
        "model": model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "response_format": {"type": "json_object"},
        "stream": False,
    }
    if settings.kieai_api_key:
        # kie.ai-specific param — must go in extra_body, not top-level
        kwargs["extra_body"] = {"include_thoughts": False}
    else:
        kwargs["temperature"] = 0.7
    response = client.chat.completions.create(**kwargs)
    return response.choices[0].message.content


# ── Public API ──────────────────────────────────────────────────────────────

def _fix_scene(s: dict) -> dict:
    """Tolerate common LLM typos / alternate key names."""
    if "naration" in s and "narration" not in s:
        s = {**s, "narration": s.pop("naration")}
    return s


def generate_from_topic(topic: str) -> list[Scene]:
    raw = _chat(SCRIPT_SYSTEM_PROMPT, f"Topic: {topic}")
    data = json.loads(raw)
    scenes_data = (
        data if isinstance(data, list)
        else data.get("scenes", data.get("script", list(data.values())[0] if data else []))
    )
    return [Scene(**_fix_scene(s)) for s in scenes_data]


def load_from_file(path: Path) -> list[Scene]:
    text = path.read_text(encoding="utf-8")
    if path.suffix == ".json":
        data = json.loads(text)
        scenes_data = data if isinstance(data, list) else data.get("scenes", [])
        return [Scene(**s) for s in scenes_data]
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    scenes = []
    for para in paragraphs:
        first_sentence = para.split(".")[0][:60]
        scenes.append(Scene(narration=para, visual_query=first_sentence))
    return scenes


def save_script(scenes: list[Scene], output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump([asdict(s) for s in scenes], f, indent=2, ensure_ascii=False)
