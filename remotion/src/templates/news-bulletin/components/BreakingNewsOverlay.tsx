import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { getLabel } from "../utils/localization";

interface Props {
  networkName: string;
  lang?: string;
  style?:
    | "breaking"
    | "tech"
    | "corporate"
    | "sport"
    | "finance"
    | "weather"
    | "science"
    | "entertainment"
    | "dark";
}

const COLORS = {
  breaking: { color: "#DC2626", darkColor: "#8B0000" },
  tech: { color: "#00E5FF", darkColor: "#0088AA" },
  corporate: { color: "#2563EB", darkColor: "#0D3A8E" },
  sport: { color: "#10B981", darkColor: "#065F46" },
  finance: { color: "#F59E0B", darkColor: "#92400E" },
  weather: { color: "#38BDF8", darkColor: "#075985" },
  science: { color: "#8B5CF6", darkColor: "#5B21B6" },
  entertainment: { color: "#EC4899", darkColor: "#9D174D" },
  dark: { color: "#94A3B8", darkColor: "#334155" },
};

export const BreakingNewsOverlay: React.FC<Props> = ({
  networkName,
  lang = "tr",
  style = "breaking",
}) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const colors = COLORS[style as keyof typeof COLORS] || COLORS.breaking;
  const labelText = getLabel(style, lang);

  // Badge slides in from left
  const badgeProgress = spring({ frame, fps, config: { damping: 14, stiffness: 200 } });
  const badgeX = interpolate(badgeProgress, [0, 1], [-600, 0]);

  // Network name slides in from right (slight delay)
  const nameProgress = spring({
    frame: Math.max(0, frame - 8),
    fps,
    config: { damping: 14, stiffness: 200 },
  });
  const nameX = interpolate(nameProgress, [0, 1], [400, 0]);
  const nameOpacity = interpolate(nameProgress, [0, 0.3], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Flash pulse on the badge (3 quick flashes in first 30 frames)
  const flashOpacity =
    frame < 30
      ? interpolate(
          Math.abs(Math.sin((frame / 30) * Math.PI * 3)),
          [0, 1],
          [0.6, 1.0]
        )
      : 1.0;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* Centered horizontal band */}
      <div
        style={{
          position: "absolute",
          top: "38%",
          left: 0,
          right: 0,
          display: "flex",
          alignItems: "center",
          height: 90,
        }}
      >
        {/* SON DAKİKA badge */}
        <div
          style={{
            transform: `translateX(${badgeX}px)`,
            opacity: flashOpacity,
            background: `linear-gradient(135deg, ${colors.color} 0%, ${colors.darkColor} 100%)`,
            paddingLeft: 60,
            paddingRight: 40,
            height: "100%",
            display: "flex",
            alignItems: "center",
            clipPath: "polygon(0 0, calc(100% - 30px) 0, 100% 50%, calc(100% - 30px) 100%, 0 100%)",
            boxShadow: `0 0 40px ${colors.color}88`,
          }}
        >
          <span
            style={{
              color: "#FFFFFF",
              fontSize: 42,
              fontFamily: '"Bebas Neue", "Oswald", sans-serif',
              letterSpacing: "0.12em",
              fontWeight: 900,
              textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
            }}
          >
            {labelText}
          </span>
        </div>

        {/* Network name */}
        <div
          style={{
            transform: `translateX(${nameX}px)`,
            opacity: nameOpacity,
            marginLeft: 20,
            flex: 1,
          }}
        >
          <span
            style={{
              color: "#FFFFFF",
              fontSize: 36,
              fontFamily: '"Montserrat", "Arial", sans-serif',
              fontWeight: 700,
              letterSpacing: "0.08em",
              textShadow: "0 2px 12px rgba(0,0,0,0.9)",
            }}
          >
            {networkName.toUpperCase()}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
