from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import RedirectResponse, JSONResponse
from src.core.youtube_auth import youtube_auth
import logging

logger = logging.getLogger("YouTubeRoutes")
router = APIRouter()


@router.get("/auth-url")
async def get_auth_url(channel_id: str = Query(default="_default")):
    try:
        url = youtube_auth.get_auth_url(channel_id)
        return {"auth_url": url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/callback")
async def oauth_callback(code: str = Query(...), state: str = Query(default="_default")):
    try:
        result = youtube_auth.handle_callback(code, channel_id=state)
        # Redirect back to UI settings page
        return RedirectResponse(url="/?view=settings&youtube=connected")
    except Exception as e:
        logger.error(f"OAuth callback error: {e}")
        return RedirectResponse(url=f"/?view=settings&youtube=error&msg={str(e)}")


@router.get("/status")
async def youtube_status(channel_id: str = Query(default="_default")):
    authenticated = youtube_auth.is_authenticated(channel_id)
    info = youtube_auth.get_channel_info(channel_id) if authenticated else None
    return {
        "authenticated": authenticated,
        "channel_id": channel_id,
        "channel_info": info,
    }


@router.post("/upload")
async def upload_video(data: dict):
    channel_id = data.get("channel_id", "_default")
    video_path = data.get("video_path")
    title = data.get("title", "Untitled Video")
    description = data.get("description", "")
    tags = data.get("tags", [])
    category_id = data.get("category_id", "22")
    privacy_status = data.get("privacy_status", "private")

    if not video_path:
        raise HTTPException(status_code=400, detail="video_path required")

    from pathlib import Path
    if not Path(video_path).exists():
        raise HTTPException(status_code=404, detail="Video file not found")

    service = youtube_auth.get_service(channel_id)
    if not service:
        raise HTTPException(status_code=401, detail="YouTube not authenticated for this channel")

    try:
        from googleapiclient.http import MediaFileUpload
        body = {
            "snippet": {
                "title": title,
                "description": description,
                "tags": tags if isinstance(tags, list) else [t.strip() for t in tags.split(",")],
                "categoryId": category_id,
            },
            "status": {
                "privacyStatus": privacy_status,
                "selfDeclaredMadeForKids": False,
            },
        }
        media = MediaFileUpload(video_path, mimetype="video/mp4", resumable=True, chunksize=10 * 1024 * 1024)
        request = service.videos().insert(part="snippet,status", body=body, media_body=media)

        response = None
        while response is None:
            status, response = request.next_chunk()
            if status:
                logger.info(f"Upload progress: {int(status.progress() * 100)}%")

        video_id = response.get("id", "")
        logger.info(f"YouTube upload complete: {video_id}")

        # Upload thumbnail if available
        thumbnail_path = data.get("thumbnail_path")
        if thumbnail_path and Path(thumbnail_path).exists():
            try:
                thumb_media = MediaFileUpload(thumbnail_path, mimetype="image/jpeg")
                service.thumbnails().set(videoId=video_id, media_body=thumb_media).execute()
                logger.info(f"Thumbnail uploaded for {video_id}")
            except Exception as te:
                logger.warning(f"Thumbnail upload failed: {te}")

        return {
            "status": "success",
            "video_id": video_id,
            "url": f"https://youtube.com/watch?v={video_id}",
        }
    except Exception as e:
        logger.error(f"YouTube upload failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/playlists")
async def list_playlists(channel_id: str = Query(default="_default")):
    """Fetch the authenticated user's YouTube playlists."""
    service = youtube_auth.get_service(channel_id)
    if not service:
        raise HTTPException(status_code=401, detail="YouTube not authenticated for this channel")

    try:
        playlists = []
        request = service.playlists().list(part="snippet,contentDetails", mine=True, maxResults=50)
        while request:
            response = request.execute()
            for item in response.get("items", []):
                playlists.append({
                    "id": item["id"],
                    "title": item["snippet"]["title"],
                    "description": item["snippet"].get("description", ""),
                    "itemCount": item.get("contentDetails", {}).get("itemCount", 0),
                    "thumbnail": item["snippet"].get("thumbnails", {}).get("default", {}).get("url", ""),
                })
            request = service.playlists().list_next(request, response)
        return {"playlists": playlists}
    except Exception as e:
        logger.error(f"Failed to fetch YouTube playlists: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/channels")
async def list_authenticated_channels():
    from src.core.channel_hub import channel_hub
    channels = channel_hub.get_channels()
    result = []
    for ch in channels:
        ch_id = ch.get("id", ch.get("slug", "_default"))
        authenticated = youtube_auth.is_authenticated(ch_id)
        result.append({
            "channel_id": ch_id,
            "name": ch.get("name", ""),
            "youtube_authenticated": authenticated,
        })
    return {"channels": result}
