import sys
import shutil
from pathlib import Path
from pipeline.script import load_from_file
from pipeline.tts import synthesize_scenes
from pipeline.subtitles import generate_srt, generate_word_timing
from config import settings

def main():
    session = Path("/Users/huseyincoskun/Downloads/Antigravity Proje/YTRobot/output/20260323_111038")
    
    # Force fresh generation by clearing old audio and transcription cache
    if (session / "audio").exists():
        shutil.rmtree(session / "audio")
    for f in session.glob("*_transcription.json"):
        f.unlink()
    if (session / "subtitles.srt").exists():
        (session / "subtitles.srt").unlink()
        
    print("Loading script...")
    scenes = load_from_file(session / "script.json")
    
    print("Synthesizing EXPRESSIVE audio...")
    audio_paths = synthesize_scenes(scenes, session)
    
    print("Generating WHISPER subtitles...")
    srt_path = generate_srt(audio_paths, scenes, session)
    word_timing_path = generate_word_timing(audio_paths, scenes, session, fps=settings.video_fps)
    
    print(f"Test finished! Check {srt_path.name} and {word_timing_path.name}")

if __name__ == "__main__":
    main()
