import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { TickerItem } from "../types";

interface Props {
  items: TickerItem[];
  style?: "breaking" | "tech" | "corporate";
}

const ACCENT = {
  breaking: "#CC0000",
  tech: "#00C8FF",
  corporate: "#1A5CDB",
};

const TICKER_HEIGHT = 64;
const CHAR_WIDTH = 18; // approximate px per char at 28px Montserrat
const SEPARATOR = "   ◆   ";

export const NewsTicker: React.FC<Props> = ({ items, style = "breaking" }) => {
  const frame = useCurrentFrame();
  const { width, durationInFrames } = useVideoConfig();
  const accent = ACCENT[style];

  // Build a single repeated string long enough to scroll smoothly
  const rawText = items.map((t) => t.text).join(SEPARATOR) + SEPARATOR;
  // Repeat 3× so the ticker never shows a gap
  const fullText = rawText + rawText + rawText;
  const contentWidth = fullText.length * CHAR_WIDTH;

  // Linear scroll: moves left by 4px/frame (constant speed, no spring)
  const SPEED = 4; // px per frame
  const tickerX = interpolate(
    frame,
    [0, durationInFrames],
    [0, -SPEED * durationInFrames],
    { extrapolateRight: "clamp" }
  );

  // Wrap around: if the offset exceeds one full rawText width, reset
  const rawWidth = rawText.length * CHAR_WIDTH;
  const wrappedX = ((tickerX % rawWidth) - rawWidth) % rawWidth;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        pointerEvents: "none",
      }}
    >
      {/* Ticker bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: TICKER_HEIGHT,
          backgroundColor: "rgba(10,10,10,0.94)",
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          borderTop: `2px solid ${accent}`,
          boxShadow: `0 -4px 24px ${accent}44`,
        }}
      >
        {/* Accent badge on the left */}
        <div
          style={{
            flexShrink: 0,
            background: accent,
            height: "100%",
            paddingLeft: 24,
            paddingRight: 24,
            display: "flex",
            alignItems: "center",
            zIndex: 2,
            boxShadow: `4px 0 20px ${accent}88`,
          }}
        >
          <span
            style={{
              color: "#FFFFFF",
              fontSize: 22,
              fontFamily: '"Bebas Neue", "Oswald", sans-serif',
              letterSpacing: "0.14em",
              fontWeight: 900,
            }}
          >
            HABERLER
          </span>
        </div>

        {/* Scrolling text */}
        <div
          style={{
            flex: 1,
            overflow: "hidden",
            height: "100%",
            display: "flex",
            alignItems: "center",
          }}
        >
          <div
            style={{
              whiteSpace: "nowrap",
              transform: `translateX(${wrappedX}px)`,
              willChange: "transform",
            }}
          >
            <span
              style={{
                color: "#FFFFFF",
                fontSize: 28,
                fontFamily: '"Montserrat", Arial, sans-serif',
                fontWeight: 500,
                letterSpacing: "0.03em",
              }}
            >
              {fullText}
            </span>
          </div>
        </div>

        {/* Fade edges */}
        <div
          style={{
            position: "absolute",
            left: 120, // after the badge
            top: 0,
            bottom: 0,
            width: 80,
            background:
              "linear-gradient(to right, rgba(10,10,10,0.94), transparent)",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: 120,
            background:
              "linear-gradient(to left, rgba(10,10,10,0.94), transparent)",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
