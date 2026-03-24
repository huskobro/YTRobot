# YTRobot Projesi — Claude.ai Bağlam Özeti

---

## Proje Nedir?

**YTRobot**, Python tabanlı bir YouTube video üretim pipeline'ıdır. Verilen bir konu veya script'ten başlayarak otomatik olarak şu adımları gerçekleştirir:

```
Script → TTS (seslendirme) → Görseller → Altyazılar → Video Kompozisyonu → Final MP4
```

Proje dizini: `/Users/huseyincoskun/Downloads/Antigravity Proje/YTRobot`

---

## Teknoloji Stack

| Alan | Teknoloji |
|------|-----------|
| Backend API | FastAPI + Uvicorn (`server.py`) |
| Video render | Remotion (React/TypeScript) |
| TTS | `speshaudio` (JSON API → audio URL) |
| Görseller | `zimage` provider |
| Altyazı | `pycaps` (animated) veya `ffmpeg` (soft embed) |
| Kompozisyon | MoviePy veya Remotion |
| Frontend UI | Alpine.js + Tailwind (tek dosya: `ui/index.html`) |
| Python env | `.venv` içinde, Python 3.14 |

---

## Dizin Yapısı

```
YTRobot/
├── server.py                  # FastAPI ana sunucu
├── config.py                  # Ayarlar ve API key'ler
├── main.py                    # CLI entry point
├── pipeline/
│   ├── script.py              # Script üretimi (LLM veya manuel)
│   ├── tts.py                 # TTS pipeline
│   ├── visuals.py             # Görsel pipeline
│   ├── subtitles.py           # Altyazı senkronizasyonu
│   ├── composer.py            # Video birleştirme
│   ├── news_fetcher.py        # RSS/OG haber çekme
│   └── news_bulletin.py       # Haber bülteni render pipeline
├── providers/
│   ├── tts/                   # TTS provider'ları
│   └── visuals/               # Görsel provider'ları
├── remotion/
│   └── src/templates/
│       └── news-bulletin/     # Ana Haber Bülteni Remotion şablonu
│           ├── NewsBulletin.tsx        # 16:9 kompozisyon
│           ├── NewsBulletin9x16.tsx    # 9:16 (Shorts/Reels)
│           ├── types.ts               # BulletinProps, NewsItem vb.
│           └── components/
│               ├── HeadlineCard.tsx
│               ├── LowerThird.tsx
│               ├── NewsTicker.tsx
│               ├── StudioBackground.tsx
│               ├── BreakingNewsOverlay.tsx
│               ├── CategoryFlash16x9.tsx
│               └── NewsImagePanel.tsx
├── ui/index.html              # Alpine.js frontend (tek dosya)
├── bulletin_sources.json      # RSS kaynak listesi
├── bulletin_history.json      # Dedup için kullanılmış URL'ler
└── presets/                   # Kaydedilmiş bülten preset'leri
```

---

## Haber Bülteni Modülü (Ana Geliştirme Alanı)

En aktif geliştirilen alan. Otomatik olarak RSS kaynaklarından haber çekip profesyonel yayın kalitesinde video üretir.

### Render Modları (`render_mode`)

- `combined` — Tüm haberler tek MP4
- `per_category` — Her kategori ayrı MP4 (spor.mp4, finans.mp4 vb.)
- `per_item` — Her haber ayrı MP4 (item_00.mp4, item_01.mp4 vb.)

### Görsel Stiller (`style`)

`breaking` | `tech` | `corporate` | `sport` | `finance` | `weather` | `science` | `entertainment` | `dark`

### Kategori → Şablon Eşleştirme

```json
{"spor": "sport", "finans": "finance", "teknoloji": "tech"}
```

### Kategori Geçiş Animasyonu (`show_category_flash`)

Her haber öncesinde 1.5 saniyelik fullscreen kategori flash ekranı.
- 9:16: Dikey, yukarıdan kayan badge
- 16:9: Yatay, soldan kayan ok-şekilli badge

### Kanal Preset Sistemi

Preset'ler `presets/` klasöründe JSON olarak saklanır. Her preset: network adı, stil, kategori-şablon eşleşmesi, ticker, lower third ayarlarını içerir.

### Deduplication (History)

`bulletin_history.json` dosyasında preset başına kullanılmış URL'ler tutulur. Draft çekerken aynı preset'te daha önce kullanılan haberler otomatik atlanır.

---

## API Endpoint'leri

```
POST /api/bulletin/draft                    # Kaynaklardan haber çek
POST /api/bulletin/render                   # Video render başlat
GET  /api/bulletin/render/{bid}             # Render durumu sorgula
POST /api/bulletin/render/{bid}/stop        # Durdur
POST /api/bulletin/render/{bid}/pause       # Duraklat
POST /api/bulletin/render/{bid}/resume      # Devam et
GET  /api/bulletin/history                  # Kullanılmış URL'ler
DELETE /api/bulletin/history/{preset}       # History temizle
GET  /api/bulletin/sources                  # Kaynak listesi
POST /api/bulletin/sources                  # Kaynak ekle/güncelle
```

