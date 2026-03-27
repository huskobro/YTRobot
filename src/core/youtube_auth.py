import json
import os
import logging
from pathlib import Path
from typing import Optional
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from src.core.encryption import encrypt_value, decrypt_value

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

    def get_auth_url(self, channel_id: str, redirect_uri: str = None) -> str:
        from config import settings
        if redirect_uri is None:
            redirect_uri = settings.yt_oauth_redirect_uri
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

    def handle_callback(self, code: str, channel_id: str, redirect_uri: str = None) -> dict:
        from config import settings
        if redirect_uri is None:
            redirect_uri = settings.yt_oauth_redirect_uri
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
        self._write_encrypted_token(token_path, token_data)

        logger.info(f"YouTube token saved for channel {channel_id}")
        return {"status": "success", "channel_id": channel_id}

    def get_credentials(self, channel_id: str) -> Optional[Credentials]:
        token_path = self._token_path(channel_id)
        if not token_path.exists():
            return None
        token_data = self._read_encrypted_token(token_path)
        if token_data is None:
            return None
        creds = Credentials(
            token=token_data.get("token"),
            refresh_token=token_data.get("refresh_token"),
            token_uri=token_data.get("token_uri", "https://oauth2.googleapis.com/token"),
            client_id=token_data.get("client_id"),
            client_secret=token_data.get("client_secret"),
            scopes=token_data.get("scopes"),
        )
        if creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
                # Save refreshed token
                token_data["token"] = creds.token
                self._write_encrypted_token(token_path, token_data)
            except Exception as e:
                logger.error(f"Token refresh failed for channel {channel_id}: {e}")
                # Delete invalid token file so user can re-authenticate
                try:
                    token_path.unlink()
                    logger.info(f"Removed invalid token file for channel {channel_id}")
                except OSError:
                    pass
                return None
        return creds

    def _write_encrypted_token(self, token_path: Path, token_data: dict):
        """Encrypt token JSON and write to disk with restricted permissions."""
        plaintext = json.dumps(token_data, indent=2)
        token_path.write_text(encrypt_value(plaintext))
        try:
            os.chmod(token_path, 0o600)
        except OSError:
            pass

    def _read_encrypted_token(self, token_path: Path) -> Optional[dict]:
        """Read and decrypt token file, handling plaintext migration."""
        raw = token_path.read_text()
        try:
            # Try parsing as plaintext JSON first (migration from unencrypted)
            token_data = json.loads(raw)
            # Migrate: re-write as encrypted
            logger.info(f"Migrating plaintext token to encrypted: {token_path}")
            self._write_encrypted_token(token_path, token_data)
            return token_data
        except (json.JSONDecodeError, ValueError):
            pass
        # Encrypted value
        decrypted = decrypt_value(raw)
        if not decrypted:
            logger.error(f"Failed to decrypt token file: {token_path}")
            return None
        try:
            return json.loads(decrypted)
        except json.JSONDecodeError:
            logger.error(f"Decrypted token is not valid JSON: {token_path}")
            return None

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
