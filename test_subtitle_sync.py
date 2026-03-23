#!/usr/bin/env python3
# pyre-ignore-all-errors
"""Subtitle sync diagnostic — runs WITHOUT any API calls.

Creates mock Whisper output, runs the alignment pipeline, generates
SRT + word_timing.json, then converts to Remotion frame data.
Prints a detailed comparison so you can spot timing drift.

Usage:
    .venv/bin/python test_subtitle_sync.py
"""
import json
import sys
from pathlib import Path

# ── Mock data ─────────────────────────────────────────────────────────────────
# Simulates a 2-scene video with Turkish narration.
# Each scene has a known audio duration and we provide a fake Whisper result
# with segment-level timing that we control precisely.

MOCK_SCENES = [
    {
        "narration": "Kediler dünyanın en sevilen hayvanlarından biridir",
        "audio_duration": 5.0,  # 5 seconds
        # Fake Whisper result — 2 segments
        "whisper_result": {
            "text": "Kediler dünyanın en sevilen hayvanlarından biridir",
            "segments": [
                {
                    "start": 0.0,
                    "end": 2.5,
                    "text": "Kediler dünyanın en sevilen",
                },
                {
                    "start": 2.5,
                    "end": 4.8,
                    "text": "hayvanlarından biridir",
                },
            ],
        },
    },
    {
        "narration": "İstanbul sokaklarında binlerce kedi yaşar",
        "audio_duration": 4.0,
        "whisper_result": {
            "text": "İstanbul sokaklarında binlerce kedi yaşar",
            "segments": [
                {
                    "start": 0.0,
                    "end": 2.0,
                    "text": "İstanbul sokaklarında",
                },
                {
                    "start": 2.0,
                    "end": 3.8,
                    "text": "binlerce kedi yaşar",
                },
            ],
        },
    },
]

FPS = 30


# ── Re-use pipeline alignment logic directly ──────────────────────────────────
# Import the core functions from pipeline/subtitles.py

sys.path.insert(0, str(Path(__file__).parent))

from pipeline.subtitles import (  # type: ignore  # pyre-ignore
    _build_anchors,
    _anchor_lookup,
    _align_words,
    _format_timestamp,
    _r4,
)


