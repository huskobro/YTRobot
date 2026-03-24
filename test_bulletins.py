import requests
import time
import json
import sys

BASE_URL = "http://localhost:8080"

# List of all Remotion styles
STYLES = [
    "breaking", "tech", "corporate", "sport", "finance", 
    "weather", "science", "entertainment", "dark"
]

# Provide dummy data for each style
CATEGORIES = {
    "breaking": "Son Dakika",
    "tech": "Teknoloji",
    "corporate": "Kurumsal",
    "sport": "Spor",
    "finance": "Ekonomi",
    "weather": "Hava Durumu",
    "science": "Bilim",
    "entertainment": "Eğlence",
    "dark": "Genel"
}

ITEMS_TEMPLATE_DICT = {
    "breaking": [
        {"source_id": "test1", "source_name": "Test Kaynak", "title": "Büyük İstanbul Depremi İçin Yeni Uyarı", "narration": "Uzmanlar beklenen büyük İstanbul depremi için kritik açıklamalarda bulundu. Yeni alınan tedbirler açıklandı.", "image_url": "https://images.unsplash.com/photo-1517480261184-7832d20cc218", "category": "Son Dakika"},
        {"source_id": "test1", "source_name": "Test Kaynak", "title": "Merkez Bankası Faizi Sabit Tuttu", "narration": "Merkez Bankası Para Politikası Kurulu, politika faizini piyasa beklentileri doğrultusunda yüzde elli seviyesinde sabit bıraktı.", "image_url": "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3", "category": "Son Dakika"}
    ],
    "tech": [
        {"source_id": "test2", "source_name": "Tech Haber", "title": "Yeni Apple Ürünü Tanıtıldı", "narration": "Teknoloji devi Apple amiral gemisi yeni ürününü duyurdu. İnovatif özellikleri ile dikkat çekiyor.", "image_url": "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3", "category": "Teknoloji"},
        {"source_id": "test2", "source_name": "Tech Haber", "title": "Yapay Zeka Yeni Meslekleri Ortaya Çıkarıyor", "narration": "Üretken yapay zekanın gelişimi klasik iş modellerini tehdit etmesine rağmen yeni iş alanları yaratmaya devam ediyor.", "image_url": "https://images.unsplash.com/photo-1593349480506-b36511a5b821", "category": "Teknoloji"}
    ],
    "corporate": [
        {"source_id": "test3", "source_name": "Şirket Bülteni", "title": "Holdingin Yeni Dönem Vizyonu Açıklandı", "narration": "Yönetim kurulu başkanı, gelecek beş yıl içinde şirketin global pazardaki hedeflerini kamuoyu ile paylaştı.", "image_url": "https://images.unsplash.com/photo-1497366216548-37526070297c", "category": "Kurumsal"}
    ],
    "sport": [
        {"source_id": "test4", "source_name": "Spor Merkezi", "title": "Derbinin Kazananı Belli Oldu", "narration": "Büyük heyecana sahne olan derbi maçında, ev sahibi takım son dakika golüyle ezeli rakibini mağlup etmeyi başardı.", "image_url": "https://images.unsplash.com/photo-1522778119026-d647f0596c20", "category": "Spor"},
        {"source_id": "test4", "source_name": "Spor Merkezi", "title": "Milli Takımda Teknik Direktör Değişimi", "narration": "Federasyon, başarısız geçen turnuvanın ardından tecrübeli teknik adamla yolların ayrıldığını resmen duyurdu.", "image_url": "https://images.unsplash.com/photo-1606822452377-5264b38d3ab1", "category": "Spor"}
    ],
    "finance": [
        {"source_id": "test5", "source_name": "Borsa Günlük", "title": "Borsa İstanbul Rekor Tazeledi", "narration": "Yabancı yatırımcıların girişiyle birlikte Borsa İstanbul BİST Yüz endeksi tarihi zirvesini gördü.", "image_url": "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3", "category": "Ekonomi"}
    ],
    "weather": [
        {"source_id": "test6", "source_name": "Meteoroloji", "title": "Yarından İtibaren Soğuk Hava Dalgası Etkili Olacak", "narration": "Meteoroloji Genel Müdürlüğü yarın sabah saatlerinden itibaren yurt genelinde kar yağışı beklendiğini açıkladı.", "image_url": "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0", "category": "Hava Durumu"}
    ],
    "science": [
        {"source_id": "test7", "source_name": "Bilim Kuşağı", "title": "Mars'ta Suyun İzi Bulundu", "narration": "Uluslararası Uzay İstasyonu tarafından elde edilen son verilere göre Kızıl Gezegen'in yüzeyinde donmuş halde su kütlelerine rastlandı.", "image_url": "https://images.unsplash.com/photo-1451187580459-43490279c0fa", "category": "Bilim"}
    ],
    "entertainment": [
        {"source_id": "test8", "source_name": "Magazin Hattı", "title": "Ünlü Oyuncu Setlere Geri Dönüyor", "narration": "Uzun süredir ekranlardan uzak olan başrol oyuncusu, yeni bir proje ile sevenleriyle buluşmaya hazırlandığını duyurdu.", "image_url": "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0", "category": "Eğlence"}
    ],
    "dark": [
        {"source_id": "test9", "source_name": "Genel İnceleme", "title": "Modern Sanat Müzesi Ziyarete Açıldı", "narration": "Şehrin kalbinde yer alan ve yıllardır restorasyonu süren modern sanat galerisi nihayet kapılarını ziyaretçilere açtı.", "image_url": "https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb", "category": "Genel"}
    ]
}


