import json
import re
import time
import logging
from pathlib import Path
from typing import Dict, Any, Optional, List

logger = logging.getLogger("ChannelHub")

CHANNELS_DIR = Path("channels")
CHANNELS_INDEX = CHANNELS_DIR / "channels.json"
DEFAULT_CHANNEL_ID = "_default"


class ChannelHub:
    """Multi-channel management hub — singleton."""

    def __init__(self):
        self._ensure_default()

    def _ensure_default(self):
        """Create default channel structure if missing."""
        CHANNELS_DIR.mkdir(exist_ok=True)
        default_dir = CHANNELS_DIR / DEFAULT_CHANNEL_ID
        default_dir.mkdir(exist_ok=True)

        # Create channels.json index if missing
        if not CHANNELS_INDEX.exists():
            index = {
                "channels": [{
                    "id": DEFAULT_CHANNEL_ID,
                    "name": "Varsayılan Kanal",
                    "slug": DEFAULT_CHANNEL_ID,
                    "language": "tr",
                    "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                    "active": True
                }],
                "active_channel": DEFAULT_CHANNEL_ID
            }
            CHANNELS_INDEX.write_text(json.dumps(index, indent=2, ensure_ascii=False))

        # Create default config.json if missing
        config_path = default_dir / "config.json"
        if not config_path.exists():
            config = {
                "id": DEFAULT_CHANNEL_ID,
                "name": "Varsayılan Kanal",
                "language": "tr",
                "master_prompt": "",
                "default_category": "general",
                "preset_name": "",
                "branding": {
                    "logo_path": "",
                    "thumbnail_template": "classic",
                    "color_primary": "#FF0000",
                    "color_secondary": "#FFFFFF"
                },
                "platforms": {
                    "youtube": {"enabled": False, "channel_id": "", "privacy_status": "private", "category_id": "22"},
                    "instagram": {"enabled": False},
                    "tiktok": {"enabled": False}
                }
            }
            config_path.write_text(json.dumps(config, indent=2, ensure_ascii=False))

    def _read_index(self) -> dict:
        return json.loads(CHANNELS_INDEX.read_text())

    def _write_index(self, data: dict):
        CHANNELS_INDEX.write_text(json.dumps(data, indent=2, ensure_ascii=False))

    def _slugify(self, name: str) -> str:
        """Generate safe slug from channel name."""
        slug = re.sub(r'[^a-z0-9_-]', '', name.lower().replace(' ', '-').replace('ı', 'i')
                       .replace('ö', 'o').replace('ü', 'u').replace('ş', 's')
                       .replace('ç', 'c').replace('ğ', 'g'))
        return slug[:50] or "channel"

    def _channel_dir(self, channel_id: str) -> Path:
        # Sanitize to prevent path traversal
        safe_id = re.sub(r'[^a-z0-9_-]', '', channel_id)
        if not safe_id or safe_id in ('.', '..'):
            raise ValueError(f"Invalid channel ID: {channel_id}")
        return CHANNELS_DIR / safe_id

    # --- CRUD ---

    def get_channels(self) -> List[dict]:
        index = self._read_index()
        return index.get("channels", [])

    def get_channel(self, channel_id: str) -> Optional[dict]:
        config_path = self._channel_dir(channel_id) / "config.json"
        if not config_path.exists():
            return None
        return json.loads(config_path.read_text())

    def get_active_channel(self) -> dict:
        index = self._read_index()
        active_id = index.get("active_channel", DEFAULT_CHANNEL_ID)
        return self.get_channel(active_id) or self.get_channel(DEFAULT_CHANNEL_ID)

    def set_active_channel(self, channel_id: str):
        if not self._channel_dir(channel_id).exists():
            raise ValueError(f"Channel not found: {channel_id}")
        index = self._read_index()
        index["active_channel"] = channel_id
        self._write_index(index)
        logger.info(f"[ChannelHub] Active channel set to: {channel_id}")

    def create_channel(self, name: str, language: str = "tr",
                       master_prompt: str = "", default_category: str = "general",
                       preset_name: str = "", branding: Optional[dict] = None,
                       platforms: Optional[dict] = None) -> dict:
        slug = self._slugify(name)
        # Ensure unique slug
        existing_slugs = {c["slug"] for c in self.get_channels()}
        base_slug = slug
        counter = 1
        while slug in existing_slugs:
            slug = f"{base_slug}-{counter}"
            counter += 1

        channel_dir = CHANNELS_DIR / slug
        channel_dir.mkdir(parents=True, exist_ok=True)
        (channel_dir / "branding").mkdir(exist_ok=True)
        (channel_dir / "platforms").mkdir(exist_ok=True)

        config = {
            "id": slug,
            "name": name,
            "language": language,
            "master_prompt": master_prompt,
            "default_category": default_category,
            "preset_name": preset_name,
            "branding": branding or {
                "logo_path": "",
                "thumbnail_template": "classic",
                "color_primary": "#FF0000",
                "color_secondary": "#FFFFFF"
            },
            "platforms": platforms or {
                "youtube": {"enabled": False, "channel_id": "", "privacy_status": "private", "category_id": "22"},
                "instagram": {"enabled": False},
                "tiktok": {"enabled": False}
            }
        }
        (channel_dir / "config.json").write_text(json.dumps(config, indent=2, ensure_ascii=False))

        # Initialize empty analytics
        (channel_dir / "analytics.json").write_text(json.dumps({
            "total_renders": 0, "success_count": 0, "fail_count": 0,
            "total_duration": 0, "cost_estimate": 0, "daily_history": [],
            "platform_publishes": {
                "youtube": {"count": 0, "last_at": None},
                "instagram": {"count": 0, "last_at": None},
                "tiktok": {"count": 0, "last_at": None}
            }
        }, indent=2))

        # Initialize empty competitors
        (channel_dir / "competitors.json").write_text(json.dumps({
            "competitors": [], "title_pool": [], "used_titles": []
        }, indent=2))

        # Update index
        index = self._read_index()
        index["channels"].append({
            "id": slug,
            "name": name,
            "slug": slug,
            "language": language,
            "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "active": True
        })
        self._write_index(index)
        logger.info(f"[ChannelHub] Channel created: {name} ({slug})")
        return config

    def update_channel(self, channel_id: str, updates: dict) -> Optional[dict]:
        config_path = self._channel_dir(channel_id) / "config.json"
        if not config_path.exists():
            return None
        config = json.loads(config_path.read_text())

        # Update allowed fields
        for key in ("name", "language", "master_prompt", "default_category",
                     "preset_name", "branding", "platforms"):
            if key in updates:
                if key in ("branding", "platforms") and isinstance(updates[key], dict):
                    config.setdefault(key, {}).update(updates[key])
                else:
                    config[key] = updates[key]

        config_path.write_text(json.dumps(config, indent=2, ensure_ascii=False))

        # Update name in index if changed
        if "name" in updates:
            index = self._read_index()
            for ch in index["channels"]:
                if ch["id"] == channel_id:
                    ch["name"] = updates["name"]
            self._write_index(index)

        logger.info(f"[ChannelHub] Channel updated: {channel_id}")
        return config

    def delete_channel(self, channel_id: str) -> bool:
        if channel_id == DEFAULT_CHANNEL_ID:
            raise ValueError("Cannot delete default channel")

        channel_dir = self._channel_dir(channel_id)
        if not channel_dir.exists():
            return False

        import shutil
        shutil.rmtree(channel_dir)

        index = self._read_index()
        index["channels"] = [c for c in index["channels"] if c["id"] != channel_id]
        if index.get("active_channel") == channel_id:
            index["active_channel"] = DEFAULT_CHANNEL_ID
        self._write_index(index)
        logger.info(f"[ChannelHub] Channel deleted: {channel_id}")
        return True

    # --- Analytics ---

    def get_channel_analytics(self, channel_id: str) -> Optional[dict]:
        path = self._channel_dir(channel_id) / "analytics.json"
        if not path.exists():
            return None
        return json.loads(path.read_text())

    def get_all_analytics(self) -> List[dict]:
        result = []
        for ch in self.get_channels():
            analytics = self.get_channel_analytics(ch["id"])
            if analytics:
                analytics["channel_id"] = ch["id"]
                analytics["channel_name"] = ch["name"]
                result.append(analytics)
        return result

    def log_channel_render(self, channel_id: str, duration: float, status: str,
                            cost: float = 0, platform: str = ""):
        path = self._channel_dir(channel_id) / "analytics.json"
        if not path.exists():
            return
        data = json.loads(path.read_text())
        data["total_renders"] = data.get("total_renders", 0) + 1
        if status == "completed":
            data["success_count"] = data.get("success_count", 0) + 1
        else:
            data["fail_count"] = data.get("fail_count", 0) + 1
        data["total_duration"] = data.get("total_duration", 0) + duration
        data["cost_estimate"] = data.get("cost_estimate", 0) + cost

        if platform and platform in data.get("platform_publishes", {}):
            pub = data["platform_publishes"][platform]
            pub["count"] = pub.get("count", 0) + 1
            pub["last_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ")

        path.write_text(json.dumps(data, indent=2, ensure_ascii=False))

    # --- Competitors ---

    def get_channel_competitors(self, channel_id: str) -> Optional[dict]:
        path = self._channel_dir(channel_id) / "competitors.json"
        if not path.exists():
            return None
        return json.loads(path.read_text())


# Singleton
channel_hub = ChannelHub()
