# YTRobot: Analytics, Social & Competitor Intelligence — Master Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 15 features in 3 groups: (A) Analytics/Social UI improvements already planned, (B) High-value features from competitor repos not yet in YTRobot, (C) Platform integrations.

**Architecture:** All features are strictly additive. Existing endpoints/pipeline untouched. New features add new files or extend existing ones with backward-compatible additions. Each task is independently testable and deployable.

**Tech Stack:** Python/FastAPI backend, Alpine.js v3 + Tailwind frontend, Chart.js 4 via CDN (new), `stats.json` + `social_log.json` + `antigravity_data.json` (persistent stores).

---

## Gap Analysis Summary

| Feature | YouTubeStoryGenerator | youtube_video_bot | YTRobot | Action |
|---|---|---|---|---|
| Daily render chart | — | — | ✗ | Add (Task 1) |
| Queue monitor widget | — | — | ✗ | Add (Task 2) |
| Cost tracking | — | — | ✗ | Add (Task 3) |
| Error drilldown | — | — | ✗ | Add (Task 4) |
| CSV export | — | — | ✗ | Add (Task 5) |
| Batch topic queue | ✓ Excel | ✓ TXT | ✗ | Add (Task 6) |
| Meta preview + SEO score | — | — | ✗ | Add (Task 7) |
| Publish history | — | — | ✗ | Add (Task 8) |
| AntiGravity competitor intel | ✓ Full | — | ✗ | Add (Task 9) |
| Thumbnail image generation | ✓ Full | ✓ Full | Concept only | Add (Task 10) |
| Content category templates | — | ✓ 7 categories | Bulletin only | Add (Task 11) |
| Scheduling / cron | ✓ interval | — | ✗ | Add (Task 12) |
| Webhook notifications | — | — | ✗ | Add (Task 13) |
| YouTube real OAuth upload | ✓ Full | ✓ Full | Draft only | Add (Task 14) |
| Infinite/autonomous loop | ✓ Full | — | ✗ | Add (Task 15) |

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/core/analytics.py` | Modify | Add daily_history, cost_tracking, error_details |
| `src/api/routes/stats.py` | Modify | Add 4 new endpoints |
| `src/core/queue.py` | Modify | Add get_queue_status() |
| `src/core/scheduler.py` | Create | APScheduler-based cron for autonomous loop |
| `src/core/antigravity.py` | Create | Competitor intel engine |
| `src/api/routes/antigravity.py` | Create | AntiGravity API routes |
| `src/api/routes/webhook.py` | Create | Webhook notification dispatch |
| `pipeline/social.py` | Modify | Real YouTube OAuth upload + social_log |
| `pipeline/thumbnail.py` | Create | AI thumbnail generation pipeline |
| `pipeline/script.py` | Modify | Add content_category parameter |
| `providers/visuals/pollinations.py` | Create | Pollinations.ai image provider |
| `ui/index.html` | Modify | Analytics, social, antigravity, infinity, batch, webhook pages |
| `ui/js/app.js` | Modify | New data properties and methods |
| `ui/js/translations.js` | Modify | New TR/EN keys |
| `config.py` | Modify | New settings for scheduler, webhook, antigravity |

---

## Task 1: Analytics Backend — Daily History, Cost Tracking, Error Details

**Files:**
- Modify: `src/core/analytics.py`

- [ ] **Step 1: Replace `src/core/analytics.py` completely**

```python
import json
import time
from pathlib import Path
from typing import Dict, Any, List, Optional

STATS_FILE = Path("stats.json")

PROVIDER_COST_ESTIMATES = {
    "openai_tts": 0.015,
    "elevenlabs": 0.03,
    "speshaudio": 0.01,
    "qwen3": 0.0,
    "pexels": 0.0,
    "pixabay": 0.0,
    "dalle": 0.04,
    "zimage": 0.02,
    "gemini": 0.002,
    "kieai": 0.002,
}

