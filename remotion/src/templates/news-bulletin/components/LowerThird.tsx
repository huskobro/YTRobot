import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { NewsItem } from "../types";

interface Props {
  item: NewsItem;
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

export const LowerThird: React.FC<Props> = ({ item, style = "breaking" }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const accent = ACCENT[style];

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
          maxWidth: 1100,
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

        {/* Subtext */}
        {item.subtext && (
          <p
            style={{
              color: "rgba(200,200,200,0.85)",
              fontSize: 28,
              fontFamily: '"Montserrat", Arial, sans-serif',
              fontWeight: 400,
              margin: "6px 0 0 0",
              letterSpacing: "0.02em",
            }}
          >
            {item.subtext}
          </p>
        )}
      </div>
    </AbsoluteFill>
  );
};
