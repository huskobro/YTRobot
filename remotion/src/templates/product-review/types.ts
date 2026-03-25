// ── Product Review / Affiliate Video Types ──────────────────────────────────

export interface SubtitleWord {
  word: string;
  startFrame: number;
  endFrame: number;
}

export interface SubtitleEntry {
  text: string;
  startFrame: number;
  endFrame: number;
  words?: SubtitleWord[];
}

export interface ProductItem {
  /** Product display name */
  name: string;
  /** Current price */
  price: number;
  /** Original price before discount (optional — shows discount % if provided) */
  originalPrice?: number;
  /** Currency symbol: "TL", "$", "€" */
  currency: string;
  /** Star rating out of 5 (can be fractional e.g. 4.2) */
  rating: number;
  /** Total number of user reviews */
  reviewCount: number;
  /** HTTP URL to the main product image */
  imageUrl?: string;
  /** Additional product image URLs (gallery) */
  galleryUrls?: string[];
  /** Advantage bullet points (3-5 recommended) */
  pros: string[];
  /** Disadvantage bullet points (2-3 recommended, builds trust) */
  cons: string[];
  /** Value-for-money score 1-10 */
  score: number;
  /** Final verdict text (1-2 sentences) */
  verdict: string;
  /** Call-to-action text (e.g. "Linke tıkla!", "Sepete ekle") */
  ctaText?: string;
  /** Top user comments to show as floating pop-ups */
  topComments?: string[];
  /** Product category (e.g. "Kulaklık", "Telefon") */
  category?: string;
  /** Marketplace platform name */
  platform?: string;
  /** Narration audio URL */
  audioUrl?: string;
  /** Karaoke-style subtitles */
  subtitles?: SubtitleEntry[];
}

export type ProductReviewStyle = "modern" | "dark" | "energetic" | "minimal" | "premium";

export interface SceneDurations {
  hook?: number;
  stats?: number;
  pros?: number;
  cons?: number;
  verdict?: number;
}

/** Timing data for a single pro/con item (driven by audio narration) */
export interface ItemTiming {
  /** Frame at which this item's narration starts (relative to scene start) */
  startFrame: number;
  /** Frame at which this item's narration ends (relative to scene start) */
  endFrame: number;
}

/** Per-scene narration timing — when provided, scenes and items are audio-synced */
export interface NarrationTiming {
  hook?: { startFrame: number; endFrame: number };
  stats?: { startFrame: number; endFrame: number };
  pros?: { startFrame: number; endFrame: number; items?: ItemTiming[] };
  cons?: { startFrame: number; endFrame: number; items?: ItemTiming[] };
  verdict?: { startFrame: number; endFrame: number };
}

export interface ProductReviewProps {
  /** The product being reviewed */
  product: ProductItem;
  /** Visual style preset */
  style?: ProductReviewStyle;
  /** Frames per second */
  fps?: number;
  /** Channel / creator name shown in top bar */
  channelName?: string;
  /** Override default scene durations (in frames) */
  sceneDurations?: SceneDurations;
  /** Audio-driven timing — when present, overrides sceneDurations */
  narrationTiming?: NarrationTiming;
}

// ── Style Palettes ──────────────────────────────────────────────────────────

export interface StylePalette {
  bg: string;
  bgGradient: string;
  accent: string;
  secondary: string;
  text: string;
  textMuted: string;
  cardBg: string;
  cardBorder: string;
  proBg: string;
  conBg: string;
}

export const STYLE_PALETTES: Record<ProductReviewStyle, StylePalette> = {
  modern: {
    bg: "#F0F2F5",
    bgGradient: "linear-gradient(135deg, #F0F2F5 0%, #E2E8F0 50%, #F0F2F5 100%)",
    accent: "#4F46E5",
    secondary: "#7C3AED",
    text: "#1A1A2E",
    textMuted: "#64748B",
    cardBg: "#FFFFFF",
    cardBorder: "rgba(79,70,229,0.15)",
    proBg: "rgba(16,185,129,0.08)",
    conBg: "rgba(239,68,68,0.08)",
  },
  dark: {
    bg: "#0F0F0F",
    bgGradient: "linear-gradient(135deg, #0F0F0F 0%, #1A1A2E 50%, #0F0F0F 100%)",
    accent: "#00D4FF",
    secondary: "#00FF88",
    text: "#F5F5F5",
    textMuted: "#94A3B8",
    cardBg: "rgba(255,255,255,0.06)",
    cardBorder: "rgba(0,212,255,0.2)",
    proBg: "rgba(0,255,136,0.08)",
    conBg: "rgba(255,68,68,0.08)",
  },
  energetic: {
    bg: "#1A1A2E",
    bgGradient: "linear-gradient(135deg, #1A1A2E 0%, #16213E 50%, #0F3460 100%)",
    accent: "#FF6B35",
    secondary: "#FFD700",
    text: "#FFFFFF",
    textMuted: "#B0BEC5",
    cardBg: "rgba(255,107,53,0.08)",
    cardBorder: "rgba(255,107,53,0.25)",
    proBg: "rgba(255,215,0,0.1)",
    conBg: "rgba(255,68,68,0.1)",
  },
  minimal: {
    bg: "#FFFFFF",
    bgGradient: "linear-gradient(180deg, #FFFFFF 0%, #FAFAFA 100%)",
    accent: "#1A1A1A",
    secondary: "#6B7280",
    text: "#111827",
    textMuted: "#9CA3AF",
    cardBg: "#F9FAFB",
    cardBorder: "rgba(0,0,0,0.08)",
    proBg: "rgba(0,0,0,0.03)",
    conBg: "rgba(0,0,0,0.03)",
  },
  premium: {
    bg: "#0A0A0A",
    bgGradient: "linear-gradient(135deg, #0A0A0A 0%, #1A1510 50%, #0A0A0A 100%)",
    accent: "#D4AF37",
    secondary: "#F5E6B8",
    text: "#F5F0E8",
    textMuted: "#A09880",
    cardBg: "rgba(212,175,55,0.06)",
    cardBorder: "rgba(212,175,55,0.2)",
    proBg: "rgba(212,175,55,0.08)",
    conBg: "rgba(239,68,68,0.08)",
  },
};