def main():
    print("Testing 9 distinct bullet renders...")
    job_ids = []
    
    # Send all 9 requests
    for i, style in enumerate(STYLES):
        is_wide = (i % 2 == 0) # Alternate between 16:9 and 9:16
        fmt = "16:9" if is_wide else "9:16"
        
        items = ITEMS_TEMPLATE_DICT[style]
        
        payload = {
            "network_name": "Antigravity HD",
            "style": style,
            "format": fmt,
            "fps": 30,
            "ticker": [
                {"text": "Dolar/TL 34.20"},
                {"text": "BİST 100 Rekor Kırdı"},
                {"text": "Meteoroloji'den Sağanak Uyarısı"}
            ],
            "preset_name": "",
            "category_templates": {CATEGORIES[style]: style},
            "items": items,
            "lower_third_enabled": True,
            "lower_third_text": f"STİL TEST: {style.upper()} ({fmt})",
            "lower_third_font": "bebas",
            "lower_third_color": "#ffffff",
            "lower_third_size": 32,
            "ticker_enabled": True,
            "ticker_speed": 4,
            "ticker_bg": "#111111",
            "ticker_color": "#ffffff",
            "show_live": True
        }
        
        try:
            resp = requests.post(f"{BASE_URL}/api/bulletin/render", json=payload)
            if resp.status_code == 200:
                data = resp.json()
                jid = data.get("bulletin_id")
                print(f"[{style.upper()} - {fmt}] Scheduled Job --> {jid}")
                job_ids.append((jid, style))
            else:
                print(f"[{style.upper()}] Failed to queue: {resp.text}")
        except Exception as e:
            print(f"Error queueing {style}: {e}")
            
    print("\n--- All jobs queued, waiting for completion (Checking every 5s) ---")
    active_jobs = job_ids.copy()
    
    while active_jobs:
        time.sleep(5)
        remaining = []
        for jid, style in active_jobs:
            try:
                resp = requests.get(f"{BASE_URL}/api/bulletin/render/{jid}")
                if resp.status_code == 200:
                    status = resp.json()
                    st = status.get("status")
                    if st == "completed":
                        print(f"✅ {style.upper()} rendered successfully! output/{jid}.mp4")
                    elif st == "failed":
                        print(f"❌ {style.upper()} failed: {status.get('error')}")
                    else:
                        remaining.append((jid, style))
                else:
                    remaining.append((jid, style))
            except:
                remaining.append((jid, style))
        active_jobs = remaining
        if active_jobs:
            print(f"Waiting for {len(active_jobs)} render(s)...")

if __name__ == '__main__':
    main()
