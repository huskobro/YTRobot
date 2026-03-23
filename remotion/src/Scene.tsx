import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  Video,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadRoboto } from "@remotion/google-fonts/Roboto";
import { loadFont as loadMontserrat } from "@remotion/google-fonts/Montserrat";
import { loadFont as loadOswald } from "@remotion/google-fonts/Oswald";
import { loadFont as loadBebasNeue } from "@remotion/google-fonts/BebasNeue";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { SceneData, SubtitleEntry, VideoSettings, WordEntry } from "./types";

// Load Google Fonts with only 'normal' style to avoid hundreds of network requests
// (v4.0.290 loadFont() takes a style key: 'normal' | 'italic')
const robotoFont = loadRoboto("normal");
const montserratFont = loadMontserrat("normal");
const oswaldFont = loadOswald("normal");
const bebasFont = loadBebasNeue("normal");
const interFont = loadInter("normal");

const FONT_MAP: Record<string, string> = {
  serif: '"Georgia", "Times New Roman", serif',
  sans: "Arial, Helvetica, sans-serif",
  roboto: robotoFont.fontFamily,
  montserrat: montserratFont.fontFamily,
  oswald: oswaldFont.fontFamily,
  bebas: bebasFont.fontFamily,
  inter: interFont.fontFamily,
};

const DEFAULT_SETTINGS: VideoSettings = {
  kenBurnsZoom: 0.08,
  kenBurnsDirection: "center",
  subtitleFont: "bebas",
  subtitleSize: 68,
  subtitleColor: "#ffffff",
  subtitleBg: "none",
  subtitleStroke: 2,
  transitionDuration: 10,
  videoEffect: "none",
  karaokeColor: "#FFD700",
  karaokeEnabled: true,
  subtitleAnimation: "hype",
};

function getTransformOrigin(
  direction: VideoSettings["kenBurnsDirection"],
  sceneIndex: number
): string {
  if (direction === "center") return "center center";
  if (direction === "pan-left") return "left center";
  if (direction === "pan-right") return "right center";
  const corners = ["top left", "top right", "bottom right", "bottom left"];
  return corners[sceneIndex % corners.length];
}

interface VideoSceneProps extends SceneData {
  sceneIndex?: number;
  settings?: VideoSettings;
}

