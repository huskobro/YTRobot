import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

interface Props {
  rating: number;
  reviewCount: number;
  starSize?: number;
  color?: string;
  textColor?: string;
  mutedColor?: string;
}

export const StarRating: React.FC<Props> = ({
  rating,
  reviewCount,
  starSize = 40,
  color = "#FFD700",
  textColor = "#F5F5F5",
  mutedColor = "#94A3B8",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 14, stiffness: 140 } });
  const opacity = interpolate(enter, [0, 0.4], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, opacity }}>
      {/* Stars */}
      <div style={{ display: "flex", gap: 4 }}>
        {Array.from({ length: 5 }).map((_, i) => {
          // Each star fills sequentially
          const starDelay = i * 8;
          const starProgress = spring({
            frame: Math.max(0, frame - starDelay),
            fps,
            config: { damping: 12, stiffness: 200 },
          });
          const fill = Math.min(1, Math.max(0, rating - i));
          const starScale = interpolate(starProgress, [0, 1], [0, 1]);

          return (
            <div
              key={i}
              style={{
                width: starSize,
                height: starSize,
                position: "relative",
                transform: `scale(${starScale})`,
              }}
            >
              {/* Empty star */}
              <svg viewBox="0 0 24 24" style={{ width: "100%", height: "100%", position: "absolute" }}>
                <path
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  fill={`${color}30`}
                  stroke={`${color}50`}
                  strokeWidth={0.5}
                />
              </svg>
              {/* Filled portion (clipped) */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  overflow: "hidden",
                  width: `${fill * 100}%`,
                }}
              >
                <svg viewBox="0 0 24 24" style={{ width: starSize, height: starSize }}>
                  <path
                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                    fill={color}
                  />
                </svg>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rating number */}
      <span
        style={{
          fontSize: starSize * 0.9,
          fontWeight: 800,
          fontFamily: '"Montserrat", Arial, sans-serif',
          color: textColor,
          lineHeight: 1,
        }}
      >
        {(rating ?? 0).toFixed(1)}
      </span>

      {/* Review count */}
      <span
        style={{
          fontSize: starSize * 0.55,
          fontWeight: 500,
          fontFamily: '"Montserrat", Arial, sans-serif',
          color: mutedColor,
          lineHeight: 1,
        }}
      >
        ({(reviewCount ?? 0).toLocaleString("tr-TR")} yorum)
      </span>
    </div>
  );
};
