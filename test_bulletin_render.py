#!/usr/bin/env python3
"""
Bulletin Render Test — Remotion'a doğrudan props göndererek video çıktısı üretir.
TTS ve Whisper kullanmaz, sadece görsel bileşenleri test eder.

Kullanım:
    # Tüm varyasyonları render et
    python test_bulletin_render.py

    # Belirli varyasyonları render et (isimle)
    python test_bulletin_render.py --only 16x9_multi_category 9x16_source_date

    # Sadece listeyi göster (render etmeden)
    python test_bulletin_render.py --list

    # Özel çıktı dizini
    python test_bulletin_render.py --outdir /tmp/bulletin_tests

    # Düşük fps ile hızlı test (30 fps)
    python test_bulletin_render.py --fps 30
"""

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path
from datetime import datetime

# ── Proje kök dizini ─────────────────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).parent.resolve()
REMOTION_DIR = PROJECT_ROOT / "remotion"

# ── Ortak haber verileri ─────────────────────────────────────────────────────

SAMPLE_ITEMS = {
    "breaking": {
        "headline": "SON DAKİKA: DEPREM UYARISI",
        "subtext": "AFAD, İstanbul için şiddetli deprem uyarısında bulundu. Vatandaşlar tedbirli olmalı.",
        "category": "acil",
        "sourceUrl": "https://www.ntv.com.tr/turkiye/istanbul-deprem-uyarisi",
        "publishedDate": "2026-03-25T14:30:00",
        "styleOverride": "breaking",
    },
    "tech": {
        "headline": "YAPAY ZEKA DEVRİMİ: YENİ MODEL TANITILDI",
        "subtext": "Anthropic, Claude 5 modelini tanıttı. Yeni model, önceki versiyonlara kıyasla çok daha güçlü.",
        "category": "teknoloji",
        "sourceUrl": "https://www.webtekno.com/anthropic-claude-5-tanitildi",
        "publishedDate": "2026-03-24T09:15:00",
        "styleOverride": "tech",
    },
    "sport": {
        "headline": "FENERBAHÇE ŞAMPİYONLUĞA KOŞUYOR",
        "subtext": "Süper Lig'de lider Fenerbahçe, Galatasaray derbisini 3-1 kazanarak farkı açtı.",
        "category": "spor",
        "sourceUrl": "https://www.fanatik.com.tr/fenerbahce-derbi-galibiyeti",
        "publishedDate": "2026-03-23T22:00:00",
        "styleOverride": "sport",
    },
    "finance": {
        "headline": "MERKEZ BANKASI FAİZ KARARI",
        "subtext": "Merkez Bankası politika faizini 500 baz puan indirerek yüzde 40'a çekti.",
        "category": "ekonomi",
        "sourceUrl": "https://www.bloomberght.com/merkez-bankasi-faiz-karari",
        "publishedDate": "2026-03-25T14:00:00",
        "styleOverride": "finance",
    },
    "entertainment": {
        "headline": "TARO EMİR TEKİN VE NİLSU BERFİN AKTAŞ AŞK MI YAŞIYOR?",
        "subtext": "Taro Emir Tekin ve Nilsu Berfin Aktaş, aşk yaşadıkları iddialarıyla magazin gündeminde yer alıyor.",
        "category": "magazin",
        "sourceUrl": "https://www.mynet.com/taro-emir-nilsu-berfin-ask",
        "publishedDate": "2026-03-25T11:30:00",
        "styleOverride": "entertainment",
    },
    "science": {
        "headline": "NASA'DAN MARS'TA BÜYÜK KEŞİF",
        "subtext": "Mars yüzeyinde organik moleküller tespit edildi. Bilim insanları heyecanlı.",
        "category": "bilim",
        "sourceUrl": "https://www.bbc.com/turkce/nasa-mars-kesfi",
        "publishedDate": "2026-03-22T08:45:00",
        "styleOverride": "science",
    },
    "weather": {
        "headline": "İSTANBUL'DA ŞİDDETLİ YAĞIŞ BEKLENİYOR",
        "subtext": "Meteoroloji Genel Müdürlüğü, İstanbul için turuncu alarm verdi. Sel ve su baskını riski var.",
        "category": "hava",
        "sourceUrl": "https://www.havadurumu15gunluk.xyz/istanbul",
        "publishedDate": "2026-03-25T06:00:00",
        "styleOverride": "weather",
    },
    "dark": {
        "headline": "GÜNDEM ÖZETİ: HAFTANIN ÖNE ÇIKANLARI",
        "subtext": "Bu hafta gündemde öne çıkan gelişmeleri derledik. İşte tüm detaylar.",
        "category": "genel",
        "sourceUrl": "https://www.sozcu.com.tr/hafta-ozeti",
        "publishedDate": "2026-03-25T18:00:00",
        "styleOverride": "dark",
    },
}

