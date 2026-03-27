"""Script generation stage.

A "script" is a list of Scene objects. Each scene has:
  - narration: the spoken text (written in natural speech with TTS emphasis markers)
  - visual_query: a short generic phrase used to search/generate the visual
                  (stock-footage-friendly, 3-5 words, no proper nouns)

Uses Gemini 2.5 Flash via kie.ai (KIEAI_API_KEY required).
"""
import json
import random
from dataclasses import dataclass, asdict
from pathlib import Path

from config import settings  # type: ignore  # pyre-ignore[missing-module-attribute]


def detect_language(text: str) -> str:
    """Detect language of text. Returns ISO 639-1 code (e.g., 'tr', 'en', 'de').
    Falls back to 'tr' if detection fails or confidence is low."""
    if not text or len(text.strip()) < 10:
        return "tr"
    try:
        from langdetect import detect, DetectorFactory
        DetectorFactory.seed = 0  # Deterministic results
        lang = detect(text[:500])  # Use first 500 chars for speed
        # Map common language codes
        supported = {"tr", "en", "de", "fr", "es", "pt", "ar", "ru", "ja", "ko", "zh-cn", "it", "nl"}
        if lang in supported:
            return lang
        return "tr"  # Default fallback
    except Exception:
        return "tr"


CATEGORY_INSTRUCTIONS = {
    "true_crime": (
        "Structure: Hook with shocking revelation → build tension → reveal backstory → "
        "escalate to climax → psychological analysis → lesson. "
        "Use suspenseful language, present tense for dramatic moments."
    ),
    "science_tech": (
        "Structure: Mind-blowing fact → explain mechanism → real-world implications → "
        "future possibilities → call to curiosity. "
        "Use analogies and avoid jargon."
    ),
    "history_mystery": (
        "Structure: Set the historical scene → introduce the mystery/conflict → "
        "present evidence → explore theories → reveal truth or lasting question."
    ),
    "motivation": (
        "Structure: Relatable struggle → inspiring story → key principles extracted → "
        "actionable steps → powerful closing vision. "
        "Use second-person 'you' to engage directly."
    ),
    "documentary": (
        "Structure: Establish setting and stakes → introduce subjects → build narrative arc → "
        "climax → reflection. "
        "Objective tone with vivid scene descriptions."
    ),
    "general": "",
}


OPENING_HOOKS = {
    "tr": [
        "Bunu biliyor muydunuz?",
        "Dikkat! Bu video hayatınızı değiştirebilir.",
        "Çoğu kişinin bilmediği bir gerçek var...",
        "Şok edici bir bilgiyle başlayalım.",
        "Hazır mısınız? Çünkü bu konuda her şey sandığınızdan farklı.",
        "İnanması güç ama bu tamamen gerçek.",
        "Size bir sır vereyim — çok az kişi bunu biliyor.",
        "Bu videoyu izledikten sonra hiçbir şey eskisi gibi olmayacak.",
    ],
    "en": [
        "Did you know this surprising fact?",
        "Warning! This video might change your perspective forever.",
        "There's something most people don't know about this...",
        "Let's start with a shocking revelation.",
        "Are you ready? Because everything you thought you knew is wrong.",
        "Hard to believe, but this is completely real.",
        "Let me tell you a secret — very few people know this.",
        "After watching this, nothing will ever be the same.",
    ],
}


NARRATIVE_ARC = """
Structure the script following this 5-phase narrative arc:

1. **HOOK** (first 10-15 seconds): Start with a powerful, attention-grabbing statement or question. Make the viewer NEED to keep watching.

2. **BUILDUP** (15 seconds to ~40% of the video): Set the context. Build curiosity and tension. Present the problem or topic from an interesting angle.

3. **CLIMAX** (40% to ~70%): Deliver the main value, revelation, or core content. This is the "meat" of the video — the insights, facts, or story climax.

4. **RESOLUTION** (70% to ~90%): Wrap up the insights. Connect the dots. Provide actionable takeaways or satisfying conclusions.

5. **CTA** (last 10%): Call to action — ask viewers to like, subscribe, comment. End with a teaser for the next video if possible.

Each scene should clearly belong to one of these phases. The transition between phases should feel natural and maintain viewer engagement.
"""


@dataclass
class Scene:
    narration: str
    visual_query: str


# ── kie.ai / Gemini 2.5 Flash ──────────────────────────────────────────────

KIEAI_BASE_URL = "https://api.kie.ai/gemini-2.5-flash/v1"
KIEAI_MODEL = "gemini-2.5-flash"

