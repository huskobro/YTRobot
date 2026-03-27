// ── Bulletin Module Mixin ────────────────────────────────────────────────────
// Returns state + methods for the News Bulletin view.
// Loaded via <script> tag; defines a global function.
function bulletinMixin() {
  return {
    // ── State ──
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
    bulletinVoicesList: [], bulletinVoicesLoading: false, bulletinVoicesFetchError: '',
    bulletinPresets: [],
    bulletinPresetName: '',
    bulletinPresetSaved: false,
    bulletinSelectedSources: [],
    bulletinSelectAllSources: false,
    bulletinSourceFilterCat: 'All',
    bulletinSourceFilterPreset: 'All',
    categoryTemplates: {},
    bulletinHistory: {},
    bulletinActivePreset: '',
    bulletinSearch: '',
    bulletinCatFilter: '',
    bulletinPresetFilter: '',

    // ── Methods ──

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
      if (!confirm(this.t('confirm_delete') || 'Are you sure?')) return;
      this.bulletinPresets = this.bulletinPresets.filter(p => p.name !== name);
      localStorage.setItem('ytrobot-bulletin-presets', JSON.stringify(this.bulletinPresets));
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

    async loadBulletinSources() {
      try {
        const data = await this.apiFetch('/api/bulletin/sources');
        this.bulletinSources = Array.isArray(data) ? data : [];
      } catch(e) { this.bulletinSources = []; }
    },

    async loadBulletinHistory() {
      try {
        this.bulletinHistory = await this.apiFetch('/api/bulletin/history');
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
  };
}
