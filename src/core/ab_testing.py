import json
import logging
import random
from pathlib import Path
from datetime import datetime, timezone

logger = logging.getLogger("ABTesting")

AB_FILE = Path("data/ab_tests.json")


class ABTestManager:
    def __init__(self):
        self._tests = []
        self._load()

    def _load(self):
        AB_FILE.parent.mkdir(parents=True, exist_ok=True)
        if AB_FILE.exists():
            try: self._tests = json.loads(AB_FILE.read_text())
            except: self._tests = []

    def _save(self):
        AB_FILE.parent.mkdir(parents=True, exist_ok=True)
        AB_FILE.write_text(json.dumps(self._tests, indent=2, ensure_ascii=False))

    def create_test(self, video_id: str, variants: list, channel_id: str = "_default") -> dict:
        test = {
            "id": f"ab_{int(datetime.now(timezone.utc).timestamp()*1000)}",
            "video_id": video_id,
            "channel_id": channel_id,
            "variants": [{"title": v, "impressions": 0, "clicks": 0, "ctr": 0.0} for v in variants],
            "status": "active",  # active | completed | cancelled
            "winner": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        self._tests.append(test)
        self._save()
        return test

    def get_tests(self, channel_id: str = "", status: str = "") -> list:
        result = self._tests
        if channel_id:
            result = [t for t in result if t.get("channel_id") == channel_id]
        if status:
            result = [t for t in result if t.get("status") == status]
        return result

    def record_impression(self, test_id: str, variant_index: int):
        for t in self._tests:
            if t["id"] == test_id and variant_index < len(t["variants"]):
                t["variants"][variant_index]["impressions"] += 1
                self._recalc_ctr(t)
                self._save()
                return t
        return None

    def record_click(self, test_id: str, variant_index: int):
        for t in self._tests:
            if t["id"] == test_id and variant_index < len(t["variants"]):
                t["variants"][variant_index]["clicks"] += 1
                self._recalc_ctr(t)
                self._save()
                return t
        return None

    def complete_test(self, test_id: str) -> dict:
        for t in self._tests:
            if t["id"] == test_id:
                t["status"] = "completed"
                best = max(t["variants"], key=lambda v: v["ctr"])
                t["winner"] = best["title"]
                self._save()
                return t
        return None

    def _recalc_ctr(self, test):
        for v in test["variants"]:
            v["ctr"] = round(v["clicks"] / max(1, v["impressions"]) * 100, 2)

ab_manager = ABTestManager()
