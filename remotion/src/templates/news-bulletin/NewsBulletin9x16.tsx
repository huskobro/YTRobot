import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  OffthreadVideo,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BulletinProps, NewsItem, SubtitleEntry } from "./types";
import { StudioBackground } from "./components/StudioBackground";
import { NewsTicker } from "./components/NewsTicker";

// ── 9:16 Vertical News Bulletin (1080×1920) ──────────────────────────────────
//
// Media layout per item (auto-detected from mediaAspect):
//
//  "16:9" image/video  →  Upper panel (top ~38%), text block below
//  "9:16" video        →  Full-bleed background video, dark overlay, text at bottom
//  "1:1"  image        →  Centred square panel (640×640), text below
//  no media            →  Text fills full usable area with decorative accent elements

const ACCENT = {
  breaking: "#CC0000",
  tech: "#00C8FF",
  corporate: "#1A5CDB",
};

const KARAOKE_COLOR = "#FFD700";
const NETWORK_BAR_H = 96;
const TICKER_H = 64;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Resolve the effective media URL (mediaUrl takes priority over legacy imageUrl) */
function getMediaUrl(item: NewsItem): string | undefined {
  return item.mediaUrl || item.imageUrl || undefined;
}

/** Resolve aspect ratio — default "16:9" */
function getAspect(item: NewsItem): "16:9" | "9:16" | "9:16-focus" | "1:1" {
  return item.mediaAspect ?? "16:9";
}

/** True when URL looks like a video file */
function isVideo(url: string): boolean {
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url);
}

function renderSubtitles(frame: number, subtitles: SubtitleEntry[]) {
  const active = subtitles.find((s) => frame >= s.startFrame && frame < s.endFrame);
  if (!active) return null;

  if (active.words && active.words.length > 0) {
    const subDur = active.endFrame - active.startFrame;
    const introFrames = Math.min(5, Math.floor(subDur * 0.12));
    const groupOpacity = interpolate(frame, [active.startFrame, active.startFrame + introFrames], [0, 1], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp",
    });
    const groupY = interpolate(frame, [active.startFrame, active.startFrame + introFrames], [12, 0], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp",
    });
    return (
      <span style={{ opacity: groupOpacity, transform: `translateY(${groupY}px)`, display: "inline" }}>
        {active.words.map((w, i) => {
          const isActive = frame >= w.startFrame && frame < w.endFrame;
          const isPast = frame >= w.endFrame;
          const color = isActive ? KARAOKE_COLOR : isPast ? "#FFFFFF" : "#AAAAAA";
          const opacity = isActive ? 1 : isPast ? 0.9 : 0.45;
          const textShadow = isActive
            ? `-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000,1px 1px 0 #000,0 0 12px ${KARAOKE_COLOR}88`
            : "0 2px 8px rgba(0,0,0,0.8)";
          return (
            <span key={i} style={{ color, opacity, textShadow, display: "inline-block", marginRight: "0.22em" }}>
              {w.word}
            </span>
          );
        })}
      </span>
    );
  }
  return <span style={{ color: "#FFFFFF" }}>{active.text}</span>;
}

// ── Media rendering helper ────────────────────────────────────────────────────

interface MediaProps {
  url: string;
  style?: React.CSSProperties;
  scale?: number;
}

const MediaElement: React.FC<MediaProps> = ({ url, style, scale = 1 }) => {
  const inner = (
    <div style={{ width: "100%", height: "100%", transform: `scale(${scale})`, transformOrigin: "center center" }}>
      {isVideo(url) ? (
        <OffthreadVideo src={url} style={{ width: "100%", height: "100%", objectFit: "cover", ...style }} />
      ) : (
        <Img src={url} style={{ width: "100%", height: "100%", objectFit: "cover", ...style }} />
      )}
    </div>
  );
  return inner;
};

// ── Text block (shared across layouts) ───────────────────────────────────────

interface TextBlockProps {
  item: NewsItem;
  accent: string;
  frame: number;
  fps: number;
  durationInFrames: number;
  index: number;
  /** If true, uses larger font (full-screen no-image layout) */
  expanded?: boolean;
}

