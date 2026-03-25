import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { ProductReviewStyle, STYLE_PALETTES } from "../types";

interface Props {
  style: ProductReviewStyle;
}

export const ReviewBackground: React.FC<Props> = ({ style }) => {
  const frame = useCurrentFrame();
  const palette = STYLE_PALETTES[style];

  // Breathing animation for background elements
  const breathe = Math.sin((frame / 90) * Math.PI * 2);
  const breathe2 = Math.sin((frame / 150) * Math.PI * 2);
  const slowDrift = frame * 0.15;

  return (
    <AbsoluteFill style={{ background: palette.bgGradient, overflow: "hidden" }}>
      {/* Animated gradient orbs */}
      {style !== "minimal" && (
        <>
          <div
            style={{
              position: "absolute",
              width: 800,
              height: 800,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${palette.accent}${style === "dark" || style === "premium" ? "15" : "08"} 0%, transparent 70%)`,
              top: `${-200 + breathe * 30}px`,
              right: `${-100 + breathe2 * 20}px`,
              filter: "blur(60px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 600,
              height: 600,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${palette.secondary}${style === "dark" || style === "premium" ? "12" : "06"} 0%, transparent 70%)`,
              bottom: `${-150 + breathe2 * 25}px`,
              left: `${-80 + breathe * 15}px`,
              filter: "blur(50px)",
            }}
          />
        </>
      )}

      {/* Subtle grid pattern for dark/premium */}
      {(style === "dark" || style === "premium" || style === "energetic") && (
        <svg
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.03 }}
          viewBox="0 0 1920 1080"
          preserveAspectRatio="none"
        >
          {Array.from({ length: 24 }).map((_, i) => (
            <line key={`v${i}`} x1={i * 80} y1={0} x2={i * 80} y2={1920} stroke={palette.accent} strokeWidth={1} />
          ))}
          {Array.from({ length: 30 }).map((_, i) => (
            <line key={`h${i}`} x1={0} y1={i * 64} x2={1920} y2={i * 64} stroke={palette.accent} strokeWidth={1} />
          ))}
        </svg>
      )}

      {/* Diagonal accent lines for energetic */}
      {style === "energetic" && (
        <svg
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.04 }}
          viewBox="0 0 1920 1080"
          preserveAspectRatio="none"
        >
          {Array.from({ length: 10 }).map((_, i) => (
            <line
              key={i}
              x1={-200 + i * 240 + slowDrift}
              y1={0}
              x2={200 + i * 240 + slowDrift}
              y2={1920}
              stroke={palette.accent}
              strokeWidth={2}
            />
          ))}
        </svg>
      )}

      {/* Scanline effect for dark/premium */}
      {(style === "dark" || style === "premium") && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 3px, ${palette.accent}06 3px, ${palette.accent}06 4px)`,
            backgroundSize: "100% 4px",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Vignette */}
      {style !== "minimal" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.3) 100%)",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Minimal: subtle dot grid */}
      {style === "minimal" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            pointerEvents: "none",
          }}
        />
      )}
    </AbsoluteFill>
  );
};
