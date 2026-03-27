"""News fetcher pipeline.

Fetches RSS feeds, extracts article content via Open Graph scraping,
and generates broadcast-style narrations with Gemini 2.5 Flash.

Usage:
    from pipeline.news_fetcher import load_sources, save_sources, fetch_and_draft
"""
from __future__ import annotations

import concurrent.futures
import logging
import secrets
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import feedparser  # type: ignore
import requests
from bs4 import BeautifulSoup

logger = logging.getLogger("news_fetcher")

from config import settings


# ── Constants ─────────────────────────────────────────────────────────────────

SOURCES_FILE = Path("bulletin_sources.json")

# Reuse same Gemini endpoint as pipeline/script.py
KIEAI_BASE_URL = "https://api.kie.ai/gemini-2.5-flash/v1"
KIEAI_MODEL = "gemini-2.5-flash"

_NARRATION_SYSTEM = """\
You are a professional broadcast news anchor writer. Your job is to rewrite a news article as a short spoken narration for a TV news bulletin.

RULES (follow all strictly):
1. Write 2-4 sentences of natural spoken news language — authoritative but clear.
2. Use the headline as your opening hook, then expand with key facts from the summary.
3. Do NOT include: journalist names, bylines, publication names, "according to", "it is reported".
4. Do NOT start with "In" or "Today" — vary your openings.
5. Write in the language specified in the LANGUAGE field.
   If Turkish: use formal broadcast Turkish (standard news register, not colloquial).
6. Never invent facts not present in the provided text.
7. End with a single strong declarative sentence that closes the item cleanly.
8. Length: 40-80 words total.
9. ANTI-CLICKBAIT — absolutely no sensationalism:
   - Never use exaggerated language like "shocking", "unbelievable", "you won't believe", "explosive", "mind-blowing".
   - Never omit key facts to create artificial suspense.
   - Never use question headlines ("Will X happen?") or cliffhangers.
   - Report only verified facts present in the source text.
   - Titles and content must reflect the actual news — not a dramatised version.
10. If any language did not specified, auto detect it and write a formal content.

Return ONLY the narration text. No JSON, no explanation, no quotation marks around the text.

11. Strictly follow language rules (even if you auto detected a language strictly follow rules for that language) and the other rules.\
"""


# ── Data structures ───────────────────────────────────────────────────────────

@dataclass
class FetchedItem:
    source_id: str
    source_name: str
    category: str
    language: str
    title: str
    summary: str
    image_url: str
    source_url: str
    published: str
    body_text: str


# ── Source persistence ────────────────────────────────────────────────────────

def load_sources() -> list[dict]:
    """Load RSS sources from disk. Returns [] if file does not exist."""
    import json
    if not SOURCES_FILE.exists():
        return []
    try:
        return json.loads(SOURCES_FILE.read_text(encoding="utf-8"))
    except Exception:
        return []


def save_sources(sources: list[dict]) -> None:
    import json
    SOURCES_FILE.write_text(json.dumps(sources, ensure_ascii=False, indent=2), encoding="utf-8")


# ── LLM call ─────────────────────────────────────────────────────────────────

def _gemini_narration(title: str, summary: str, body_text: str, source_name: str, language: str) -> str:
    """Call Gemini to generate a broadcast narration. Returns fallback to summary on error."""
    try:
        from openai import OpenAI  # type: ignore
        from pipeline.script import _load_custom_prompt

        system_prompt = _load_custom_prompt("bulletin_narration") or _NARRATION_SYSTEM
    except ImportError:
        print("  [news_fetcher] openai or pipeline.script not found, cannot generate narration.")
        return summary or title

    if not settings.kieai_api_key:
        return summary or title

    user_msg = (
        f"HEADLINE: {title}\n"
        f"SUMMARY: {summary}\n"
        f"BODY EXCERPT: {body_text[:600]}\n"
        f"SOURCE: {source_name}\n"
        f"LANGUAGE: {language or 'tr'}"
    )
    try:
        client = OpenAI(api_key=settings.kieai_api_key, base_url=KIEAI_BASE_URL)
        response = client.chat.completions.create(
            model=KIEAI_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_msg},
            ],
            extra_body={"include_thoughts": False},
            stream=False,
        )
        return (response.choices[0].message.content or "").strip()
    except Exception as exc:
        print(f"  [news_fetcher] narration LLM failed: {exc}")
        return summary or title


# ── OG / article scraping ─────────────────────────────────────────────────────

def _fetch_og(url: str) -> tuple[str, str]:
    """Fetch a URL and extract (og:image, body_text). Never raises."""
    if not url:
        return "", ""
    try:
        resp = requests.get(
            url, timeout=8,
            headers={"User-Agent": "Mozilla/5.0 (compatible; YTRobot/1.0)"},
            allow_redirects=True,
        )
        resp.raise_for_status()
    except Exception:
        return "", ""

    soup = BeautifulSoup(resp.text, "html.parser")

    # OG image — fallback chain: og:image → twitter:image → first <img> in article
    image_url = ""
    og_img = soup.find("meta", property="og:image")
    if og_img and og_img.get("content"):
        image_url = og_img["content"]
    if not image_url:
        tw_img = soup.find("meta", attrs={"name": "twitter:image"})
        if tw_img and tw_img.get("content"):
            image_url = tw_img["content"]

    # Body text — prefer <article> or <main>
    body_el = soup.find("article") or soup.find("main") or soup.find("body")
    body_text = ""
    if body_el:
        body_text = body_el.get_text(" ", strip=True)[:900]

    return image_url, body_text


