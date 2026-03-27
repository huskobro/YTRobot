from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from src.core.ab_testing import ab_manager

router = APIRouter(prefix="/api/ab-test", tags=["ab-testing"])

class ABTestCreate(BaseModel):
    video_id: str
    variants: List[str]  # list of title alternatives
    channel_id: str = "_default"

@router.get("/")
async def list_tests(channel_id: str = "", status: str = ""):
    return {"tests": ab_manager.get_tests(channel_id, status)}

@router.post("/")
async def create_test(req: ABTestCreate):
    if len(req.variants) < 2:
        raise HTTPException(status_code=400, detail="At least 2 title variants required")
    test = ab_manager.create_test(req.video_id, req.variants, req.channel_id)
    return {"status": "created", "test": test}

@router.post("/{test_id}/impression/{variant_index}")
async def record_impression(test_id: str, variant_index: int):
    result = ab_manager.record_impression(test_id, variant_index)
    if not result:
        raise HTTPException(status_code=404, detail="Test or variant not found")
    return {"status": "recorded", "test": result}

@router.post("/{test_id}/click/{variant_index}")
async def record_click(test_id: str, variant_index: int):
    result = ab_manager.record_click(test_id, variant_index)
    if not result:
        raise HTTPException(status_code=404, detail="Test or variant not found")
    return {"status": "recorded", "test": result}

@router.post("/{test_id}/complete")
async def complete_test(test_id: str):
    result = ab_manager.complete_test(test_id)
    if not result:
        raise HTTPException(status_code=404, detail="Test not found")
    return {"status": "completed", "test": result}