_SCRIPT_SYSTEM_PROMPT_TEMPLATE = """\
You are an expert YouTube scriptwriter whose videos get millions of views.

AUDIENCE
--------
{audience}

VIDEO STRUCTURE (follow this strictly)
---------------------------------------
• Scene 0 — HOOK: The first 30 seconds. Create an irresistible question, tension, or bold
  claim. Make the viewer feel they NEED to keep watching. Use curiosity, contrast, or a
  surprising statement. This is the most important scene.
• Scene 1 — Establish the surface problem AND hint at the deeper emotional problem beneath it.
• Scenes 2–8 — Deliver value progressively. Tell stories, build tension, use examples.
• Scene 9 — Resolve the deeper emotional problem (not just the technical surface problem).
  Leave the viewer feeling transformed, not just informed.

GOAL ALIGNMENT (critical)
--------------------------
The viewer's goal and the creator's goal must feel perfectly aligned. Never write a script
where the creator feels like they're selling or lecturing. Write as if you genuinely care
about helping this specific viewer solve their problem.

THE DEEPER PROBLEM (what separates viral from forgettable)
----------------------------------------------------------
Every great YouTube video has TWO layers:
  • Surface problem — the practical/technical topic (e.g. "how to edit videos faster")
  • Deeper problem — the emotional struggle underneath (e.g. perfectionism, fear of failure,
    self-doubt, impatience, feeling behind)
Weave the deeper emotional problem naturally throughout the narration without stating it
explicitly until the final scene.

CONVERSATIONAL WRITING STYLE (Gemini must follow every rule below)
-------------------------------------------------------------------
• Write exactly as a person speaks — contractions (it's, you're, don't, I've), fragments OK
• Vary sentence rhythm: SHORT punchy sentences. Followed by longer ones that breathe and
  elaborate. Then short again.
• NEVER use: "In conclusion", "Furthermore", "It's worth noting", "In today's world",
  "Delve into", "Leverage", or any corporate/essay language
• Write to ONE person, not a crowd. Say "you" not "viewers"
• Include moments of humor, self-awareness, or vulnerability — this is what makes it human
• Occasionally include small imperfections: hesitations ("I mean..."), rhetorical questions,
  or mid-thought corrections that feel natural in speech

TTS VOICE EMPHASIS MARKERS (so the AI voice sounds human, not robotic)
------------------------------------------------------------------------
• CAPITALIZE words that need strong spoken emphasis: "this is INSANE", "you NEED this"
• Use "..." for meaningful pauses before impactful statements:
  "And then I realized... everything I thought I knew was wrong."
• Use "!" for genuine excitement or urgency — sparingly, max 1 per scene:
  "And that's when everything clicked!"
• Use commas to create natural speech breathing rhythm
• Maximum 1–2 capitalized emphasis words per scene — do NOT over-capitalize
• NEVER use "/" (slash) — write "or" instead: "fast or easy", not "fast/easy"

LANGUAGE (critical)
-------------------
follow strictly language rule. Do not mix multiple languages.

OUTPUT FORMAT
-------------
Return ONLY a valid JSON object with key "scenes" containing exactly 10 elements.
Each element has exactly two keys:
  "narration"     — 3–6 sentences of spoken dialogue following all style rules above
  "visual_query"  — SHORT generic stock-footage phrase (3–5 words, NO proper nouns,
                    NO brand names, NO historical figures, NO text or writing visible,
                    NO whiteboards, NO signs, NO labels, NO charts, NO screens with text)
                    Good examples: "ancient stone ruins", "busy city street night",
                    "scientist working lab", "mountain river aerial view"

Do not add any text outside the JSON object.\
"""


def _load_custom_prompt(name: str) -> str | None:
    """Load a custom prompt from prompts/<name>.txt if it exists, else return None."""
    from pathlib import Path
    p = Path("prompts") / f"{name}.txt"
    return p.read_text(encoding="utf-8").strip() if p.exists() else None


def _build_script_prompt(content_category: str = "general", lang: str = "tr") -> str:
    audience = settings.target_audience.strip()
    if audience:
        audience_block = f"Target audience: {audience}"
    else:
        audience_block = "General audience — assume curious, motivated viewers who want to improve their skills."
    template = _load_custom_prompt("script_system") or _SCRIPT_SYSTEM_PROMPT_TEMPLATE
    system_prompt = template.format(audience=audience_block)
    category_note = CATEGORY_INSTRUCTIONS.get(content_category or "general", "")
    if category_note:
        system_prompt += f"\n\nContent Category Guidelines:\n{category_note}"

    # Add opening hook suggestion
    hooks = OPENING_HOOKS.get(lang, OPENING_HOOKS["tr"])
    selected_hook = random.choice(hooks)
    system_prompt += f"\n\nStart the video with a strong hook. Here's a suggestion (you can adapt it): \"{selected_hook}\"\n"

    # Add narrative arc structure
    system_prompt += NARRATIVE_ARC

    return system_prompt