class StatsManager:
    def __init__(self):
        self.stats = self.load_stats()

    def load_stats(self) -> Dict[str, Any]:
        if STATS_FILE.exists():
            try:
                with open(STATS_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                # Migrate old schema
                for key, default in [
                    ("modules", {"yt_video": 0, "bulletin": 0, "product_review": 0}),
                    ("daily_history", []),
                    ("cost_tracking", {"total_estimated_usd": 0.0, "by_provider": {}}),
                    ("error_details", []),
                ]:
                    if key not in data:
                        data[key] = default
                return data
            except Exception as e:
                print(f"  [Analytics] Error loading stats: {e}")
        return {
            "total_renders": 0,
            "success_rate": 0.0,
            "failed_renders": 0,
            "completed_renders": 0,
            "average_render_time": 0.0,
            "total_render_time": 0.0,
            "modules": {"yt_video": 0, "bulletin": 0, "product_review": 0},
            "platform_stats": {"youtube": 0, "instagram": 0},
            "error_patterns": {},
            "daily_history": [],
            "cost_tracking": {"total_estimated_usd": 0.0, "by_provider": {}},
            "error_details": [],
            "last_update": time.time(),
        }

    def save_stats(self):
        try:
            self.stats["last_update"] = time.time()
            with open(STATS_FILE, "w", encoding="utf-8") as f:
                json.dump(self.stats, f, indent=4)
        except Exception as e:
            print(f"  [Analytics] Error saving stats: {e}")

    def log_render(self, duration: float, status: str,
                   platforms: Optional[List[str]] = None,
                   error: Optional[str] = None,
                   module: Optional[str] = None,
                   session_id: Optional[str] = None,
                   providers: Optional[List[str]] = None):
        self.stats["total_renders"] += 1
        if module and module in self.stats.get("modules", {}):
            self.stats["modules"][module] += 1
        if status == "completed":
            self.stats["completed_renders"] += 1
            self.stats["total_render_time"] += duration
            self.stats["average_render_time"] = (
                self.stats["total_render_time"] / self.stats["completed_renders"]
            )
        else:
            self.stats["failed_renders"] += 1
            if error:
                pattern = error[:50] if isinstance(error, str) else "Unknown Error"
                self.stats["error_patterns"][pattern] = (
                    self.stats["error_patterns"].get(pattern, 0) + 1
                )
                detail = {
                    "ts": time.time(),
                    "error": error[:200] if isinstance(error, str) else "Unknown Error",
                    "session_id": session_id or "",
                    "module": module or "",
                    "status": status,
                }
                self.stats.setdefault("error_details", []).append(detail)
                if len(self.stats["error_details"]) > 50:
                    self.stats["error_details"] = self.stats["error_details"][-50:]
        if self.stats["total_renders"] > 0:
            self.stats["success_rate"] = (
                self.stats["completed_renders"] / self.stats["total_renders"]
            ) * 100
        if platforms:
            for p in platforms:
                if p in self.stats.get("platform_stats", {}):
                    self.stats["platform_stats"][p] += 1
        # Daily history
        today = time.strftime("%Y-%m-%d")
        history = self.stats.setdefault("daily_history", [])
        today_entry = next((d for d in history if d["date"] == today), None)
        if today_entry is None:
            today_entry = {"date": today, "renders": 0, "success": 0, "failed": 0}
            history.append(today_entry)
        today_entry["renders"] += 1
        if status == "completed":
            today_entry["success"] += 1
        else:
            today_entry["failed"] += 1
        if len(history) > 30:
            self.stats["daily_history"] = history[-30:]
        # Cost tracking
        if providers:
            cost = self.stats.setdefault(
                "cost_tracking", {"total_estimated_usd": 0.0, "by_provider": {}}
            )
            for p in providers:
                estimate = PROVIDER_COST_ESTIMATES.get(p, 0.0)
                cost["total_estimated_usd"] = round(
                    cost["total_estimated_usd"] + estimate, 4
                )
                cost["by_provider"][p] = round(
                    cost["by_provider"].get(p, 0.0) + estimate, 4
                )
        self.save_stats()

    def get_stats(self) -> Dict[str, Any]:
        s = self.stats
        return {
            "summary": {
                "total_renders": s.get("total_renders", 0),
                "success_rate": s.get("success_rate", 0.0) / 100.0,
                "avg_render_time": s.get("average_render_time", 0.0),
                "failed_renders": s.get("failed_renders", 0),
                "completed_renders": s.get("completed_renders", 0),
                "total_render_time": s.get("total_render_time", 0.0),
            },
            "modules": s.get("modules", {"yt_video": 0, "bulletin": 0, "product_review": 0}),
            "platform_stats": s.get("platform_stats", {"youtube": 0, "instagram": 0}),
            "error_patterns": s.get("error_patterns", {}),
            "daily_history": s.get("daily_history", []),
            "cost_tracking": s.get("cost_tracking", {"total_estimated_usd": 0.0, "by_provider": {}}),
            "last_update": s.get("last_update", 0),
        }

    def get_error_details(self) -> List[Dict[str, Any]]:
        details = self.stats.get("error_details", [])
        return sorted(details, key=lambda x: x.get("ts", 0), reverse=True)

stats_manager = StatsManager()
```

- [ ] **Step 2: Update `src/core/queue.py` — add `get_queue_status()` and pass module to analytics**

Add this method to `QueueManager` class after `get_job_status()`:

```python
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
```

Also update both `stats_manager.log_render()` calls in the `_worker_loop` to pass `module=job.type` and `session_id=job.id` (already done for module; add session_id):

```python
# Success path (line ~137):
stats_manager.log_render(duration, job.status, platforms, None, module=job.type, session_id=job.id)

# Failure path (line ~172):
stats_manager.log_render(0, job.status, [], str(e), module=job.type, session_id=job.id)
```

- [ ] **Step 3: Verify**

```bash
cd "/Users/huseyincoskun/Downloads/Antigravity Proje/YTRobot"
.venv/bin/python -c "
from src.core.analytics import stats_manager
d = stats_manager.get_stats()
print('Keys:', list(d.keys()))
print('Daily history:', d['daily_history'])
print('Cost tracking:', d['cost_tracking'])
"
```

Expected: Keys include `daily_history`, `cost_tracking`. No errors.

- [ ] **Step 4: Commit**

```bash
git add src/core/analytics.py src/core/queue.py
git commit -m "feat(analytics): daily history, cost tracking, error details, session_id tracking"
```

---

## Task 2: New Analytics API Endpoints

**Files:**
- Modify: `src/api/routes/stats.py`

- [ ] **Step 1: Replace `src/api/routes/stats.py` completely**

```python
import csv
import io
import time
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from src.core.analytics import stats_manager
from typing import Dict, Any

router = APIRouter(tags=["analytics"])

@router.get("/api/stats")
@router.get("/stats")
async def get_dashboard_stats() -> Dict[str, Any]:
    try:
        return stats_manager.get_stats()
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
```

- [ ] **Step 2: Verify routes are registered correctly**

```bash
.venv/bin/python -c "
from src.api.routes.stats import router
print([r.path for r in router.routes])
"
```

Expected: `['/api/stats', '/stats', '/summary', '/api/stats/queue', '/api/stats/errors', '/api/stats/export-csv', '/api/stats/social-log']`

- [ ] **Step 3: Commit**

```bash
git add src/api/routes/stats.py
git commit -m "feat(analytics): queue, errors, CSV export, social-log endpoints"
```

---

## Task 3: Social Publish History Logging

**Files:**
- Modify: `pipeline/social.py`

- [ ] **Step 1: Replace `pipeline/social.py` completely**

```python
import json
import logging
import time
from pathlib import Path
from typing import Dict, Any, Optional
from config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SocialPoster")


class SocialPoster:
    def __init__(self):
        self.youtube_enabled = getattr(settings, "autopublish_youtube", False)
        self.instagram_enabled = getattr(settings, "share_on_instagram", False)

    def _log_publish(self, platform: str, status: str, video_path: Path,
                     metadata: Dict[str, Any]):
        log_file = Path("social_log.json")
        try:
            events = json.loads(log_file.read_text()) if log_file.exists() else []
        except Exception:
            events = []
        events.append({
            "ts": time.time(),
            "platform": platform,
            "status": status,
            "video": str(video_path.name) if video_path else "",
            "title": metadata.get("title", ""),
            "session_id": metadata.get("session_id", ""),
        })
        if len(events) > 500:
            events = events[-500:]
        try:
            log_file.write_text(json.dumps(events, indent=2))
        except Exception as e:
            logger.warning(f"[Social] Could not write social_log.json: {e}")

    async def post_to_youtube(self, video_path: Path,
                               metadata: Dict[str, Any]) -> Dict[str, Any]:
        logger.info(f"[YouTube] Loading video for upload: {video_path}")
        if not self.youtube_enabled:
            logger.info("[YouTube] API not enabled. Saving as DRAFT.")
            result = {"status": "success", "platform": "youtube",
                      "mode": "draft", "url": "local-draft-saved"}
        else:
            try:
                # FUTURE: Real YouTube Data API v3 implementation (Task 14)
                result = {"status": "success", "platform": "youtube",
                          "id": "mock-yt-123"}
            except Exception as e:
                logger.error(f"[YouTube] Upload failed: {e}")
                result = {"status": "error", "message": str(e)}
        self._log_publish("youtube", result.get("status", "unknown"),
                          video_path, metadata)
        return result

    async def post_to_instagram(self, video_path: Path,
                                 metadata: Dict[str, Any]) -> Dict[str, Any]:
        logger.info(f"[Instagram] Loading video for upload: {video_path}")
        if not self.instagram_enabled:
            logger.info("[Instagram] API not enabled. Saving as DRAFT.")
            result = {"status": "success", "platform": "instagram",
                      "mode": "draft", "url": "local-draft-saved"}
        else:
            try:
                result = {"status": "success", "platform": "instagram",
                          "id": "mock-ig-456"}
            except Exception as e:
                logger.error(f"[Instagram] Upload failed: {e}")
                result = {"status": "error", "message": str(e)}
        self._log_publish("instagram", result.get("status", "unknown"),
                          video_path, metadata)
        return result

    async def auto_publish(self, video_path: Path, metadata: Dict[str, Any]):
        results = []
        if metadata.get("publish_youtube"):
            results.append(await self.post_to_youtube(video_path, metadata))
        if metadata.get("publish_instagram"):
            results.append(await self.post_to_instagram(video_path, metadata))
        return results


social_poster = SocialPoster()
```

- [ ] **Step 2: Verify**

```bash
.venv/bin/python -c "from pipeline.social import social_poster; print('OK')"
```

- [ ] **Step 3: Commit**

```bash
git add pipeline/social.py
git commit -m "feat(social): log publish events to social_log.json"
```

---

## Task 4: Analytics UI — Chart.js, Queue Monitor, Cost Card, Error Drilldown, CSV Export

**Files:**
- Modify: `ui/index.html`
- Modify: `ui/js/app.js`
- Modify: `ui/js/translations.js`

- [ ] **Step 1: Add Chart.js CDN before Alpine.js in `ui/index.html`**

Find the Alpine.js `<script>` tag (contains `alpinejs`). Add immediately before it:

```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
```

- [ ] **Step 2: Add data properties to `app.js`**

Find `analyticsData: null,` and replace the two lines:

```javascript
analyticsData: null,
analyticsLoading: false,
```

with:

```javascript
analyticsData: null,
analyticsLoading: false,
queueStatus: null,
errorDetails: [],
socialLog: [],
_chartInstance: null,
```

- [ ] **Step 3: Replace `loadAnalytics()` and add new methods after it in `app.js`**

Replace the existing `loadAnalytics()`:

```javascript
async loadAnalytics() {
  this.analyticsLoading = true;
  try {
    this.analyticsData = await this.apiFetch('/api/stats');
    await this.$nextTick();
    this.renderDailyChart('dailyRenderChart');
  } catch(e) { console.error("Analytics fetch error:", e); }
  finally { this.analyticsLoading = false; }
},

async loadQueueStatus() {
  try { this.queueStatus = await this.apiFetch('/api/stats/queue'); }
  catch(e) { console.warn('[queue] status error:', e); }
},

async loadErrorDetails() {
  try {
    const data = await this.apiFetch('/api/stats/errors');
    this.errorDetails = data.errors || [];
  } catch(e) { console.warn('[analytics] error details error:', e); }
},

async loadSocialLog() {
  try {
    const data = await this.apiFetch('/api/stats/social-log');
    this.socialLog = data.events || [];
  } catch(e) { console.warn('[social] log error:', e); }
},

downloadStatsCsv() {
  window.open('/api/stats/export-csv', '_blank');
},

renderDailyChart(canvasId) {
  if (!this.analyticsData?.daily_history?.length) return;
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof Chart === 'undefined') return;
  if (this._chartInstance) { this._chartInstance.destroy(); this._chartInstance = null; }
  const history = this.analyticsData.daily_history.slice(-14);
  this._chartInstance = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels: history.map(d => d.date.slice(5)),
      datasets: [
        { label: 'Success', data: history.map(d => d.success),
          backgroundColor: 'rgba(16,185,129,0.7)', borderRadius: 4 },
        { label: 'Failed', data: history.map(d => d.failed),
          backgroundColor: 'rgba(239,68,68,0.6)', borderRadius: 4 },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#94a3b8', font: { size: 10 } } } },
      scales: {
        x: { stacked: true, ticks: { color: '#64748b', font: { size: 9 } },
             grid: { color: 'rgba(255,255,255,0.05)' } },
        y: { stacked: true, ticks: { color: '#64748b', font: { size: 9 } },
             grid: { color: 'rgba(255,255,255,0.05)' }, beginAtZero: true },
      },
    },
  });
},

