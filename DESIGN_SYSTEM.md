# YTRobot UI Design System

Bu dosya, YTRobot uygulamasının tüm UI bileşenleri için kullanılan tasarım sistemini tanımlar.

## 🎨 Renk Paleti

### Modül Renkleri
```css
/* YouTube Video */
--module-yt-primary: indigo-600
--module-yt-border: indigo-900/30
--module-yt-bg: indigo-950/20
--module-yt-text: indigo-200
--module-yt-accent: indigo-400

/* Haber Bülteni */
--module-bulletin-primary: red-600
--module-bulletin-border: red-900/30
--module-bulletin-bg: red-950/20
--module-bulletin-text: red-200
--module-bulletin-accent: red-400

/* Ürün İnceleme */
--module-pr-primary: amber-600
--module-pr-border: amber-900/30
--module-pr-bg: amber-950/20
--module-pr-text: amber-200
--module-pr-accent: amber-400
```

### Kategori Renkleri
```css
/* AI / LLM */
--category-ai-border: indigo-900/30
--category-ai-icon-bg: indigo-600/15

/* TTS / Ses */
--category-tts-border: cyan-900/30
--category-tts-icon-bg: cyan-600/15

/* Görseller */
--category-visuals-border: purple-900/30
--category-visuals-icon-bg: purple-600/15

/* Sosyal Medya */
--category-social-border: violet-900/30
--category-social-icon-bg: violet-600/15
```

## 📏 Tipografi

### Font Büyüklükleri
```css
/* Başlıklar */
--heading-xl: text-2xl (24px) - Sayfa başlıkları
--heading-lg: text-xl (20px) - Bölüm başlıkları
--heading-md: text-sm (14px) - Kart başlıkları
--heading-sm: text-xs (12px) - Alt başlıklar
--heading-xs: text-[11px] (11px) - Kategori başlıkları
--heading-xxs: text-[10px] (10px) - Label'lar

/* Body Text */
--body-md: text-sm (14px) - Normal metin
--body-sm: text-xs (12px) - Küçük metin
--body-xs: text-[10px] (10px) - Açıklama metni
--body-xxs: text-[9px] (9px) - Yardımcı metin

/* Monospace */
--mono-md: text-sm font-mono - API keys, kod
--mono-sm: text-xs font-mono - Küçük kod/ID'ler
```

### Font Ağırlıkları
```css
--font-black: font-black (900) - Ana başlıklar
--font-bold: font-bold (700) - Vurgulu metin
--font-semibold: font-semibold (600) - Checkbox label'lar
--font-medium: font-medium (500) - Normal vurgu
--font-normal: font-normal (400) - Body text
```

### Text Stilleri
```css
/* Uppercase Headers */
uppercase tracking-wider - Bölüm başlıkları
uppercase tracking-widest - Kategori etiketleri
```

## 🧩 Bileşenler

### 1. Premium Checkbox Pattern

**"Gelişmiş İşleme" Bölümü:**
```html
<div class="pt-4 border-t border-{color}-900/20">
  <div class="text-[11px] font-black text-{color}-300/60 uppercase tracking-widest mb-3">
    Gelişmiş İşleme
  </div>
  <div class="grid grid-cols-2 gap-2.5">
    <label class="flex items-center gap-2.5 px-4 py-3 border border-{color}-800/40 rounded-xl bg-{color}-950/20 cursor-pointer hover:bg-{color}-900/30 hover:border-{color}-700/60 transition-all">
      <input type="checkbox" class="w-4 h-4 accent-{color}-500 rounded" />
      <span class="text-xs text-{color}-200 font-semibold">Label</span>
    </label>
  </div>
</div>
```

**Özellikler:**
- Başlık: `text-[11px] font-black uppercase tracking-widest mb-3`
- Grid: `grid-cols-2 gap-2.5`
- Checkbox: `w-4 h-4` (16x16px)
- Padding: `px-4 py-3`
- Border: `border-{color}-800/40`
- Background: `bg-{color}-950/20`
- Hover: `hover:bg-{color}-900/30 hover:border-{color}-700/60`
- Text: `text-xs font-semibold`

### 2. Kategori Kartı Pattern

```html
<div class="bg-slate-900 border border-{color}-900/30 rounded-2xl p-6 mb-4 shadow-lg shadow-{color}-950/10">
  <div class="flex items-center gap-2 mb-5">
    <div class="w-8 h-8 bg-{color}-600/15 rounded-lg flex items-center justify-center text-{color}-400 text-lg">
      {emoji}
    </div>
    <h2 class="text-sm font-black text-white uppercase tracking-wider">
      Başlık
    </h2>
  </div>
  {içerik}
</div>
```

