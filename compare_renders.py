import sys
import shutil
from pathlib import Path
from pipeline.script import load_from_file  # type: ignore

def main():
    session = Path("/Users/huseyincoskun/Downloads/Antigravity Proje/YTRobot/output/20260323_111038")
    scenes = load_from_file(session / "script.json")
    audio_paths = sorted((session / "audio").glob("*.mp3"))
    
    import re
    def get_num(p):
        m = re.search(r"scene_(\d+)", p.name)
        return int(m.group(1)) if m else 999
    visual_paths = sorted(list((session / "clips").glob("scene_*.*")), key=get_num)[0:len(scenes)]  # type: ignore
    srt_path = session / "subtitles.srt"
    
    final_output = session / "final_output.mp4"
    
    # Render with MoviePy
    print("Rendering with MoviePy...")
    if final_output.exists():
        final_output.unlink()
    
    from pipeline.composer import _compose_moviepy  # type: ignore
    _compose_moviepy(scenes, audio_paths, visual_paths, srt_path, session)
    
    if final_output.exists():
        shutil.move(str(final_output), str(session / "moviepy_output.mp4"))
        print(f"MoviePy output saved to {session / 'moviepy_output.mp4'}")
        
    # Render with Remotion
    print("Rendering with Remotion... (This may take 50 mins)")
    if final_output.exists():
        final_output.unlink()
    
    from providers.composer.remotion_composer import compose_remotion  # type: ignore
    compose_remotion(scenes, audio_paths, visual_paths, srt_path, session)
    
    if final_output.exists():
        shutil.move(str(final_output), str(session / "remotion_output.mp4"))
        print(f"Remotion output saved to {session / 'remotion_output.mp4'}")
        
    print("All renders complete!")

if __name__ == "__main__":
    main()
