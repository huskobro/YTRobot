import json
import logging
from pathlib import Path
from datetime import datetime, timezone
from typing import List, Optional

logger = logging.getLogger("ContentCalendar")

CALENDAR_FILE = Path("data/content_calendar.json")


class ContentCalendar:
    def __init__(self):
        self._entries = []
        self._load()

    def _load(self):
        CALENDAR_FILE.parent.mkdir(parents=True, exist_ok=True)
        if CALENDAR_FILE.exists():
            try: self._entries = json.loads(CALENDAR_FILE.read_text())
            except: self._entries = []

    def _save(self):
        CALENDAR_FILE.parent.mkdir(parents=True, exist_ok=True)
        CALENDAR_FILE.write_text(json.dumps(self._entries, indent=2, ensure_ascii=False))

    def add_entry(self, title: str, channel_id: str = "_default",
                  planned_date: str = "", topic: str = "", status: str = "idea",
                  notes: str = "", tags: list = None) -> dict:
        entry = {
            "id": f"cal_{int(datetime.now(timezone.utc).timestamp()*1000)}",
            "title": title,
            "channel_id": channel_id,
            "planned_date": planned_date,
            "topic": topic,
            "status": status,  # idea | planned | in_progress | produced | published
            "notes": notes,
            "tags": tags or [],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "session_id": "",
        }
        self._entries.append(entry)
        self._save()
        return entry

    def get_entries(self, channel_id: str = "", status: str = "", month: str = "") -> List[dict]:
        result = self._entries
        if channel_id:
            result = [e for e in result if e.get("channel_id") == channel_id]
        if status:
            result = [e for e in result if e.get("status") == status]
        if month:  # Format: "2026-03"
            result = [e for e in result if e.get("planned_date", "").startswith(month)]
        return result

    def update_entry(self, entry_id: str, updates: dict) -> Optional[dict]:
        for e in self._entries:
            if e["id"] == entry_id:
                for k, v in updates.items():
                    if k != "id":
                        e[k] = v
                self._save()
                return e
        return None

    def delete_entry(self, entry_id: str) -> bool:
        before = len(self._entries)
        self._entries = [e for e in self._entries if e["id"] != entry_id]
        if len(self._entries) < before:
            self._save()
            return True
        return False

    def link_session(self, entry_id: str, session_id: str):
        for e in self._entries:
            if e["id"] == entry_id:
                e["session_id"] = session_id
                e["status"] = "in_progress"
                self._save()
                return e
        return None

content_calendar = ContentCalendar()
