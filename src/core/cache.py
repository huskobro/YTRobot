import hashlib
import shutil
import urllib.request as urllib_req
import time
import logging
from pathlib import Path
from typing import Optional, Dict, Any

from src.core.utils import CACHE_DIR

logger = logging.getLogger("Cache")


class SimpleCache:
    """Simple in-memory cache with TTL."""

    def __init__(self, default_ttl: int = 30):
        self._store = {}  # key -> (value, expires_at)
        self.default_ttl = default_ttl

    def get(self, key: str) -> Optional[Any]:
        if key in self._store:
            value, expires_at = self._store[key]
            if time.time() < expires_at:
                return value
            del self._store[key]
        return None

    def set(self, key: str, value: Any, ttl: int = None):
        self._store[key] = (value, time.time() + (ttl or self.default_ttl))

    def invalidate(self, pattern: str = ""):
        if not pattern:
            self._store.clear()
            return
        keys_to_delete = [k for k in self._store if pattern in k]
        for k in keys_to_delete:
            del self._store[k]

    def cleanup(self):
        now = time.time()
        expired = [k for k, (_, exp) in self._store.items() if now >= exp]
        for k in expired:
            del self._store[k]


api_cache = SimpleCache(default_ttl=30)

class AssetCache:
    def __init__(self, cache_dir: Path = CACHE_DIR):
        self.cache_dir = cache_dir
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def _get_hash(self, key: str) -> str:
        return hashlib.sha256(key.encode("utf-8")).hexdigest()

    def get_url_cache(self, url: str, suffix: str = ".jpg") -> Path:
        """Downloads a URL to cache if not already present. Returns the local path."""
        if not url or not url.startswith("http"):
            return Path(url) if url else None
            
        h = self._get_hash(url)
        # Try to guess extension from URL if not provided
        if not suffix:
            ext = Path(url.split("?")[0]).suffix
            suffix = ext if ext in [".jpg", ".jpeg", ".png", ".webp", ".mp4", ".mp3"] else ".cache"
            
        cache_path = self.cache_dir / f"{h}{suffix}"
        
        if cache_path.exists():
            return cache_path
            
        try:
            req = urllib_req.Request(url, headers={"User-Agent": "YTRobot/1.0"})
            with urllib_req.urlopen(req, timeout=10) as resp, open(cache_path, "wb") as f:
                f.write(resp.read())
            return cache_path
        except Exception as e:
            logger.warning(f"Failed to download {url}: {e}")
            return None

    def get_tts_cache(self, text: str, voice_settings: dict, suffix: str = ".mp3") -> Optional[Path]:
        """Checks if a TTS output for this text/settings exists in cache."""
        key = f"{text}|{sorted(voice_settings.items())}"
        h = self._get_hash(key)
        cache_path = self.cache_dir / f"tts_{h}{suffix}"
        return cache_path if cache_path.exists() else None

    def set_tts_cache(self, text: str, voice_settings: dict, source_path: Path, suffix: str = ".mp3") -> Path:
        """Moves a generated TTS file to cache."""
        key = f"{text}|{sorted(voice_settings.items())}"
        h = self._get_hash(key)
        cache_path = self.cache_dir / f"tts_{h}{suffix}"
        
        if source_path.exists() and not cache_path.exists():
            shutil.copy2(source_path, cache_path)
        return cache_path

    def cleanup(self, max_age_days: int = 7, max_size_gb: float = 2.0):
        """Removes old files from cache based on age and total size."""
        now = time.time()
        files = []
        total_size = 0
        
        # Collect info and remove aged files
        for f in self.cache_dir.iterdir():
            if f.is_file():
                stat = f.stat()
                age = (now - stat.st_mtime) / (24 * 3600)
                if age > max_age_days:
                    f.unlink(missing_ok=True)
                    continue
                files.append((f, stat.st_mtime, stat.st_size))
                total_size += stat.st_size
                
        # Sort by modification time (oldest first)
        files.sort(key=lambda x: x[1])
        
        # Enforce size limit
        max_bytes = max_size_gb * 1024 * 1024 * 1024
        while total_size > max_bytes and files:
            f, mtime, size = files.pop(0)
            f.unlink(missing_ok=True)
            total_size -= size
            logger.info(f"Removed {f.name} to free up space.")

asset_cache = AssetCache()