const TextBlock: React.FC<TextBlockProps> = ({ item, accent, frame, fps, durationInFrames, index, expanded = false }) => {
  const fromLeft = index % 2 === 0;
  const progress = spring({ frame, fps, config: { damping: 16, stiffness: 160 } });
  const slideX = interpolate(progress, [0, 1], [fromLeft ? -80 : 80, 0]);
  const opacity = interpolate(progress, [0, 0.4], [0, 1], { extrapolateRight: "clamp" });

  const subProgress = spring({ frame: Math.max(0, frame - 10), fps, config: { damping: 14, stiffness: 180 } });
  const subY = interpolate(subProgress, [0, 1], [20, 0]);
  const subOpacity = interpolate(subProgress, [0, 0.5], [0, 1], { extrapolateRight: "clamp" });

  const subFadeOut = frame >= durationInFrames - 12
    ? interpolate(frame, [durationInFrames - 12, durationInFrames], [1, 0], { extrapolateRight: "clamp" })
    : 1;

  return (
    <div style={{ transform: `translateX(${slideX}px)`, opacity }}>
      {/* Accent bar */}
      <div style={{
        height: 5,
        width: "55%",
        background: `linear-gradient(to right, ${accent}, transparent)`,
        borderRadius: 3,
        boxShadow: `0 0 20px ${accent}88`,
        marginBottom: expanded ? 28 : 18,
      }} />

      {/* Headline */}
      <h1 style={{
        color: "#F5F5F5",
        fontSize: expanded ? 100 : 84,
        fontFamily: '"Bebas Neue", "Oswald", Impact, sans-serif',
        letterSpacing: "0.06em",
        lineHeight: 1.0,
        margin: `0 0 ${expanded ? 28 : 18}px 0`,
        textShadow: `0 0 60px rgba(0,0,0,0.9),0 4px 24px rgba(0,0,0,0.9),0 0 120px ${accent}33`,
      }}>
        {item.headline}
      </h1>

      {/* Subtext */}
      {item.subtext && (
        <p style={{
          color: "rgba(220,220,220,0.92)",
          fontSize: expanded ? 42 : 36,
          fontFamily: '"Montserrat", Arial, sans-serif',
          fontWeight: 400,
          margin: `0 0 ${expanded ? 32 : 24}px 0`,
          letterSpacing: "0.03em",
          lineHeight: 1.45,
          textShadow: "0 2px 12px rgba(0,0,0,0.9)",
          transform: `translateY(${subY}px)`,
          opacity: subOpacity,
        }}>
          {item.subtext}
        </p>
      )}

      {/* Subtitles */}
      {item.subtitles && item.subtitles.length > 0 && (
        <div style={{
          opacity: subFadeOut,
          fontSize: expanded ? 40 : 34,
          fontFamily: '"Montserrat", Arial, sans-serif',
          fontWeight: 600,
          color: "#FFFFFF",
          textShadow: "0 2px 12px rgba(0,0,0,0.95)",
          lineHeight: 1.5,
        }}>
          {renderSubtitles(frame, item.subtitles)}
        </div>
      )}
    </div>
  );
};

// ── Layout A: 16:9 media — upper panel ───────────────────────────────────────

const Layout169: React.FC<{ item: NewsItem; accent: string; frame: number; fps: number; durationInFrames: number; index: number }> = (
  { item, accent, frame, fps, durationInFrames, index }
) => {
  const mediaUrl = getMediaUrl(item)!;
  const imgScale = interpolate(frame, [0, 300], [1.0, 1.06], { extrapolateRight: "clamp" });

  // Panel spans from below network bar to ~42% of total height
  const IMAGE_TOP = NETWORK_BAR_H + 8;
  const IMAGE_H = 720; // ~37% of 1920

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* Upper media panel */}
      <div style={{ position: "absolute", top: IMAGE_TOP, left: 0, right: 0, height: IMAGE_H, overflow: "hidden" }}>
        <MediaElement url={mediaUrl} scale={imgScale} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 45%, rgba(0,0,0,0.92) 100%)" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: `linear-gradient(to right, transparent, ${accent}, transparent)` }} />
      </div>

      {/* Text block — overlaps bottom of image slightly, fills rest of screen */}
      <div style={{
        position: "absolute",
        top: IMAGE_TOP + IMAGE_H - 60,
        left: 0, right: 0,
        bottom: TICKER_H + 16,
        paddingLeft: 60, paddingRight: 60,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
      }}>
        <TextBlock item={item} accent={accent} frame={frame} fps={fps} durationInFrames={durationInFrames} index={index} />
      </div>
    </AbsoluteFill>
  );
};

