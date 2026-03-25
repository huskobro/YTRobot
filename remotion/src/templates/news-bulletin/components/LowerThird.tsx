import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { NewsItem, SubtitleEntry } from "../types";

interface Props {
  item: NewsItem;
  hasImage?: boolean;
  style?:
    | "breaking"
    | "tech"
    | "corporate"
    | "sport"
    | "finance"
    | "weather"
    | "science"
    | "entertainment"
    | "dark";
}

const ACCENT = {
  breaking: "#DC2626",
  tech: "#00E5FF",
  corporate: "#2563EB",
  sport: "#10B981",
  finance: "#F59E0B",
  weather: "#38BDF8",
  science: "#8B5CF6",
  entertainment: "#EC4899",
  dark: "#94A3B8",
};

function renderSubtitles(frame: number, subtitles: SubtitleEntry[], accentColor: string = "#FFD700") {
  const active = subtitles.find((s) => frame >= s.startFrame && frame < s.endFrame);
  if (!active) return null;

  if (active.words && active.words.length > 0) {
    const subDur = active.endFrame - active.startFrame;
    const introFrames = Math.min(5, Math.floor(subDur * 0.12));
    const groupOpacity = interpolate(
      frame,
      [active.startFrame, active.startFrame + introFrames],
      [0, 1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );
    const groupY = interpolate(
      frame,
      [active.startFrame, active.startFrame + introFrames],
      [8, 0],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );
    return (
      <span style={{ opacity: groupOpacity, transform: `translateY(${groupY}px)`, display: "inline" }}>
        {active.words.map((w, i) => {
          const isActive = frame >= w.startFrame && frame < w.endFrame;
          const isPast = frame >= w.endFrame;
          const color = isActive ? accentColor : isPast ? "#FFFFFF" : "#AAAAAA";
          const opacity = isActive ? 1 : isPast ? 0.9 : 0.45;
          const textShadow = isActive
            ? `-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000,1px 1px 0 #000,0 0 14px ${accentColor}CC`
            : "0 2px 6px rgba(0,0,0,0.8)";
          return (
            <span key={i} style={{ color, opacity, textShadow, display: "inline-block", marginRight: "0.22em" }}>
              {w.word}
            </span>
          );
        })}
      </span>
    );
  }
  return <span style={{ color: "#FFFFFF" }}>{active.text}</span>;
}

export const LowerThird: React.FC<Props & { hasImage?: boolean }> = ({ item, style = "breaking", hasImage = false }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  // Per-item styleOverride takes priority over bulletin-level style
  const effectiveStyle = (item.styleOverride as keyof typeof ACCENT | undefined) && ACCENT[item.styleOverride as keyof typeof ACCENT]
    ? (item.styleOverride as keyof typeof ACCENT)
    : style;
  const accent = ACCENT[effectiveStyle];

  // Accent bar springs in first (damping 12 = snappier)
  const barProgress = spring({ frame, fps, config: { damping: 12, stiffness: 220 } });
  const barScaleX = interpolate(barProgress, [0, 1], [0, 1]);

  // Panel slides up from below
  const panelProgress = spring({
    frame: Math.max(0, frame - 4),
    fps,
    config: { damping: 14, stiffness: 180 },
  });
  const panelY = interpolate(panelProgress, [0, 1], [80, 0]);
  const panelOpacity = interpolate(panelProgress, [0, 0.3], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Headline text slides in after 8 frames (standard broadcast timing)
  const textProgress = spring({
    frame: Math.max(0, frame - 8),
    fps,
    config: { damping: 14, stiffness: 200 },
  });
  const textX = interpolate(textProgress, [0, 1], [-60, 0]);
  const textOpacity = interpolate(textProgress, [0, 0.4], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Fade out before scene end
  const fadeOutStart = durationInFrames - 20;
  const exitOpacity =
    frame >= fadeOutStart
      ? interpolate(frame, [fadeOutStart, durationInFrames], [1, 0], {
          extrapolateRight: "clamp",
        })
      : 1;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "flex-start",
        paddingBottom: 120, // above ticker zone
        paddingLeft: 0,
        pointerEvents: "none",
        opacity: exitOpacity,
      }}
    >
      {/* Panel */}
      <div
        style={{
          transform: `translateY(${panelY}px)`,
          opacity: panelOpacity,
          backgroundColor: "rgba(8,8,8,0.88)",
          paddingTop: 18,
          paddingBottom: 18,
          paddingLeft: 60,
          paddingRight: 60,
          backdropFilter: "blur(6px)",
          minWidth: 600,
          // When an image panel is on the right (780px wide + 60px gap), limit width to avoid overlap
          maxWidth: hasImage ? 980 : 1100,
        }}
      >
        {/* Accent bar — scale from 0 → 1 on the X axis */}
        <div
          style={{
            height: 5,
            width: "100%",
            background: accent,
            transformOrigin: "left center",
            transform: `scaleX(${barScaleX})`,
            marginBottom: 10,
            boxShadow: `0 0 16px ${accent}88`,
          }}
        />

        {/* "ANA HABER" label */}
        <p
          style={{
            color: accent,
            fontSize: 22,
            fontFamily: '"Montserrat", Arial, sans-serif',
            fontWeight: 800,
            letterSpacing: "0.18em",
            margin: "0 0 6px 0",
            textTransform: "uppercase",
          }}
        >
          ANA HABER
        </p>

        {/* Headline */}
        <h2
          style={{
            color: "#F5F5F5",
            fontSize: 48,
            fontFamily: '"Bebas Neue", "Oswald", Impact, sans-serif',
            letterSpacing: "0.05em",
            lineHeight: 1.1,
            margin: 0,
            transform: `translateX(${textX}px)`,
            opacity: textOpacity,
            textShadow: "0 2px 8px rgba(0,0,0,0.8)",
          }}
        >
          {item.headline}
        </h2>

        {/* Subtext (Narration) — only if no dynamic subtitles */}
        {item.subtext && (!item.subtitles || item.subtitles.length === 0) && (
          <p
            style={{
              color: "rgba(200,200,200,0.85)",
              fontSize: 28,
              fontFamily: '"Montserrat", Arial, sans-serif',
              fontWeight: 400,
              margin: "6px 0 0 0",
              letterSpacing: "0.02em",
              transform: `translateX(${textX}px)`,
              opacity: textOpacity,
            }}
          >
            {item.subtext}
          </p>
        )}

        {/* Subtitles (narration karaoke) */}
        {item.subtitles && item.subtitles.length > 0 && (
          <div
            style={{
              marginTop: 10,
              opacity: exitOpacity,
              fontSize: 24,
              fontFamily: '"Montserrat", Arial, sans-serif',
              fontWeight: 600,
              color: "#FFFFFF",
              textShadow: "0 2px 8px rgba(0,0,0,0.95)",
              lineHeight: 1.4,
            }}
          >
            {renderSubtitles(frame, item.subtitles, accent)}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
