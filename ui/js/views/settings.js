// ── Settings Module Mixin ────────────────────────────────────────────────────
// Returns state + methods for the Settings view (TTS, Visuals, AI, System, Secure, Social).
// Loaded via <script> tag; defines a global function.
function settingsMixin() {
  return {
    // ── State ──
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
      SUBTITLE_PROVIDER: 'remotion', PYCAPS_STYLE: 'hype',
      SPESHAUDIO_LANGUAGE: '', SPESHAUDIO_STABILITY: 0.3, SPESHAUDIO_SIMILARITY_BOOST: 0.5, SPESHAUDIO_STYLE: 0.75,
      QWEN3_SPEAKER: 'Vivian',
      ZIMAGE_ASPECT_RATIO: '16:9'
    },
    settingsModule: 'tts',
    settingsSaved: false,
    settingsChanged: false,
    autoSaveTimeout: null,
    autoSaveEnabled: true,
    settingsSearch: '',
    settingsSearchResults: [],
    prompts: {}, promptDefaults: {},
    promptsSaved: false,
    voicesList: [], voicesLoading: false, voicesFetchError: '', voicesProvider: '',
    presets: [], presetName: '', presetSaved: false, selectedPreset: '',
    categoryPromptOpen: '',
    webhookTesting: false,
    showSaveModal: false,
    secureKeys: [],
    newSecureKey: '',
    newSecureValue: '',
    notifications: [],
    unreadCount: 0,
    notifOpen: false,
    _notifPoll: null,

    // ── Methods ──

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
      }, 2000);
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
      if (!confirm(this.t('confirm_delete') || 'Are you sure?')) return;
      await fetch(`/api/presets/${encodeURIComponent(name)}`, { method: 'DELETE' });
      if (this.selectedPreset === name) this.selectedPreset = '';
      await this.loadPresets();
    },

    async searchSettings() {
      if (!this.settingsSearch) { this.settingsSearchResults = []; return; }
      clearTimeout(this._searchTimeout);
      this._searchTimeout = setTimeout(async () => {
        try {
          const resp = await fetch(`/api/settings/search?q=${encodeURIComponent(this.settingsSearch)}`);
          if (resp.ok) { const d = await resp.json(); this.settingsSearchResults = d.results || []; }
        } catch(e) { console.warn('[searchSettings]', e); }
      }, 300);
    },

    // ── Secure Storage Methods ──

    async loadSecureKeys() {
      try {
        const data = await this.apiFetch('/api/secure/keys');
        const keys = data.keys || [];
        // Fetch masked values for each key
        const detailed = await Promise.allSettled(
          keys.map(k => this.apiFetch(`/api/secure/retrieve/${k}`))
        );
        this.secureKeys = keys.map((k, i) => ({
          key: k,
          masked_value: detailed[i].status === 'fulfilled' ? detailed[i].value.masked_value : '****'
        }));
      } catch(e) { console.warn('[secureKeys]', e); this.secureKeys = []; }
    },

    async storeSecureKey() {
      if (!this.newSecureKey || !this.newSecureValue) return;
      try {
        await this.apiFetch('/api/secure/store', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: this.newSecureKey, value: this.newSecureValue })
        });
        this.newSecureKey = '';
        this.newSecureValue = '';
        this.showSuccess('Key stored successfully');
        await this.loadSecureKeys();
      } catch(e) { console.warn('[storeSecureKey]', e); }
    },

    async deleteSecureKey(key) {
      try {
        await fetch(`/api/secure/${key}`, { method: 'DELETE' });
        this.secureKeys = this.secureKeys.filter(sk => sk.key !== key);
        this.showSuccess('Key deleted');
      } catch(e) { console.warn('[deleteSecureKey]', e); }
    },

    // ── Notification Methods ──

    async loadNotifications() {
      try {
        const json = await this.apiFetch('/api/notifications/?limit=20');
        this.notifications = json.notifications || [];
        this.unreadCount = json.unread_count || 0;
      } catch(e) { /* silent — notifications are non-critical */ }
    },

    async markNotifRead(notifId) {
      try {
        await fetch(`/api/notifications/${notifId}/read`, { method: 'POST' });
        const n = this.notifications.find(n => n.id === notifId);
        if (n) { n.read = true; this.unreadCount = Math.max(0, this.unreadCount - 1); }
      } catch(e) { console.warn('[markNotifRead]', e); }
    },

    async markAllRead() {
      try {
        await fetch('/api/notifications/read-all', { method: 'POST' });
        this.notifications.forEach(n => n.read = true);
        this.unreadCount = 0;
      } catch(e) { console.warn('[markAllRead]', e); }
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
      if (!url) { this.showToast && this.showToast(this.t('webhook_no_url') || 'Webhook URL not set', 'error'); return; }
      this.webhookTesting = true;
      try {
        const data = await this.apiFetch('/api/webhook/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
        this.showToast && this.showToast(data.message || this.t('webhook_sent') || 'Webhook sent', 'success');
      } catch(e) {
        this.showToast && this.showToast((this.t('webhook_error') || 'Webhook error') + ': ' + e.message, 'error');
      } finally {
        this.webhookTesting = false;
      }
    },

    async testNotifChannel(channel) {
      try {
        const data = await this.apiFetch('/api/webhook/test-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channel }),
        });
        const label = {telegram: 'Telegram', email: 'E-posta', whatsapp: 'WhatsApp'}[channel] || channel;
        this.showToast && this.showToast(
          data.ok ? `${label} bildirimi gönderildi!` : `${label} hatası — ayarları kontrol edin`,
          data.ok ? 'success' : 'error'
        );
      } catch(e) {
        this.showToast && this.showToast(`Bildirim testi hatası: ${e.message}`, 'error');
      }
    },

    async cleanupSystem() {
      if (!confirm(this.t('cleanup_confirm_msg'))) return;
      try {
        const data = await this.apiFetch('/api/system/cleanup', { method: 'POST' });
        if (data.status === 'success') {
          this.showToast(this.t('cleanup_success'), 'success');
        }
      } catch (e) {
        console.error('Cleanup error:', e);
      }
    },
  };
}
