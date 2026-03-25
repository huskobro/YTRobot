# YTRobot Projesi — Claude.ai Kapsamlı Bağlam Dosyası

Bu dosya, Claude AI'nın (veya diğer asistanların) bu proje üzerinde çalışırken ihtiyaç duyabileceği tüm mimari, teknolojik ve işlevsel detayları içerir. **En güncel hal (25 Mart 2026) taranarak oluşturulmuştur.**

---

## 1. Proje Genel Tanımı

**YTRobot**, profesyonel kalitede YouTube videolarını (Haber Bülteni, Shorts, Ürün İnceleme) tamamen otomatik veya yarı-otomatik olarak üreten Python tabanlı bir "Automated Video Production" platformudur.

### Ana Modüller:
1.  **Haber Bülteni (News Bulletin):** RSS/Kaynaklardan haber çekip, 16:9 veya 9:16 formatında profesyonel yayın grafiklerine sahip haber videoları üretir.
2.  **Genel Video (YT Video):** Bir konu veya hazır script'ten yola çıkarak stok video, seslendirme ve altyazı içeren videolar üretir.
3.  **Ürün İnceleme (Product Review):** Belirli ürünler için yapay zeka ile senaryo yazıp inceme videoları hazırlar.

---

## 2. Teknoloji Stack

| Katman | Teknoloji / Kütüphane | Detay |
| :--- | :--- | :--- |
| **Backend API** | FastAPI + Uvicorn | `server.py` (Asenkron, thread-based job yönetimi) |
| **Core Logic** | Python 3.14 | `pipeline/` klasörü altındaki modüller |
| **Video Rendering** | **Remotion** (Birincil) | React + TypeScript (`remotion/` klasörü) |
| **Video Rendering** | MoviePy (İkincil) | FFmpeg tabanlı Python kütüphanesi |
| **Frontend UI** | Alpine.js + Tailwind | `ui/index.html` (Single-file SPA approach) |
| **LLM / AI** | Kie.ai (Gemini 2.5 Flash) | Temel script ve metadata üretimi için kullanılır |
| **LLM / AI** | OpenAI / Anthropic | Yedek veya gelişmiş analizler için kullanılır |
| **TTS (Seslendirme)** | SpeshAudio, OpenAI, ElevenLabs | `speshaudio` Türkçe için öncelikli tercihtir |
| **Görseller** | ZImage, Pexels, Pixabay | Stok videolar ve AI tabanlı görseller |
| **Altyazı** | Pycaps | CSS tabanlı modern/hareketli altyazılar |

---

## 3. Mimari ve Dizin Yapısı

```bash
YTRobot/
├── server.py                  # FastAPI sunucusu ve API endpointleri
├── config.py                  # Pydantic tabanlı ayar yönetimi (.env kullanılır)
├── main.py                    # CLI entry point ve pipeline orkestrasyonu
├── ytrobot.sh                 # Tek komutla sunucuları başlatma/durdurma scripti
├── pipeline/                  # İş akışı mantığı
│   ├── script.py              # Senaryo yazımı (LLM/Dikte)
│   ├── tts.py                 # Seslendirme yönetimi
│   ├── visuals.py             # Stok video/görsel eşleştirme
│   ├── subtitles.py           # Altyazı senkronu (Whisper entegrasyonu)
│   ├── composer.py            # Backendlere (Remotion/MoviePy) iş gönderme
│   ├── news_fetcher.py        # Haber çekme ve draft temizleme
│   └── news_bulletin.py       # Haber bültenine özel hazırlık pipeline'ı
├── providers/                 # Dış servis entegrasyonları
├── remotion/                  # React Tabanlı Video Motoru
│   ├── src/templates/         # Video şablonları (News, Product Review vb.)
│   └── src/index.ts           # Remotion giriş noktası
├── ui/                        # Web Arayüzü
│   └── index.html             # Alpine.js tabanlı dashboard
├── output/                    # Üretilen her video için session klasörleri
├── presets/                   # Kanal ayarları (JSON formatında)
├── bulletin_sources.json      # RSS/Haber kaynakları listesi
└── bulletin_history.json      # Kullanılmış haberleri takibi (Deduplication)
```