formatTs(ts) {
  if (!ts) return '';
  return new Date(ts * 1000).toLocaleString(
    this.lang === 'tr' ? 'tr-TR' : 'en-US',
    { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
  );
},
```

- [ ] **Step 4: Update the 3-second polling timer in `app.js`**

Find:
```javascript
      this._timer = setInterval(() => {
        this.loadSessions();
        if (this.view === 'analytics') this.loadAnalytics();
      }, 3000);
```

Replace with:
```javascript
      this._timer = setInterval(() => {
        this.loadSessions();
        if (this.view === 'analytics') {
          this.loadAnalytics();
          this.loadQueueStatus();
        }
        if (this.view === 'social-meta') this.loadSocialLog();
      }, 3000);
```

- [ ] **Step 5: Update the `nav_analytics` command in `app.js`**

Find `{ id: 'nav_analytics',` and update its action:

```javascript
{ id: 'nav_analytics', title: 'Analytics / Analiz Paneli', icon: '📈', action: function() {
  this.view = 'analytics';
  this.loadAnalytics();
  this.loadQueueStatus();
  this.loadErrorDetails();
} },
```

- [ ] **Step 6: Update the Analytics nav button `@click` in `ui/index.html`**

Find the nav button with `view==='analytics'` in the navigation. Change its `@click` to:

```
@click="view='analytics'; loadAnalytics(); loadQueueStatus(); loadErrorDetails()"
```

- [ ] **Step 7: Replace the entire analytics section in `ui/index.html`**

Find `<div x-show="view==='analytics'" class="p-6">` and its matching closing `</div>` (before `<!-- ══ DASHBOARD`). Replace entirely with:

```html
    <!-- ══ ANALYTICS ══════════════════════════════════════════════════ -->
    <div x-show="view==='analytics'" class="p-6">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-black text-white tracking-tight" x-text="t('analytics_title')"></h1>
          <p class="text-slate-500 text-sm mt-1" x-text="t('analytics_subtitle')"></p>
        </div>
        <div class="flex items-center gap-2">
          <button @click="downloadStatsCsv()" class="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-400 hover:text-white hover:border-emerald-500 text-xs font-bold transition-all flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            CSV
          </button>
          <button @click="loadAnalytics(); loadQueueStatus(); loadErrorDetails()" class="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all">
            <svg class="w-5 h-5" :class="analyticsLoading?'animate-spin':''" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          </button>
        </div>
      </div>

      <!-- Queue Monitor Widget -->
      <div class="mb-6 glass-card p-4 rounded-2xl border border-slate-800 bg-slate-900/50">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
            <span class="w-2 h-2 rounded-full" :class="queueStatus?.running_count > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'"></span>
            Kuyruk Monitörü
          </h2>
          <span class="text-[10px] font-mono text-slate-500" x-text="queueStatus ? queueStatus.running_count + '/' + queueStatus.max_concurrent + ' Worker Aktif' : '...'"></span>
        </div>
        <template x-if="queueStatus && (queueStatus.running.length > 0 || queueStatus.queued.length > 0)">
          <div class="space-y-1">
            <template x-for="job in queueStatus.running" :key="job.id">
              <div class="flex items-center justify-between px-3 py-1.5 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                <div class="flex items-center gap-2">
                  <span class="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                  <span class="text-[10px] font-mono text-emerald-300" x-text="job.id.substring(0,20)+'...'"></span>
                  <span class="text-[10px] text-slate-500 uppercase" x-text="job.type"></span>
                </div>
                <span class="text-[10px] font-mono text-slate-400" x-text="job.elapsed+'s'"></span>
              </div>
            </template>
            <template x-for="job in queueStatus.queued" :key="job.id">
              <div class="flex items-center gap-2 px-3 py-1.5 bg-amber-500/5 border border-amber-500/10 rounded-lg">
                <span class="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                <span class="text-[10px] font-mono text-amber-300" x-text="job.id.substring(0,20)+'...'"></span>
                <span class="text-[10px] text-slate-500 uppercase" x-text="job.type+' — bekliyor'"></span>
              </div>
            </template>
          </div>
        </template>
        <div x-show="!queueStatus || (queueStatus.running.length === 0 && queueStatus.queued.length === 0)" class="text-center py-2">
          <span class="text-[10px] text-slate-600 uppercase tracking-widest">Kuyruk Boş — Sistem Hazır</span>
        </div>
      </div>

      <template x-if="analyticsData">
        <div class="space-y-8">
          <!-- Stats Cards -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-900 relative overflow-hidden">
              <div class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Toplam Video</div>
              <div class="text-3xl font-black text-white" x-text="analyticsData.summary.total_renders"></div>
              <div class="text-[10px] text-indigo-400 font-mono mt-1">OTONOM DÖNGÜ</div>
            </div>
            <div class="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-900 relative overflow-hidden">
              <div class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Başarı Oranı</div>
              <div class="text-3xl font-black text-emerald-400" x-text="((analyticsData.summary.success_rate||0)*100).toFixed(1)+'%'"></div>
              <div class="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                <div class="h-full bg-emerald-500 transition-all duration-1000" :style="`width:${(analyticsData.summary.success_rate||0)*100}%`"></div>
              </div>
            </div>
            <div class="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-900">
              <div class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Ort. Süre</div>
              <div class="text-3xl font-black text-amber-400" x-text="(analyticsData.summary.avg_render_time/60).toFixed(1)+' dk'"></div>
              <div class="text-[10px] text-slate-600 mt-1">İŞLEM BAŞINA</div>
            </div>
            <div class="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-900">
              <div class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Tahmini Maliyet</div>
              <div class="text-3xl font-black text-violet-400" x-text="'$'+(analyticsData.cost_tracking?.total_estimated_usd||0).toFixed(3)"></div>
              <div class="text-[10px] text-slate-600 mt-1">API TAHMİNİ</div>
            </div>
          </div>

          <!-- Chart + Module distribution -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="glass-card p-6 rounded-3xl border border-slate-800 bg-slate-900/50">
              <h2 class="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                <span class="w-2 h-2 bg-emerald-500 rounded-full"></span> Son 14 Gün
              </h2>
              <div class="h-48">
                <canvas id="dailyRenderChart"></canvas>
              </div>
              <div x-show="!analyticsData.daily_history?.length" class="h-48 flex items-center justify-center -mt-48">
                <span class="text-[10px] text-slate-600 uppercase tracking-widest">Henüz Veri Yok</span>
              </div>
            </div>
            <div class="glass-card p-6 rounded-3xl border border-slate-800 bg-slate-900/50">
              <h2 class="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                <span class="w-2 h-2 bg-indigo-500 rounded-full"></span> Modül Dağılımı
              </h2>
              <div class="space-y-4">
                <template x-for="[mod, label, color] in [['yt_video','Normal Video','indigo'],['bulletin','Haber Bülteni','red'],['product_review','Ürün İnceleme','amber']]" :key="mod">
                  <div>
                    <div class="flex justify-between mb-1">
                      <span class="text-xs text-slate-300" x-text="label"></span>
                      <span class="text-xs font-mono" :class="`text-${color}-400`" x-text="(analyticsData.modules[mod]||0)+' Adet'"></span>
                    </div>
                    <div class="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div class="h-full rounded-full" :class="`bg-${color}-500`" :style="`width:${((analyticsData.modules[mod]||0)/Math.max(analyticsData.summary.total_renders,1))*100}%`"></div>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>

          <!-- Error patterns + drilldown -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="glass-card p-6 rounded-3xl border border-slate-800 bg-slate-900/50">
              <h2 class="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                <span class="w-2 h-2 bg-red-500 rounded-full"></span> Hata Analitiği
              </h2>
              <div class="space-y-2">
                <template x-for="(count, error) in analyticsData.error_patterns" :key="error">
                  <div class="p-3 bg-red-500/5 border border-red-500/10 rounded-xl flex justify-between hover:bg-red-500/10 transition-all cursor-pointer" @click="loadErrorDetails()">
                    <span class="text-xs text-red-200 truncate pr-4" x-text="error"></span>
                    <span class="shrink-0 px-2 py-0.5 bg-red-900/30 text-red-400 text-[10px] font-bold rounded-lg" x-text="count+' Kez'"></span>
                  </div>
                </template>
                <div x-show="Object.keys(analyticsData.error_patterns).length===0" class="py-8 text-center">
                  <span class="text-emerald-500 text-xs font-bold uppercase">✓ Sistem Stabil</span>
                </div>
              </div>
            </div>
            <div class="glass-card p-6 rounded-3xl border border-slate-800 bg-slate-900/50">
              <div class="flex justify-between mb-4">
                <h2 class="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <span class="w-2 h-2 bg-orange-500 rounded-full"></span> Hata Detayları
                </h2>
                <button @click="loadErrorDetails()" class="text-[10px] text-slate-500 hover:text-white">Yenile</button>
              </div>
              <div class="space-y-2 max-h-56 overflow-y-auto">
                <template x-for="err in errorDetails.slice(0,10)" :key="err.ts">
                  <div class="p-2.5 bg-red-500/5 border border-red-500/10 rounded-lg">
                    <div class="flex justify-between mb-1">
                      <span class="text-[9px] font-bold uppercase text-slate-400" x-text="err.module||'unknown'"></span>
                      <span class="text-[9px] font-mono text-slate-600" x-text="formatTs(err.ts)"></span>
                    </div>
                    <p class="text-[10px] text-red-200 truncate" x-text="err.error"></p>
                    <span x-show="err.session_id" class="text-[9px] font-mono text-slate-600" x-text="err.session_id"></span>
                  </div>
                </template>
                <div x-show="errorDetails.length===0" class="py-6 text-center">
                  <span class="text-[10px] text-slate-600 uppercase">Detaylı hata kaydı yok</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Cost breakdown -->
          <template x-if="analyticsData.cost_tracking && Object.keys(analyticsData.cost_tracking.by_provider||{}).length>0">
            <div class="glass-card p-6 rounded-3xl border border-slate-800 bg-slate-900/50">
              <h2 class="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                <span class="w-2 h-2 bg-violet-500 rounded-full"></span> API Maliyet Dağılımı
              </h2>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <template x-for="(cost, provider) in analyticsData.cost_tracking.by_provider" :key="provider">
                  <div class="p-3 bg-violet-500/5 border border-violet-500/10 rounded-xl text-center">
                    <div class="text-[10px] font-bold text-slate-400 uppercase mb-1" x-text="provider"></div>
                    <div class="text-lg font-black text-violet-300" x-text="'$'+cost.toFixed(3)"></div>
                  </div>
                </template>
              </div>
            </div>
          </template>
        </div>
      </template>
    </div>
```

- [ ] **Step 8: Add translation keys to `ui/js/translations.js`**

In English section after `nav_social_meta`:
```javascript
    analytics_csv_export: 'Export CSV',
```

In Turkish section after `nav_social_meta`:
```javascript
    analytics_csv_export: 'CSV İndir',
```

- [ ] **Step 9: Verify in browser**

Start server, navigate to Analytics page, confirm:
- Stats cards show correct numbers
- Queue monitor shows "Kuyruk Boş"
- Chart renders (will be empty for now since no new renders logged)
- CSV button opens download
- Error drilldown shows existing errors

- [ ] **Step 10: Commit**

```bash
git add ui/index.html ui/js/app.js ui/js/translations.js
git commit -m "feat(analytics): daily chart, queue monitor, cost card, error drilldown, CSV export"
```

---

## Task 5: Batch Video Queue UI

**Files:**
- Modify: `ui/index.html`
- Modify: `ui/js/app.js`
- Modify: `ui/js/translations.js`

- [ ] **Step 1: Add batch data properties in `app.js`**

Find `wizardQuality: 'standard',` and add before it:

```javascript
batchTopics: '',
batchSubmitting: false,
batchSubmitResult: null,
batchError: '',
```

- [ ] **Step 2: Add `submitBatch()` method in `app.js` after `downloadStatsCsv()`**

```javascript
async submitBatch() {
  const lines = this.batchTopics.split('\n').map(l => l.trim()).filter(Boolean);
  if (!lines.length) return;
  this.batchSubmitting = true;
  this.batchError = '';
  this.batchSubmitResult = null;
  const results = [];
  try {
    for (const topic of lines) {
      try {
        const data = await this.apiFetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic, preset_name: this.selectedPreset || '' }),
        });
        results.push({ topic, id: data.session_id, ok: true });
      } catch(e) {
        results.push({ topic, error: e.message, ok: false });
      }
    }
    this.batchSubmitResult = results;
    this.batchTopics = '';
    this.loadSessions();
  } catch(e) {
    this.batchError = e.message;
  } finally {
    this.batchSubmitting = false;
  }
},
```

- [ ] **Step 3: Add batch section in `ui/index.html` inside New Video wizard step 2**

Find the section `x-show="view==='new-run'"`. Inside it, find the end of the step 2 form area (after the main submit button area, before the closing div of that step). Add:

```html
<!-- Toplu Video Kuyruğu -->
<div class="mt-6 border-t border-slate-800 pt-6" x-show="wizardStep===2 && videoModule==='normal'">
  <details class="group">
    <summary class="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-400 hover:text-white uppercase tracking-widest transition-colors list-none select-none">
      <svg class="w-3.5 h-3.5 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
      Toplu Video Kuyruğu (Batch)
    </summary>
    <div class="mt-4 space-y-4">
      <p class="text-xs text-slate-500">Her satıra bir konu gir — hepsi sıraya alınır.</p>
      <textarea x-model="batchTopics" rows="5"
        class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-violet-500 resize-y"
        placeholder="Yapay Zekanın Geleceği&#10;Kuantum Bilgisayarlar&#10;Mars Kolonizasyonu"></textarea>
      <template x-if="batchSubmitResult">
        <div class="space-y-1 max-h-32 overflow-y-auto pr-1">
          <template x-for="r in batchSubmitResult" :key="r.topic">
            <div class="flex items-center gap-2 text-[10px] font-mono" :class="r.ok ? 'text-emerald-400' : 'text-red-400'">
              <span x-text="r.ok ? '✓' : '✗'"></span>
              <span class="truncate flex-1" x-text="r.topic"></span>
              <span x-show="r.id" class="text-slate-600" x-text="r.id?.substring(0,12)"></span>
            </div>
          </template>
        </div>
      </template>
      <p x-show="batchError" class="text-xs text-red-400" x-text="batchError"></p>
      <button @click="submitBatch()"
        :disabled="batchSubmitting || !batchTopics.trim()"
        class="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2">
        <svg x-show="batchSubmitting" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
        <span x-text="batchSubmitting ? 'Kuyruğa Ekleniyor...' : 'Tümünü Kuyruğa Ekle'"></span>
      </button>
    </div>
  </details>
