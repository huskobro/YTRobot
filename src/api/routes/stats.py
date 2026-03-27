import csv
import io
import time
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from src.core.analytics import stats_manager
from src.core.cache import api_cache
from src.core.database import db
from typing import Dict, Any

router = APIRouter(tags=["analytics"])

@router.get("/api/stats")
@router.get("/stats")
async def get_dashboard_stats() -> Dict[str, Any]:
    try:
        cached = api_cache.get("stats")
        if cached is not None:
            return cached
        result = stats_manager.get_stats()
        api_cache.set("stats", result, ttl=15)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/summary")
async def get_stats_summary():
    s = stats_manager.get_stats().get("summary", {})
    return {
        "videos": s.get("total_renders", 0),
        "success": round(s.get("success_rate", 0.0) * 100, 1),
        "avg_time": round(s.get("avg_render_time", 0.0), 2),
    }

@router.get("/api/stats/queue")
async def get_queue_status():
    from src.core.queue import queue_manager
    return queue_manager.get_queue_status()

@router.get("/api/stats/errors")
async def get_error_details():
    return {"errors": stats_manager.get_error_details()}

@router.get("/api/stats/export-csv")
async def export_stats_csv():
    stats = stats_manager.get_stats()
    s = stats.get("summary", {})
    history = stats.get("daily_history", [])
    modules = stats.get("modules", {})
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["=== SUMMARY ==="])
    writer.writerow(["Metric", "Value"])
    writer.writerow(["Total Renders", s.get("total_renders", 0)])
    writer.writerow(["Completed", s.get("completed_renders", 0)])
    writer.writerow(["Failed", s.get("failed_renders", 0)])
    writer.writerow(["Success Rate %", round(s.get("success_rate", 0) * 100, 1)])
    writer.writerow(["Avg Render Time (s)", round(s.get("avg_render_time", 0), 2)])
    writer.writerow([])
    writer.writerow(["=== MODULE BREAKDOWN ==="])
    writer.writerow(["Module", "Count"])
    for mod, count in modules.items():
        writer.writerow([mod, count])
    writer.writerow([])
    writer.writerow(["=== DAILY HISTORY ==="])
    writer.writerow(["Date", "Renders", "Success", "Failed"])
    for day in history:
        writer.writerow([day["date"], day["renders"], day["success"], day["failed"]])
    output.seek(0)
    filename = f"ytrobot-stats-{time.strftime('%Y%m%d')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )

@router.get("/api/stats/db")
async def db_stats(channel_id: str = ""):
    stats = db.get_stats(channel_id)
    stats["recent"] = db.get_recent(10, channel_id)
    stats["daily"] = db.get_daily_stats(channel_id, 30)
    return stats

@router.post("/api/stats/db/import")
async def import_json_to_db():
    result = db.import_from_json()
    return result

@router.get("/api/stats/dashboard-summary")
async def get_dashboard_summary():
    """Enriched dashboard data: this-week stats, upcoming calendar, channel breakdown."""
    import json
    from pathlib import Path
    from datetime import datetime, timedelta
    from src.core.utils import _all_sessions

    now = datetime.now()
    week_start = now - timedelta(days=now.weekday())  # Monday
    week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)

    sessions = _all_sessions()
    week_sessions = []
    for s in sessions:
        try:
            started = datetime.fromisoformat(s.get("started_at", ""))
            if started >= week_start:
                week_sessions.append(s)
        except Exception:
            pass

    # This-week breakdown
    week_completed = sum(1 for s in week_sessions if s.get("status") == "completed")
    week_failed = sum(1 for s in week_sessions if s.get("status") == "failed")
    week_running = sum(1 for s in week_sessions if s.get("status") in ("running", "queued"))

    # Channel breakdown (all time)
    channel_stats = {}
    for s in sessions:
        ch = s.get("channel_id", "_default")
        ch_name = s.get("channel_name", ch)
        if ch not in channel_stats:
            channel_stats[ch] = {"id": ch, "name": ch_name, "total": 0, "completed": 0, "failed": 0}
        channel_stats[ch]["total"] += 1
        if s.get("status") == "completed":
            channel_stats[ch]["completed"] += 1
        elif s.get("status") == "failed":
            channel_stats[ch]["failed"] += 1

    # Upcoming calendar entries (next 7 days)
    upcoming = []
    try:
        from src.core.content_calendar import content_calendar
        all_entries = content_calendar.get_entries()
        cutoff = (now + timedelta(days=7)).isoformat()[:10]
        today = now.isoformat()[:10]
        for e in all_entries:
            pd = e.get("planned_date", "")
            if pd and today <= pd <= cutoff and e.get("status") not in ("published",):
                upcoming.append(e)
        upcoming.sort(key=lambda x: x.get("planned_date", ""))
    except Exception:
        pass

    return {
        "week": {
            "total": len(week_sessions),
            "completed": week_completed,
            "failed": week_failed,
            "running": week_running,
        },
        "channels": list(channel_stats.values()),
        "upcoming_calendar": upcoming[:10],
    }


@router.get("/api/stats/social-log")
async def get_social_log():
    from pathlib import Path
    import json
    log_file = Path("social_log.json")
    if not log_file.exists():
        return {"events": []}
    try:
        data = json.loads(log_file.read_text())
        return {"events": data[-100:] if len(data) > 100 else data}
    except Exception:
        return {"events": []}
