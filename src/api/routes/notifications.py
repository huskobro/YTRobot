from fastapi import APIRouter
from src.core.notifications import notification_center

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

@router.get("/")
async def list_notifications(unread_only: bool = False, limit: int = 50):
    return {
        "notifications": notification_center.get_all(unread_only, limit),
        "unread_count": notification_center.unread_count(),
    }

@router.post("/{notif_id}/read")
async def mark_read(notif_id: str):
    notification_center.mark_read(notif_id)
    return {"status": "ok"}

@router.post("/read-all")
async def mark_all_read():
    notification_center.mark_all_read()
    return {"status": "ok"}