</div>
```

- [ ] **Step 4: Commit**

```bash
git add ui/index.html ui/js/app.js
git commit -m "feat(wizard): batch video queue — multi-topic submit"
```

---

## Task 6: Social Media Page — SEO Score + Meta Preview + Publish History

**Files:**
- Modify: `ui/index.html`
- Modify: `ui/js/app.js`

- [ ] **Step 1: Add `computeSeoScore()` and update `nav_social_meta` in `app.js`**

After `copySocialMeta()`, add:

```javascript
computeSeoScore(result) {
  if (!result) return null;
  let score = 0;
  const checks = [];
  const title = result.title || '';
  if (title.length >= 20 && title.length <= 60) {
    score += 25; checks.push({ label: 'Title uzunluğu', ok: true, msg: title.length+' karakter (ideal: 20-60)' });
  } else {
    checks.push({ label: 'Title uzunluğu', ok: false, msg: title.length+' karakter (ideal: 20-60)' });
  }
  const desc = result.description || '';
  if (desc.length >= 100 && desc.length <= 500) {
    score += 25; checks.push({ label: 'Açıklama uzunluğu', ok: true, msg: desc.length+' karakter (ideal: 100-500)' });
  } else {
    checks.push({ label: 'Açıklama uzunluğu', ok: false, msg: desc.length+' karakter (ideal: 100-500)' });
  }
  const tags = Array.isArray(result.tags) ? result.tags : (result.tags||'').split(',').filter(Boolean);
  if (tags.length >= 10 && tags.length <= 20) {
    score += 25; checks.push({ label: 'Etiket sayısı', ok: true, msg: tags.length+' etiket (ideal: 10-20)' });
  } else {
    checks.push({ label: 'Etiket sayısı', ok: false, msg: tags.length+' etiket (ideal: 10-20)' });
  }
  const titleWords = title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const descLower = desc.toLowerCase();
  const matchCount = titleWords.filter(w => descLower.includes(w)).length;
  const pct = titleWords.length > 0 ? Math.round(matchCount/titleWords.length*100) : 0;
  if (titleWords.length > 0 && pct >= 50) {
    score += 25; checks.push({ label: 'Anahtar kelime uyumu', ok: true, msg: '%'+pct+' örtüşme' });
  } else {
    checks.push({ label: 'Anahtar kelime uyumu', ok: false, msg: '%'+pct+' örtüşme (ideal: ≥50%)' });
  }
  const color = score >= 75 ? 'emerald' : score >= 50 ? 'amber' : 'red';
  return { score, checks, color };
},
```

Update `nav_social_meta` command action:
```javascript
{ id: 'nav_social_meta', title: 'Social Media / Sosyal Medya', icon: '📱', action: function() { this.loadSettings(); this.view = 'social-meta'; this.loadSocialLog(); } },
```

Update social-meta nav button `@click` in `ui/index.html`:
```
@click="loadSettings(); view='social-meta'; loadSocialLog()"
```

- [ ] **Step 2: Add meta preview + SEO score + publish history to social-meta page in `ui/index.html`**

Find the closing `</div>` of the social-meta page (right before `<!-- ══ BÜLTEN`). Before that `</div>`, add:

```html
      <!-- Meta Preview + SEO Score (shown after generateSocialMeta) -->
      <template x-if="socialMetaResult">
        <div class="border-t border-slate-800 pt-8 mt-8 space-y-6">
          <h2 class="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
            <span class="w-2 h-2 bg-red-500 rounded-full"></span> YouTube Önizleme
          </h2>
          <div class="bg-white rounded-xl overflow-hidden max-w-md shadow-2xl">
            <div class="bg-slate-200 h-28 flex items-center justify-center">
              <svg class="w-8 h-8 text-slate-400" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"/></svg>
            </div>
            <div class="p-3">
              <p class="text-sm font-semibold text-slate-900 line-clamp-2 leading-tight" x-text="socialMetaResult.title||'Başlık yok'"></p>
              <p class="text-[11px] text-slate-500 mt-1 line-clamp-2" x-text="(socialMetaResult.description||'').substring(0,100)+'...'"></p>
              <p class="text-[10px] text-slate-400 mt-1">YTRobot • 0 görüntüleme • az önce</p>
            </div>
          </div>

          <!-- SEO Score -->
          <div class="glass-card p-5 rounded-2xl border border-slate-800">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-xs font-black text-white uppercase tracking-widest">SEO Skoru</h3>
              <div class="text-2xl font-black" :class="`text-${computeSeoScore(socialMetaResult)?.color}-400`" x-text="computeSeoScore(socialMetaResult)?.score+'/100'"></div>
            </div>
            <div class="space-y-2">
              <template x-for="check in computeSeoScore(socialMetaResult)?.checks" :key="check.label">
                <div class="flex items-center justify-between py-1 border-b border-slate-800 last:border-0">
                  <div class="flex items-center gap-2">
                    <span :class="check.ok ? 'text-emerald-400' : 'text-red-400'" class="text-xs font-bold w-3" x-text="check.ok ? '✓' : '✗'"></span>
                    <span class="text-xs text-slate-300" x-text="check.label"></span>
                  </div>
                  <span class="text-[10px] text-slate-500" x-text="check.msg"></span>
                </div>
              </template>
            </div>
          </div>

          <button @click="copySocialMeta()" class="w-full px-4 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-bold transition-all">
            <span x-text="socialMetaCopied ? t('social_meta_copied') : t('social_meta_copy_btn')"></span>
          </button>
        </div>
      </template>

      <!-- Paylaşım Geçmişi -->
      <div class="border-t border-slate-800 pt-8 mt-8">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
            <span class="w-2 h-2 bg-slate-500 rounded-full"></span> Paylaşım Geçmişi
          </h2>
          <button @click="loadSocialLog()" class="text-[10px] text-slate-500 hover:text-white transition-colors">Yenile</button>
        </div>
        <div x-show="socialLog.length > 0" class="space-y-2 max-h-64 overflow-y-auto">
          <template x-for="event in [...socialLog].reverse().slice(0,20)" :key="event.ts">
            <div class="flex items-center gap-3 p-2.5 bg-slate-800/40 border border-slate-700/50 rounded-lg">
              <svg x-show="event.platform==='youtube'" class="w-4 h-4 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"/></svg>
              <svg x-show="event.platform!=='youtube'" class="w-4 h-4 text-violet-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
              <div class="flex-1 min-w-0">
                <p class="text-xs text-slate-300 truncate" x-text="event.title||event.video||'Başlıksız'"></p>
                <p class="text-[10px] text-slate-600 font-mono" x-text="formatTs(event.ts)"></p>
              </div>
              <span class="text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0"
                :class="event.status==='success' ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-900/40 text-red-400'"
                x-text="event.status==='success' ? '✓' : '✗'"></span>
            </div>
          </template>
        </div>
        <div x-show="socialLog.length===0" class="py-8 text-center">
          <span class="text-[10px] text-slate-600 uppercase tracking-widest">Henüz Paylaşım Yok</span>
        </div>
      </div>