def _chat(system: str, user: str) -> str:
    """Call Gemini 2.5 Flash via kie.ai — returns JSON string."""
    from openai import OpenAI  # type: ignore  # pyre-ignore[missing-module-attribute]
    if not settings.kieai_api_key:
        raise RuntimeError("KIEAI_API_KEY is required. Set it in Settings.")
    client = OpenAI(api_key=settings.kieai_api_key, base_url=KIEAI_BASE_URL)
    response = client.chat.completions.create(
        model=KIEAI_MODEL,
        messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
        response_format={"type": "json_object"},
        extra_body={"include_thoughts": False},
        stream=False,
    )
    return response.choices[0].message.content


_TTS_ENHANCE_PROMPT = """\
You are a TTS voice coach. Your job is to make AI-generated narration sound HUMAN and
natural when read by a text-to-speech voice.

Given a narration text, return it with these modifications ONLY:
1. CAPITALIZE 1–2 key words per sentence that should be spoken with strong emphasis.
   Pick the most emotionally or informationally important word.
   Example: "this changes everything" → "this changes EVERYTHING"
2. Add "..." before impactful statements to create a meaningful pause.
   Example: "And I finally got it. The secret was patience." →
            "And I finally got it. The secret... was patience."
3. Add "!" for genuine excitement, urgency, or strong emphasis. Don't be afraid to use it multiple times if the emotion calls for it.
   Only add where the speaker would naturally raise their voice with energy.
   Example: "That's the whole trick." → "That's the whole trick!"
4. Add commas where the speaker would naturally breathe or pause.
5. Do NOT change any words, sentences, or meaning. Only add emphasis markers.
6. Feel free to capitalize 2-4 important words per scene to ensure dynamic delivery.
7. Do NOT use "/" (slash) at all — if you see one, replace it with " or ".

Return ONLY the modified narration text. No explanation, no JSON, just the text.\
"""


_SCRIPT_HUMANIZE_PROMPT = """\
You are a professional script editor who turns AI-generated YouTube narration into
text that sounds like a real person spontaneously talking — not reading.

Given a narration text, rewrite it following these rules STRICTLY:

1. USE CONTRACTIONS everywhere: it's, you're, don't, I've, that's, we're, I'll, won't
2. BREAK long sentences. Mix rhythm: short punch. Then a longer one that breathes and
   builds. Then short again.
3. REMOVE ALL AI-ISMS — replace or cut any of: "delve into", "it's worth noting",
   "in conclusion", "in today's world", "leverage", "furthermore", "it's important to",
   "navigate", "landscape", "game-changer", "at the end of the day"
4. ADD natural imperfections: rhetorical questions ("You know what I mean?"),
   mid-thought pauses ("And honestly..."), hesitations ("I mean, think about it.")
5. SPEAK TO ONE PERSON: "you" not "viewers" / "everyone" / "we all"
6. KEEP all the core information and key points — only change the delivery
7. PRESERVE existing TTS markers if present: CAPS emphasis, "...", "!"
8. DO NOT add new TTS markers — that's a separate step
9. NEVER use "/" (slash) — write "or" instead: "clear or simple", not "clear/simple"

Return ONLY the rewritten narration text. No explanation, no JSON, just the text.\
"""


_COMBINED_HUMANIZE_ENHANCE_PROMPT = """\
You are a professional script editor AND TTS voice coach. In ONE pass, do both jobs:

PART 1 — HUMANIZE (rewrite for natural speech):
1. USE CONTRACTIONS everywhere: it's, you're, don't, I've, that's, we're, I'll, won't
2. BREAK long sentences. Mix rhythm: short punch. Then a longer one that breathes.
3. REMOVE ALL AI-ISMS: "delve into", "it's worth noting", "in conclusion",
   "in today's world", "leverage", "furthermore", "navigate", "landscape", "game-changer"
4. ADD natural imperfections: rhetorical questions, mid-thought pauses ("And honestly..."),
   hesitations ("I mean, think about it.")
5. SPEAK TO ONE PERSON: "you" not "viewers" / "everyone" / "we all"
6. KEEP all core information — only change the delivery

PART 2 — TTS EMPHASIS (add voice markers):
7. CAPITALIZE 1–2 key words per scene that need strong spoken emphasis.
   Example: "this changes everything" → "this changes EVERYTHING"
8. Add "..." before impactful statements for a meaningful pause.
   Example: "The secret... was patience."
9. Add "!" for genuine excitement or strong emphasis. Use it freely when the emotion calls for it.
10. Add commas where the speaker would naturally breathe.
11. Feel free to capitalize 2-4 important words per scene to ensure a dynamic, energetic delivery.

GLOBAL RULES:
• NEVER use "/" (slash) — write "or" instead
• Return ONLY the rewritten narration text. No explanation, no JSON, just the text.\
"""


