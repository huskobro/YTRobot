import React from "react";
import { Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

interface Props {
  src: string;
  size?: number;
  /** Ken Burns zoom intensity (0 = none) */
  zoom?: number;
  /** Border accent color */
  accent?: string;
  /** Shadow glow color */
  glow?: string;
}

export const ProductImage: React.FC<Props> = ({
  src,
  size = 400,
  zoom = 0.06,
  accent = "#4F46E5",
  glow,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance: scale up + fade in
  const enter = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
  const scale = interpolate(enter, [0, 1], [0.8, 1]);
  const opacity = interpolate(enter, [0, 0.5], [0, 1], { extrapolateRight: "clamp" });

  // Subtle Ken Burns drift
  const kenBurns = 1 + zoom * Math.sin((frame / 180) * Math.PI * 2);

  // Floating effect
  const floatY = Math.sin((frame / 90) * Math.PI * 2) * 6;

  const glowColor = glow || `${accent}40`;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 24,
        overflow: "hidden",
        border: `3px solid ${accent}30`,
        boxShadow: `0 20px 60px ${glowColor}, 0 0 0 1px ${accent}15`,
        transform: `scale(${scale}) translateY(${floatY}px)`,
        opacity,
        flexShrink: 0,
      }}
    >
      <Img
        src={src}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${kenBurns})`,
        }}
      />
    </div>
  );
};
