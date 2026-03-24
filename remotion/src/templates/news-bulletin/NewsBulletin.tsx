import React from "react";
import {
  AbsoluteFill,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BulletinProps } from "./types";
import { StudioBackground } from "./components/StudioBackground";
import { BreakingNewsOverlay } from "./components/BreakingNewsOverlay";
import { HeadlineCard } from "./components/HeadlineCard";
import { LowerThird } from "./components/LowerThird";
import { NewsTicker } from "./components/NewsTicker";

// ── Sequence layout (at 60 fps) ─────────────────────────────────────────────
// Frame 0–60:   Background + network bar fade in
// Frame 20–80:  BreakingNewsOverlay (Son Dakika flash)
// Frame 90+:    Headlines cycle, each with its own duration
// Ticker:       Always visible from frame 30 onward

const NETWORK_BAR_HEIGHT = 96;

const ACCENT = {
  breaking: "#CC0000",
  tech: "#00C8FF",
  corporate: "#1A5CDB",
};

export const NewsBulletin: React.FC<BulletinProps> = ({
  items,
  ticker,
  networkName,
  style = "breaking",
  showLiveIndicator = false,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const accent = ACCENT[style];

  // ── Network bar entrance ─────────────────────────────────────────────────
  const barProgress = spring({ frame, fps, config: { damping: 14, stiffness: 160 } });
  const barY = interpolate(barProgress, [0, 1], [-NETWORK_BAR_HEIGHT, 0]);
  const barOpacity = interpolate(barProgress, [0, 0.4], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Slow breathing logo scale (never static)
  const breathe = interpolate(
    Math.sin((frame / 120) * Math.PI * 2),
    [-1, 1],
    [0.97, 1.03]
  );

  // ── Calculate sequence offsets for headlines ─────────────────────────────
  const OVERLAY_START = 20;
  const OVERLAY_DUR = 60;
  const HEADLINES_START = 90;

  let cumulativeOffset = HEADLINES_START;
  const sequenced = items.map((item, idx) => {
    const from = cumulativeOffset;
    cumulativeOffset += item.duration;
    return { item, from, idx };
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Layer 1: Animated background */}
      <StudioBackground style={style} />

      {/* Layer 2: Network top bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: NETWORK_BAR_HEIGHT,
          background: `linear-gradient(to right, ${accent} 0%, rgba(10,10,10,0.95) 60%, rgba(10,10,10,0.85) 100%)`,
          display: "flex",
          alignItems: "center",
          paddingLeft: 40,
          paddingRight: 40,
          transform: `translateY(${barY}px)`,
          opacity: barOpacity,
          zIndex: 10,
          borderBottom: `2px solid ${accent}`,
          boxShadow: `0 4px 32px ${accent}44`,
        }}
      >
        <span
          style={{
            color: "#FFFFFF",
            fontSize: 44,
            fontFamily: '"Bebas Neue", "Oswald", Impact, sans-serif',
            letterSpacing: "0.14em",
            fontWeight: 900,
            transform: `scale(${breathe})`,
            display: "inline-block",
          }}
        >
          {networkName.toUpperCase()}
        </span>

        {/* Live indicator — opt-in via showLiveIndicator prop */}
        {showLiveIndicator && (
          <div
            style={{
              marginLeft: 24,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                backgroundColor: "#FF4444",
                boxShadow: "0 0 8px #FF4444",
                opacity: interpolate(
                  Math.sin((frame / 30) * Math.PI),
                  [-1, 1],
                  [0.5, 1.0]
                ),
              }}
            />
            <span
              style={{
                color: "#FFFFFF",
                fontSize: 22,
                fontFamily: '"Montserrat", Arial, sans-serif',
                fontWeight: 700,
                letterSpacing: "0.12em",
              }}
            >
              CANLI
            </span>
          </div>
        )}
      </div>

      {/* Layer 3: Breaking news overlay (early in the composition) */}
      <Sequence from={OVERLAY_START} durationInFrames={OVERLAY_DUR}>
        <BreakingNewsOverlay networkName={networkName} style={style} />
      </Sequence>

      {/* Layer 4: Sequential headlines */}
      {sequenced.map(({ item, from, idx }) => (
        <Sequence key={idx} from={from} durationInFrames={item.duration}>
          {/* First item gets a HeadlineCard (big center), others get LowerThird */}
          {idx === 0 ? (
            <HeadlineCard item={item} style={style} index={idx} />
          ) : (
            <>
              <HeadlineCard item={item} style={style} index={idx} />
              <LowerThird item={item} style={style} />
            </>
          )}
        </Sequence>
      ))}

      {/* Layer 5: Ticker — visible from frame 30 onwards */}
      <Sequence from={30}>
        <NewsTicker items={ticker} style={style} />
      </Sequence>
    </AbsoluteFill>
  );
};
