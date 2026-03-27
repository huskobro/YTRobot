from fastapi import APIRouter, HTTPException, Query
from src.core.youtube_analytics import youtube_analytics

router = APIRouter(prefix="/api/youtube/analytics", tags=["youtube-analytics"])


@router.get("/channel")
async def channel_stats(channel_id: str = Query(default="_default")):
    stats = youtube_analytics.get_channel_stats(channel_id)
    if not stats:
        raise HTTPException(404, "Channel not found or YouTube not authenticated")
    return stats


@router.get("/videos")
async def recent_videos(channel_id: str = Query(default="_default"), limit: int = Query(default=10)):
    videos = youtube_analytics.get_recent_videos(channel_id, limit)
    return {"videos": videos}


@router.get("/video/{video_id}")
async def video_stats(video_id: str, channel_id: str = Query(default="_default")):
    stats = youtube_analytics.get_video_stats(video_id, channel_id)
    if not stats:
        raise HTTPException(404, "Video not found")
    return stats