TICKER_ITEMS = [
    {"text": "• Dolar/TL: 38.42 (+%0.3)"},
    {"text": "• Euro/TL: 41.15 (-% 0.1)"},
    {"text": "• BIST 100: 12,450 (+%1.2)"},
    {"text": "• Altın: 3,850 TL/gr"},
    {"text": "• Hava durumu: İstanbul parçalı bulutlu 18°C"},
    {"text": "• Fenerbahçe 3-1 Galatasaray"},
]


def make_item(key: str, duration_frames: int = 480) -> dict:
    """SAMPLE_ITEMS'tan bir haber oluştur."""
    base = dict(SAMPLE_ITEMS[key])
    base["duration"] = duration_frames
    return base


# ── Test Varyasyonları ────────────────────────────────────────────────────────

def get_variations() -> dict:
    """Tüm test varyasyonlarını döndürür. Her biri (açıklama, props) tuple."""
    return {
        # ─── 16:9 TESTLER ────────────────────────────────────────────────
        "16x9_single_breaking": (
            "16:9 — Tek haber, breaking stil, kaynak+tarih açık",
            {
                "composition": "NewsBulletin",
                "networkName": "TEST HABER",
                "style": "breaking",
                "items": [make_item("breaking", 360)],
                "ticker": TICKER_ITEMS,
                "showLiveIndicator": True,
                "showCategoryFlash": False,
                "showItemIntro": False,
                "showSource": True,
                "showDate": True,
            },
        ),
        "16x9_multi_category": (
            "16:9 — 3 farklı kategori, category flash + item intro açık",
            {
                "composition": "NewsBulletin",
                "networkName": "KANAL 7",
                "style": "breaking",
                "items": [
                    make_item("breaking", 360),
                    make_item("tech", 360),
                    make_item("entertainment", 360),
                ],
                "ticker": TICKER_ITEMS,
                "showLiveIndicator": True,
                "showCategoryFlash": True,
                "showItemIntro": True,
                "showSource": True,
                "showDate": True,
            },
        ),
        "16x9_no_source_date": (
            "16:9 — 2 haber, kaynak+tarih kapalı",
            {
                "composition": "NewsBulletin",
                "networkName": "HABER GLOBAL",
                "style": "corporate",
                "items": [
                    make_item("finance", 360),
                    make_item("science", 360),
                ],
                "ticker": TICKER_ITEMS,
                "showLiveIndicator": False,
                "showCategoryFlash": True,
                "showItemIntro": False,
                "showSource": False,
                "showDate": False,
            },
        ),
        "16x9_all_styles": (
            "16:9 — Tüm stiller (8 haber), her stil farklı renk",
            {
                "composition": "NewsBulletin",
                "networkName": "YTRobot TV",
                "style": "breaking",
                "items": [
                    make_item("breaking", 240),
                    make_item("tech", 240),
                    make_item("sport", 240),
                    make_item("finance", 240),
                    make_item("entertainment", 240),
                    make_item("science", 240),
                    make_item("weather", 240),
                    make_item("dark", 240),
                ],
                "ticker": TICKER_ITEMS,
                "showLiveIndicator": True,
                "showCategoryFlash": True,
                "showItemIntro": False,
                "showSource": True,
                "showDate": True,
            },
        ),
        "16x9_no_ticker": (
            "16:9 — Tek haber, ticker yok (per_item simülasyonu)",
            {
                "composition": "NewsBulletin",
                "networkName": "FLASH TV",
                "style": "entertainment",
                "items": [make_item("entertainment", 480)],
                "ticker": [],
                "showLiveIndicator": False,
                "showCategoryFlash": False,
                "showItemIntro": False,
                "showSource": True,
                "showDate": True,
            },
        ),

        # ─── 9:16 TESTLER ────────────────────────────────────────────────
        "9x16_single_breaking": (
            "9:16 — Tek haber, breaking stil, kaynak+tarih açık",
            {
                "composition": "NewsBulletin9x16",
                "networkName": "TEST HABER",
                "style": "breaking",
                "items": [make_item("breaking", 360)],
                "ticker": TICKER_ITEMS,
                "showLiveIndicator": True,
                "showCategoryFlash": False,
                "showItemIntro": False,
                "showSource": True,
                "showDate": True,
            },
        ),
        "9x16_source_date": (
            "9:16 — 2 haber, kaynak+tarih açık, farklı stiller",
            {
                "composition": "NewsBulletin9x16",
                "networkName": "SHORTS HABER",
                "style": "breaking",
                "items": [
                    make_item("entertainment", 360),
                    make_item("tech", 360),
                ],
                "ticker": TICKER_ITEMS,
                "showLiveIndicator": True,
                "showCategoryFlash": True,
                "showItemIntro": True,
                "showSource": True,
                "showDate": True,
            },
        ),
        "9x16_no_source_date": (
            "9:16 — 2 haber, kaynak+tarih kapalı",
            {
                "composition": "NewsBulletin9x16",
                "networkName": "KISA HABER",
                "style": "sport",
                "items": [
                    make_item("sport", 360),
                    make_item("finance", 360),
                ],
                "ticker": TICKER_ITEMS,
                "showLiveIndicator": False,
                "showCategoryFlash": True,
                "showItemIntro": False,
                "showSource": False,
                "showDate": False,
            },
        ),
        "9x16_multi_category": (
            "9:16 — 4 farklı kategori, tüm özellikler açık",
            {
                "composition": "NewsBulletin9x16",
                "networkName": "GÜNDEM TV",
                "style": "breaking",
                "items": [
                    make_item("breaking", 300),
                    make_item("entertainment", 300),
                    make_item("science", 300),
                    make_item("weather", 300),
                ],
                "ticker": TICKER_ITEMS,
                "showLiveIndicator": True,
                "showCategoryFlash": True,
                "showItemIntro": True,
                "showSource": True,
                "showDate": True,
            },
        ),
        "9x16_no_ticker": (
            "9:16 — Tek haber, ticker yok",
            {
                "composition": "NewsBulletin9x16",
                "networkName": "MAGAZİN",
                "style": "entertainment",
                "items": [make_item("entertainment", 480)],
                "ticker": [],
                "showLiveIndicator": False,
                "showCategoryFlash": False,
                "showItemIntro": False,
                "showSource": True,
                "showDate": True,
            },
        ),
        "9x16_only_source": (
            "9:16 — Sadece kaynak göster, tarih kapalı",
            {
                "composition": "NewsBulletin9x16",
                "networkName": "HABER AKIŞI",
                "style": "dark",
                "items": [
                    make_item("dark", 360),
                    make_item("finance", 360),
                ],
                "ticker": TICKER_ITEMS,
                "showLiveIndicator": False,
                "showCategoryFlash": False,
                "showItemIntro": False,
                "showSource": True,
                "showDate": False,
            },
        ),
        "9x16_only_date": (
            "9:16 — Sadece tarih göster, kaynak kapalı",
            {
                "composition": "NewsBulletin9x16",
                "networkName": "BİLİM TV",
                "style": "science",
                "items": [
                    make_item("science", 360),
                    make_item("tech", 360),
                ],
                "ticker": TICKER_ITEMS,
                "showLiveIndicator": True,
                "showCategoryFlash": True,
                "showItemIntro": False,
                "showSource": False,
                "showDate": True,
            },
        ),
    }


