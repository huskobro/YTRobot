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
  subtitleFont: "serif",
  subtitleSize: 40,
  subtitleColor: "#ffffff",
  subtitleBg: "none",
  subtitleStroke: 0,
  transitionDuration: 12,
  videoEffect: "none",
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
  let activeWords: WordEntry[] | undefined;
  if (subtitles && subtitles.length > 0) {
    const active = subtitles.find(
      (sub: SubtitleEntry) => frame >= sub.startFrame && frame < sub.endFrame
    );
    currentText = active?.text ?? "";
    activeWords = active?.words;
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

  // ── Karaoke word renderer ──────────────────────────────────────────────
  const highlightColor = "#FFD700"; // gold highlight for active word
  const renderKaraokeWords = (words: WordEntry[]) => {
    return words.map((w, idx) => {
      const isActive = frame >= w.startFrame && frame < w.endFrame;
      const isPast = frame >= w.endFrame;
      const isFuture = frame < w.startFrame;

      // Smooth scale for active word
      const wordScale = isActive
        ? interpolate(
            frame,
            [w.startFrame, Math.min(w.startFrame + 4, w.endFrame)],
            [1.0, 1.12],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          )
        : 1.0;

      return (
        <span
          key={idx}
          style={{
            color: isActive ? highlightColor : isPast ? s.subtitleColor : s.subtitleColor,
            opacity: isFuture ? 0.55 : 1.0,
            transform: `scale(${wordScale})`,
            display: "inline-block",
            marginRight: "0.3em",
            transition: "color 0.1s, opacity 0.1s",
            fontWeight: isActive ? 800 : undefined,
          }}
        >
          {w.word}
        </span>
      );
    });
  };

  // … (rest of scene component below) 

  // ── Subtitle fade in/out ─────────────────────────────────────────────────
  const subFadeDur = Math.min(18, Math.floor(durationInFrames * 0.15));
  const subOpacity = interpolate(
    frame,
    [0, subFadeDur, Math.max(subFadeDur + 2, durationInFrames - subFadeDur), durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
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
          maxWidth: "85%",
        }
      : s.subtitleBg === "pill"
      ? {
          backgroundColor: "rgba(0,0,0,0.65)",
          padding: "10px 28px",
          borderRadius: 40,
          display: "inline-block",
          maxWidth: "85%",
        }
      : { maxWidth: "85%" };

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
          paddingLeft: 100,
          paddingRight: 100,
          opacity: subOpacity,
          pointerEvents: "none",
        }}
      >
        <div style={subtitleContainerStyle}>
          <p style={subtitleTextStyle}>
            {activeWords && activeWords.length > 0
              ? renderKaraokeWords(activeWords)
              : currentText}
          </p>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
