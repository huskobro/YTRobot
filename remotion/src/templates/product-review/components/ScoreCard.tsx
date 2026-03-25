import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ProductReviewStyle, STYLE_PALETTES } from "../types";

interface Props {
  score: number;
  style: ProductReviewStyle;
  size?: number;
}

function scoreColor(score: number): string {
  if (score >= 8) return "#10B981"; // green
  if (score >= 6) return "#F59E0B"; // amber
  if (score >= 4) return "#F97316"; // orange
  return "#EF4444"; // red
}

function scoreLabel(score: number): string {
  if (score >= 9) return "Mükemmel";
  if (score >= 8) return "Çok İyi";
  if (score >= 7) return "İyi";
  if (score >= 6) return "Fena Değil";
  if (score >= 5) return "Ortalama";
  if (score >= 4) return "Ortanın Altı";
  return "Zayıf";
}

export const ScoreCard: React.FC<Props> = ({ score, style, size = 200 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const palette = STYLE_PALETTES[style];

  // Animated score counter
  const countProgress = spring({
    frame,
    fps,
    config: { damping: 30, stiffness: 60 },
    durationInFrames: 120,
  });
  const displayScore = interpolate(countProgress, [0, 1], [0, score]);

  // Circle fill animation
  const circumference = 2 * Math.PI * 80; // radius = 80
  const fillProgress = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 80 },
    durationInFrames: 90,
  });
  const strokeDashoffset = circumference * (1 - (fillProgress * score) / 10);

  // Entrance
  const enter = spring({ frame, fps, config: { damping: 14, stiffness: 140 } });
  const scale = interpolate(enter, [0, 1], [0.5, 1]);
  const opacity = interpolate(enter, [0, 0.4], [0, 1], { extrapolateRight: "clamp" });

  const color = scoreColor(score);

  // Glow pulse
  const glowPulse = interpolate(
    Math.sin((frame / 60) * Math.PI * 2),
    [-1, 1],
    [0.4, 0.8]
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
        transform: `scale(${scale})`,
        opacity,
      }}
    >
      {/* Circular gauge */}
      <div
        style={{
          position: "relative",
          width: size,
          height: size,
          filter: `drop-shadow(0 0 ${20 * glowPulse}px ${color}60)`,
        }}
      >
        <svg viewBox="0 0 200 200" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
          {/* Background circle */}
          <circle
            cx={100}
            cy={100}
            r={80}
            fill="none"
            stroke={`${color}20`}
            strokeWidth={12}
          />
          {/* Progress circle */}
          <circle
            cx={100}
            cy={100}
            r={80}
            fill="none"
            stroke={color}
            strokeWidth={12}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>

        {/* Center text */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontSize: size * 0.35,
              fontWeight: 900,
              fontFamily: '"Bebas Neue", "Oswald", Impact, sans-serif',
              color,
              lineHeight: 1,
            }}
          >
            {displayScore.toFixed(1)}
          </span>
          <span
            style={{
              fontSize: size * 0.1,
              fontWeight: 600,
              fontFamily: '"Montserrat", Arial, sans-serif',
              color: palette.textMuted,
              lineHeight: 1,
              marginTop: 4,
            }}
          >
            / 10
          </span>
        </div>
      </div>

      {/* Label */}
      <span
        style={{
          fontSize: 28,
          fontWeight: 700,
          fontFamily: '"Montserrat", Arial, sans-serif',
          color,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
        }}
      >
        {scoreLabel(score)}
      </span>
    </div>
  );
};
