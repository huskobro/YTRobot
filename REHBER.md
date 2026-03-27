# YTRobot v2 — Kapsamlı Kullanım Rehberi

> **Son Güncelleme:** 27 Mart 2026
> Bu rehber YTRobot'un tüm özelliklerini, ayarlarını ve kullanım adımlarını kapsamlı şekilde anlatır.

---

## İçindekiler

1. [Genel Bakış](#1-genel-bakış)
2. [Kurulum](#2-kurulum)
3. [Sunucuyu Başlatma](#3-sunucuyu-başlatma)
4. [Dashboard (Panel)](#4-dashboard-panel)
5. [Yeni Video Oluşturma (Wizard)](#5-yeni-video-oluşturma-wizard)
6. [Haber Bülteni (Bulletin)](#6-haber-bülteni-bulletin)
7. [Ürün İnceleme (Product Review)](#7-ürün-inceleme-product-review)
8. [Gallery (Galeri)](#8-gallery-galeri)
9. [Kanal Yönetimi (Channels)](#9-kanal-yönetimi-channels)
10. [YouTube Entegrasyonu](#10-youtube-entegrasyonu)
11. [Zamanlayıcı (Scheduler)](#11-zamanlayıcı-scheduler)
12. [İçerik Takvimi (Calendar)](#12-içerik-takvimi-calendar)
13. [A/B Testi](#13-ab-testi)
14. [Oynatma Listeleri (Playlists)](#14-oynatma-listeleri-playlists)
15. [Video Şablonları (Templates)](#15-video-şablonları-templates)
16. [Sosyal Medya Metadata](#16-sosyal-medya-metadata)
17. [SEO Analizi](#17-seo-analizi)
18. [Rakip Analizi (Competitor)](#18-rakip-analizi-competitor)
19. [Analytics (Analiz Paneli)](#19-analytics-analiz-paneli)
20. [YouTube Analytics](#20-youtube-analytics)
21. [Bildirim Sistemi](#21-bildirim-sistemi)
22. [Ayarlar (Settings)](#22-ayarlar-settings)
23. [API Anahtarları](#23-api-anahtarları)
24. [Güvenli Depolama (Secure Storage)](#24-güvenli-depolama-secure-storage)
25. [Denetim Günlüğü (Audit Log)](#25-denetim-günlüğü-audit-log)
26. [Tema ve Dil](#26-tema-ve-dil)
27. [Teknik Mimari](#27-teknik-mimari)
28. [Sorun Giderme (Troubleshooting)](#28-sorun-giderme-troubleshooting)

---

## 1. Genel Bakış

YTRobot, otomatik YouTube video üretim platformudur. Bir konu veya script vererek, yapay zeka destekli pipeline ile tam teşekküllü videolar üretir:

```
Konu/Script → AI Script Yazımı → Seslendirme (TTS) → Görsel Arama/Üretim → Altyazı → Video Birleştirme → Çıktı
```

### Ne Yapabilirsiniz?

| Özellik | Açıklama |
|---------|----------|
| **Normal Video** | Konu girip tam otomatik uzun-format video üretme |
| **Haber Bülteni** | RSS kaynaklarından otomatik haber videosu oluşturma |
| **Ürün İnceleme** | Ürün bilgilerinden tanıtım videosu üretme |
| **YouTube Yükleme** | Videoları direkt YouTube'a yükleme |
| **Zamanlanmış Yayın** | Gelecek tarihli otomatik YouTube yükleme |
| **A/B Testi** | Farklı başlıkları karşılaştırma |
| **İçerik Takvimi** | Video planlarınızı takvimde organize etme |
| **Rakip Analizi** | Rakip kanalların başlıklarını analiz etme |
| **SEO Skoru** | Video metadata'nızı otomatik puanlama |
| **Çoklu Kanal** | Farklı kanallar için farklı ayarlar |
| **Bildirimler** | Telegram, E-posta, WhatsApp, Discord, Slack bildirimleri |

### 3 Video Modülü

1. **Normal Video (YT Video)**: Herhangi bir konuda uzun-format video
2. **Haber Bülteni (Bulletin)**: RSS kaynaklarından haber derlemesi
3. **Ürün İnceleme (Product Review)**: Ürün tanıtım/değerlendirme videosu

---

## 2. Kurulum

### Gereksinimler

- Python 3.10+ (projenin kullandığı: 3.14)
- Node.js 18+ (Remotion composer için)
- FFmpeg (sistem genelinde kurulu olmalı)
- 4GB+ RAM önerilir

### Adımlar

```bash
# 1. Projeyi indir/klonla
cd YTRobot

# 2. Python sanal ortam oluştur
python -m venv .venv
source .venv/bin/activate  # macOS/Linux
# veya: .venv\Scripts\activate  # Windows

# 3. Bağımlılıkları yükle
pip install -r requirements.txt

# 4. .env dosyası oluştur (API anahtarlarını buraya yaz)
cp .env.example .env  # veya manuel oluştur

# 5. Remotion bağımlılıkları (opsiyonel — Remotion composer kullanacaksan)
cd remotion && npm install && cd ..
```

### Minimum .env Dosyası

```env
# En az bir TTS provider gerekli
TTS_PROVIDER=edge           # Ücretsiz, API key gerekmez
# veya
TTS_PROVIDER=openai
OPENAI_API_KEY=sk-...

# En az bir görsel provider gerekli
VISUALS_PROVIDER=pexels
PEXELS_API_KEY=...

# Script üretimi için (opsiyonel — manuel script de yazabilirsin)
KIEAI_API_KEY=...           # Gemini 2.5 Flash (tercih edilen)
# veya
OPENAI_API_KEY=sk-...
```

---

## 3. Sunucuyu Başlatma

```bash
# Sanal ortamı aktive et
source .venv/bin/activate

# Sunucuyu başlat
python server.py
```

Sunucu **http://localhost:5005** adresinde açılır. Tarayıcıdan bu adresi ziyaret et.

### İlk Açılışta Göreceğin Ekran

- Sol tarafta **sidebar** navigasyon menüsü
- Sağ tarafta **Dashboard** ana panel
- Üstte **bildirim zili** ve **tema değiştirici**
- Altta **dil seçici** (TR/EN)

---

## 4. Dashboard (Panel)

Dashboard, sisteme giriş yaptığında karşına çıkan ana ekrandır.

### Gösterdiği Bilgiler

| Widget | Açıklama |
|--------|----------|
| **Toplam Video** | Şimdiye kadar üretilen toplam video sayısı |
| **Başarı Oranı** | Tamamlanan / toplam video yüzdesi |
| **Ortalama Süre** | Bir videonun render süresi ortalaması |
| **Aktif Kuyruk** | Şu an sırada bekleyen veya üretilen video sayısı |
| **Son Videolar** | En son üretilen 10 videonun listesi (başlık, durum, tarih) |
| **Hızlı Aksiyonlar** | "Yeni Video", "Bülten", "Ürün İnceleme" butonları |

### Modül Filtresi

Dashboard'da sağ üstte filtre butonları var:
- **Tümü**: Tüm modüllerin verilerini göster
- **Normal Video**: Sadece YT Video verilerini göster
- **Bülten**: Sadece haber bülteni verilerini göster
- **Ürün İnceleme**: Sadece ürün videosu verilerini göster

---

## 5. Yeni Video Oluşturma (Wizard)

Sol menüden **"Yeni Video"** butonuna tıkla. 4 adımlık bir sihirbaz açılır:

### Adım 1: Modül Seçimi

3 modülden birini seç:

| Modül | Ne Üretir | Ne Zaman Kullanılır |
|-------|----------|-------------------|
| **Normal Video** | Herhangi konuda uzun-format video | Eğitim, bilgi, motivasyon, liste videoları |
| **Haber Bülteni** | Haber derlemesi videosu | Güncel haberlerden otomatik video |
| **Ürün İnceleme** | Ürün tanıtım videosu | E-ticaret, affiliate, sponsorlu içerik |

### Adım 2: Yapılandırma

#### Normal Video İçin:
- **Mod seçimi**: "Konu" (AI script yazar) veya "Script" (kendi scriptini yaz)
- **Konu**: Video konusunu yaz (ör: "Kedilerin 10 İlginç Özelliği")
- **Dil**: Script ve seslendirme dili
- **Sahne sayısı**: Videodaki bölüm sayısı (5–15 arası önerilir)
- **Kalite profili**: quick_draft (hızlı), standard (normal), cinematic (yüksek kalite)
- **Kanal seçimi**: Hangi kanal için üretilecek (çoklu kanal varsa)

#### Haber Bülteni İçin:
- Kaynaklardan haber seçimi
- Bülten stili (breaking/tech/corporate)
- Maksimum haber sayısı

#### Ürün İnceleme İçin:
- Ürün adı, fiyat, puan, artılar/eksiler
- Ürün görselleri
- Otomatik URL'den bilgi çekme (autofill)

### Adım 3: Stil (Sadece Normal Video)

Bu adımda videonun görsel stilini ayarlarsın:

| Ayar | Açıklama | Seçenekler |
|------|----------|-----------|
| **Altyazı Fontu** | Altyazı yazı tipi | serif, sans, roboto, montserrat, oswald, bebas, inter |
| **Altyazı Boyutu** | Yazı büyüklüğü (px) | 40–100 arası (önerilen: 65–75) |
| **Altyazı Rengi** | Yazı rengi | Renk seçici (#ffffff varsayılan) |
| **Altyazı Arkaplanı** | Yazı arkasındaki kutu | none (yok), box (kutu), pill (yuvarlak) |
| **Altyazı Animasyonu** | Yazı giriş efekti | hype, explosive, vibrant, minimal, none |
| **Karaoke** | Kelime kelime vurgulama | Açık/Kapalı + vurgu rengi |
| **Ken Burns Efekti** | Zoom ve pan hareketi | zoom seviyesi + yön (center/pan-left/pan-right/random) |
| **Video Efekti** | Renk filtresi | none, vignette, warm, cool, cinematic |
| **Geçiş Süresi** | Sahneler arası geçiş | 0 (anında) – 30 frame |

### Adım 4: Son Onay

Tüm seçimlerinin özetini görürsün. "Başlat" butonuna tıklayınca video üretimi kuyrukta başlar.

### Üretim Süreci

Video üretimi başladığında gerçek zamanlı ilerleme gösterilir (WebSocket):

```
1. Script Yazılıyor...     [████░░░░░░]  15%
2. Seslendirme...           [██████░░░░]  35%
3. Görseller Aranıyor...    [████████░░]  55%
4. Altyazı Hizalama...      [█████████░]  75%
5. Video Birleştirme...     [██████████]  95%
6. Tamamlandı!              [██████████] 100%
```

### Pipeline Aşamaları Detay

#### 1. Script Üretimi
- **AI Modu**: Gemini 2.5 Flash veya OpenAI ile yapılandırılmış script üretir
- **Manuel Modu**: Kendi yazdığın scripti yüklersin
- **Çıktı**: Her sahne için `narration` (metin) + `visual_query` (görsel arama terimi)
- **Humanize**: Opsiyonel olarak scripti doğal konuşma diline çevirir (LLM ile)

#### 2. TTS (Seslendirme)
Scriptteki her sahnenin metnini sese çevirir. 7 farklı seslendirme motoru desteklenir:

| Provider | API Key | Ücretsiz? | Kalite | Türkçe | Özellik |
|----------|---------|-----------|--------|--------|---------|
| **Edge TTS** | Gerekmez | Evet | İyi | Evet | Microsoft, kelime bazlı zamanlama |
| **OpenAI TTS** | `OPENAI_API_KEY` | Hayır | Çok iyi | Evet | 9 farklı ses, hız ayarı |
| **ElevenLabs** | `ELEVENLABS_API_KEY` | Freemium | Mükemmel | Evet | Gerçekçi, ses klonlama |
| **SpeshAudio** | `SPESHAUDIO_API_KEY` | Hayır | Çok iyi | Evet | Stability/style kontrol |
| **DubVoice** | `DUBVOICE_API_KEY` | Hayır | İyi | Evet | SpeshAudio alternatifi |
| **Qwen3** | Gerekmez | Evet | İyi | Sınırlı | Lokal çalışır, GPU önerilir |
| **Google TTS** | `GOOGLE_API_KEY` | Freemium | Orta | Evet | Stabil, hızlı |

**TTS Ayarları:**
- **Hız (Speed)**: 0.25 (çok yavaş) → 1.0 (normal) → 4.0 (çok hızlı)
- **Apostrof temizleme**: Türkçe'deki `'` işaretlerini kaldırarak mikro-duraklama önler
- **Sessizlik kırpma**: Ses dosyasının başındaki sessizliği otomatik kırpar
- **LLM ile iyileştirme**: Seslendirme öncesi metne vurgu/duraklama işaretleri ekler
- **Eşzamanlı işçi sayısı**: 1 (sıralı) – 10 (paralel sahne seslendirme)

**Yedek Zincir (Fallback Chain):**
Ana seslendirme motoru başarısız olursa otomatik olarak sırayla dener:
```
Ana Provider → Edge TTS → OpenAI TTS → ElevenLabs → Sessiz Placeholder
```

#### 3. Görsel Arama/Üretim
Her sahne için uygun bir görsel (video klibi veya resim) bulur:

| Provider | Tür | API Key | Ücretsiz? | Çıktı |
|----------|-----|---------|-----------|-------|
| **Pexels** | Stok Video | `PEXELS_API_KEY` | Evet (limit var) | .mp4 video klip |
| **Pixabay** | Stok Video/Resim | `PIXABAY_API_KEY` | Evet | .mp4 veya .jpg |
| **DALL-E** | AI Görsel | `OPENAI_API_KEY` | Hayır | .jpg (1792×1024) |
| **Z-Image** | AI Görsel | `KIEAI_API_KEY` | Hayır | .jpg (yapılandırılabilir oran) |

**Yedek Zincir:**
```
Ana Provider → B-Roll Manager (Pexels/Pixabay anahtar kelime araması) → Gri Placeholder
```

**Z-Image En-Boy Oranları**: 1:1, 4:3, 3:4, 16:9, 9:16

#### 4. Altyazı Oluşturma
- **Whisper** ile ses dosyasından kelime bazlı zamanlama çıkarır
- Türkçe gibi bitişken dillerde özel hizalama algoritması kullanır
- **Karaoke desteği**: Her kelimenin tam başlangıç-bitiş zamanını kaydeder

#### 5. Video Birleştirme (Compose)
İki birleştirme motoru:

| Motor | Özellikler | Ne Zaman Kullanılır |
|-------|-----------|-------------------|
| **MoviePy** | Basit, hızlı, CPU dostu | Hızlı render, basit videolar |
| **Remotion** | Ken Burns, karaoke, animasyonlar, efektler | Profesyonel kalite, sosyal medya |

**Video Kalitesi Ayarları:**
- **Çözünürlük**: 1920×1080 (varsayılan), 1280×720, 3840×2160
- **FPS**: 30 (varsayılan), 24, 60
- **Codec**: libx264 (CPU), h264_nvenc (NVIDIA GPU), h264_videotoolbox (Mac)
- **CRF**: 18 (yüksek kalite, varsayılan)

---

## 6. Haber Bülteni (Bulletin)

Sol menüden **"Bülten"** butonuna tıkla.

### 3 Sekmesi Var:

#### Kaynaklar (Sources)
RSS haber kaynaklarını yönet:
- **Kaynak Ekle**: URL gir (RSS feed adresi)
- **Kaynak Düzenle**: İsim, kategori, dil ayarla
- **Kaynak Sil**: Artık kullanılmayan kaynağı kaldır

Örnek kaynaklar:
```
https://www.bbc.com/turkce/rss
https://www.ntv.com.tr/rss
https://feeds.bbci.co.uk/news/technology/rss.xml
```

#### Taslak (Draft)
- Kaynaklardan gelen haberleri görürsün
- İstediğin haberleri seç (checkbox ile)
- Her haberde: başlık, özet, kaynak, tarih
- "Taslak Oluştur" → seçilen haberlerden bülten scripti üretilir

#### Render
Bülten videosunu oluştur:
- **Network Adı**: Bülten kanalının adı (ör: "YTRobot Haber")
- **Stil**: breaking (acil haber), tech (teknoloji), corporate (kurumsal)
- **Format**: 16:9 (yatay) veya 9:16 (dikey/Shorts)
- **FPS**: 30 veya 60
- **Başlat** → Video üretimi başlar

### Bülten Video Özellikleri
- Her haber ayrı bir sahne olarak gösterilir
- Alt yazı bandı (ticker) desteği
- Kategori bazlı renk/stil değişimi
- Kaynak ve tarih gösterimi
- Karaoke altyazı animasyonları

---

## 7. Ürün İnceleme (Product Review)

Sol menüden **"Ürün İnceleme"** butonuna tıkla.

### Kullanım Adımları

1. **Ürün Bilgilerini Gir:**
   - Ürün adı
   - Fiyat ve indirim bilgisi
   - Puan (1-5 yıldız)
   - Artılar (madde madde)
   - Eksiler (madde madde)
   - Sonuç/Değerlendirme metni
   - Ürün görselleri (URL veya dosya yükleme)

2. **Otomatik Doldurma (Autofill):**
   - Ürün URL'sini yapıştır (ör: Trendyol, Amazon, Hepsiburada linki)
   - "Autofill" butonuna tıkla
   - AI ürün sayfasını tarar ve bilgileri otomatik doldurur

3. **Render Ayarları:**
   - Stil: modern (varsayılan)
   - Format: 16:9 veya 9:16
   - FPS: 30 veya 60
   - Kanal adı (ör: "YTRobot İnceleme")
   - Para birimi (TL, USD, EUR)
   - CTA metni ("Linke tıkla!" varsayılan)

4. **Render Başlat** → Ürün tanıtım videosu üretilir

### Çıktı
- Profesyonel ürün tanıtım videosu
- Fiyat/puan overlay
- Artı/eksi listesi animasyonlu gösterim
- CTA (call-to-action) bitişi

---

## 8. Gallery (Galeri)

Sol menüden **"Galeri"** (veya gallery ikonu) tıkla.

### Ne Gösterir?
Tüm üretilmiş videoların listesi, kart görünümünde:

Her kartta:
- **Thumbnail** (küçük resim)
- **Başlık** (konu veya session ID)
- **Modül badge** (Normal / Bülten / Ürün İnceleme)
- **Durum** (tamamlandı / başarısız / devam ediyor)
- **Tarih** (oluşturulma tarihi)
- **Süre** (render süresi)

### Özellikler

| Özellik | Açıklama |
|---------|----------|
| **Arama** | Başlık veya session ID ile filtreleme |
| **Modül Filtresi** | Sadece Normal / Bülten / Ürün videoları göster |
| **Durum Filtresi** | Tamamlanan / başarısız / tümü |
| **Sıralama** | Tarihe göre (yeni→eski veya eski→yeni) |
| **Toplu İşlem** | Birden fazla video seç → toplu sil / yeniden render |
| **Video Önizleme** | Karta tıkla → video oynatıcı açılır |
| **İndirme** | Video dosyasını bilgisayarına indir |

### Session Detay Sayfası
Bir videoya tıklayınca açılan detay sayfasında:
- **Video Player**: Tam video izleme
- **Pipeline Logları**: Her aşamanın detaylı logları
- **Metadata**: Konu, modül, kanal, ayarlar
- **SEO Skoru**: Başlık/açıklama/etiket analizi
- **Aksiyonlar**: İndir, YouTube'a yükle, sil, yeniden render
- **Not Defteri**: Videoya not ekle/düzenle

---

## 9. Kanal Yönetimi (Channels)

Sol menüden **"Kanallar"** butonuna tıkla.

### Kanal Nedir?
Her kanal, farklı bir YouTube kanalını veya içerik profilini temsil eder. Her kanalın kendine özel ayarları olabilir.

### Kanal İşlemleri

| İşlem | Açıklama |
|-------|----------|
| **Yeni Kanal Oluştur** | İsim, açıklama, slug (kısa ad) gir |
| **Logo Yükle** | Kanal logosu (avatar) yükle |
| **Aktif Kanal Seç** | Hangi kanal için video üretileceğini belirle |
| **Kanal Düzenle** | İsim, açıklama güncelle |
| **Kanal Sil** | Kanalı ve tüm verilerini sil |
| **YouTube Bağla** | Kanala YouTube OAuth ile giriş yap |

### Kanal Bazlı Özellikler
- Her kanalın kendi YouTube OAuth token'ı olabilir
- Her kanalın kendi rakip listesi olabilir
- Analytics kanal bazlı filtrelenebilir
- Scheduler kanal bazlı çalışır

### Aktif Kanal
Sağ üst köşede aktif kanalın adı/logosu görünür. Video ürettiğinde bu kanala atanır.

---

## 10. YouTube Entegrasyonu

### YouTube'a Bağlanma (OAuth)

1. **Ayarlar → Sistem** sekmesine git
2. **YouTube OAuth** kartını bul
3. `YT_OAUTH_CLIENT_ID` ve `YT_OAUTH_CLIENT_SECRET` değerlerini gir
   - Bu değerleri [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials'tan alırsın
   - OAuth 2.0 Client ID oluştur (Web application tipi)
   - Redirect URI olarak `http://localhost:5005/api/youtube/callback` ekle
4. **"YouTube'a Bağlan"** butonuna tıkla
5. Google giriş ekranı açılır → izin ver
6. Başarılı bağlantı sonrası kanal bilgileri gösterilir

### Video Yükleme

Video üretimi tamamlandıktan sonra:
1. Session detay sayfasına git
2. **"YouTube'a Yükle"** butonuna tıkla
3. Bilgileri doldur:
   - **Başlık**: Video başlığı
   - **Açıklama**: Video açıklaması
   - **Etiketler**: Virgülle ayrılmış taglar
   - **Gizlilik**: public (herkese açık), unlisted (bağlantıya sahip olan), private (gizli)
   - **Kategori**: YouTube kategori ID'si (22 = People & Blogs varsayılan)
4. **"Yükle"** → İlerleme çubuğu ile yükleme takibi

### Desteklenen İzinler
- `youtube.upload` — Video yükleme
- `youtube` — Kanal yönetimi
- `youtube.force-ssl` — Güvenli API erişimi

---

## 11. Zamanlayıcı (Scheduler)

Videoları gelecek bir tarih ve saatte otomatik YouTube'a yükler.

### Nasıl Kullanılır?

1. Bir video üret (herhangi bir modülle)
2. Video tamamlandıktan sonra **"Zamanla"** butonuna tıkla
3. Bilgileri doldur:
   - **Tarih ve Saat**: Yükleme yapılacak zaman (ISO 8601)
   - **Kanal**: Hangi YouTube kanalına yükleneceği
   - **Başlık, Açıklama, Etiketler**: YouTube metadata
   - **Gizlilik**: public/unlisted/private
4. **"Zamanla"** → Zamanlanan yükleme listesine eklenir

### Zamanlama Durumları

| Durum | Açıklama |
|-------|----------|
| **pending** | Belirlenen zamana kadar bekliyor |
| **published** | Başarıyla YouTube'a yüklendi |
| **failed** | Yükleme başarısız oldu (hata mesajıyla) |
| **cancelled** | Kullanıcı tarafından iptal edildi |

### Arka Plan Çalışma Mantığı
- Her 30 saniyede bir zamanı gelmiş yüklemeleri kontrol eder
- YouTube OAuth token'ı geçerli olmalı
- Video dosyası mevcut olmalı (`sessions/{id}/final_video.mp4` veya `output/{id}/final_output.mp4`)
- Başarılı yükleme sonrası `video_id` kaydedilir

---

## 12. İçerik Takvimi (Calendar)

Sol menüden **"Takvim"** butonuna tıkla.

### Ne İşe Yarar?
Video fikirlerini ve planlarını organize etmek için takvim görünümü sunar. Bu bir **planlama aracıdır** — direkt video üretmez, ama üretilmiş videoları takvim girişlerine bağlayabilirsin.

### Kullanım

#### Yeni Girdi Oluşturma
1. **"Yeni Girdi"** butonuna tıkla
2. Bilgileri doldur:
   - **Başlık**: Video fikri/konusu
   - **Açıklama**: Detaylı notlar
   - **Tarih**: Planlanan yayın tarihi
   - **Kanal**: Hangi kanal için
   - **Durum**: idea (fikir), planned (planlanmış), recorded (kaydedildi), published (yayınlandı)

#### Durum Renkleri
| Durum | Renk | Açıklama |
|-------|------|----------|
| **idea** | Mavi | Sadece bir fikir, henüz planlanmamış |
| **planned** | Sarı | Planlandı, üretim bekliyor |
| **recorded** | Turuncu | Video üretildi |
| **published** | Yeşil | YouTube'a yüklendi |

#### Video Bağlama
Video üretildikten sonra takvim girişine bağlayabilirsin:
- Takvim girişinde **"Video Bağla"** → Session ID seç
- Bağlanan video'nun durumunu otomatik "recorded" olarak günceller

### API Endpoint'leri
- `GET /api/calendar` — Tüm girdileri listele (ay, kanal, durum filtresi)
- `POST /api/calendar` — Yeni girdi oluştur
- `PATCH /api/calendar/{id}` — Güncelle
- `DELETE /api/calendar/{id}` — Sil
- `POST /api/calendar/{id}/link/{session_id}` — Video bağla

---

## 13. A/B Testi

Sol menüden **"A/B Testi"** butonuna tıkla.

### Ne İşe Yarar?
Farklı video başlıklarını (veya thumbnail'leri) karşılaştırarak hangisinin daha iyi performans gösterdiğini ölçer.

### Nasıl Çalışır?

1. **Test Oluştur:**
   - Session ID seç (hangi video için test yapılacak)
   - 2–3 farklı başlık varyantı yaz
   - Testi başlat

2. **Veri Toplama:**
   - Her varyant için **gösterim (impression)** sayısını kaydet
   - Her varyant için **tıklama (click)** sayısını kaydet
   - Sistem otomatik olarak **CTR (Click-Through Rate)** hesaplar

3. **Sonuçları Karşılaştır:**
   - Her varyantın CTR'si bar chart ile gösterilir
   - Kazanan varyant yeşil badge ile işaretlenir
   - İstatistiksel anlamlılık hesaplaması

4. **Testi Tamamla:**
   - "Tamamla" butonuna tıkla → en iyi varyant belirlenir

### Örnek Kullanım

```
Video: "Kedilerin 10 İlginç Özelliği"

Varyant A: "Kedilerin 10 İlginç Özelliği (SON HABERLEŞMEYİ KAÇIRMAYIN)"
Varyant B: "Bu 10 Kedi Davranışını Biliyor musunuz?"
Varyant C: "Kediniz Size BUNU Söylemeye Çalışıyor!"

Sonuç:
  A: 1200 gösterim, 48 tıklama → CTR: 4.0%
  B: 1150 gösterim, 62 tıklama → CTR: 5.4%
  C: 1180 gösterim, 71 tıklama → CTR: 6.0% ← KAZANAN
```

### Durumlar
- **active**: Test devam ediyor
- **completed**: Test tamamlandı, kazanan belli

### API Endpoint'leri
- `GET /api/ab-test` — Testleri listele (durum filtresi)
- `POST /api/ab-test` — Yeni test oluştur
- `POST /api/ab-test/{id}/impression/{variant}` — Gösterim kaydet
- `POST /api/ab-test/{id}/click/{variant}` — Tıklama kaydet
- `POST /api/ab-test/{id}/complete` — Testi tamamla

---

## 14. Oynatma Listeleri (Playlists)

Sol menüden **"Oynatma Listeleri"** butonuna tıkla.

### Ne İşe Yarar?
Ürettiğin videoları mantıksal gruplar halinde organize eder. YouTube playlist'leriyle senkronize edebilirsin.

### Kullanım

#### Playlist Oluşturma
1. **"Yeni Playlist"** butonuna tıkla
2. Bilgileri doldur:
   - **Başlık**: Playlist adı (ör: "Kedi Videoları Serisi")
   - **Açıklama**: Playlist açıklaması
   - **Kanal**: Hangi kanala ait
3. **"Oluştur"** → Boş playlist oluşturulur

#### Video Ekleme
- Playlist detayında **"Video Ekle"** → Gallery'den video seç
- Veya Gallery'de video kartında **"Playlist'e Ekle"** seçeneği

#### Video Çıkarma
- Playlist detayında video'nun yanındaki **"Çıkar"** butonuna tıkla

#### YouTube Senkronizasyonu
- **"YouTube'a Senkronize Et"** butonuna tıkla
- Playlist'teki tüm yüklenmiş videolar YouTube playlist'ine eklenir
- YouTube'da yeni playlist oluşturulur (yoksa)

### Playlist Bilgileri
- Video sayısı
- Toplam süre
- Son güncelleme tarihi
- YouTube senkronizasyon durumu

### API Endpoint'leri
- `GET /api/playlists` — Playlist listesi
- `POST /api/playlists` — Yeni playlist oluştur
- `GET /api/playlists/{id}` — Playlist detay
- `PATCH /api/playlists/{id}` — Güncelle
- `DELETE /api/playlists/{id}` — Sil
- `POST /api/playlists/{id}/videos` — Video ekle
- `DELETE /api/playlists/{id}/videos/{session_id}` — Video çıkar
- `POST /api/playlists/{id}/sync-youtube` — YouTube'a senkronize et

---

## 15. Video Şablonları (Templates)

Sol menüden **"Şablonlar"** butonuna tıkla.

### Ne İşe Yarar?
Sık kullandığın video ayar kombinasyonlarını şablon olarak kaydedip tekrar tekrar kullanabilirsin. Böylece her seferinde aynı ayarları tek tek yapmazsın.

### Şablon Neyi Kaydeder?
- TTS provider ve ses ayarları
- Görsel provider
- Altyazı stili (font, boyut, renk, animasyon)
- Video efektleri (Ken Burns, renk filtresi)
- Çözünürlük ve FPS
- Karaoke ayarları
- Ve diğer tüm render ayarları

### Kullanım

#### Şablon Oluşturma (2 Yol)

**Yol 1 — Mevcut Ayarlardan:**
1. **"Yeni Şablon"** butonuna tıkla
2. Şablon adı ve açıklama gir
3. Mevcut aktif ayarlar otomatik kaydedilir

**Yol 2 — Videodan:**
1. Gallery'de bir videonun detayına git
2. **"Şablon Olarak Kaydet"** butonuna tıkla
3. O videonun ayarları şablon olarak kaydedilir

#### Şablon Uygulama
1. Şablon listesinde istediğin şablonun **"Uygula"** butonuna tıkla
2. Mevcut ayarlar şablondaki değerlerle değiştirilir
3. Artık yeni videolar bu ayarlarla üretilir

#### Örnek Şablonlar

```
📌 "Hızlı Draft" — Edge TTS, Pexels, 720p, 30fps, minimal altyazı
📌 "Sinematik" — ElevenLabs, DALL-E, 1080p, 60fps, cinematic efekt, hype animasyon
📌 "Shorts Format" — OpenAI TTS, Z-Image 9:16, pill altyazı, vibrant animasyon
📌 "Haber Stili" — Edge TTS, Pexels, 1080p, 60fps, breaking stil, ticker açık
```

### API Endpoint'leri
- `GET /api/templates` — Şablon listesi
- `POST /api/templates` — Yeni şablon oluştur
- `GET /api/templates/{id}` — Şablon detay
- `PATCH /api/templates/{id}` — Güncelle
- `DELETE /api/templates/{id}` — Sil
- `POST /api/templates/{id}/apply` — Şablonu uygula (aktif ayarları değiştir)
- `POST /api/templates/from-session/{session_id}` — Videodan şablon oluştur

---

## 16. Sosyal Medya Metadata

Sol menüden **"Sosyal Medya"** butonuna tıkla.

### Ne İşe Yarar?
Video tamamlandığında otomatik olarak YouTube başlığı, açıklaması, etiketleri ve hashtag'leri üretir.

### Ayarlar (Settings → AI & Script)
- **Etkin Modüller**: Normal Video, Bülten, Ürün İnceleme için ayrı ayrı aç/kapat
- **Alanlar**: title, description, tags, source, link — hangilerinin üretileceğini seç
- **Master Prompt**: AI'ya ek talimat ver (ör: "Başlıkları merak uyandırıcı yap")
- **Dil**: Metadata dili (boş = modül dili)

### Kullanım
1. Metadata üretimi aktifse video tamamlandığında otomatik çalışır
2. Veya manuel: **"Metadata Üret"** butonuna tıkla
3. Üretilen metadata düzenlenebilir
4. YouTube'a yüklerken bu metadata kullanılır

### Sosyal Medya Logu
Üretilen tüm metadata'ların geçmişi bu sayfada görüntülenir.

---

## 17. SEO Analizi

Video metadata'nızı otomatik olarak analiz eder ve puanlar.

### Analiz Edilen Alanlar

#### Başlık Analizi
- **Uzunluk**: 40–70 karakter ideal (sarı < 40, kırmızı > 70)
- **Power Words**: Dikkat çekici kelimeler var mı? (İNANILMAZ, ŞAŞIRTICI, vb.)
- **Sayılar**: Başlıkta sayı var mı? (10 yol, 5 ipucu — daha iyi CTR)
- **Soru**: Soru formatında mı? (daha fazla tıklama)

#### Açıklama Analizi
- **Uzunluk**: 200+ karakter ideal
- **Anahtar Kelime Yoğunluğu**: Başlıktaki kelimeler açıklamada var mı?
- **CTA (Call-to-Action)**: "Abone ol", "Beğen" gibi ifadeler var mı?
- **Linkler**: Sosyal medya veya kaynak linkleri var mı?

#### Etiket Analizi
- **Sayı**: 5–15 etiket ideal
- **İlgililik**: Etiketler konuyla ilgili mi?
- **Uzun kuyruk**: Spesifik, detaylı etiketler var mı?

### SEO Skoru
0–100 arası toplam skor:
- **80–100**: Mükemmel (yeşil)
- **60–79**: İyi (sarı)
- **40–59**: Orta (turuncu)
- **0–39**: Zayıf (kırmızı)

### Nerede Görünür?
- Session detay sayfasında **SEO tab'ı**
- Video tamamlandığında otomatik hesaplanır
- İyileştirme önerileri listesi gösterilir

### API Endpoint'leri
- `POST /api/seo/analyze` — Tam SEO analizi (title + description + tags)
- `POST /api/seo/analyze-title` — Sadece başlık analizi

---

## 18. Rakip Analizi (Competitor)

Sol menüden **"Rakip Analizi"** butonuna tıkla.

### Ne İşe Yarar?
Rakip YouTube kanallarının başlıklarını analiz ederek viral potansiyeli yüksek başlık fikirleri üretir.

### Kullanım Adımları

1. **Rakip Kanal Ekle:**
   - YouTube kanal ID'sini gir (ör: `UCxxxxxxxxxxxxxxx`)
   - Kanal adı otomatik bulunur
   - Birden fazla rakip ekleyebilirsin

2. **Tarama Başlat:**
   - **"Tara"** butonuna tıkla
   - Sistem rakip kanalın son N videosunun başlıklarını çeker (N yapılandırılabilir)

3. **Başlık Analizi:**
   Her başlık 5 boyutta puanlanır (AI ile):

   | Boyut | Açıklama |
   |-------|----------|
   | **Merak (Curiosity)** | İzleyicide "bunu izlemeliyim" hissi yaratma |
   | **Duygu (Emotion)** | Duygusal tetikleme gücü |
   | **Psikoloji** | Psikolojik mekanizma kullanımı (FOMO, otoriteye başvuru) |
   | **CTR Tahmini** | Tıklanma oranı tahmini |
   | **Trend** | Güncel trendlere uyumluluk |

4. **Viral Skor:**
   - 5 boyutun ağırlıklı ortalaması
   - Başlıklar viral skora göre sıralanır

5. **Başlık Yeniden Yazımı:**
   - Her başlık senin dilin ve stiline uygun şekilde yeniden yazılır
   - Kullanılan başlıklar "used" olarak işaretlenir (tekrar önerilmez)

### Heatmap (Isı Haritası)
Rakiplerin ne zaman video yüklediğini görselleştirir:
- 7 gün × 24 saat grid
- En yoğun yükleme saatleri vurgulanır
- Senin için optimal yükleme zamanı önerilir

### Veri
- Maksimum 500 başlık saklanır
- En eski başlıklar otomatik temizlenir
- Per-kanal veya global rakip listesi

---

## 19. Analytics (Analiz Paneli)

Sol menüden **"Analiz"** butonuna tıkla.

### Dashboard İstatistikleri

| Metrik | Açıklama |
|--------|----------|
| **Toplam Render** | Tüm zamanların render sayısı |
| **Başarı Oranı** | Tamamlanan / toplam yüzde |
| **Ortalama Süre** | Render başına ortalama süre |
| **Günlük Trend** | Son 30 günün günlük render grafiği |
| **Modül Dağılımı** | Normal/Bülten/Ürün oranları (pasta grafik) |
| **Platform Dağılımı** | YouTube/Instagram yükleme oranları |

### Kuyruk Durumu
Gerçek zamanlı pipeline durumu:
- **Çalışan İşler**: Şu an render edilen videolar (süre, session ID)
- **Sırada Bekleyenler**: Kuyrukta sıra bekleyen videolar
- **Eşzamanlı İşçi**: Aktif/Maksimum (ör: 1/2)

### Hata Detayları
Başarısız render'ların hata analizi:
- Hata mesajı
- Hangi aşamada başarısız oldu (TTS, visuals, compose)
- Session ID ve tarih
- Yeniden deneme butonu

### CSV Dışa Aktarma
**"CSV İndir"** butonu ile tüm istatistikleri Excel'de açılabilir CSV formatında indir.

---

## 20. YouTube Analytics

Sol menüden **"YouTube Analiz"** butonuna tıkla.

### Gereksinim
YouTube OAuth bağlantısı yapılmış olmalı (Bkz: [YouTube Entegrasyonu](#10-youtube-entegrasyonu)).

### Gösterdiği Veriler

#### Kanal İstatistikleri
- Abone sayısı
- Toplam görüntülenme
- Toplam video sayısı
- Son 28 gün görüntülenme

#### Son Videolar Tablosu
Her video için:
- Başlık
- Görüntülenme sayısı
- Beğeni sayısı
- Yorum sayısı
- Ortalama izlenme süresi
- CTR (tıklama oranı)

#### Video Detay
Belirli bir videonun:
- Günlük görüntülenme grafiği
- İzleyici kaynakları (arama, öneri, direkt)
- İzleyici tutma (retention) grafiği
- Coğrafi dağılım

---

## 21. Bildirim Sistemi

YTRobot 5 farklı bildirim kanalını destekler:

### 1. Webhook (Slack/Discord)

| Ayar | Açıklama |
|------|----------|
| `WEBHOOK_ENABLED` | Açık/kapalı |
| `WEBHOOK_URL` | Slack veya Discord webhook URL'si |
| `WEBHOOK_ON_COMPLETE` | Tamamlanınca bildirim gönder |
| `WEBHOOK_ON_FAILURE` | Başarısız olunca bildirim gönder |
| `WEBHOOK_MENTION` | Etiketlenecek kişi (ör: @channel, @everyone) |

**Slack URL Örneği:** `https://hooks.slack.com/services/T.../B.../xxx`
**Discord URL Örneği:** `https://discord.com/api/webhooks/xxx/yyy`

### 2. Telegram

| Ayar | Açıklama |
|------|----------|
| `TELEGRAM_ENABLED` | Açık/kapalı |
| `TELEGRAM_BOT_TOKEN` | @BotFather'dan alınan bot token |
| `TELEGRAM_CHAT_ID` | Mesaj gönderilecek chat/grup/kanal ID'si |

**Kurulum:**
1. Telegram'da @BotFather'a `/newbot` yaz
2. Bot token'ını al (ör: `123456:ABC-DEF...`)
3. Botu gruba ekle veya direkt mesaj at
4. Chat ID'yi bul:
   - Bota bir mesaj at
   - `https://api.telegram.org/bot{TOKEN}/getUpdates` ziyaret et
   - `chat.id` değerini al

### 3. E-posta (SMTP)

| Ayar | Açıklama |
|------|----------|
| `EMAIL_ENABLED` | Açık/kapalı |
| `EMAIL_SMTP_HOST` | SMTP sunucu (varsayılan: smtp.gmail.com) |
| `EMAIL_SMTP_PORT` | Port (varsayılan: 587 — TLS) |
| `EMAIL_SMTP_USER` | Giriş e-posta adresi |
| `EMAIL_SMTP_PASSWORD` | Uygulama şifresi (Gmail için App Password gerekir) |
| `EMAIL_FROM` | Gönderen adresi (boşsa SMTP_USER kullanılır) |
| `EMAIL_TO` | Alıcı adresleri (virgülle ayrılmış) |

**Gmail Kurulumu:**
1. Google Hesabı → Güvenlik → 2 Adımlı Doğrulama'yı aç
2. Google Hesabı → Güvenlik → Uygulama Şifreleri → Yeni şifre oluştur
3. Oluşturulan 16 haneli şifreyi `EMAIL_SMTP_PASSWORD` olarak kullan

### 4. WhatsApp (Business API)

| Ayar | Açıklama |
|------|----------|
| `WHATSAPP_ENABLED` | Açık/kapalı |
| `WHATSAPP_API_URL` | WhatsApp Business veya Twilio API URL'si |
| `WHATSAPP_API_TOKEN` | API Bearer token |
| `WHATSAPP_TO` | Alıcı telefon numarası (ör: +905551234567) |

### 5. Uygulama İçi Bildirimler

Header'daki **zil ikonuna** tıkla:
- Son bildirimler listesi
- Okunmamış sayısı badge olarak gösterilir
- "Tümünü okundu işaretle" butonu
- Her bildirime tıklayınca ilgili sayfaya gider

### Bildirim Zamanlaması
Bildirimler şu durumlarda gönderilir:
- Video render'ı **tamamlandığında** (başarılı)
- Video render'ı **başarısız olduğunda**
- Zamanlanmış yükleme gerçekleştiğinde

### Test Etme
Ayarlar → Sistem sekmesinde her kanal için **"Test"** butonu var. Tıklayarak test bildirimi gönderebilirsin.

---

## 22. Ayarlar (Settings)

Sol menüden **"Ayarlar"** butonuna tıkla. 6 ana sekmesi var:

### Sekme 1: Ses (TTS / Voice)

#### Provider Seçimi
- Aktif TTS provider'ı seç (dropdown)
- Provider'a özel API key ve voice ID gir
- **"Sesleri Listele"** butonu → seçili provider'ın mevcut seslerini gösterir

#### Kalite Ayarları
| Ayar | Açıklama | Varsayılan |
|------|----------|-----------|
| **Hız (Speed)** | Konuşma hızı | 1.0 |
| **Apostrof Temizleme** | Türkçe `'` işaretini kaldır | Açık |
| **Sessizlik Kırpma** | Başlangıç sessizliğini kaldır | Kapalı |
| **LLM ile İyileştirme** | Metne vurgu/duraklama ekle | Kapalı |
| **Eşzamanlı İşçi** | Paralel seslendirme sayısı | 1 |

#### Modül Bazlı Override'lar
Her modül (Normal Video, Bülten, Ürün İnceleme) için ayrı TTS ayarları yapabilirsin:
- Farklı provider
- Farklı ses
- Farklı hız
- Farklı kalite parametreleri

Boş bırakırsan global ayarlar kullanılır.

### Sekme 2: Görseller (Visuals & Effects)

#### Görsel Kaynağı
- Provider seç: Pexels, Pixabay, DALL-E, Z-Image
- Provider API key'lerini gir

#### Kompozisyon Ayarları (Remotion)
| Ayar | Açıklama | Varsayılan |
|------|----------|-----------|
| **Ken Burns Zoom** | Zoom seviyesi (0=kapalı) | 0.08 |
| **Ken Burns Yönü** | Pan yönü | center |
| **Geçiş Süresi** | Sahneler arası geçiş (frame) | 10 |
| **Video Efekti** | Renk filtresi | none |
| **Eşzamanlılık** | Paralel render thread | 4 |

#### Altyazı Ayarları
| Ayar | Açıklama | Varsayılan |
|------|----------|-----------|
| **Font** | Yazı tipi | bebas |
| **Boyut** | Piksel cinsinden | 68 |
| **Renk** | Yazı rengi | #ffffff |
| **Arkaplan** | none/box/pill | none |
| **Stroke** | Dış çizgi kalınlığı | 2 |
| **Animasyon** | Giriş efekti | hype |
| **Karaoke** | Kelime vurgulama | Açık |
| **Karaoke Rengi** | Vurgu rengi | #FFD700 |

### Sekme 3: AI & Script

| Ayar | Açıklama |
|------|----------|
| **KIE.AI API Key** | Gemini 2.5 Flash (script üretimi) |
| **OpenAI API Key** | GPT-4 alternatifi |
| **Anthropic API Key** | Claude alternatifi |
| **Gemini API Key** | Ürün autofill, rakip analiz |
| **Script Humanize** | Scripti doğal konuşma diline çevir |
| **Target Audience** | Hedef kitle tanımı (opsiyonel) |

### Sekme 4: Sistem

| Ayar | Açıklama | Varsayılan |
|------|----------|-----------|
| **Output Dir** | Çıktı dizini | output |
| **Çözünürlük** | Video boyutu | 1920x1080 |
| **FPS** | Kare/saniye | 30 |
| **GPU Encoding** | Donanım hızlandırma | auto |
| **CORS Origins** | İzin verilen kaynaklar | * |
| **Debug Mode** | Detaylı hata mesajları | Kapalı |

Bu sekmede ayrıca:
- **YouTube OAuth** bağlantı kartı
- **Webhook/Bildirim** ayarları (Telegram, E-posta, WhatsApp)
- **Bildirim test butonları**

### Sekme 5: Denetim Günlüğü (Audit Log)

Bkz: [Denetim Günlüğü](#25-denetim-günlüğü-audit-log)

### Sekme 6: Güvenli Depolama (Secure Storage)

Bkz: [Güvenli Depolama](#24-güvenli-depolama-secure-storage)

### Ayar Arama
Tüm sekmeler üzerinde arama yapabilirsin:
- Arama kutusuna ayar adını yaz
- Eşleşen ayarlar filtrelenir

### Ayar Geçmişi ve Geri Alma
- **"Geçmiş"** butonu → Son değişikliklerin listesi
- **"Geri Al"** → Bir önceki ayar durumuna dön

---

## 23. API Anahtarları

Sol menüden **"API Anahtarları"** butonuna tıkla.

### Desteklenen Provider'lar

| Provider | Anahtar | Ne İçin Kullanılır |
|----------|---------|-------------------|
| **KIE.AI** | `KIEAI_API_KEY` | Script üretimi (Gemini 2.5 Flash) |
| **OpenAI** | `OPENAI_API_KEY` | TTS, DALL-E görsel, GPT script |
| **ElevenLabs** | `ELEVENLABS_API_KEY` | Premium TTS seslendirme |
| **SpeshAudio** | `SPESHAUDIO_API_KEY` | TTS seslendirme |
| **DubVoice** | `DUBVOICE_API_KEY` | TTS seslendirme |
| **Pexels** | `PEXELS_API_KEY` | Stok video/görsel arama |
| **Pixabay** | `PIXABAY_API_KEY` | Stok video/görsel arama |
| **Gemini** | `GEMINI_API_KEY` | Ürün autofill, rakip analizi |
| **YouTube** | `YOUTUBE_API_KEY` | YouTube Data API (rakip tarama) |

### API Key Test
Her provider için **"Test"** butonu var:
- Tıkla → API key'in geçerli olup olmadığını kontrol eder
- Başarılı → Yeşil onay
- Başarısız → Kırmızı hata mesajı

### Nereden Alınır?

| Provider | Kayıt Linki |
|----------|------------|
| OpenAI | platform.openai.com |
| ElevenLabs | elevenlabs.io |
| Pexels | pexels.com/api |
| Pixabay | pixabay.com/api/docs |
| Google/Gemini | ai.google.dev |

---

## 24. Güvenli Depolama (Secure Storage)

Ayarlar → **"Güvenli Depolama"** sekmesine git.

### Ne İşe Yarar?
Hassas bilgileri (API anahtarları, token'lar) şifreli olarak saklar. `.env` dosyasına yazmak istemediğin verileri burada güvenle saklayabilirsin.

### Kullanım

| İşlem | Açıklama |
|-------|----------|
| **Yeni Key Ekle** | Key adı + değer gir → şifrelenerek kaydedilir |
| **Key Listesi** | Saklanan tüm key'ler listelenir (değerler maskeli: `sk-...xxxx`) |
| **Key Sil** | Onay dialogu ile güvenli silme |

### Güvenlik
- Veriler **Fernet şifreleme** ile korunur (AES-128-CBC)
- Şifreleme anahtarı makineye özgü (PBKDF2 key derivation)
- Dosya izinleri 0600 (sadece sahibi okuyabilir)
- `data/secure_store.json` dosyasında saklanır

---

## 25. Denetim Günlüğü (Audit Log)

Ayarlar → **"Denetim Günlüğü"** sekmesine git.

### Ne İşe Yarar?
Sistemde yapılan tüm önemli işlemlerin kaydını tutar. Kim, ne zaman, ne yaptı?

### Log Kategorileri

| Kategori | Neler Kaydedilir |
|----------|-----------------|
| **settings** | Ayar değişiklikleri |
| **render** | Video üretim başlatma/bitirme/hata |
| **channel** | Kanal oluşturma/silme/güncelleme |
| **auth** | YouTube OAuth bağlantı/koparma |
| **security** | Güvenli depolama işlemleri, şifreleme |

### Kullanım
- **Filtre**: Kategori seçerek sadece o kategorideki logları göster
- **Sayfalama**: Her sayfada 100 kayıt (ileri/geri butonları)
- **Detay**: Her log'da tarih, kategori, aksiyon ve detay bilgisi

---

## 26. Tema ve Dil

### Tema Değiştirme
Sol sidebar'ın altında **ay/güneş ikonu**:
- **Açık Tema (Light)**: Beyaz arkaplan, koyu yazılar
- **Koyu Tema (Dark)**: Koyu arkaplan, açık yazılar
- Tercih `localStorage`'da saklanır (sayfa yenilenince hatırlanır)

### Dil Değiştirme
Sol sidebar'ın altında **EN/TR** butonları:
- **EN**: İngilizce arayüz
- **TR**: Türkçe arayüz
- Tüm menüler, butonlar, mesajlar çevrilir
- Tercih `localStorage`'da saklanır

---

## 27. Teknik Mimari

### Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| **Backend** | Python 3.14 + FastAPI |
| **Frontend** | Vanilla HTML + Tailwind CSS + Alpine.js |
| **Video İşleme** | MoviePy + FFmpeg + Remotion (Node.js) |
| **Veritabanı** | SQLite (analytics) + JSON dosyaları (sessions, config) |
| **Gerçek Zamanlı** | WebSocket (pipeline progress) |
| **Şifreleme** | Fernet (cryptography kütüphanesi) |

### Dosya Yapısı

```
YTRobot/
├── server.py                 # FastAPI ana sunucu (port 5005)
├── config.py                 # Ayar yönetimi (.env → Pydantic)
├── main.py                   # CLI giriş noktası
├── .env                      # API anahtarları ve ayarlar
│
├── pipeline/                 # Video üretim pipeline'ı
│   ├── script.py             # AI script üretimi
│   ├── tts.py                # Seslendirme (7 provider)
│   ├── visuals/
│   │   ├── core.py           # Görsel arama/üretim
│   │   └── broll.py          # B-Roll yedek arama
│   ├── subtitles.py          # Altyazı hizalama (Whisper)
│   ├── composer.py           # Video birleştirme (MoviePy)
│   └── news_bulletin.py      # Haber bülteni pipeline'ı
│
├── providers/
│   ├── tts/                  # TTS sağlayıcıları
│   │   ├── base.py           # Ortak araçlar (clean, trim, speed)
│   │   ├── openai_tts.py
│   │   ├── elevenlabs.py
│   │   ├── edge_tts.py
│   │   ├── speshaudio.py
│   │   ├── dubvoice.py
│   │   └── qwen3.py
│   ├── visuals/              # Görsel sağlayıcıları
│   │   ├── pexels.py
│   │   ├── dalle.py
│   │   ├── zimage.py
│   │   └── pollinations.py   # Thumbnail üretimi
│   └── composer/
│       └── remotion_composer.py  # Remotion birleştirici
│
├── src/
│   ├── api/
│   │   ├── routes/           # API endpoint'leri (20 modül)
│   │   └── models/
│   │       └── schemas.py    # Pydantic request/response modelleri
│   └── core/                 # Çekirdek modüller
│       ├── queue.py          # Job kuyruk yönetimi
│       ├── progress.py       # WebSocket ilerleme takibi
│       ├── scheduler.py      # Zamanlanmış yükleme
│       ├── youtube_auth.py   # YouTube OAuth
│       ├── analytics.py      # İstatistik yönetimi
│       ├── encryption.py     # Fernet şifreleme
│       ├── database.py       # SQLite veritabanı
│       ├── cache.py          # Önbellek yönetimi
│       ├── competitor_intel.py # Rakip analizi
│       └── process_registry.py # Alt-işlem takibi
│
├── remotion/                 # Remotion proje dizini
│   ├── src/
│   │   ├── Root.tsx
│   │   ├── Scene.tsx         # Ana sahne bileşeni
│   │   └── Composition.tsx
│   └── package.json
│
├── ui/                       # Web arayüzü
│   ├── index.html            # Tek sayfa uygulama (SPA)
│   ├── js/
│   │   ├── app.js            # Alpine.js uygulama mantığı
│   │   └── translations.js   # Çeviri dosyası (EN/TR)
│   └── css/
│       └── custom.css        # Özel stiller
│
├── data/                     # Kalıcı veriler
│   ├── schedule.json         # Zamanlanmış yüklemeler
│   ├── secure_store.json     # Şifreli anahtar deposu
│   ├── stats.json            # İstatistikler
│   └── ytrobot.db            # SQLite veritabanı
│
├── channels/                 # Kanal bazlı veriler
│   └── {channel_slug}/
│       ├── channel.json
│       ├── competitors.json
│       └── platforms/
│           └── youtube.json  # Şifreli OAuth token
│
├── output/                   # Video çıktıları
│   └── YYYYMMDD_HHMMSS/
│       ├── audio/            # Sahne ses dosyaları
│       ├── clips/            # Görsel dosyalar
│       ├── subtitles.srt     # Altyazı dosyası
│       ├── word_timing.json  # Karaoke zamanlama
│       └── final_output.mp4  # Son video
│
└── sessions/                 # Session verileri
    └── {session_id}/
        ├── session.json      # Session metadata
        ├── script.json       # Üretilen script
        └── final_video.mp4   # Son video
```

### Kuyruk Sistemi

- **Maksimum eşzamanlı iş**: 2 (yapılandırılabilir)
- **Kuyruk kapasitesi**: 100 iş
- **İş zaman aşımı**: 30 dakika
- **Worker sayısı**: 2 paralel worker
- Kuyruk dolduğunda **429 Too Many Requests** döner

### Rate Limiting
- **120 istek/dakika** + **20 istek burst**

---

## 28. Sorun Giderme (Troubleshooting)

### Sık Karşılaşılan Sorunlar

#### "FP16 is not supported on CPU; using FP32 instead"
- **Durum**: Bu sadece bir uyarı, video üretimini etkilemez
- **Çözüm**: Zaten düzeltildi — Whisper `fp16=False` ile çalışır

#### Video çıktısı sessiz / 3 saniyelik
- **Sebep**: TTS provider başarısız olmuş, sessiz placeholder üretilmiş
- **Çözüm**:
  1. TTS provider API key'ini kontrol et
  2. Edge TTS kullan (API key gerektirmez)
  3. Log'larda "fallback" aramak hata kaynağını gösterir

#### "Queue is full" hatası
- **Sebep**: 100+ video kuyruğa eklenmiş
- **Çözüm**: Mevcut işlerin tamamlanmasını bekle

#### YouTube upload başarısız
- **Sebep**: OAuth token süresi dolmuş
- **Çözüm**: Ayarlar → YouTube OAuth → Yeniden bağlan

#### Video kalitesi düşük
- **Kontrol edilecekler**:
  1. `VIDEO_RESOLUTION` → 1920x1080 mi?
  2. `VIDEO_FPS` → 30 veya 60 mı?
  3. GPU encoding aktif mi? (`GPU_ENCODING=auto`)
  4. Görsel provider kaliteli sonuç veriyor mu?

#### Altyazılar senkronize değil
- **Sebep**: Whisper hizalama Türkçe'de bazen kayar
- **Çözüm**: Sistem otomatik segment-anchored alignment kullanır. Sorun devam ederse farklı TTS provider dene

#### Sunucu başlamıyor
```bash
# Port kullanılıyor olabilir
lsof -i :5005
# veya farklı port kullan
python server.py --port 5006
```

#### API key test başarısız
1. Key'in doğru kopyalandığından emin ol (boşluk yok)
2. Provider'ın web sitesinden key'in aktif olduğunu kontrol et
3. Rate limit'e takılmış olabilirsin — birkaç dakika bekle

---

## Hızlı Başlangıç Senaryosu

### Senaryo: İlk Videonuzu Üretin

```
1. Sunucuyu başlat: python server.py
2. Tarayıcıda http://localhost:5005 aç
3. API Anahtarları sayfasına git
4. En az bir TTS key gir (veya Edge TTS kullan — key gerekmez)
5. En az bir görsel API key gir (Pexels ücretsiz)
6. Sol menüden "Yeni Video" tıkla
7. "Normal Video" seç → İleri
8. Konu yaz: "Yapay Zekanın Geleceği"
9. Ayarları kontrol et → İleri
10. Stil seç (varsayılanlar iyi) → İleri
11. Son onay → "Başlat"
12. İlerlemeyi izle (gerçek zamanlı)
13. Tamamlandığında Gallery'de videoyu izle
14. İstersen YouTube'a yükle
```

---

> **Bu rehber YTRobot v2'nin tüm özelliklerini kapsar. Sorularınız için GitHub Issues sayfasını kullanabilirsiniz.**
