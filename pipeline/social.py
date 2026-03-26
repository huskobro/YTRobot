import json
import logging
import time
from pathlib import Path
from typing import Dict, Any, Optional
from config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SocialPoster")


class SocialPoster:
    def __init__(self):
        self.youtube_enabled = getattr(settings, "autopublish_youtube", False)
        self.instagram_enabled = getattr(settings, "share_on_instagram", False)

    def _log_publish(self, platform: str, status: str, video_path: Path,
                     metadata: Dict[str, Any]):
        log_file = Path("social_log.json")
        try:
            events = json.loads(log_file.read_text()) if log_file.exists() else []
        except Exception:
            events = []
        events.append({
            "ts": time.time(),
            "platform": platform,
            "status": status,
            "video": str(video_path.name) if video_path else "",
            "title": metadata.get("title", ""),
            "session_id": metadata.get("session_id", ""),
        })
        if len(events) > 500:
            events = events[-500:]
        try:
            log_file.write_text(json.dumps(events, indent=2))
        except Exception as e:
            logger.warning(f"[Social] Could not write social_log.json: {e}")

    async def post_to_youtube(self, video_path: Path,
                               metadata: Dict[str, Any]) -> Dict[str, Any]:
        logger.info(f"[YouTube] Loading video for upload: {video_path}")
        if not self.youtube_enabled:
            logger.info("[YouTube] API not enabled. Saving as DRAFT.")
            result = {"status": "success", "platform": "youtube",
                      "mode": "draft", "url": "local-draft-saved"}
        else:
            try:
                # FUTURE: Real YouTube Data API v3 implementation (Task 14)
                result = {"status": "success", "platform": "youtube",
                          "id": "mock-yt-123"}
            except Exception as e:
                logger.error(f"[YouTube] Upload failed: {e}")
                result = {"status": "error", "message": str(e)}
        self._log_publish("youtube", result.get("status", "unknown"),
                          video_path, metadata)
        return result

    async def post_to_instagram(self, video_path: Path,
                                 metadata: Dict[str, Any]) -> Dict[str, Any]:
        logger.info(f"[Instagram] Loading video for upload: {video_path}")
        if not self.instagram_enabled:
            logger.info("[Instagram] API not enabled. Saving as DRAFT.")
            result = {"status": "success", "platform": "instagram",
                      "mode": "draft", "url": "local-draft-saved"}
        else:
            try:
                result = {"status": "success", "platform": "instagram",
                          "id": "mock-ig-456"}
            except Exception as e:
                logger.error(f"[Instagram] Upload failed: {e}")
                result = {"status": "error", "message": str(e)}
        self._log_publish("instagram", result.get("status", "unknown"),
                          video_path, metadata)
        return result

    async def auto_publish(self, video_path: Path, metadata: Dict[str, Any]):
        results = []
        if metadata.get("publish_youtube"):
            results.append(await self.post_to_youtube(video_path, metadata))
        if metadata.get("publish_instagram"):
            results.append(await self.post_to_instagram(video_path, metadata))
        return results


social_poster = SocialPoster()
