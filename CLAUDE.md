# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

YTRobot is a Python pipeline that generates long-form YouTube videos automatically. Given a topic or script, it produces a fully composed video with voiceover, subtitles, and visual content (stock videos/images or AI-generated images).

## Core Pipeline

```
Script → TTS (audio) → Visuals → Subtitles → Video Composition
```

Each stage is independent and produces artifacts consumed by the next stage.

## Commands

```bash
# Install dependencies
pip install -r requirements.txt

# Run full pipeline
python main.py --topic "Your topic here"

# Run with manual script file
python main.py --script path/to/script.txt

# Run a single pipeline stage (for debugging)
python main.py --stage tts --input script.txt
python main.py --stage visuals --input script.txt
python main.py --stage compose --input output/session_id/
```

## Architecture

### Directory Structure

```
YTRobot/
├── main.py               # CLI entry point, orchestrates the pipeline
├── config.py             # Loads API keys and settings from .env
├── pipeline/
│   ├── script.py         # Script generation: AI (LLM) or manual input
│   ├── tts.py            # Text-to-speech: delegates to active provider
│   ├── visuals.py        # Visual fetching/generation: delegates to active provider
│   ├── subtitles.py      # Generates SRT/ASS subtitle files from script + audio timing
│   └── composer.py       # FFmpeg/MoviePy: combines audio, visuals, subtitles → final .mp4
├── providers/
│   ├── tts/              # One file per TTS provider (elevenlabs.py, openai_tts.py, etc.)
│   └── visuals/          # One file per visual provider (pexels.py, dalle.py, etc.)
├── output/               # Generated artifacts per session (session_id/audio/, session_id/clips/, etc.)
└── .env                  # API keys (never commit this)
```

### Key Design Decisions

- **Pluggable providers**: `tts.py` and `visuals.py` load the active provider from config. Adding a new TTS or visual provider means creating one file in `providers/` and registering it in config.
- **Session-based output**: Each run creates a timestamped session folder under `output/` so runs don't overwrite each other.
- **Staged execution**: Each pipeline stage can run independently for easier debugging and iteration.

### Pipeline Stages

1. **Script** (`pipeline/script.py`): If AI mode, calls an LLM API to write a structured script (scene-by-scene with narration text). If manual, parses a plain text or JSON script file.
2. **TTS** (`pipeline/tts.py`): Converts narration text to audio. Output is one audio file per scene or a single combined audio file.
3. **Visuals** (`pipeline/visuals.py`): For each scene, fetches or generates a video clip or image using the scene description as a search query or prompt.
4. **Subtitles** (`pipeline/subtitles.py`): Aligns script text to audio timestamps to produce an SRT file. May use Whisper for forced alignment.
5. **Composer** (`pipeline/composer.py`): Assembles all scenes — overlays audio on visuals, burns in subtitles, applies transitions — and exports the final `.mp4`.

## Technology Stack

- **Video composition**: `moviepy` + `ffmpeg` (ffmpeg must be installed system-wide)
- **LLM for scripts**: OpenAI (`openai` SDK) or Anthropic (`anthropic` SDK)
- **TTS providers**: ElevenLabs, OpenAI TTS, Google Cloud TTS (configured via `.env`)
- **Visual providers**: Pexels API, Pixabay API, DALL-E (OpenAI), Stable Diffusion
- **Subtitle alignment**: `openai-whisper` for transcription/alignment
- **Config**: `python-dotenv` for `.env` loading, `pydantic` for settings validation

## Configuration

All secrets and provider selection live in `.env`:

```env
# LLM
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...

# TTS provider: "elevenlabs" | "openai" | "google"
TTS_PROVIDER=elevenlabs
ELEVENLABS_API_KEY=...

# Visuals provider: "pexels" | "pixabay" | "dalle"
VISUALS_PROVIDER=pexels
PEXELS_API_KEY=...

# Output settings
OUTPUT_DIR=output
VIDEO_RESOLUTION=1920x1080
```
