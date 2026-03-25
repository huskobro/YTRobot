import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

interface Props {
  label: string;
  accent: string;
}

/**
 * Horizontal category flash banner for 16:9 compositions.
 * Displayed between headlines when showCategoryFlash is true.
 * Enter: slides in from left with spring.
 * Exit: slides out to right (not just fade).
 */
export const CategoryFlash16x9: React.FC<Props> = ({ label, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const EXIT_START = 68; // begin exit slide at frame 68

  // Enter spring
  const enterProgress = spring({ frame, fps, config: { damping: 14, stiffness: 200 } });
  const enterX = interpolate(enterProgress, [0, 1], [-1000, 0]);

  // Exit spring (slides out to the right)
  const exitProgress = spring({ frame: Math.max(0, frame - EXIT_START), fps, config: { damping: 14, stiffness: 200 } });
  const exitX = interpolate(exitProgress, [0, 1], [0, 1200]);

  const badgeX = frame < EXIT_START ? enterX : exitX;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>

      {/* Category badge — horizontal arrow, slides from left then out right */}
      <div style={{
        position: "absolute",
        top: "38%",
        left: 0,
        right: 0,
        height: 130,
        display: "flex",
        alignItems: "center",
      }}>
        <div style={{
          transform: `translateX(${badgeX}px)`,
          backgroundColor: accent,
          height: "100%",
          display: "flex",
          alignItems: "center",
          paddingLeft: 80,
          paddingRight: 64,
          clipPath: "polygon(0 0, calc(100% - 32px) 0, 100% 50%, calc(100% - 32px) 100%, 0 100%)",
          boxShadow: `0 0 48px ${accent}88`,
          minWidth: 420,
        }}>
          <span style={{
            color: "#FFF",
            fontSize: 60,
            fontFamily: '"Bebas Neue","Oswald",Impact,sans-serif',
            letterSpacing: "0.12em",
            fontWeight: 900,
            textShadow: "0 2px 12px rgba(0,0,0,0.4)",
          }}>
            {label}
          </span>
        </div>
      </div>

      {/* Thin accent line */}
      <div style={{
        position: "absolute",
        top: "calc(38% + 132px)",
        left: 0, right: 0,
        height: 2,
        background: `linear-gradient(to right, transparent, ${accent}88, transparent)`,
        transform: `translateX(${badgeX}px)`,
      }} />
    </AbsoluteFill>
  );
};
