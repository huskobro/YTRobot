import json
import logging
import time
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional

logger = logging.getLogger("AuditLog")

AUDIT_FILE = Path("data/audit_log.json")
MAX_ENTRIES = 500


class AuditLogger:
    def __init__(self):
        self._entries = []
        self._load()

    def _load(self):
        AUDIT_FILE.parent.mkdir(parents=True, exist_ok=True)
        if AUDIT_FILE.exists():
            try: self._entries = json.loads(AUDIT_FILE.read_text())
            except: self._entries = []

    def _save(self):
        AUDIT_FILE.parent.mkdir(parents=True, exist_ok=True)
        if len(self._entries) > MAX_ENTRIES:
            self._entries = self._entries[-MAX_ENTRIES:]
        AUDIT_FILE.write_text(json.dumps(self._entries, indent=2, ensure_ascii=False))

    def log(self, action: str, category: str = "system", details: dict = None,
            user: str = "system", channel_id: str = "_default"):
        entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "action": action,
            "category": category,  # settings | render | channel | auth | security
            "details": details or {},
            "user": user,
            "channel_id": channel_id,
        }
        self._entries.append(entry)
        self._save()
        logger.info(f"[Audit] {category}/{action}: {details}")

    def get_entries(self, category: str = "", limit: int = 50, offset: int = 0) -> list:
        result = self._entries
        if category:
            result = [e for e in result if e.get("category") == category]
        result = list(reversed(result))  # newest first
        return result[offset:offset + limit]

    def get_count(self, category: str = "") -> int:
        if category:
            return len([e for e in self._entries if e.get("category") == category])
        return len(self._entries)

audit_logger = AuditLogger()
