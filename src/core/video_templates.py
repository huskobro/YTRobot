import json
import logging
from pathlib import Path
from datetime import datetime, timezone

logger = logging.getLogger("VideoTemplates")
TEMPLATES_FILE = Path("data/video_templates.json")

class VideoTemplateManager:
    def __init__(self):
        self._templates = []
        self._load()

    def _load(self):
        TEMPLATES_FILE.parent.mkdir(parents=True, exist_ok=True)
        if TEMPLATES_FILE.exists():
            try: self._templates = json.loads(TEMPLATES_FILE.read_text())
            except: self._templates = []

    def _save(self):
        TEMPLATES_FILE.parent.mkdir(parents=True, exist_ok=True)
        TEMPLATES_FILE.write_text(json.dumps(self._templates, indent=2, ensure_ascii=False))

    def create(self, name: str, settings: dict, channel_id: str = "_default", description: str = "") -> dict:
        template = {
            "id": f"tmpl_{int(datetime.now(timezone.utc).timestamp()*1000)}",
            "name": name,
            "description": description,
            "channel_id": channel_id,
            "settings": settings,
            "usage_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        self._templates.append(template)
        self._save()
        return template

    def get_all(self, channel_id: str = "") -> list:
        if channel_id:
            return [t for t in self._templates if t.get("channel_id") in (channel_id, "_default")]
        return self._templates

    def get(self, template_id: str) -> dict:
        for t in self._templates:
            if t["id"] == template_id:
                return t
        return None

    def apply(self, template_id: str) -> dict:
        template = self.get(template_id)
        if template:
            template["usage_count"] = template.get("usage_count", 0) + 1
            self._save()
            return template.get("settings", {})
        return None

    def update(self, template_id: str, updates: dict) -> dict:
        for t in self._templates:
            if t["id"] == template_id:
                for k, v in updates.items():
                    if k not in ("id", "created_at"):
                        t[k] = v
                self._save()
                return t
        return None

    def delete(self, template_id: str) -> bool:
        before = len(self._templates)
        self._templates = [t for t in self._templates if t["id"] != template_id]
        if len(self._templates) < before:
            self._save()
            return True
        return False

    def create_from_session(self, session_id: str, name: str) -> dict:
        """Create template from an existing session's settings."""
        from pathlib import Path as P
        for base in ["sessions", "output"]:
            sj = P(f"{base}/{session_id}/session.json")
            if sj.exists():
                try:
                    data = json.loads(sj.read_text())
                    settings = {k: v for k, v in data.items() if k in (
                        "tts_provider", "visuals_provider", "composer", "subtitle_provider",
                        "subtitle_animation", "ken_burns_zoom", "transition_duration",
                        "video_effect", "subtitle_font", "subtitle_size", "subtitle_color",
                    )}
                    return self.create(name, settings, data.get("channel_id", "_default"))
                except Exception:
                    pass
        return None

video_template_manager = VideoTemplateManager()
