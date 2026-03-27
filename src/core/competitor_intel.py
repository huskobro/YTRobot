import json
import logging
import os
import time
import urllib.request as urllib_req
from difflib import SequenceMatcher
from pathlib import Path
from typing import Dict, Any, List, Optional

logger = logging.getLogger("ytrobot.competitor_intel")

# Global fallback data file (backward compat with antigravity_data.json)
GLOBAL_DATA_FILE = Path("antigravity_data.json")
CHANNELS_DIR = Path("channels")


def _channel_data_file(channel_slug: Optional[str]) -> Path:
    """Return channel-specific competitors.json, or global fallback."""
    if channel_slug:
        path = CHANNELS_DIR / channel_slug / "competitors.json"
        if path.exists():
            return path
    return GLOBAL_DATA_FILE


def _load_data(channel_slug: Optional[str] = None) -> Dict[str, Any]:
    data_file = _channel_data_file(channel_slug)
    if data_file.exists():
        try:
            return json.loads(data_file.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {"channels": [], "title_pool": [], "used_titles": []}


def _save_data(data: Dict[str, Any], channel_slug: Optional[str] = None):
    data_file = _channel_data_file(channel_slug)
    # If no channel-specific file exists yet and slug provided, write to channel dir
    if channel_slug and not data_file.exists():
        channel_dir = CHANNELS_DIR / channel_slug
        if channel_dir.exists():
            data_file = channel_dir / "competitors.json"
    data_file.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")


def get_data(channel_slug: Optional[str] = None) -> Dict[str, Any]:
    return _load_data(channel_slug)


def save_channel(channel: Dict[str, Any], channel_slug: Optional[str] = None) -> Dict[str, Any]:
    data = _load_data(channel_slug)
    existing = next((c for c in data["channels"] if c["id"] == channel["id"]), None)
    if existing:
        existing.update(channel)
    else:
        data["channels"].append(channel)
    _save_data(data, channel_slug)
    return channel


def delete_channel(channel_id: str, channel_slug: Optional[str] = None):
    data = _load_data(channel_slug)
    data["channels"] = [c for c in data["channels"] if c["id"] != channel_id]
    _save_data(data, channel_slug)


def update_title(title_id: str, updates: Dict[str, Any], channel_slug: Optional[str] = None) -> Optional[Dict[str, Any]]:
    data = _load_data(channel_slug)
    entry = next((t for t in data["title_pool"] if t["id"] == title_id), None)
    if entry:
        entry.update(updates)
        _save_data(data, channel_slug)
    return entry


def delete_title(title_id: str, channel_slug: Optional[str] = None):
    data = _load_data(channel_slug)
    data["title_pool"] = [t for t in data["title_pool"] if t["id"] != title_id]
    _save_data(data, channel_slug)


def _youtube_search(channel_id: str, max_results: int, api_key: str) -> List[Dict]:
    """Fetch recent video titles from a YouTube channel."""
    url = (
        f"https://www.googleapis.com/youtube/v3/search"
        f"?part=snippet&channelId={channel_id}&maxResults={max_results}"
        f"&order=date&type=video&key={api_key}"
    )
    try:
        req = urllib_req.Request(url)
        with urllib_req.urlopen(req, timeout=15) as r:
            result = json.loads(r.read())
        return [
            {
                "title": item["snippet"]["title"],
                "video_id": item["id"]["videoId"],
                "channel_title": item["snippet"]["channelTitle"],
                "published_at": item["snippet"]["publishedAt"],
            }
            for item in result.get("items", [])
        ]
    except Exception as e:
        logger.error(f"YouTube search error for {channel_id}: {e}")
        return []


def _score_title_with_ai(title: str, api_key: str) -> Dict[str, Any]:
    """Score a title on 5 dimensions via Gemini."""
    prompt = (
        f"Score this YouTube title on 5 dimensions (0-10 each):\n"
        f"Title: {title}\n\n"
        f"Return ONLY valid JSON:\n"
        f'{{"curiosity":7,"emotion":6,"psychology":5,"ctr":8,"trend":6,"viral_score":6.4}}'
    )
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key, base_url="https://api.kie.ai/gemini-2.5-flash/v1")
        resp = client.chat.completions.create(
            model="gemini-2.5-flash",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
        )
        import re
        raw = resp.choices[0].message.content.strip()
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        return json.loads(raw)
    except Exception as e:
        logger.warning(f"Title scoring failed for '{title}': {e}")
        return {"curiosity": 5, "emotion": 5, "psychology": 5, "ctr": 5, "trend": 5, "viral_score": 5.0}


