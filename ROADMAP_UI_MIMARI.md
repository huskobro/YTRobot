# YTRobot v3.0 — Kapsamli UI/UX & Sistem Mimarisi Yol Haritasi

> **Amac:** YTRobot'u dunya klasmaninda, profesyonel bir video uretim platformuna tasimak.
> **Tarih:** 2026-03-26
> **Durum:** Oneri Dokumani — Uygulama Oncesi

---

## ICINDEKILER

1. [Mevcut Durum Analizi](#1-mevcut-durum-analizi)
2. [Kritik Hatalar & Acil Duzeltmeler](#2-kritik-hatalar--acil-duzeltmeler)
3. [UI/UX Yeniden Tasarim Onerisi](#3-uiux-yeniden-tasarim-onerisi)
4. [Ayarlar Penceresi Yeniden Yapilandirmasi](#4-ayarlar-penceresi-yeniden-yapilandirmasi)
5. [Sistem Mimarisi Iyilestirmeleri](#5-sistem-mimarisi-iyilestirmeleri)
6. [Eski Commit'ten Entegrasyon Onerileri](#6-eski-committen-entegrasyon-onerileri)
7. [Uygulama Plani & Oncelik Sirasi](#7-uygulama-plani--oncelik-sirasi)

---

## 1. MEVCUT DURUM ANALIZI

### 1.1 Genel Bakis

| Bilesen | Dosya | Satir | Durum |
|---------|-------|-------|-------|
| UI (HTML SPA) | `ui/index.html` | ~5.300 | Tek dosyada tum arayuz — bakim zorlugu |
| Uygulama Mantigi | `ui/js/app.js` | ~1.200 | Alpine.js ile monolitik state |
| Ceviriler | `ui/js/translations.js` | ~865 | TR/EN — eksik anahtarlar var |
| CSS | `ui/css/style.css` | 106 | Sadece ozel stiller, Tailwind CDN bagimliligi |
| Sunucu | `server.py` | 111 | FastAPI — temiz ama eksik |
| API Route'lar | `src/api/routes/*.py` | ~990 | 6 router — tutarsiz hata yonetimi |
| Config | `config.py` | ~196 | 160+ alan — cok karmasik |

### 1.2 Tespit Edilen Sorun Sayilari

| Kategori | Sayi | Siddet |
|----------|------|--------|
| Kritik (cokme/veri kaybi riski) | 5 | KIRMIZI |
| Yuksek (sessiz hatalar) | 8 | TURUNCU |
| Orta (yanlis davranis) | 12 | SARI |
| Dusuk (kozmetik/kalite) | 8 | MAVI |
| Uygulanmamis ozellik | 3 | GRI |

---

## 2. KRITIK HATALAR & ACIL DUZELTMELER

### 2.1 `/api/voices` Endpoint Eksik (KRITIK)

**Sorun:** UI'da `fetchVoices()` ve `fetchBulletinVoices()` fonksiyonlari `/api/voices` endpoint'ine istek atiyor, ancak bu endpoint hicbir route dosyasinda tanimli degil. Sonuc: 404 hatasi, kullaniciya hicbir geri bildirim yok.

**Cozum:**
```python
# src/api/routes/system.py'ye eklenecek
@router.get("/voices/{provider}")
async def get_voices(provider: str):
    cfg = Settings()
    if provider == "elevenlabs":
        # ElevenLabs API'den ses listesi cek
        ...
    elif provider == "speshaudio":
        # SpeshAudio API'den ses listesi cek
        ...
    elif provider == "openai":
        # OpenAI sabit ses listesini dondur
        return [
            {"id": "alloy", "name": "Alloy"}, {"id": "ash", "name": "Ash"},
            {"id": "coral", "name": "Coral"}, {"id": "echo", "name": "Echo"},
            {"id": "nova", "name": "Nova"}, {"id": "onyx", "name": "Onyx"},
            {"id": "sage", "name": "Sage"}, {"id": "shimmer", "name": "Shimmer"}
        ]
```

### 2.2 Sessiz `except:` Bloklari (KRITIK — 8 adet)

**Sorun:** Kod genelinde 8 adet `except: pass` veya `except:` blogu var. Hatalar loglanmiyor, kullaniciya bildirilmiyor.

**Konumlar:**
| Dosya | Satir | Etki |
|-------|-------|------|
| `social.py` | 38, 48 | AI provider hatalari yok sayiliyor |
| `product.py` | 67, 223, 297 | Process ID, TTS, URL cekme hatalari yutulyor |
| `system.py` | 124 | Temizleme islemi sessizce basarisiz |
| `server.py` | 93 | Log streaming hatasi sessizce bitiyor |

**Cozum:** Her `except:` bloguna `except Exception as e: logger.error(f"...: {e}")` eklenecek.

### 2.3 API Key Test Stub'i (YUKSEK)

**Sorun:** `system.py:101` — Tanimlanmamis provider'lar icin `return ok(f"Provider {provider} ok (stub)")` donuyor. Kullanici gecersiz anahtarin calistigini saniyor.

**Cozum:**
```python
# Bilinmeyen provider icin hata dondur
return fail(f"Bilinmeyen provider: {provider}")
```

### 2.4 SSE/Polling Bellek Sizintilari (YUKSEK)

**Sorun:** `_bulletinPoll` ve `_prPoll` setInterval donguleri temizlenmiyor. Kullanici hizla sayfa degistirirse birden fazla esanli polling basliyor.

**Cozum:**
```javascript
// Her yeni poll baslatmadan once eskiyi temizle
if (this._bulletinPoll) clearInterval(this._bulletinPoll);
this._bulletinPoll = setInterval(() => {...}, 2000);
```

### 2.5 Schema-Kod Uyumsuzlugu (ORTA)

**Sorun:** `SocialMetaReq` schema'da `title`, `description`, `tags` alanlari var, ama `/api/social-meta/generate` endpoint'i `body.fields` ve `body.context` okuyor. Request her zaman validation hatasi alacak.

**Cozum:** Schema'yi endpoint'le uyumlu hale getir.

---

## 3. UI/UX YENIDEN TASARIM ONERISI

### 3.1 Mevcut Sorunlar

1. **Monolitik index.html (~5.300 satir):** Tum sayfalar, modaller, wizard'lar tek dosyada. Bakim imkansiza yakin.
2. **Tutarsiz dil kullanimi:** Bazi label'lar Turkce hardcoded, bazilari `t()` fonksiyonu ile. Ceviri gecisi eksik.
3. **Hata geri bildirimi yok:** API cagrilari basarisiz oldugunda `console.error` ile loglanip geciliyor, kullanici birsey gormuyor.
4. **Mobil uyumluluk:** Responsive tasarim minimal — buyuk masaustu ekranlar icin optimize edilmis.
5. **Erisebilirlik (a11y):** ARIA etiketleri, focus yonetimi, klavye navigasyonu yetersiz.

### 3.2 Onerilen UI Mimarisi

```
ui/
├── index.html              ← Minimal kabuk (Alpine.js init, router)
├── css/
│   ├── style.css           ← Ozel stiller
│   └── components.css      ← Bilesenlere ozel stiller
├── js/
│   ├── app.js              ← Ana Alpine store (state + routing)
│   ├── translations.js     ← Ceviri sistemi
│   ├── modules/
│   │   ├── wizard.js       ← Video olusturma wizard
│   │   ├── bulletin.js     ← Haber bulteni modulu
│   │   ├── product.js      ← Urun inceleme modulu
│   │   ├── settings.js     ← Ayarlar yonetimi
│   │   └── social.js       ← Sosyal medya modulu
│   └── utils/
│       ├── api.js           ← Merkezi API istemci (hata yonetimi dahil)
│       ├── toast.js         ← Bildirim sistemi
│       └── validators.js   ← Form dogrulama
└── components/             ← HTML parcalari (Alpine x-html ile yuklenebilir)
    ├── sidebar.html
    ├── settings-modal.html
    └── command-palette.html
```

### 3.3 Tasarim Dili Onerileri

#### 3.3.1 Renk Sistemi (Mevcut korunacak, tutarlilik saglanacak)
```
Ana Tema:     Slate/Indigo (koyu mod)
YT Video:     Indigo vurgu (#6366f1)
Haber Bulteni: Kirmizi vurgu (#ef4444)
Urun Inceleme: Amber vurgu (#f59e0b)
Basari:       Emerald (#10b981)
Hata:         Rose (#f43f5e)
```

#### 3.3.2 Bildirim Sistemi (Toast)
Simdi `alert()` veya sessiz hata var. Onerilen:
```javascript
// Merkezi bildirim sistemi
Alpine.store('toast', {
    items: [],
    show(message, type = 'info', duration = 4000) {
        const id = Date.now();
        this.items.push({ id, message, type });
        setTimeout(() => this.dismiss(id), duration);
    },
    dismiss(id) {
        this.items = this.items.filter(t => t.id !== id);
    }
});

// Kullanim:
// Alpine.store('toast').show('Ayarlar kaydedildi', 'success');
// Alpine.store('toast').show('API baglantisi basarisiz', 'error');
```

#### 3.3.3 Merkezi API Istemci
```javascript
// ui/js/utils/api.js
async function apiCall(endpoint, options = {}) {
    try {
        const res = await fetch(`/api/${endpoint}`, {
            headers: { 'Content-Type': 'application/json' },
            ...options
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
            throw new Error(err.error || err.message || 'Bilinmeyen hata');
        }
        return await res.json();
    } catch (e) {
        Alpine.store('toast').show(e.message, 'error');
        throw e;
    }
}
```

### 3.4 Wizard (Video Olusturma Adim Adim) Iyilestirmeleri

**Mevcut:** Adim gecisleri calisiyor ama validasyon yok.

**Oneriler:**
1. Her adimda "ileri" butonunu ancak gerekli alanlar doldurulunca aktif et
2. Adim icerigi kaybolmasin — geri dondugunde doldurdugu veriler durmali
3. Son adimda ozet ekrani goster (konu, sahne sayisi, ses ayarlari, gorsel provider)
4. "Taslak Kaydet" butonu — yari kalmis isi sonra devam ettirme
5. Ilerleme cubugu gercekci olsun (sahne/render ilerlemesi backend'den)

---

## 4. AYARLAR PENCERESI YENIDEN YAPILANDIRMASI

### 4.1 Mevcut Durum

Ayarlar penceresi su an bir tek modalde:
- **Cok uzun** — 20+ ayar grubu dikey olarak siralanmis
- **Provider'a ozel ses alanlari** kismen uygulanmis (eski commit 64c3c64'te daha iyi)
- **Modullere ozel ayarlar** (YT Video, Haber Bulteni, Urun Inceleme) birbirine karismis
- **Ayar degisikliklerinde geri bildirim** eksik

### 4.2 Onerilen Yapi: Sekmeli Ayarlar

```
┌─────────────────────────────────────────────────────────┐
│  AYARLAR                                           [X]  │
├─────────────────────────────────────────────────────────┤
│  [Genel] [Ses (TTS)] [Gorseller] [Altyazi] [Moduller]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─ GENEL ─────────────────────────────────────────┐   │
│  │ Dil:           [Turkce ▼]                       │   │
│  │ LLM Provider:  [KieAI (Gemini) ▼]              │   │
│  │ Cikti Dizini:  [output/]                        │   │
│  │ Cozunurluk:    [1920x1080 ▼]                    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─ API ANAHTARLARI ──────────────────────────────┐    │
│  │ OpenAI:    [sk-****] [Test ✓]                   │   │
│  │ ElevenLabs:[****]    [Test ✓]                   │   │
│  │ SpeshAudio:[****]    [Test ...]                  │   │
│  │ Pexels:    [****]    [Test ✓]                   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│                    [Kaydet]  [Varsayilanlara Don]       │
└─────────────────────────────────────────────────────────┘
```

### 4.3 Eski Commit'ten Alinacak Provider-Bazli Ses Secimi

Commit `64c3c64`'te cok iyi bir pattern var: Secili TTS provider'a gore farkli ses secim UI'i gosteriliyor. Bu pattern'i genellestirmek lazim:

```html
<!-- Provider'a gore dinamik ses secici -->
<template x-if="activeProvider === 'elevenlabs'">
    <div class="space-y-2">
        <select x-model="voiceId" class="...">
            <option value="">(Varsayilan)</option>
            <template x-for="v in voices" :key="v.id">
                <option :value="v.id" x-text="v.name"></option>
            </template>
        </select>
        <input type="text" x-model="voiceId" placeholder="Manuel ID..." class="..." />
    </div>
</template>

<template x-if="activeProvider === 'openai'">
    <select x-model="voiceId" class="...">
        <option value="alloy">Alloy</option>
        <option value="coral">Coral</option>
        <!-- ... -->
    </select>
</template>

<template x-if="activeProvider === 'speshaudio'">
    <!-- Ayni pattern: dropdown + manuel input -->
</template>
```

**Fark:** Eski commit'te bu 3 modul icin (YT, Bulletin, Product) ayri ayri tekrarlaniyor (~150 satir tekrar). Onerilen: **Tek bir `VoiceSelector` bilesenine** cevir ve `x-data` ile parametrize et.

### 4.4 Modul Bazli Ayarlar

Her modul (YT Video, Haber Bulteni, Urun Inceleme) icin:
- "Global ayarlari kullan" varsayilan olsun
- "Override" toggle ile modul-ozel ayarlar acilin
- Override aciksa: provider, ses, hiz, dil alanlari gorunur hale gelsin
- Eski commit'teki `bulletinOverrideStyles` pattern'i genellestirilecek

---

## 5. SISTEM MIMARISI IYILESTIRMELERI

### 5.1 Config Karmasikligi Azaltma

**Sorun:** `config.py`'de 160+ alan var, cogu tekrarlanan pattern:
```python
tts_voice_id = ""
yt_tts_voice_id = ""          # deprecated
yt_elevenlabs_voice_id = ""
yt_openai_tts_voice = ""
yt_speshaudio_voice_id = ""
bulletin_tts_voice_id = ""    # deprecated
bulletin_elevenlabs_voice_id = ""
# ... boyle 40+ tekrarlanan alan
```

**Onerilen Cozum:** Ic ice yapilandirma (nested config):
```python
class TTSConfig(BaseModel):
    provider: str = ""
    voice_id: str = ""
    elevenlabs_voice_id: str = ""
    openai_voice: str = ""
    speshaudio_voice_id: str = ""
    speed: float = 0.0
    language: str = ""
    stability: float = -1.0
    similarity_boost: float = -1.0

class ModuleConfig(BaseModel):
    tts: TTSConfig = TTSConfig()
    # modul-ozel diger ayarlar

class Settings(BaseSettings):
    # Global
    tts: TTSConfig = TTSConfig()
    visuals_provider: str = "pexels"

    # Modul overrides
    yt: ModuleConfig = ModuleConfig()
    bulletin: ModuleConfig = ModuleConfig()
    product_review: ModuleConfig = ModuleConfig()
```

> **Not:** Bu degisiklik buyuk bir refactoring gerektiriyor. Oncelikle mevcut flat yapiyi koruyup, sadece UI tarafinda gruplama yapmak daha guvenli bir ilk adim olabilir.

### 5.2 Kuyruk Sistemi Iyilestirmesi

**Mevcut Sorunlar:**
1. Job timeout yok — asili kalan is kuyrugun tamamini kilitliyor
2. Esanli islem limiti yok
3. Job iptali calisiyor ama cleanup eksik

**Oneriler:**
```python
# queue.py iyilestirmeleri
class QueueManager:
    MAX_CONCURRENT = 2          # Esanli is limiti
    JOB_TIMEOUT = 1800          # 30 dk timeout

    async def _execute_job(self, job):
        try:
            await asyncio.wait_for(
                self._run_job(job),
                timeout=self.JOB_TIMEOUT
            )
        except asyncio.TimeoutError:
            job.status = "failed"
            job.error = "Zaman asimi (30 dakika)"
            logger.error(f"Job {job.id} timeout")
```

### 5.3 Dosya Yazma Guvenligi

**Sorun:** `_write_env()`, `_write_session()` gibi fonksiyonlar dogrudan dosyaya yaziyor. Yari yazilmis dosya bozulmaya yol acar.

**Cozum:** Atomik yazma:
```python
import tempfile

def safe_write(path: Path, content: str):
    """Once gecici dosyaya yaz, sonra rename ile degistir (atomik)."""
    fd, tmp_path = tempfile.mkstemp(dir=path.parent, suffix='.tmp')
    try:
        with os.fdopen(fd, 'w', encoding='utf-8') as f:
            f.write(content)
        os.replace(tmp_path, path)  # Atomik islem
    except:
        os.unlink(tmp_path)
        raise
```

### 5.4 Loglama Altyapisi

**Mevcut:** `print()` ve `console.error()` karisimi. Yapi yok.

**Onerilen:**
```python
import logging

# Her modul icin ayri logger
logger = logging.getLogger("ytrobot.api")
tts_logger = logging.getLogger("ytrobot.tts")
render_logger = logging.getLogger("ytrobot.render")

# Formatli cikti
logging.basicConfig(
    format='%(asctime)s [%(name)s] %(levelname)s: %(message)s',
    level=logging.INFO
)
```

---

## 6. ESKI COMMIT'TEN ENTEGRASYON ONERILERI

Commit `64c3c64` icindeki onemli iyilestirmeler ve entegrasyon plani:

### 6.1 Provider-Bazli Ses Secimi (ENTEGRE ET)

**Durum:** Bu commit'te ElevenLabs/OpenAI/SpeshAudio icin ayri voice selector'lar eklenmis. Cok kullanisli.

**Aksiyon:**
- Yeni config alanlari (`yt_elevenlabs_voice_id`, `bulletin_openai_tts_voice`, vb.) zaten ekli mi kontrol et
- UI tarafinda `x-show` ile provider'a gore dinamik gosterim entegre et
- Tekrar eden HTML'i tek bir bilesene cevir

### 6.2 Haber Bulteni Dil Secimi (ENTEGRE ET)

**Durum:** `bulletinRenderCfg.lang` alani ve "Otomatik/Turkce/English" dropdown eklenmis.

**Aksiyon:**
- `lang` parametresini render API'ye gonder
- Remotion tarafinda `localization.ts` dosyasi ile dil destegi sagla
- Varsayilan "auto" ile mevcut davranis korunsun

### 6.3 Stil Override Toggle (ENTEGRE ET)

**Durum:** `bulletinOverrideStyles` switch'i — "Yalnizca Ozel Stil Kullan" acildiginda per-category/per-item stil secicileri gorunur, kapali oldugunda preset stilini kullanir.

**Aksiyon:**
- Bu pattern mantikli — gereksiz karmasikligi gizliyor
- Ayni pattern'i diger modullere de uygula (YT Video gorsel ayarlari, Product Review TTS ayarlari)

### 6.4 Entegre Edilmemesi Gerekenler

- **TTS pipeline degisiklikleri** (`pipeline/tts.py`): Mevcut kodda zaten daha gelismis bir TTS fallback zinciri var, eski commit'teki degisiklikler geriye dogru

---

## 7. UYGULAMA PLANI & ONCELIK SIRASI

### FAZ 1: Acil Duzeltmeler (1-2 gun)

| # | Is | Dosya | Oncelik |
|---|-----|-------|---------|
| 1 | `/api/voices` endpoint'i olustur | `system.py` | KRITIK |
| 2 | Tum `except: pass` bloklarini loglamali hale getir | 6 dosya | KRITIK |
| 3 | API test stub'ini hata dondurecek sekilde duzelt | `system.py:101` | YUKSEK |
| 4 | SSE/Polling cleanup (clearInterval) | `app.js` | YUKSEK |
| 5 | Schema-kod uyumsuzlugunu duzelt (`SocialMetaReq`) | `schemas.py` | ORTA |

### FAZ 2: UI Iyilestirmeleri (3-5 gun)

| # | Is | Etki |
|---|-----|------|
| 6 | Toast bildirim sistemi ekle | Kullanici tum hatalari gorecek |
| 7 | Merkezi API istemci (`apiCall()`) | Tutarli hata yonetimi |
| 8 | Ayarlar penceresini sekmeli yap | Kullanilabilirlik |
| 9 | Provider-bazli ses secimi entegre et (commit 64c3c64) | Islevsellik |
| 10 | Eksik ceviri anahtarlarini tamamla | i18n tutarliligi |

### FAZ 3: Mimari Iyilestirmeler (1 hafta)

| # | Is | Etki |
|---|-----|------|
| 11 | Kuyruk sistemi: timeout + esanli is limiti | Kararlilik |
| 12 | Atomik dosya yazma | Veri butunlugu |
| 13 | Python logging altyapisi | Hata ayiklama |
| 14 | `.env` yazma: ozel karakter escaping | Config guvenligi |

### FAZ 4: Dunya Klasmani Ozellikleri (2+ hafta)

| # | Is | Etki |
|---|-----|------|
| 15 | index.html'i modullere bol | Bakim kolayligi |
| 16 | Gercek zamanli ilerleme cubugu (WebSocket) | UX |
| 17 | Mobil responsive tasarim | Erisim |
| 18 | Klavye kisayollari genislet (Command Palette) | Verimlilik |
| 19 | Taslak kaydetme / devam ettirme | Is surekliligi |
| 20 | A/B test: farkli gorsel provider'lari karsilastir | Kalite |

---

## EK: HATA HARITASI

```
server.py:93        → except: break (SSE log stream sessiz cokus)
system.py:101       → Stub provider OK donuyor (yaniltici)
system.py:124       → except: pass (cleanup hatasi yutulmus)
social.py:38,48     → except: pass (AI provider hatalari)
product.py:67       → except: int() parse hatasi
product.py:223      → except: TTS cagirisi hatasi
product.py:297      → except: URL fetch hatasi "(Fetch failed)" ile devam
schemas.py:35-38    → SocialMetaReq alanlari endpoint ile uyumsuz
app.js              → fetchVoices() → 404 (endpoint yok)
app.js              → _bulletinPoll clearInterval eksik
app.js              → Hata durumunda console.error, kullaniciya bildirim yok
translations.js     → ~40 anahtar sadece TR veya EN'de var
config.py           → 160+ alan, ~40 tekrarlanan pattern
```

---

## SONUC

YTRobot guclu bir pipeline mimarisine ve etkileyici bir ozellik setine sahip. Ancak **hata yonetimi**, **UI tutarliligi** ve **config karmasikligi** acisindan iyilestirmelere ihtiyac var.

Eski commit'teki (64c3c64) **provider-bazli ses secimi**, **dil secimi** ve **stil override toggle** ozellikleri degerli ve mevcut versiyona entegre edilmeli.

Oncelik sirasi: **Once kararlilik (Faz 1-2), sonra ozellik (Faz 3-4).**

> Bu dokuman, uygulamaya baslamadan once tartisma ve onay icin hazirlanmistir.
