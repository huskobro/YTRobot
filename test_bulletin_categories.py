import requests
import time
import json
import os
from pathlib import Path

BASE_URL = "http://localhost:8080"

# All 9 styles
STYLES = [
    "breaking", "tech", "corporate", "sport", "finance", 
    "weather", "science", "entertainment", "dark"
]

# Mapping human readable categories to styles for testing
CATEGORY_MAP = {
    "Gündem": "breaking",
    "Teknoloji": "tech",
    "Kurumsal": "corporate",
    "Spor": "sport",
    "Ekonomi": "finance",
    "Hava Durumu": "weather",
    "Bilim": "science",
    "Magazin": "entertainment",
    "Genel": "dark"
}

TEST_ITEMS = {
    "breaking": [
        {"title": "Marmara Depremi Alarmı", "narration": "Uzmanlar Marmara bölgesi için kritik uyarıda bulundu. Tahliye planları güncellendi.", "category": "Gündem"},
        {"title": "Ekonomik Reform Paketi Hazır", "narration": "Yeni reform paketi yarın meclise sunuluyor. Vergi düzenlemeleri yolda.", "category": "Gündem"}
    ],
    "tech": [
        {"title": "GPT-5 Önizlemesi Sızdı", "narration": "Yeni nesil yapay zeka modelinin akıl yürütme becerilerinde devrim yapacağı iddia ediliyor.", "category": "Teknoloji"},
        {"title": "Kuantum Bilgisayar Rekoru", "narration": "Çinli bilim insanları kuantum üstünlüğünde yeni bir eşiği aştıklarını duyurdu.", "category": "Teknoloji"}
    ],
    "corporate": [
        {"title": "YTRobot Global Büyüme", "narration": "Antigravity ekibi yeni ofisini Londra'da açtı. Global pazarda iddialı hedefler var.", "category": "Kurumsal"}
    ],
    "sport": [
        {"title": "Şampiyonluk Yarışı Kızışıyor", "narration": "Liderin puan kaybettiği haftada zirve yarışı yeniden alevlendi. Puan farkı bire indi.", "category": "Spor"}
    ],
    "finance": [
        {"title": "Altın Fiyatlarında Sert Yükseliş", "narration": "Jeopolitik risklerin artmasıyla birlikte ons altın tarihi zirvesine yaklaştı.", "category": "Ekonomi"}
    ],
    "weather": [
        {"title": "Hafta Sonu Kar Bekleniyor", "narration": "Meteoroloji'den gelen son verilere göre Balkanlar üzerinden soğuk hava dalgası geliyor.", "category": "Hava Durumu"}
    ],
    "science": [
        {"title": "Gen Terapisinde Yeni Başarı", "narration": "Nadir bir kalıtsal hastalık gen terapisiyle ilk kez tedavi edildi. Tıpta dönüm noktası.", "category": "Bilim"}
    ],
    "entertainment": [
        {"title": "Oscar Adayları Açıklandı", "narration": "Bu yılki akademi ödüllerinde 'Dune 3' adaylıklara damga vurdu. Tören Mart'ta.", "category": "Magazin"}
    ],
    "dark": [
        {"title": "Yollarda Yeni Düzenleme", "narration": "Şehir içi trafik yoğunluğunu azaltmak için yeni akıllı kavşak sistemi devreye girdi.", "category": "Genel"}
    ]
}

def render_test(style, fmt="16:9"):
    cat = [k for k,v in CATEGORY_MAP.items() if v == style][0]
    items = TEST_ITEMS.get(style, TEST_ITEMS["dark"])
    
    payload = {
        "network_name": "HABER TEST",
        "style": style,
        "format": fmt,
        "fps": 30,
        "ticker": [
            {"text": f"KATEGORİ TESTİ: {cat.upper()}"},
            {"text": f"STİL: {style.upper()} ({fmt})"},
            {"text": "YTRobot Pipeline Doğrulama Testi"}
        ],
        "category_templates": CATEGORY_MAP,
        "items": items,
        "lower_third_enabled": True,
        "lower_third_text": f"TEST: {style.upper()} CATEGORY",
        "show_live": True,
        "ticker_enabled": True
    }
    
    print(f"Rendering {style} ({fmt})...")
    r = requests.post(f"{BASE_URL}/api/bulletin/render", json=payload)
    if r.status_code == 200:
        bid = r.json().get("bulletin_id")
        print(f"  Queued: {bid}")
        return bid
    else:
        print(f"  Error: {r.text}")
        return None

def main():
    print("Starting Comprehensive Category Style Test...")
    jobs = []
    
    # Render all categories with their mapped styles
    # Mix formats: 16:9 for first half, 9:16 for second half
    for i, style in enumerate(STYLES):
        fmt = "16:9" if i < 5 else "9:16"
        jid = render_test(style, fmt)
        if jid:
            jobs.append((jid, style))
            
    print("\nWaiting for renders to complete...")
    finished = set()
    while len(finished) < len(jobs):
        for jid, style in jobs:
            if jid in finished: continue
            try:
                r = requests.get(f"{BASE_URL}/api/bulletin/render/{jid}")
                st = r.json().get("status")
                if st == "completed":
                    print(f"✅ {style.upper()} DONE: output/{jid}.mp4")
                    finished.add(jid)
                elif st == "failed":
                    print(f"❌ {style.upper()} FAILED: {r.json().get('error')}")
                    finished.add(jid)
            except: pass
        if len(finished) < len(jobs):
            time.sleep(10)

if __name__ == "__main__":
    main()