def _similarity(a: str, b: str) -> float:
    """Return similarity ratio (0.0–1.0) between two strings."""
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()


def _rewrite_title(title: str, language: str, dna: str, api_key: str, max_retries: int = 2) -> str:
    """Rewrite a title in target language/DNA style. Re-tries if similarity > 70%."""
    prompt = (
        f"Rewrite this YouTube title in {language} language with a {dna} content style.\n"
        f"Make it more engaging and click-worthy.\n"
        f"Change the sentence structure completely. The rewritten title must feel like a NEW title.\n"
        f"Original: {title}\n"
        f"Return ONLY the rewritten title, nothing else."
    )
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key, base_url="https://api.kie.ai/gemini-2.5-flash/v1")
        for attempt in range(max_retries + 1):
            resp = client.chat.completions.create(
                model="gemini-2.5-flash",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7 + attempt * 0.1,
            )
            result = resp.choices[0].message.content.strip()
            if _similarity(title, result) < 0.70:
                return result
            logger.info(f"Rewrite attempt {attempt+1}: similarity too high ({_similarity(title, result):.0%}), retrying")
        return result  # return last attempt even if similarity is high
    except Exception as e:
        logger.warning(f"Title rewrite failed: {e}")
        return title


def scan_channel(channel_id: str, channel_slug: Optional[str] = None) -> Dict[str, Any]:
    """Run a competitor scan for a registered channel."""
    from config import settings
    api_key = getattr(settings, "kieai_api_key", "") or os.environ.get("KIEAI_API_KEY", "")
    yt_key = getattr(settings, "youtube_api_key", "") or os.environ.get("YOUTUBE_API_KEY", "")

    data = _load_data(channel_slug)
    channel = next((c for c in data["channels"] if c["id"] == channel_id), None)
    if not channel:
        return {"error": "Channel not found"}

    competitors = channel.get("competitors", [])
    pull_count = channel.get("pull_count", 10)
    language = channel.get("language", "Turkish")
    # DNA: check dedicated field, fall back to master_prompt or default_category
    dna = channel.get("dna") or channel.get("master_prompt") or channel.get("default_category") or "Documentary"

    existing_titles = {t["original_title"] for t in data["title_pool"]}
    used_titles = set(data.get("used_titles", []))
    new_entries = []

    for comp in competitors:
        comp_channel_id = comp.get("channel_id", "")
        if not comp_channel_id or not yt_key:
            continue
        videos = _youtube_search(comp_channel_id, pull_count, yt_key)
        for v in videos:
            t = v["title"]
            if t in existing_titles or t in used_titles:
                continue
            existing_titles.add(t)
            scores = _score_title_with_ai(t, api_key) if api_key else {
                "curiosity": 5, "emotion": 5, "psychology": 5, "ctr": 5, "trend": 5, "viral_score": 5.0
            }
            rewritten = _rewrite_title(t, language, dna, api_key) if api_key else t
            entry = {
                "id": f"ci_{int(time.time()*1000)}_{len(new_entries)}",
                "original_title": t,
                "rewritten_title": rewritten,
                "source_channel": v["channel_title"],
                "video_id": v["video_id"],
                "published_at": v["published_at"],
                "scores": scores,
                "viral_score": scores.get("viral_score", 5.0),
                "status": "new",
                "channel_id": channel_id,
                "scanned_at": time.time(),
            }
            new_entries.append(entry)

    data["title_pool"].extend(new_entries)
    # Sort by viral score (strongest first), trim to 500
    data["title_pool"] = sorted(
        data["title_pool"], key=lambda x: x.get("viral_score", 0), reverse=True
    )[:500]
    _save_data(data, channel_slug)
    return {"added": len(new_entries), "total_pool": len(data["title_pool"])}


