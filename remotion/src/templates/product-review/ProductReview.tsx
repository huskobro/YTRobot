import React from "react";
import { AbsoluteFill, Audio, Sequence, useVideoConfig } from "remotion";
import { ProductReviewProps, calculateDurations, NarrationTiming } from "./types";
import { ReviewBackground } from "./components/ReviewBackground";
import { HookScene } from "./components/HookScene";
import { StatsScene } from "./components/StatsScene";
import { ProsConsScene } from "./components/ProsConsScene";
import { VerdictScene } from "./components/VerdictScene";
import { FloatingComments } from "./components/FloatingComments";

/**
 * ProductReview — 16:9 landscape composition
 *
 * When narrationTiming is provided, scene durations and item appearances
 * are driven by the audio narration. Each pro/con item appears only when
 * its narration starts, and scenes don't transition until narration ends.
 */
export const ProductReview: React.FC<ProductReviewProps> = ({
  product,
  style = "modern",
  fps = 60,
  channelName = "YTRobot",
  sceneDurations,
  narrationTiming,
}) => {
  const { fps: configFps } = useVideoConfig();
  const actualFps = configFps || fps;

  // If narrationTiming is provided, derive durations from it
  const dur = narrationTiming
    ? durationsFromTiming(narrationTiming, actualFps)
    : calculateDurations(product, sceneDurations, actualFps);

  // Scene start frames
  const hookStart = 0;
  const statsStart = dur.hook;
  const prosStart = statsStart + dur.stats;
  const consStart = prosStart + dur.pros;
  const verdictStart = consStart + dur.cons;

  // Convert item timings to be relative to their scene start
  const prosItemTimings = narrationTiming?.pros?.items?.map(t => ({
    startFrame: t.startFrame - (narrationTiming.pros?.startFrame ?? 0),
    endFrame: t.endFrame - (narrationTiming.pros?.startFrame ?? 0),
  }));
  const consItemTimings = narrationTiming?.cons?.items?.map(t => ({
    startFrame: t.startFrame - (narrationTiming.cons?.startFrame ?? 0),
    endFrame: t.endFrame - (narrationTiming.cons?.startFrame ?? 0),
  }));

  // Floating comments appear during stats + pros scenes
  const commentsStart = statsStart + 30;
  const commentsDuration = dur.stats + dur.pros - 30;

  return (
    <AbsoluteFill>
      <ReviewBackground style={style} />

      <Sequence from={hookStart} durationInFrames={dur.hook}>
        <HookScene product={product} style={style} />
      </Sequence>

      <Sequence from={statsStart} durationInFrames={dur.stats}>
        <StatsScene product={product} style={style} />
      </Sequence>

      <Sequence from={prosStart} durationInFrames={dur.pros}>
        <ProsConsScene
          items={product.pros}
          type="pros"
          style={style}
          itemTimings={prosItemTimings}
        />
      </Sequence>

      <Sequence from={consStart} durationInFrames={dur.cons}>
        <ProsConsScene
          items={product.cons}
          type="cons"
          style={style}
          itemTimings={consItemTimings}
        />
      </Sequence>

      <Sequence from={verdictStart} durationInFrames={dur.verdict}>
        <VerdictScene product={product} style={style} channelName={channelName} />
      </Sequence>

      {product.topComments && product.topComments.length > 0 && (
        <Sequence from={commentsStart} durationInFrames={commentsDuration}>
          <FloatingComments comments={product.topComments} style={style} stagger={40} />
        </Sequence>
      )}

      {product.audioUrl && <Audio src={product.audioUrl} />}
    </AbsoluteFill>
  );
};

/** Derive scene durations from narration timing data */
function durationsFromTiming(
  timing: NarrationTiming,
  fps: number,
): Required<{ hook: number; stats: number; pros: number; cons: number; verdict: number }> {
  const pad = Math.round(fps * 0.5); // 0.5s padding after narration ends
  return {
    hook: timing.hook ? timing.hook.endFrame - timing.hook.startFrame + pad : Math.round(fps * 3),
    stats: timing.stats ? timing.stats.endFrame - timing.stats.startFrame + pad : Math.round(fps * 6),
    pros: timing.pros ? timing.pros.endFrame - timing.pros.startFrame + pad : Math.round(fps * 9),
    cons: timing.cons ? timing.cons.endFrame - timing.cons.startFrame + pad : Math.round(fps * 5),
    verdict: timing.verdict ? timing.verdict.endFrame - timing.verdict.startFrame + pad : Math.round(fps * 8),
  };
}
