import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

interface Props {
  label: string;
  accent: string;
}

/**
 * Horizontal category flash banner for 16:9 compositions.
 * Displayed between headlines when showCategoryFlash is true.
 * Visual language matches BreakingNewsOverlay — arrow-shaped badge sliding from left.
 */
export const CategoryFlash16x9: React.FC<Props> = ({ label, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({ frame, fps, config: { damping: 14, stiffness: 200 } });
  const slideX = interpolate(progress, [0, 1], [-700, 0]);
  const exitOpacity = interpolate(frame, [70, 90], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const flashOpacity = interpolate(frame, [0, 6, 12, 20, 26], [0, 0.5, 0.05, 0.4, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* Accent colour flash overlay */}
      <div style={{ position: "absolute", inset: 0, backgroundColor: accent, opacity: flashOpacity }} />

      {/* Category badge — horizontal arrow, slides from left */}
      <div style={{
        position: "absolute",
        top: "40%",
        left: 0,
        right: 0,
        height: 120,
        display: "flex",
        alignItems: "center",
        opacity: exitOpacity,
      }}>
        <div style={{
          transform: `translateX(${slideX}px)`,
          backgroundColor: accent,
          height: "100%",
          display: "flex",
          alignItems: "center",
          paddingLeft: 80,
          paddingRight: 64,
          clipPath: "polygon(0 0, calc(100% - 32px) 0, 100% 50%, calc(100% - 32px) 100%, 0 100%)",
          boxShadow: `0 0 40px ${accent}88`,
        }}>
          <span style={{
            color: "#FFF",
            fontSize: 56,
            fontFamily: '"Bebas Neue","Oswald",Impact,sans-serif',
            letterSpacing: "0.12em",
            fontWeight: 900,
          }}>
            {label}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
