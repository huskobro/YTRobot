import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ProductReviewStyle, STYLE_PALETTES } from "../types";

interface Props {
  comments: string[];
  style: ProductReviewStyle;
  /** Stagger delay between comments (frames) */
  stagger?: number;
}

// Fixed positions for floating comments (avoid overlap)
const POSITIONS = [
  { top: "8%", right: "5%", rotate: 2 },
  { top: "25%", left: "3%", rotate: -3 },
  { bottom: "30%", right: "4%", rotate: 1 },
  { bottom: "12%", left: "6%", rotate: -2 },
  { top: "45%", right: "8%", rotate: 3 },
];

export const FloatingComments: React.FC<Props> = ({
  comments,
  style,
  stagger = 30,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const palette = STYLE_PALETTES[style];

  return (
    <>
      {comments.slice(0, 5).map((comment, i) => {
        const delay = i * stagger;
        const localFrame = Math.max(0, frame - delay);

        // Pop-in entrance
        const enter = spring({
          frame: localFrame,
          fps,
          config: { damping: 10, stiffness: 180 },
        });
        const scale = interpolate(enter, [0, 1], [0.3, 1]);
        const opacity = interpolate(enter, [0, 0.3], [0, 1], { extrapolateRight: "clamp" });

        // Gentle float
        const floatY = Math.sin(((localFrame + i * 40) / 80) * Math.PI * 2) * 5;

        // Auto-dismiss after ~3s
        const dismissFrame = localFrame - fps * 3;
        const dismiss = dismissFrame > 0
          ? interpolate(dismissFrame, [0, 15], [1, 0], { extrapolateRight: "clamp" })
          : 1;

        if (dismiss <= 0) return null;

        const pos = POSITIONS[i % POSITIONS.length];

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              ...pos,
              maxWidth: 320,
              padding: "12px 18px",
              borderRadius: 16,
              backgroundColor: palette.cardBg,
              border: `1px solid ${palette.cardBorder}`,
              backdropFilter: "blur(12px)",
              boxShadow: `0 8px 24px rgba(0,0,0,0.2)`,
              transform: `scale(${scale}) translateY(${floatY}px) rotate(${pos.rotate}deg)`,
              opacity: opacity * dismiss,
              zIndex: 20,
            }}
          >
            {/* Speech bubble tail */}
            <div
              style={{
                position: "absolute",
                bottom: -8,
                left: 24,
                width: 16,
                height: 16,
                backgroundColor: palette.cardBg,
                border: `1px solid ${palette.cardBorder}`,
                borderTop: "none",
                borderLeft: "none",
                transform: "rotate(45deg)",
              }}
            />
            {/* Avatar dot */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${palette.accent}, ${palette.secondary})`,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ fontSize: 14, color: "#FFF" }}>
                  {String.fromCodePoint(0x1F464)}
                </span>
              </div>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 500,
                  fontFamily: '"Montserrat", Arial, sans-serif',
                  color: palette.text,
                  lineHeight: 1.3,
                }}
              >
                {comment}
              </span>
            </div>
          </div>
        );
      })}
    </>
  );
};
