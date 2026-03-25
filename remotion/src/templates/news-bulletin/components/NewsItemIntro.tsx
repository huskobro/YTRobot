import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

interface Props {
  /** Category label displayed on the intro banner */
  label: string;
  /** Accent colour matching the item's style */
  accent: string;
  /** Network name shown below the label */
  networkName: string;
}

/**
 * 2-second (120-frame at 60fps) branded intro shown before each news item.
 * A full-width accent panel wipes in from the left, holds, then wipes out to the right.
 */
export const NewsItemIntro: React.FC<Props> = ({ label, accent, networkName }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Total duration handled by parent Sequence (120 frames)
  const HOLD_START = 18;
  const EXIT_START = 88;

  // Enter: panel wipes in from left
  const enterProgress = spring({ frame, fps, config: { damping: 18, stiffness: 220 } });
  const enterX = interpolate(enterProgress, [0, 1], [-1920, 0], { extrapolateRight: "clamp" });

  // Exit: panel slides out to right
  const exitProgress = spring({ frame: Math.max(0, frame - EXIT_START), fps, config: { damping: 14, stiffness: 180 } });
  const exitX = interpolate(exitProgress, [0, 1], [0, 1920], { extrapolateRight: "clamp" });

  // Combine enter + exit offset
  const panelX = frame < EXIT_START ? enterX : exitX;

  // Text stagger
  const labelProgress = spring({ frame: Math.max(0, frame - 6), fps, config: { damping: 16, stiffness: 200 } });
  const labelX = interpolate(labelProgress, [0, 1], [-80, 0]);
  const labelOpacity = interpolate(labelProgress, [0, 0.4], [0, 1], { extrapolateRight: "clamp" });
  const labelExit = frame >= EXIT_START
    ? interpolate(frame, [EXIT_START, EXIT_START + 14], [1, 0], { extrapolateRight: "clamp" })
    : 1;

  const netProgress = spring({ frame: Math.max(0, frame - 14), fps, config: { damping: 14, stiffness: 180 } });
  const netX = interpolate(netProgress, [0, 1], [-60, 0]);
  const netOpacity = interpolate(netProgress, [0, 0.4], [0, 1], { extrapolateRight: "clamp" });

  // Accent flash overlay
  const flashOpacity = interpolate(
    frame, [0, 5, 10, 18, 22], [0, 0.45, 0.08, 0.35, 0], { extrapolateRight: "clamp" }
  );

  // Number indicator pulse
  const pulseOpacity = interpolate(
    Math.sin((frame / 24) * Math.PI * 2), [-1, 1], [0.7, 1.0]
  );

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* Full-screen colour flash */}
      <div style={{ position: "absolute", inset: 0, backgroundColor: accent, opacity: flashOpacity }} />

      {/* Main panel */}
      <div style={{
        position: "absolute",
        top: "35%",
        left: 0,
        right: 0,
        height: 200,
        transform: `translateX(${panelX}px)`,
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
      }}>
        {/* Dark left-edge block */}
        <div style={{
          width: 12,
          height: "100%",
          backgroundColor: "rgba(0,0,0,0.95)",
          flexShrink: 0,
        }} />

        {/* Accent fill */}
        <div style={{
          flex: 1,
          height: "100%",
          background: `linear-gradient(to right, ${accent} 0%, ${accent}ee 60%, ${accent}88 100%)`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingLeft: 64,
          paddingRight: 80,
          gap: 8,
        }}>
          {/* Category label */}
          <div style={{
            transform: `translateX(${labelX}px)`,
            opacity: labelOpacity * labelExit,
          }}>
            <span style={{
              color: "#FFFFFF",
              fontSize: 72,
              fontFamily: '"Bebas Neue", "Oswald", Impact, sans-serif',
              fontWeight: 900,
              letterSpacing: "0.14em",
              textShadow: "0 2px 20px rgba(0,0,0,0.6)",
            }}>
              {label}
            </span>
          </div>

          {/* Network name */}
          <div style={{
            transform: `translateX(${netX}px)`,
            opacity: netOpacity * labelExit,
          }}>
            <span style={{
              color: "rgba(255,255,255,0.75)",
              fontSize: 28,
              fontFamily: '"Montserrat", Arial, sans-serif',
              fontWeight: 600,
              letterSpacing: "0.18em",
            }}>
              {networkName.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Right triangle cutout */}
        <div style={{
          width: 0,
          height: 0,
          borderTop: "100px solid transparent",
          borderBottom: "100px solid transparent",
          borderLeft: `48px solid ${accent}ee`,
          flexShrink: 0,
          opacity: 0.9,
        }} />
      </div>

      {/* Thin accent line below panel */}
      <div style={{
        position: "absolute",
        top: "calc(35% + 200px)",
        left: 0,
        right: 0,
        height: 3,
        background: `linear-gradient(to right, transparent, ${accent}, transparent)`,
        transform: `translateX(${panelX}px)`,
        opacity: 0.7,
      }} />
    </AbsoluteFill>
  );
};