---

## BulletinRenderReq Alanları (server.py)

```python
items: list                    # Seçilen haber item'ları
network_name: str              # Kanal adı
style: str = "breaking"        # Global görsel stil
fps: int = 60
format: str = "16:9"           # "16:9" veya "9:16"
ticker: list = []
preset_name: str = ""          # History dedup için
category_templates: dict = {}  # {kategori: stil}
render_mode: str = "combined"  # "combined"|"per_category"|"per_item"
render_per_category: bool      # Deprecated — render_mode kullan
show_category_flash: bool      # Geçiş animasyonu
lower_third_enabled: bool
lower_third_text: str
ticker_enabled: bool
ticker_speed: int
show_live: bool
```

---

## Remotion Şablon Detayları

### NewsItem Tipi (`types.ts`)

```typescript
interface NewsItem {
  headline: string;
  subtext?: string;
  duration: number;          // frame sayısı
  imageUrl?: string;
  mediaUrl?: string;         // image veya video URL
  mediaAspect?: "16:9" | "9:16" | "9:16-focus" | "1:1";
  audioUrl?: string;
  subtitles?: SubtitleEntry[];
  language?: string;
  styleOverride?: string;    // per-item stil override
}
```

### BulletinProps (`types.ts`)

```typescript
interface BulletinProps {
  items: NewsItem[];
  ticker: TickerItem[];
  networkName: string;
  style?: "breaking" | "tech" | "corporate" | "sport" | "finance" | "weather" | "science" | "entertainment" | "dark";
  logoUrl?: string;
  fps?: number;
  showLiveIndicator?: boolean;
  showCategoryFlash?: boolean;
}
```

### Sequence Zamanlaması (60fps)

```
Frame 0–60:   Background + network bar fade in
Frame 20–80:  BreakingNewsOverlay (Son Dakika flash)
Frame 90+:    Haberler sıralı
  └─ showCategoryFlash=true ise: her haber için +90 frame flash prefix
Ticker:       Frame 30'dan itibaren sürekli
```

### Layout Tipleri (9:16)

- **Layout169**: Üst panel görsel + alt panel metin (fillHeight=true ile tam dolu)
- **LayoutFullscreen**: Tam ekran görsel, altyazı overlay
- **LayoutVertical**: 9:16 dikey video arka plan

---

## Altyazı Sistemi

- **Segment-anchored alignment**: Whisper segment sınırlarını metin fraksiyonlarına eşler
- **Karaoke modu**: Kelime bazlı highlight, accent rengi kategori stilinden alınır
- **SubtitleEntry format**: `{text, startFrame, endFrame, words?: [{word, startFrame, endFrame}]}`
- Altyazı ve subtext **birbirini dışlar** — ikisi aynı anda gösterilmez

---

## Frontend (Alpine.js)

`ui/index.html` tek dosyadır, tüm state Alpine.js `app()` fonksiyonundadır.

### Önemli State Alanları

```javascript
bulletinRenderMode: 'combined'      // render modu
bulletinShowCategoryFlash: false    // geçiş animasyonu
bulletinActivePreset: ''            // aktif preset adı
categoryTemplates: {}               // {kategori: stil}
bulletinHistory: {}                 // kullanılmış URL'ler
bulletinSelectedSources: []         // seçili kaynak id'leri
bulletinSelectAllSources: true
```

### Tablar

1. **Draft** — Haber çek, seçim yap, render başlat
2. **Sources** — RSS kaynakları yönet, kategori→şablon eşleştir
3. **Presets** — Kaydedilmiş konfigürasyonlar
4. **Settings** — Global ayarlar (lower third, ticker, live indicator vb.)

---

## Son Yapılan Değişiklikler

1. **Render modu seçici**: Tekli toggle → 3-seçenekli radio group
2. **CategoryFlash9x16**: 9:16 için dikey kategori flash bileşeni
3. **CategoryFlash16x9**: 16:9 için yatay ok-badge flash bileşeni
4. **TextBlock fillHeight**: Layout169'da metin alanı tam yüksekliği doldurur
5. **Per-item render**: Her haberi ayrı ayrı kendi stiliyle render etme
6. **History deduplication**: Preset başına kullanılmış haberler atlanır
7. **Kaynak seçimi**: Draft'ta hangi RSS kaynaklarının kullanılacağı seçilebilir
8. **Render ilerleme**: %, adım etiketi, ETA, durdur/duraklat/devam kontrolleri

---

## Sunucuyu Başlatma

```bash
cd "/Users/huseyincoskun/Downloads/Antigravity Proje/YTRobot"
.venv/bin/python server.py
# → http://localhost:8000
```
