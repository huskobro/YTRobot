import sqlite3
import json
import logging
from pathlib import Path
from datetime import datetime, timezone
from contextlib import contextmanager

logger = logging.getLogger("Database")

DB_PATH = Path("data/ytrobot.db")


class Database:
    def __init__(self):
        DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _init_db(self):
        with self._connect() as conn:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS renders (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT NOT NULL,
                    channel_id TEXT DEFAULT '_default',
                    status TEXT DEFAULT 'pending',
                    module TEXT DEFAULT '',
                    duration REAL DEFAULT 0,
                    error TEXT DEFAULT '',
                    created_at TEXT NOT NULL,
                    platforms TEXT DEFAULT '[]'
                );

                CREATE TABLE IF NOT EXISTS publish_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT NOT NULL,
                    channel_id TEXT DEFAULT '_default',
                    platform TEXT NOT NULL,
                    status TEXT DEFAULT 'success',
                    video_url TEXT DEFAULT '',
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS daily_stats (
                    date TEXT NOT NULL,
                    channel_id TEXT DEFAULT '_default',
                    renders INTEGER DEFAULT 0,
                    success INTEGER DEFAULT 0,
                    fail INTEGER DEFAULT 0,
                    total_duration REAL DEFAULT 0,
                    PRIMARY KEY (date, channel_id)
                );

                CREATE INDEX IF NOT EXISTS idx_renders_session ON renders(session_id);
                CREATE INDEX IF NOT EXISTS idx_renders_channel ON renders(channel_id);
                CREATE INDEX IF NOT EXISTS idx_renders_created ON renders(created_at);
                CREATE INDEX IF NOT EXISTS idx_publish_channel ON publish_log(channel_id);
            """)

    @contextmanager
    def _connect(self):
        conn = sqlite3.connect(str(DB_PATH))
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        except Exception as e:
            logger.error(f"Database transaction failed, rolling back: {e}")
            conn.rollback()
            raise
        finally:
            conn.close()

    def log_render(self, session_id: str, channel_id: str = "_default",
                   status: str = "completed", module: str = "",
                   duration: float = 0, error: str = "", platforms: list = None):
        now = datetime.now(timezone.utc).isoformat()
        with self._connect() as conn:
            conn.execute(
                "INSERT INTO renders (session_id, channel_id, status, module, duration, error, created_at, platforms) VALUES (?,?,?,?,?,?,?,?)",
                (session_id, channel_id, status, module, duration, error, now, json.dumps(platforms or []))
            )
            # Update daily stats
            today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            conn.execute("""
                INSERT INTO daily_stats (date, channel_id, renders, success, fail, total_duration)
                VALUES (?, ?, 1, ?, ?, ?)
                ON CONFLICT(date, channel_id) DO UPDATE SET
                    renders = renders + 1,
                    success = success + CASE WHEN ? = 'completed' THEN 1 ELSE 0 END,
                    fail = fail + CASE WHEN ? != 'completed' THEN 1 ELSE 0 END,
                    total_duration = total_duration + ?
            """, (today, channel_id,
                  1 if status == "completed" else 0,
                  0 if status == "completed" else 1,
                  duration,
                  status, status, duration))

    def log_publish(self, session_id: str, platform: str, channel_id: str = "_default",
                    status: str = "success", video_url: str = ""):
        now = datetime.now(timezone.utc).isoformat()
        with self._connect() as conn:
            conn.execute(
                "INSERT INTO publish_log (session_id, channel_id, platform, status, video_url, created_at) VALUES (?,?,?,?,?,?)",
                (session_id, channel_id, platform, status, video_url, now)
            )

    def get_stats(self, channel_id: str = "") -> dict:
        with self._connect() as conn:
            if channel_id:
                row = conn.execute(
                    "SELECT COUNT(*) as total, SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as success, SUM(CASE WHEN status!='completed' THEN 1 ELSE 0 END) as fail, SUM(duration) as total_duration FROM renders WHERE channel_id=?",
                    (channel_id,)
                ).fetchone()
            else:
                row = conn.execute(
                    "SELECT COUNT(*) as total, SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as success, SUM(CASE WHEN status!='completed' THEN 1 ELSE 0 END) as fail, SUM(duration) as total_duration FROM renders"
                ).fetchone()

            return {
                "total_renders": row["total"] or 0,
                "success_count": row["success"] or 0,
                "fail_count": row["fail"] or 0,
                "total_duration": row["total_duration"] or 0,
            }

    def get_recent(self, limit: int = 10, channel_id: str = "") -> list:
        with self._connect() as conn:
            if channel_id:
                rows = conn.execute(
                    "SELECT * FROM renders WHERE channel_id=? ORDER BY created_at DESC LIMIT ?",
                    (channel_id, limit)
                ).fetchall()
            else:
                rows = conn.execute(
                    "SELECT * FROM renders ORDER BY created_at DESC LIMIT ?",
                    (limit,)
                ).fetchall()
            return [dict(r) for r in rows]

    def get_daily_stats(self, channel_id: str = "", days: int = 30) -> list:
        with self._connect() as conn:
            if channel_id:
                rows = conn.execute(
                    "SELECT * FROM daily_stats WHERE channel_id=? ORDER BY date DESC LIMIT ?",
                    (channel_id, days)
                ).fetchall()
            else:
                rows = conn.execute(
                    "SELECT date, SUM(renders) as renders, SUM(success) as success, SUM(fail) as fail, SUM(total_duration) as total_duration FROM daily_stats GROUP BY date ORDER BY date DESC LIMIT ?",
                    (days,)
                ).fetchall()
            return [dict(r) for r in rows]

    def import_from_json(self, stats_file: str = "stats.json"):
        """Import existing JSON stats into SQLite."""
        path = Path(stats_file)
        if not path.exists():
            return {"imported": 0}
        try:
            data = json.loads(path.read_text())
            count = 0
            recent = data.get("recent", [])
            with self._connect() as conn:
                for entry in recent:
                    conn.execute(
                        "INSERT OR IGNORE INTO renders (session_id, channel_id, status, module, duration, error, created_at, platforms) VALUES (?,?,?,?,?,?,?,?)",
                        (
                            entry.get("session_id", f"import_{count}"),
                            entry.get("channel_id", "_default"),
                            entry.get("status", "completed"),
                            entry.get("module", ""),
                            entry.get("duration", 0),
                            entry.get("error", ""),
                            entry.get("ts", datetime.now(timezone.utc).isoformat()),
                            json.dumps(entry.get("platforms", []))
                        )
                    )
                    count += 1
            return {"imported": count}
        except Exception as e:
            logger.error(f"JSON import failed: {e}")
            return {"imported": 0, "error": str(e)}


db = Database()
