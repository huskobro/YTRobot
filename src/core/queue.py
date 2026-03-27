import asyncio
import json
import time
import logging
from pathlib import Path
from typing import Dict, Any, Optional, List  # noqa: F401
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
    MAX_CONCURRENT = 2          # Esanli is limiti
    JOB_TIMEOUT = 1800          # 30 dakika maksimum sure

    def __init__(self):
        self.queue: asyncio.Queue = asyncio.Queue(maxsize=100)
        self.active_jobs: Dict[str, VideoJob] = {}
        self._worker_tasks: List[asyncio.Task] = []
        self._worker_task: Optional[asyncio.Task] = None  # uyumluluk icin
        self._running = False
        self._running_count = 0  # Aktif is sayaci
        self._count_lock = asyncio.Lock()

    def start(self):
        if not self._running:
            self._running = True
            # MAX_CONCURRENT sayida worker worker basalt
            for i in range(self.MAX_CONCURRENT):
                task = asyncio.create_task(self._worker_loop(worker_id=i))
                self._worker_tasks.append(task)
            self._worker_task = self._worker_tasks[0]  # uyumluluk icin
            logger.info(f"  [Queue] {self.MAX_CONCURRENT} workers started.")

    async def stop(self):
        self._running = False
        for task in self._worker_tasks:
            task.cancel()
        for task in self._worker_tasks:
            try:
                await asyncio.wait_for(task, timeout=2.0)
            except (asyncio.CancelledError, asyncio.TimeoutError):
                pass
            except Exception as e:
                logger.error(f"Error during worker stop: {e}")
        self._worker_tasks.clear()
        logger.info("  [Queue] All workers stopped.")

    async def add_job(self, job_type: str, data: dict, session_id: str) -> str:
        if self.queue.full():
            from fastapi import HTTPException
            raise HTTPException(status_code=429, detail="Queue is full. Try again later.")

        job = VideoJob(job_type, data, session_id)
        self.active_jobs[session_id] = job

        # Güncel durumu session.json'a yaz (sadece yt_video icin)
        try:
            session = _read_session(session_id)
            session["status"] = JobStatus.QUEUED
            _write_session(session_id, session)
        except Exception:
            pass  # Bulletin/PR jobs don't have session.json

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

    def get_queue_status(self) -> dict:
        jobs = list(self.active_jobs.values())
        return {
            "running": [
                {
                    "id": j.id, "type": j.type, "started_at": j.started_at,
                    "elapsed": round(time.time() - j.started_at, 1) if j.started_at else 0,
                }
                for j in jobs if j.status == "running"
            ],
            "queued": [
                {"id": j.id, "type": j.type, "created_at": j.created_at}
                for j in jobs if j.status == "queued"
            ],
            "running_count": self._running_count,
            "max_concurrent": self.MAX_CONCURRENT,
            "total_active": len([j for j in jobs if j.status in ("running", "queued")]),
        }

    async def _worker_loop(self, worker_id: int = 0):
        while self._running:
            try:
                job = await self.queue.get()
                job.status = JobStatus.RUNNING
                job.started_at = time.time()
                async with self._count_lock:
                    self._running_count += 1
                logger.info(f"  [Queue] Worker-{worker_id} processing job: {job.id} (active: {self._running_count})")

                # Session dosyasını güncelle
                try:
                    session = _read_session(job.id)
                    session["status"] = JobStatus.RUNNING
                    _write_session(job.id, session)
                except Exception as e:
                    logger.warning(f"  [Queue] Could not update session status for {job.id}: {e}")

                try:
                    # Pipeline'ı timeout ile çalıştır
                    await asyncio.wait_for(
                        self._execute_job(job),
                        timeout=self.JOB_TIMEOUT
                    )
                    job.status = JobStatus.COMPLETED
                    logger.info(f"  [Queue] Job completed: {job.id}")

                    # Notify WebSocket clients that job is done
                    try:
                        from src.core.progress import progress_manager
                        await progress_manager.complete(job.id, "completed")
                    except Exception as pm_err:
                        logger.warning(f"  [Queue] progress_manager.complete error: {pm_err}")

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
                        stats_manager.log_render(duration, job.status, platforms, None, module=job.type, session_id=job.id, channel_id=job.data.get("channel_id", "_default"))
                    except Exception as ex:
                        logger.error(f"  [Queue] Post-process error: {ex}")

                    # Notifications (webhook + telegram + email + whatsapp)
                    try:
                        from config import settings
                        from src.api.routes.webhook import dispatch_all_notifications
                        should_notify = (
                            (getattr(settings, "webhook_on_complete", True) and job.status == "completed")
                            or (getattr(settings, "webhook_on_failure", True) and job.status == "failed")
                        )
                        if should_notify:
                            payload = {"status": job.status, "module": job.type, "session_id": job.id}
                            if job.status == "completed":
                                payload["duration"] = job.finished_at - (job.started_at or job.created_at)
                            else:
                                payload["error"] = job.error or ""
                            results = dispatch_all_notifications(
                                payload, mention=getattr(settings, "webhook_mention", ""))
                            if results:
                                logger.info(f"Notifications sent: {results}")
                    except Exception as wh_err:
                        logger.warning(f"Notification dispatch error: {wh_err}")

                except asyncio.TimeoutError:
                    job.status = JobStatus.FAILED
                    job.error = f"Zaman asimi ({self.JOB_TIMEOUT // 60} dakika)"
                    job.finished_at = time.time()
                    logger.error(f"  [Queue] Job timed out: {job.id} ({self.JOB_TIMEOUT}s)")
                    try:
                        session = _read_session(job.id)
                        session["status"] = JobStatus.FAILED
                        session["error"] = job.error
                        _write_session(job.id, session)
                    except Exception as se:
                        logger.warning(f"  [Queue] Could not write timeout status for {job.id}: {se}")
                    # Notify WebSocket clients of timeout failure
                    try:
                        from src.core.progress import progress_manager
                        await progress_manager.complete(job.id, "failed", job.error)
                    except Exception as pm_err:
                        logger.warning(f"  [Queue] progress_manager.complete (timeout) error: {pm_err}")

                except Exception as e:
                    job.status = JobStatus.FAILED
                    job.error = str(e)
                    job.finished_at = time.time()
                    logger.error(f"  [Queue] Job failed: {job.id} - {e}")

                    # Session'ı hata ile güncelle
                    try:
                        session = _read_session(job.id)
                        session["status"] = JobStatus.FAILED
                        session["error"] = str(e)
                        _write_session(job.id, session)
                    except Exception as se:
                        logger.warning(f"  [Queue] Could not write failure status for {job.id}: {se}")
                    # Notify WebSocket clients of job failure
                    try:
                        from src.core.progress import progress_manager
                        await progress_manager.complete(job.id, "failed", str(e))
                    except Exception as pm_err:
                        logger.warning(f"  [Queue] progress_manager.complete (error) error: {pm_err}")

                    # Log failure to analytics
                    try:
                        from src.core.analytics import stats_manager
                        stats_manager.log_render(0, job.status, [], str(e), module=job.type, session_id=job.id, channel_id=job.data.get("channel_id", "_default"))
                    except Exception as analytics_err:
                        logger.warning(f"Analytics log failed: {analytics_err}")

                finally:
                    async with self._count_lock:
                        self._running_count -= 1

                self.queue.task_done()

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"  [Queue] Worker-{worker_id} loop error: {e}")
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