# ── Render fonksiyonu ─────────────────────────────────────────────────────────

def render_variation(name: str, desc: str, props: dict, outdir: Path, fps: int = 60) -> bool:
    """Tek bir varyasyonu Remotion ile render eder."""
    props["fps"] = fps
    comp_id = props.pop("composition", "NewsBulletin")
    output_file = outdir / f"{name}.mp4"

    print(f"\n{'='*70}")
    print(f"  {name}")
    print(f"  {desc}")
    print(f"  Composition: {comp_id} | Items: {len(props.get('items', []))} | FPS: {fps}")
    print(f"  Output: {output_file}")
    print(f"{'='*70}")

    props_json = json.dumps(props, ensure_ascii=False)

    cmd = [
        "npx", "remotion", "render", comp_id,
        str(output_file.resolve()),
        f"--props={props_json}",
        "--concurrency=50%",
    ]

    try:
        proc = subprocess.run(
            cmd,
            cwd=str(REMOTION_DIR),
            capture_output=True,
            text=True,
            timeout=300,
        )
        if proc.returncode != 0:
            print(f"  HATA! (exit code {proc.returncode})")
            # Son 500 karakter hata mesajı
            stderr_tail = (proc.stderr or proc.stdout or "")[-500:]
            print(f"  {stderr_tail}")
            return False
        else:
            size_mb = output_file.stat().st_size / (1024 * 1024) if output_file.exists() else 0
            print(f"  OK ({size_mb:.1f} MB)")
            return True
    except subprocess.TimeoutExpired:
        print(f"  TIMEOUT (300s)")
        return False
    except Exception as e:
        print(f"  EXCEPTION: {e}")
        return False