// ── Layout B: 9:16 video — full-bleed background ──────────────────────────────

const Layout916: React.FC<{ item: NewsItem; accent: string; frame: number; fps: number; durationInFrames: number; index: number }> = (
  { item, accent, frame, fps, durationInFrames, index }
) => {
  const mediaUrl = getMediaUrl(item)!;
  const mediaOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  // Content zone: from bottom ~55% up to ticker
  const CONTENT_TOP = 1920 * 0.52;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* Full-bleed background video */}
      <div style={{ position: "absolute", inset: 0, opacity: mediaOpacity }}>
        <OffthreadVideo
          src={mediaUrl}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      {/* Dark gradient so text is readable */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.7) 55%, rgba(0,0,0,0.92) 100%)",
      }} />

      {/* Accent line separating video from text zone */}
      <div style={{
        position: "absolute",
        top: CONTENT_TOP - 4,
        left: 60, right: 60,
        height: 3,
        background: `linear-gradient(to right, transparent, ${accent}, transparent)`,
        boxShadow: `0 0 20px ${accent}88`,
      }} />

      {/* Text zone */}
      <div style={{
        position: "absolute",
        top: CONTENT_TOP + 8,
        left: 0, right: 0,
        bottom: TICKER_H + 16,
        paddingLeft: 60, paddingRight: 60,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
      }}>
        <TextBlock item={item} accent={accent} frame={frame} fps={fps} durationInFrames={durationInFrames} index={index} />
      </div>
    </AbsoluteFill>
  );
};

// ── Layout B2: 9:16 video/image — VIDEO FOCUS (text bar at very bottom) ───────
// Use when the video content itself is what the viewer needs to see.
// Only ~18% of the screen height is used for text — a thin frosted bar at the
// bottom. The remaining 82% is clean, unobstructed media.

