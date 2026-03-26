# YTRobot Projesi — Claude.ai Kapsamlı Bağlam Dosyası

Bu dosya, Claude AI'nın (veya diğer asistanların) bu proje üzerinde çalışırken ihtiyaç duyabileceği tüm mimari, teknolojik ve işlevsel detayları içerir. **En güncel hal (26 Mart 2026) Faz 8: Frontend Excellence geçişi sonrası oluşturulmuştur.**

---

## 1. Proje Genel Tanımı

**YTRobot**, profesyonel kalitede YouTube videolarını (Haber Bülteni, Shorts, Ürün İnceleme) tamamen otomatik veya yarı-otomatik olarak üreten Python tabanlı bir "Automated Video Production" platformudur. **v3.5 Gold Edition** itibariyle tam otonom bir içerik fabrikasına dönüşmüştür.

### Ana Modüller:
1.  **Haber Bülteni (News Bulletin):** RSS/Kaynaklardan haber çekip, 16:9 veya 9:16 formatında profesyonel yayın grafiklerine sahip haber videoları üretir.
2.  **YTRobot (Genel Video):** Bir konu veya hazır script'ten yola çıkarak stok video, seslendirme ve altyazı içeren videolar üretir.
3.  **Ürün İnceleme (Product Review):** Belirli ürünler için yapay zeka ile senaryo yazıp inceleme videoları hazırlar.
4.  **Analitik Dashboard (Yeni):** Sistem performansı, render başarı oranları ve AI kullanım istatistiklerini gerçek zamanlı takip eder.

---

## 2. Teknoloji Stack

| Katman | Teknoloji / Kütüphane | Detay |
| :--- | :--- | :--- |
| **Backend API** | FastAPI + Uvicorn | `server.py` (Asenkron, thread-based job yönetimi) |
| **Video Rendering** | **Remotion** (Birincil) | React + TypeScript (`remotion/` klasörü) |
| **Frontend UI** | Alpine.js + Vanilla CSS | `ui/index.html` (Premium Dark UI, Glassmorphism) |
| **LLM / AI** | Kie.ai (Gemini 2.5 Flash) | Birincil zeka katmanı (Script, Metadata, B-Roll Selection) |
| **TTS (Seslendirme)** | SpeshAudio, OpenAI | `speshaudio` Türkçe vurgu için optimize edilmiştir |
| **Otonom Paylaşım** | Google/YouTube API | Render sonrası otomatik metadata üretimi ve paylaşım |

---

## 3. Faz 8: Frontend Excellence & Gold Edition Yenilikleri

### A. Premium Dark UI/UX
- **Görsel Dil:** Glassmorphism (`.glass-card`), Neon Glow (`.neon-glow`) ve yumuşak animasyonlar (`.fade-in-up`) ile modernize edildi.
- **Hiyerarşi:** Sidebar üzerinden erişilebilen modüler bir yapı kuruldu. "Visuals" ve "Social Otonom" bölümleri Alpine.js state yönetimiyle senkronize edildi.

### B. Analitik & Sağlık Paneli
- `/api/stats` uç noktası üzerinden çekilen verilerle; toplam oturum sayısı, ortalama render süresi ve AI model dağılımı interaktif kartlarla gösterilir.
- Render hataları ve başarı oranları (Success Rate) anlık takip edilebilir.

### C. Otonom Kontrol Merkezi
- **AI B-Roll:** Gemini AI, senaryo içeriğine göre en alakalı stok videoları/görselleri Pexels/Pixabay üzerinden otomatik seçer.
- **Sosyal Medya Otonomu:** YouTube ve Reels için platforma özel metadata (başlık, açıklama, etiket) üretimi ve otomatik kuyruğa alma desteği eklendi.

---

## 4. Kritik İş Akışları (Workflows)

### A. Otonom Render & Paylaşım
1.  **Üretim:** Kullanıcı konuyu girer veya RSS'ten haber seçer.
2.  **AI Seçimi:** LLM senaryoyu yazar ve **AI B-Roll** modülü sahneleri planlar.
3.  **Render:** Remotion üzerinden 60 FPS kalitesinde video birleştirilir.
4.  **Otonom Paylaşım:** Render bitince sistem platforma özel metadata üretir ve (ayarlar etkinse) YouTube'a "Private/Unlisted" olarak yükler.

---

## 5. Geliştiriciler (Claude) İçin Teknik Notlar

1.  **State Yönetimi:** `ui/js/app.js` içindeki `app()` fonksiyonu tüm durumu yönetir. `parseFloat` ve `parseInt` kontrolleri ile UI çökmeleri (NaN hataları) engellenmelidir.
2.  **Çeviri (i18n):** `ui/js/translations.js` dosyası hem TR hem EN desteği sunar. Yeni eklenen özelliklerin her iki dilde de anahtarı olmalıdır.
3.  **Hata Giderme:** Remotion render hataları genellikle font eksikliği veya duration mismatch kaynaklıdır. `server.log` dosyası ilk bakılacak yerdir.
4.  **Mutlak vs Göreceli Yollar:** `/api/...` şeklinde mutlak yollar yerine, bazı platformlarda yaşanabilen `FILE_NOT_FOUND` hataları için göreceli yolların kullanımı (index.html'de) tercih edilebilir.

---

## 6. Gelecek Vizyonu (V4.0 Projeksiyonu)

1.  **Cloud Rendering:** Lokal CPU yerine AWS Lambda/Google Cloud Run üzerinde ölçeklenebilir render.
2.  **Çoklu Dil (Dublaj):** Videoların AI ile otomatik olarak farklı dillerde seslendirilip üretilmesi.
3.  **Mobil App:** Üretim süreçlerini uzaktan yönetmek için PWA veya Flutter tabanlı mobil arayüz.

---
**Mühür:** YTRobot v3.5 - Gold Edition "Content Factory" Edition.
