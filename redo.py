import sys
import re
from pathlib import Path
from pipeline.script import generate_from_topic, save_script, Scene
from pipeline.tts import synthesize_scenes
from pipeline.subtitles import generate_srt, generate_word_timing
from pipeline.composer import compose
from config import settings

def main():
    session = Path("/Users/huseyincoskun/Downloads/Antigravity Proje/YTRobot/output/20260323_111038")
    topic = "trump ve patelin telefon konuşması"
    
    print("Regenerating script with new language rule...")
    scenes = generate_from_topic(topic)
    save_script(scenes, session / "script.json")
    
    print("Synthesizing audio...")
    audio_paths = synthesize_scenes(scenes, session)
    
    print("Generating subtitles...")
    srt_path = generate_srt(audio_paths, scenes, session)
    generate_word_timing(audio_paths, scenes, session, fps=settings.video_fps)
    
    print("Loading existing visuals...")
    def get_num(p):
        m = re.search(r"scene_(\d+)", p.name)
        return int(m.group(1)) if m else 999
        
    all_clips = list((session / "clips").glob("scene_*.*"))
    all_clips.sort(key=get_num)
    visual_paths = all_clips[:len(scenes)]
    print(f"Found {len(visual_paths)} visuals to reuse.")
    
    print("Composing video...")
    output = compose(scenes, audio_paths, visual_paths, srt_path, session)
    print(f"\nDone! Video saved to {output}")

if __name__ == "__main__":
    main()