**Özellikler:**
- Container: `rounded-2xl p-6 mb-4`
- Border: `border-{color}-900/30`
- Shadow: `shadow-lg shadow-{color}-950/10`
- Icon badge: `w-8 h-8 bg-{color}-600/15 rounded-lg`
- Header: `text-sm font-black uppercase tracking-wider`

### 3. Modül Override Accordion

```html
<div x-data="{open:false}" class="bg-slate-900 border border-{color}-900/30 rounded-2xl overflow-hidden">
  <div @click="open=!open" class="flex items-center justify-between p-5 cursor-pointer hover:bg-{color}-950/10 transition-colors">
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 bg-{color}-600/15 rounded-xl flex items-center justify-center text-{color}-400">
        {icon}
      </div>
      <div>
        <div class="text-xs font-black text-white uppercase tracking-wider">
          Başlık
        </div>
        <div class="text-[9px] text-slate-500">Alt açıklama</div>
      </div>
    </div>
    <svg :class="open?'rotate-180':''" class="w-4 h-4 text-{color}-400 transition-transform">
      {chevron-down icon}
    </svg>
  </div>
  <div x-show="open" class="px-5 pb-5 space-y-4 border-t border-{color}-900/20">
    {içerik}
  </div>
</div>
```

### 4. Form Input Pattern

**Text Input:**
```html
<input
  class="w-full bg-slate-950 border border-{color}-900/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-{color}-500 transition-colors"
  placeholder="..."
/>
```

**Select Dropdown:**
```html
<select
  class="w-full bg-slate-950 border border-{color}-900/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-{color}-500"
>
  <option value="">(Global Default)</option>
  ...
</select>
```

**Range Slider:**
```html
<input
  type="range"
  class="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-{color}-500 bg-slate-800"
  min="0" max="2" step="0.05"
/>
```

### 5. Button Pattern

**Primary Button:**
```html
<button class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl shadow-md shadow-indigo-900/30 transition-all">
  Action
</button>
```

**Secondary Button:**
```html
<button class="px-3 py-2 bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-700 transition-all">
  Action
</button>
```

**Reset Button:**
```html
<button class="text-[9px] px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors">
  Reset
</button>
```

### 6. Tab Bar Pattern

```html
<div class="flex gap-1 mb-6 p-1 bg-slate-900/60 rounded-xl border border-slate-800 w-fit">
  <template x-for="tab in tabs" :key="tab.id">
    <button
      @click="currentTab=tab.id"
      class="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all"
      :class="currentTab===tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'text-slate-400 hover:text-white hover:bg-slate-800'"
    >
      <span x-text="tab.icon"></span>
      <span x-text="tab.label"></span>
    </button>
  </template>
</div>
```

### 7. Visual Preview Card

```html
<div class="bg-slate-950 border border-{color}-900/20 rounded-xl p-3">
  <div class="text-[9px] font-bold text-{color}-400 uppercase tracking-wider mb-2">
    Önizleme
  </div>
  <div class="aspect-video rounded-lg flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-{color}-950 to-{color}-900">
    {preview content}
  </div>
</div>
```

## 📐 Spacing System

```css
/* Padding */
--spacing-xs: p-1 (4px)
--spacing-sm: p-2 (8px)
--spacing-md: p-3 (12px)
--spacing-lg: p-4 (16px)
--spacing-xl: p-5 (20px)
--spacing-2xl: p-6 (24px)

/* Gap */
--gap-xs: gap-1 (4px)
--gap-sm: gap-2 (8px)
--gap-md: gap-2.5 (10px)
--gap-lg: gap-3 (12px)
--gap-xl: gap-4 (16px)

/* Margin Bottom */
--mb-xs: mb-1.5 (6px)
--mb-sm: mb-2 (8px)
--mb-md: mb-3 (12px)
--mb-lg: mb-4 (16px)
--mb-xl: mb-5 (20px)
--mb-2xl: mb-6 (24px)
```

## 🔲 Border Radius

```css
--radius-sm: rounded-lg (8px) - Küçük elementler
--radius-md: rounded-xl (12px) - Form elementleri, checkbox'lar
--radius-lg: rounded-2xl (16px) - Kartlar, modüller
--radius-xl: rounded-3xl (24px) - Ana containerlar
--radius-full: rounded-full - Badge'ler, avatar'lar
```

## 🎭 Opacity Scale

```css
/* Text */
--text-primary: text-white (100%)
--text-secondary: text-{color}-200 (rgba)
--text-tertiary: text-{color}-300/80 (80%)
--text-muted: text-{color}-400/60 (60%)
--text-disabled: text-slate-500 (50%)

/* Background */
--bg-primary: bg-slate-900
--bg-secondary: bg-slate-950
--bg-overlay: bg-{color}-950/20
--bg-hover: bg-{color}-900/30
```

