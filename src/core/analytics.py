import os
import json
import time
from pathlib import Path
from typing import Dict, Any, List, Optional

STATS_FILE = Path("stats.json")

class StatsManager:
    def __init__(self):
        self.stats = self.load_stats()

    def load_stats(self) -> Dict[str, Any]:
        """İstatistikleri stats.json'dan yükler."""
        if STATS_FILE.exists():
            try:
                with open(STATS_FILE, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                print(f"  [Analytics] Error loading stats: {e}")
        
        # Varsayılan şema
        return {
            "total_renders": 0,
            "success_rate": 0.0,
            "failed_renders": 0,
            "completed_renders": 0,
            "average_render_time": 0.0,
            "total_render_time": 0.0,
            "platform_stats": {
                "youtube": 0,
                "instagram": 0
            },
            "error_patterns": {},
            "last_update": time.time()
        }

    def save_stats(self):
        """İstatistikleri stats.json'a kaydeder."""
        try:
            self.stats["last_update"] = time.time()
            with open(STATS_FILE, "w", encoding="utf-8") as f:
                json.dump(self.stats, f, indent=4)
        except Exception as e:
            print(f"  [Analytics] Error saving stats: {e}")

    def log_render(self, duration: float, status: str, platforms: Optional[List[str]] = None, error: Optional[str] = None):
        """Bir render işlemini istatistiklere kaydeder."""
        self.stats["total_renders"] += 1
        
        if status == "completed":
            self.stats["completed_renders"] += 1
            self.stats["total_render_time"] += duration
            self.stats["average_render_time"] = self.stats["total_render_time"] / self.stats["completed_renders"]
        else:
            self.stats["failed_renders"] += 1
            if error:
                # Basit hata pattern yakalama (ilk 50 karakter)
                pattern = error[:50] if isinstance(error, str) else "Unknown Error"
                self.stats["error_patterns"][pattern] = self.stats["error_patterns"].get(pattern, 0) + 1
        
        # Başarı oranı hesapla
        if self.stats["total_renders"] > 0:
            self.stats["success_rate"] = (self.stats["completed_renders"] / self.stats["total_renders"]) * 100
            
        # Platform istatistikleri
        if platforms:
            for p in platforms:
                if p in self.stats["platform_stats"]:
                    self.stats["platform_stats"][p] += 1
        
        self.save_stats()

    def get_stats(self) -> Dict[str, Any]:
        """Tüm istatistikleri döndürür."""
        return self.stats

stats_manager = StatsManager()
