// ── Mixin merge helper — preserves getters (spread evaluates them) ────────────
function _mergeMixins(target, ...sources) {
  for (const src of sources) {
    const descriptors = Object.getOwnPropertyDescriptors(src);
    for (const [key, desc] of Object.entries(descriptors)) {
      if (desc.get || desc.set) {
        // Preserve getters/setters via defineProperty
        Object.defineProperty(target, key, desc);
      } else {
        // Regular properties — assign directly (Alpine-friendly)
        target[key] = desc.value;
      }
    }
  }
  return target;
}

// ── App (Core) ──────────────────────────────────────────────────────────────
// Slim orchestrator — domain logic lives in ui/js/views/*.js mixin files.
function app() {
  const core = {
    // ── Core State ──
    lang: localStorage.getItem('ytrobot-lang') || 'en',
    view: 'dashboard',
    sidebarOpen: false,
    darkMode: true,
    soundEnabled: localStorage.getItem('ytrobot-sound') !== 'false',
    globalError: null,
    _errorTimeout: null,
    toasts: [],
    _toastIdCounter: 0,
    showCommandPalette: false,
    commandQuery: '',
    selectedCommandIndex: 0,
    _cmdPaletteLastToggle: 0,

    // ── Command Palette Commands ──
    commands: [
      // ── Video Üretimi ──
      { id: 'nav_new_run', title: 'New Video / Yeni Video Başlat', icon: '✨', tag: 'video üretim oluştur create', category: 'create', action: function() { this.view = 'new-run'; this.mode='topic'; this.runError=''; } },
      { id: 'nav_bulletin', title: 'News Bulletin / Haber Bülteni', icon: '📺', tag: 'haber news bülten video oluştur', category: 'create', action: function() { this.view = 'bulletin'; this.bulletinTab = 'sources'; this.loadBulletinSources(); } },
      { id: 'nav_product_review', title: 'Product Review / Ürün İnceleme', icon: '🛒', tag: 'ürün inceleme affiliate review video', category: 'create', action: function() { this.view = 'product-review'; } },
      // ── Ana Sayfalar ──
      { id: 'nav_dashboard', title: 'Dashboard / Gözlem Paneli', icon: '📊', tag: 'ana sayfa istatistik özet home', category: 'navigate', action: function() { this.view = 'dashboard'; } },
      { id: 'nav_gallery', title: 'Gallery / Galeri', icon: '🖼️', tag: 'galeri videolar listele izle indir', category: 'navigate', action: function() { this.view = 'gallery'; this.loadGallery(); } },
      { id: 'nav_channels', title: 'Channels / Kanallar', icon: '📡', tag: 'kanal yönetim profil channel', category: 'navigate', action: function() { this.view = 'channels'; this.loadChannels(); } },
      // ── İçerik Yönetimi ──
      { id: 'nav_calendar', title: 'Content Calendar / İçerik Takvimi', icon: '📅', tag: 'takvim planlama tarih zamanlama schedule', category: 'content', action: function() { this.view = 'content-planning'; this.contentPlanningTab = 'calendar'; this.loadCalendarEntries(); } },
      { id: 'nav_playlists', title: 'Playlists / Playlistler', icon: '📋', tag: 'playlist oynatma listesi sıralama', category: 'content', action: function() { this.view = 'content-planning'; this.contentPlanningTab = 'playlists'; this.loadPlaylists(); } },
      { id: 'nav_templates', title: 'Templates / Şablonlar', icon: '📄', tag: 'şablon preset kayıtlı ayar template', category: 'content', action: function() { this.view = 'content-planning'; this.contentPlanningTab = 'templates'; this.loadTemplates(); } },
      { id: 'nav_ab_testing', title: 'A/B Testing / A/B Test', icon: '🧪', tag: 'test deney varyant başlık thumbnail', category: 'content', action: function() { this.view = 'content-planning'; this.contentPlanningTab = 'ab-testing'; this.loadAbTests(); } },
      // ── Analiz & İstihbarat ──
      { id: 'nav_analytics', title: 'Pipeline Analytics / Pipeline Analizi', icon: '📈', tag: 'analitik istatistik performans kuyruk hata pipeline', category: 'analytics', action: function() { this.view = 'analytics'; this.analyticsTab = 'pipeline'; this.loadAnalytics(); this.loadQueueStatus(); this.loadErrorDetails(); } },
      { id: 'nav_yt_analytics', title: 'YouTube Analytics / YouTube Analitik', icon: '📊', tag: 'youtube görüntülenme abone izlenme kanal analitik', category: 'analytics', action: function() { this.view = 'analytics'; this.analyticsTab = 'youtube'; } },
      { id: 'nav_competitor', title: 'Competitor Analysis / Rakip Analizi', icon: '🎯', tag: 'rakip competitor tarama analiz trend', category: 'analytics', action: function() { this.view = 'analytics'; this.analyticsTab = 'competitor'; } },
      // ── Ayarlar & Sistem ──
      { id: 'nav_settings', title: 'Settings / Ayarlar', icon: '⚙️', tag: 'ayar yapılandırma config tts ses görsel yönetici admin', category: 'settings', action: function() { this.loadSettings(); this.view = 'settings'; } },
      { id: 'nav_settings_ai', title: 'AI Settings / AI & Yönetici Ayarları', icon: '🤖', tag: 'ai yapay zeka model prompt yönetici ayarları admin kategori master belgesel din', category: 'settings', action: function() { this.loadSettings(); this.view = 'settings'; this.settingsModule = 'ai'; } },
      { id: 'nav_settings_tts', title: 'TTS Settings / Ses Ayarları', icon: '🎙', tag: 'tts ses seslendirme voice provider edge elevenlabs', category: 'settings', action: function() { this.loadSettings(); this.view = 'settings'; this.settingsModule = 'tts'; } },
      { id: 'nav_settings_visuals', title: 'Visual Settings / Görsel Ayarları', icon: '🎨', tag: 'görsel visual pexels dalle zimage resim video', category: 'settings', action: function() { this.loadSettings(); this.view = 'settings'; this.settingsModule = 'visuals'; } },
      { id: 'nav_settings_social', title: 'Social Media / Sosyal Medya Yönetimi', icon: '📱', tag: 'sosyal medya meta youtube otonom paylaşım zamanlanmış reels shorts', category: 'settings', action: function() { this.loadSettings(); this.view = 'settings'; this.settingsModule = 'social_meta'; } },
      { id: 'nav_api_keys', title: 'API Keys / API Anahtarları', icon: '🔑', tag: 'api key anahtar openai elevenlabs pexels gemini oauth', category: 'settings', action: function() { this.loadSettings(); this.view = 'api-keys'; } },
      { id: 'nav_secure', title: 'Secure Storage / Güvenli Depolama', icon: '🔐', tag: 'güvenli depolama şifre şifreleme fernet', category: 'settings', action: function() { this.loadSettings(); this.view = 'settings'; this.settingsModule = 'secure'; } },
      // ── İçerik Planlama ──
      { id: 'nav_scheduler', title: 'Video Scheduler / Video Zamanlama', icon: '⏰', tag: 'zamanlama schedule yükleme toplu kuyruk', category: 'content', action: function() { this.view = 'content-planning'; this.contentPlanningTab = 'scheduler'; this.loadScheduledVideos(); } },
      // ── Alt Ayarlar (Deep Links) ──
      { id: 'nav_youtube_connect', title: 'YouTube Bağla / YouTube OAuth', icon: '🔴', tag: 'youtube bağla connect oauth google hesap kanal yetkilendirme auth token', category: 'settings', action: function() { this.loadSettings(); this.view = 'settings'; this.settingsModule = 'social_meta'; } },
      { id: 'nav_settings_system', title: 'System Settings / Sistem Ayarları', icon: '⚙️', tag: 'sistem system çözünürlük fps resolution output dizin', category: 'settings', action: function() { this.loadSettings(); this.view = 'settings'; this.settingsModule = 'system'; } },
      { id: 'nav_category_prompts', title: 'Category Prompts / Kategori Promptları', icon: '📝', tag: 'kategori prompt belgesel din ruhani tarih bilim motivasyon true crime karanlık psikoloji', category: 'settings', action: function() { this.loadSettings(); this.view = 'settings'; this.settingsModule = 'ai'; } },
      { id: 'nav_ai_prompts', title: 'AI Master Prompts / AI İşlev Promptları', icon: '🤖', tag: 'master prompt senaryo seo metadata bülten ürün inceleme thumbnail ai talimat', category: 'settings', action: function() { this.loadSettings(); this.view = 'settings'; this.settingsModule = 'ai'; } },
      { id: 'nav_notifications', title: 'Notifications / Bildirimler', icon: '🔔', tag: 'bildirim notification telegram email whatsapp', category: 'settings', action: function() { this.loadSettings(); this.view = 'settings'; this.settingsModule = 'system'; } },
      // ── Hızlı Aksiyonlar ──
      { id: 'action_refresh', title: 'Refresh Sessions / Oturumları Yenile', icon: '🔄', tag: 'yenile güncelle refresh', category: 'action', action: function() { this.loadSessions(); } },
      { id: 'action_clear_logs', title: 'Clear Errors / Hataları Temizle', icon: '🧹', tag: 'temizle hata sıfırla clear', category: 'action', action: function() { this.globalError = null; } },
      { id: 'action_toggle_theme', title: 'Toggle Theme / Tema Değiştir', icon: '🌓', tag: 'tema karanlık açık dark light mode', category: 'action', action: function() { this.toggleTheme(); } },
      { id: 'action_toggle_lang', title: 'Switch Language / Dil Değiştir', icon: '🌐', tag: 'dil türkçe ingilizce language tr en', category: 'action', action: function() { this.setLang(this.lang === 'tr' ? 'en' : 'tr'); } },
      { id: 'action_onboarding', title: 'Setup Wizard / Kurulum Sihirbazı', icon: '🧙', tag: 'kurulum sihirbaz onboarding wizard başlangıç', category: 'action', action: function() { this.loadWizardStepOrder(); this.view = 'onboarding'; this.onboardingStep = 1; } },
      { id: 'action_yt_connect', title: 'YouTube Hesap Bağla', icon: '🔴', tag: 'youtube bağla oauth connect google api', category: 'action', action: function() { this.connectYouTube(); } },
    ],

    // ── Core Utilities ──
    t(key) { return LANG[this.lang]?.[key] ?? LANG.en[key] ?? key; },
    safeSave(key, value) {
      try { localStorage.setItem(key, value); } catch(e) { console.warn('localStorage full:', e); }
    },
    setLang(l) { this.lang = l; this.safeSave('ytrobot-lang', l); },

    // ── Theme ──
    initTheme() {
        const saved = localStorage.getItem('ytrobot_theme');
        this.darkMode = saved !== 'light';
        this.applyTheme();
    },
    toggleTheme() {
        this.darkMode = !this.darkMode;
        this.safeSave('ytrobot_theme', this.darkMode ? 'dark' : 'light');
        this.applyTheme();
    },
    applyTheme() {
        if (this.darkMode) {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
        } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.add('light');
        }
    },

    // ── Toast & Error API ──
    showToast(message, type = 'info', duration = 5000) {
      const id = ++this._toastIdCounter;
      if (this.toasts.length >= 5) { this.toasts.shift(); }
      this.toasts.push({ id, message, type });
      if (duration > 0) setTimeout(() => this.dismissToast(id), duration);
      return id;
    },
    dismissToast(id) { this.toasts = this.toasts.filter(t => t.id !== id); },
    showSuccess(msg, dur = 4000) { return this.showToast(msg, 'success', dur); },
    showInfo(msg, dur = 5000) { return this.showToast(msg, 'info', dur); },
    showWarning(msg, dur = 6000) { return this.showToast(msg, 'warning', dur); },
    showError(msg) {
      this.globalError = msg;
      this.showToast(msg, 'error', 8000);
      if (this._errorTimeout) clearTimeout(this._errorTimeout);
      this._errorTimeout = setTimeout(() => { this.globalError = null; }, 10000);
    },
    clearError() { this.globalError = null; if (this._errorTimeout) clearTimeout(this._errorTimeout); },

    // ── API Helper ──
    async apiFetch(url, options = {}) {
      try {
        const r = await fetch(url, options);
        const data = await r.json();
        if (!r.ok) {
          const msg = data.error || data.detail || `Hata (${r.status})`;
          this.showError(msg);
          throw new Error(msg);
        }
        return data;
      } catch (e) {
        if (!this.globalError) this.showError(e.message);
        throw e;
      }
    },

    // ── Command Palette ──
    toggleCommandPalette() {
      const now = Date.now();
      if (this._cmdPaletteLastToggle && now - this._cmdPaletteLastToggle < 200) return;
      this._cmdPaletteLastToggle = now;
      if (!this.showCommandPalette) {
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        this.showCommandPalette = true;
        this.playSound('pop');
        this.commandQuery = '';
        this.selectedCommandIndex = 0;
        setTimeout(() => { const inp = document.getElementById('command-input'); if (inp) { inp.focus(); inp.select(); } }, 50);
        setTimeout(() => document.getElementById('command-input')?.focus(), 150);
      } else {
        this.showCommandPalette = false;
      }
    },
    filteredCommands() {
      if (!this.commandQuery) return this.commands;
      const q = this.commandQuery.toLowerCase();
      return this.commands.filter(c =>
        c.title.toLowerCase().includes(q) || c.id.toLowerCase().includes(q) || (c.tag && c.tag.toLowerCase().includes(q))
      );
    },
    executeCommand(cmd) {
      if (cmd && cmd.action) {
        this.playSound('click');
        cmd.action.call(this);
        this.showCommandPalette = false;
      }
    },
    handleCommandKey(e) {
      const filtered = this.filteredCommands();
      if (e.key === 'ArrowDown') { e.preventDefault(); this.selectedCommandIndex = (this.selectedCommandIndex + 1) % filtered.length; }
      else if (e.key === 'ArrowUp') { e.preventDefault(); this.selectedCommandIndex = (this.selectedCommandIndex - 1 + filtered.length) % filtered.length; }
      else if (e.key === 'Enter') { e.preventDefault(); this.executeCommand(filtered[this.selectedCommandIndex]); }
      else if (e.key === 'Escape') { this.showCommandPalette = false; }
    },

    // ── Sound UX Engine ──
    toggleSound() {
      this.soundEnabled = !this.soundEnabled;
      this.safeSave('ytrobot-sound', this.soundEnabled ? 'true' : 'false');
    },
    async playSound(type) {
      if (!this.soundEnabled) return;
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        if (type === 'success') {
          osc.frequency.setValueAtTime(523, ctx.currentTime);
          osc.frequency.setValueAtTime(784, ctx.currentTime + 0.1);
          gain.gain.setValueAtTime(0.08, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
          osc.type = 'sine';
          osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.5);
        } else if (type === 'error') {
          osc.frequency.setValueAtTime(440, ctx.currentTime);
          osc.frequency.setValueAtTime(330, ctx.currentTime + 0.15);
          gain.gain.setValueAtTime(0.06, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
          osc.type = 'triangle';
          osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4);
        } else if (type === 'pop') {
          osc.frequency.setValueAtTime(1200, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05);
          gain.gain.setValueAtTime(0.04, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
          osc.type = 'sine';
          osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.08);
        } else if (type === 'click') {
          const buf = ctx.createBuffer(1, ctx.sampleRate * 0.02, ctx.sampleRate);
          const data = buf.getChannelData(0);
          for (let i = 0; i < data.length; i++) data[i] = (Math.random() - 0.5) * 0.15 * Math.exp(-i / (ctx.sampleRate * 0.005));
          const src = ctx.createBufferSource();
          src.buffer = buf; src.connect(gain);
          gain.gain.setValueAtTime(0.5, ctx.currentTime);
          src.start(); return;
        }
      } catch (e) { /* Ses desteklenmiyor veya engellendi */ }
    },

    // ── Pipeline Steps ──
    pipelineSteps() { return this.t('pipeline_steps'); },

    // ── Utility Methods ──
    ttsProviderLabel() {
      const labels = { speshaudio: 'Spes Audio', elevenlabs: 'ElevenLabs', openai: 'OpenAI TTS', google: 'Google TTS', qwen3: 'Qwen3 (Local)' };
      return labels[this.settings.TTS_PROVIDER] || this.settings.TTS_PROVIDER || 'N/A';
    },
    timeAgo(dateStr) {
      const now = Date.now();
      const diff = now - new Date(dateStr).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'just now';
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      const days = Math.floor(hrs / 24);
      return `${days}d ago`;
    },
    formatTs(ts) {
      if (!ts) return '';
      return new Date(ts * 1000).toLocaleString(
        this.lang === 'tr' ? 'tr-TR' : 'en-US',
        { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
      );
    },

    // ── Drag & Drop ──
    initDragDrop() {
        ['dragenter', 'dragover'].forEach(evt => {
            document.addEventListener(evt, (e) => { e.preventDefault(); e.stopPropagation(); });
        });
        document.addEventListener('drop', async (e) => {
            e.preventDefault(); e.stopPropagation();
            const files = e.dataTransfer?.files;
            if (!files || files.length === 0) return;
            const file = files[0];
            if (!file.name.endsWith('.txt') && !file.name.endsWith('.json') && !file.name.endsWith('.srt')) {
                if (this.showToast) this.showToast(this.t('file_type_error'), 'warning');
                return;
            }
            const text = await file.text();
            if (this.topic !== undefined) {
                this.topic = text.substring(0, 5000);
                if (this.showToast) this.showToast(`${file.name} yüklendi`, 'success');
            }
        });
    },

    // ── Keyboard Shortcuts ──
    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                if (this.view === 'new-run' && typeof this.submitRun === 'function') this.submitRun();
                return;
            }
            if (e.altKey && e.key >= '1' && e.key <= '9') {
                e.preventDefault();
                const views = ['home', 'wizard', 'gallery', 'channels', 'competitor', 'settings'];
                const idx = parseInt(e.key) - 1;
                if (idx < views.length) {
                    this.view = views[idx];
                    if (views[idx] === 'home' && this.loadDashboard) this.loadDashboard();
                    if (views[idx] === 'gallery' && this.loadGallery) this.loadGallery();
                }
                return;
            }
            if (e.key === 'Escape') {
                if (this.videoPreviewOpen) { this.videoPreviewOpen = false; return; }
                if (this.channelFormOpen) { this.channelFormOpen = false; return; }
            }
        });
    },

    // ── Initialization ──
    async init() {
      // 1. Register Global Listeners First (Immune to API failures)
      this.initTheme();
      this.initDragDrop();
      this.initKeyboardShortcuts();
      window.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault();
          e.stopImmediatePropagation();
          this.toggleCommandPalette();
        }
      });

      // 1b. Check if first run → show onboarding
      await this.loadWizardStepOrder();
      if (!localStorage.getItem('ytrobot-onboarding-done')) {
        this.view = 'onboarding';
      }

      // 2. Load Data (Parallel & Fault Tolerant)
      console.log("Initializing YTRobot data...");
      try {
        await Promise.allSettled([
          this.loadSettings(),
          this.loadPrompts(),
          this.loadBulletinSources(),
          this.loadSessions(),
          this.loadPresets(),
          this.loadChannels()
        ]);
        this.loadBulletinPresets();
        this.loadBulletinHistory();
        this.checkYouTubeStatus();
        this.loadDashboard();
        this.loadSchedule();
      } catch (e) {
        console.error("Initialization error:", e);
      }

      this._timer = setInterval(() => {
        this.loadSessions();
        if (this.view === 'dashboard') {
          this.loadDashboard();
        }
        if (this.view === 'analytics') {
          this.loadAnalytics();
          this.loadQueueStatus();
        }
        if (this.view === 'settings' && this.settingsModule === 'social_meta') this.loadSocialLog();
      }, 3000);

      // Notification polling every 30 seconds
      this.loadNotifications();
      this._notifPoll = setInterval(() => this.loadNotifications(), 30000);

      // Close SSE when navigating away from session view
      this.$watch('view', (newView, oldView) => {
        if (oldView === 'session' && newView !== 'session') {
          if (this._sse) { this._sse.close(); this._sse = null; }
        }
      });

      // Cleanup intervals on page unload
      window.addEventListener('beforeunload', () => {
        if (this._timer) { clearInterval(this._timer); this._timer = null; }
        if (this._notifPoll) { clearInterval(this._notifPoll); this._notifPoll = null; }
        if (this._sse) { this._sse.close(); this._sse = null; }
      });
    },
  };

  // Merge domain mixins first, then core on top (core wins on conflicts)
  // _mergeMixins preserves getters like wizardTotalSteps, agFilteredTitles
  const merged = _mergeMixins({},
    bulletinMixin(),
    productReviewMixin(),
    contentPlanningMixin(),
    analyticsMixin(),
    galleryMixin(),
    channelsMixin(),
    sessionMixin(),
    newRunMixin(),
    settingsMixin(),
    onboardingMixin(),
    core
  );
  return merged;
}

