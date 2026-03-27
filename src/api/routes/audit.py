from fastapi import APIRouter
from src.core.audit_log import audit_logger

router = APIRouter(prefix="/api/audit", tags=["audit"])

@router.get("/")
async def list_audit_entries(category: str = "", limit: int = 50, offset: int = 0):
    entries = audit_logger.get_entries(category, limit, offset)
    total = audit_logger.get_count(category)
    return {"entries": entries, "total": total}

@router.get("/categories")
async def audit_categories():
    return {"categories": ["settings", "render", "channel", "auth", "security"]}
