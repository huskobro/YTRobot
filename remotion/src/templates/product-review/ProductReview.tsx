import React from "react";
import { AbsoluteFill, Audio, Sequence, useVideoConfig } from "remotion";
import { ProductReviewProps, calculateDurations, STYLE_PALETTES } from "./types";
import { ReviewBackground } from "./components/ReviewBackground";
import { HookScene } from "./components/HookScene";
import { StatsScene } from "./components/StatsScene";
import { ProsConsScene } from "./components/ProsConsScene";
import { VerdictScene } from "./components/VerdictScene";
import { FloatingComments } from "./components/FloatingComments";

/**
 * ProductReview — 16:9 landscape composition
 *
 * Scenes:
 *  1. Hook    — product name + "Almaya değer mi?" + product image
 *  2. Stats   — price counter + star rating + platform badge
 *  3. Pros    — advantage list with staggered entrance
 *  4. Cons    — disadvantage list
 *  5. Verdict — circular score gauge + verdict text + CTA
 *
 * Floating user comments appear throughout stats/pros scenes.
 */
export const ProductReview: React.FC<ProductReviewProps> = ({
  product,
  style = "modern",
  fps = 60,
  channelName = "YTRobot",
  sceneDurations,
}) => {
  const { fps: configFps } = useVideoConfig();
  const actualFps = configFps || fps;
  const dur = calculateDurations(product, sceneDurations, actualFps);

  // Scene start frames
  const hookStart = 0;
  const statsStart = dur.hook;
  const prosStart = statsStart + dur.stats;
  const consStart = prosStart + dur.pros;
  const verdictStart = consStart + dur.cons;

  // Floating comments appear during stats + pros scenes
  const commentsStart = statsStart + 30;
  const commentsDuration = dur.stats + dur.pros - 30;

  return (
    <AbsoluteFill>
      {/* Background — full duration */}
      <ReviewBackground style={style} />

      {/* Scene 1: Hook */}
      <Sequence from={hookStart} durationInFrames={dur.hook}>
        <HookScene product={product} style={style} />
      </Sequence>

      {/* Scene 2: Stats */}
      <Sequence from={statsStart} durationInFrames={dur.stats}>
        <StatsScene product={product} style={style} />
      </Sequence>

      {/* Scene 3: Pros */}
      <Sequence from={prosStart} durationInFrames={dur.pros}>
        <ProsConsScene items={product.pros} type="pros" style={style} />
      </Sequence>

      {/* Scene 4: Cons */}
      <Sequence from={consStart} durationInFrames={dur.cons}>
        <ProsConsScene items={product.cons} type="cons" style={style} />
      </Sequence>

      {/* Scene 5: Verdict */}
      <Sequence from={verdictStart} durationInFrames={dur.verdict}>
        <VerdictScene product={product} style={style} channelName={channelName} />
      </Sequence>

      {/* Floating comments overlay (during stats + pros) */}
      {product.topComments && product.topComments.length > 0 && (
        <Sequence from={commentsStart} durationInFrames={commentsDuration}>
          <FloatingComments comments={product.topComments} style={style} stagger={40} />
        </Sequence>
      )}

      {/* Audio track */}
      {product.audioUrl && (
        <Audio src={product.audioUrl} />
      )}
    </AbsoluteFill>
  );
};