---

## 4. Kritik İş Akışları (Workflows)

### A. Haber Bülteni (News Bulletin) Akışı
1.  **Draft:** `news_fetcher.py` ile RSS kaynaklarından haberler çekilir. `bulletin_history.json` kullanılarak daha önce üretilmiş haberler elenir.
2.  **Seçim:** Kullanıcı UI üzerinden haberleri seçer ve sıralar.
3.  **Haber Grubu Hazırlığı:** Seçilen her haber için LLM ile seslendirme metni yazılır, görseller bulunur.
4.  **Render:** 
    - `combined`: Tüm haberler tek video.
    - `per_category`: Haberleri kategorilerine göre bölerek birden fazla video üretir.
    - `per_item`: Her haber için ayrı tekil video üretir.
5.  **Görsel Şablonlar:** Kategori ismine göre (`spor` -> `sport`, `finans` -> `finance` vb.) Remotion stili otomatik seçilir.

### B. Video Re-do (Yeniden Yap)
`redo.py` scripti, mevcut bir session üzerinde sadece belirli aşamaları (örneğin sadece altyazıyı veya sadece görselleri) değiştirip tekrar render almayı sağlar.

### C. Altyazı Sistemi (Subtitles)
- **Pycaps:** Modern, "hype" stili, kelime kelime yanan altyazılar üretir.
- **Whisper Entegrasyonu:** Ses dosyaları Whisper ile taranarak mükemmel zamanlama elde edilir.
- **Karaoke:** Remotion şablonlarında kelime bazlı vurgulama (Karaoke) desteği vardır.

---

## 5. Yapılandırma ve Ortam Değişkenleri (.env)

Proje çalışması için şu anahtarların `.env` dosyasında bulunması gerekir:
- `KIEAI_API_KEY`: Gemini 2.5 Flash için temel AI anahtarı.
- `OPENAI_API_KEY`: Alternatif LLM ve TTS için.
- `SPESHAUDIO_API_KEY`: Türkçe seslendirme için en önemli anahtar.
- `PEXELS_API_KEY` / `PIXABAY_API_KEY`: Stok videolar için.
- `COMPOSER_PROVIDER`: `remotion` olarak set edilmelidir (yüksek kalite için).

---

## 6. Geliştiriciler (Claude) İçin İpuçları

1.  **Remotion Değişiklikleri:** `remotion/src` altındaki `.tsx` dosyaları değiştirildiğinde `npm run studio` açık olduğu sürece anlık izlenebilir. Render testi için `server.py` üzerinden tetikleme yapılır.
2.  **Log Takibi:** API hataları `logs/api.log`, Remotion hataları `logs/remotion.log` içindedir.
3.  **Portlar:** Dashboard `8080`, Remotion Studio `3000` portunda çalışır.
4.  **Hata Giderme:** Eğer video render'da görsel donması oluyorsa `pipeline/visuals.py` tarafında videonun süresi ile sesin süresinin eşleşip eşleşmediği (Loop/Trim) kontrol edilmelidir.
5.  **Yeni Haber Kaynağı:** `bulletin_sources.json` dosyasına eklenen yeni bir RSS, draft sayfasında hemen görünür hale gelir.

---

## 7. Dosya İsimlendirme Kuralları (Output)
`output/` klasörü altında tarih formatında (`YYYYMMDD_HHMMSS`) veya `bul_` / `pr_` ön ekiyle sessionlar oluşturulur. Her session içinde:
- `script.json`: AI tarafından yazılan bölümler.
- `audio/`: Her sahne için ses dosyaları.
- `clips/`: Her sahne için görsel dosyalar.
- `metadata.json`: Başlık, açıklama ve etiketler.
- `final_output.mp4`: Nihai video.

---
**Not:** Bu dosya proje her değiştiğinde güncellenmeli veya taranarak hafızaya alınmalıdır.
