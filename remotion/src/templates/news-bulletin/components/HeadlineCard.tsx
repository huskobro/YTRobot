import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  OffthreadVideo,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { NewsItem, SubtitleEntry } from "../types";
import { NewsImagePanel } from "./NewsImagePanel";

/** Resolve effective media URL (mediaUrl > imageUrl) */
function getMediaUrl(item: NewsItem): string | undefined {
  return item.mediaUrl || item.imageUrl || undefined;
}

/** Resolve aspect ratio */
function getAspect(item: NewsItem): "16:9" | "9:16" | "9:16-focus" | "1:1" {
  return item.mediaAspect ?? "16:9";
}

function isVideo(url: string): boolean {
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url);
}

interface Props {
  item: NewsItem;
  style?: "breaking" | "tech" | "corporate";
  index?: number;
}

const ACCENT = {
  breaking: "#CC0000",
  tech: "#00C8FF",
  corporate: "#1A5CDB",
};

const KARAOKE_COLOR = "#FFD700";

function renderSubtitles(
  frame: number,
  subtitles: SubtitleEntry[],
  subtitleColor: string
) {
  const active = subtitles.find((s) => frame >= s.startFrame && frame < s.endFrame);
  if (!active) return null;

  if (active.words && active.words.length > 0) {
    // Word-level karaoke
    const subDur = active.endFrame - active.startFrame;
    const introFrames = Math.min(5, Math.floor(subDur * 0.12));
    const groupOpacity = interpolate(
      frame,
      [active.startFrame, active.startFrame + introFrames],
      [0, 1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );
    const groupY = interpolate(
      frame,
      [active.startFrame, active.startFrame + introFrames],
      [10, 0],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );

    return (
      <span style={{ opacity: groupOpacity, transform: `translateY(${groupY}px)`, display: "inline" }}>
        {active.words.map((w, i) => {
          const isActive = frame >= w.startFrame && frame < w.endFrame;
          const isPast = frame >= w.endFrame;
          const color = isActive ? KARAOKE_COLOR : isPast ? "#FFFFFF" : "#AAAAAA";
          const opacity = isActive ? 1 : isPast ? 0.9 : 0.45;
          const textShadow = isActive
            ? `-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000,1px 1px 0 #000, 0 0 12px ${KARAOKE_COLOR}88`
            : "0 2px 8px rgba(0,0,0,0.8)";
          return (
            <span
              key={i}
              style={{ color, opacity, textShadow, display: "inline-block", marginRight: "0.22em" }}
            >
              {w.word}
            </span>
          );
        })}
      </span>
    );
  }

  // Plain text
  return <span>{active.text}</span>;
}

export const HeadlineCard: React.FC<Props> = ({ item, style = "breaking", index = 0 }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const accent = ACCENT[style];
  const mediaUrl = getMediaUrl(item);
  const aspect = getAspect(item);
  const hasImage = Boolean(mediaUrl);
  // 9:16 vertical video → treat as right-panel portrait (same container, objectFit handles crop)
  const isPortraitVideo = hasImage && aspect === "9:16" && isVideo(mediaUrl!);

  // Wipe direction alternates
  const fromRight = index % 2 === 1;
  const progress = spring({ frame, fps, config: { damping: 16, stiffness: 160 } });

  // When image present, text block shifts left; otherwise centered
  const textMaxWidth = hasImage ? 900 : 1400;
  const textAlignLeft = hasImage;

  const slideX = interpolate(progress, [0, 1], [fromRight ? 120 : -120, 0]);
  const opacity = interpolate(progress, [0, 0.4], [0, 1], { extrapolateRight: "clamp" });

  const barProgress = spring({ frame, fps, config: { damping: 12, stiffness: 220 } });
  const barScale = interpolate(barProgress, [0, 1], [0, 1]);

  const subProgress = spring({ frame: Math.max(0, frame - 12), fps, config: { damping: 14, stiffness: 180 } });
  const subOpacity = interpolate(subProgress, [0, 0.5], [0, 1], { extrapolateRight: "clamp" });
  const subY = interpolate(subProgress, [0, 1], [20, 0]);

  const fadeOutStart = durationInFrames - 18;
  const exitOpacity =
    frame >= fadeOutStart
      ? interpolate(frame, [fadeOutStart, durationInFrames], [1, 0], { extrapolateRight: "clamp" })
      : 1;

  // Subtitle fade-out near end
  const subFadeOut = frame >= durationInFrames - 12
    ? interpolate(frame, [durationInFrames - 12, durationInFrames], [1, 0], { extrapolateRight: "clamp" })
    : 1;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", pointerEvents: "none", opacity: exitOpacity }}>

      {/* Audio — plays for the duration of this Sequence */}
      {item.audioUrl && <Audio src={item.audioUrl} />}

      {/* Text block */}
      <div
        style={{
          position: "absolute",
          left: hasImage ? 60 : "50%",
          transform: hasImage ? `translateX(${slideX}px)` : `translateX(calc(-50% + ${slideX}px))`,
          opacity,
          maxWidth: textMaxWidth,
          width: hasImage ? textMaxWidth : undefined,
          paddingLeft: hasImage ? 0 : 80,
          paddingRight: hasImage ? 0 : 80,
          textAlign: textAlignLeft ? "left" : "center",
        }}
      >
        {/* Accent bar */}
        <div style={{ width: "100%", display: "flex", justifyContent: textAlignLeft ? "flex-start" : "center", marginBottom: 16 }}>
          <div
            style={{
              height: 6,
              width: `${barScale * (hasImage ? 80 : 60)}%`,
              background: hasImage
                ? `linear-gradient(to right, ${accent}, transparent)`
                : `linear-gradient(to right, transparent, ${accent}, transparent)`,
              borderRadius: 3,
              boxShadow: `0 0 20px ${accent}88`,
            }}
          />
        </div>

        {/* Headline */}
        <h1
          style={{
            color: "#F5F5F5",
            fontSize: hasImage ? 78 : 96,
            fontFamily: '"Bebas Neue", "Oswald", Impact, sans-serif',
            letterSpacing: "0.06em",
            lineHeight: 1.0,
            margin: 0,
            textShadow: `0 0 60px rgba(0,0,0,0.9), 0 4px 24px rgba(0,0,0,0.9), 0 0 120px ${accent}33`,
          }}
        >
          {item.headline}
        </h1>

        {/* Subtext */}
        {item.subtext && (
          <p
            style={{
              color: "rgba(220,220,220,0.9)",
              fontSize: hasImage ? 30 : 36,
              fontFamily: '"Montserrat", Arial, sans-serif',
              fontWeight: 400,
              marginTop: 16,
              letterSpacing: "0.04em",
              textShadow: "0 2px 12px rgba(0,0,0,0.9)",
              transform: `translateY(${subY}px)`,
              opacity: subOpacity,
            }}
          >
            {item.subtext}
          </p>
        )}

        {/* Subtitles (narration karaoke) */}
        {item.subtitles && item.subtitles.length > 0 && (
          <div
            style={{
              marginTop: 28,
              opacity: subFadeOut,
              fontSize: 32,
              fontFamily: '"Montserrat", Arial, sans-serif',
              fontWeight: 600,
              color: "#FFFFFF",
              textShadow: "0 2px 12px rgba(0,0,0,0.95)",
              lineHeight: 1.5,
            }}
          >
            {renderSubtitles(frame, item.subtitles, "#FFFFFF")}
          </div>
        )}
      </div>

      {/* Right media panel — image or video */}
      {hasImage && !isPortraitVideo && (
        <NewsImagePanel imageUrl={mediaUrl!} style={style} />
      )}
      {hasImage && isPortraitVideo && (
        <NewsImagePanel imageUrl={mediaUrl!} style={style} isVideo />
      )}
    </AbsoluteFill>
  );
};
