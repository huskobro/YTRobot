import json
import logging
from pathlib import Path
from datetime import datetime, timezone

logger = logging.getLogger("PlaylistManager")
PLAYLIST_FILE = Path("data/playlists.json")

class PlaylistManager:
    def __init__(self):
        self._playlists = []
        self._load()

    def _load(self):
        PLAYLIST_FILE.parent.mkdir(parents=True, exist_ok=True)
        if PLAYLIST_FILE.exists():
            try: self._playlists = json.loads(PLAYLIST_FILE.read_text())
            except: self._playlists = []

    def _save(self):
        PLAYLIST_FILE.parent.mkdir(parents=True, exist_ok=True)
        PLAYLIST_FILE.write_text(json.dumps(self._playlists, indent=2, ensure_ascii=False))

    def create(self, name: str, channel_id: str = "_default", description: str = "", tags: list = None) -> dict:
        playlist = {
            "id": f"pl_{int(datetime.now(timezone.utc).timestamp()*1000)}",
            "name": name,
            "channel_id": channel_id,
            "description": description,
            "tags": tags or [],
            "videos": [],
            "youtube_playlist_id": "",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        self._playlists.append(playlist)
        self._save()
        return playlist

    def get_all(self, channel_id: str = "") -> list:
        if channel_id:
            return [p for p in self._playlists if p.get("channel_id") == channel_id]
        return self._playlists

    def get(self, playlist_id: str) -> dict:
        for p in self._playlists:
            if p["id"] == playlist_id:
                return p
        return None

    def add_video(self, playlist_id: str, session_id: str, title: str = "") -> dict:
        for p in self._playlists:
            if p["id"] == playlist_id:
                p["videos"].append({"session_id": session_id, "title": title, "added_at": datetime.now(timezone.utc).isoformat()})
                self._save()
                return p
        return None

    def remove_video(self, playlist_id: str, session_id: str) -> dict:
        for p in self._playlists:
            if p["id"] == playlist_id:
                p["videos"] = [v for v in p["videos"] if v["session_id"] != session_id]
                self._save()
                return p
        return None

    def update(self, playlist_id: str, updates: dict) -> dict:
        for p in self._playlists:
            if p["id"] == playlist_id:
                for k, v in updates.items():
                    if k not in ("id", "created_at"):
                        p[k] = v
                self._save()
                return p
        return None

    def delete(self, playlist_id: str) -> bool:
        before = len(self._playlists)
        self._playlists = [p for p in self._playlists if p["id"] != playlist_id]
        if len(self._playlists) < before:
            self._save()
            return True
        return False

    def sync_to_youtube(self, playlist_id: str) -> dict:
        """Create or sync playlist to YouTube. Returns YouTube playlist info."""
        playlist = self.get(playlist_id)
        if not playlist:
            return None
        try:
            from src.core.youtube_auth import youtube_auth
            channel_id = playlist.get("channel_id", "_default")
            service = youtube_auth.get_service(channel_id)
            if not service:
                return {"error": "YouTube not authenticated"}

            if not playlist.get("youtube_playlist_id"):
                body = {
                    "snippet": {"title": playlist["name"], "description": playlist.get("description", "")},
                    "status": {"privacyStatus": "private"}
                }
                yt_pl = service.playlists().insert(part="snippet,status", body=body).execute()
                playlist["youtube_playlist_id"] = yt_pl["id"]
                self._save()

            return {"youtube_playlist_id": playlist["youtube_playlist_id"], "status": "synced"}
        except Exception as e:
            return {"error": str(e)}

playlist_manager = PlaylistManager()
