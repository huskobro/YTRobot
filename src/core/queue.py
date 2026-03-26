import asyncio
import json
import uuid
import time
import logging
from pathlib import Path
from typing import Dict, Any, Optional, List
from src.core.utils import _write_session, _read_session

logger = logging.getLogger("QueueManager")

class JobStatus:
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"

class VideoJob:
    def __init__(self, job_type: str, data: dict, session_id: str):
        self.id = session_id
        self.type = job_type # 'normal', 'bulletin', 'product_review'
        self.data = data
        self.status = JobStatus.QUEUED
        self.created_at = time.time()
        self.started_at: Optional[float] = None
        self.finished_at: Optional[float] = None
        self.error: Optional[str] = None

class QueueManager:
    def __init__(self):
        self.queue: asyncio.Queue = asyncio.Queue()
        self.active_jobs: Dict[str, VideoJob] = {}
        self._worker_task: Optional[asyncio.Task] = None
        self._running = False

    def start(self):
        if not self._running:
            self._running = True
            self._worker_task = asyncio.create_task(self._worker_loop())
            logger.info("  [Queue] Worker started.")

    async def stop(self):
        self._running = False
        if self._worker_task:
            self._worker_task.cancel()
            try:
                await asyncio.wait_for(self._worker_task, timeout=2.0)
            except (asyncio.CancelledError, asyncio.TimeoutError):
                pass
            except Exception as e:
                logger.error(f"Error during worker stop: {e}")
            logger.info("  [Queue] Worker stopped.")

    async def add_job(self, job_type: str, data: dict, session_id: str) -> str:
        job = VideoJob(job_type, data, session_id)
        self.active_jobs[session_id] = job
        
        # Güncel durumu session.json'a yaz
        session = _read_session(session_id)
        session["status"] = JobStatus.QUEUED
        _write_session(session_id, session)
        
        await self.queue.put(job)
        logger.info(f"  [Queue] Job added: {session_id} ({job_type})")
        return session_id

    def get_job_status(self, session_id: str) -> Optional[dict]:
        job = self.active_jobs.get(session_id)
        if not job: return None
        return {
            "id": job.id,
            "status": job.status,
            "error": job.error,
            "progress": 0 
        }

    async def _worker_loop(self):
        while self._running:
            try:
                job = await self.queue.get()
                job.status = JobStatus.RUNNING
                job.started_at = time.time()
                logger.info(f"  [Queue] Processing job: {job.id}")
                
                # Session dosyasını güncelle
                session = _read_session(job.id)
                session["status"] = JobStatus.RUNNING
                _write_session(job.id, session)

                try:
                    # Pipeline'ı çalıştır
                    await self._execute_job(job)
                    job.status = JobStatus.COMPLETED
                    logger.info(f"  [Queue] Job completed: {job.id}")
                    
                    # --- Faz 4.3 & 5: Social & Analytics ---
                    job.finished_at = time.time()
                    try:
                        # Auto Publish Trigger
                        if job.data.get("publish_youtube") or job.data.get("publish_instagram"):
                            from pipeline.social import social_poster
                            v_path = Path(f"sessions/{job.id}/final_video.mp4")
                            if v_path.exists():
                                meta = job.data.get("social_metadata", {})
                                meta["publish_youtube"] = job.data.get("publish_youtube")
                                meta["publish_instagram"] = job.data.get("publish_instagram")
                                asyncio.create_task(social_poster.auto_publish(v_path, meta))
                                logger.info(f"  [Queue] Social trigger for {job.id}")
                        
                        # Analytics Log
                        from src.core.analytics import stats_manager
                        duration = job.finished_at - (job.started_at or job.created_at)
                        platforms = []
                        if job.data.get("publish_youtube"): platforms.append("youtube")
                        if job.data.get("publish_instagram"): platforms.append("instagram")
                        stats_manager.log_render(duration, job.status, platforms, None)
                    except Exception as ex:
                        logger.error(f"  [Queue] Post-process error: {ex}")

                except Exception as e:
                    job.status = JobStatus.FAILED
                    job.error = str(e)
                    job.finished_at = time.time()
                    logger.error(f"  [Queue] Job failed: {job.id} - {e}")
                    
                    # Session'ı hata ile güncelle
                    session = _read_session(job.id)
                    session["status"] = JobStatus.FAILED
                    session["error"] = str(e)
                    _write_session(job.id, session)
                    
                    # Log failure to analytics
                    try:
                        from src.core.analytics import stats_manager
                        stats_manager.log_render(0, job.status, [], str(e))
                    except: pass
                
                self.queue.task_done()
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"  [Queue] Worker loop error: {e}")
                await asyncio.sleep(1)

    async def _execute_job(self, job: VideoJob):
        """Asıl üretim mantığı burada çağrılır."""
        if job.type == "yt_video":
            from src.api.routes.sessions import run_pipeline_task
            await run_pipeline_task(job.id, job.data, job.type)
        elif job.type == "bulletin":
            from src.api.routes.bulletin import run_bulletin_task
            await run_bulletin_task(job.id, job.data)
        elif job.type == "product_review":
            from src.api.routes.product import run_product_review_task
            await run_product_review_task(job.id, job.data)
        else:
            raise ValueError(f"Unknown job type: {job.type}")

# Singleton Instance
queue_manager = QueueManager()
