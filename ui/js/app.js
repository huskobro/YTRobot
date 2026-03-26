// ── App ──────────────────────────────────────────────────────────────────────
function app() {
  return {
    lang: localStorage.getItem('ytrobot-lang') || 'en',
    view: 'dashboard', mode: 'topic',
    videoModule: 'normal',
    sessions: [], currentSession: null, 
    settings: {
      PR_TTS_STABILITY: 0.3, PR_TTS_SIMILARITY: 0.5, PR_TTS_STYLE: 0.75,
      BULLETIN_LOWER_THIRD_ENABLED: 'true', BULLETIN_TICKER_ENABLED: 'true'
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
    bulletinShowCategoryFlash: false,
    bulletinShowItemIntro: false,
    bulletinTextMode: 'per_scene',
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
    },
    prRenderCfg: { style: 'modern', format: '16:9', channelName: 'YTRobot İnceleme', fps: '60' },
    prRendering: false, prJobId: null, prJobStatus: '', prJobError: '',
    prProgress: 0, prStepLabel: '', _prPoll: null,
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
    wizardStep: 1,
    wizardMaxSteps: 3,

    t(key) { return LANG[this.lang]?.[key] ?? LANG.en[key] ?? key; },
    setLang(l) { this.lang = l; localStorage.setItem('ytrobot-lang', l); },

    // Wizard Navigation
    nextStep() {
      if (this.wizardStep < this.wizardMaxSteps) {
        this.wizardStep++;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    prevStep() {
      if (this.wizardStep > 1) {
        this.wizardStep--;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    initWizard(module) {
      this.videoModule = module;
      this.wizardStep = 1;
      // Define max steps per module
      if (module === 'normal') this.wizardMaxSteps = 3;
      else if (module === 'bulletin') this.wizardMaxSteps = 3;
      else if (module === 'product_review') this.wizardMaxSteps = 3;
    },

    showError(msg) {
      this.globalError = msg;
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

    async init() {
      await this.loadSettings();
      await this.loadPrompts();
      await this.loadBulletinSources();
      await this.loadSessions();
      await this.loadPresets();
      this.loadBulletinPresets();
      this.loadBulletinHistory();
      this._timer = setInterval(() => this.loadSessions(), 3000);
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
        this.sessions = await this.apiFetch('/api/sessions');
        if (this.currentSession) {
          const u = this.sessions.find(s => s.id === this.currentSession.id);
          if (u) this.currentSession = u;
        }
      } catch(e) {}
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
      await this.apiFetch('/api/prompts', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ prompts: this.prompts }) });
      this.promptsSaved = true; setTimeout(() => this.promptsSaved = false, 3000);
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
      } catch(e) {}
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
      } catch(e) {}
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
              if (job.status === 'completed') this.bulletinProgress = 100;
            }
          } catch(e) {}
        }, 2000);
      } catch(e) { this.bulletinRendering = false; }
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
              if (job.status === 'completed') this.prProgress = 100;
            }
          } catch(e) {}
        }, 2000);
      } catch(e) { this.prRendering = false; }
    },
  };
}