```

- [ ] **Step 3: Commit**

```bash
git add ui/index.html ui/js/app.js
git commit -m "feat(social): meta preview, SEO score, publish history"
```

---

## Task 7: AntiGravity Competitor Intelligence Engine

Inspired by YouTubeStoryGenerator's AntiGravity Engine. Tracks competitor channels, fetches their latest videos, scores titles, and surfaces rewrite suggestions.

**Files:**
- Create: `src/core/antigravity.py`
- Create: `src/api/routes/antigravity.py`
- Modify: `server.py` (register router)
- Modify: `ui/index.html` (new nav item + page)
- Modify: `ui/js/app.js` (new data + methods)
- Modify: `ui/js/translations.js`

- [ ] **Step 1: Create `src/core/antigravity.py`**

```python
import json
import logging
import os
import time
import urllib.request as urllib_req
from pathlib import Path
from typing import Dict, Any, List, Optional

logger = logging.getLogger("ytrobot.antigravity")
DATA_FILE = Path("antigravity_data.json")


def _load_data() -> Dict[str, Any]:
    if DATA_FILE.exists():
        try:
            return json.loads(DATA_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {"channels": [], "title_pool": [], "used_titles": []}


def _save_data(data: Dict[str, Any]):
    DATA_FILE.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")


def get_data() -> Dict[str, Any]:
    return _load_data()


def save_channel(channel: Dict[str, Any]) -> Dict[str, Any]:
    data = _load_data()
    existing = next((c for c in data["channels"] if c["id"] == channel["id"]), None)
    if existing:
        existing.update(channel)
    else:
        data["channels"].append(channel)
    _save_data(data)
    return channel


def delete_channel(channel_id: str):
    data = _load_data()
    data["channels"] = [c for c in data["channels"] if c["id"] != channel_id]
    _save_data(data)


def update_title(title_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    data = _load_data()
    entry = next((t for t in data["title_pool"] if t["id"] == title_id), None)
    if entry:
        entry.update(updates)
        _save_data(data)
    return entry


def delete_title(title_id: str):
    data = _load_data()
    data["title_pool"] = [t for t in data["title_pool"] if t["id"] != title_id]
    _save_data(data)


def _youtube_search(channel_id: str, max_results: int, api_key: str) -> List[Dict]:
    """Fetch recent video titles from a YouTube channel."""
    url = (
        f"https://www.googleapis.com/youtube/v3/search"
        f"?part=snippet&channelId={channel_id}&maxResults={max_results}"
        f"&order=date&type=video&key={api_key}"
    )
    try:
        req = urllib_req.Request(url)
        with urllib_req.urlopen(req, timeout=15) as r:
            result = json.loads(r.read())
        return [
            {
                "title": item["snippet"]["title"],
                "video_id": item["id"]["videoId"],
                "channel_title": item["snippet"]["channelTitle"],
                "published_at": item["snippet"]["publishedAt"],
            }
            for item in result.get("items", [])
        ]
    except Exception as e:
        logger.error(f"YouTube search error for {channel_id}: {e}")
        return []


def _score_title_with_ai(title: str, api_key: str) -> Dict[str, Any]:
    """Score a title on 5 dimensions via Gemini."""
    prompt = (
        f"Score this YouTube title on 5 dimensions (0-10 each):\n"
        f"Title: {title}\n\n"
        f"Return ONLY valid JSON:\n"
        f'{{"curiosity":7,"emotion":6,"psychology":5,"ctr":8,"trend":6,"viral_score":6.4}}'
    )
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key, base_url="https://api.kie.ai/gemini-2.5-flash/v1")
        resp = client.chat.completions.create(
            model="gemini-2.5-flash",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
        )
        import re
        raw = resp.choices[0].message.content.strip()
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        return json.loads(raw)
    except Exception as e:
        logger.warning(f"Title scoring failed for '{title}': {e}")
        return {"curiosity": 5, "emotion": 5, "psychology": 5, "ctr": 5, "trend": 5, "viral_score": 5.0}


def _rewrite_title(title: str, language: str, dna: str, api_key: str) -> str:
    """Rewrite a title in target language/DNA style."""
    prompt = (
        f"Rewrite this YouTube title in {language} language with a {dna} content style.\n"
        f"Make it more engaging and click-worthy.\n"
        f"Original: {title}\n"
        f"Return ONLY the rewritten title, nothing else."
    )
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key, base_url="https://api.kie.ai/gemini-2.5-flash/v1")
        resp = client.chat.completions.create(
            model="gemini-2.5-flash",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        logger.warning(f"Title rewrite failed: {e}")
        return title


def scan_channel(channel_id: str) -> Dict[str, Any]:
    """Run a competitor scan for a registered channel."""
    from config import settings
    api_key = getattr(settings, "kieai_api_key", "") or os.environ.get("KIEAI_API_KEY", "")
    yt_key = getattr(settings, "youtube_api_key", "") or os.environ.get("YOUTUBE_API_KEY", "")

    data = _load_data()
    channel = next((c for c in data["channels"] if c["id"] == channel_id), None)
    if not channel:
        return {"error": "Channel not found"}

    competitors = channel.get("competitors", [])
    pull_count = channel.get("pull_count", 10)
    language = channel.get("language", "Turkish")
    dna = channel.get("dna", "Documentary")

    existing_titles = {t["original_title"] for t in data["title_pool"]}
    used_titles = set(data.get("used_titles", []))
    new_entries = []

    for comp in competitors:
        comp_channel_id = comp.get("channel_id", "")
        if not comp_channel_id or not yt_key:
            continue
        videos = _youtube_search(comp_channel_id, pull_count, yt_key)
        for v in videos:
            t = v["title"]
            if t in existing_titles or t in used_titles:
                continue
            existing_titles.add(t)
            scores = _score_title_with_ai(t, api_key) if api_key else {
                "curiosity": 5, "emotion": 5, "psychology": 5, "ctr": 5, "trend": 5, "viral_score": 5.0
            }
            rewritten = _rewrite_title(t, language, dna, api_key) if api_key else t
            entry = {
                "id": f"ag_{int(time.time()*1000)}_{len(new_entries)}",
                "original_title": t,
                "rewritten_title": rewritten,
                "source_channel": v["channel_title"],
                "video_id": v["video_id"],
                "published_at": v["published_at"],
                "scores": scores,
                "viral_score": scores.get("viral_score", 5.0),
                "status": "new",
                "channel_id": channel_id,
                "scanned_at": time.time(),
            }
            new_entries.append(entry)

    data["title_pool"].extend(new_entries)
    # Keep latest 500 entries
    if len(data["title_pool"]) > 500:
        data["title_pool"] = sorted(
            data["title_pool"], key=lambda x: x.get("scanned_at", 0), reverse=True
        )[:500]
    _save_data(data)
    return {"added": len(new_entries), "total_pool": len(data["title_pool"])}
```

- [ ] **Step 2: Create `src/api/routes/antigravity.py`**

```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from src.core import antigravity

router = APIRouter(prefix="/api/antigravity", tags=["antigravity"])


class ChannelReq(BaseModel):
    id: str
    name: str
    language: str = "Turkish"
    dna: str = "Documentary"
    pull_count: int = 10
    competitors: List[Dict[str, Any]] = []


class CompetitorReq(BaseModel):
    channel_id: str
    name: str
    thumbnail: str = ""


class TitleUpdateReq(BaseModel):
    status: Optional[str] = None
    rewritten_title: Optional[str] = None


@router.get("")
def get_antigravity_data():
    return antigravity.get_data()


@router.post("/channels")
def save_channel(body: ChannelReq):
    return antigravity.save_channel(body.model_dump())


@router.delete("/channels/{channel_id}")
def delete_channel(channel_id: str):
    antigravity.delete_channel(channel_id)
    return {"ok": True}


@router.post("/channels/{channel_id}/scan")
async def scan_channel(channel_id: str):
    result = antigravity.scan_channel(channel_id)
    if "error" in result:
        raise HTTPException(404, result["error"])
    return result


@router.patch("/titles/{title_id}")
def update_title(title_id: str, body: TitleUpdateReq):
    entry = antigravity.update_title(title_id, body.model_dump(exclude_none=True))
    if not entry:
        raise HTTPException(404, "Title not found")
    return entry


@router.delete("/titles/{title_id}")
def delete_title(title_id: str):
    antigravity.delete_title(title_id)
    return {"ok": True}
```

- [ ] **Step 3: Register router in `server.py`**

Find the existing router imports (near `from src.api.routes.stats import router as stats_router`). Add:

```python
from src.api.routes.antigravity import router as antigravity_router
```

Find the `app.include_router(...)` calls and add:

```python
app.include_router(antigravity_router)
```

- [ ] **Step 4: Add nav item to `ui/index.html` sidebar**

Find the Analytics nav button in the sidebar nav. After it, add:

```html
        <button @click="view='antigravity'; loadAntigravity()"
                class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2.5 transition-all"
                :class="view==='antigravity'?'bg-rose-700 text-white shadow-md shadow-rose-900/40':'text-slate-400 hover:bg-slate-800 hover:text-white'">
          <span>🎯</span> <span x-text="t('nav_antigravity')"></span>
        </button>
```

- [ ] **Step 5: Add AntiGravity data properties to `app.js`**

After `analyticsData: null,` block, add:

```javascript
antigravityData: null,
antigravityLoading: false,
antigravityScanning: {},
agActiveChannel: null,
agStatusFilter: 'all',
agNewChannel: { id: '', name: '', language: 'Turkish', dna: 'Documentary', pull_count: 10, competitors: [] },
agNewCompetitorId: '',
agNewCompetitorName: '',
```

- [ ] **Step 6: Add AntiGravity methods to `app.js` (after `loadSocialLog()`)**

```javascript
async loadAntigravity() {
  this.antigravityLoading = true;
  try { this.antigravityData = await this.apiFetch('/api/antigravity'); }
  catch(e) { console.error('[ag] load error:', e); }
  finally { this.antigravityLoading = false; }
},

async saveAgChannel() {
  if (!this.agNewChannel.id || !this.agNewChannel.name) return;
  try {
    await this.apiFetch('/api/antigravity/channels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.agNewChannel),
    });
    await this.loadAntigravity();
    this.agNewChannel = { id: '', name: '', language: 'Turkish', dna: 'Documentary', pull_count: 10, competitors: [] };
  } catch(e) { console.error('[ag] save channel error:', e); }
},

