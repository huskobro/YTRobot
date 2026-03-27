import json
import logging
from typing import Optional, Dict, List
from datetime import datetime, timedelta, timezone

logger = logging.getLogger("YouTubeAnalytics")


class YouTubeAnalyticsManager:
    """Fetches analytics data from YouTube Analytics API."""

    def get_channel_stats(self, channel_id: str = "_default") -> Optional[Dict]:
        """Get basic channel statistics (subscribers, views, videos)."""
        try:
            from src.core.youtube_auth import youtube_auth
            service = youtube_auth.get_service(channel_id)
            if not service:
                return None

            resp = service.channels().list(part="statistics,snippet", mine=True).execute()
            items = resp.get("items", [])
            if not items:
                return None

            ch = items[0]
            stats = ch.get("statistics", {})
            return {
                "channel_id": ch["id"],
                "title": ch["snippet"]["title"],
                "subscribers": int(stats.get("subscriberCount", 0)),
                "total_views": int(stats.get("viewCount", 0)),
                "total_videos": int(stats.get("videoCount", 0)),
                "thumbnail": ch["snippet"]["thumbnails"]["default"]["url"],
            }
        except Exception as e:
            logger.error(f"Failed to get channel stats: {e}")
            return None

    def get_recent_videos(self, channel_id: str = "_default", max_results: int = 10) -> List[Dict]:
        """Get recent uploaded videos with their stats."""
        try:
            from src.core.youtube_auth import youtube_auth
            service = youtube_auth.get_service(channel_id)
            if not service:
                return []

            # Get uploads playlist
            ch_resp = service.channels().list(part="contentDetails", mine=True).execute()
            items = ch_resp.get("items", [])
            if not items:
                return []

            uploads_id = items[0]["contentDetails"]["relatedPlaylists"]["uploads"]

            # Get playlist items
            pl_resp = service.playlistItems().list(
                part="snippet,contentDetails",
                playlistId=uploads_id,
                maxResults=max_results,
            ).execute()

            video_ids = [item["contentDetails"]["videoId"] for item in pl_resp.get("items", [])]
            if not video_ids:
                return []

            # Get video stats
            vid_resp = service.videos().list(
                part="statistics,snippet",
                id=",".join(video_ids),
            ).execute()

            results = []
            for vid in vid_resp.get("items", []):
                stats = vid.get("statistics", {})
                results.append({
                    "video_id": vid["id"],
                    "title": vid["snippet"]["title"],
                    "published_at": vid["snippet"]["publishedAt"],
                    "thumbnail": vid["snippet"]["thumbnails"]["medium"]["url"],
                    "views": int(stats.get("viewCount", 0)),
                    "likes": int(stats.get("likeCount", 0)),
                    "comments": int(stats.get("commentCount", 0)),
                })

            return results
        except Exception as e:
            logger.error(f"Failed to get recent videos: {e}")
            return []

    def get_video_stats(self, video_id: str, channel_id: str = "_default") -> Optional[Dict]:
        """Get detailed stats for a specific video."""
        try:
            from src.core.youtube_auth import youtube_auth
            service = youtube_auth.get_service(channel_id)
            if not service:
                return None

            resp = service.videos().list(
                part="statistics,snippet,contentDetails",
                id=video_id,
            ).execute()

            items = resp.get("items", [])
            if not items:
                return None

            vid = items[0]
            stats = vid.get("statistics", {})
            return {
                "video_id": vid["id"],
                "title": vid["snippet"]["title"],
                "published_at": vid["snippet"]["publishedAt"],
                "duration": vid["contentDetails"]["duration"],
                "views": int(stats.get("viewCount", 0)),
                "likes": int(stats.get("likeCount", 0)),
                "dislikes": int(stats.get("dislikeCount", 0)),
                "comments": int(stats.get("commentCount", 0)),
                "favorites": int(stats.get("favoriteCount", 0)),
            }
        except Exception as e:
            logger.error(f"Failed to get video stats: {e}")
            return None


youtube_analytics = YouTubeAnalyticsManager()
