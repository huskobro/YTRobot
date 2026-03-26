import os
import requests
import random
import google.generativeai as genai
from typing import List, Optional
from config import settings

class BrollManager:
    def __init__(self):
        self.gemini_key = getattr(settings, "gemini_api_key", None)
        self.pexels_key = getattr(settings, "pexels_api_key", None)
        self.pixabay_key = getattr(settings, "pixabay_api_key", None)
        
        if self.gemini_key:
            genai.configure(api_key=self.gemini_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')

    def extract_keywords(self, text: str) -> List[str]:
        """Metinden 3 adet İngilizce görsel anahtar kelime çıkarır."""
        if not self.gemini_key:
            return ["cinematic", "background", "abstract"]
        
        prompt = (
            f"Analyze this text and provide 3 short English keywords for stock video/image searching. "
            f"Only output the keywords separated by commas. Text: {text}"
        )
        try:
            response = self.model.generate_content(prompt)
            keywords = [k.strip() for k in response.text.split(",") if k.strip()]
            return keywords[:3]
        except Exception as e:
            print(f"  [Broll] Gemini error: {e}")
            return ["scenery", "texture", "vibe"]

    def search_pexels(self, query: str, media_type: str = "video") -> Optional[str]:
        """Pexels üzerinde arama yapar ve en iyi URL'yi döndürür."""
        if not self.pexels_key: return None
        
        headers = {"Authorization": self.pexels_key}
        url = f"https://api.pexels.com/{'videos' if media_type == 'video' else 'v1'}/search"
        params = {"query": query, "per_page": 5, "orientation": "landscape"}
        
        try:
            resp = requests.get(url, headers=headers, params=params, timeout=10)
            data = resp.json()
            if media_type == "video" and data.get("videos"):
                # En yüksek çözünürlüklü linki al
                files = data["videos"][0].get("video_files", [])
                hd_files = [f for f in files if f.get("width", 0) >= 1280]
                return hd_files[0]["link"] if hd_files else (files[0]["link"] if files else None)
            elif media_type == "image" and data.get("photos"):
                return data["photos"][0]["src"].get("large2x")
        except Exception as e:
            print(f"  [Broll] Pexels search error: {e}")
        return None

    def search_pixabay(self, query: str, media_type: str = "video") -> Optional[str]:
        """Pixabay üzerinde arama yapar."""
        if not self.pixabay_key: return None
        
        api_url = f"https://pixabay.com/api/{'videos/' if media_type == 'video' else ''}"
        params = {"key": self.pixabay_key, "q": query, "per_page": 5, "safesearch": "true"}
        
        try:
            resp = requests.get(api_url, params=params, timeout=10)
            data = resp.json()
            hits = data.get("hits", [])
            if hits:
                if media_type == "video":
                    return hits[0].get("videos", {}).get("large", {}).get("url")
                else:
                    return hits[0].get("largeImageURL")
        except Exception as e:
            print(f"  [Broll] Pixabay search error: {e}")
        return None

    def get_auto_media(self, text: str, media_type: str = "video") -> Optional[str]:
        """Tüm süreci yöneten ana fonksiyon."""
        keywords = self.extract_keywords(text)
        print(f"  [Broll] Identified keywords: {keywords}")
        
        for kw in keywords:
            # Önce Pexels dene
            url = self.search_pexels(kw, media_type)
            if url: return url
            
            # Sonra Pixabay dene
            url = self.search_pixabay(kw, media_type)
            if url: return url
            
        return None

broll_manager = BrollManager()