def mark_title_used(title_id: str, channel_slug: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Mark a title as used — moves it to used_titles and sets status."""
    data = _load_data(channel_slug)
    entry = next((t for t in data["title_pool"] if t["id"] == title_id), None)
    if entry:
        entry["status"] = "used"
        entry["used_at"] = time.time()
        # Add to used_titles set for dedup
        used = data.get("used_titles", [])
        if entry["original_title"] not in used:
            used.append(entry["original_title"])
        data["used_titles"] = used
        _save_data(data, channel_slug)
    return entry


def get_title_pool(channel_slug: Optional[str] = None, min_score: float = 0) -> List[Dict[str, Any]]:
    """Return the title pool sorted by viral score, optionally filtered by min score."""
    pool = _load_data(channel_slug).get("title_pool", [])
    if min_score > 0:
        pool = [t for t in pool if t.get("viral_score", 0) >= min_score]
    return sorted(pool, key=lambda x: x.get("viral_score", 0), reverse=True)


def get_heatmap_data(channel_slug: str = "") -> dict:
    """Generate heatmap data showing competitor activity patterns."""
    data = get_data(channel_slug)
    channels = data.get("channels", [])

    # Analyze upload patterns by day of week and hour
    day_hour_grid = [[0] * 24 for _ in range(7)]  # 7 days x 24 hours
    title_lengths = []
    tag_frequency = {}

    for channel in channels:
        for video in channel.get("recent_videos", channel.get("videos", [])):
            # Parse published date if available
            pub = video.get("published_at", "")
            if pub:
                try:
                    from datetime import datetime as dt
                    if "T" in pub:
                        d = dt.fromisoformat(pub.replace("Z", "+00:00"))
                        day_hour_grid[d.weekday()][d.hour] += 1
                except Exception:
                    pass

            # Title analysis
            title = video.get("title", "")
            if title:
                title_lengths.append(len(title))

            # Tag frequency
            for tag in video.get("tags", []):
                tag_frequency[tag.lower()] = tag_frequency.get(tag.lower(), 0) + 1

    # Find peak times
    peak_times = []
    for day in range(7):
        for hour in range(24):
            if day_hour_grid[day][hour] > 0:
                peak_times.append({
                    "day": ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"][day],
                    "hour": hour,
                    "count": day_hour_grid[day][hour],
                })

    peak_times.sort(key=lambda x: x["count"], reverse=True)

    # Top tags
    top_tags = sorted(tag_frequency.items(), key=lambda x: x[1], reverse=True)[:20]

    return {
        "heatmap": day_hour_grid,
        "peak_times": peak_times[:10],
        "avg_title_length": round(sum(title_lengths) / max(1, len(title_lengths)), 1),
        "top_tags": [{"tag": t, "count": c} for t, c in top_tags],
        "channels_analyzed": len(channels),
    }


# Module-level convenience: CompetitorIntelEngine class for structured usage
class CompetitorIntelEngine:
    """Competitor intelligence engine — wraps module-level functions."""

    def get_data(self, channel_slug: Optional[str] = None) -> Dict[str, Any]:
        return get_data(channel_slug)

    def save_channel(self, channel: Dict[str, Any], channel_slug: Optional[str] = None) -> Dict[str, Any]:
        return save_channel(channel, channel_slug)

    def delete_channel(self, channel_id: str, channel_slug: Optional[str] = None):
        return delete_channel(channel_id, channel_slug)

    def update_title(self, title_id: str, updates: Dict[str, Any], channel_slug: Optional[str] = None) -> Optional[Dict[str, Any]]:
        return update_title(title_id, updates, channel_slug)

    def delete_title(self, title_id: str, channel_slug: Optional[str] = None):
        return delete_title(title_id, channel_slug)

    def scan_channel(self, channel_id: str, channel_slug: Optional[str] = None) -> Dict[str, Any]:
        return scan_channel(channel_id, channel_slug)

    def mark_title_used(self, title_id: str, channel_slug: Optional[str] = None) -> Optional[Dict[str, Any]]:
        return mark_title_used(title_id, channel_slug)

    def get_title_pool(self, channel_slug: Optional[str] = None, min_score: float = 0) -> List[Dict[str, Any]]:
        return get_title_pool(channel_slug, min_score)


# Singleton
competitor_intel_engine = CompetitorIntelEngine()