## ✨ Animation & Transitions

```css
/* Standard Transition */
transition-all
transition-colors
transition-transform

/* Hover States */
hover:bg-{color}-900/30
hover:border-{color}-700/60
hover:text-white
hover:scale-110

/* Active States */
:class="active ? 'bg-{color}-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400'"
```

## 📱 Responsive Grid

```css
/* Checkbox Grid */
grid grid-cols-2 gap-2.5

/* Card Grid */
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4

/* Settings Grid */
grid grid-cols-1 lg:grid-cols-5 gap-4
```

## 🎯 Kullanım Örnekleri

### Yeni Bir Modül Eklerken

1. **Renk Seçimi:** Yukarıdaki modül renk paletinden seç
2. **Kategori Kartı:** Section 2'deki pattern'ı kullan
3. **Form Elementleri:** Section 4'teki input pattern'larını kullan
4. **Checkbox Bölümü:** Section 1'deki "Gelişmiş İşleme" pattern'ını kullan
5. **Accordion:** Section 3'teki modül override pattern'ını kullan

### Tutarlılık Kontrol Listesi

- ✅ Font büyüklükleri standart scale'e uygun mu?
- ✅ Renk tonları modül paletine uygun mu?
- ✅ Spacing değerleri spacing system'e uygun mu?
- ✅ Border radius değerleri standart mı?
- ✅ Hover/transition effectleri eklenmiş mi?
- ✅ Responsive grid kullanılmış mı?
- ✅ Icon badge boyutları standart mı? (w-8 h-8)
- ✅ Checkbox boyutu w-4 h-4 mı?

## 🏗️ Sidebar Yapısı

Sidebar 8 ana menü öğesi içerir, 4 gruba ayrılmıştır:

```
── Ana İşlemler (her oturumda) ──
  ✨ Yeni Video     → bg-indigo-600 CTA butonu
  📊 Dashboard
  🖼️ Gallery

── İçerik (haftalık) ──
  📡 Kanallar
  📅 İçerik Planlama → 5 alt sekme

── Analiz (ihtiyaç duyulduğunda) ──
  📈 Analytics → 3 alt sekme

── Sistem (nadir) ──
  ⚙️ Ayarlar → 6 alt sekme
```

**Grup başlıkları:** `text-[10px] uppercase tracking-widest text-slate-500`
**Ayırıcı:** `border-t border-slate-800/50 my-2`
**CTA butonu:** `bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl`

## 🎯 Yeni Bileşenler (v2)

### AI Assist Button
Input alanları yanında kompakt AI destek butonu:
```html
<button @click="aiAssist('fieldName')"
        class="px-2 py-1 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 text-[9px] font-bold rounded-lg border border-indigo-800/30 transition-all">
  AI
</button>
```

### Product Review Style Preview
Ürün inceleme stil seçiminde canlı önizleme mockup:
```html
<div class="aspect-video rounded-lg overflow-hidden relative">
  <!-- Dinamik arkaplan: style'a göre gradient değişir -->
  <!-- Ürün bilgileri (isim, fiyat, puan) overlay olarak gösterilir -->
</div>
```

### Onboarding Card
Onboarding wizard provider seçim kartı:
```html
<div @click="select(id)"
     :class="selected === id ? 'border-indigo-500 bg-indigo-950/30' : 'border-slate-700 bg-slate-800/50'"
     class="p-4 rounded-xl border-2 cursor-pointer transition-all hover:border-indigo-400">
  <div class="text-lg mb-1">{icon}</div>
  <div class="text-sm font-bold text-white">{name}</div>
  <div class="text-[10px] text-slate-400">{description}</div>
</div>
```

## 🔄 Güncelleme Notları

**Son Güncelleme:** 2026-03-27
**Versiyon:** 2.0

Bu design system, tüm modüller arasında görsel tutarlılığı sağlamak için oluşturulmuştur. Yeni bileşen eklerken bu pattern'lara sadık kalınmalıdır.

### v2 Değişiklikleri
- Sidebar 17 öğeden 8 öğeye sadeleştirildi
- Settings 7 sekmeden 6 sekmeye (Audit Log kaldırıldı)
- Analytics: YouTube + Rakip inline sekmeler olarak entegre edildi
- İçerik Planlama: Takvim + Playlist + A/B Test + Şablon + Zamanlama birleştirildi
- Sosyal Medya standalone sayfası Settings altına taşındı
- AI Assist butonları, onboarding wizard, ürün stil preview eklendi
- Cmd+K komut paleti ~41 komut ile genişletildi
