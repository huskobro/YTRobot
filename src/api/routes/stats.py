from fastapi import APIRouter, HTTPException
from src.core.analytics import stats_manager
from typing import Dict, Any

router = APIRouter(tags=["analytics"])

@router.get("/api/stats")
@router.get("/stats")
async def get_dashboard_stats() -> Dict[str, Any]:
    """Genel dashboard istatistiklerini döndürür."""
    try:
        return stats_manager.get_stats()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/summary")
async def get_stats_summary():
    """Kısa özet istatistikler."""
    stats = stats_manager.get_stats()
    return {
        "videos": stats.get("total_renders", 0),
        "success": stats.get("success_rate", 0.0),
        "avg_time": round(stats.get("average_render_time", 0.0), 2)
    }