export const VideoScene: React.FC<VideoSceneProps> = ({
  visual,
  audio,
  narration,
  isVideo,
  subtitles,
  sceneIndex = 0,
  settings,
}) => {
  const s = { ...DEFAULT_SETTINGS, ...settings };
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();

  // ── Ken Burns ────────────────────────────────────────────────────────────────
  const scale =
    s.kenBurnsZoom > 0
      ? interpolate(frame, [0, durationInFrames], [1.0, 1.0 + s.kenBurnsZoom], {
          extrapolateRight: "clamp",
        })
      : 1.0;
  const transformOrigin = getTransformOrigin(s.kenBurnsDirection, sceneIndex);

  // ── Subtitle text & word-level karaoke ──────────────────────────────────
  let currentText: string;
  let activeSub: SubtitleEntry | undefined;
  let activeWords: WordEntry[] | undefined;
  if (subtitles && subtitles.length > 0) {
    activeSub = subtitles.find(
      (sub: SubtitleEntry) => frame >= sub.startFrame && frame < sub.endFrame
    );
    currentText = activeSub?.text ?? "";
    activeWords = activeSub?.words;
  } else {
    const sentences = narration
      .split(/(?<=[.!?…])\s+/)
      .map((sub) => sub.trim())
      .filter(Boolean);
    const sentenceIdx = Math.min(
      Math.floor(
        interpolate(frame, [0, durationInFrames], [0, sentences.length], {
          extrapolateRight: "clamp",
        })
      ),
      sentences.length - 1
    );
    currentText = sentences[sentenceIdx] ?? narration;
    activeWords = undefined;
  }

  // ── Pycaps-inspired karaoke animation presets ───────────────────────────
  const karaokeColor = s.karaokeColor ?? "#FFD700";
  const anim = s.subtitleAnimation ?? "hype";

  // Safe interpolate: guards against zero-range inputs that crash Remotion
  const lerp = (f: number, inRange: [number, number], outRange: [number, number]) => {
    if (inRange[0] >= inRange[1]) return outRange[1];
    return interpolate(f, inRange, outRange, { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  };

  // Overshoot helper: scale ramps to (1 + overshoot) then settles to 1.0
  const zoomIn = (
    f: number, start: number, dur: number,
    initScale: number, overshoot: number, peakFrac: number
  ) => {
    if (dur <= 0) return 1.0;
    const peak = start + Math.max(1, Math.floor(dur * peakFrac));
    const end = start + dur;
    if (f < peak) return lerp(f, [start, peak], [initScale, 1 + overshoot]);
    return lerp(f, [peak, end], [1 + overshoot, 1.0]);
  };

  // Pop-in: dips below 1.0 then bounces up (pycaps PopInPrimitive)
  const popIn = (
    f: number, start: number, dur: number,
    initScale: number, minScale: number, minAt: number, overshoot: number, peakAt: number
  ) => {
    if (dur <= 0) return 1.0;
    const dipFrame = start + Math.max(1, Math.floor(dur * minAt));
    const peakFrame = start + Math.max(2, Math.floor(dur * peakAt));
    const end = start + dur;
    if (f < dipFrame) return lerp(f, [start, dipFrame], [initScale, minScale]);
    if (f < peakFrame) return lerp(f, [dipFrame, peakFrame], [minScale, 1 + overshoot]);
    return lerp(f, [peakFrame, end], [1 + overshoot, 1.0]);
  };

  const renderKaraokeWords = (words: WordEntry[], sub: SubtitleEntry) => {
    const subDur = sub.endFrame - sub.startFrame;
    const introFrames = Math.min(5, Math.floor(subDur * 0.12));

    // ── Segment-level entrance animation ──────────────────────────────
    let groupTransform = "";
    let groupOpacity = 1.0;

    if (anim === "hype" || anim === "vibrant" || anim === "minimal") {
      groupOpacity = lerp(frame, [sub.startFrame, sub.startFrame + introFrames], [0, 1]);
    }

    if (anim === "explosive") {
      const slideX = lerp(frame, [sub.startFrame, sub.startFrame + introFrames], [-60, 0]);
      groupOpacity = lerp(frame, [sub.startFrame, sub.startFrame + introFrames], [0, 1]);
      groupTransform = `translateX(${slideX}px)`;
    }

    if (anim === "hype") {
      const slideY = lerp(frame, [sub.startFrame, sub.startFrame + introFrames], [12, 0]);
      groupTransform = `translateY(${slideY}px)`;
    }

    return (
      <span style={{ transform: groupTransform, opacity: groupOpacity, display: "inline" }}>
        {words.map((w, idx) => {
          const isActive = frame >= w.startFrame && frame < w.endFrame;
          const isPast   = frame >= w.endFrame;
          const wDur     = Math.max(1, w.endFrame - w.startFrame);

          // ── Word-level scale animation ──────────────────────────────
          let wordScale = 1.0;
          const animDur = Math.min(5, wDur);

          if (isActive) {
            if (anim === "hype") {
              // zoom_in: 0.8 → 1.05 → 1.0 (pycaps hype: init 0.8, overshoot 0.05, peak 0.7)
              wordScale = zoomIn(frame, w.startFrame, animDur, 0.8, 0.05, 0.7);
            } else if (anim === "explosive") {
              // zoom_in: 0.5 → 1.1 → 1.0 (pycaps explosive: init 0.5, overshoot 0.1, peak 0.7)
              wordScale = zoomIn(frame, w.startFrame, animDur, 0.5, 0.1, 0.7);
            } else if (anim === "vibrant") {
              // pop_in: 0.95 → 0.9 → 1.05 → 1.0 (pycaps vibrant)
              wordScale = popIn(frame, w.startFrame, animDur, 0.95, 0.9, 0.5, 0.05, 0.8);
            }
            // "minimal" and "none": wordScale stays 1.0
          }

          // ── Word colors per preset ──────────────────────────────────
          let color = s.subtitleColor;
          let opacity = 1.0;
          let textShadow = "0 2px 8px rgba(0,0,0,0.9)";

          if (anim === "hype") {
            // hype: gray → yellow (active) → white (past)  (pycaps CSS)
            color = isActive ? karaokeColor : isPast ? "#FFFFFF" : "#DDDDDD";
            opacity = isActive ? 1.0 : isPast ? 0.9 : 0.45;
            textShadow = isActive
              ? `-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 0 16px ${karaokeColor}99`
              : "-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 3px 3px 5px rgba(0,0,0,0.5)";
          } else if (anim === "explosive") {
            // explosive: gold default → white+fire glow (active) → gold (past)
            color = isActive ? "#FFFFFF" : karaokeColor;
            opacity = isActive ? 1.0 : isPast ? 0.9 : 0.5;
            textShadow = isActive
              ? `0 0 4px #FFAA00, 0 0 8px #FF8800, 0 0 12px #FF0000, 0 0 20px #FF000088, 1px 1px 1px #000`
              : `0 0 3px #FF880066, 0 0 6px #FF880044, 1px 1px 1px #000`;
          } else if (anim === "vibrant") {
            // vibrant: subtle color change, less glow
            color = isActive ? karaokeColor : isPast ? s.subtitleColor : s.subtitleColor;
            opacity = isActive ? 1.0 : isPast ? 0.85 : 0.4;
            textShadow = isActive
              ? `0 0 18px ${karaokeColor}88, 0 2px 8px rgba(0,0,0,0.9)`
              : "0 2px 8px rgba(0,0,0,0.9)";
          } else if (anim === "minimal") {
            // minimal: just color swap, no fancy effects
            color = isActive ? karaokeColor : s.subtitleColor;
            opacity = isActive ? 1.0 : isPast ? 0.8 : 0.5;
          } else {
            // none: all words same color/opacity
            color = s.subtitleColor;
            opacity = 1.0;
          }

          return (
            <span
              key={idx}
              style={{
                color,
                opacity,
                transform: `scale(${wordScale})`,
                display: "inline-block",
                marginRight: "0.25em",
                textShadow,
                fontWeight: isActive ? 900 : undefined,
                letterSpacing: isActive ? "0.03em" : undefined,
              }}
            >
              {w.word}
            </span>
          );
        })}
      </span>
    );
  };

  // … (rest of scene component below) 

  // ── Subtitle fade out only (no fade-in — the per-chunk entrance animation
  //    already handles smooth appearance; a global fade-in hides the first
  //    words at scene start, making them appear "rushed").
  const subFadeOutDur = Math.min(12, Math.floor(durationInFrames * 0.08));
  const subOpacity = lerp(
    frame,
    [Math.max(1, durationInFrames - subFadeOutDur), durationInFrames],
    [1, 0]
  );

  // ── Scene fade-in ─────────────────────────────────────────────────────────
  const fadeDur = Math.max(0, s.transitionDuration);
  const fadeIn =
    fadeDur > 0
      ? interpolate(frame, [0, fadeDur], [0, 1], { extrapolateRight: "clamp" })
      : 1;

  // ── Font & subtitle styles ─────────────────────────────────────────────────
  const fontFamily = FONT_MAP[s.subtitleFont] ?? FONT_MAP.serif;
  const isBebasOrOswald = s.subtitleFont === "bebas" || s.subtitleFont === "oswald";

  // Subtitle background container style
  const subtitleContainerStyle: React.CSSProperties =
    s.subtitleBg === "box"
      ? {
          backgroundColor: "rgba(0,0,0,0.65)",
          padding: "10px 20px",
          borderRadius: 4,
          display: "inline-block",
          maxWidth: "92%",
        }
      : s.subtitleBg === "pill"
      ? {
          backgroundColor: "rgba(0,0,0,0.65)",
          padding: "10px 28px",
          borderRadius: 40,
          display: "inline-block",
          maxWidth: "92%",
        }
      : { width: "92%", textAlign: "center" };

  const subtitleTextStyle: React.CSSProperties = {
    color: s.subtitleColor,
    fontSize: s.subtitleSize,
    fontFamily,
    textAlign: "center",
    lineHeight: isBebasOrOswald ? 1.2 : 1.5,
    textShadow:
      s.subtitleBg === "none"
        ? "0 2px 16px rgba(0,0,0,0.95), 0 0 60px rgba(0,0,0,0.7)"
        : "none",
    WebkitTextStroke:
      s.subtitleStroke > 0 ? `${s.subtitleStroke}px rgba(0,0,0,0.9)` : undefined,
    letterSpacing: isBebasOrOswald ? "0.05em" : undefined,
    margin: 0,
  };

  // ── Video effect overlay ───────────────────────────────────────────────────
  const cinemaBarHeight = s.videoEffect === "cinematic" ? Math.round(height * 0.105) : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Visual with Ken Burns */}
      <AbsoluteFill style={{ transform: `scale(${scale})`, transformOrigin }}>
        {isVideo ? (
          <Video src={visual} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <Img src={visual} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        )}
      </AbsoluteFill>

      {/* Video effect overlays */}
      {s.videoEffect === "vignette" && (
        <AbsoluteFill
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.75) 100%)",
            pointerEvents: "none",
          }}
        />
      )}
      {s.videoEffect === "warm" && (
        <AbsoluteFill
          style={{
            backgroundColor: "rgba(255,140,0,0.12)",
            mixBlendMode: "multiply",
            pointerEvents: "none",
          }}
        />
      )}
      {s.videoEffect === "cool" && (
        <AbsoluteFill
          style={{
            backgroundColor: "rgba(0,100,255,0.10)",
            mixBlendMode: "multiply",
            pointerEvents: "none",
          }}
        />
      )}
      {s.videoEffect === "cinematic" && (
        <>
          {/* Top bar */}
          <AbsoluteFill
            style={{
              height: cinemaBarHeight,
              top: 0,
              bottom: "auto",
              backgroundColor: "#000",
              pointerEvents: "none",
            }}
          />
          {/* Bottom bar */}
          <AbsoluteFill
            style={{
              height: cinemaBarHeight,
              bottom: 0,
              top: "auto",
              backgroundColor: "#000",
              pointerEvents: "none",
            }}
          />
        </>
      )}

      {/* Fade-in overlay */}
      {fadeDur > 0 && (
        <AbsoluteFill
          style={{ backgroundColor: "#000", opacity: 1 - fadeIn, pointerEvents: "none" }}
        />
      )}

      {/* Bottom gradient for subtitle readability (skip when using box/pill bg) */}
      {s.subtitleBg === "none" && (
        <AbsoluteFill
          style={{
            background:
              "linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.72) 100%)",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Audio */}
      <Audio src={audio} />

      {/* Subtitle */}
      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          alignItems: "center",
          paddingBottom: s.videoEffect === "cinematic" ? cinemaBarHeight + 24 : 72,
          paddingLeft: 48,
          paddingRight: 48,
          opacity: subOpacity,
          pointerEvents: "none",
        }}
      >
        <div style={subtitleContainerStyle}>
          <p style={subtitleTextStyle}>
            {s.karaokeEnabled !== false && activeWords && activeWords.length > 0 && activeSub
              ? renderKaraokeWords(activeWords, activeSub)
              : currentText}
          </p>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