const Layout916VideoFocus: React.FC<{ item: NewsItem; accent: string; frame: number; fps: number; durationInFrames: number; index: number }> = (
  { item, accent, frame, fps, durationInFrames, index }
) => {
  const mediaUrl = getMediaUrl(item)!;
  const mediaOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const fromLeft = index % 2 === 0;

  // Text bar entrance: slides up from below
  const barProgress = spring({ frame, fps, config: { damping: 14, stiffness: 160 } });
  const barY = interpolate(barProgress, [0, 1], [120, 0]);
  const barOpacity = interpolate(barProgress, [0, 0.4], [0, 1], { extrapolateRight: "clamp" });

  // Headline slide
  const headProgress = spring({ frame: Math.max(0, frame - 6), fps, config: { damping: 16, stiffness: 180 } });
  const headX = interpolate(headProgress, [0, 1], [fromLeft ? -60 : 60, 0]);
  const headOpacity = interpolate(headProgress, [0, 0.4], [0, 1], { extrapolateRight: "clamp" });

  const subFadeOut = frame >= durationInFrames - 12
    ? interpolate(frame, [durationInFrames - 12, durationInFrames], [1, 0], { extrapolateRight: "clamp" })
    : 1;

  // Text bar sits just above the ticker
  const BAR_BOTTOM = TICKER_H;
  const BAR_HEIGHT = 340; // ~18% of 1920

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* Full-bleed media — fills entire frame including behind network bar */}
      <div style={{ position: "absolute", inset: 0, opacity: mediaOpacity }}>
        {isVideo(mediaUrl) ? (
          <OffthreadVideo src={mediaUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <Img src={mediaUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        )}
      </div>

      {/* Subtle vignette — only top and sides, keep middle clean */}
      <div style={{
        position: "absolute", inset: 0,
        background: [
          "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 18%)",
          "linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.85) 82%, rgba(0,0,0,0.96) 100%)",
        ].join(", "),
        pointerEvents: "none",
      }} />

      {/* Accent glow line above the text bar */}
      <div style={{
        position: "absolute",
        bottom: BAR_BOTTOM + BAR_HEIGHT,
        left: 0, right: 0,
        height: 3,
        background: `linear-gradient(to right, transparent 5%, ${accent} 30%, ${accent} 70%, transparent 95%)`,
        boxShadow: `0 0 24px ${accent}CC`,
        opacity: barOpacity,
        transform: `translateY(${barY}px)`,
      }} />

      {/* Text bar — frosted dark panel */}
      <div style={{
        position: "absolute",
        bottom: BAR_BOTTOM,
        left: 0, right: 0,
        height: BAR_HEIGHT,
        background: "linear-gradient(to top, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.88) 80%, transparent 100%)",
        paddingLeft: 56, paddingRight: 56,
        paddingBottom: 24,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        transform: `translateY(${barY}px)`,
        opacity: barOpacity,
      }}>
        {/* Accent bar */}
        <div style={{
          height: 4,
          width: "45%",
          background: `linear-gradient(to right, ${accent}, transparent)`,
          borderRadius: 2,
          boxShadow: `0 0 16px ${accent}88`,
          marginBottom: 14,
        }} />

        {/* Headline */}
        <h1 style={{
          color: "#F5F5F5",
          fontSize: 72,
          fontFamily: '"Bebas Neue", "Oswald", Impact, sans-serif',
          letterSpacing: "0.06em",
          lineHeight: 1.0,
          margin: "0 0 10px 0",
          textShadow: "0 2px 16px rgba(0,0,0,0.95), 0 0 40px rgba(0,0,0,0.8)",
          transform: `translateX(${headX}px)`,
          opacity: headOpacity,
        }}>
          {item.headline}
        </h1>

        {/* Subtext — single line, clipped */}
        {item.subtext && (
          <p style={{
            color: "rgba(210,210,210,0.88)",
            fontSize: 30,
            fontFamily: '"Montserrat", Arial, sans-serif',
            fontWeight: 400,
            margin: "0 0 8px 0",
            letterSpacing: "0.02em",
            lineHeight: 1.3,
            textShadow: "0 2px 8px rgba(0,0,0,0.9)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            transform: `translateX(${headX}px)`,
            opacity: headOpacity,
          }}>
            {item.subtext}
          </p>
        )}

        {/* Karaoke subtitles */}
        {item.subtitles && item.subtitles.length > 0 && (
          <div style={{
            opacity: subFadeOut,
            fontSize: 28,
            fontFamily: '"Montserrat", Arial, sans-serif',
            fontWeight: 600,
            color: "#FFFFFF",
            textShadow: "0 2px 10px rgba(0,0,0,0.95)",
            lineHeight: 1.4,
          }}>
            {renderSubtitles(frame, item.subtitles)}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// ── Layout C: 1:1 square image — centred panel ───────────────────────────────

const Layout11: React.FC<{ item: NewsItem; accent: string; frame: number; fps: number; durationInFrames: number; index: number }> = (
  { item, accent, frame, fps, durationInFrames, index }
) => {
  const mediaUrl = getMediaUrl(item)!;
  const imgScale = interpolate(frame, [0, 300], [1.0, 1.05], { extrapolateRight: "clamp" });
  const panelProgress = spring({ frame, fps: fps, config: { damping: 16, stiffness: 140 } });
  const panelOpacity = interpolate(panelProgress, [0, 0.5], [0, 1], { extrapolateRight: "clamp" });
  const panelY = interpolate(panelProgress, [0, 1], [40, 0]);

  const PANEL_SIZE = 640;
  const PANEL_TOP = NETWORK_BAR_H + 60;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* Square panel centred horizontally */}
      <div style={{
        position: "absolute",
        top: PANEL_TOP,
        left: (1080 - PANEL_SIZE) / 2,
        width: PANEL_SIZE,
        height: PANEL_SIZE,
        borderRadius: 16,
        overflow: "hidden",
        opacity: panelOpacity,
        transform: `translateY(${panelY}px)`,
        boxShadow: `0 0 0 3px ${accent}88, 0 8px 60px rgba(0,0,0,0.8)`,
      }}>
        <MediaElement url={mediaUrl} scale={imgScale} />
      </div>

      {/* Text block below panel */}
      <div style={{
        position: "absolute",
        top: PANEL_TOP + PANEL_SIZE + 32,
        left: 0, right: 0,
        bottom: TICKER_H + 16,
        paddingLeft: 60, paddingRight: 60,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
      }}>
        <TextBlock item={item} accent={accent} frame={frame} fps={fps} durationInFrames={durationInFrames} index={index} />
      </div>
    </AbsoluteFill>
  );
};

// ── Layout D: No media — text fills frame with decorative elements ────────────

const LayoutNoMedia: React.FC<{ item: NewsItem; accent: string; frame: number; fps: number; durationInFrames: number; index: number }> = (
  { item, accent, frame, fps, durationInFrames, index }
) => {
  // Decorative animated diagonal lines (broadcast style)
  const lineOpacity = interpolate(frame, [0, 30], [0, 0.06], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* Decorative background accent lines */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: lineOpacity }} viewBox="0 0 1080 1920">
        {Array.from({ length: 14 }).map((_, i) => (
          <line key={i} x1={-200 + i * 110} y1={0} x2={200 + i * 110} y2={1920}
            stroke={accent} strokeWidth={1.5} />
        ))}
      </svg>

      {/* Large decorative network initial — top right */}
      <div style={{
        position: "absolute",
        top: NETWORK_BAR_H + 40,
        right: 40,
        fontSize: 320,
        fontFamily: '"Bebas Neue", "Oswald", Impact, sans-serif',
        color: accent,
        opacity: 0.04,
        lineHeight: 1,
        userSelect: "none",
        pointerEvents: "none",
      }}>
        {/* First letter of network name rendered via prop in parent; use placeholder */}
        H
      </div>

      {/* Text fills centre — vertically centred between bar and ticker */}
      <div style={{
        position: "absolute",
        top: NETWORK_BAR_H + 80,
        left: 0, right: 0,
        bottom: TICKER_H + 24,
        paddingLeft: 60, paddingRight: 60,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}>
        <TextBlock item={item} accent={accent} frame={frame} fps={fps} durationInFrames={durationInFrames} index={index} expanded />
      </div>

      {/* Bottom decorative line above ticker */}
      <div style={{
        position: "absolute",
        bottom: TICKER_H + 16,
        left: 60, right: 60,
        height: 2,
        background: `linear-gradient(to right, transparent, ${accent}88, transparent)`,
      }} />
    </AbsoluteFill>
  );
};

// ── Headline card — picks the right layout automatically ─────────────────────

interface CardProps {
  item: NewsItem;
  bulletinStyle?: "breaking" | "tech" | "corporate";
  index?: number;
}

const VerticalHeadlineCard: React.FC<CardProps> = ({ item, bulletinStyle = "breaking", index = 0 }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const accent = ACCENT[bulletinStyle];

  const fadeOutStart = durationInFrames - 18;
  const exitOpacity = frame >= fadeOutStart
    ? interpolate(frame, [fadeOutStart, durationInFrames], [1, 0], { extrapolateRight: "clamp" })
    : 1;

  const mediaUrl = getMediaUrl(item);
  const aspect = getAspect(item);

  let layout: React.ReactNode;
  if (!mediaUrl) {
    layout = <LayoutNoMedia item={item} accent={accent} frame={frame} fps={fps} durationInFrames={durationInFrames} index={index} />;
  } else if (aspect === "9:16-focus") {
    // Video/image fills frame, tiny text bar at bottom — viewer watches the media
    layout = <Layout916VideoFocus item={item} accent={accent} frame={frame} fps={fps} durationInFrames={durationInFrames} index={index} />;
  } else if (aspect === "9:16") {
    // Full-bleed background, text in lower half
    layout = <Layout916 item={item} accent={accent} frame={frame} fps={fps} durationInFrames={durationInFrames} index={index} />;
  } else if (aspect === "1:1") {
    layout = <Layout11 item={item} accent={accent} frame={frame} fps={fps} durationInFrames={durationInFrames} index={index} />;
  } else {
    // "16:9" default
    layout = <Layout169 item={item} accent={accent} frame={frame} fps={fps} durationInFrames={durationInFrames} index={index} />;
  }

  return (
    <AbsoluteFill style={{ opacity: exitOpacity, pointerEvents: "none" }}>
      {item.audioUrl && <Audio src={item.audioUrl} />}
      {layout}
    </AbsoluteFill>
  );
};

// ── "SON DAKİKA" vertical flash banner ───────────────────────────────────────

const BreakingFlash9x16: React.FC<{ networkName: string; bulletinStyle?: "breaking" | "tech" | "corporate" }> = (
  { networkName, bulletinStyle = "breaking" }
) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const accent = ACCENT[bulletinStyle];

  const progress = spring({ frame, fps, config: { damping: 14, stiffness: 200 } });
  const slideY = interpolate(progress, [0, 1], [-120, 0]);
  const opacity = interpolate(progress, [0, 0.5], [0, 1], { extrapolateRight: "clamp" });
  const flashOpacity = interpolate(frame, [0, 8, 16, 24, 30], [0, 0.6, 0.1, 0.5, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", inset: 0, backgroundColor: accent, opacity: flashOpacity, zIndex: 1 }} />
      <div style={{
        position: "absolute", top: "40%", left: 0, right: 0,
        transform: `translateY(${slideY}px)`, opacity, zIndex: 2,
        display: "flex", flexDirection: "column", alignItems: "center",
      }}>
        <div style={{ backgroundColor: accent, paddingTop: 24, paddingBottom: 24, paddingLeft: 80, paddingRight: 80, boxShadow: `0 0 60px ${accent}88` }}>
          <span style={{ color: "#FFFFFF", fontSize: 100, fontFamily: '"Bebas Neue","Oswald",Impact,sans-serif', letterSpacing: "0.12em", fontWeight: 900 }}>
            SON DAKİKA
          </span>
        </div>
        <div style={{ marginTop: 12 }}>
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 36, fontFamily: '"Montserrat",Arial,sans-serif', fontWeight: 600, letterSpacing: "0.14em" }}>
            {networkName.toUpperCase()}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Main 9:16 composition ────────────────────────────────────────────────────

export const NewsBulletin9x16: React.FC<BulletinProps> = ({
  items,
  ticker,
  networkName,
  style = "breaking",
  showLiveIndicator = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const accent = ACCENT[style];

  const barProgress = spring({ frame, fps, config: { damping: 14, stiffness: 160 } });
  const barY = interpolate(barProgress, [0, 1], [-NETWORK_BAR_H, 0]);
  const barOpacity = interpolate(barProgress, [0, 0.4], [0, 1], { extrapolateRight: "clamp" });
  const breathe = interpolate(Math.sin((frame / 120) * Math.PI * 2), [-1, 1], [0.97, 1.03]);

  const OVERLAY_START = 20;
  const OVERLAY_DUR = 50;
  const HEADLINES_START = 70;

  let cumulativeOffset = HEADLINES_START;
  const sequenced = items.map((item, idx) => {
    const from = cumulativeOffset;
    cumulativeOffset += item.duration;
    return { item, from, idx };
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <StudioBackground style={style} />

      {/* Network top bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: NETWORK_BAR_H,
        background: `linear-gradient(to right, ${accent} 0%, rgba(10,10,10,0.95) 70%, rgba(10,10,10,0.85) 100%)`,
        display: "flex", alignItems: "center", paddingLeft: 40, paddingRight: 40,
        transform: `translateY(${barY}px)`, opacity: barOpacity,
        zIndex: 10, borderBottom: `2px solid ${accent}`, boxShadow: `0 4px 32px ${accent}44`,
      }}>
        <span style={{
          color: "#FFFFFF", fontSize: 48,
          fontFamily: '"Bebas Neue","Oswald",Impact,sans-serif',
          letterSpacing: "0.14em", fontWeight: 900,
          transform: `scale(${breathe})`, display: "inline-block",
        }}>
          {networkName.toUpperCase()}
        </span>

        {showLiveIndicator && (
          <div style={{ marginLeft: 24, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 14, height: 14, borderRadius: "50%",
              backgroundColor: "#FF4444", boxShadow: "0 0 10px #FF4444",
              opacity: interpolate(Math.sin((frame / 30) * Math.PI), [-1, 1], [0.5, 1.0]),
            }} />
            <span style={{ color: "#FFFFFF", fontSize: 26, fontFamily: '"Montserrat",Arial,sans-serif', fontWeight: 700, letterSpacing: "0.12em" }}>
              CANLI
            </span>
          </div>
        )}
      </div>

      {/* Son Dakika flash */}
      <Sequence from={OVERLAY_START} durationInFrames={OVERLAY_DUR}>
        <BreakingFlash9x16 networkName={networkName} bulletinStyle={style} />
      </Sequence>

      {/* Headlines */}
      {sequenced.map(({ item, from, idx }) => (
        <Sequence key={idx} from={from} durationInFrames={item.duration}>
          <VerticalHeadlineCard item={item} bulletinStyle={style} index={idx} />
        </Sequence>
      ))}

      {/* Ticker */}
      <Sequence from={30}>
        <NewsTicker items={ticker} style={style} />
      </Sequence>
    </AbsoluteFill>
  );
};