def _gemini_call(system: str, user: str) -> str:
    """Single Gemini API call (non-JSON, plain text response)."""
    from openai import OpenAI  # type: ignore  # pyre-ignore[missing-module-attribute]
    if not settings.kieai_api_key:
        raise RuntimeError("KIEAI_API_KEY is required. Set it in Settings.")
    client = OpenAI(api_key=settings.kieai_api_key, base_url=KIEAI_BASE_URL)
    response = client.chat.completions.create(
        model=KIEAI_MODEL,
        messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
        extra_body={"include_thoughts": False},
        stream=False,
    )
    return response.choices[0].message.content.strip()


def humanize_and_enhance_narration(narration: str) -> str:
    """Combined pass: humanize + add TTS markers in a single Gemini call."""
    prompt = _load_custom_prompt("script_humanize") or _COMBINED_HUMANIZE_ENHANCE_PROMPT
    return _gemini_call(prompt, narration)


def humanize_script_narration(narration: str) -> str:
    """Use Gemini to rewrite narration to sound more natural/human (word-level edits)."""
    return _gemini_call(_load_custom_prompt("script_humanize") or _SCRIPT_HUMANIZE_PROMPT, narration)


def enhance_narration_for_tts(narration: str) -> str:
    """Use Gemini to add TTS emphasis markers (CAPS, pauses, exclamation)."""
    return _gemini_call(_load_custom_prompt("tts_enhance") or _TTS_ENHANCE_PROMPT, narration)


# ── Public API ──────────────────────────────────────────────────────────────

def _fix_scene(s: dict) -> dict:
    """Tolerate common LLM typos / alternate key names."""
    s = dict(s)
    if "naration" in s:
        if "narration" not in s or not s["narration"]:
            s["narration"] = s["naration"]
        s.pop("naration", None)
    # Strip any keys Scene doesn't accept
    valid = {"narration", "visual_query"}
    return {k: v for k, v in s.items() if k in valid}


def generate_from_topic(topic: str, content_category: str = "general") -> list[Scene]:
    prompt = _build_script_prompt(content_category=content_category)
    raw = _chat(prompt, f"Topic: {topic}")
    data = json.loads(raw)
    scenes_data = (
        data if isinstance(data, list)
        else data.get("scenes", data.get("script", list(data.values())[0] if data else []))
    )
    scenes = [Scene(**_fix_scene(s)) for s in scenes_data]
    both = settings.script_humanize_with_llm and settings.tts_enhance_with_llm
    only_humanize = settings.script_humanize_with_llm and not settings.tts_enhance_with_llm
    if both:
        print("  [Script] Humanizing + TTS-enhancing narrations (combined Gemini pass)...")
        scenes = [Scene(narration=humanize_and_enhance_narration(s.narration), visual_query=s.visual_query) for s in scenes]
    elif only_humanize:
        print("  [Script] Humanizing narrations with Gemini...")
        scenes = [Scene(narration=humanize_script_narration(s.narration), visual_query=s.visual_query) for s in scenes]
    return scenes


def load_from_file(path: Path) -> list[Scene]:
    text = path.read_text(encoding="utf-8")
    if path.suffix == ".json":
        data = json.loads(text)
        scenes_data = data if isinstance(data, list) else data.get("scenes", [])
        return [Scene(**s) for s in scenes_data]
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    scenes = []
    for para in paragraphs:
        first_sentence = str(para.split(".")[0])[:60]  # pyre-ignore[no-matching-overload]
        scenes.append(Scene(narration=para, visual_query=first_sentence))
    return scenes


def save_script(scenes: list[Scene], output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump([{"narration": s.narration, "visual_query": s.visual_query} for s in scenes], f, indent=2, ensure_ascii=False)
