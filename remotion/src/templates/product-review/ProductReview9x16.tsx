import React from "react";
import { AbsoluteFill, Audio, Sequence, useVideoConfig } from "remotion";
import { ProductReviewProps, calculateDurations } from "./types";
import { ReviewBackground } from "./components/ReviewBackground";
import { HookScene } from "./components/HookScene";
import { StatsScene } from "./components/StatsScene";
import { ProsConsScene } from "./components/ProsConsScene";
import { VerdictScene } from "./components/VerdictScene";
import { FloatingComments } from "./components/FloatingComments";

/**
 * ProductReview9x16 — 9:16 vertical (Shorts / Reels / TikTok) composition
 *
 * Same scene structure as 16:9 but with vertical=true layouts.
 * Duration auto-capped at 58s for platform compliance.
 */
export const ProductReview9x16: React.FC<ProductReviewProps> = ({
  product,
  style = "modern",
  fps = 60,
  channelName = "YTRobot",
  sceneDurations,
}) => {
  const { fps: configFps } = useVideoConfig();
  const actualFps = configFps || fps;
  const dur = calculateDurations(product, sceneDurations, actualFps);

  const hookStart = 0;
  const statsStart = dur.hook;
  const prosStart = statsStart + dur.stats;
  const consStart = prosStart + dur.pros;
  const verdictStart = consStart + dur.cons;

  const commentsStart = statsStart + 30;
  const commentsDuration = dur.stats + dur.pros - 30;

  return (
    <AbsoluteFill>
      <ReviewBackground style={style} />

      <Sequence from={hookStart} durationInFrames={dur.hook}>
        <HookScene product={product} style={style} vertical />
      </Sequence>

      <Sequence from={statsStart} durationInFrames={dur.stats}>
        <StatsScene product={product} style={style} vertical />
      </Sequence>

      <Sequence from={prosStart} durationInFrames={dur.pros}>
        <ProsConsScene items={product.pros} type="pros" style={style} vertical />
      </Sequence>

      <Sequence from={consStart} durationInFrames={dur.cons}>
        <ProsConsScene items={product.cons} type="cons" style={style} vertical />
      </Sequence>

      <Sequence from={verdictStart} durationInFrames={dur.verdict}>
        <VerdictScene product={product} style={style} channelName={channelName} vertical />
      </Sequence>

      {product.topComments && product.topComments.length > 0 && (
        <Sequence from={commentsStart} durationInFrames={commentsDuration}>
          <FloatingComments comments={product.topComments} style={style} stagger={35} />
        </Sequence>
      )}

      {product.audioUrl && <Audio src={product.audioUrl} />}
    </AbsoluteFill>
  );
};
