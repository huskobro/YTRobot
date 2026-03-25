import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ProductReviewStyle, STYLE_PALETTES } from "../types";

interface Props {
  price: number;
  originalPrice?: number;
  currency: string;
  style: ProductReviewStyle;
}

export const PriceBadge: React.FC<Props> = ({ price, originalPrice, currency, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const palette = STYLE_PALETTES[style];

  // Animated counter: counts up from 0 to price
  const countProgress = spring({ frame, fps, config: { damping: 30, stiffness: 80 }, durationInFrames: 90 });
  const displayPrice = Math.round(interpolate(countProgress, [0, 1], [0, price]));

  // Entrance
  const enter = spring({ frame, fps, config: { damping: 14, stiffness: 160 } });
  const slideY = interpolate(enter, [0, 1], [30, 0]);
  const opacity = interpolate(enter, [0, 0.4], [0, 1], { extrapolateRight: "clamp" });

  // Discount percentage
  const discount = originalPrice ? Math.round((1 - price / originalPrice) * 100) : 0;

  // Discount badge pop
  const discountEnter = spring({ frame: Math.max(0, frame - 30), fps, config: { damping: 10, stiffness: 200 } });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 16,
        transform: `translateY(${slideY}px)`,
        opacity,
      }}
    >
      {/* Current price */}
      <span
        style={{
          fontSize: 72,
          fontWeight: 900,
          fontFamily: '"Bebas Neue", "Oswald", Impact, sans-serif',
          color: palette.accent,
          letterSpacing: "0.02em",
          lineHeight: 1,
        }}
      >
        {displayPrice.toLocaleString("tr-TR")} {currency}
      </span>

      {/* Original price (strikethrough) */}
      {originalPrice && (
        <span
          style={{
            fontSize: 36,
            fontWeight: 500,
            fontFamily: '"Montserrat", Arial, sans-serif',
            color: palette.textMuted,
            textDecoration: "line-through",
            lineHeight: 1,
          }}
        >
          {originalPrice.toLocaleString("tr-TR")} {currency}
        </span>
      )}

      {/* Discount badge */}
      {discount > 0 && (
        <div
          style={{
            backgroundColor: "#EF4444",
            color: "#FFFFFF",
            fontSize: 24,
            fontWeight: 800,
            fontFamily: '"Montserrat", Arial, sans-serif',
            padding: "6px 14px",
            borderRadius: 8,
            transform: `scale(${discountEnter})`,
            lineHeight: 1.2,
          }}
        >
          %{discount} İNDİRİM
        </div>
      )}
    </div>
  );
};