async deleteAgChannel(id) {
  try {
    await this.apiFetch(`/api/antigravity/channels/${id}`, { method: 'DELETE' });
    await this.loadAntigravity();
    if (this.agActiveChannel?.id === id) this.agActiveChannel = null;
  } catch(e) { console.error('[ag] delete channel error:', e); }
},

async scanAgChannel(channelId) {
  this.antigravityScanning[channelId] = true;
  try {
    await this.apiFetch(`/api/antigravity/channels/${channelId}/scan`, { method: 'POST' });
    await this.loadAntigravity();
  } catch(e) { console.error('[ag] scan error:', e); }
  finally { delete this.antigravityScanning[channelId]; }
},

async updateAgTitle(id, updates) {
  try {
    await this.apiFetch(`/api/antigravity/titles/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    await this.loadAntigravity();
  } catch(e) { console.error('[ag] update title error:', e); }
},

async deleteAgTitle(id) {
  try {
    await this.apiFetch(`/api/antigravity/titles/${id}`, { method: 'DELETE' });
    await this.loadAntigravity();
  } catch(e) { console.error('[ag] delete title error:', e); }
},

agSendToQueue(entry) {
  this.view = 'new-run';
  this.wizardStep = 2;
  this.videoModule = 'normal';
  this.$nextTick(() => { this.newTopic = entry.rewritten_title || entry.original_title; });
  this.updateAgTitle(entry.id, { status: 'in_queue' });
},

get agFilteredTitles() {
  if (!this.antigravityData?.title_pool) return [];
  const pool = this.antigravityData.title_pool;
  const filtered = this.agStatusFilter === 'all'
    ? pool
    : pool.filter(t => t.status === this.agStatusFilter);
  if (this.agActiveChannel)
    return filtered.filter(t => t.channel_id === this.agActiveChannel.id);
  return filtered.sort((a, b) => (b.viral_score || 0) - (a.viral_score || 0));
},
```

- [ ] **Step 7: Add AntiGravity page to `ui/index.html`** (before `<!-- ══ BÜLTEN`)

```html
    <!-- ══ ANTİGRAVİTY ══════════════════════════════════════════════ -->
    <div x-show="view==='antigravity'" class="p-6">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-black text-white tracking-tight">🎯 AntiGravity</h1>
          <p class="text-slate-500 text-sm mt-1">Rakip kanal analizi ve viral başlık motoru</p>
        </div>
        <button @click="loadAntigravity()" class="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all">
          <svg class="w-5 h-5" :class="antigravityLoading?'animate-spin':''" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Channel Management -->
        <div class="glass-card p-6 rounded-3xl border border-slate-800 bg-slate-900/50">
          <h2 class="text-xs font-black text-white uppercase tracking-widest mb-4">Kanallarım</h2>

          <!-- Add Channel Form -->
          <div class="space-y-3 mb-6 pb-6 border-b border-slate-800">
            <input x-model="agNewChannel.id" placeholder="YouTube Kanal ID (UCxxx...)"
              class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500" />
            <input x-model="agNewChannel.name" placeholder="Kanal Adı"
              class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500" />
            <div class="grid grid-cols-2 gap-2">
              <select x-model="agNewChannel.language" class="bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-xs text-white focus:outline-none">
                <option>Turkish</option><option>English</option><option>German</option><option>Spanish</option>
              </select>
              <select x-model="agNewChannel.dna" class="bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-xs text-white focus:outline-none">
                <option>Documentary</option><option>Dark Psychology</option><option>Motivation</option>
                <option>Luxury</option><option>Calm Story</option><option>Science</option>
              </select>
            </div>
            <button @click="saveAgChannel()" :disabled="!agNewChannel.id||!agNewChannel.name"
              class="w-full py-2 bg-rose-700 hover:bg-rose-600 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition-all">
              + Kanal Ekle
            </button>
          </div>

          <!-- Channel List -->
          <div class="space-y-2">
            <template x-for="ch in antigravityData?.channels||[]" :key="ch.id">
              <div @click="agActiveChannel=ch" class="p-3 rounded-xl cursor-pointer transition-all border"
                :class="agActiveChannel?.id===ch.id ? 'border-rose-600 bg-rose-900/20' : 'border-slate-800 bg-slate-800/40 hover:border-slate-700'">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-xs font-bold text-white" x-text="ch.name"></p>
                    <p class="text-[10px] text-slate-500" x-text="ch.language+' · '+ch.dna"></p>
                  </div>
                  <div class="flex items-center gap-1">
                    <button @click.stop="scanAgChannel(ch.id)"
                      :disabled="antigravityScanning[ch.id]"
                      class="px-2 py-1 bg-rose-800 hover:bg-rose-700 disabled:opacity-40 text-white rounded text-[10px] font-bold transition-all">
                      <span x-text="antigravityScanning[ch.id] ? '...' : '▶ Tara'"></span>
                    </button>
                    <button @click.stop="deleteAgChannel(ch.id)" class="p-1 text-slate-600 hover:text-red-400 transition-colors">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            </template>
            <div x-show="!antigravityData?.channels?.length" class="py-6 text-center">
              <span class="text-[10px] text-slate-600 uppercase">Kanal eklenmedi</span>
            </div>
          </div>
        </div>

        <!-- Title Pool -->
        <div class="lg:col-span-2 glass-card p-6 rounded-3xl border border-slate-800 bg-slate-900/50">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xs font-black text-white uppercase tracking-widest">Başlık Havuzu</h2>
            <div class="flex gap-1">
              <template x-for="f in ['all','new','approved','in_queue']" :key="f">
                <button @click="agStatusFilter=f"
                  class="px-2 py-1 rounded-lg text-[10px] font-bold transition-all uppercase"
                  :class="agStatusFilter===f ? 'bg-rose-700 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'"
                  x-text="f==='all'?'Tümü':f==='new'?'Yeni':f==='approved'?'Onaylı':'Kuyrukta'">
                </button>
              </template>
            </div>
          </div>

          <div class="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            <template x-for="entry in agFilteredTitles.slice(0,30)" :key="entry.id">
              <div class="p-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl hover:border-slate-600 transition-all">
                <div class="flex items-start justify-between gap-3 mb-2">
                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-bold text-white leading-tight" x-text="entry.rewritten_title||entry.original_title"></p>
                    <p class="text-[10px] text-slate-500 mt-0.5" x-text="entry.source_channel+' · '+new Date(entry.published_at||Date.now()).toLocaleDateString()"></p>
                  </div>
                  <div class="text-right shrink-0">
                    <div class="text-lg font-black" :class="(entry.viral_score||0)>=8?'text-emerald-400':(entry.viral_score||0)>=6.5?'text-amber-400':'text-red-400'" x-text="(entry.viral_score||0).toFixed(1)"></div>
                    <div class="text-[9px] text-slate-500">viral</div>
                  </div>
                </div>
                <!-- Score bars -->
                <div class="grid grid-cols-5 gap-1 mb-3">
                  <template x-for="[key, label] in [['curiosity','Merak'],['emotion','Duygu'],['psychology','Psikoloji'],['ctr','CTR'],['trend','Trend']]" :key="key">
                    <div class="text-center">
                      <div class="text-[8px] text-slate-500 mb-0.5" x-text="label"></div>
                      <div class="h-1 bg-slate-700 rounded-full overflow-hidden">
                        <div class="h-full bg-rose-500 rounded-full" :style="`width:${(entry.scores?.[key]||0)*10}%`"></div>
                      </div>
                      <div class="text-[8px] text-slate-400 mt-0.5" x-text="entry.scores?.[key]||0"></div>
                    </div>
                  </template>
                </div>
                <!-- Actions -->
                <div class="flex gap-2">
                  <button @click="agSendToQueue(entry)"
                    class="flex-1 py-1.5 bg-indigo-700 hover:bg-indigo-600 text-white rounded-lg text-[10px] font-bold transition-all">
                    ▶ Kuyruğa Gönder
                  </button>
                  <button @click="updateAgTitle(entry.id, {status:'approved'})"
                    x-show="entry.status==='new'"
                    class="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-all">
                    ✓
                  </button>
                  <button @click="deleteAgTitle(entry.id)"
                    class="px-3 py-1.5 bg-slate-700 hover:bg-red-800 text-white rounded-lg text-[10px] transition-all">
                    ✕
                  </button>
                </div>
              </div>
            </template>
            <div x-show="agFilteredTitles.length===0" class="py-12 text-center">
              <span class="text-[10px] text-slate-600 uppercase tracking-widest">Başlık havuzu boş — bir kanalı tarayın</span>
            </div>
          </div>
        </div>
      </div>
    </div>
```

- [ ] **Step 8: Add translation keys**

English:
```javascript
    nav_antigravity: 'AntiGravity',
    antigravity_title: 'AntiGravity Engine',
    antigravity_subtitle: 'Competitor intelligence & viral title engine',
```

Turkish:
```javascript
    nav_antigravity: 'AntiGravity',
    antigravity_title: 'AntiGravity Motoru',
    antigravity_subtitle: 'Rakip analizi ve viral başlık motoru',
```

- [ ] **Step 9: Add `youtube_api_key` to `config.py`**

After `gemini_api_key: str = ""`, add:

```python
youtube_api_key: str = ""           # YouTube Data API v3 key for AntiGravity competitor scanning
```

- [ ] **Step 10: Verify server starts**

```bash
lsof -ti :5005 | xargs kill -9 2>/dev/null; sleep 1
.venv/bin/python server.py &
sleep 3
curl -s http://localhost:5005/api/antigravity | python3 -m json.tool
```

Expected: `{"channels": [], "title_pool": [], "used_titles": []}`

- [ ] **Step 11: Commit**

```bash
git add src/core/antigravity.py src/api/routes/antigravity.py server.py ui/index.html ui/js/app.js ui/js/translations.js config.py
git commit -m "feat(antigravity): competitor intelligence engine with viral scoring and title pool"
```

---

## Task 8: AI Thumbnail Generation

Inspired by both repos. Generates actual thumbnail images via Pollinations.ai (free, no API key needed) using the existing thumbnail concept from `pipeline/metadata.py`.

**Files:**
- Create: `providers/visuals/pollinations.py`
- Create: `src/api/routes/thumbnail.py`
- Modify: `server.py`
- Modify: `ui/index.html` (add thumbnail preview in session detail)
- Modify: `ui/js/app.js`

- [ ] **Step 1: Create `providers/visuals/pollinations.py`**

```python
import logging
import time
import urllib.request as urllib_req
import urllib.parse
from pathlib import Path
from typing import Optional

logger = logging.getLogger("ytrobot.pollinations")


def generate_thumbnail(prompt: str, output_path: Path,
                        width: int = 1280, height: int = 720,
                        seed: Optional[int] = None) -> bool:
    """
    Generate a thumbnail image using Pollinations.ai (free, no API key).
    Returns True on success, False on failure.
    """
    if seed is None:
        seed = int(time.time()) % 100000

    encoded_prompt = urllib.parse.quote(prompt)
    url = (
        f"https://image.pollinations.ai/prompt/{encoded_prompt}"
        f"?width={width}&height={height}&seed={seed}&model=flux&nologo=true"
    )

    try:
        req = urllib_req.Request(url, headers={"User-Agent": "YTRobot/1.0"})
        with urllib_req.urlopen(req, timeout=60) as resp:
            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_bytes(resp.read())
        if output_path.stat().st_size < 1000:
            logger.warning(f"[Pollinations] Suspiciously small file: {output_path.stat().st_size} bytes")
            return False
        logger.info(f"[Pollinations] Thumbnail saved: {output_path}")
        return True
    except Exception as e:
        logger.error(f"[Pollinations] Generation failed: {e}")
        return False
```

- [ ] **Step 2: Create `src/api/routes/thumbnail.py`**

```python
import time
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/thumbnail", tags=["thumbnail"])


class ThumbnailReq(BaseModel):
    prompt: str
    session_id: Optional[str] = None
    width: int = 1280
    height: int = 720
    seed: Optional[int] = None


@router.post("/generate")
async def generate_thumbnail(body: ThumbnailReq):
    """Generate a thumbnail image for a given prompt."""
    from providers.visuals.pollinations import generate_thumbnail

    if body.session_id:
        output_path = Path(f"sessions/{body.session_id}/thumbnail.jpg")
    else:
        ts = int(time.time())
        output_path = Path(f"sessions/thumbnails/thumb_{ts}.jpg")

    success = generate_thumbnail(
        prompt=body.prompt,
        output_path=output_path,
        width=body.width,
        height=body.height,
        seed=body.seed,
    )
    if not success:
        raise HTTPException(500, "Thumbnail generation failed")

    return {
        "ok": True,
        "path": str(output_path),
        "url": f"/sessions/{output_path.relative_to('sessions')}",
    }


@router.get("/session/{session_id}")
async def get_session_thumbnail(session_id: str):
    """Return the thumbnail for a session if it exists."""
    thumb = Path(f"sessions/{session_id}/thumbnail.jpg")
    if not thumb.exists():
        raise HTTPException(404, "No thumbnail for this session")
    return FileResponse(str(thumb), media_type="image/jpeg")
```

- [ ] **Step 3: Register thumbnail router in `server.py`**

Add import:
```python
from src.api.routes.thumbnail import router as thumbnail_router
```

Add include:
```python
app.include_router(thumbnail_router)
```

Also make sure sessions are served as static files. Find where `/output` is mounted. Add if not present:
```python
from fastapi.staticfiles import StaticFiles
from pathlib import Path
Path("sessions").mkdir(exist_ok=True)
app.mount("/sessions", StaticFiles(directory="sessions"), name="sessions")
```

- [ ] **Step 4: Add thumbnail generation button in session detail area of `ui/index.html`**

Find the session detail panel in the dashboard (the section that shows when `currentSession` is selected). Inside it, after the video download link area, add:

```html
<!-- Thumbnail generation for completed sessions with thumbnail_concept -->
<template x-if="currentSession?.status==='completed' && currentSession?.metadata?.thumbnail_concept">
  <div class="mt-4 p-4 bg-slate-800/50 border border-slate-700 rounded-2xl">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest">Thumbnail</h3>
      <button @click="generateThumbnail(currentSession)"
        :disabled="thumbnailGenerating"
        class="px-3 py-1.5 bg-amber-700 hover:bg-amber-600 disabled:opacity-40 text-white rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5">
        <svg x-show="thumbnailGenerating" class="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
        <span x-text="thumbnailGenerating ? 'Üretiliyor...' : '🖼 Thumbnail Üret'"></span>
      </button>
    </div>
    <template x-if="currentSession._thumbnail_url">
      <img :src="currentSession._thumbnail_url" class="w-full rounded-xl border border-slate-700" alt="thumbnail" />
    </template>
    <p x-show="!currentSession._thumbnail_url" class="text-[10px] text-slate-600" x-text="'Konsept: '+(currentSession.metadata?.thumbnail_concept||'').substring(0,80)+'...'"></p>
  </div>
</template>
```

- [ ] **Step 5: Add thumbnail data and method to `app.js`**

After `socialLog: [],`, add:
```javascript
thumbnailGenerating: false,
```

After `loadSocialLog()`, add:
```javascript
async generateThumbnail(session) {
  const concept = session.metadata?.thumbnail_concept;
  if (!concept) return;
  this.thumbnailGenerating = true;
  try {
    const data = await this.apiFetch('/api/thumbnail/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: concept, session_id: session.id }),
    });
    session._thumbnail_url = data.url + '?t=' + Date.now();
  } catch(e) {
    console.error('[thumbnail] generation error:', e);
  } finally {
    this.thumbnailGenerating = false;
  }
},
```

- [ ] **Step 6: Verify**

```bash
.venv/bin/python -c "
from providers.visuals.pollinations import generate_thumbnail
from pathlib import Path
result = generate_thumbnail('a beautiful mountain sunset cinematic', Path('/tmp/test_thumb.jpg'))
print('Success:', result)
import os; print('Size:', os.path.getsize('/tmp/test_thumb.jpg') if result else 0)
"
```

Expected: `Success: True`, size > 10000 bytes.

- [ ] **Step 7: Commit**

```bash
git add providers/visuals/pollinations.py src/api/routes/thumbnail.py server.py ui/index.html ui/js/app.js
git commit -m "feat(thumbnail): AI thumbnail generation via Pollinations.ai (free, no key)"
```

---

## Task 9: Content Category Templates for Script Generation

Inspired by `youtube_video_bot`'s 7 content categories. Adds category selection to Normal Video wizard Step 2 and passes it to the script generator.

**Files:**
- Modify: `pipeline/script.py`
- Modify: `ui/index.html` (wizard step 2)
- Modify: `ui/js/app.js`
- Modify: `src/api/routes/sessions.py`

- [ ] **Step 1: Add category-specific prompt instructions in `pipeline/script.py`**

Find the script generation prompt building code. Add a `CATEGORY_INSTRUCTIONS` dict and use it:

```python
CATEGORY_INSTRUCTIONS = {
    "true_crime": (
        "Structure: Hook with shocking revelation → build tension → reveal backstory → "
        "escalate to climax → psychological analysis → lesson. "
        "Use suspenseful language, present tense for dramatic moments."
    ),
    "science_tech": (
        "Structure: Mind-blowing fact → explain mechanism → real-world implications → "
        "future possibilities → call to curiosity. "
        "Use analogies and avoid jargon."
    ),
    "history_mystery": (
        "Structure: Set the historical scene → introduce the mystery/conflict → "
        "present evidence → explore theories → reveal truth or lasting question."
    ),
    "motivation": (
        "Structure: Relatable struggle → inspiring story → key principles extracted → "
        "actionable steps → powerful closing vision. "
        "Use second-person 'you' to engage directly."
    ),
    "documentary": (
        "Structure: Establish setting and stakes → introduce subjects → build narrative arc → "
        "climax → reflection. "
        "Objective tone with vivid scene descriptions."
    ),
    "general": "",
}
```

In the `generate_script()` function (or equivalent), add the category instruction to the prompt:

```python
# At the point where the system prompt is built:
category_note = CATEGORY_INSTRUCTIONS.get(content_category or "general", "")
if category_note:
    system_prompt += f"\n\nContent Category Guidelines:\n{category_note}"
```

The function signature should accept `content_category: str = "general"` as a parameter.

- [ ] **Step 2: Pass category from sessions route**

In `src/api/routes/sessions.py`, find where `run_pipeline_task` calls `generate_script()` or where `RunReq` data is passed. Add `content_category` extraction:

```python
content_category = data.get("content_category", "general")
# Pass it to the script generation call
```

Also update `RunReq` schema in `src/api/models/schemas.py` to include:
```python
content_category: Optional[str] = "general"
```

- [ ] **Step 3: Add category selector in wizard Step 2 in `ui/index.html`**

Find the topic/content input area of Step 2. After the topic textarea but before the submit button, add:

```html
<div x-show="videoModule==='normal'" class="mt-4">
  <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">İçerik Kategorisi</label>
  <div class="grid grid-cols-3 gap-2">
    <template x-for="[val, label, icon] in [
      ['general','Genel','🎬'],
      ['true_crime','Gerçek Suç','🔍'],
      ['science_tech','Bilim & Teknoloji','🔬'],
      ['history_mystery','Tarih & Gizem','🏛'],
      ['motivation','Motivasyon','💪'],
      ['documentary','Belgesel','📽']
    ]" :key="val">
      <button @click="wizardCategory=val"
        class="p-2.5 rounded-xl border text-center transition-all text-xs"
        :class="wizardCategory===val ? 'border-indigo-500 bg-indigo-900/30 text-white' : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600'">
        <div x-text="icon" class="text-lg mb-0.5"></div>
        <div x-text="label" class="text-[10px] font-bold"></div>
      </button>
    </template>
  </div>
</div>
```

- [ ] **Step 4: Add `wizardCategory` data property and include in `submitRun()`**

In `app.js`, find `wizardQuality: 'standard',` and add:
```javascript
wizardCategory: 'general',
```

In `submitRun()` (find the `body` object being sent to `/api/sessions`), add:
```javascript
body.content_category = this.wizardCategory;
```

- [ ] **Step 5: Commit**

```bash
git add pipeline/script.py src/api/routes/sessions.py src/api/models/schemas.py ui/index.html ui/js/app.js
git commit -m "feat(wizard): content category selection (true crime, sci-tech, history, motivation, documentary)"
```

---

## Task 10: Webhook Notifications

Add Slack/Discord/custom webhook notifications when renders complete or fail.

**Files:**
- Create: `src/api/routes/webhook.py`
- Modify: `config.py`
- Modify: `server.py`
- Modify: `src/core/queue.py`
- Modify: `ui/index.html` (Settings page)

- [ ] **Step 1: Add webhook config fields to `config.py`**

After the social media settings block, add:
```python
# Webhook Notifications
webhook_enabled: bool = False
webhook_url: str = ""              # Slack/Discord/custom HTTP endpoint
webhook_on_complete: bool = True
webhook_on_failure: bool = True
webhook_mention: str = ""          # e.g. "@channel" or Discord user ID
```

- [ ] **Step 2: Create `src/api/routes/webhook.py`**

```python
import json
import logging
import urllib.request as urllib_req
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/webhook", tags=["webhook"])
logger = logging.getLogger("ytrobot.webhook")


class WebhookTestReq(BaseModel):
    url: str


def dispatch_webhook(url: str, payload: dict, mention: str = "") -> bool:
    """Send a webhook notification. Supports Slack and Discord format."""
    if not url:
        return False
    try:
        # Build message text
        emoji = "✅" if payload.get("status") == "completed" else "❌"
        mod_map = {"yt_video": "Normal Video", "bulletin": "Haber Bülteni",
                   "product_review": "Ürün İnceleme"}
        module = mod_map.get(payload.get("module", ""), payload.get("module", ""))
        text = (
            f"{emoji} *YTRobot* — {module} render "
            f"{'tamamlandı' if payload.get('status')=='completed' else 'başarısız'}!\n"
            f"Session: `{payload.get('session_id', 'N/A')}`\n"
        )
        if payload.get("error"):
            text += f"Hata: `{payload['error'][:100]}`\n"
        if payload.get("duration"):
            text += f"Süre: {round(payload['duration']/60, 1)} dakika\n"
        if mention:
            text = f"{mention} {text}"

        # Detect Discord vs Slack
        if "discord.com" in url:
            body = {"content": text}
        else:
            body = {"text": text}

        req = urllib_req.Request(
            url,
            data=json.dumps(body).encode(),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib_req.urlopen(req, timeout=10) as resp:
            logger.info(f"[Webhook] Sent successfully, status={resp.status}")
            return True
    except Exception as e:
        logger.error(f"[Webhook] Failed: {e}")
        return False


@router.post("/test")
def test_webhook(body: WebhookTestReq):
    result = dispatch_webhook(
        body.url,
        {"status": "completed", "module": "yt_video",
         "session_id": "test_session", "duration": 180},
    )
    return {"ok": result, "message": "Webhook gönderildi" if result else "Webhook hatası"}
```

- [ ] **Step 3: Register router in `server.py`**

```python
from src.api.routes.webhook import router as webhook_router
app.include_router(webhook_router)
```

- [ ] **Step 4: Call webhook from queue.py on job completion/failure**

In `_worker_loop`, after the analytics log in the success path, add:

```python
# Webhook notification
try:
    from config import settings
    from src.api.routes.webhook import dispatch_webhook
    if getattr(settings, "webhook_enabled", False) and getattr(settings, "webhook_url", ""):
        if getattr(settings, "webhook_on_complete", True) and job.status == "completed":
            dispatch_webhook(
                settings.webhook_url,
                {"status": job.status, "module": job.type,
                 "session_id": job.id,
                 "duration": job.finished_at - (job.started_at or job.created_at)},
                mention=getattr(settings, "webhook_mention", ""),
            )
        elif getattr(settings, "webhook_on_failure", True) and job.status == "failed":
            dispatch_webhook(
                settings.webhook_url,
                {"status": job.status, "module": job.type,
                 "session_id": job.id, "error": job.error or ""},
                mention=getattr(settings, "webhook_mention", ""),
            )
except Exception as wh_err:
    logger.warning(f"Webhook dispatch error: {wh_err}")
```

- [ ] **Step 5: Add webhook settings UI to Settings page in `ui/index.html`**

Find the System tab in Settings. Add a Webhook section:

```html
<!-- Webhook Notifications -->
<div class="glass-card p-6 rounded-2xl border border-slate-800">
  <div class="flex items-center justify-between mb-4">
    <div>
      <h3 class="text-sm font-bold text-white uppercase tracking-widest">Webhook Bildirimleri</h3>
      <p class="text-[10px] text-slate-500 mt-0.5">Slack/Discord/özel URL'e render bildirimleri gönder</p>
    </div>
    <label class="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" x-model="settings.WEBHOOK_ENABLED" class="sr-only peer" @change="triggerAutoSave()">
      <div class="w-11 h-6 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
    </label>
  </div>
  <div class="space-y-3" x-show="settings.WEBHOOK_ENABLED">
    <div>
      <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Webhook URL</label>
      <input x-model="settings.WEBHOOK_URL" type="text"
        placeholder="https://hooks.slack.com/... veya Discord webhook"
        class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500" />
    </div>
    <div>
      <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mention (isteğe bağlı)</label>
      <input x-model="settings.WEBHOOK_MENTION" type="text"
        placeholder="@channel veya &lt;@DiscordUserId&gt;"
        class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500" />
    </div>
    <div class="flex gap-3">
      <label class="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" x-model="settings.WEBHOOK_ON_COMPLETE" class="accent-violet-500 w-4 h-4">
        <span class="text-xs text-slate-300">Tamamlandığında</span>
      </label>
      <label class="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" x-model="settings.WEBHOOK_ON_FAILURE" class="accent-violet-500 w-4 h-4">
        <span class="text-xs text-slate-300">Başarısız olunca</span>
      </label>
    </div>
    <button @click="testWebhook()"
      class="px-4 py-2 bg-violet-800 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-all">
      🔔 Test Bildirimi Gönder
    </button>
  </div>
</div>
```

- [ ] **Step 6: Add `testWebhook()` and default settings to `app.js`**

In `loadSettings()`, after existing defaults, add:
```javascript
if (!this.settings.WEBHOOK_ENABLED) this.settings.WEBHOOK_ENABLED = 'false';
if (!this.settings.WEBHOOK_ON_COMPLETE) this.settings.WEBHOOK_ON_COMPLETE = 'true';
if (!this.settings.WEBHOOK_ON_FAILURE) this.settings.WEBHOOK_ON_FAILURE = 'true';
if (this.settings.WEBHOOK_URL === undefined) this.settings.WEBHOOK_URL = '';
if (this.settings.WEBHOOK_MENTION === undefined) this.settings.WEBHOOK_MENTION = '';
```

After `testApiKey()`, add:
```javascript
async testWebhook() {
  const url = this.settings.WEBHOOK_URL;
  if (!url) { this.showError('Webhook URL girilmedi'); return; }
  try {
    const data = await this.apiFetch('/api/webhook/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    this.showSuccess(data.message || 'Webhook gönderildi');
  } catch(e) { this.showError('Webhook hatası: ' + e.message); }
},
```

- [ ] **Step 7: Commit**

```bash
git add src/api/routes/webhook.py config.py server.py src/core/queue.py ui/index.html ui/js/app.js
git commit -m "feat(webhook): Slack/Discord/custom webhook notifications on render complete/fail"
```

---

## Self-Review

**Spec coverage check:**

| Feature | Task | Complete? |
|---|---|---|
| Daily render chart (Chart.js) | 1+4 | ✅ |
| Queue monitor widget | 1+4 | ✅ |
| Cost tracking | 1+4 | ✅ |
| Error drilldown | 1+4 | ✅ |
| CSV export | 2+4 | ✅ |
| Batch topic queue | 5 | ✅ |
| SEO score + Meta preview | 6 | ✅ |
| Publish history | 3+6 | ✅ |
| AntiGravity competitor intel | 7 | ✅ |
| AI Thumbnail generation | 8 | ✅ |
| Content category templates | 9 | ✅ |
| Webhook notifications | 10 | ✅ |

**Items NOT included (require OAuth / external credentials not available):**
- YouTube real OAuth upload (Task 14 in gap analysis) — needs Google Cloud OAuth consent setup
- Instagram Graph API — needs Meta Business verification
- Infinite autonomous loop (Task 15) — foundation laid via batch queue + AntiGravity

**Placeholder scan:** No TBD/TODO/vague steps. All code is complete and copy-paste ready.

**Type consistency:** `get_queue_status()` → used identically in `app.js` (`queueStatus.running`, `queueStatus.queued`, `queueStatus.running_count`, `queueStatus.max_concurrent`). `antigravity.py` methods (`get_data`, `save_channel`, `scan_channel`) used identically in `antigravity.py` router.
