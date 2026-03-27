import uvicorn
import asyncio
import json
import logging
import logging.handlers
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse, StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException

# Core & Utils
from src.core.utils import (
    OUTPUT_DIR, _cleanup_stale_sessions, _read_session, _log_file
)

# Routers
from src.api.routes.sessions import router as sessions_router
from src.api.routes.bulletin import router as bulletin_router
from src.api.routes.product import router as product_router
from src.api.routes.system import router as system_router
from src.api.routes.social import router as social_router
from src.api.routes.stats import router as stats_router
from src.api.routes.competitor import router as competitor_router
from src.api.routes.thumbnail import router as thumbnail_router
from src.api.routes.webhook import router as webhook_router
from src.api.routes.channels import router as channels_router
from src.api.routes.youtube import router as youtube_router
from src.api.routes.scheduler import router as scheduler_router
from src.api.routes.audit import router as audit_router
from src.api.routes.notifications import router as notifications_router
from src.api.routes.calendar import router as calendar_router
from src.api.routes.ab_testing import router as ab_testing_router
from src.api.routes.playlists import router as playlists_router
from src.api.routes.video_templates import router as video_templates_router
from src.api.routes.seo import router as seo_router
from src.core.queue import queue_manager
from src.core.scheduler import video_scheduler
from src.core.cache import asset_cache
from contextlib import asynccontextmanager
from config import settings

def _setup_logging():
    """Yapilandirilmis logging kurulumu."""
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)

    formatter = logging.Formatter(
        fmt="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )

    root = logging.getLogger()
    root.setLevel(logging.INFO)

    # Konsol handler
    console = logging.StreamHandler()
    console.setFormatter(formatter)
    root.addHandler(console)

    # Dosya handler (rotasyonlu, max 10MB, 5 yedek)
    file_handler = logging.handlers.RotatingFileHandler(
        log_dir / "ytrobot.log",
        maxBytes=10 * 1024 * 1024,
        backupCount=5,
        encoding="utf-8"
    )
    file_handler.setFormatter(formatter)
    root.addHandler(file_handler)

    # uvicorn loglarini sessizlestir (cok verbose)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)


_setup_logging()
logger = logging.getLogger("ytrobot.server")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    asset_cache.cleanup() # Disk optimization
    queue_manager.start()
    video_scheduler.start()
    yield
    # Shutdown
    await queue_manager.stop()
    await video_scheduler.stop()

app = FastAPI(title="YTRobot API", version="2.0.0", lifespan=lifespan)

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": str(exc.detail), "status_code": exc.status_code}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"error": "Sunucu hatası: " + str(exc), "status_code": 500}
    )

from starlette.middleware.gzip import GZipMiddleware
from src.core.rate_limiter import RateLimiterMiddleware

origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=500)
app.add_middleware(RateLimiterMiddleware, requests_per_minute=120, burst=20)

# Mount Routers
app.include_router(sessions_router)
app.include_router(bulletin_router)
app.include_router(product_router)
app.include_router(system_router)
app.include_router(social_router)
app.include_router(stats_router)
app.include_router(competitor_router)
app.include_router(thumbnail_router)
app.include_router(webhook_router)
app.include_router(channels_router)
app.include_router(youtube_router, prefix="/api/youtube")
app.include_router(scheduler_router)
app.include_router(audit_router)
app.include_router(notifications_router)
app.include_router(calendar_router)
app.include_router(ab_testing_router)
app.include_router(playlists_router)
app.include_router(video_templates_router)
app.include_router(seo_router)

# Mount Static Files
app.mount("/output", StaticFiles(directory="output"), name="output")
Path("sessions").mkdir(exist_ok=True)
app.mount("/sessions", StaticFiles(directory="sessions"), name="sessions")
app.mount("/css", StaticFiles(directory="ui/css"), name="css")
app.mount("/js", StaticFiles(directory="ui/js"), name="js")

# ── Log Streaming ────────────────────────────────────────────────────────────

@app.get("/api/sessions/{sid}/logs")
async def stream_logs_endpoint(sid: str):
    log_path = _log_file(sid)
    async def generate():
        position = 0
        while True:
            if log_path.exists():
                text = log_path.read_text(encoding="utf-8", errors="replace")
                if len(text) > position:
                    new_text = text[position:]
                    position = len(text)
                    for line in new_text.splitlines():
                        yield f"data: {json.dumps(line)}\n\n"
            try:
                s = _read_session(sid)
                if s["status"] in ("completed", "failed", "stopped"):
                    yield f"data: {json.dumps('__DONE__')}\n\n"
                    break
            except Exception as e:
                logger.debug(f"Log stream for {sid} ended: {e}")
                break
            await asyncio.sleep(0.5)
    return StreamingResponse(generate(), media_type="text/event-stream")

# ── Root UI ──────────────────────────────────────────────────────────────────

@app.get("/")
def serve_ui():
    html_path = Path(__file__).parent / "ui" / "index.html"
    if not html_path.exists():
        return HTMLResponse("<h1>UI not found</h1>", status_code=404)
    return HTMLResponse(html_path.read_text(encoding="utf-8"))

if __name__ == "__main__":
    OUTPUT_DIR.mkdir(exist_ok=True)
    _cleanup_stale_sessions()
    print("🎬 YTRobot v2.0 → http://localhost:5005")
    uvicorn.run(app, host="0.0.0.0", port=5005, reload=False)
