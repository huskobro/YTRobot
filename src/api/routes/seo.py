from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from src.core.seo_optimizer import seo_optimizer

router = APIRouter(prefix="/api/seo", tags=["seo"])

class SEOAnalyzeRequest(BaseModel):
    title: str = ""
    description: str = ""
    tags: List[str] = []
    language: str = "tr"

@router.post("/analyze")
async def analyze_seo(req: SEOAnalyzeRequest):
    return seo_optimizer.full_analysis(req.title, req.description, req.tags, req.language)

@router.post("/analyze-title")
async def analyze_title(title: str, language: str = "tr"):
    return seo_optimizer.analyze_title(title, language)
