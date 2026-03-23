export interface VideoSettings {
  /** Ken Burns zoom amount: 0 = disabled, 0.05 = subtle, 0.08 = normal, 0.15 = strong */
  kenBurnsZoom: number;
  /** Ken Burns pan/zoom direction */
  kenBurnsDirection: "center" | "pan-left" | "pan-right" | "random";

  /** Subtitle font family key */
  subtitleFont: "serif" | "sans" | "roboto" | "montserrat" | "oswald" | "bebas" | "inter";
  /** Subtitle font size in px */
  subtitleSize: number;
  /** Subtitle CSS color string */
  subtitleColor: string;
  /** Subtitle background style */
  subtitleBg: "none" | "box" | "pill";
  /** Subtitle text stroke width in px (0 = none) */
  subtitleStroke: number;

  /** Scene fade-in duration in frames (0 = disabled) */
  transitionDuration: number;
  /** Video overlay effect */
  videoEffect: "none" | "vignette" | "warm" | "cool" | "cinematic";

  /** Karaoke word-highlight color (CSS color, e.g. "#FFD700") */
  karaokeColor?: string;
  /** Enable word-by-word karaoke highlighting; when false shows full sentence */
  karaokeEnabled?: boolean;
  /** Subtitle animation preset inspired by pycaps */
  subtitleAnimation?: "hype" | "explosive" | "vibrant" | "minimal" | "none";
}

export interface WordEntry {
  /** Single word text */
  word: string;
  /** Start frame (relative to the start of this scene) */
  startFrame: number;
  /** End frame (relative to the start of this scene) */
  endFrame: number;
}

export interface SubtitleEntry {
  /** Subtitle text */
  text: string;
  /** Start frame (relative to the start of this scene) */
  startFrame: number;
  /** End frame (relative to the start of this scene) */
  endFrame: number;
  /** Word-level timing for karaoke highlight (optional) */
  words?: WordEntry[];
}

export interface SceneData {
  /** HTTP URL to the image or video visual */
  visual: string;
  /** HTTP URL to the audio (mp3) */
  audio: string;
  /** Narration text — displayed as progressive subtitle (fallback when no subtitles) */
  narration: string;
  /** Duration in frames */
  durationInFrames: number;
  /** Whether the visual is a video file (true) or image (false) */
  isVideo: boolean;
  /** SRT-derived subtitle entries with accurate timing (optional) */
  subtitles?: SubtitleEntry[];
}

export interface CompositionProps {
  scenes: SceneData[];
  fps: number;
  width: number;
  height: number;
  settings?: VideoSettings;
}
