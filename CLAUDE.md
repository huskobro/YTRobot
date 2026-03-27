# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

YTRobot is a full-stack YouTube video automation platform with a Python/FastAPI backend and a single-page Alpine.js frontend. It generates long-form videos automatically: given a topic, it produces a fully composed video with AI script, voiceover, visuals, animated subtitles, and optional YouTube upload.

### Three Video Modules
1. **Normal Video (YT Video)** — Any topic, long-form
2. **News Bulletin** — Auto-generated from RSS sources
3. **Product Review** — Product showcase/review video

## Commands

```bash
# Activate virtual environment (REQUIRED — Python 3.14)
source .venv/bin/activate

# Start web server (port 5005)
python server.py
# UI at http://localhost:5005

# CLI: Run full pipeline
python main.py --topic "Your topic"

# CLI: Run with manual script
python main.py --script path/to/script.txt

# CLI: Run single stage
python main.py --stage tts --input script.txt
python main.py --stage visuals --input script.txt
python main.py --stage compose --input output/session_id/
```

## Architecture

### Directory Structure

```
YTRobot/
├── server.py                 # FastAPI + Uvicorn, port 5005
├── config.py                 # Pydantic Settings from .env (~160 fields)
├── main.py                   # CLI entry point
│
├── pipeline/                 # Core video pipeline
│   ├── script.py             # AI script generation (LLM)
│   ├── tts.py                # TTS orchestration + fallback chain
│   ├── visuals/              # Visual content
│   │   ├── core.py           # Visual orchestration
│   │   └── broll.py          # B-roll fetching
│   ├── subtitles.py          # Whisper alignment + word timing
│   ├── composer.py           # MoviePy video assembly
│   ├── news_bulletin.py      # Bulletin-specific pipeline
│   ├── news_fetcher.py       # RSS feed parser
│   ├── metadata.py           # Video metadata generation
│   ├── social.py             # Social media posting
│   └── resilience.py         # Error recovery
│
├── providers/
│   ├── tts/                  # 7 TTS providers
│   │   ├── base.py           # Base interface + clean_for_tts + trim_silence
│   │   ├── edge_tts.py       # Microsoft Edge (free, no key)
│   │   ├── qwen3.py          # Local AI (no key, needs GPU/MPS)
│   │   ├── speshaudio.py     # SpeshAudio API
│   │   ├── elevenlabs.py     # ElevenLabs API
│   │   ├── openai_tts.py     # OpenAI TTS API
│   │   └── dubvoice.py       # DubVoice API
│   ├── visuals/              # 4 visual providers
│   │   ├── base.py           # Base interface
│   │   ├── pexels.py         # Pexels stock video (free with key)
│   │   ├── zimage.py         # Z-Image AI (KIE.AI key)
│   │   ├── dalle.py          # DALL-E 3 (OpenAI key)
│   │   └── pollinations.py   # Pollinations.ai (free, no key)
│   └── composer/
│       └── remotion_composer.py  # Remotion video composition
│
├── src/
│   ├── api/routes/           # 21 FastAPI routers
│   │   ├── sessions.py       # /api/sessions — CRUD, bulk ops
│   │   ├── system.py         # /api/settings, /api/voices, /api/ai/assist, /api/tts/preview
│   │   ├── youtube.py        # /api/youtube — OAuth, upload, playlists
│   │   ├── youtube_analytics.py  # /api/youtube/analytics
│   │   ├── channels.py       # /api/channels — multi-channel mgmt
│   │   ├── bulletin.py       # /api/bulletin — news module
│   │   ├── product.py        # /api/product — review module
│   │   ├── scheduler.py      # /api/scheduler — timed uploads
│   │   ├── calendar.py       # /api/calendar — content calendar
│   │   ├── playlists.py      # /api/playlists — playlist CRUD + AI meta
│   │   ├── ab_testing.py     # /api/ab-testing — variant testing
│   │   ├── video_templates.py # /api/video-templates
│   │   ├── competitor.py     # /api/competitor — channel intel
│   │   ├── seo.py            # /api/seo — SEO scoring
│   │   ├── social.py         # /api/social — metadata gen
│   │   ├── stats.py          # /api/stats — analytics data
│   │   ├── notifications.py  # /api/notifications — in-app
│   │   ├── webhook.py        # /api/webhook — Slack/Discord
│   │   ├── audit.py          # /api/audit — change logs
│   │   ├── secure.py         # /api/secure — encrypted key store
│   │   └── thumbnail.py      # /api/thumbnail
│   └── core/                 # 26 business logic modules
│       ├── pipeline_runner.py    # Pipeline execution
│       ├── queue.py              # Job queue (2 workers, maxsize 100)
│       ├── channel_hub.py        # Multi-channel management
│       ├── youtube_auth.py       # YouTube OAuth flow
│       ├── youtube_analytics.py  # YT analytics fetcher
│       ├── scheduler.py          # Background scheduler (30s loop)
│       ├── analytics.py          # Pipeline analytics
│       ├── competitor_intel.py   # Competitor scanning
│       ├── content_calendar.py   # Calendar data
│       ├── playlist_manager.py   # Playlist ops + YT sync
│       ├── ab_testing.py         # A/B test logic
│       ├── video_templates.py    # Template storage
│       ├── seo_optimizer.py      # SEO scoring
│       ├── notifications.py      # Notification service
│       ├── encryption.py         # Fernet encryption
│       ├── audit_log.py          # Audit logging
│       ├── cache.py              # Asset caching
│       ├── gpu_detect.py         # GPU detection
│       ├── progress.py           # WebSocket progress
│       └── ...
│
├── ui/                       # Single-page Alpine.js frontend
│   ├── index.html            # ~8300 lines, all views in one file
│   ├── js/
│   │   ├── app.js            # ~3800 lines, Alpine.js app
│   │   └── translations.js   # TR/EN i18n strings
│   ├── css/
│   │   └── style.css         # Tailwind + custom CSS
│   └── samples/              # Static preview assets
│       ├── audio/            # TTS sample MP3s
│       └── effects/          # Video effect preview JPGs
│
├── remotion/                 # Remotion video composer (Node.js)
│   ├── src/
│   │   ├── Root.tsx
│   │   ├── Scene.tsx         # Main scene renderer
│   │   └── Composition.tsx
│   └── package.json
│
├── output/                   # Generated videos (session_id/)
├── channels/                 # Per-channel config & data
└── .env                      # API keys & settings (never commit)
```

