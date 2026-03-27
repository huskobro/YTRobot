import json
import logging
from pathlib import Path
from datetime import datetime, timezone

logger = logging.getLogger("Notifications")

NOTIF_FILE = Path("data/notifications.json")
MAX_NOTIFICATIONS = 100


class NotificationCenter:
    def __init__(self):
        self._notifications = []
        self._load()

    def _load(self):
        NOTIF_FILE.parent.mkdir(parents=True, exist_ok=True)
        if NOTIF_FILE.exists():
            try: self._notifications = json.loads(NOTIF_FILE.read_text())
            except: self._notifications = []

    def _save(self):
        NOTIF_FILE.parent.mkdir(parents=True, exist_ok=True)
        if len(self._notifications) > MAX_NOTIFICATIONS:
            self._notifications = self._notifications[-MAX_NOTIFICATIONS:]
        NOTIF_FILE.write_text(json.dumps(self._notifications, indent=2, ensure_ascii=False))

    def add(self, title: str, message: str, type: str = "info",
            channel_id: str = "_default", link: str = "") -> dict:
        notif = {
            "id": f"notif_{int(datetime.now(timezone.utc).timestamp()*1000)}",
            "title": title,
            "message": message,
            "type": type,  # info | success | warning | error
            "channel_id": channel_id,
            "link": link,
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        self._notifications.append(notif)
        self._save()
        return notif

    def get_all(self, unread_only: bool = False, limit: int = 50) -> list:
        result = list(reversed(self._notifications))
        if unread_only:
            result = [n for n in result if not n.get("read")]
        return result[:limit]

    def mark_read(self, notif_id: str) -> bool:
        for n in self._notifications:
            if n["id"] == notif_id:
                n["read"] = True
                self._save()
                return True
        return False

    def mark_all_read(self):
        for n in self._notifications:
            n["read"] = True
        self._save()

    def unread_count(self) -> int:
        return len([n for n in self._notifications if not n.get("read")])

notification_center = NotificationCenter()
