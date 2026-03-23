import sys
import shutil
import re
from pathlib import Path

from pipeline.script import load_from_file  # type: ignore
from pipeline.tts import synthesize_scenes  # type: ignore
from pipeline.subtitles import generate_srt, generate_word_timing  # type: ignore
from config import settings

def main():
    session = Path("/Users/huseyincoskun/Downloads/Antigravity Proje/YTRobot/output/20260323_024018")
    
    print("--- 1. CLEANING OLD ASSETS ---")
    if (session / "audio").exists():
        shutil.rmtree(session / "audio")
    for f in session.glob("*_transcription.json"):
        f.unlink()
    if (session / "subtitles.srt").exists():
        (session / "subtitles.srt").unlink()
        
    print("--- 2. LOADING SCRIPT ---")
    scenes = load_from_file(session / "script.json")
    
    print("--- 3. RE-GENERATING EXPRESSIVE AUDIO ---")
    audio_paths = synthesize_scenes(scenes, session)
    
    print("--- 4. RE-GENERATING WHISPER SUBTITLES ---")
    srt_path = generate_srt(audio_paths, scenes, session)
    generate_word_timing(audio_paths, scenes, session, fps=settings.video_fps)
    
    print("--- 5. PREPARING VISUALS ---")
    def get_num(p):
        m = re.search(r"scene_(\d+)", p.name)
        return int(m.group(1)) if m else 999
    visual_paths = sorted(list((session / "clips").glob("scene_*.*")), key=get_num)[:len(scenes)]  # type: ignore
    
    final_output = session / "final_output.mp4"
    if final_output.exists():
        final_output.unlink()
        
    print("--- 6. RENDERING MOVIEPY + PYCAPS ---")
    settings.subtitle_provider = "pycaps"
    from pipeline.composer import _compose_moviepy  # type: ignore
    _compose_moviepy(scenes, audio_paths, visual_paths, srt_path, session)
    
    if final_output.exists():
        shutil.move(str(final_output), str(session / "moviepy_pycaps_output.mp4"))
        print(f"-> Saved {session / 'moviepy_pycaps_output.mp4'}")
        
    print("--- 7. RENDERING REMOTION --- (Takes ~50 mins)")
    from providers.composer.remotion_composer import compose_remotion  # type: ignore
    compose_remotion(scenes, audio_paths, visual_paths, srt_path, session)
    
    if final_output.exists():
        shutil.move(str(final_output), str(session / "remotion_output.mp4"))
        print(f"-> Saved {session / 'remotion_output.mp4'}")
        
    print("All renders complete!")

if __name__ == "__main__":
    main()
