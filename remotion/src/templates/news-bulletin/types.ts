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

export interface NewsItem {
  /** Main headline text — capitalised, ≤ 8 words ideally */
  headline: string;
  /** 1-line supporting detail */
  subtext?: string;
  /** How long to show this item, in frames */
  duration: number;
  /** HTTP URL to the news image (shown in right panel) — kept for backward compat */
  imageUrl?: string;
  /**
   * HTTP URL to the primary media asset.
   * Can be an image (.jpg/.png) or a video (.mp4/.webm).
   * When provided, imageUrl is ignored.
   */
  mediaUrl?: string;
  /**
   * Aspect ratio hint for the media asset.
   * "16:9" → wide image/video (default upper panel in 9:16, right panel in 16:9)
   * "9:16" → vertical video (fills full background in 9:16, or right panel cropped in 16:9)
   * "1:1"  → square image (centred panel)
   * When omitted, defaults to "16:9".
   */
  mediaAspect?: "16:9" | "9:16" | "9:16-focus" | "1:1";
  /** HTTP URL to the narration audio file */
  audioUrl?: string;
  /** Karaoke-style subtitle entries (frame-accurate, relative to item start) */
  subtitles?: SubtitleEntry[];
  /** Language of narration — used by TTS pipeline */
  language?: string;
}

export interface TickerItem {
  text: string;
}

export interface BulletinProps {
  /** Array of news headlines shown sequentially */
  items: NewsItem[];
  /** Bottom-crawl ticker items */
  ticker: TickerItem[];
  /** Network / channel name shown in the top bar */
  networkName: string;
  /** Visual style — defaults to 'breaking' */
  style?:
    | "breaking"
    | "tech"
    | "corporate"
    | "sport"
    | "finance"
    | "weather"
    | "science"
    | "entertainment"
    | "dark";
  /** Optional logo image URL */
  logoUrl?: string;
  /** Frames per second — default 60 */
  fps?: number;
  /**
   * Show a pulsing live/on-air dot + label next to the network name.
   * Defaults to false — pass true to enable.
   */
  showLiveIndicator?: boolean;
}

export const defaultBulletinProps: BulletinProps = {
  networkName: "YTRobot Haber",
  style: "breaking",
  items: [
    {
      headline: "SON DAKİKA: Önemli Gelişme",
      subtext: "Kaynaklardan edinilen bilgiye göre açıklama yapıldı.",
      duration: 180,
    },
    {
      headline: "EKONOMİDE YENİ ADIMLAR",
      subtext: "Merkez Bankası faiz kararını açıkladı.",
      duration: 180,
    },
    {
      headline: "GÜNDEM: Dijital Dönüşüm",
      subtext: "Yapay zeka alanında kritik gelişmeler yaşanıyor.",
      duration: 180,
    },
  ],
  ticker: [
    { text: "• Hava durumu: İstanbul'da parçalı bulutlu" },
    { text: "• Dolar/TL: Güncel kur takip ediliyor" },
    { text: "• Spor: Beşiktaş deplasmanda galip geldi" },
    { text: "• Teknoloji: Yeni model tanıtıldı" },
    { text: "• Sağlık Bakanlığı açıklama yaptı" },
  ],
};