# ── RSS feed fetching ─────────────────────────────────────────────────────────

def _clean_html(text: str) -> str:
    """Strip HTML tags from a string."""
    return BeautifulSoup(text or "", "html.parser").get_text(" ", strip=True)


_FEED_TIMEOUT_SECS = 10  # Max seconds to wait for a single RSS feed


def _parse_feed_with_timeout(url: str) -> Any:
    """Parse an RSS feed with a hard timeout to prevent blocking on slow/hung feeds."""
    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(
            feedparser.parse,
            url,
            agent="Mozilla/5.0 (compatible; YTRobot/1.0)",
            request_headers={"Accept": "application/rss+xml, application/xml, text/xml"},
        )
        try:
            return future.result(timeout=_FEED_TIMEOUT_SECS)
        except concurrent.futures.TimeoutError:
            logger.warning(f"[NewsFetcher] Feed timed out after {_FEED_TIMEOUT_SECS}s: {url}")
            return None


def _fetch_feed(source: dict, max_items: int) -> list[FetchedItem]:
    """Fetch a single RSS feed and return up to max_items FetchedItems."""
    feed = _parse_feed_with_timeout(source["url"])
    if feed is None:
        return []  # Timed out — skip this source gracefully

    items: list[FetchedItem] = []
    for entry in feed.entries[:max_items]:
        title = _clean_html(getattr(entry, "title", "")).strip()
        if not title:
            continue

        summary = _clean_html(getattr(entry, "summary", "") or getattr(entry, "description", "")).strip()
        link = getattr(entry, "link", "") or ""

        # Published timestamp
        published = ""
        if hasattr(entry, "published"):
            published = entry.published
        elif hasattr(entry, "updated"):
            published = entry.updated

        # Image from enclosure or media:thumbnail
        image_url = ""
        enclosures = getattr(entry, "enclosures", [])
        if enclosures:
            enc = enclosures[0]
            if enc.get("type", "").startswith("image"):
                image_url = enc.get("href", "")
        if not image_url:
            media = getattr(entry, "media_thumbnail", None)
            if media:
                image_url = media[0].get("url", "")

        items.append(FetchedItem(
            source_id=source["id"],
            source_name=source.get("name", ""),
            category=source.get("category", "Genel"),
            language=source.get("language", "tr"),
            title=title,
            summary=summary,
            image_url=image_url,
            source_url=link,
            published=published,
            body_text="",
        ))

    return items


# ── Main pipeline ─────────────────────────────────────────────────────────────

def fetch_and_draft(
    sources: list[dict],
    max_items_per_source: int = 3,
    language_override: str = "",
    source_ids: list[str] | None = None,
    used_urls: set[str] | None = None,
) -> dict:
    """
    Fetch sources, scrape OG data, generate narrations.

    Args:
        source_ids: If provided, only fetch from these source IDs (ignores enabled flag).
                    If None, fetch all enabled sources.
        used_urls:  Set of URLs to skip (deduplication — previously rendered items).

    Returns:
        {
            "categories": { "Ekonomi": [DraftItem, ...], ... },
            "total": int,
            "errors": [{"source_id": ..., "source_name": ..., "error": ...}]
        }

    DraftItem is a plain dict with keys:
        id, source_id, source_name, category, language,
        title, summary, image_url, source_url, published, narration, selected
    """
    if source_ids is not None:
        enabled = [s for s in sources if s.get("id") in source_ids]
    else:
        enabled = [s for s in sources if s.get("enabled", True)]
    categories: dict[str, list[dict]] = {}
    errors: list[dict] = []
    total = 0

    for source in enabled:
        print(f"  [news_fetcher] fetching: {source.get('name')} ({source['url']})")
        try:
            raw_items = _fetch_feed(source, max_items_per_source)
        except Exception as exc:
            errors.append({"source_id": source["id"], "source_name": source.get("name", ""), "error": str(exc)})
            continue

        for fetched in raw_items:
            # Skip previously rendered items (deduplication)
            if used_urls and fetched.source_url and fetched.source_url in used_urls:
                print(f"    → skipping (already used): {fetched.title[:60]}")
                continue

            # OG scrape for image + body text
            og_image, body_text = _fetch_og(fetched.source_url)
            if og_image and not fetched.image_url:
                fetched.image_url = og_image
            fetched.body_text = body_text

            # LLM narration
            lang = language_override or fetched.language or "tr"
            print(f"    → narration: {fetched.title[:60]}")
            narration = _gemini_narration(
                fetched.title, fetched.summary, fetched.body_text,
                fetched.source_name, lang,
            )

            draft_item = {
                "id": "item_" + secrets.token_hex(4),
                "source_id": fetched.source_id,
                "source_name": fetched.source_name,
                "category": fetched.category,
                "language": lang,
                "title": fetched.title,
                "summary": fetched.summary,
                "image_url": fetched.image_url,
                "source_url": fetched.source_url,
                "published": fetched.published,
                "narration": narration,
                "selected": True,
            }

            cat = fetched.category or "Genel"
            if cat not in categories:
                categories[cat] = []
            categories[cat].append(draft_item)
            total += 1

    return {"categories": categories, "total": total, "errors": errors}
