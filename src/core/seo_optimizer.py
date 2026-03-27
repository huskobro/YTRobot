import re
import json
import logging
from typing import Dict, List

logger = logging.getLogger("SEOOptimizer")

class SEOOptimizer:
    POWER_WORDS = {
        "tr": ["inanılmaz", "şok", "gizli", "gerçek", "muhteşem", "dikkat", "acil", "son dakika", "keşfet", "sır"],
        "en": ["amazing", "secret", "shocking", "truth", "incredible", "urgent", "breaking", "discover", "hidden", "revealed"]
    }

    EMOTIONAL_TRIGGERS = {
        "tr": ["neden", "nasıl", "hiç", "asla", "mutlaka", "kesinlikle", "sakın", "hemen", "şimdi"],
        "en": ["why", "how", "never", "always", "must", "stop", "now", "before", "after", "without"]
    }

    def analyze_title(self, title: str, language: str = "tr") -> Dict:
        score = 0
        suggestions = []

        # Length check (optimal: 40-60 chars)
        length = len(title)
        if 40 <= length <= 60:
            score += 25
        elif length < 40:
            suggestions.append(f"Başlık çok kısa ({length} karakter). 40-60 arası ideal.")
            score += 10
        else:
            suggestions.append(f"Başlık çok uzun ({length} karakter). 60'ın altına düşür.")
            score += 10

        # Power words
        power_words = self.POWER_WORDS.get(language, self.POWER_WORDS["tr"])
        title_lower = title.lower()
        found_power = [w for w in power_words if w in title_lower]
        if found_power:
            score += 20
        else:
            suggestions.append("Güçlü kelimeler ekle: " + ", ".join(power_words[:5]))

        # Emotional triggers
        triggers = self.EMOTIONAL_TRIGGERS.get(language, self.EMOTIONAL_TRIGGERS["tr"])
        found_triggers = [w for w in triggers if w in title_lower]
        if found_triggers:
            score += 15
        else:
            suggestions.append("Duygusal tetikleyiciler ekle: " + ", ".join(triggers[:5]))

        # Number in title
        if re.search(r'\d', title):
            score += 10
        else:
            suggestions.append("Başlığa sayı ekle (örn: '5 Gizli Gerçek', 'Top 10')")

        # Capitalization
        words = title.split()
        if len(words) > 0 and words[0][0].isupper():
            score += 5

        # Question or exclamation
        if title.endswith('?') or title.endswith('!'):
            score += 10
        else:
            suggestions.append("Soru işareti veya ünlem ile bitir — tıklama oranını artırır")

        # Brackets/parentheses
        if '[' in title or '(' in title:
            score += 5
        else:
            suggestions.append("Köşeli parantez ekle: [2026] veya (Belgesel)")

        # Emoji
        if any(ord(c) > 0x1F600 for c in title):
            score += 5

        # Cap score at 100
        score = min(100, score)

        return {
            "title": title,
            "score": score,
            "rating": "Mükemmel" if score >= 80 else "İyi" if score >= 60 else "Orta" if score >= 40 else "Zayıf",
            "suggestions": suggestions,
            "power_words_found": found_power,
            "triggers_found": found_triggers,
            "char_count": length,
        }

    def analyze_description(self, description: str, language: str = "tr") -> Dict:
        score = 0
        suggestions = []

        length = len(description)
        if length >= 200:
            score += 30
        elif length >= 100:
            score += 20
            suggestions.append("Açıklamayı 200+ karaktere çıkar")
        else:
            score += 5
            suggestions.append("Açıklama çok kısa. En az 200 karakter önerilir")

        # Links
        if "http" in description or "www." in description:
            score += 15
        else:
            suggestions.append("Sosyal medya/web linklerini ekle")

        # Hashtags
        if "#" in description:
            score += 10
        else:
            suggestions.append("Hashtag ekle (#konu #kategori)")

        # Timestamps
        if re.search(r'\d{1,2}:\d{2}', description):
            score += 15
        else:
            suggestions.append("Zaman damgaları ekle (00:00 Giriş, 01:30 Bölüm 1)")

        # CTA (call to action)
        cta_words = ["abone", "beğen", "paylaş", "yorum", "subscribe", "like", "share", "comment"]
        if any(w in description.lower() for w in cta_words):
            score += 15
        else:
            suggestions.append("CTA ekle: 'Abone ol', 'Beğenmeyi unutma'")

        # Keywords (first 2 lines matter most)
        first_lines = description[:200]
        word_count = len(first_lines.split())
        if word_count >= 20:
            score += 15

        score = min(100, score)

        return {
            "score": score,
            "rating": "Mükemmel" if score >= 80 else "İyi" if score >= 60 else "Orta" if score >= 40 else "Zayıf",
            "suggestions": suggestions,
            "char_count": length,
        }

    def analyze_tags(self, tags: List[str], language: str = "tr") -> Dict:
        score = 0
        suggestions = []

        count = len(tags)
        if count >= 8:
            score += 30
        elif count >= 5:
            score += 20
            suggestions.append(f"En az 8 tag önerilir (şu an {count})")
        else:
            score += 5
            suggestions.append(f"Çok az tag ({count}). En az 8 tag ekle")

        # Mix of short and long
        short_tags = [t for t in tags if len(t.split()) <= 2]
        long_tags = [t for t in tags if len(t.split()) > 2]
        if short_tags and long_tags:
            score += 20
        else:
            suggestions.append("Kısa ve uzun tag'ları karıştır (örn: 'tarih' + 'osmanlı imparatorluğu tarihi')")

        # Total chars
        total_chars = sum(len(t) for t in tags)
        if total_chars <= 500:
            score += 20
        else:
            suggestions.append(f"Tag'ların toplam uzunluğu {total_chars} karakter. 500'ün altında tut")

        # Duplicate check
        unique = set(t.lower() for t in tags)
        if len(unique) == len(tags):
            score += 15
        else:
            suggestions.append("Tekrarlanan tag'lar var — kaldır")

        score = min(100, score)

        return {
            "score": score,
            "rating": "Mükemmel" if score >= 80 else "İyi" if score >= 60 else "Orta" if score >= 40 else "Zayıf",
            "suggestions": suggestions,
            "tag_count": count,
        }

    def full_analysis(self, title: str = "", description: str = "", tags: list = None, language: str = "tr") -> Dict:
        results = {}
        total_score = 0
        count = 0

        if title:
            results["title"] = self.analyze_title(title, language)
            total_score += results["title"]["score"]
            count += 1

        if description:
            results["description"] = self.analyze_description(description, language)
            total_score += results["description"]["score"]
            count += 1

        if tags:
            results["tags"] = self.analyze_tags(tags, language)
            total_score += results["tags"]["score"]
            count += 1

        results["overall_score"] = round(total_score / max(1, count))
        results["overall_rating"] = "Mükemmel" if results["overall_score"] >= 80 else "İyi" if results["overall_score"] >= 60 else "Orta" if results["overall_score"] >= 40 else "Zayıf"

        return results

seo_optimizer = SEOOptimizer()