# ── Ana program ───────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Bulletin render test varyasyonları")
    parser.add_argument("--list", action="store_true", help="Varyasyonları listele, render etme")
    parser.add_argument("--only", nargs="*", help="Sadece belirtilen varyasyonları render et")
    parser.add_argument("--outdir", type=str, default=None, help="Çıktı dizini")
    parser.add_argument("--fps", type=int, default=60, help="FPS (varsayılan: 60, hızlı test: 30)")
    args = parser.parse_args()

    variations = get_variations()

    if args.list:
        print(f"\nToplam {len(variations)} test varyasyonu:\n")
        for name, (desc, props) in variations.items():
            comp = props.get("composition", "NewsBulletin")
            n_items = len(props.get("items", []))
            features = []
            if props.get("showCategoryFlash"):
                features.append("flash")
            if props.get("showItemIntro"):
                features.append("intro")
            if props.get("showSource"):
                features.append("kaynak")
            if props.get("showDate"):
                features.append("tarih")
            if props.get("showLiveIndicator"):
                features.append("live")
            if not props.get("ticker"):
                features.append("ticker-yok")
            feat_str = ", ".join(features) if features else "-"
            print(f"  {name:<30s} {comp:<20s} {n_items} haber  [{feat_str}]")
            print(f"    {desc}")
        return

    # Çıktı dizini
    if args.outdir:
        outdir = Path(args.outdir)
    else:
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        outdir = PROJECT_ROOT / "output" / f"test_bulletin_{ts}"
    outdir.mkdir(parents=True, exist_ok=True)

    # Hangi varyasyonlar render edilecek?
    if args.only:
        selected = {k: v for k, v in variations.items() if k in args.only}
        unknown = set(args.only) - set(variations.keys())
        if unknown:
            print(f"Bilinmeyen varyasyonlar: {', '.join(unknown)}")
            print(f"Mevcut: {', '.join(variations.keys())}")
            sys.exit(1)
    else:
        selected = variations

    print(f"\n Bulletin Render Test")
    print(f"  {len(selected)} varyasyon render edilecek")
    print(f"  FPS: {args.fps}")
    print(f"  Çıktı: {outdir}")

    results = {}
    start = datetime.now()

    for name, (desc, props) in selected.items():
        props_copy = json.loads(json.dumps(props))  # deep copy
        ok = render_variation(name, desc, props_copy, outdir, fps=args.fps)
        results[name] = ok

    elapsed = (datetime.now() - start).total_seconds()

    # Özet
    print(f"\n{'='*70}")
    print(f"  SONUÇLAR ({elapsed:.0f}s)")
    print(f"{'='*70}")
    ok_count = sum(1 for v in results.values() if v)
    fail_count = len(results) - ok_count
    for name, ok in results.items():
        status = "OK" if ok else "HATA"
        print(f"  [{status:>4s}] {name}")
    print(f"\n  Toplam: {ok_count} basarili, {fail_count} hata")
    print(f"  Çıktı dizini: {outdir}")

    if fail_count > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
