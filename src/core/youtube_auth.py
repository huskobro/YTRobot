import json
import os
import logging
from pathlib import Path
from typing import Optional
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

logger = logging.getLogger("YouTubeAuth")


class YouTubeAuthManager:
    SCOPES = [
        "https://www.googleapis.com/auth/youtube.upload",
        "https://www.googleapis.com/auth/youtube",
        "https://www.googleapis.com/auth/youtube.force-ssl",
    ]

    def __init__(self):
        self.tokens_dir = Path("channels")

    def _token_path(self, channel_id: str) -> Path:
        return self.tokens_dir / channel_id / "platforms" / "youtube.json"

    def get_auth_url(self, channel_id: str, redirect_uri: str = "http://localhost:8000/api/youtube/callback") -> str:
        from config import settings
        client_config = {
            "web": {
                "client_id": settings.yt_oauth_client_id,
                "client_secret": settings.yt_oauth_client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [redirect_uri],
            }
        }
        if not client_config["web"]["client_id"] or not client_config["web"]["client_secret"]:
            raise ValueError("YouTube OAuth credentials not configured. Set yt_oauth_client_id and yt_oauth_client_secret in .env")
        flow = Flow.from_client_config(client_config, scopes=self.SCOPES, redirect_uri=redirect_uri)
        auth_url, state = flow.authorization_url(
            access_type="offline",
            include_granted_scopes="true",
            prompt="consent",
            state=channel_id,
        )
        return auth_url

    def handle_callback(self, code: str, channel_id: str, redirect_uri: str = "http://localhost:8000/api/youtube/callback") -> dict:
        from config import settings
        client_config = {
            "web": {
                "client_id": settings.yt_oauth_client_id,
                "client_secret": settings.yt_oauth_client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [redirect_uri],
            }
        }
        flow = Flow.from_client_config(client_config, scopes=self.SCOPES, redirect_uri=redirect_uri)
        flow.fetch_token(code=code)
        creds = flow.credentials

        token_path = self._token_path(channel_id)
        token_path.parent.mkdir(parents=True, exist_ok=True)
        token_data = {
            "token": creds.token,
            "refresh_token": creds.refresh_token,
            "token_uri": creds.token_uri,
            "client_id": creds.client_id,
            "client_secret": creds.client_secret,
            "scopes": list(creds.scopes) if creds.scopes else self.SCOPES,
        }
        token_path.write_text(json.dumps(token_data, indent=2))
        try:
            os.chmod(token_path, 0o600)
        except OSError:
            pass

        logger.info(f"YouTube token saved for channel {channel_id}")
        return {"status": "success", "channel_id": channel_id}

    def get_credentials(self, channel_id: str) -> Optional[Credentials]:
        token_path = self._token_path(channel_id)
        if not token_path.exists():
            return None
        token_data = json.loads(token_path.read_text())
        creds = Credentials(
            token=token_data.get("token"),
            refresh_token=token_data.get("refresh_token"),
            token_uri=token_data.get("token_uri", "https://oauth2.googleapis.com/token"),
            client_id=token_data.get("client_id"),
            client_secret=token_data.get("client_secret"),
            scopes=token_data.get("scopes"),
        )
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
            # Save refreshed token
            token_data["token"] = creds.token
            token_path.write_text(json.dumps(token_data, indent=2))
        return creds

    def get_service(self, channel_id: str):
        creds = self.get_credentials(channel_id)
        if not creds:
            return None
        return build("youtube", "v3", credentials=creds)

    def is_authenticated(self, channel_id: str) -> bool:
        return self._token_path(channel_id).exists()

    def get_channel_info(self, channel_id: str) -> Optional[dict]:
        service = self.get_service(channel_id)
        if not service:
            return None
        try:
            resp = service.channels().list(part="snippet,statistics", mine=True).execute()
            items = resp.get("items", [])
            if items:
                ch = items[0]
                return {
                    "youtube_channel_id": ch["id"],
                    "title": ch["snippet"]["title"],
                    "thumbnail": ch["snippet"]["thumbnails"]["default"]["url"],
                    "subscribers": ch["statistics"].get("subscriberCount", "0"),
                }
        except Exception as e:
            logger.error(f"Failed to get channel info: {e}")
        return None


youtube_auth = YouTubeAuthManager()