// ── Platform name extraction ────────────────────────────────────────────────

export const PLATFORM_COLORS: Record<string, string> = {
  amazon: "#FF9900",
  trendyol: "#F27A1A",
  hepsiburada: "#FF6000",
  n11: "#7849B8",
  gittigidiyor: "#4B0082",
  ciceksepeti: "#E91E63",
  default: "#6B7280",
};

// ── Default scene durations (frames at 60fps) ──────────────────────────────
// Total: 180 + 360 + 540 + 270 + 540 = 1890 frames = 31.5s (well under 58s)

export const DEFAULT_DURATIONS: Required<SceneDurations> = {
  hook: 180,    // 3s
  stats: 360,   // 6s
  pros: 540,    // 9s — ~3s per pro item (3 items)
  cons: 270,    // 4.5s — ~2.25s per con item (2 items)
  verdict: 540, // 9s
};

/** Calculate scene durations dynamically based on content */
export function calculateDurations(
  product: ProductItem,
  overrides?: SceneDurations,
  fps: number = 60,
): Required<SceneDurations> {
  const prosCount = product.pros.length || 3;
  const consCount = product.cons.length || 2;

  // Auto-calculate based on content, capped at 58s total
  const auto: Required<SceneDurations> = {
    hook: Math.round(fps * 3),                          // 3s fixed
    stats: Math.round(fps * 6),                          // 6s fixed
    pros: Math.round(fps * Math.min(prosCount * 3, 15)), // 3s per item, max 15s
    cons: Math.round(fps * Math.min(consCount * 2.5, 8)),// 2.5s per item, max 8s
    verdict: Math.round(fps * 8),                        // 8s fixed
  };

  // Apply user overrides
  const result: Required<SceneDurations> = {
    hook: overrides?.hook ?? auto.hook,
    stats: overrides?.stats ?? auto.stats,
    pros: overrides?.pros ?? auto.pros,
    cons: overrides?.cons ?? auto.cons,
    verdict: overrides?.verdict ?? auto.verdict,
  };

  // Enforce 58s platform limit
  const totalFrames = result.hook + result.stats + result.pros + result.cons + result.verdict;
  const maxFrames = fps * 58;
  if (totalFrames > maxFrames) {
    const scale = maxFrames / totalFrames;
    result.hook = Math.round(result.hook * scale);
    result.stats = Math.round(result.stats * scale);
    result.pros = Math.round(result.pros * scale);
    result.cons = Math.round(result.cons * scale);
    result.verdict = Math.round(result.verdict * scale);
  }

  return result;
}

// ── Default Props ───────────────────────────────────────────────────────────

export const defaultProductReviewProps: ProductReviewProps = {
  product: {
    name: "Sony WH-1000XM5 Kablosuz Kulaklık",
    price: 1299,
    originalPrice: 1899,
    currency: "TL",
    rating: 4.2,
    reviewCount: 2847,
    pros: [
      "12 saat kesintisiz pil ömrü",
      "Üstün ses kalitesi — dengeli bass ve tiz",
      "10 dakikada 2 saat hızlı şarj",
    ],
    cons: [
      "ANC performansı rakiplerine göre ortalama",
      "Kutu içeriği yetersiz — adaptör yok",
    ],
    score: 7,
    verdict: "Fiyatına göre kategorisinde en iyi kablosuz kulaklık seçeneklerinden biri.",
    ctaText: "Linke tıkla!",
    topComments: [
      "Paketleme çok kaliteli geldi",
      "Ses kalitesi muhteşem",
      "Pil ömrü gerçekten 12 saat",
      "Çok hafif ve rahat",
      "ANC biraz zayıf kaldı",
    ],
    category: "Kulaklık",
    platform: "trendyol",
  },
  style: "modern",
  channelName: "YTRobot İnceleme",
};
