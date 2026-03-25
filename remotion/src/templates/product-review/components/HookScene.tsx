import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ProductItem, ProductReviewStyle, STYLE_PALETTES } from "../types";
import { ProductImage } from "./ProductImage";

interface Props {
  product: ProductItem;
  style: ProductReviewStyle;
  /** true for 9:16 vertical layout */
  vertical?: boolean;
}

export const HookScene: React.FC<Props> = ({ product, style, vertical }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const palette = STYLE_PALETTES[style];

  // Text entrance
  const textEnter = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
  const textY = interpolate(textEnter, [0, 1], [60, 0]);
  const textOpacity = interpolate(textEnter, [0, 0.4], [0, 1], { extrapolateRight: "clamp" });

  // Category badge pop
  const badgeEnter = spring({ frame: Math.max(0, frame - 15), fps, config: { damping: 10, stiffness: 200 } });

  // "Almaya Değer Mi?" question pulse
  const pulse = interpolate(
    Math.sin((frame / 40) * Math.PI * 2),
    [-1, 1],
    [0.97, 1.03]
  );

  const imageSize = vertical ? 300 : 360;

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: vertical ? "column" : "row",
        alignItems: "center",
        justifyContent: "center",
        gap: vertical ? 40 : 80,
        padding: vertical ? "80px 40px" : "0 120px",
      }}
    >
      {/* Product image */}
      {product.imageUrl && (
        <ProductImage
          src={product.imageUrl}
          size={imageSize}
          accent={palette.accent}
          glow={`${palette.accent}30`}
        />
      )}

      {/* Text block */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          alignItems: vertical ? "center" : "flex-start",
          textAlign: vertical ? "center" : "left",
          transform: `translateY(${textY}px)`,
          opacity: textOpacity,
          maxWidth: vertical ? "90%" : 700,
        }}
      >
        {/* Category badge */}
        {product.category && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 20px",
              borderRadius: 30,
              backgroundColor: `${palette.accent}18`,
              border: `1px solid ${palette.accent}40`,
              transform: `scale(${badgeEnter})`,
            }}
          >
            <span
              style={{
                fontSize: 18,
                fontWeight: 700,
                fontFamily: '"Montserrat", Arial, sans-serif',
                color: palette.accent,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {product.category}
            </span>
          </div>
        )}

        {/* Product name */}
        <h1
          style={{
            fontSize: vertical ? 44 : 52,
            fontWeight: 900,
            fontFamily: '"Montserrat", Arial, sans-serif',
            color: palette.text,
            lineHeight: 1.15,
            margin: 0,
          }}
        >
          {product.name}
        </h1>

        {/* Hook question */}
        <div
          style={{
            fontSize: vertical ? 32 : 38,
            fontWeight: 700,
            fontFamily: '"Bebas Neue", "Oswald", Impact, sans-serif',
            color: palette.accent,
            letterSpacing: "0.06em",
            transform: `scale(${pulse})`,
            display: "inline-block",
          }}
        >
          ALMAYA DEGER MI?
        </div>
      </div>
    </AbsoluteFill>
  );
};
