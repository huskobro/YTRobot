import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ProductItem, ProductReviewStyle, STYLE_PALETTES, PLATFORM_COLORS } from "../types";
import { ProductImage } from "./ProductImage";
import { PriceBadge } from "./PriceBadge";
import { StarRating } from "./StarRating";

interface Props {
  product: ProductItem;
  style: ProductReviewStyle;
  vertical?: boolean;
}

export const StatsScene: React.FC<Props> = ({ product, style, vertical }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const palette = STYLE_PALETTES[style];

  // Card entrance
  const cardEnter = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
  const cardScale = interpolate(cardEnter, [0, 1], [0.9, 1]);
  const cardOpacity = interpolate(cardEnter, [0, 0.3], [0, 1], { extrapolateRight: "clamp" });

  // Platform badge
  const platformColor = product.platform
    ? PLATFORM_COLORS[product.platform.toLowerCase()] || PLATFORM_COLORS.default
    : PLATFORM_COLORS.default;

  const imageSize = vertical ? 260 : 320;

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: vertical ? "60px 32px" : "0 80px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: vertical ? "column" : "row",
          alignItems: "center",
          gap: vertical ? 36 : 60,
          backgroundColor: palette.cardBg,
          border: `1px solid ${palette.cardBorder}`,
          borderRadius: 28,
          padding: vertical ? "40px 32px" : "50px 60px",
          backdropFilter: "blur(16px)",
          boxShadow: `0 20px 60px rgba(0,0,0,0.15)`,
          transform: `scale(${cardScale})`,
          opacity: cardOpacity,
          maxWidth: vertical ? "92%" : 1400,
          width: "100%",
        }}
      >
        {/* Product image */}
        {product.imageUrl && (
          <ProductImage
            src={product.imageUrl}
            size={imageSize}
            accent={palette.accent}
          />
        )}

        {/* Stats */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
            flex: 1,
            alignItems: vertical ? "center" : "flex-start",
          }}
        >
          {/* Platform badge */}
          {product.platform && (
            <div
              style={{
                display: "inline-flex",
                padding: "6px 16px",
                borderRadius: 8,
                backgroundColor: `${platformColor}20`,
                border: `1px solid ${platformColor}50`,
              }}
            >
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  fontFamily: '"Montserrat", Arial, sans-serif',
                  color: platformColor,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {product.platform}
              </span>
            </div>
          )}

          {/* Product name */}
          <h2
            style={{
              fontSize: vertical ? 32 : 40,
              fontWeight: 800,
              fontFamily: '"Montserrat", Arial, sans-serif',
              color: palette.text,
              lineHeight: 1.2,
              margin: 0,
              textAlign: vertical ? "center" : "left",
            }}
          >
            {product.name}
          </h2>

          {/* Price */}
          <PriceBadge
            price={product.price}
            originalPrice={product.originalPrice}
            currency={product.currency}
            style={style}
          />

          {/* Star rating */}
          <StarRating
            rating={product.rating}
            reviewCount={product.reviewCount}
            starSize={vertical ? 32 : 40}
            color="#FFD700"
            textColor={palette.text}
            mutedColor={palette.textMuted}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
