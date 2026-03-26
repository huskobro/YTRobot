import json
import time
from pathlib import Path
from typing import Dict, Any, List, Optional

STATS_FILE = Path("stats.json")

PROVIDER_COST_ESTIMATES = {
    "openai_tts": 0.015,
    "elevenlabs": 0.03,
    "speshaudio": 0.01,
    "qwen3": 0.0,
    "pexels": 0.0,
    "pixabay": 0.0,
    "dalle": 0.04,
    "zimage": 0.02,
    "gemini": 0.002,
    "kieai": 0.002,
}

class StatsManager:
    def __init__(self):
        self.stats = self.load_stats()

    def load_stats(self) -> Dict[str, Any]:
        if STATS_FILE.exists():
            try:
                with open(STATS_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                # Migrate old schema
                for key, default in [
                    ("modules", {"yt_video": 0, "bulletin": 0, "product_review": 0}),
                    ("daily_history", []),
                    ("cost_tracking", {"total_estimated_usd": 0.0, "by_provider": {}}),
                    ("error_details", []),
                ]:
                    if key not in data:
                        data[key] = default
                return data
            except Exception as e:
                print(f"  [Analytics] Error loading stats: {e}")
        return {
            "total_renders": 0,
            "success_rate": 0.0,
            "failed_renders": 0,
            "completed_renders": 0,
            "average_render_time": 0.0,
            "total_render_time": 0.0,
            "modules": {"yt_video": 0, "bulletin": 0, "product_review": 0},
            "platform_stats": {"youtube": 0, "instagram": 0},
            "error_patterns": {},
            "daily_history": [],
            "cost_tracking": {"total_estimated_usd": 0.0, "by_provider": {}},
            "error_details": [],
            "last_update": time.time(),
        }

    def save_stats(self):
        try:
            self.stats["last_update"] = time.time()
            with open(STATS_FILE, "w", encoding="utf-8") as f:
                json.dump(self.stats, f, indent=4)
        except Exception as e:
            print(f"  [Analytics] Error saving stats: {e}")

    def log_render(self, duration: float, status: str,
                   platforms: Optional[List[str]] = None,
                   error: Optional[str] = None,
                   module: Optional[str] = None,
                   session_id: Optional[str] = None,
                   providers: Optional[List[str]] = None):
        self.stats["total_renders"] += 1
        if module and module in self.stats.get("modules", {}):
            self.stats["modules"][module] += 1
        if status == "completed":
            self.stats["completed_renders"] += 1
            self.stats["total_render_time"] += duration
            self.stats["average_render_time"] = (
                self.stats["total_render_time"] / self.stats["completed_renders"]
            )
        else:
            self.stats["failed_renders"] += 1
            if error:
                pattern = error[:50] if isinstance(error, str) else "Unknown Error"
                self.stats["error_patterns"][pattern] = (
                    self.stats["error_patterns"].get(pattern, 0) + 1
                )
                detail = {
                    "ts": time.time(),
                    "error": error[:200] if isinstance(error, str) else "Unknown Error",
                    "session_id": session_id or "",
                    "module": module or "",
                    "status": status,
                }
                self.stats.setdefault("error_details", []).append(detail)
                if len(self.stats["error_details"]) > 50:
                    self.stats["error_details"] = self.stats["error_details"][-50:]
        if self.stats["total_renders"] > 0:
            self.stats["success_rate"] = (
                self.stats["completed_renders"] / self.stats["total_renders"]
            ) * 100
        if platforms:
            for p in platforms:
                if p in self.stats.get("platform_stats", {}):
                    self.stats["platform_stats"][p] += 1
        # Daily history
        today = time.strftime("%Y-%m-%d")
        history = self.stats.setdefault("daily_history", [])
        today_entry = next((d for d in history if d["date"] == today), None)
        if today_entry is None:
            today_entry = {"date": today, "renders": 0, "success": 0, "failed": 0}
            history.append(today_entry)
        today_entry["renders"] += 1
        if status == "completed":
            today_entry["success"] += 1
        else:
            today_entry["failed"] += 1
        if len(history) > 30:
            self.stats["daily_history"] = history[-30:]
        # Cost tracking
        if providers:
            cost = self.stats.setdefault(
                "cost_tracking", {"total_estimated_usd": 0.0, "by_provider": {}}
            )
            for p in providers:
                estimate = PROVIDER_COST_ESTIMATES.get(p, 0.0)
                cost["total_estimated_usd"] = round(
                    cost["total_estimated_usd"] + estimate, 4
                )
                cost["by_provider"][p] = round(
                    cost["by_provider"].get(p, 0.0) + estimate, 4
                )
        self.save_stats()

    def get_stats(self) -> Dict[str, Any]:
        s = self.stats
        return {
            "summary": {
                "total_renders": s.get("total_renders", 0),
                "success_rate": s.get("success_rate", 0.0) / 100.0,
                "avg_render_time": s.get("average_render_time", 0.0),
                "failed_renders": s.get("failed_renders", 0),
                "completed_renders": s.get("completed_renders", 0),
                "total_render_time": s.get("total_render_time", 0.0),
            },
            "modules": s.get("modules", {"yt_video": 0, "bulletin": 0, "product_review": 0}),
            "platform_stats": s.get("platform_stats", {"youtube": 0, "instagram": 0}),
            "error_patterns": s.get("error_patterns", {}),
            "daily_history": s.get("daily_history", []),
            "cost_tracking": s.get("cost_tracking", {"total_estimated_usd": 0.0, "by_provider": {}}),
            "last_update": s.get("last_update", 0),
        }

    def get_error_details(self) -> List[Dict[str, Any]]:
        details = self.stats.get("error_details", [])
        return sorted(details, key=lambda x: x.get("ts", 0), reverse=True)

stats_manager = StatsManager()