def test_alignment():
    """Run alignment on mock data and print detailed results."""

    print("=" * 80)
    print("SUBTITLE SYNC TEST — mock data, no API calls")
    print("=" * 80)

    all_srt_entries = []
    all_word_timing = []
    global_offset = 0.0

    for scene_idx, mock in enumerate(MOCK_SCENES):
        narration = mock["narration"]
        duration = mock["audio_duration"]
        whisper_result = mock["whisper_result"]

        print(f"\n{'─' * 80}")
        print(f"SCENE {scene_idx}: \"{narration}\"")
        print(f"  Audio duration: {duration}s | Global offset: {global_offset}s")
        print(f"  Whisper segments:")
        for seg in whisper_result["segments"]:
            print(f"    [{seg['start']:.2f}s – {seg['end']:.2f}s] \"{seg['text']}\"")

        # Step 1: Alignment (same as pipeline/subtitles.py)
        aligned = _align_words(narration, whisper_result)

        print(f"\n  Aligned words (scene-local seconds):")
        for w in aligned:
            print(f"    {w['startSec']:6.3f}s – {w['endSec']:6.3f}s  \"{w['word']}\"")

        # Step 2: Group into 3-word chunks (same as generate_srt)
        chunk_size = 3
        srt_entries_for_scene = []
        for ci in range(0, len(aligned), chunk_size):
            chunk = aligned[ci: ci + chunk_size]
            if not chunk:
                continue
            text = " ".join(w["word"] for w in chunk)
            start_sec = global_offset + chunk[0]["startSec"]
            end_sec = global_offset + chunk[-1]["endSec"]
            if end_sec <= start_sec:
                end_sec = start_sec + 0.5
            srt_entries_for_scene.append({
                "text": text,
                "start_sec": start_sec,
                "end_sec": end_sec,
            })

        print(f"\n  SRT entries (global seconds):")
        for e in srt_entries_for_scene:
            print(f"    {e['start_sec']:6.3f}s – {e['end_sec']:6.3f}s  \"{e['text']}\"")
        all_srt_entries.extend(srt_entries_for_scene)

        # Step 3: Chunk-based word timing (same as generate_word_timing)
        chunks_for_scene = []
        for ci in range(0, len(aligned), chunk_size):
            chunk = aligned[ci: ci + chunk_size]
            if not chunk:
                continue
            chunk_text = " ".join(w["word"] for w in chunk)
            c_start = _r4(global_offset + chunk[0]["startSec"])
            c_end = _r4(global_offset + chunk[-1]["endSec"])
            words = []
            for w in chunk:
                words.append({
                    "word": w["word"],
                    "startSec": _r4(global_offset + w["startSec"]),
                    "endSec": _r4(global_offset + w["endSec"]),
                })
            chunks_for_scene.append({
                "text": chunk_text,
                "startSec": c_start,
                "endSec": c_end,
                "words": words,
            })
        all_word_timing.append({
            "scene": scene_idx,
            "startSec": _r4(global_offset),
            "chunks": chunks_for_scene,
        })

        global_offset += duration

    # ── Step 4: Simulate Remotion composer conversion ─────────────────────────
    # Same logic as remotion_composer.py: _assign_subtitles_to_scene + _assign_words_to_subtitle

    print(f"\n{'=' * 80}")
    print("REMOTION FRAME CONVERSION (fps={})".format(FPS))
    print("=" * 80)

    scene_cursor = 0.0
    for scene_idx, mock in enumerate(MOCK_SCENES):
        duration = mock["audio_duration"]
        scene_end = scene_cursor + duration
        duration_frames = max(round(duration * FPS), FPS)

        print(f"\n{'─' * 80}")
        print(f"SCENE {scene_idx}: cursor={scene_cursor:.2f}s, end={scene_end:.2f}s, frames=0–{duration_frames}")

        # Assign subtitles to this scene
        scene_subs = []
        for entry in all_srt_entries:
            if entry["end_sec"] <= scene_cursor or entry["start_sec"] >= scene_end:
                continue
            sf = max(0, round((entry["start_sec"] - scene_cursor) * FPS))
            ef = min(duration_frames, round((entry["end_sec"] - scene_cursor) * FPS))
            scene_subs.append({
                "text": entry["text"],
                "startFrame": sf,
                "endFrame": ef,
            })

        # Assign words via chunk-based text matching (same as remotion_composer.py)
        scene_wt = next((s for s in all_word_timing if s["scene"] == scene_idx), None)
        if scene_wt and scene_wt.get("chunks"):
            for sub in scene_subs:
                for chunk in scene_wt["chunks"]:
                    if chunk["text"] == sub["text"]:
                        words = []
                        for w in chunk["words"]:
                            wsf = max(0, round((w["startSec"] - scene_cursor) * FPS))
                            wef = round((w["endSec"] - scene_cursor) * FPS)
                            words.append({"word": w["word"], "startFrame": wsf, "endFrame": wef})
                        sub["words"] = words
                        break

        print(f"\n  Subtitle entries (scene-relative frames):")
        for sub in scene_subs:
            print(f"    Frame {sub['startFrame']:4d} – {sub['endFrame']:4d}  \"{sub['text']}\"")
            if sub.get("words"):
                for w in sub["words"]:
                    print(f"      Frame {w['startFrame']:4d} – {w['endFrame']:4d}  \"{w['word']}\"")

        # ── Verify: simulate frame-by-frame playback ──────────────────────────
        print(f"\n  Frame-by-frame karaoke simulation (every 5th frame):")
        for frame in range(0, duration_frames, 5):
            time_in_scene = frame / FPS
            # Find active subtitle
            active_sub = None
            for sub in scene_subs:
                if sub["startFrame"] <= frame < sub["endFrame"]:
                    active_sub = sub
                    break

            if active_sub:
                # Find active word
                active_word = None
                if active_sub.get("words"):
                    for w in active_sub["words"]:
                        if w["startFrame"] <= frame < w["endFrame"]:
                            active_word = w["word"]
                            break

                marker = f"[{active_word}]" if active_word else "[no word]"
                print(f"    frame={frame:4d} ({time_in_scene:5.2f}s) → \"{active_sub['text']}\"  active: {marker}")
            else:
                print(f"    frame={frame:4d} ({time_in_scene:5.2f}s) → (no subtitle)")

        # Check for gaps/overlaps between subtitles
        print(f"\n  Gap/overlap check:")
        issues = []
        for j in range(len(scene_subs) - 1):
            gap = scene_subs[j + 1]["startFrame"] - scene_subs[j]["endFrame"]
            if gap > 3:
                issues.append(f"    GAP: {gap} frames ({gap/FPS:.2f}s) between sub {j} end and sub {j+1} start")
            elif gap < 0:
                issues.append(f"    OVERLAP: {-gap} frames between sub {j} and sub {j+1}")

        # Check for word gaps within subtitles
        for sub in scene_subs:
            if sub.get("words") and len(sub["words"]) > 1:
                for j in range(len(sub["words"]) - 1):
                    wgap = sub["words"][j + 1]["startFrame"] - sub["words"][j]["endFrame"]
                    if wgap > 5:
                        issues.append(f"    WORD GAP: {wgap} frames ({wgap/FPS:.2f}s) between \"{sub['words'][j]['word']}\" and \"{sub['words'][j+1]['word']}\" in \"{sub['text']}\"")
                    elif wgap < 0:
                        issues.append(f"    WORD OVERLAP: {-wgap} frames between \"{sub['words'][j]['word']}\" and \"{sub['words'][j+1]['word']}\"")

        if issues:
            for iss in issues:
                print(iss)
        else:
            print("    ✓ No gaps or overlaps detected")

        scene_cursor += duration

    print(f"\n{'=' * 80}")
    print("TEST COMPLETE")
    print("=" * 80)


if __name__ == "__main__":
    test_alignment()