## UI Architecture

### Frontend Stack
- **Alpine.js** — Reactive state management (x-data, x-show, x-model)
- **Tailwind CSS** — Utility-first styling (dark mode via class strategy)
- **Chart.js** — Analytics charts
- **Single HTML file** — All views controlled by `view` state variable

### Views (controlled by `view` state)
| View | Description |
|------|-------------|
| `onboarding` | First-run setup wizard (7 steps) |
| `dashboard` | Main dashboard with stats |
| `new-run` | Video creation wizard (4 steps) |
| `gallery` | Video library with search/filter |
| `session` | Individual video detail |
| `channels` | Multi-channel management |
| `content-planning` | Tabs: Calendar, Playlists, Templates, A/B Testing, Scheduler |
| `analytics` | Tabs: Pipeline, YouTube, Competitor |
| `settings` | Tabs: TTS, Visuals, AI, System, Secure Storage, Social Media |
| `api-keys` | API key management |
| `bulletin` | News bulletin (also accessible from wizard) |
| `product-review` | Product review (also accessible from wizard) |

### Sidebar Structure (8 items, grouped)
```
── Ana İşlemler ──
  ✨ Yeni Video (CTA button)
  📊 Dashboard
  🖼️ Gallery
── İçerik ──
  📡 Kanallar
  📅 İçerik Planlama (5 sub-tabs)
── Analiz ──
  📈 Analytics (3 sub-tabs)
── Sistem ──
  ⚙️ Ayarlar (6 sub-tabs)
```

### Cmd+K Command Palette
~41 commands with tag-based search. Commands cover navigation to all views/sub-tabs, settings deep links, and actions (YouTube connect, theme toggle, language switch, etc.).

## Key Technical Details

### TTS
- **Fallback chain**: Primary provider → next → edge (always available)
- `clean_for_tts()` strips apostrophes; `trim_silence()` uses ffmpeg
- Module-specific overrides: `yt_tts_*`, `bulletin_tts_*`, `pr_tts_*`
- Edge TTS: free, 300+ voices, no API key
- Qwen3: local AI, uses MPS on Mac (flash_attn → sdpa fallback)

### Visuals
- Pexels: free stock video clips (API key required)
- Z-Image: AI image gen via KIE.AI
- DALL-E 3: OpenAI image gen
- Pollinations: free AI images, no key

### Composers
- **MoviePy**: Default, uses ffmpeg, h264_videotoolbox GPU encoding on Mac
- **Remotion**: Advanced effects, Ken Burns, animated subtitles, karaoke
  - Assets served via local HTTP (no file:// URLs)
  - Subtitle animation presets: hype, explosive, vibrant, minimal, none
  - Google Fonts via `@remotion/google-fonts`

### Subtitles
- Whisper-based alignment with segment-anchored sync
- Word-level timing for karaoke effects
- `word_timing.json` format: chunked per scene

### YouTube Integration
- OAuth 2.0 flow: `/api/youtube/auth-url` → Google consent → `/api/youtube/callback`
- Config: `YT_OAUTH_CLIENT_ID`, `YT_OAUTH_CLIENT_SECRET` in .env
- Upload with thumbnail, playlist assignment, scheduling

### Session Output
- Path: `output/YYYYMMDD_HHMMSS/`
- Contains: `audio/`, `clips/`, `subtitles.srt`, `word_timing.json`, `final_output.mp4`

## Configuration (.env)

Key provider settings:
```env
# TTS: edge | openai | elevenlabs | speshaudio | qwen3 | dubvoice
TTS_PROVIDER=edge

# Visuals: pexels | zimage | dalle | pollinations
VISUALS_PROVIDER=pexels

# Composer: moviepy | remotion
COMPOSER_PROVIDER=moviepy

# AI/LLM (script generation)
KIEAI_API_KEY=...        # KIE.AI (Gemini 2.5 Flash) — preferred
OPENAI_API_KEY=...       # Fallback

# YouTube OAuth
YT_OAUTH_CLIENT_ID=...
YT_OAUTH_CLIENT_SECRET=...
```

## Python Environment

- Virtual env: `.venv/` in project root
- Run as: `.venv/bin/python` or `source .venv/bin/activate`
- Python version: 3.14
- MoviePy API: `from moviepy import ...` (not `moviepy.editor`)