// ── Master Prompt Panel (Alpine x-data component) ─────────────────────────────
function masterPromptPanel() {
  const PROMPTS = {
    yt_script: {
      title: 'YT Video — Yerleşik Senaryo Promptu',
      content: `You are an expert YouTube scriptwriter whose videos get millions of views.

AUDIENCE
--------
{audience}

VIDEO STRUCTURE (follow this strictly)
---------------------------------------
• Scene 0 — HOOK: The first 30 seconds. Create an irresistible question, tension, or bold
  claim. Make the viewer feel they NEED to keep watching.
• Scene 1 — Establish the surface problem AND hint at the deeper emotional problem beneath it.
• Scenes 2–8 — Deliver value progressively. Tell stories, build tension, use examples.
• Scene 9 — Resolve the deeper emotional problem. Leave the viewer feeling transformed.

CONVERSATIONAL WRITING STYLE
• Write exactly as a person speaks — contractions (it's, you're, don't, I've), fragments OK
• Vary sentence rhythm: SHORT punchy sentences. Followed by longer ones that breathe.
• NEVER use: "In conclusion", "Furthermore", "It's worth noting", "Delve into", "Leverage"
• Write to ONE person — say "you" not "viewers"
• Include moments of humor, self-awareness, or vulnerability

TTS VOICE EMPHASIS MARKERS
• CAPITALIZE words that need strong spoken emphasis: "this is INSANE"
• Use "..." for meaningful pauses before impactful statements
• NEVER use "/" (slash) — write "or" instead

OUTPUT FORMAT
Return ONLY a valid JSON object with key "scenes" containing exactly 10 elements.
Each element: "narration" (3–6 sentences) + "visual_query" (3–5 word stock footage phrase)`
    },
    bulletin_narration: {
      title: 'Bülten — Yerleşik Narrasyon Promptu',
      content: `You are a professional broadcast news anchor writer. Your job is to rewrite a news article as a short spoken narration for a TV news bulletin.

RULES (follow all strictly):
1. Write 2-4 sentences of natural spoken news language — authoritative but clear.
2. Use the headline as your opening hook, then expand with key facts from the summary.
3. Do NOT include: journalist names, bylines, publication names, "according to", "it is reported".
4. Do NOT start with "In" or "Today" — vary your openings.
5. Write in the language specified in the LANGUAGE field.
   If Turkish: use formal broadcast Turkish (standard news register, not colloquial).
6. Never invent facts not present in the provided text.
7. End with a single strong declarative sentence that closes the item cleanly.
8. Length: 40-80 words total.
9. ANTI-CLICKBAIT — absolutely no sensationalism:
   - Never use exaggerated language like "shocking", "unbelievable", "explosive".
   - Report only verified facts present in the source text.
10. If any language did not specified, auto detect it and write formal content.

Return ONLY the narration text. No JSON, no explanation, no quotation marks.`
    },
    pr_info: {
      title: 'Ürün İnceleme — Yerleşik Bilgi',
      content: `Ürün İnceleme modülü için özel bir yerleşik sistem promptu tanımlanmamıştır.

Bu alana kendi talimatlarınızı girerek AI'nın ürün inceleme videolarını nasıl oluşturacağını belirleyebilirsiniz.

Örnek talimatlar:
• Ürünün güçlü yönlerini ön plana çıkar
• Fiyat-performans dengesini vurgula
• İzleyiciyi satın almaya teşvik et
• Teknik detayları sade dille açıkla
• Rakip ürünlerle kısa bir kıyaslama yap`
    },
    social_meta: {
      title: 'Sosyal Meta — Yerleşik Prompt',
      content: `You are a social media metadata expert. Generate optimized metadata for the given video content.

For each requested field, generate:
• title — Compelling, SEO-optimized title under 60 characters
• description — Engaging description under 150 characters with keywords
• tags — 10-15 relevant hashtags without the # symbol
• source — Original source URL or channel name if available
• link — Primary link to share

RULES:
1. Match the language of the input content
2. Use relevant keywords naturally
3. Avoid clickbait — be accurate and compelling
4. For Turkish content: use Turkish keywords and cultural context
5. Return as JSON with requested field keys only

Return ONLY a valid JSON object with the requested fields.`
    },
    tts_enhance: {
      title: 'TTS Vurgu — Yerleşik Prompt',
      content: `You are a TTS voice coach. Your job is to make AI-generated narration sound HUMAN and natural when read by a text-to-speech voice.

Given a narration text, return it with these modifications ONLY:
1. CAPITALIZE 1–2 key words per sentence that should be spoken with strong emphasis.
   Example: "this changes everything" → "this changes EVERYTHING"
2. Add "..." before impactful statements to create a meaningful pause.
   Example: "And I finally got it. The secret was patience." →
            "And I finally got it. The secret... was patience."
3. Add "!" for genuine excitement, urgency, or strong emphasis.
   Only add where the speaker would naturally raise their voice.
4. Add commas where the speaker would naturally breathe or pause.
5. Do NOT change any words, sentences, or meaning. Only add emphasis markers.
6. Feel free to capitalize 2-4 important words per scene.
7. Do NOT use "/" (slash) at all — replace it with " or ".

Return ONLY the modified narration text. No explanation, no JSON, just the text.`
    },
    humanize_enhance: {
      title: 'Humanize + TTS — Yerleşik Birleşik Prompt',
      content: `You are a professional script editor AND TTS voice coach. In ONE pass, do both jobs:

PART 1 — HUMANIZE (rewrite for natural speech):
1. USE CONTRACTIONS everywhere: it's, you're, don't, I've, that's, we're, I'll, won't
2. BREAK long sentences. Mix rhythm: short punch. Then a longer one that breathes.
3. REMOVE ALL AI-ISMS: "delve into", "it's worth noting", "in conclusion",
   "in today's world", "leverage", "furthermore", "navigate", "landscape", "game-changer"
4. ADD natural imperfections: rhetorical questions, mid-thought pauses ("And honestly..."),
   hesitations ("I mean, think about it.")
5. SPEAK TO ONE PERSON: "you" not "viewers" / "everyone" / "we all"
6. KEEP all core information — only change the delivery

PART 2 — TTS EMPHASIS (add voice markers):
7. CAPITALIZE 1–2 key words per scene that need strong spoken emphasis.
8. Add "..." before impactful statements for a meaningful pause.
9. Add "!" for genuine excitement or strong emphasis. Use it freely when emotion calls for it.
10. Add commas where the speaker would naturally breathe.
11. Feel free to capitalize 2-4 important words per scene for dynamic delivery.

GLOBAL RULES:
• NEVER use "/" (slash) — write "or" instead
• Return ONLY the rewritten narration text. No explanation, no JSON, just the text.`
    },
    humanize_only: {
      title: 'Script İnsanlaştırma — Yerleşik Prompt',
      content: `You are a professional script editor who turns AI-generated YouTube narration into text that sounds like a real person spontaneously talking — not reading.

Given a narration text, rewrite it following these rules STRICTLY:

1. USE CONTRACTIONS everywhere: it's, you're, don't, I've, that's, we're, I'll, won't
2. BREAK long sentences. Mix rhythm: short punch. Then a longer one that breathes and
   builds. Then short again.
3. REMOVE ALL AI-ISMS — replace or cut any of: "delve into", "it's worth noting",
   "in conclusion", "in today's world", "leverage", "furthermore", "it's important to",
   "navigate", "landscape", "game-changer", "at the end of the day"
4. ADD natural imperfections: rhetorical questions ("You know what I mean?"),
   mid-thought pauses ("And honestly..."), hesitations ("I mean, think about it.")
5. SPEAK TO ONE PERSON: "you" not "viewers" / "everyone" / "we all"
6. KEEP all the core information and key points — only change the delivery
7. PRESERVE existing TTS markers if present: CAPS emphasis, "...", "!"
8. DO NOT add new TTS markers — that's a separate step
9. NEVER use "/" (slash) — write "or" instead

Return ONLY the rewritten narration text. No explanation, no JSON, just the text.`
    },
  };

  return {
    open: false,
    activePrompt: 'yt',
    showPrompt(key) {
      const p = PROMPTS[key];
      if (!p) return;
      Alpine.store('promptModal').title = p.title;
      Alpine.store('promptModal').content = p.content;
      Alpine.store('promptModal').show = true;
    },

    // ── AI Assist (inline field helper) ────────────────────────────────
    async aiAssist(field) {
      const prompts = {
        topic: 'Popüler ve dikkat çekici bir YouTube video konusu öner. Tek bir konu yaz, açıklama yapma.',
        verdict: `Bu ürün incelemesi için son değerlendirme yaz (2-3 cümle). Artılar: ${(this.prForm?.pros||[]).join(', ')}. Eksiler: ${(this.prForm?.cons||[]).join(', ')}. Puan: ${this.prForm?.score||5}/10`,
        calendarTitle: 'Bir YouTube videosu için kısa, dikkat çekici bir başlık öner. Tek bir başlık yaz.',
        prName: this.prAutoUrl ? `Bu URL'deki ürünün adını çıkar: ${this.prAutoUrl}` : 'Popüler bir teknoloji ürünü adı öner.',
      };
      const prompt = prompts[field];
      if (!prompt) return;
      try {
        const resp = await fetch('/api/ai/assist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, max_tokens: 100 })
        });
        if (resp.ok) {
          const data = await resp.json();
          const text = (data.text || '').trim();
          if (!text) return;
          switch(field) {
            case 'topic': this.newTopic = text; break;
            case 'verdict': this.prForm.verdict = text; break;
            case 'calendarTitle': this.calendarForm.title = text; break;
            case 'prName': this.prForm.name = text; break;
          }
          this.showToast(this.t('ai_assist_applied'), 'success');
        } else {
          this.showToast(this.t('ai_error'), 'error');
        }
      } catch(e) { console.warn('[aiAssist]', e); this.showToast(this.t('ai_error'), 'error'); }
    },
  };
}

// Register Alpine store — called early, before Alpine starts
document.addEventListener('alpine:initializing', () => {
  Alpine.store('promptModal', {
    show: false,
    title: '',
    content: '',
  });
});
