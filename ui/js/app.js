// ── App ──────────────────────────────────────────────────────────────────────
function app() {
  return {
    lang: localStorage.getItem('ytrobot-lang') || 'en',
    view: 'dashboard', mode: 'topic',
    videoModule: 'normal',
    sessions: [], currentSession: null, 
    settings: {
      PR_TTS_STABILITY: 0.3, PR_TTS_SIMILARITY: 0.5, PR_TTS_STYLE: 0.75,
      BULLETIN_LOWER_THIRD_ENABLED: 'true', BULLETIN_TICKER_ENABLED: 'true',
      AI_BROLL_ENABLED: false, AI_BROLL_SENSITIVITY: 5,
      AUTOPUBLISH_YOUTUBE: false, YT_PRIVACY_STATUS: 'private', YT_CATEGORY_ID: '22',
      AUTOPUBLISH_REELS: false, SHARE_ON_INSTAGRAM: false, SHARE_ON_TIKTOK: false,
      VISUALS_PROVIDER: 'pexels', COMPOSER_PROVIDER: 'moviepy', REMOTION_CONCURRENCY: 4,
      REMOTION_SUBTITLE_HIGHLIGHT_COLOR: '#FFE600', REMOTION_SUBTITLE_FONT_WEIGHT: '900',
      REMOTION_SUBTITLE_FONT: 'Bebas Neue', REMOTION_SUBTITLE_SIZE: '64px',
      REMOTION_SUBTITLE_STROKE: '2px black', REMOTION_SUBTITLE_BG: 'none',
      REMOTION_SUBTITLE_ANIMATION: 'hype', REMOTION_TRANSITION_DURATION: 10,
      KEN_BURNS_DIRECTION: 'center', KEN_BURNS_INTENSITY: 'normal',
      VIDEO_EFFECT: 'none', ASPECT_RATIO: '16:9', OUTPUT_QUALITY: '1080p',
      KARAOKE_ENABLED: true,
      AI_BROLL_SENSITIVITY: 5,
      SUBTITLE_PROVIDER: 'remotion', PYCAPS_STYLE: 'hype',
      SPESHAUDIO_LANGUAGE: '', SPESHAUDIO_STABILITY: 0.3, SPESHAUDIO_SIMILARITY_BOOST: 0.5, SPESHAUDIO_STYLE: 0.75,
      QWEN3_SPEAKER: 'Vivian',
      ZIMAGE_ASPECT_RATIO: '16:9'
    }, 
    prompts: {}, promptDefaults: {},
    newTopic: '', newScriptFile: '', notes: '', logLines: [],
    submitting: false, runError: '',
    settingsSaved: false, notesSaved: false, metaCopied: false, promptsSaved: false,
    settingsChanged: false, autoSaveTimeout: null, autoSaveEnabled: true,
    voicesList: [], voicesLoading: false, voicesFetchError: '', voicesProvider: '',
    presets: [], presetName: '', presetSaved: false, selectedPreset: '',
    filter: 'all',
    dashboardModuleFilter: 'all',
    settingsModule: 'tts',
    // Social meta state
    socialMetaLoading: false, socialMetaError: '', socialMetaResult: null, socialMetaCopied: false,
    bulletinVoicesList: [], bulletinVoicesLoading: false, bulletinVoicesFetchError: '',
    // Bulletin state
    bulletinTab: 'sources',
    bulletinSources: [],
    newSrc: { name: '', url: '', category: 'Genel', language: 'tr' },
    draftData: null, draftLoading: false, draftError: '',
    draftMaxItems: '3', draftLangOverride: '',
    openDraftCats: {},
    bulletinRenderCfg: { network_name: 'YTRobot Haber', style: 'breaking', fps: 60, format: '16:9', lang: 'auto' },
    bulletinRendering: false, bulletinJobId: null, bulletinJobStatus: '', bulletinJobError: '',
    bulletinProgress: 0, bulletinStepLabel: '', bulletinElapsed: 0, bulletinEta: null,
    bulletinPaused: false,
    bulletinRenderMode: 'combined',
    bulletinOverrideStyles: false,
    bulletinTextMode: 'per_scene',
    bulletinShowCategoryFlash: false,
    bulletinShowItemIntro: false,
    bulletinCategoryStyles: {},
    bulletinItemStyles: {},
    bulletinCategoryOutputs: {},
    _bulletinPoll: null,
    // Product Review state
    prMode: 'auto',
    prAutoOpen: true,
    prManualOpen: false,
    prAutoUrl: '', prAutoPrompt: '', prAutoLoading: false, prAutoError: '', prAutoSuccess: false,
    prTtsLoading: false, prTtsError: '', prTtsAudioUrl: '', prTtsNarration: '',
    prAutoGenerateTTS: true,
    prForm: {
      name: '', price: 0, originalPrice: 0, currency: 'TL',
      rating: 4.0, reviewCount: 0, imageUrl: '', galleryUrls: [],
      category: '', platform: '',
      pros: ['', '', ''], cons: ['', ''],
      score: 7, verdict: '', ctaText: 'Linke tıkla!',
      topComments: ['', '', ''],
      audioUrl: '',
    },
    prRenderCfg: { style: 'modern', format: '16:9', channelName: 'YTRobot İnceleme', fps: '60' },
    prRendering: false, prJobId: null, prJobStatus: '', prJobError: '',
    prProgress: 0, prStepLabel: '', _prPoll: null,
    // Wizard Extended Options (Normal Video)
    batchTopics: '',
    batchSubmitting: false,
    batchSubmitResult: null,
    batchError: '',
    wizardCategory: 'general',
    wizardQuality: 'standard',
    wizardPlatform: 'youtube_16_9',
    wizardSubtitleStyle: 'hype',
    wizardAdvancedOpen: false,
    // Legacy wizard options (used by Bulletin & Product Review modules)
    wizardMood: 'informative',
    wizardCaptions: 'karaoke',
    wizardTone: 'balanced',
    wizardStyle: 'dynamic',
    _sse: null, _timer: null,
    // Bulletin presets
    bulletinPresets: [],
    bulletinPresetName: '',
    bulletinPresetSaved: false,
    // Bulletin source selection for draft
    bulletinSelectedSources: [],
    bulletinSelectAllSources: false,
    bulletinSourceFilterCat: 'All',
    bulletinSourceFilterPreset: 'All',
    // Category → Template mapping
    categoryTemplates: {},
    // History deduplication
    bulletinHistory: {},
    bulletinActivePreset: '',
    bulletinSearch: '',
    bulletinCatFilter: '',
    bulletinPresetFilter: '',
    showSaveModal: false,
    globalError: null,
    _errorTimeout: null,
    // Channel Hub
    channelsData: [],
    channelsLoading: false,
    activeChannelId: '_default',
    activeChannelName: 'Varsayılan Kanal',
    channelFormOpen: false,
    channelEditId: null,
    wizardChannelId: '_default',
    channelForm: {
      name: '',
      language: 'tr',
      master_prompt: '',
      default_category: 'general',
      preset_name: '',
      branding: {
        logo_path: '',
        thumbnail_template: 'classic',
        color_primary: '#FF0000',
        color_secondary: '#FFFFFF'
      }
    },
    youtubeConnected: false,
    youtubeChannelInfo: null,
    analyticsData: null,
    analyticsLoading: false,
    queueStatus: null,
    errorDetails: [],
    socialLog: [],
    thumbnailGenerating: false,
    _chartInstance: null,
    competitorData: null,
    competitorLoading: false,
    competitorScanning: {},
    agActiveChannel: null,
    agStatusFilter: 'all',
    agNewChannel: { id: '', name: '', language: 'Turkish', dna: 'Documentary', pull_count: 10, competitors: [] },
    agNewCompetitorId: '',
    agNewCompetitorName: '',
    soundEnabled: localStorage.getItem('ytrobot-sound') !== 'false',
    // ── Toast Bildirim Sistemi ──
    toasts: [],
    _toastIdCounter: 0,
    wizardStep: 1,
    wizardMaxSteps: 3,
    showCommandPalette: false,
    commandQuery: '',
    selectedCommandIndex: 0,
    commands: [
      { id: 'nav_dashboard', title: 'Dashboard / Gözlem Paneli', icon: '📊', action: function() { this.view = 'dashboard'; } },
      { id: 'nav_new_run', title: 'New Video / Yeni Video Başlat', icon: '✨', action: function() { this.view = 'new-run'; this.mode='topic'; this.runError=''; } },
      { id: 'nav_settings', title: 'Settings / Ayarlar', icon: '⚙️', action: function() { this.loadSettings(); this.view = 'settings'; } },
      { id: 'nav_api_keys', title: 'API Keys / Anahtarlar', icon: '🔑', action: function() { this.loadSettings(); this.view = 'api-keys'; } },
      { id: 'nav_bulletin', title: 'News Bulletin / Haber Bülteni', icon: '📺', action: function() { this.view = 'bulletin'; this.bulletinTab = 'sources'; this.loadBulletinSources(); } },
      { id: 'nav_product_review', title: 'Product Review / Ürün İnceleme', icon: '🛒', action: function() { this.view = 'product-review'; } },
      { id: 'nav_social_meta', title: 'Social Media / Sosyal Medya', icon: '📱', action: function() { this.loadSettings(); this.view = 'social-meta'; this.loadSocialLog(); } },
      { id: 'nav_analytics', title: 'Analytics / Analiz Paneli', icon: '📈', action: function() {
  this.view = 'analytics';
  this.loadAnalytics();
  this.loadQueueStatus();
  this.loadErrorDetails();
} },
      { id: 'action_refresh', title: 'Refresh Sessions / Oturumları Yenile', icon: '🔄', action: function() { this.loadSessions(); } },
      { id: 'action_clear_logs', title: 'Clear Errors / Hataları Temizle', icon: '🧹', action: function() { this.globalError = null; } }
    ],

    t(key) { return LANG[this.lang]?.[key] ?? LANG.en[key] ?? key; },
    setLang(l) { this.lang = l; localStorage.setItem('ytrobot-lang', l); },

    // Wizard Navigation
    nextStep() {
      if (this.wizardStep < this.wizardMaxSteps) {
        this.wizardStep++;
        this.playSound('pop');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    prevStep() {
      if (this.wizardStep > 1) {
        this.wizardStep--;
        this.playSound('pop');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    initWizard(module) {
      this.videoModule = module;
      this.wizardStep = 1;
      // Define max steps per module
      if (module === 'normal') this.wizardMaxSteps = 4;
      else if (module === 'bulletin') this.wizardMaxSteps = 3;
      else if (module === 'product-review') this.wizardMaxSteps = 3;
    },

    wizardEstimate() {
      const estimates = { quick_draft: '~3 min', standard: '~8 min', cinematic: '~15 min' };
      return estimates[this.wizardQuality] || '~8 min';
    },

    wizardQualityLabel() {
      const labels = { quick_draft: this.t('wizard_quality_quick'), standard: this.t('wizard_quality_standard'), cinematic: this.t('wizard_quality_cinematic') };
      return labels[this.wizardQuality] || 'Standard';
    },

    wizardPlatformLabel() {
      const labels = { youtube_16_9: 'YouTube (16:9)', shorts_9_16: 'YouTube Shorts (9:16)', tiktok_9_16: 'TikTok (9:16)' };
      return labels[this.wizardPlatform] || 'YouTube (16:9)';
    },

    wizardSubtitleLabel() {
      const labels = { minimal: this.t('wizard_subtitle_minimal'), hype: this.t('wizard_subtitle_hype'), cinematic: this.t('wizard_subtitle_cinematic'), karaoke: this.t('wizard_subtitle_karaoke') };
      return labels[this.wizardSubtitleStyle] || 'Hype';
    },

    // ── Command Palette Methods ──
    toggleCommandPalette() {
      if (!this.showCommandPalette) {
        // Blur any active element to prevent focus conflicts
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        this.showCommandPalette = true;
        this.playSound('pop');
        this.commandQuery = '';
        this.selectedCommandIndex = 0;
        // Aggrresive focus with multiple retries for browser stability
        setTimeout(() => {
          const inp = document.getElementById('command-input');
          if (inp) {
            inp.focus();
            inp.select(); // Text select to allow quick overwrite
          }
        }, 50);
        setTimeout(() => document.getElementById('command-input')?.focus(), 150);
      } else {
        this.showCommandPalette = false;
      }
    },

    filteredCommands() {
      if (!this.commandQuery) return this.commands;
      const q = this.commandQuery.toLowerCase();
      return this.commands.filter(c => 
        c.title.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)
      );
    },

    executeCommand(cmd) {
      if (cmd && cmd.action) {
        this.playSound('click');
        cmd.action();
        this.showCommandPalette = false;
      }
    },

    handleCommandKey(e) {
      const filtered = this.filteredCommands();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.selectedCommandIndex = (this.selectedCommandIndex + 1) % filtered.length;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.selectedCommandIndex = (this.selectedCommandIndex - 1 + filtered.length) % filtered.length;
      } else if (e.key === 'Enter') {
        e.preventDefault();
        this.executeCommand(filtered[this.selectedCommandIndex]);
      } else if (e.key === 'Escape') {
        this.showCommandPalette = false;
      }
    },

    // ── Toast API ──
    showToast(message, type = 'info', duration = 5000) {
      const id = ++this._toastIdCounter;
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

    filteredBulletinSources() {
      let sources = this.bulletinSources || [];
      if (this.bulletinCatFilter) {
        sources = sources.filter(s => s.category === this.bulletinCatFilter);
      }
      if (this.bulletinPresetFilter === 'current' && this.bulletinActivePreset) {
        const history = this.bulletinHistory[this.bulletinActivePreset] || [];
        sources = sources.filter(s => history.includes(s.url));
      }
      if (this.bulletinSearch) {
        const q = this.bulletinSearch.toLowerCase();
        sources = sources.filter(s => s.name.toLowerCase().includes(q) || s.url.toLowerCase().includes(q));
      }
      return sources;
    },
    pipelineSteps() { return this.t('pipeline_steps'); },

    // ── Sound UX Engine (Generative Web Audio) ──
    toggleSound() {
      this.soundEnabled = !this.soundEnabled;
      localStorage.setItem('ytrobot-sound', this.soundEnabled ? 'true' : 'false');
    },
    async playSound(type) {
      if (!this.soundEnabled) return;
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);

        if (type === 'success') {
          // Yumusak onay — iki nota arpegio
          osc.frequency.setValueAtTime(523, ctx.currentTime);      // C5
          osc.frequency.setValueAtTime(784, ctx.currentTime + 0.1); // G5
          gain.gain.setValueAtTime(0.08, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
          osc.type = 'sine';
          osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.5);
        } else if (type === 'error') {
          // Dikkat cekici ama rahatsiz etmeyen
          osc.frequency.setValueAtTime(440, ctx.currentTime);
          osc.frequency.setValueAtTime(330, ctx.currentTime + 0.15);
          gain.gain.setValueAtTime(0.06, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
          osc.type = 'triangle';
          osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4);
        } else if (type === 'pop') {
          // Hafif tiklama
          osc.frequency.setValueAtTime(1200, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05);
          gain.gain.setValueAtTime(0.04, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
          osc.type = 'sine';
          osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.08);
        } else if (type === 'click') {
          // Cok hafif tiklama
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

    // ── Channel Hub Methods ──
    async loadChannels() {
      this.channelsLoading = true;
      try {
        const r = await fetch('/api/channels');
        const data = await r.json();
        this.channelsData = data.channels || [];
        const ar = await fetch('/api/channels/active');
        if (ar.ok) {
          const active = await ar.json();
          this.activeChannelId = active.id || '_default';
          this.activeChannelName = active.name || 'Varsayılan Kanal';
        }
      } catch (e) {
        console.error('Failed to load channels:', e);
      }
      this.channelsLoading = false;
    },

    async setActiveChannel(channelId) {
      try {
        await fetch('/api/channels/active', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channel_id: channelId })
        });
        await this.loadChannels();
      } catch (e) {
        console.error('Failed to set active channel:', e);
      }
    },

    openChannelForm(channel = null) {
      if (channel) {
        this.channelEditId = channel.id;
        this.channelForm = {
          name: channel.name || '',
          language: channel.language || 'tr',
          master_prompt: channel.master_prompt || '',
          default_category: channel.default_category || 'general',
          preset_name: channel.preset_name || '',
          branding: channel.branding || {
            logo_path: '', thumbnail_template: 'classic',
            color_primary: '#FF0000', color_secondary: '#FFFFFF'
          }
        };
      } else {
        this.channelEditId = null;
        this.channelForm = {
          name: '', language: 'tr', master_prompt: '',
          default_category: 'general', preset_name: '',
          branding: {
            logo_path: '', thumbnail_template: 'classic',
            color_primary: '#FF0000', color_secondary: '#FFFFFF'
          }
        };
      }
      this.channelFormOpen = true;
    },

    async saveChannel() {
      try {
        if (this.channelEditId) {
          await fetch(`/api/channels/${this.channelEditId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(this.channelForm)
          });
        } else {
          await fetch('/api/channels', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(this.channelForm)
          });
        }
        this.channelFormOpen = false;
        await this.loadChannels();
        this.showSuccess(this.channelEditId ? 'Kanal güncellendi.' : 'Kanal oluşturuldu.');
      } catch (e) {
        console.error('Failed to save channel:', e);
        this.showError('Kanal kaydedilemedi.');
      }
    },

    async deleteChannel(channelId) {
      if (!confirm('Bu kanalı silmek istediğinize emin misiniz?')) return;
      try {
        await fetch(`/api/channels/${channelId}`, { method: 'DELETE' });
        await this.loadChannels();
        this.showSuccess('Kanal silindi.');
      } catch (e) {
        console.error('Failed to delete channel:', e);
        this.showError('Kanal silinemedi.');
      }
    },

    async checkYouTubeStatus() {
      try {
        const activeChannel = this.activeChannelId || '_default';
        const resp = await fetch(`/api/youtube/status?channel_id=${activeChannel}`);
        const data = await resp.json();
        this.youtubeConnected = data.authenticated;
        this.youtubeChannelInfo = data.channel_info;
      } catch(e) { console.warn('YouTube status check failed:', e); }
    },

    connectYouTube() {
      const activeChannel = this.activeChannelId || '_default';
      fetch(`/api/youtube/auth-url?channel_id=${activeChannel}`)
        .then(r => r.json())
        .then(data => { if(data.auth_url) window.open(data.auth_url, '_blank'); })
        .catch(e => console.error('YouTube auth error:', e));
    },

    async init() {
      // 1. Register Global Listeners First (Immune to API failures)
      window.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault();
          this.toggleCommandPalette();
        }
      });

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
      } catch (e) {
        console.error("Initialization error:", e);
      }
      
      this._timer = setInterval(() => {
        this.loadSessions();
        if (this.view === 'analytics') {
          this.loadAnalytics();
          this.loadQueueStatus();
        }
        if (this.view === 'social-meta') this.loadSocialLog();
      }, 3000);
    },

    async loadAnalytics() {
      this.analyticsLoading = true;
      try {
        this.analyticsData = await this.apiFetch('/api/stats');
        await this.$nextTick();
        this.renderDailyChart('dailyRenderChart');
      } catch(e) { console.error("Analytics fetch error:", e); }
      finally { this.analyticsLoading = false; }
    },

    async loadQueueStatus() {
      try { this.queueStatus = await this.apiFetch('/api/stats/queue'); }
      catch(e) { console.warn('[queue] status error:', e); }
    },

    async loadErrorDetails() {
      try {
        const data = await this.apiFetch('/api/stats/errors');
        this.errorDetails = data.errors || [];
      } catch(e) { console.warn('[analytics] error details error:', e); }
    },

    async loadSocialLog() {
      try {
        const data = await this.apiFetch('/api/stats/social-log');
        this.socialLog = data.events || [];
      } catch(e) { console.warn('[social] log error:', e); }
    },

    async loadCompetitor() {
      this.competitorLoading = true;
      try { this.competitorData = await this.apiFetch('/api/competitor'); }
      catch(e) { console.error('[competitor] load error:', e); }
      finally { this.competitorLoading = false; }
    },

    async saveAgChannel() {
      if (!this.agNewChannel.id || !this.agNewChannel.name) return;
      try {
        await this.apiFetch('/api/competitor/channels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.agNewChannel),
        });
        await this.loadCompetitor();
        this.agNewChannel = { id: '', name: '', language: 'Turkish', dna: 'Documentary', pull_count: 10, competitors: [] };
      } catch(e) { console.error('[competitor] save channel error:', e); }
    },

    async deleteAgChannel(id) {
      try {
        await this.apiFetch(`/api/competitor/channels/${id}`, { method: 'DELETE' });
        await this.loadCompetitor();
        if (this.agActiveChannel?.id === id) this.agActiveChannel = null;
      } catch(e) { console.error('[competitor] delete channel error:', e); }
    },

    async scanAgChannel(channelId) {
      this.competitorScanning[channelId] = true;
      try {
        await this.apiFetch(`/api/competitor/channels/${channelId}/scan`, { method: 'POST' });
        await this.loadCompetitor();
      } catch(e) { console.error('[competitor] scan error:', e); }
      finally { delete this.competitorScanning[channelId]; }
    },

    async updateAgTitle(id, updates) {
      try {
        await this.apiFetch(`/api/competitor/titles/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
        await this.loadCompetitor();
      } catch(e) { console.error('[competitor] update title error:', e); }
    },

    async deleteAgTitle(id) {
      try {
        await this.apiFetch(`/api/competitor/titles/${id}`, { method: 'DELETE' });
        await this.loadCompetitor();
      } catch(e) { console.error('[competitor] delete title error:', e); }
    },

    agSendToQueue(entry) {
      this.view = 'new-run';
      this.wizardStep = 2;
      this.videoModule = 'normal';
      this.$nextTick(() => { this.newTopic = entry.rewritten_title || entry.original_title; });
      this.updateAgTitle(entry.id, { status: 'in_queue' });
    },

    get agFilteredTitles() {
      if (!this.competitorData?.title_pool) return [];
      const pool = this.competitorData.title_pool;
      const filtered = this.agStatusFilter === 'all'
        ? pool
        : pool.filter(t => t.status === this.agStatusFilter);
      if (this.agActiveChannel)
        return filtered.filter(t => t.channel_id === this.agActiveChannel.id);
      return filtered.sort((a, b) => (b.viral_score || 0) - (a.viral_score || 0));
    },

    async generateThumbnail(session) {
      const concept = session.metadata?.thumbnail_concept;
      if (!concept) return;
      this.thumbnailGenerating = true;
      try {
        const data = await this.apiFetch('/api/thumbnail/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: concept, session_id: session.id }),
        });
        session._thumbnail_url = data.url + '?t=' + Date.now();
      } catch(e) {
        console.error('[thumbnail] generation error:', e);
      } finally {
        this.thumbnailGenerating = false;
      }
    },

    downloadStatsCsv() {
      window.open('/api/stats/export-csv', '_blank');
    },

    async submitBatch() {
      const lines = this.batchTopics.split('\n').map(l => l.trim()).filter(Boolean);
      if (!lines.length) return;
      this.batchSubmitting = true;
      this.batchError = '';
      this.batchSubmitResult = null;
      const results = [];
      try {
        for (const topic of lines) {
          try {
            const data = await this.apiFetch('/api/sessions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ topic, preset_name: this.selectedPreset || '' }),
            });
            results.push({ topic, id: data.session_id, ok: true });
          } catch(e) {
            results.push({ topic, error: e.message, ok: false });
          }
        }
        this.batchSubmitResult = results;
        this.batchTopics = '';
        this.loadSessions();
      } catch(e) {
        this.batchError = e.message;
      } finally {
        this.batchSubmitting = false;
      }
    },

    renderDailyChart(canvasId) {
      if (!this.analyticsData?.daily_history?.length) return;
      const canvas = document.getElementById(canvasId);
      if (!canvas || typeof Chart === 'undefined') return;
      if (this._chartInstance) { this._chartInstance.destroy(); this._chartInstance = null; }
      const history = this.analyticsData.daily_history.slice(-14);
      this._chartInstance = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
          labels: history.map(d => d.date.slice(5)),
          datasets: [
            { label: 'Success', data: history.map(d => d.success),
              backgroundColor: 'rgba(16,185,129,0.7)', borderRadius: 4 },
            { label: 'Failed', data: history.map(d => d.failed),
              backgroundColor: 'rgba(239,68,68,0.6)', borderRadius: 4 },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { labels: { color: '#94a3b8', font: { size: 10 } } } },
          scales: {
            x: { stacked: true, ticks: { color: '#64748b', font: { size: 9 } },
                 grid: { color: 'rgba(255,255,255,0.05)' } },
            y: { stacked: true, ticks: { color: '#64748b', font: { size: 9 } },
                 grid: { color: 'rgba(255,255,255,0.05)' }, beginAtZero: true },
          },
        },
      });
    },

    formatTs(ts) {
      if (!ts) return '';
      return new Date(ts * 1000).toLocaleString(
        this.lang === 'tr' ? 'tr-TR' : 'en-US',
        { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
      );
    },

    loadBulletinPresets() {
      try {
        this.bulletinPresets = JSON.parse(localStorage.getItem('ytrobot-bulletin-presets') || '[]');
      } catch(e) { this.bulletinPresets = []; }
    },

    saveBulletinPreset() {
      const name = this.bulletinPresetName.trim();
      if (!name) return;
      const values = {
        ...this.bulletinRenderCfg,
        lower_third_enabled: this.settings.BULLETIN_LOWER_THIRD_ENABLED,
        lower_third_text: this.settings.BULLETIN_LOWER_THIRD_TEXT,
        lower_third_font: this.settings.BULLETIN_LOWER_THIRD_FONT,
        lower_third_color: this.settings.BULLETIN_LOWER_THIRD_COLOR,
        lower_third_size: this.settings.BULLETIN_LOWER_THIRD_SIZE,
        ticker_enabled: this.settings.BULLETIN_TICKER_ENABLED,
        ticker_speed: this.settings.BULLETIN_TICKER_SPEED,
        ticker_bg: this.settings.BULLETIN_TICKER_BG,
        ticker_color: this.settings.BULLETIN_TICKER_COLOR,
        show_live: this.settings.BULLETIN_SHOW_LIVE_INDICATOR,
        show_source: this.settings.BULLETIN_SHOW_SOURCE,
        show_date: this.settings.BULLETIN_SHOW_DATE,
        network_name: this.bulletinRenderCfg.network_name,
        style: this.bulletinRenderCfg.style,
        format: this.bulletinRenderCfg.format,
        fps: this.bulletinRenderCfg.fps,
        category_templates: JSON.parse(JSON.stringify(this.categoryTemplates)),
        selected_sources: [...this.bulletinSelectedSources],
        tts_lang_override: this.settings.BULLETIN_TTS_LANG_OVERRIDE,
      };
      // Remove existing preset with same name
      this.bulletinPresets = this.bulletinPresets.filter(p => p.name !== name);
      this.bulletinPresets.unshift({ name, values });
      localStorage.setItem('ytrobot-bulletin-presets', JSON.stringify(this.bulletinPresets));
      this.bulletinPresetSaved = true;
      setTimeout(() => this.bulletinPresetSaved = false, 2500);
    },

    applyBulletinPreset(preset) {
      const v = preset.values || {};
      if (v.style) this.bulletinRenderCfg.style = v.style;
      if (v.format) this.bulletinRenderCfg.format = v.format;
      if (v.fps) this.bulletinRenderCfg.fps = v.fps;
      if (v.network_name) this.bulletinRenderCfg.network_name = v.network_name;
      if (v.lower_third_enabled !== undefined) this.settings.BULLETIN_LOWER_THIRD_ENABLED = v.lower_third_enabled;
      if (v.lower_third_text !== undefined) this.settings.BULLETIN_LOWER_THIRD_TEXT = v.lower_third_text;
      if (v.lower_third_font) this.settings.BULLETIN_LOWER_THIRD_FONT = v.lower_third_font;
      if (v.lower_third_color) this.settings.BULLETIN_LOWER_THIRD_COLOR = v.lower_third_color;
      if (v.lower_third_size) this.settings.BULLETIN_LOWER_THIRD_SIZE = v.lower_third_size;
      if (v.ticker_enabled !== undefined) this.settings.BULLETIN_TICKER_ENABLED = v.ticker_enabled;
      if (v.ticker_speed) this.settings.BULLETIN_TICKER_SPEED = v.ticker_speed;
      if (v.ticker_bg) this.settings.BULLETIN_TICKER_BG = v.ticker_bg;
      if (v.ticker_color) this.settings.BULLETIN_TICKER_COLOR = v.ticker_color;
      if (v.show_live !== undefined) this.settings.BULLETIN_SHOW_LIVE_INDICATOR = v.show_live;
      if (v.show_source !== undefined) this.settings.BULLETIN_SHOW_SOURCE = v.show_source;
      if (v.show_date !== undefined) this.settings.BULLETIN_SHOW_DATE = v.show_date;
      if (v.category_templates) this.categoryTemplates = JSON.parse(JSON.stringify(v.category_templates));
      if (v.selected_sources) {
        this.bulletinSelectAllSources = false;
        this.bulletinSelectedSources = [...v.selected_sources];
      }
      if (v.tts_lang_override !== undefined) this.settings.BULLETIN_TTS_LANGUAGE = v.tts_lang_override;
      this.bulletinActivePreset = preset.name;
      this.bulletinPresetName = preset.name;
    },

    deleteBulletinPreset(name) {
      this.bulletinPresets = this.bulletinPresets.filter(p => p.name !== name);
      localStorage.setItem('ytrobot-bulletin-presets', JSON.stringify(this.bulletinPresets));
    },

    async loadSessions() {
      try {
        const oldSessions = JSON.parse(JSON.stringify(this.sessions || []));
        this.sessions = await this.apiFetch('/api/sessions');
        
        // Notify success sound for newly completed jobs
        this.sessions.forEach(s => {
          const old = oldSessions.find(o => o.id === s.id);
          if (old && old.status !== 'completed' && s.status === 'completed') {
            this.playSound('success');
            // If it was the current session being watched, maybe do something?
          }
        });

        if (this.currentSession) {
          const u = this.sessions.find(s => s.id === this.currentSession.id);
          if (u) this.currentSession = u;
        }
      } catch(e) { console.warn('[poll] session refresh error:', e); }
    },

    openSession(session) {
      this.currentSession = session;
      this.notes = session.notes || '';
      this.logLines = [];
      this.view = 'session';
      if (this._sse) { this._sse.close(); this._sse = null; }
      const es = new EventSource(`/api/sessions/${session.id}/logs`);
      this._sse = es;
      es.onmessage = (e) => {
        const line = JSON.parse(e.data);
        if (line === '__DONE__') { es.close(); this._sse = null; this.loadSessions(); return; }
        this.logLines.push(line);
        this.$nextTick(() => { const el = document.getElementById('log-container'); if (el) el.scrollTop = el.scrollHeight; });
      };
      es.onerror = () => { es.close(); this._sse = null; };
    },

    closeSession() {
      if (this._sse) { this._sse.close(); this._sse = null; }
      this.currentSession = null; this.logLines = []; this.view = 'dashboard';
    },

    async saveNotes() {
      if (!this.currentSession) return;
      await fetch(`/api/sessions/${this.currentSession.id}`, {
        method: 'PATCH', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ notes: this.notes }),
      });
      this.notesSaved = true; setTimeout(() => this.notesSaved = false, 2000);
    },

    async submitRun() {
      this.runError = '';
      const body = {};
      if (this.mode === 'topic') {
        if (!this.newTopic.trim()) { this.runError = this.t('error_topic'); return; }
        body.topic = this.newTopic.trim();
      } else {
        if (!this.newScriptFile.trim()) { this.runError = this.t('error_script'); return; }
        body.script_file = this.newScriptFile.trim();
      }
      if (this.selectedPreset) body.preset_name = this.selectedPreset;
      if (this.videoModule === 'normal') {
        body.wizard_config = {
          quality_preset: this.wizardQuality,
          platform: this.wizardPlatform,
          subtitle_style: this.wizardSubtitleStyle,
        };
        body.content_category = this.wizardCategory;
      }
      this.submitting = true;
      try {
        const data = await this.apiFetch('/api/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const session_id = data.session_id;
        this.newTopic = ''; this.newScriptFile = '';
        await this.loadSessions();
        const session = this.sessions.find(s => s.id === session_id);
        if (session) this.openSession(session);
      } catch(e) { this.runError = e.message; }
      finally { this.submitting = false; }
    },

    async loadSettings() {
      this.settings = await this.apiFetch('/api/settings');
      // Sync bulletinRenderCfg from persisted settings
      if (this.settings.BULLETIN_NETWORK_NAME) this.bulletinRenderCfg.network_name = this.settings.BULLETIN_NETWORK_NAME;
      if (this.settings.BULLETIN_STYLE)        this.bulletinRenderCfg.style = this.settings.BULLETIN_STYLE;
      if (this.settings.BULLETIN_FORMAT)       this.bulletinRenderCfg.format = this.settings.BULLETIN_FORMAT;
      if (this.settings.BULLETIN_FPS)          this.bulletinRenderCfg.fps = parseInt(this.settings.BULLETIN_FPS);
      // Set defaults for new bulletin visual settings
      if (!this.settings.BULLETIN_LOWER_THIRD_ENABLED) this.settings.BULLETIN_LOWER_THIRD_ENABLED = 'true';
      if (!this.settings.BULLETIN_LOWER_THIRD_FONT) this.settings.BULLETIN_LOWER_THIRD_FONT = 'oswald';
      if (!this.settings.BULLETIN_LOWER_THIRD_COLOR) this.settings.BULLETIN_LOWER_THIRD_COLOR = '#ffffff';
      if (!this.settings.BULLETIN_LOWER_THIRD_SIZE) this.settings.BULLETIN_LOWER_THIRD_SIZE = '32';
      if (!this.settings.BULLETIN_TICKER_ENABLED) this.settings.BULLETIN_TICKER_ENABLED = 'true';
      if (!this.settings.BULLETIN_TICKER_SPEED) this.settings.BULLETIN_TICKER_SPEED = '3';
      if (!this.settings.BULLETIN_TICKER_BG) this.settings.BULLETIN_TICKER_BG = '#dc2626';
      if (!this.settings.BULLETIN_TICKER_COLOR) this.settings.BULLETIN_TICKER_COLOR = '#ffffff';
      if (!this.settings.BULLETIN_SHOW_LIVE_INDICATOR) this.settings.BULLETIN_SHOW_LIVE_INDICATOR = 'false';
      if (!this.settings.BULLETIN_SHOW_SOURCE) this.settings.BULLETIN_SHOW_SOURCE = 'true';
      if (!this.settings.BULLETIN_SHOW_DATE) this.settings.BULLETIN_SHOW_DATE = 'true';
      if (this.settings.BULLETIN_CATEGORY_MAPPING) {
        try { this.categoryTemplates = JSON.parse(this.settings.BULLETIN_CATEGORY_MAPPING); } catch(e) { this.categoryTemplates = {}; }
      }
      if (!this.settings.QWEN3_MODEL_ID) this.settings.QWEN3_MODEL_ID = 'Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice';
      if (!this.settings.QWEN3_MODEL_TYPE) this.settings.QWEN3_MODEL_TYPE = 'custom';
      if (!this.settings.QWEN3_SPEAKER) this.settings.QWEN3_SPEAKER = 'Vivian';
      if (!this.settings.QWEN3_DEVICE) this.settings.QWEN3_DEVICE = 'auto';
      if (!this.settings.QWEN3_VOICE_INSTRUCT) this.settings.QWEN3_VOICE_INSTRUCT = '';
      if (!this.settings.QWEN3_REF_AUDIO) this.settings.QWEN3_REF_AUDIO = '';
      // YT Video override defaults
      if (this.settings.YT_VISUALS_PROVIDER === undefined) this.settings.YT_VISUALS_PROVIDER = '';
      if (this.settings.YT_COMPOSER_PROVIDER === undefined) this.settings.YT_COMPOSER_PROVIDER = '';
      if (this.settings.YT_ZIMAGE_ASPECT_RATIO === undefined) this.settings.YT_ZIMAGE_ASPECT_RATIO = '';
      if (this.settings.YT_REMOTION_VIDEO_EFFECT === undefined) this.settings.YT_REMOTION_VIDEO_EFFECT = '';
      // Bulletin override defaults
      if (this.settings.BULLETIN_VIDEO_EFFECT === undefined) this.settings.BULLETIN_VIDEO_EFFECT = 'none';
      if (this.settings.BULLETIN_CATEGORY_MAPPING === undefined) this.settings.BULLETIN_CATEGORY_MAPPING = '';
      // Product Review defaults
      if (!this.settings.PR_STYLE) this.settings.PR_STYLE = 'modern';
      if (!this.settings.PR_FORMAT) this.settings.PR_FORMAT = '16:9';
      if (!this.settings.PR_FPS) this.settings.PR_FPS = '60';
      if (!this.settings.PR_CHANNEL_NAME) this.settings.PR_CHANNEL_NAME = 'YTRobot İnceleme';
      if (!this.settings.PR_CURRENCY) this.settings.PR_CURRENCY = 'TL';
      if (!this.settings.PR_CTA_TEXT) this.settings.PR_CTA_TEXT = 'Linke tıkla!';
      if (this.settings.PR_TTS_PROVIDER === undefined) this.settings.PR_TTS_PROVIDER = '';
      if (this.settings.PR_TTS_VOICE_ID === undefined) this.settings.PR_TTS_VOICE_ID = '';
      if (this.settings.PR_TTS_SPEED === undefined) this.settings.PR_TTS_SPEED = 0;
      if (this.settings.PR_TTS_LANGUAGE === undefined) this.settings.PR_TTS_LANGUAGE = '';
      if (this.settings.PR_OPENAI_TTS_VOICE === undefined) this.settings.PR_OPENAI_TTS_VOICE = '';
      if (this.settings.PR_TTS_STABILITY === undefined) this.settings.PR_TTS_STABILITY = 0.3;
      if (this.settings.PR_TTS_SIMILARITY === undefined) this.settings.PR_TTS_SIMILARITY = 0.5;
      if (this.settings.PR_TTS_STYLE === undefined) this.settings.PR_TTS_STYLE = 0.75;
      if (this.settings.PR_MASTER_PROMPT === undefined) this.settings.PR_MASTER_PROMPT = '';
      if (this.settings.PR_AI_LANGUAGE === undefined) this.settings.PR_AI_LANGUAGE = '';
      if (this.settings.PR_AUTO_GENERATE_TTS === undefined) this.settings.PR_AUTO_GENERATE_TTS = true;
      if (this.settings.WEBHOOK_URL === undefined) this.settings.WEBHOOK_URL = '';
      if (this.settings.WEBHOOK_MENTION === undefined) this.settings.WEBHOOK_MENTION = '';
      if (this.settings.WEBHOOK_ENABLED === undefined) this.settings.WEBHOOK_ENABLED = false;
      if (this.settings.WEBHOOK_ON_COMPLETE === undefined) this.settings.WEBHOOK_ON_COMPLETE = true;
      if (this.settings.WEBHOOK_ON_FAILURE === undefined) this.settings.WEBHOOK_ON_FAILURE = true;
      // Provider-bazli ses ayarlari varsayilanlari
      if (this.settings.YT_ELEVENLABS_VOICE_ID === undefined) this.settings.YT_ELEVENLABS_VOICE_ID = '';
      if (this.settings.YT_OPENAI_TTS_VOICE === undefined) this.settings.YT_OPENAI_TTS_VOICE = '';
      if (this.settings.YT_SPESHAUDIO_VOICE_ID === undefined) this.settings.YT_SPESHAUDIO_VOICE_ID = '';
      if (this.settings.BULLETIN_ELEVENLABS_VOICE_ID === undefined) this.settings.BULLETIN_ELEVENLABS_VOICE_ID = '';
      if (this.settings.BULLETIN_OPENAI_TTS_VOICE === undefined) this.settings.BULLETIN_OPENAI_TTS_VOICE = '';
      if (this.settings.BULLETIN_SPESHAUDIO_VOICE_ID === undefined) this.settings.BULLETIN_SPESHAUDIO_VOICE_ID = '';
      if (this.settings.PR_ELEVENLABS_VOICE_ID === undefined) this.settings.PR_ELEVENLABS_VOICE_ID = '';
      if (this.settings.PR_OPENAI_TTS_VOICE === undefined) this.settings.PR_OPENAI_TTS_VOICE = '';
      if (this.settings.PR_SPESHAUDIO_VOICE_ID === undefined) this.settings.PR_SPESHAUDIO_VOICE_ID = '';
      // Sync PR render config from settings
      if (this.settings.PR_STYLE)        this.prRenderCfg.style = this.settings.PR_STYLE;
      if (this.settings.PR_FORMAT)       this.prRenderCfg.format = this.settings.PR_FORMAT;
      if (this.settings.PR_FPS)          this.prRenderCfg.fps = this.settings.PR_FPS;
      if (this.settings.PR_CHANNEL_NAME) this.prRenderCfg.channelName = this.settings.PR_CHANNEL_NAME;
      if (this.settings.PR_CURRENCY)     this.prForm.currency = this.settings.PR_CURRENCY;
      if (this.settings.PR_CTA_TEXT)     this.prForm.ctaText = this.settings.PR_CTA_TEXT;
      if (this.settings.PR_MASTER_PROMPT) this.prAutoPrompt = this.settings.PR_MASTER_PROMPT;
      if (this.settings.PR_AUTO_GENERATE_TTS !== undefined) this.prAutoGenerateTTS = this.settings.PR_AUTO_GENERATE_TTS;
    },

    async saveSettings() {
      // Mirror bulletinRenderCfg back into settings for persistence
      this.settings.BULLETIN_NETWORK_NAME = this.bulletinRenderCfg.network_name;
      this.settings.BULLETIN_STYLE        = this.bulletinRenderCfg.style;
      this.settings.BULLETIN_FORMAT       = this.bulletinRenderCfg.format;
      this.settings.BULLETIN_FPS          = String(this.bulletinRenderCfg.fps);
      this.settings.BULLETIN_NETWORK_NAME = this.bulletinRenderCfg.network_name;
      this.settings.BULLETIN_CATEGORY_MAPPING = JSON.stringify(this.categoryTemplates);
      // Mirror Product Review auto-generate TTS setting
      this.settings.PR_AUTO_GENERATE_TTS = this.prAutoGenerateTTS;
      await this.apiFetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: this.settings })
      });
      this.settingsSaved = true; this.settingsChanged = false;
      this.showSuccess(this.t('settings_saved') || 'Ayarlar kaydedildi');
      setTimeout(() => this.settingsSaved = false, 3000);
    },

    triggerAutoSave() {
      if (!this.autoSaveEnabled) return;
      this.settingsChanged = true;
      if (this.autoSaveTimeout) clearTimeout(this.autoSaveTimeout);
      this.autoSaveTimeout = setTimeout(() => {
        this.saveSettings();
      }, 2000); // 2 saniye debounce
    },

    handleSaveSettings() {
      if (this.settingsModule === 'bulletin' && this.bulletinActivePreset) {
        this.showSaveModal = true;
      } else if (this.settingsModule === 'ytrobot' && this.selectedPreset) {
        this.showSaveModal = true;
      } else {
        this.saveSettings();
      }
    },

    async confirmSaveSettings(type) {
      this.showSaveModal = false;
      if (type === 'global') {
        await this.saveSettings();
      } else if (type === 'preset') {
        if (this.settingsModule === 'bulletin' && this.bulletinActivePreset) {
          this.bulletinPresetName = this.bulletinActivePreset;
          await this.saveBulletinPreset();
        } else if (this.settingsModule === 'ytrobot' && this.selectedPreset) {
          this.presetName = this.selectedPreset;
          await this.savePreset();
        }
      }
    },

    async loadPrompts() {
      try {
        this.prompts = await this.apiFetch('/api/prompts');
        if (!('bulletin_narration' in this.prompts)) this.prompts.bulletin_narration = '';
      } catch(e) { console.error('loadPrompts /api/prompts error:', e); }
      try {
        const rd = await fetch('/api/prompts/defaults');
        if (rd.ok) this.promptDefaults = await rd.json();
        else console.error('loadPrompts /api/prompts/defaults status:', rd.status, await rd.text());
      } catch(e) { console.error('loadPrompts /api/prompts/defaults error:', e); }
    },

    async savePrompts() {
      await this.apiFetch('/api/prompts', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ values: this.prompts }) });
      this.promptsSaved = true;
      this.showSuccess(this.t('prompts_saved') || 'Promptlar kaydedildi');
      setTimeout(() => this.promptsSaved = false, 3000);
    },

    getCatColor(cat) {
      const c = cat ? cat.trim() : '';
      const colors = {
        'Gündem': 'bg-slate-700',
        'Dünya': 'bg-blue-700',
        'Siyaset': 'bg-indigo-700',
        'Ekonomi': 'bg-amber-700',
        'Finans': 'bg-amber-700',
        'Spor': 'bg-emerald-700',
        'Magazin': 'bg-pink-700',
        'Eğlence': 'bg-pink-700',
        'Teknoloji': 'bg-cyan-700',
        'Tech': 'bg-cyan-700',
        'Bilim': 'bg-violet-700',
        'Hava Durumu': 'bg-sky-700',
        'Kurumsal': 'bg-blue-600',
        'Son Dakika': 'bg-red-700',
        'Breaking': 'bg-red-700',
        'Genel': 'bg-slate-600'
      };
      return colors[c] || 'bg-slate-800';
    },

    getCatBorder(cat) {
      const c = cat ? cat.trim() : '';
      const borders = {
        'Ekonomi': 'border-amber-700/50',
        'Finans': 'border-amber-700/50',
        'Spor': 'border-emerald-700/50',
        'Teknoloji': 'border-cyan-700/50',
        'Tech': 'border-cyan-700/50',
        'Bilim': 'border-violet-700/50',
        'Son Dakika': 'border-red-700/50',
      };
      return borders[c] || 'border-slate-800';
    },

    resetPrompt(key) {
      this.prompts[key] = '';
    },

    async fetchVoices() {
      this.voicesLoading = true;
      this.voicesFetchError = '';
      const prov = this.settings.TTS_PROVIDER;
      let key = '';
      if (prov === 'elevenlabs') key = this.settings.ELEVENLABS_API_KEY || '';
      if (prov === 'speshaudio') key = this.settings.SPESHAUDIO_API_KEY || '';
      const params = new URLSearchParams({ provider: prov });
      if (key) params.set('api_key', key);
      try {
        const r = await fetch('/api/voices?' + params.toString());
        if (!r.ok) {
          const err = await r.json();
          this.voicesFetchError = err.detail || 'Failed to fetch voices';
        } else {
          const data = await r.json();
          this.voicesList = data.voices || [];
          this.voicesProvider = prov;
          if (this.voicesList.length === 0) this.voicesFetchError = 'No voices returned';
        }
      } catch(e) {
        this.voicesFetchError = e.message;
      }
      this.voicesLoading = false;
    },

    async fetchBulletinVoices() {
      this.bulletinVoicesLoading = true;
      this.bulletinVoicesFetchError = '';
      const prov = this.settings.BULLETIN_TTS_PROVIDER || this.settings.TTS_PROVIDER;
      let key = '';
      if (prov === 'elevenlabs') key = this.settings.ELEVENLABS_API_KEY || '';
      if (prov === 'speshaudio') key = this.settings.SPESHAUDIO_API_KEY || '';
      const params = new URLSearchParams({ provider: prov });
      if (key) params.set('api_key', key);
      try {
        const r = await fetch('/api/voices?' + params.toString());
        if (!r.ok) {
          const err = await r.json();
          this.bulletinVoicesFetchError = err.detail || 'Failed to fetch voices';
        } else {
          const data = await r.json();
          this.bulletinVoicesList = data.voices || [];
          if (this.bulletinVoicesList.length === 0) this.bulletinVoicesFetchError = 'No voices returned';
        }
      } catch(e) { this.bulletinVoicesFetchError = e.message; }
      this.bulletinVoicesLoading = false;
    },

    async loadPresets() {
      try {
        const r = await fetch('/api/presets');
        this.presets = await r.json();
      } catch(e) { console.warn('[presets] load error:', e); }
    },

    async savePreset() {
      const name = this.presetName.trim();
      if (!name) return;
      await fetch('/api/presets', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ name, values: this.settings }),
      });
      this.presetSaved = true;
      setTimeout(() => this.presetSaved = false, 2500);
      await this.loadPresets();
      this.presetName = '';
    },

    applyPreset(preset) {
      this.settings = { ...this.settings, ...preset.values };
      this.selectedPreset = preset.name;
      this.presetName = preset.name;
    },

    async deletePreset(name) {
      await fetch(`/api/presets/${encodeURIComponent(name)}`, { method: 'DELETE' });
      if (this.selectedPreset === name) this.selectedPreset = '';
      await this.loadPresets();
    },

    async copyMetadata() {
      if (!this.currentSession?.metadata) return;
      const m = this.currentSession.metadata;
      const text = `Title: ${m.title}\n\nDescription:\n${m.description}\n\nTags: ${(m.tags||[]).join(', ')}`;
      await navigator.clipboard.writeText(text);
      this.metaCopied = true; setTimeout(() => this.metaCopied = false, 2000);
    },

    progressPct(session) {
      if (!session?.steps) return 0;
      if (session.status === 'completed') return 100;
      const done = session.steps.filter(s => s.status === 'completed').length;
      return Math.round((done / session.steps.length) * 100);
    },

    filteredSessions() {
      let list = this.sessions;
      if (this.filter !== 'all') list = list.filter(s => s.status === this.filter);
      if (this.dashboardModuleFilter !== 'all') list = list.filter(s => (s.module || 'yt_video') === this.dashboardModuleFilter);
      return list;
    },

    moduleBadge(module) {
      return {
        yt_video: { label: 'YT Video', css: 'bg-indigo-900/40 border-indigo-700/50 text-indigo-300' },
        bulletin: { label: 'Bülten', css: 'bg-red-900/40 border-red-700/50 text-red-300' },
        product_review: { label: 'Ürün İnceleme', css: 'bg-amber-900/40 border-amber-700/50 text-amber-300' },
      }[module] || { label: 'YT Video', css: 'bg-indigo-900/40 border-indigo-700/50 text-indigo-300' };
    },

    toggleSocialField(field) {
      const current = (this.settings.SOCIAL_META_FIELDS || 'title,description,tags').split(',').filter(Boolean);
      const idx = current.indexOf(field);
      if (idx === -1) current.push(field);
      else current.splice(idx, 1);
      this.settings.SOCIAL_META_FIELDS = current.join(',');
    },

    async generateSocialMeta(context, module) {
      this.socialMetaLoading = true;
      this.socialMetaError = '';
      this.socialMetaResult = null;
      try {
        const fields = (this.settings.SOCIAL_META_FIELDS || 'title,description,tags').split(',').filter(Boolean);
        const r = await fetch('/api/social-meta/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            module: module || 'yt_video',
            context: context || {},
            fields,
            master_prompt: this.settings.SOCIAL_META_MASTER_PROMPT || '',
            lang: this.lang,
          }),
        });
        if (!r.ok) { const e = await r.json(); throw new Error(e.detail || 'Hata'); }
        this.socialMetaResult = await r.json();
      } catch(e) {
        this.socialMetaError = e.message || 'Sosyal medya meta üretilemedi';
      } finally {
        this.socialMetaLoading = false;
      }
    },

    copySocialMeta() {
      if (!this.socialMetaResult) return;
      const r = this.socialMetaResult;
      let text = '';
      if (r.title) text += `📌 BAŞLIK:\n${r.title}\n\n`;
      if (r.description) text += `📝 AÇIKLAMA:\n${r.description}\n\n`;
      if (r.tags && r.tags.length) text += `🏷️ ETİKETLER:\n${Array.isArray(r.tags) ? r.tags.join(', ') : r.tags}\n\n`;
      if (r.source) text += `📰 KAYNAK: ${r.source}\n`;
      if (r.link) text += `🔗 LİNK: ${r.link}\n`;
      navigator.clipboard.writeText(text.trim()).then(() => {
        this.socialMetaCopied = true;
        setTimeout(() => this.socialMetaCopied = false, 2000);
      });
    },

    computeSeoScore(result) {
      if (!result) return null;
      let score = 0;
      const checks = [];
      const title = result.title || '';
      if (title.length >= 20 && title.length <= 60) {
        score += 25; checks.push({ label: 'Title uzunluğu', ok: true, msg: title.length+' karakter (ideal: 20-60)' });
      } else {
        checks.push({ label: 'Title uzunluğu', ok: false, msg: title.length+' karakter (ideal: 20-60)' });
      }
      const desc = result.description || '';
      if (desc.length >= 100 && desc.length <= 500) {
        score += 25; checks.push({ label: 'Açıklama uzunluğu', ok: true, msg: desc.length+' karakter (ideal: 100-500)' });
      } else {
        checks.push({ label: 'Açıklama uzunluğu', ok: false, msg: desc.length+' karakter (ideal: 100-500)' });
      }
      const tags = Array.isArray(result.tags) ? result.tags : (result.tags||'').split(',').filter(Boolean);
      if (tags.length >= 10 && tags.length <= 20) {
        score += 25; checks.push({ label: 'Etiket sayısı', ok: true, msg: tags.length+' etiket (ideal: 10-20)' });
      } else {
        checks.push({ label: 'Etiket sayısı', ok: false, msg: tags.length+' etiket (ideal: 10-20)' });
      }
      const titleWords = title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const descLower = desc.toLowerCase();
      const matchCount = titleWords.filter(w => descLower.includes(w)).length;
      const pct = titleWords.length > 0 ? Math.round(matchCount/titleWords.length*100) : 0;
      if (titleWords.length > 0 && pct >= 50) {
        score += 25; checks.push({ label: 'Anahtar kelime uyumu', ok: true, msg: '%'+pct+' örtüşme' });
      } else {
        checks.push({ label: 'Anahtar kelime uyumu', ok: false, msg: '%'+pct+' örtüşme (ideal: ≥50%)' });
      }
      const color = score >= 75 ? 'emerald' : score >= 50 ? 'amber' : 'red';
      return { score, checks, color };
    },

    async testApiKey(provider, keyTests, e) {
      e?.stopPropagation();
      // First save current settings so server reads the latest key values
      await this.apiFetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: this.settings }),
      });
      keyTests[provider] = 'loading';
      keyTests[provider + '_msg'] = '';
      try {
        const data = await this.apiFetch(`/api/test-key/${provider}`, { method: 'POST' });
        keyTests[provider] = data.status === 'ok' ? 'success' : 'error';
        keyTests[provider + '_msg'] = data.message || '';
      } catch (e) {
        keyTests[provider] = 'error';
        keyTests[provider + '_msg'] = e.message;
      }
    },

    async testWebhook() {
      const url = this.settings.WEBHOOK_URL;
      if (!url) { this.showNotification && this.showNotification('Webhook URL girilmedi', 'error'); return; }
      try {
        const data = await this.apiFetch('/api/webhook/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
        this.showNotification && this.showNotification(data.message || 'Webhook gönderildi', 'success');
      } catch(e) {
        this.showNotification && this.showNotification('Webhook hatası: ' + e.message, 'error');
      }
    },

    async sessionAction(action, sid, e) {
      e.stopPropagation();
      try {
        await fetch(`/api/sessions/${sid}/${action}`, { method: 'POST' });
        await this.loadSessions();
      } catch(err) { console.error(err); }
    },

    async deleteSession(sid, e) {
      e.stopPropagation();
      if (!window.confirm(this.t('confirm_delete_msg'))) return;
      await fetch(`/api/sessions/${sid}`, { method: 'DELETE' });
      if (this.currentSession?.id === sid) this.closeSession();
      await this.loadSessions();
    },

    statusBadge(status) {
      return {
        queued:'text-yellow-400 bg-yellow-400/10 border-yellow-500/30',
        running:'text-blue-400 bg-blue-400/10 border-blue-500/30',
        completed:'text-green-400 bg-green-400/10 border-green-500/30',
        failed:'text-red-400 bg-red-400/10 border-red-500/30',
        stopped:'text-orange-400 bg-orange-400/10 border-orange-500/30',
        paused:'text-purple-400 bg-purple-400/10 border-purple-500/30',
      }[status] || 'text-slate-400 bg-slate-800 border-slate-700';
    },

    stepCircle(status) {
      return { pending:'border-slate-700 text-slate-600 bg-slate-900', running:'border-blue-500 text-blue-400 bg-blue-500/10 shadow-sm shadow-blue-500/30', completed:'border-green-500 text-green-400 bg-green-500/10', failed:'border-red-500 text-red-400 bg-red-500/10' }[status] || 'border-slate-700 text-slate-600 bg-slate-900';
    },

    formatDate(iso) {
      if (!iso) return '—';
      const d = new Date(iso);
      return d.toLocaleDateString(this.lang === 'tr' ? 'tr-TR' : 'en-US', { month:'short', day:'numeric' }) + ' ' + d.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
    },

    // ── Bulletin methods ──────────────────────────────────────────────────
    async loadBulletinSources() {
      try {
        const r = await fetch('/api/bulletin/sources');
        const data = await r.json();
        this.bulletinSources = Array.isArray(data) ? data : [];
      } catch(e) { this.bulletinSources = []; }
    },

    async loadBulletinHistory() {
      try {
        const r = await fetch('/api/bulletin/history');
        if (r.ok) this.bulletinHistory = await r.json();
      } catch(e) { console.warn('[bulletin] history load error:', e); }
    },

    async clearBulletinHistory() {
      if (!this.bulletinActivePreset) return;
      await fetch(`/api/bulletin/history/${encodeURIComponent(this.bulletinActivePreset)}`, { method: 'DELETE' });
      await this.loadBulletinHistory();
    },

    uniqueCategories() {
      return [...new Set((this.bulletinSources || []).map(s => s.category))].filter(Boolean);
    },

    async addBulletinSource() {
      if (!this.newSrc.name.trim() || !this.newSrc.url.trim()) return;
      await fetch('/api/bulletin/sources', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ ...this.newSrc }),
      });
      this.newSrc = { name: '', url: '', category: 'Genel', language: 'tr' };
      await this.loadBulletinSources();
    },

    async toggleBulletinSource(src) {
      await fetch(`/api/bulletin/sources/${src.id}`, {
        method: 'PATCH', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ enabled: !src.enabled }),
      });
      await this.loadBulletinSources();
    },

    async deleteBulletinSource(srcId) {
      if (!window.confirm(this.t('confirm_delete_msg'))) return;
      await fetch(`/api/bulletin/sources/${srcId}`, { method: 'DELETE' });
      await this.loadBulletinSources();
    },

    async toggleAllBulletinSources() {
      const filtered = this.filteredBulletinSources();
      const allEnabled = filtered.every(s => s.enabled);
      const newState = !allEnabled;
      for (const s of filtered) {
        if (s.enabled !== newState) {
          await fetch(`/api/bulletin/sources/${s.id}`, {
            method: 'PATCH', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ enabled: newState }),
          });
        }
      }
      await this.loadBulletinSources();
    },

    async fetchDraft() {
      this.draftLoading = true;
      this.draftError = '';
      this.draftData = null;
      this.openDraftCats = {};
      try {
        const r = await fetch('/api/bulletin/draft', {
          method: 'POST', headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            max_items_per_source: parseInt(this.draftMaxItems),
            language_override: this.draftLangOverride,
            source_ids: this.bulletinSelectAllSources ? null : (this.bulletinSelectedSources.length ? this.bulletinSelectedSources : null),
            preset_name: this.bulletinActivePreset,
          }),
        });
        if (!r.ok) { this.draftError = (await r.json()).detail || 'Failed'; return; }
        this.draftData = await r.json();
        // Open all categories by default
        for (const cat of Object.keys(this.draftData.categories)) {
          this.openDraftCats[cat] = true;
        }
      } catch(e) { this.draftError = e.message; }
      finally { this.draftLoading = false; }
    },

    toggleDraftCat(cat) {
      this.openDraftCats[cat] = !this.openDraftCats[cat];
    },

    selectedDraftCount() {
      if (!this.draftData) return 0;
      return Object.values(this.draftData.categories).flat().filter(i => i.selected).length;
    },

    getSelectedItems() {
      if (!this.draftData) return [];
      return Object.values(this.draftData.categories).flat().filter(i => i.selected);
    },

    getAutoStyle(cat) {
      const map = {
        'spor':'sport','sport':'sport',
        'finans':'finance','finance':'finance','ekonomi':'finance','borsa':'finance',
        'teknoloji':'tech','tech':'tech','dijital':'tech',
        'bilim':'science','science':'science','sağlık':'science','health':'science',
        'hava':'weather','weather':'weather','hava durumu':'weather',
        'eğlence':'entertainment','entertainment':'entertainment','magazin':'entertainment',
        'gündem':'breaking','breaking':'breaking','son dakika':'breaking',
        'dünya':'corporate','corporate':'corporate','politika':'corporate','siyaset':'corporate',
      };
      return map[(cat||'').toLowerCase().trim()] || 'breaking';
    },

    getSelectedCategories() {
      return [...new Set(this.getSelectedItems().map(i => i.category))].filter(Boolean);
    },

    initRenderStyles() {
      const cats = this.getSelectedCategories();
      cats.forEach(cat => {
        if (!this.bulletinCategoryStyles[cat]) {
          this.bulletinCategoryStyles[cat] = this.getAutoStyle(cat);
        }
      });
      this.getSelectedItems().forEach(item => {
        const key = item.url || item.id || item.title;
        if (key && !this.bulletinItemStyles[key]) {
          this.bulletinItemStyles[key] = this.getAutoStyle(item.category);
        }
      });
    },

    selectAllDraft(val) {
      if (!this.draftData) return;
      for (const items of Object.values(this.draftData.categories)) {
        for (const item of items) item.selected = val;
      }
    },

    async startBulletinRender() {
      const items = this.getSelectedItems();
      if (items.length === 0) return;
      this.bulletinRendering = true;
      this.bulletinJobId = null;
      this.bulletinJobStatus = '';
      this.bulletinJobError = '';
      try {
        const r = await fetch('/api/bulletin/render', {
          method: 'POST', headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            items,
            network_name: this.bulletinRenderCfg.network_name,
            style: this.bulletinRenderCfg.style,
            fps: parseInt(this.bulletinRenderCfg.fps),
            format: this.bulletinRenderCfg.format,
            preset_name: this.bulletinActivePreset,
            category_templates: this.categoryTemplates,
            render_mode: this.bulletinRenderMode,
            lang: this.bulletinRenderCfg.lang,
            show_category_flash: this.bulletinShowCategoryFlash,
            show_item_intro: this.bulletinShowItemIntro,
            text_delivery_mode: this.bulletinTextMode,
            category_styles: this.bulletinOverrideStyles ? this.bulletinCategoryStyles : {},
            item_styles: this.bulletinOverrideStyles ? this.bulletinItemStyles : {},
            // Design settings
            lower_third_enabled: this.settings.BULLETIN_LOWER_THIRD_ENABLED === 'true',
            lower_third_text: this.settings.BULLETIN_LOWER_THIRD_TEXT,
            lower_third_font: this.settings.BULLETIN_LOWER_THIRD_FONT,
            lower_third_color: this.settings.BULLETIN_LOWER_THIRD_COLOR,
            lower_third_size: parseInt(this.settings.BULLETIN_LOWER_THIRD_SIZE || '32'),
            ticker_enabled: this.settings.BULLETIN_TICKER_ENABLED === 'true',
            ticker_speed: parseInt(this.settings.BULLETIN_TICKER_SPEED || '3'),
            ticker_bg: this.settings.BULLETIN_TICKER_BG,
            ticker_color: this.settings.BULLETIN_TICKER_COLOR,
            show_live: this.settings.BULLETIN_SHOW_LIVE_INDICATOR === 'true',
            show_source: this.settings.BULLETIN_SHOW_SOURCE === 'true',
            show_date: this.settings.BULLETIN_SHOW_DATE === 'true',
          }),
        });
        if (!r.ok) { this.bulletinRendering = false; return; }
        const { bulletin_id } = await r.json();
        this.bulletinJobId = bulletin_id;
        this.bulletinJobStatus = 'running';
        this.bulletinProgress = 0;
        this.bulletinStepLabel = 'Başlatılıyor...';
        this.bulletinElapsed = 0;
        this.bulletinEta = null;
        this.bulletinCategoryOutputs = {};
        // Eski polling'i temizle (race condition önleme)
        if (this._bulletinPoll) { clearInterval(this._bulletinPoll); this._bulletinPoll = null; }
        // Poll for status every 2s
        this._bulletinPoll = setInterval(async () => {
          try {
            const sr = await fetch(`/api/bulletin/render/${bulletin_id}`);
            const job = await sr.json();
            this.bulletinJobStatus = job.status;
            this.bulletinJobError = job.error || '';
            this.bulletinProgress = job.progress || 0;
            this.bulletinStepLabel = job.step_label || '';
            this.bulletinElapsed = job.elapsed || 0;
            this.bulletinEta = job.eta ?? null;
            this.bulletinPaused = job.paused || false;
            if (job.outputs) this.bulletinCategoryOutputs = job.outputs;
            if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
              clearInterval(this._bulletinPoll);
              this.bulletinRendering = false;
              this.bulletinPaused = false;
              if (job.status === 'completed') {
                this.bulletinProgress = 100;
                this.playSound('success');
              } else if (job.status === 'failed') {
                this.playSound('error');
              }
            }
          } catch(e) { console.warn('[bulletin] render poll error:', e); }
        }, 2000);
      } catch(e) { console.error('[bulletin] render start error:', e); this.bulletinRendering = false; }
    },

    async stopBulletinRender() {
      if (!this.bulletinJobId) return;
      await fetch(`/api/bulletin/render/${this.bulletinJobId}/stop`, { method: 'POST' });
    },

    async pauseBulletinRender() {
      if (!this.bulletinJobId) return;
      await fetch(`/api/bulletin/render/${this.bulletinJobId}/pause`, { method: 'POST' });
      this.bulletinPaused = true;
    },

    async resumeBulletinRender() {
      if (!this.bulletinJobId) return;
      await fetch(`/api/bulletin/render/${this.bulletinJobId}/resume`, { method: 'POST' });
      this.bulletinPaused = false;
    },

    // ── Product Review ────────────────────────────────────────────────
    async prAutoFill() {
      if (!this.prAutoUrl.trim()) return;
      this.prAutoLoading = true;
      this.prAutoError = '';
      this.prAutoSuccess = false;
      try {
        const r = await fetch('/api/product-review/autofill', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ 
            url: this.prAutoUrl.trim(), 
            lang: this.lang, 
            master_prompt: this.prompts.product_review_autofill || '' 
          }),
        });
        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          this.prAutoError = err.detail || 'Hata oluştu';
        } else {
          const data = await r.json();
          // Merge all fields into prForm
          const fields = ['name','price','originalPrice','currency','rating','reviewCount','imageUrl','category','platform','score','verdict','ctaText'];
          for (const f of fields) { if (data[f] !== undefined) this.prForm[f] = data[f]; }
          if (Array.isArray(data.galleryUrls) && data.galleryUrls.length) this.prForm.galleryUrls = data.galleryUrls;
          if (Array.isArray(data.pros) && data.pros.length) this.prForm.pros = data.pros;
          if (Array.isArray(data.cons) && data.cons.length) this.prForm.cons = data.cons;
          if (Array.isArray(data.topComments) && data.topComments.length) this.prForm.topComments = data.topComments;
          this.prAutoSuccess = true;
          // Open manual panel so user can review the filled form
          this.prManualOpen = true;
        }
      } catch(e) { this.prAutoError = String(e); }
      this.prAutoLoading = false;
    },

    async prGenerateTTS() {
      if (!this.prForm.name) return;
      this.prTtsLoading = true;
      this.prTtsError = '';
      this.prTtsAudioUrl = '';
      this.prTtsNarration = '';
      try {
        const r = await fetch('/api/product-review/tts', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ product: this.prForm, lang: this.lang }),
        });
        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          this.prTtsError = err.detail || 'TTS hatası';
        } else {
          const data = await r.json();
          this.prTtsAudioUrl = data.audioUrl || '';
          this.prTtsNarration = data.narration || '';
          // Store audioUrl in product form so render can use it
          this.prForm.audioUrl = data.audioUrl || '';
        }
      } catch(e) { this.prTtsError = String(e); }
      this.prTtsLoading = false;
    },

    async startProductReviewRender() {
      if (!this.prForm.name) return;
      this.prRendering = true;
      this.prJobId = null;
      this.prJobStatus = '';
      this.prJobError = '';
      this.prProgress = 0;
      this.prStepLabel = '';
      try {
        const product = {
          name: this.prForm.name,
          price: this.prForm.price || 0,
          originalPrice: this.prForm.originalPrice || undefined,
          currency: this.prForm.currency || 'TL',
          rating: this.prForm.rating || 4.0,
          reviewCount: this.prForm.reviewCount || 0,
          imageUrl: this.prForm.imageUrl || undefined,
          galleryUrls: (this.prForm.galleryUrls || []).filter(u => u.trim()),
          category: this.prForm.category || undefined,
          platform: this.prForm.platform || undefined,
          pros: this.prForm.pros.filter(p => p.trim()),
          cons: this.prForm.cons.filter(c => c.trim()),
          score: this.prForm.score || 7,
          verdict: this.prForm.verdict || '',
          ctaText: this.prForm.ctaText || undefined,
          topComments: this.prForm.topComments.filter(c => c.trim()),
          audioUrl: this.prForm.audioUrl || undefined,
        };
        const r = await fetch('/api/product-review/render', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            product,
            style: this.prRenderCfg.style,
            format: this.prRenderCfg.format,
            fps: parseInt(this.prRenderCfg.fps),
            channel_name: this.prRenderCfg.channelName,
            auto_generate_tts: this.prAutoGenerateTTS,
            lang: this.lang,
          }),
        });
        if (!r.ok) { this.prRendering = false; return; }
        const { id } = await r.json();
        this.prJobId = id;
        this.prJobStatus = 'running';
        // Eski polling'i temizle (race condition önleme)
        if (this._prPoll) { clearInterval(this._prPoll); this._prPoll = null; }
        this._prPoll = setInterval(async () => {
          try {
            const sr = await fetch(`/api/product-review/status/${id}`);
            const job = await sr.json();
            this.prJobStatus = job.status;
            this.prJobError = job.error || '';
            this.prProgress = job.progress || 0;
            this.prStepLabel = job.step_label || '';
            if (job.status === 'completed' || job.status === 'failed') {
              clearInterval(this._prPoll);
              this.prRendering = false;
              if (job.status === 'completed') {
                this.prProgress = 100;
                this.playSound('success');
              } else {
                this.playSound('error');
              }
            }
          } catch(e) { console.warn('[pr] render poll error:', e); }
        }, 2000);
      } catch(e) { console.error('[pr] render start error:', e); this.prRendering = false; }
    },

    async cleanupSystem() {
      if (!confirm(this.t('cleanup_confirm_msg'))) return;
      try {
        const data = await this.apiFetch('/api/system/cleanup', { method: 'POST' });
        if (data.status === 'success') {
          alert(this.t('cleanup_success'));
        }
      } catch (e) {
        console.error('Cleanup error:', e);
      }
    },
  };
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
