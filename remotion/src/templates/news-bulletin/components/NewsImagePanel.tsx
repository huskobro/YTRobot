import React from "react";
import { Img, OffthreadVideo, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

interface Props {
  imageUrl: string;
  style?: "breaking" | "tech" | "corporate" | "sport" | "finance" | "weather" | "science" | "entertainment" | "dark";
  /** When true, renders an OffthreadVideo instead of Img */
  isVideo?: boolean;
}

const ACCENT = {
  breaking: "#CC0000",
  tech: "#00C8FF",
  corporate: "#1A5CDB",
  sport: "#10B981",       // Emerald
  finance: "#F59E0B",     // Amber
  weather: "#38BDF8",     // Sky
  science: "#8B5CF6",     // Violet
  entertainment: "#EC4899", // Pink
  dark: "#94A3B8",        // Slate
};

export const NewsImagePanel: React.FC<Props> = ({ imageUrl, style = "breaking", isVideo = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const accent = ACCENT[style];

  // Panel slides in from the right
  const progress = spring({ frame, fps, config: { damping: 16, stiffness: 140 } });
  const translateX = interpolate(progress, [0, 1], [120, 0]);
  const opacity = interpolate(progress, [0, 0.4], [0, 1], { extrapolateRight: "clamp" });

  // Subtle slow Ken Burns on the image (zoom in over lifetime)
  const scale = interpolate(frame, [0, 300], [1.0, 1.06], { extrapolateRight: "clamp" });

  return (
    <div
      style={{
        position: "absolute",
        right: 60,
        top: "50%",
        transform: `translateY(-50%) translateX(${translateX}px)`,
        opacity,
        width: 780,
        height: 520,
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: `0 0 0 3px ${accent}88, 0 8px 60px rgba(0,0,0,0.8)`,
      }}
    >
      {/* Image with Ken Burns */}
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        {isVideo ? (
          <OffthreadVideo
            src={imageUrl}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <Img
            src={imageUrl}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}
      </div>

      {/* Gradient overlay on bottom edge for depth */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(to bottom, transparent 55%, rgba(0,0,0,0.55) 100%)`,
          pointerEvents: "none",
        }}
      />

      {/* Accent border glow — top edge */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(to right, transparent, ${accent}, transparent)`,
          pointerEvents: "none",
        }}
      />
    </div>
  );
};
