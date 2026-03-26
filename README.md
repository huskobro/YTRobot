# 🎬 YTRobot v3.5 - Autonomous Content Factory

YTRobot, RSS kaynaklarından haber çeken, ürün incelemeleri oluşturan ve bunları AI destekli görseller, sesler ve altyazılarla tam otomatik videolara dönüştüren profesyonel bir içerik üretim platformudur.

## 🚀 Temel Özellikler

- **Asenkron Video Kuyruğu:** Aynı anda birden fazla video render işlemini yöneten `JobManager`.
- **Karaoke Altyazı:** Whisper tabanlı, kelime düzeyinde senkronize ve Remotion destekli "hype" animasyonlu altyazılar.
- **Otomatik B-Roll (AI):** Görseli eksik sahneleri Gemini AI ile analiz edip Pexels/Pixabay'den uygun stok videolarla doldurma.
- **Sosyal Medya Otomasyonu:** YouTube Shorts ve Instagram Reels için otomatik paylaşım otonomu.
- **Kurumsal Analitik:** Render başarı oranları, süreleri ve hata patternlerini takip eden dashboard altyapısı.

## 🛠 Kurulum

1. Bağımlılıkları yükleyin:
   ```bash
   pip install -r requirements.txt
   npm install --prefix remotion
   ```

2. `.env` dosyasını yapılandırın:
   - `GEMINI_API_KEY`: AI anahtar kelime çıkarma için.
   - `PEXELS_API_KEY` / `PIXABAY_API_KEY`: Stok medya için.
   - `REMOTION_KARAOKE_ENABLED`: `true` olarak ayarlayın.

3. Sunucuyu başlatın:
   ```bash
   python3 server.py
   ```

## 📊 Analitik
Sistem istatistiklerine `/api/stats` uç noktasından veya dashboard panelinden ulaşabilirsiniz.

## 📝 Lisans
Bu proje kurumsal içerik üretim standartlarına uygun olarak geliştirilmiştir.
