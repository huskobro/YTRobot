import csv
import io
import time
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from src.core.analytics import stats_manager
from src.core.cache import api_cache
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
