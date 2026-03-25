import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ProductItem, ProductReviewStyle, STYLE_PALETTES } from "../types";
import { ScoreCard } from "./ScoreCard";

interface Props {
  product: ProductItem;
  style: ProductReviewStyle;
  channelName?: string;
  vertical?: boolean;
}

export const VerdictScene: React.FC<Props> = ({ product, style, channelName, vertical }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const palette = STYLE_PALETTES[style];

  // Verdict text entrance (delayed)
  const verdictEnter = spring({
    frame: Math.max(0, frame - 40),
    fps,
    config: { damping: 14, stiffness: 120 },
  });
  const verdictY = interpolate(verdictEnter, [0, 1], [40, 0]);
  const verdictOpacity = interpolate(verdictEnter, [0, 0.4], [0, 1], { extrapolateRight: "clamp" });

  // CTA button entrance (delayed more)
  const ctaEnter = spring({
    frame: Math.max(0, frame - 80),
    fps,
    config: { damping: 10, stiffness: 180 },
  });
  const ctaScale = interpolate(ctaEnter, [0, 1], [0.5, 1]);

  // CTA pulse
  const ctaPulse = interpolate(
    Math.sin((frame / 30) * Math.PI * 2),
    [-1, 1],
    [0.95, 1.05]
  );

  // Channel name fade
  const channelEnter = spring({
    frame: Math.max(0, frame - 100),
    fps,
    config: { damping: 14, stiffness: 120 },
  });

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: vertical ? "60px 32px" : "60px 120px",
        gap: vertical ? 28 : 36,
      }}
    >
      {/* Score gauge */}
      <ScoreCard score={product.score} style={style} size={vertical ? 180 : 220} />

      {/* Verdict text */}
      <div
        style={{
          transform: `translateY(${verdictY}px)`,
          opacity: verdictOpacity,
          textAlign: "center",
          maxWidth: vertical ? "92%" : 800,
        }}
      >
        <p
          style={{
            fontSize: vertical ? 28 : 34,
            fontWeight: 600,
            fontFamily: '"Montserrat", Arial, sans-serif',
            color: palette.text,
            lineHeight: 1.4,
            margin: 0,
          }}
        >
          {product.verdict}
        </p>
      </div>

      {/* CTA Button */}
      {product.ctaText && (
        <div
          style={{
            transform: `scale(${ctaScale * ctaPulse})`,
            padding: vertical ? "18px 48px" : "22px 64px",
            borderRadius: 16,
            background: `linear-gradient(135deg, ${palette.accent}, ${palette.secondary})`,
            boxShadow: `0 8px 32px ${palette.accent}40`,
            cursor: "pointer",
          }}
        >
          <span
            style={{
              fontSize: vertical ? 28 : 34,
              fontWeight: 800,
              fontFamily: '"Bebas Neue", "Oswald", Impact, sans-serif',
              color: "#FFFFFF",
              letterSpacing: "0.08em",
            }}
          >
            {product.ctaText.toUpperCase()}
          </span>
        </div>
      )}

      {/* Channel watermark */}
      {channelName && (
        <div
          style={{
            opacity: interpolate(channelEnter, [0, 1], [0, 0.6]),
            marginTop: vertical ? 16 : 24,
          }}
        >
          <span
            style={{
              fontSize: 18,
              fontWeight: 500,
              fontFamily: '"Montserrat", Arial, sans-serif',
              color: palette.textMuted,
              letterSpacing: "0.06em",
            }}
          >
            {channelName}
          </span>
        </div>
      )}
    </AbsoluteFill>
  );
};
