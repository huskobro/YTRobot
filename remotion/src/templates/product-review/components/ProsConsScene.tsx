import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ProductReviewStyle, STYLE_PALETTES, ItemTiming } from "../types";

interface Props {
  items: string[];
  type: "pros" | "cons";
  style: ProductReviewStyle;
  vertical?: boolean;
  /** Per-item narration timing — when provided, items appear when their audio starts */
  itemTimings?: ItemTiming[];
}

export const ProsConsScene: React.FC<Props> = ({ items, type, style, vertical, itemTimings }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const palette = STYLE_PALETTES[style];

  const isPros = type === "pros";
  const icon = isPros ? "\u2713" : "\u2717"; // ✓ or ✗
  const iconColor = isPros ? "#10B981" : "#EF4444";
  const bgColor = isPros ? palette.proBg : palette.conBg;
  const title = isPros ? "AVANTAJLAR" : "DEZAVANTAJLAR";

  // Title entrance
  const titleEnter = spring({ frame, fps, config: { damping: 14, stiffness: 160 } });
  const titleScale = interpolate(titleEnter, [0, 1], [0.8, 1]);
  const titleOpacity = interpolate(titleEnter, [0, 0.3], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: vertical ? "80px 32px" : "60px 160px",
        gap: vertical ? 28 : 36,
      }}
    >
      {/* Title */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          transform: `scale(${titleScale})`,
          opacity: titleOpacity,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            backgroundColor: `${iconColor}20`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: `2px solid ${iconColor}50`,
          }}
        >
          <span style={{ fontSize: 28, color: iconColor, fontWeight: 900 }}>{icon}</span>
        </div>
        <h2
          style={{
            fontSize: vertical ? 36 : 44,
            fontWeight: 900,
            fontFamily: '"Bebas Neue", "Oswald", Impact, sans-serif',
            color: palette.text,
            letterSpacing: "0.1em",
            margin: 0,
          }}
        >
          {title}
        </h2>
      </div>

      {/* Items */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: vertical ? 16 : 20,
          width: "100%",
          maxWidth: vertical ? "100%" : 900,
        }}
      >
        {items.map((item, i) => {
          // If audio timing is provided, use narration start frame for each item
          // Otherwise fall back to staggered static timing
          const timing = itemTimings?.[i];
          const delay = timing ? timing.startFrame : 20 + i * 18;
          const isNarrating = timing
            ? frame >= timing.startFrame && frame <= timing.endFrame
            : false;

          const itemEnter = spring({
            frame: Math.max(0, frame - delay),
            fps,
            config: { damping: 12, stiffness: 140 },
          });
          const slideX = interpolate(itemEnter, [0, 1], [isPros ? -60 : 60, 0]);
          const itemOpacity = interpolate(itemEnter, [0, 0.3], [0, 1], { extrapolateRight: "clamp" });

          // Active glow: narrating item gets stronger highlight
          const isActive = timing ? isNarrating : frame >= delay + 10;
          // Pulse scale for currently narrating item
          const pulseScale = isNarrating
            ? interpolate(Math.sin((frame / 25) * Math.PI * 2), [-1, 1], [0.98, 1.02])
            : 1;

          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 18,
                padding: vertical ? "16px 20px" : "20px 28px",
                borderRadius: 16,
                backgroundColor: bgColor,
                border: `1px solid ${iconColor}${isActive ? "40" : "15"}`,
                transform: `translateX(${slideX}px) scale(${pulseScale})`,
                opacity: itemOpacity,
                boxShadow: isNarrating
                  ? `0 4px 24px ${iconColor}30, inset 0 0 0 1px ${iconColor}25`
                  : isActive
                    ? `0 4px 20px ${iconColor}15`
                    : "none",
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  backgroundColor: `${iconColor}${isNarrating ? "30" : "15"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: 20, color: iconColor, fontWeight: 900 }}>{icon}</span>
              </div>

              {/* Text */}
              <span
                style={{
                  fontSize: vertical ? 24 : 28,
                  fontWeight: isNarrating ? 700 : 600,
                  fontFamily: '"Montserrat", Arial, sans-serif',
                  color: isNarrating ? palette.accent : palette.text,
                  lineHeight: 1.3,
                }}
              >
                {item}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
