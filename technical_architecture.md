# 🏗 YTRobot Teknik Mimari Şeması

YTRobot, yüksek performanslı ve asenkron bir "İçerik Fabrikası" olarak tasarlanmıştır. Bu döküman, sistemin modüler bileşenlerini ve veri akışını anlatır.

## 1. Genel Sistem Mimarisi

Sistem; FastAPI tabanlı bir backend, Remotion tabanlı bir render motoru ve AI (Gemini/Whisper) servislerinden oluşur.

```mermaid
graph TD
    A[Kullanıcı Paneli - UI] -->|İş Emri| B[FastAPI Server]
    B -->|Kuyruğa Ekle| C[JobManager - Queue]
    C -->|Worker Aktif| D{Pipeline Tipi}
    D -->|Haber| E[News Bulletin Pipeline]
    D -->|Ürün| F[Product Review Pipeline]
    
    E --> G[Content Gen - Gemini]
    G --> H[TTS - OpenAI/Qwen]
    H --> I[Visual Fetch - Pexels/Pixabay]
    I --> J[Subtitles - Whisper]
    J --> K[Render - Remotion]
    K --> L[Social Poster]
    L --> M[Analytics Dashboard]
```

## 2. Asenkron İş Kuyruğu (JobManager)

İşler (Jobs), sunucuyu bloklamadan asenkron olarak işlenir. 

```mermaid
sequenceDiagram
    participant UI as Kullanıcı Arayüzü
    participant API as FastAPI Router
    participant QM as QueueManager (Worker)
    participant PS as Pipeline Service
    
    UI->>API: POST /api/render
    API->>QM: add_job(session_id, data)
    QM-->>API: job_id (ACK)
    API-->>UI: 202 Accepted (session_id)
    
    loop Worker Loop
        QM->>QM: get_next_job()
        QM->>PS: run_pipeline_task()
        PS->>PS: content -> voice -> visuals -> render
        PS-->>QM: task_completed
        QM->>QM: log_analytics()
    end
```

## 3. Akıllı B-Roll (AI) Karar Mekanizması

Görsel materyal eksik olduğunda sistem otonom olarak devreye girer.

1.  **Analiz**: Gemini AI, sahne metnini analiz eder.
2.  **Keyword**: Sahneye en uygun 3 anahtar kelimeyi (İngilizce) üretir.
3.  **Search**: Pexels ve Pixabay API'lerinde arama yapar.
4.  **Selection**: Çözünürlüğü ve süresi en uygun olan medyayı indirir.

## 4. Veri Saklama Katmanı
- **Sessions**: Her üretim `/sessions/{sid}` klasöründe izole edilir.
- **Analytics**: Genel istatistikler `stats.json` dosyasında tutulur.
- **Cache**: İndirilen görseller `src/core/cache.py` üzerinden optimize edilir.
