// ── Onboarding Module Mixin ──────────────────────────────────────────────────
// Returns state + methods for the onboarding/setup wizard.
// Loaded via <script> tag; defines a global function.
function onboardingMixin() {
  return {
    // ── State ──
    onboardingStep: 1,
    onboardingMode: 'user',
    onboardingChannelId: '',
    onboardingAudioPlaying: '',
    _onboardingAudio: null,
    ttsPreviewLoading: false,
    ttsPreviewPlaying: false,
    wizardStepOrder: [],
    onboardingData: {
      // Step 2: Channel
      channelName: '', channelLang: 'tr',
      colorPrimary: '#6366f1', colorSecondary: '#ffffff',
      // Step 3-4: TTS Provider & Voice
      ttsProvider: 'edge', ttsApiKey: '', ttsKeyStatus: '',
      selectedVoice: 'tr-TR-AhmetNeural', ttsSpeed: 1.0,
      // Step 5: Visual Provider
      visualProvider: 'pexels', visualApiKey: '',
      // Step 6: Video Style basics
      resolution: '1920x1080', subtitleAnim: 'hype',
      videoEffect: 'none', subtitleFont: 'bebas', composer: 'remotion',
      // Step 7: TTS Advanced
      ttsRemoveApostrophes: true, ttsTrimSilence: false,
      ttsEnhanceWithLlm: false, ttsConcurrentWorkers: 1,
      // SpeshAudio params
      speshLanguage: '', speshStability: 0.3, speshSimilarity: 0.5, speshStyle: 0.75,
      speshVoiceId: '',
      // ElevenLabs params
      elevenlabsVoiceId: '21m00Tcm4TlvDq8ikWAM',
      // OpenAI TTS params
      openaiTtsVoice: 'onyx',
      // DubVoice params
      dubvoiceVoiceId: '',
      // Qwen3 advanced
      qwen3ModelId: 'Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice',
      qwen3ModelType: 'custom', qwen3VoiceInstruct: '', qwen3RefAudio: '', qwen3Device: 'auto',
      // Step 8: Subtitle Details & Camera
      subtitleSize: 68, subtitleColor: '#ffffff', subtitleBg: 'none',
      subtitleStroke: 2, karaokeEnabled: true, karaokeColor: '#FFD700',
      transitionDuration: 10, kenBurnsZoom: 0.08, kenBurnsDirection: 'center',
      // Step 9: Script/AI & System
      targetAudience: '', scriptHumanize: false,
      videoFps: 30, gpuEncoding: 'auto', subtitleProvider: 'ffmpeg', pycapsStyle: 'hype',
      remotionConcurrency: 4,
      // Step 10: API Keys
      openaiApiKey: '', anthropicApiKey: '', kieaiApiKey: '', geminiApiKey: '',
      youtubeApiKey: '', pixabayApiKey: '',
      // Step 11: YouTube & Publishing
      ytOauthClientId: '', ytOauthClientSecret: '',
      autopublishYoutube: false, ytPrivacyStatus: 'private', ytCategoryId: '22',
      autopublishReels: false, shareOnInstagram: false, shareOnTiktok: false,
      // Step 12: Notifications
      webhookEnabled: false, webhookUrl: '', webhookOnComplete: true, webhookOnFailure: true,
      webhookMention: '', webhookSecret: '',
      telegramEnabled: false, telegramBotToken: '', telegramChatId: '',
      emailEnabled: false, emailSmtpHost: 'smtp.gmail.com', emailSmtpPort: 587,
      emailSmtpUser: '', emailSmtpPassword: '', emailFrom: '', emailTo: '',
      whatsappEnabled: false, whatsappApiUrl: '', whatsappApiToken: '', whatsappTo: '',
      // Step 13: Social Meta
      socialMetaEnabledYt: false, socialMetaEnabledBulletin: false, socialMetaEnabledPr: false,
      socialMetaFields: 'title,description,tags', socialMetaMasterPrompt: '', socialMetaLanguage: '',
      // Step 14: Module TTS Overrides
      ytTtsProvider: '', ytTtsSpeed: 0.0, ytTtsVoiceId: '',
      bulletinTtsProvider: '', bulletinTtsSpeed: 0.0, bulletinTtsVoiceId: '',
      prTtsProvider: '', prTtsSpeed: 0.0, prTtsVoiceId: '',
      // Step 15: Bulletin & PR Module Settings
      bulletinNetworkName: 'YTRobot Haber', bulletinStyle: 'breaking',
      bulletinFormat: '16:9', bulletinFps: 60, bulletinMaxItems: 3,
      bulletinDefaultLanguage: '',
      prStyle: 'modern', prFormat: '16:9', prFps: 60,
      prChannelName: 'YTRobot İnceleme', prCurrency: 'TL', prCtaText: 'Linke tıkla!',
      prAutoGenerateTts: true, prMasterPrompt: '', prAiLanguage: '',
      // Aspect ratio for visuals
      zimageAspectRatio: '16:9',
      // CORS & Debug
      corsOrigins: '*', debugMode: false,
    },
    onboardingEdgeVoices: [
      { id: 'tr-TR-AhmetNeural', name: 'Ahmet (TR)', gender: 'male', sample: '/samples/audio/edge_tr_ahmet.mp3' },
      { id: 'tr-TR-EmelNeural', name: 'Emel (TR)', gender: 'female', sample: '/samples/audio/edge_tr_emel.mp3' },
      { id: 'en-US-GuyNeural', name: 'Guy (EN-US)', gender: 'male', sample: '/samples/audio/edge_en_guy.mp3' },
      { id: 'en-US-JennyNeural', name: 'Jenny (EN-US)', gender: 'female', sample: '/samples/audio/edge_en_jenny.mp3' },
      { id: 'en-GB-RyanNeural', name: 'Ryan (EN-GB)', gender: 'male', sample: '/samples/audio/edge_en_ryan.mp3' },
      { id: 'de-DE-ConradNeural', name: 'Conrad (DE)', gender: 'male', sample: '/samples/audio/edge_de_conrad.mp3' },
      { id: 'fr-FR-HenriNeural', name: 'Henri (FR)', gender: 'male', sample: '/samples/audio/edge_fr_henri.mp3' },
      { id: 'es-ES-AlvaroNeural', name: 'Alvaro (ES)', gender: 'male', sample: '/samples/audio/edge_es_alvaro.mp3' },
      { id: 'ja-JP-KeitaNeural', name: 'Keita (JA)', gender: 'male', sample: '/samples/audio/edge_ja_keita.mp3' },
      { id: 'ar-SA-HamedNeural', name: 'Hamed (AR)', gender: 'male', sample: '/samples/audio/edge_ar_hamed.mp3' },
    ],
    onboardingQwen3Voices: [
      { id: 'Vivian', name: 'Vivian', icon: '👩', desc: 'Young, energetic female' },
      { id: 'Serena', name: 'Serena', icon: '👩', desc: 'Calm, mature female' },
      { id: 'Uncle_Fu', name: 'Uncle Fu', icon: '👴', desc: 'Wise elderly male' },
      { id: 'Dylan', name: 'Dylan', icon: '👨', desc: 'Young male' },
      { id: 'Eric', name: 'Eric', icon: '👨', desc: 'Mid-age male' },
      { id: 'Ryan', name: 'Ryan', icon: '👨', desc: 'Energetic male' },
      { id: 'Aiden', name: 'Aiden', icon: '👦', desc: 'Young boy' },
      { id: 'Ono_Anna', name: 'Ono Anna', icon: '👩', desc: 'Japanese accent female' },
      { id: 'Sohee', name: 'Sohee', icon: '👩', desc: 'Korean accent female' },
    ],

    // ── Methods ──

    playOnboardingSample(url) {
      if (this._onboardingAudio) { this._onboardingAudio.pause(); this._onboardingAudio = null; }
      if (this.onboardingAudioPlaying === url) { this.onboardingAudioPlaying = ''; return; }
      this.onboardingAudioPlaying = url;
      this._onboardingAudio = new Audio(url);
      this._onboardingAudio.play().catch(() => {});
      this._onboardingAudio.onended = () => { this.onboardingAudioPlaying = ''; };
    },

    async testOnboardingKey() {
      const prov = this.onboardingData.ttsProvider;
      const key = this.onboardingData.ttsApiKey;
      if (!key) return;
      try {
        const r = await fetch(`/api/test-key/${prov}`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({api_key: key}) });
        this.onboardingData.ttsKeyStatus = r.ok ? 'ok' : 'fail';
      } catch { this.onboardingData.ttsKeyStatus = 'fail'; }
    },

    getSubtitlePreviewStyle() {
      const d = this.onboardingData;
      const fontMap = {
        bebas: '"Bebas Neue", sans-serif',
        montserrat: 'Montserrat, sans-serif',
        oswald: 'Oswald, sans-serif',
        roboto: 'Roboto, sans-serif',
        inter: 'Inter, sans-serif',
        serif: 'Georgia, serif',
        sans: 'sans-serif'
      };
      return {
        fontFamily: fontMap[d.subtitleFont] || 'sans-serif',
        fontSize: Math.min(d.subtitleSize || 68, 36) + 'px',
        color: d.subtitleColor || '#ffffff',
        textShadow: d.subtitleStroke > 0 ? '0 0 ' + (d.subtitleStroke * 2) + 'px rgba(0,0,0,0.8)' : 'none',
        padding: d.subtitleBg === 'box' ? '4px 12px' : d.subtitleBg === 'pill' ? '4px 16px' : '2px 4px',
        backgroundColor: d.subtitleBg === 'box' ? 'rgba(0,0,0,0.6)' : d.subtitleBg === 'pill' ? 'rgba(0,0,0,0.5)' : 'transparent',
        borderRadius: d.subtitleBg === 'pill' ? '999px' : d.subtitleBg === 'box' ? '6px' : '0',
        letterSpacing: d.subtitleFont === 'bebas' ? '1px' : '0',
        textTransform: d.subtitleFont === 'bebas' ? 'uppercase' : 'none'
      };
    },

    async playTtsPreview() {
      const d = this.onboardingData;
      const text = this.lang === 'tr' ? 'Merhaba, bu bir ses önizlemesidir.' : 'Hello, this is a voice preview sample.';
      this.ttsPreviewLoading = true;
      this.ttsPreviewPlaying = false;
      try {
        const resp = await fetch('/api/tts/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider: d.ttsProvider, voice: d.selectedVoice, text, speed: d.ttsSpeed })
        });
        if (!resp.ok) throw new Error('TTS preview failed');
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const audio = this.$refs.ttsPreviewAudio;
        if (audio) {
          audio.src = url;
          audio.onplay = () => { this.ttsPreviewPlaying = true; };
          audio.onended = () => { this.ttsPreviewPlaying = false; URL.revokeObjectURL(url); };
          audio.onerror = () => { this.ttsPreviewPlaying = false; };
          await audio.play();
        }
      } catch (e) {
        console.warn('TTS preview error:', e);
        this.showToast(this.t('tts_preview_error'), 'error');
      } finally {
        this.ttsPreviewLoading = false;
      }
    },

    async completeOnboarding(nextView) {
      // Save ALL settings to backend
      const d = this.onboardingData;
      const settingsPayload = {
        // TTS core
        TTS_PROVIDER: d.ttsProvider,
        TTS_SPEED: String(d.ttsSpeed),
        TTS_REMOVE_APOSTROPHES: String(d.ttsRemoveApostrophes),
        TTS_TRIM_SILENCE: String(d.ttsTrimSilence),
        TTS_ENHANCE_WITH_LLM: String(d.ttsEnhanceWithLlm),
        TTS_CONCURRENT_WORKERS: String(d.ttsConcurrentWorkers),
        // Visuals
        VISUALS_PROVIDER: d.visualProvider,
        ZIMAGE_ASPECT_RATIO: d.zimageAspectRatio,
        // Video output
        VIDEO_RESOLUTION: d.resolution,
        VIDEO_FPS: String(d.videoFps),
        GPU_ENCODING: d.gpuEncoding,
        // Composer
        COMPOSER_PROVIDER: d.composer,
        REMOTION_CONCURRENCY: String(d.remotionConcurrency),
        // Subtitle/animation
        REMOTION_SUBTITLE_ANIMATION: d.subtitleAnim,
        REMOTION_VIDEO_EFFECT: d.videoEffect,
        REMOTION_SUBTITLE_FONT: d.subtitleFont,
        REMOTION_SUBTITLE_SIZE: String(d.subtitleSize),
        REMOTION_SUBTITLE_COLOR: d.subtitleColor,
        REMOTION_SUBTITLE_BG: d.subtitleBg,
        REMOTION_SUBTITLE_STROKE: String(d.subtitleStroke),
        REMOTION_KARAOKE_ENABLED: String(d.karaokeEnabled),
        REMOTION_KARAOKE_COLOR: d.karaokeColor,
        REMOTION_TRANSITION_DURATION: String(d.transitionDuration),
        REMOTION_KEN_BURNS_ZOOM: String(d.kenBurnsZoom),
        REMOTION_KEN_BURNS_DIRECTION: d.kenBurnsDirection,
        // Subtitle provider
        SUBTITLE_PROVIDER: d.subtitleProvider,
        PYCAPS_STYLE: d.pycapsStyle,
        // Script/AI
        TARGET_AUDIENCE: d.targetAudience,
        SCRIPT_HUMANIZE_WITH_LLM: String(d.scriptHumanize),
        // SpeshAudio params
        SPESHAUDIO_LANGUAGE: d.speshLanguage,
        SPESHAUDIO_VOICE_ID: d.speshVoiceId,
        SPESHAUDIO_STABILITY: String(d.speshStability),
        SPESHAUDIO_SIMILARITY_BOOST: String(d.speshSimilarity),
        SPESHAUDIO_STYLE: String(d.speshStyle),
        // ElevenLabs
        ELEVENLABS_VOICE_ID: d.elevenlabsVoiceId,
        // OpenAI TTS
        OPENAI_TTS_VOICE: d.openaiTtsVoice,
        // DubVoice
        DUBVOICE_VOICE_ID: d.dubvoiceVoiceId,
        // Qwen3 advanced
        QWEN3_MODEL_ID: d.qwen3ModelId,
        QWEN3_MODEL_TYPE: d.qwen3ModelType,
        QWEN3_VOICE_INSTRUCT: d.qwen3VoiceInstruct,
        QWEN3_REF_AUDIO: d.qwen3RefAudio,
        QWEN3_DEVICE: d.qwen3Device,
        // YouTube & Publishing
        YT_OAUTH_CLIENT_ID: d.ytOauthClientId,
        YT_OAUTH_CLIENT_SECRET: d.ytOauthClientSecret,
        AUTOPUBLISH_YOUTUBE: String(d.autopublishYoutube),
        YT_PRIVACY_STATUS: d.ytPrivacyStatus,
        YT_CATEGORY_ID: d.ytCategoryId,
        AUTOPUBLISH_REELS: String(d.autopublishReels),
        SHARE_ON_INSTAGRAM: String(d.shareOnInstagram),
        SHARE_ON_TIKTOK: String(d.shareOnTiktok),
        // Notifications — Webhook
        WEBHOOK_ENABLED: String(d.webhookEnabled),
        WEBHOOK_URL: d.webhookUrl,
        WEBHOOK_ON_COMPLETE: String(d.webhookOnComplete),
        WEBHOOK_ON_FAILURE: String(d.webhookOnFailure),
        WEBHOOK_MENTION: d.webhookMention,
        WEBHOOK_SECRET: d.webhookSecret,
        // Notifications — Telegram
        TELEGRAM_ENABLED: String(d.telegramEnabled),
        TELEGRAM_BOT_TOKEN: d.telegramBotToken,
        TELEGRAM_CHAT_ID: d.telegramChatId,
        // Notifications — Email
        EMAIL_ENABLED: String(d.emailEnabled),
        EMAIL_SMTP_HOST: d.emailSmtpHost,
        EMAIL_SMTP_PORT: String(d.emailSmtpPort),
        EMAIL_SMTP_USER: d.emailSmtpUser,
        EMAIL_SMTP_PASSWORD: d.emailSmtpPassword,
        EMAIL_FROM: d.emailFrom,
        EMAIL_TO: d.emailTo,
        // Notifications — WhatsApp
        WHATSAPP_ENABLED: String(d.whatsappEnabled),
        WHATSAPP_API_URL: d.whatsappApiUrl,
        WHATSAPP_API_TOKEN: d.whatsappApiToken,
        WHATSAPP_TO: d.whatsappTo,
        // Social Meta
        SOCIAL_META_ENABLED_YT_VIDEO: String(d.socialMetaEnabledYt),
        SOCIAL_META_ENABLED_BULLETIN: String(d.socialMetaEnabledBulletin),
        SOCIAL_META_ENABLED_PR: String(d.socialMetaEnabledPr),
        SOCIAL_META_FIELDS: d.socialMetaFields,
        SOCIAL_META_MASTER_PROMPT: d.socialMetaMasterPrompt,
        SOCIAL_META_LANGUAGE: d.socialMetaLanguage,
        // Module TTS overrides — YT
        YT_TTS_PROVIDER: d.ytTtsProvider,
        YT_TTS_SPEED: String(d.ytTtsSpeed),
        YT_TTS_VOICE_ID: d.ytTtsVoiceId,
        // Module TTS overrides — Bulletin
        BULLETIN_TTS_PROVIDER: d.bulletinTtsProvider,
        BULLETIN_TTS_SPEED: String(d.bulletinTtsSpeed),
        BULLETIN_TTS_VOICE_ID: d.bulletinTtsVoiceId,
        // Module TTS overrides — PR
        PR_TTS_PROVIDER: d.prTtsProvider,
        PR_TTS_SPEED: String(d.prTtsSpeed),
        PR_TTS_VOICE_ID: d.prTtsVoiceId,
        // Bulletin module
        BULLETIN_NETWORK_NAME: d.bulletinNetworkName,
        BULLETIN_STYLE: d.bulletinStyle,
        BULLETIN_FORMAT: d.bulletinFormat,
        BULLETIN_FPS: String(d.bulletinFps),
        BULLETIN_DEFAULT_MAX_ITEMS: String(d.bulletinMaxItems),
        BULLETIN_DEFAULT_LANGUAGE: d.bulletinDefaultLanguage,
        // Product Review module
        PR_STYLE: d.prStyle,
        PR_FORMAT: d.prFormat,
        PR_FPS: String(d.prFps),
        PR_CHANNEL_NAME: d.prChannelName,
        PR_CURRENCY: d.prCurrency,
        PR_CTA_TEXT: d.prCtaText,
        PR_AUTO_GENERATE_TTS: String(d.prAutoGenerateTts),
        PR_MASTER_PROMPT: d.prMasterPrompt,
        PR_AI_LANGUAGE: d.prAiLanguage,
        // System
        CORS_ORIGINS: d.corsOrigins,
        DEBUG_MODE: String(d.debugMode),
      };
      // Set voice based on provider
      if (d.ttsProvider === 'edge') settingsPayload.EDGE_TTS_VOICE = d.selectedVoice;
      else if (d.ttsProvider === 'qwen3') settingsPayload.QWEN3_SPEAKER = d.selectedVoice;
      // Set TTS API keys if provided
      if (d.ttsApiKey) {
        if (d.ttsProvider === 'elevenlabs') settingsPayload.ELEVENLABS_API_KEY = d.ttsApiKey;
        else if (d.ttsProvider === 'openai') settingsPayload.OPENAI_API_KEY = d.ttsApiKey;
        else if (d.ttsProvider === 'speshaudio') settingsPayload.SPESHAUDIO_API_KEY = d.ttsApiKey;
        else if (d.ttsProvider === 'dubvoice') settingsPayload.DUBVOICE_API_KEY = d.ttsApiKey;
      }
      // Set visual provider API keys
      if (d.visualApiKey) {
        if (d.visualProvider === 'pexels') settingsPayload.PEXELS_API_KEY = d.visualApiKey;
        else if (d.visualProvider === 'zimage') settingsPayload.KIEAI_API_KEY = d.visualApiKey;
        else if (d.visualProvider === 'dalle') settingsPayload.OPENAI_API_KEY = d.visualApiKey;
      }
      // General API keys (Step 10)
      if (d.openaiApiKey) settingsPayload.OPENAI_API_KEY = d.openaiApiKey;
      if (d.anthropicApiKey) settingsPayload.ANTHROPIC_API_KEY = d.anthropicApiKey;
      if (d.kieaiApiKey) settingsPayload.KIEAI_API_KEY = d.kieaiApiKey;
      if (d.geminiApiKey) settingsPayload.GEMINI_API_KEY = d.geminiApiKey;
      if (d.youtubeApiKey) settingsPayload.YOUTUBE_API_KEY = d.youtubeApiKey;
      if (d.pixabayApiKey) settingsPayload.PIXABAY_API_KEY = d.pixabayApiKey;

      if (this.onboardingMode === 'admin') {
        // Admin mode: save to global .env settings
        try {
          await fetch('/api/settings', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(settingsPayload) });
        } catch(e) { console.warn('Settings save error:', e); }
        this.playSound('click');
        this.view = nextView || 'settings';
        this.loadSettings();
      } else {
        // User/channel mode: always save to global .env first
        try {
          await fetch('/api/settings', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(settingsPayload) });
        } catch(e) { console.warn('Settings save error:', e); }

        if (this.onboardingChannelId) {
          // Existing channel: update channel config + save channel-specific settings
          try {
            await fetch(`/api/channels/${this.onboardingChannelId}`, {
              method: 'PATCH', headers: {'Content-Type':'application/json'},
              body: JSON.stringify({
                name: d.channelName || undefined,
                language: d.channelLang,
                branding: { color_primary: d.colorPrimary, color_secondary: d.colorSecondary, thumbnail_template: 'classic' }
              })
            });
            await fetch(`/api/channels/${this.onboardingChannelId}/settings`, {
              method: 'POST', headers: {'Content-Type':'application/json'},
              body: JSON.stringify(settingsPayload)
            });
            await this.loadChannels();
          } catch(e) { console.warn('Channel update error:', e); }
        } else if (d.channelName) {
          // New channel: create + save channel settings
          try {
            const resp = await fetch('/api/channels', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({
              name: d.channelName, language: d.channelLang,
              branding: { color_primary: d.colorPrimary, color_secondary: d.colorSecondary, thumbnail_template: 'classic' }
            })});
            const newCh = await resp.json();
            if (newCh && newCh.id) {
              await fetch(`/api/channels/${newCh.id}/settings`, {
                method: 'POST', headers: {'Content-Type':'application/json'},
                body: JSON.stringify(settingsPayload)
              });
            }
            await this.loadChannels();
          } catch(e) { console.warn('Channel create error:', e); }
        }

        localStorage.setItem('ytrobot-onboarding-done', '1');
        this.playSound('click');
        this.view = nextView;
        if (nextView === 'new-run') { this.mode = 'topic'; this.runError = ''; }
        if (nextView === 'dashboard') { this.loadSessions(); }
      }
    },

    navigateTo(newView, setupFn) {
      // Guard: confirm before leaving onboarding mid-flow
      if (this.view === 'onboarding' && this.onboardingStep > 1) {
        const msg = this.lang === 'tr'
          ? 'Kurulum tamamlanmadı. Sayfadan çıkmak istediğinize emin misiniz?'
          : 'Setup is not complete. Are you sure you want to leave?';
        if (!confirm(msg)) return;
      }
      this.view = newView;
      if (setupFn) setupFn.call(this);
    },

    resetOnboarding() {
      localStorage.removeItem('ytrobot-onboarding-done');
      this.onboardingStep = 1;
      this.onboardingMode = 'user';
      this.onboardingChannelId = '';
      this.loadWizardStepOrder();
      this.view = 'onboarding';
    },

    async launchAdminWizard() {
      // Launch onboarding wizard in admin mode — pre-fills from current global settings (.env)
      this.onboardingMode = 'admin';
      this.onboardingChannelId = '';
      this.onboardingStep = 1;
      await this.loadWizardStepOrder();
      await this._prefillOnboardingFromGlobalSettings();
      this.view = 'onboarding';
    },

    async launchChannelWizard(channelId) {
      // Launch onboarding wizard for a specific channel — pre-fills from channel settings, falls back to global
      this.onboardingMode = 'user';
      this.onboardingChannelId = channelId || '';
      this.onboardingStep = 1;
      await this.loadWizardStepOrder();
      if (channelId) {
        await this._prefillOnboardingFromChannel(channelId);
      }
      this.view = 'onboarding';
    },

    async _prefillOnboardingFromGlobalSettings() {
      // Load current settings from backend and map to onboarding fields
      try {
        const resp = await fetch('/api/settings');
        const s = await resp.json();
        this._mapSettingsToOnboarding(s);
      } catch(e) { console.warn('Failed to load settings for admin wizard:', e); }
    },

    async _prefillOnboardingFromChannel(channelId) {
      // First load global settings as baseline, then overlay channel-specific settings
      try {
        const [globalResp, channelResp, channelCfgResp] = await Promise.all([
          fetch('/api/settings'),
          fetch(`/api/channels/${channelId}/settings`),
          fetch(`/api/channels/${channelId}`)
        ]);
        const globalSettings = await globalResp.json();
        const channelSettings = await channelResp.json();
        const channelConfig = await channelCfgResp.json();
        // Start with global defaults
        this._mapSettingsToOnboarding(globalSettings);
        // Overlay channel-specific settings (only non-empty values)
        if (Object.keys(channelSettings).length > 0) {
          this._mapSettingsToOnboarding(channelSettings);
        }
        // Pre-fill channel info from config
        if (channelConfig) {
          const d = this.onboardingData;
          d.channelName = channelConfig.name || d.channelName;
          d.channelLang = channelConfig.language || d.channelLang;
          if (channelConfig.branding) {
            d.colorPrimary = channelConfig.branding.color_primary || d.colorPrimary;
            d.colorSecondary = channelConfig.branding.color_secondary || d.colorSecondary;
          }
        }
      } catch(e) { console.warn('Failed to load channel settings:', e); }
    },

    _mapSettingsToOnboarding(s) {
      // Map backend settings dict (ENV_KEY: value) to onboardingData fields
      const d = this.onboardingData;
      const v = (key, fallback) => { const val = s[key]; return (val !== undefined && val !== null && val !== '') ? val : fallback; };
      const b = (key, fallback) => { const val = s[key]; if (val === undefined || val === null || val === '') return fallback; return String(val).toLowerCase() === 'true'; };
      const n = (key, fallback) => { const val = s[key]; return (val !== undefined && val !== null && val !== '') ? Number(val) : fallback; };

      // TTS
      d.ttsProvider = v('TTS_PROVIDER', d.ttsProvider);
      d.ttsSpeed = n('TTS_SPEED', d.ttsSpeed);
      d.ttsRemoveApostrophes = b('TTS_REMOVE_APOSTROPHES', d.ttsRemoveApostrophes);
      d.ttsTrimSilence = b('TTS_TRIM_SILENCE', d.ttsTrimSilence);
      d.ttsEnhanceWithLlm = b('TTS_ENHANCE_WITH_LLM', d.ttsEnhanceWithLlm);
      d.ttsConcurrentWorkers = n('TTS_CONCURRENT_WORKERS', d.ttsConcurrentWorkers);
      // Voice
      if (d.ttsProvider === 'edge') d.selectedVoice = v('EDGE_TTS_VOICE', d.selectedVoice);
      else if (d.ttsProvider === 'qwen3') d.selectedVoice = v('QWEN3_SPEAKER', d.selectedVoice);
      // SpeshAudio
      d.speshLanguage = v('SPESHAUDIO_LANGUAGE', d.speshLanguage);
      d.speshVoiceId = v('SPESHAUDIO_VOICE_ID', d.speshVoiceId);
      d.speshStability = n('SPESHAUDIO_STABILITY', d.speshStability);
      d.speshSimilarity = n('SPESHAUDIO_SIMILARITY_BOOST', d.speshSimilarity);
      d.speshStyle = n('SPESHAUDIO_STYLE', d.speshStyle);
      d.elevenlabsVoiceId = v('ELEVENLABS_VOICE_ID', d.elevenlabsVoiceId);
      d.openaiTtsVoice = v('OPENAI_TTS_VOICE', d.openaiTtsVoice);
      d.dubvoiceVoiceId = v('DUBVOICE_VOICE_ID', d.dubvoiceVoiceId);
      // Qwen3
      d.qwen3ModelId = v('QWEN3_MODEL_ID', d.qwen3ModelId);
      d.qwen3ModelType = v('QWEN3_MODEL_TYPE', d.qwen3ModelType);
      d.qwen3VoiceInstruct = v('QWEN3_VOICE_INSTRUCT', d.qwen3VoiceInstruct);
      d.qwen3RefAudio = v('QWEN3_REF_AUDIO', d.qwen3RefAudio);
      d.qwen3Device = v('QWEN3_DEVICE', d.qwen3Device);
      // Visuals
      d.visualProvider = v('VISUALS_PROVIDER', d.visualProvider);
      d.zimageAspectRatio = v('ZIMAGE_ASPECT_RATIO', d.zimageAspectRatio);
      // Video
      d.resolution = v('VIDEO_RESOLUTION', d.resolution);
      d.videoFps = n('VIDEO_FPS', d.videoFps);
      d.gpuEncoding = v('GPU_ENCODING', d.gpuEncoding);
      d.composer = v('COMPOSER_PROVIDER', d.composer);
      d.remotionConcurrency = n('REMOTION_CONCURRENCY', d.remotionConcurrency);
      // Subtitle
      d.subtitleAnim = v('REMOTION_SUBTITLE_ANIMATION', d.subtitleAnim);
      d.videoEffect = v('REMOTION_VIDEO_EFFECT', d.videoEffect);
      d.subtitleFont = v('REMOTION_SUBTITLE_FONT', d.subtitleFont);
      d.subtitleSize = n('REMOTION_SUBTITLE_SIZE', d.subtitleSize);
      d.subtitleColor = v('REMOTION_SUBTITLE_COLOR', d.subtitleColor);
      d.subtitleBg = v('REMOTION_SUBTITLE_BG', d.subtitleBg);
      d.subtitleStroke = n('REMOTION_SUBTITLE_STROKE', d.subtitleStroke);
      d.karaokeEnabled = b('REMOTION_KARAOKE_ENABLED', d.karaokeEnabled);
      d.karaokeColor = v('REMOTION_KARAOKE_COLOR', d.karaokeColor);
      d.transitionDuration = n('REMOTION_TRANSITION_DURATION', d.transitionDuration);
      d.kenBurnsZoom = n('REMOTION_KEN_BURNS_ZOOM', d.kenBurnsZoom);
      d.kenBurnsDirection = v('REMOTION_KEN_BURNS_DIRECTION', d.kenBurnsDirection);
      // Subtitle provider
      d.subtitleProvider = v('SUBTITLE_PROVIDER', d.subtitleProvider);
      d.pycapsStyle = v('PYCAPS_STYLE', d.pycapsStyle);
      // Script/AI
      d.targetAudience = v('TARGET_AUDIENCE', d.targetAudience);
      d.scriptHumanize = b('SCRIPT_HUMANIZE_WITH_LLM', d.scriptHumanize);
      // YouTube
      d.ytOauthClientId = v('YT_OAUTH_CLIENT_ID', d.ytOauthClientId);
      d.ytOauthClientSecret = v('YT_OAUTH_CLIENT_SECRET', d.ytOauthClientSecret);
      d.autopublishYoutube = b('AUTOPUBLISH_YOUTUBE', d.autopublishYoutube);
      d.ytPrivacyStatus = v('YT_PRIVACY_STATUS', d.ytPrivacyStatus);
      d.ytCategoryId = v('YT_CATEGORY_ID', d.ytCategoryId);
      d.autopublishReels = b('AUTOPUBLISH_REELS', d.autopublishReels);
      d.shareOnInstagram = b('SHARE_ON_INSTAGRAM', d.shareOnInstagram);
      d.shareOnTiktok = b('SHARE_ON_TIKTOK', d.shareOnTiktok);
      // Notifications
      d.webhookEnabled = b('WEBHOOK_ENABLED', d.webhookEnabled);
      d.webhookUrl = v('WEBHOOK_URL', d.webhookUrl);
      d.webhookOnComplete = b('WEBHOOK_ON_COMPLETE', d.webhookOnComplete);
      d.webhookOnFailure = b('WEBHOOK_ON_FAILURE', d.webhookOnFailure);
      d.webhookMention = v('WEBHOOK_MENTION', d.webhookMention);
      d.webhookSecret = v('WEBHOOK_SECRET', d.webhookSecret);
      d.telegramEnabled = b('TELEGRAM_ENABLED', d.telegramEnabled);
      d.telegramBotToken = v('TELEGRAM_BOT_TOKEN', d.telegramBotToken);
      d.telegramChatId = v('TELEGRAM_CHAT_ID', d.telegramChatId);
      d.emailEnabled = b('EMAIL_ENABLED', d.emailEnabled);
      d.emailSmtpHost = v('EMAIL_SMTP_HOST', d.emailSmtpHost);
      d.emailSmtpPort = n('EMAIL_SMTP_PORT', d.emailSmtpPort);
      d.emailSmtpUser = v('EMAIL_SMTP_USER', d.emailSmtpUser);
      d.emailSmtpPassword = v('EMAIL_SMTP_PASSWORD', d.emailSmtpPassword);
      d.emailFrom = v('EMAIL_FROM', d.emailFrom);
      d.emailTo = v('EMAIL_TO', d.emailTo);
      d.whatsappEnabled = b('WHATSAPP_ENABLED', d.whatsappEnabled);
      d.whatsappApiUrl = v('WHATSAPP_API_URL', d.whatsappApiUrl);
      d.whatsappApiToken = v('WHATSAPP_API_TOKEN', d.whatsappApiToken);
      d.whatsappTo = v('WHATSAPP_TO', d.whatsappTo);
      // Social Meta
      d.socialMetaEnabledYt = b('SOCIAL_META_ENABLED_YT_VIDEO', d.socialMetaEnabledYt);
      d.socialMetaEnabledBulletin = b('SOCIAL_META_ENABLED_BULLETIN', d.socialMetaEnabledBulletin);
      d.socialMetaEnabledPr = b('SOCIAL_META_ENABLED_PR', d.socialMetaEnabledPr);
      d.socialMetaFields = v('SOCIAL_META_FIELDS', d.socialMetaFields);
      d.socialMetaMasterPrompt = v('SOCIAL_META_MASTER_PROMPT', d.socialMetaMasterPrompt);
      d.socialMetaLanguage = v('SOCIAL_META_LANGUAGE', d.socialMetaLanguage);
      // Module overrides
      d.ytTtsProvider = v('YT_TTS_PROVIDER', d.ytTtsProvider);
      d.ytTtsSpeed = n('YT_TTS_SPEED', d.ytTtsSpeed);
      d.ytTtsVoiceId = v('YT_TTS_VOICE_ID', d.ytTtsVoiceId);
      d.bulletinTtsProvider = v('BULLETIN_TTS_PROVIDER', d.bulletinTtsProvider);
      d.bulletinTtsSpeed = n('BULLETIN_TTS_SPEED', d.bulletinTtsSpeed);
      d.bulletinTtsVoiceId = v('BULLETIN_TTS_VOICE_ID', d.bulletinTtsVoiceId);
      d.prTtsProvider = v('PR_TTS_PROVIDER', d.prTtsProvider);
      d.prTtsSpeed = n('PR_TTS_SPEED', d.prTtsSpeed);
      d.prTtsVoiceId = v('PR_TTS_VOICE_ID', d.prTtsVoiceId);
      // Bulletin module
      d.bulletinNetworkName = v('BULLETIN_NETWORK_NAME', d.bulletinNetworkName);
      d.bulletinStyle = v('BULLETIN_STYLE', d.bulletinStyle);
      d.bulletinFormat = v('BULLETIN_FORMAT', d.bulletinFormat);
      d.bulletinFps = n('BULLETIN_FPS', d.bulletinFps);
      d.bulletinMaxItems = n('BULLETIN_DEFAULT_MAX_ITEMS', d.bulletinMaxItems);
      d.bulletinDefaultLanguage = v('BULLETIN_DEFAULT_LANGUAGE', d.bulletinDefaultLanguage);
      // PR module
      d.prStyle = v('PR_STYLE', d.prStyle);
      d.prFormat = v('PR_FORMAT', d.prFormat);
      d.prFps = n('PR_FPS', d.prFps);
      d.prChannelName = v('PR_CHANNEL_NAME', d.prChannelName);
      d.prCurrency = v('PR_CURRENCY', d.prCurrency);
      d.prCtaText = v('PR_CTA_TEXT', d.prCtaText);
      d.prAutoGenerateTts = b('PR_AUTO_GENERATE_TTS', d.prAutoGenerateTts);
      d.prMasterPrompt = v('PR_MASTER_PROMPT', d.prMasterPrompt);
      d.prAiLanguage = v('PR_AI_LANGUAGE', d.prAiLanguage);
      // System
      d.corsOrigins = v('CORS_ORIGINS', d.corsOrigins);
      d.debugMode = b('DEBUG_MODE', d.debugMode);
      // API keys (masked — only set if not masked)
      const unmask = (val) => (val && !val.includes('***')) ? val : '';
      d.openaiApiKey = unmask(v('OPENAI_API_KEY', ''));
      d.anthropicApiKey = unmask(v('ANTHROPIC_API_KEY', ''));
      d.kieaiApiKey = unmask(v('KIEAI_API_KEY', ''));
      d.geminiApiKey = unmask(v('GEMINI_API_KEY', ''));
      d.youtubeApiKey = unmask(v('YOUTUBE_API_KEY', ''));
      d.pixabayApiKey = unmask(v('PIXABAY_API_KEY', ''));
    },
  };
}
