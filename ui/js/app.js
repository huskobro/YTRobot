// ── App ──────────────────────────────────────────────────────────────────────
function app() {
  return {
    lang: localStorage.getItem('ytrobot-lang') || 'en',
    view: 'dashboard', mode: 'topic', sidebarOpen: false,
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
    contentPlanningTab: 'calendar',
    dashboardChannelFilter: 'all',
    analyticsTab: 'pipeline',
    wizardStepOrder: [],
    settingsModule: 'tts',
    categoryPromptOpen: '',
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
    prWizardStep: 1,
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
    wizardPlaylistId: '',
    wizardScheduleAt: '',
    wizardNewPlaylistOpen: false,
    wizardNewPlaylistName: '',
    wizardNewPlaylistDesc: '',
    ytPlaylists: [],
    // Legacy wizard options (used by Bulletin & Product Review modules)
    wizardMood: 'informative',
    wizardCaptions: 'karaoke',
    wizardTone: 'balanced',
    wizardStyle: 'dynamic',
    _sse: null, _sseConnecting: false, _timer: null,
    webhookTesting: false,
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
    dashboardStats: { totalRenders: 0, successCount: 0, failCount: 0 },
    recentActivity: [],
    errorDetails: [],
    socialLog: [],
    thumbnailGenerating: false,
    _chartInstance: null,
    competitorData: null,
    competitorLoading: false,
    competitorScanning: {},
    agActiveChannel: null,
    agStatusFilter: 'all',
    agMinScore: 0,
    agNewChannel: { id: '', name: '', language: 'Turkish', dna: 'Documentary', pull_count: 10, competitors: [] },
    agNewCompetitorId: '',
    agNewCompetitorName: '',
    soundEnabled: localStorage.getItem('ytrobot-sound') !== 'false',
    darkMode: true,
    // ── Video Preview ──
    videoPreviewOpen: false,
    videoPreviewUrl: '',
    wizardConfigOpen: false,
    wizardConfigSteps: [],
    wizardConfigDragIdx: -1,
    wizardConfigDragOverIdx: -1,
    // ── Video Gallery ──
    galleryVideos: [],
    gallerySearch: '',
    galleryFilter: '',
    galleryModuleFilter: '',
    galleryChannelFilter: '',
    galleryPlatformFilter: '',
    galleryAvailableFilters: { modules: [], channels: [], platforms: [] },
    galleryTotal: 0,
    galleryOffset: 0,
    galleryHasMore: false,
    galleryBulkMode: false,
    galleryBulkSelected: [],
    // ── Settings Search ──
    settingsSearch: '',
    settingsSearchResults: [],
    // ── Scheduler ──
    scheduledVideos: [],
    schedulableVideos: [],
    bulkScheduleChannel: '',
    bulkScheduleInterval: '24',
    bulkScheduleStart: '',
    bulkScheduleSelected: [],
    bulkScheduleSelectedAll: false,
    // ── A/B Testing ──
    abTests: [],
    abTestModalOpen: false,
    abTestForm: { video_id: '', variants: ['', ''] },
    // ── Calendar ──
    calendarEntries: [],
    calendarMonth: new Date(),
    calendarModalOpen: false,
    calendarEditId: null,
    calendarForm: { title: '', topic: '', planned_date: '', status: 'idea', notes: '', channel_id: '_default' },
    calendarScheduleMode: false,
    calendarScheduleVideoId: '',
    calendarScheduleTime: '09:00',
    // ── Playlists ──
    playlists: [],
    selectedPlaylist: null,
    playlistModalOpen: false,
    playlistForm: { name: '', description: '', channel_id: '_default' },
    playlistAddVideoId: '',
    playlistBulkOpen: false,
    playlistBulkSelected: [],
    playlistAiLoading: false,
    // ── Templates ──
    templates: [],
    templateModalOpen: false,
    templateForm: { name: '', description: '', settings: '{}', channel_id: '_default' },
    templateFromSessionId: '',
    // ── SEO ──
    seoResult: null,
    seoLoading: false,
    // ── YouTube Upload ──
    uploadModal: false,
    uploadForm: { channel_id: '', privacy: 'private', title: '', description: '', tags: '' },
    uploadProgress: 0,
    uploadStatus: '',
    uploadYoutubeUrl: '',
    // ── Editable Metadata ──
    editableMetadata: { title: '', description: '', tags: '' },
    metadataEditing: false,
    // ── Analytics Channel Filter ──
    analyticsChannel: '',
    channelAnalytics: null,
    // ── Toast Bildirim Sistemi ──
    toasts: [],
    _toastIdCounter: 0,
    // ── YouTube Analytics ──
    ytAnalytics: { channel: null, videos: [] },
    ytAnalyticsChannel: '_default',
    ytAnalyticsLoading: false,
    ytVideoDetail: null,
    // ── Audit Log ──
    auditLogs: [],
    auditCategory: '',
    auditOffset: 0,
    // ── Notifications ──
    notifications: [],
    unreadCount: 0,
    notifOpen: false,
    _notifPoll: null,
    // ── Secure Storage ──
    secureKeys: [],
    newSecureKey: '',
    newSecureValue: '',
    wizardStep: 1,
    wizardMaxSteps: 3,
    // ── Onboarding ──
    onboardingStep: 1,
    onboardingMode: 'user',       // 'user' = channel onboarding, 'admin' = global defaults wizard
    onboardingChannelId: '',      // channel ID for pre-fill/save (empty = new channel)
    onboardingAudioPlaying: '',
    _onboardingAudio: null,
    ttsPreviewLoading: false,
    ttsPreviewPlaying: false,
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
    showCommandPalette: false,
    commandQuery: '',
    selectedCommandIndex: 0,
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

    t(key) { return LANG[this.lang]?.[key] ?? LANG.en[key] ?? key; },
    safeSave(key, value) {
      try { localStorage.setItem(key, value); } catch(e) { console.warn('localStorage full:', e); }
    },
    setLang(l) { this.lang = l; this.safeSave('ytrobot-lang', l); },

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

    async loadYtPlaylists() {
      try {
        const resp = await fetch('/api/youtube/playlists');
        if (resp.ok) {
          const data = await resp.json();
          this.ytPlaylists = data.playlists || [];
        }
      } catch(e) { console.warn('[loadYtPlaylists]', e); }
    },

    async createWizardPlaylist() {
      if (!this.wizardNewPlaylistName.trim()) return;
      try {
        const resp = await fetch('/api/playlists/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: this.wizardNewPlaylistName.trim(),
            description: this.wizardNewPlaylistDesc.trim(),
            channel_id: this.activeChannelId || '_default'
          })
        });
        if (resp.ok) {
          const data = await resp.json();
          await this.loadPlaylists();
          if (data.playlist?.id) this.wizardPlaylistId = data.playlist.id;
          this.wizardNewPlaylistOpen = false;
          this.wizardNewPlaylistName = '';
          this.wizardNewPlaylistDesc = '';
          this.showToast(this.t('playlist_created'), 'success');
        }
      } catch(e) { console.warn('[createWizardPlaylist]', e); this.showToast(this.t('playlist_create_error'), 'error'); }
    },

    // ── Command Palette Methods ──
    toggleCommandPalette() {
      // Debounce guard — prevent rapid re-entry from duplicate keydown events
      const now = Date.now();
      if (this._cmdPaletteLastToggle && now - this._cmdPaletteLastToggle < 200) return;
      this._cmdPaletteLastToggle = now;

      if (!this.showCommandPalette) {
        // Blur any active element to prevent focus conflicts
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        this.showCommandPalette = true;
        this.playSound('pop');
        this.commandQuery = '';
        this.selectedCommandIndex = 0;
        // Aggressive focus with multiple retries for browser stability
        setTimeout(() => {
          const inp = document.getElementById('command-input');
          if (inp) {
            inp.focus();
            inp.select();
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

    // ── Onboarding Methods ──
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

    // ── Video Preview ──
    // ── Wizard Configuration ──
    async openWizardConfig() {
      try {
        const resp = await fetch('/api/wizard-config');
        if (resp.ok) {
          const data = await resp.json();
          this.wizardConfigSteps = JSON.parse(JSON.stringify(data.steps));
        }
      } catch(e) { console.warn('Failed to load wizard config:', e); }
      this.wizardConfigOpen = true;
    },
    moveWizardStep(idx, dir) {
      const target = idx + dir;
      if (target < 0 || target >= this.wizardConfigSteps.length) return;
      const steps = [...this.wizardConfigSteps];
      [steps[idx], steps[target]] = [steps[target], steps[idx]];
      this.wizardConfigSteps = steps;
    },
    reorderWizardStep(fromIdx, toIdx) {
      if (fromIdx === toIdx || fromIdx < 0 || toIdx < 0) return;
      const steps = [...this.wizardConfigSteps];
      const [moved] = steps.splice(fromIdx, 1);
      steps.splice(toIdx, 0, moved);
      this.wizardConfigSteps = steps;
    },
    async saveWizardConfig() {
      try {
        const resp = await fetch('/api/wizard-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ steps: this.wizardConfigSteps })
        });
        if (resp.ok) {
          this.showToast(this.t('wizard_config_saved'), 'success');
          this.wizardConfigOpen = false;
          await this.loadWizardStepOrder();
        }
      } catch(e) { console.warn('Failed to save wizard config:', e); }
    },
    async resetWizardConfig() {
      try {
        const resp = await fetch('/api/wizard-config/reset', { method: 'POST' });
        if (resp.ok) {
          const data = await resp.json();
          this.wizardConfigSteps = data.steps;
          this.showToast(this.t('wizard_config_reset'), 'success');
          await this.loadWizardStepOrder();
        }
      } catch(e) { console.warn('Failed to reset wizard config:', e); }
    },

    async loadWizardStepOrder() {
      try {
        const resp = await fetch('/api/wizard-config');
        if (resp.ok) {
          const data = await resp.json();
          const steps = (data.steps || []).filter(s => s.enabled !== false);
          this.wizardStepOrder = steps.map(s => s.key);
        }
      } catch(e) {
        // fallback to default order
        this.wizardStepOrder = ['welcome','channel','tts_provider','voice_select','visual_provider','video_style','tts_advanced','subtitle_detail','ai_system','api_keys','notifications','social_meta','youtube_oauth','module_tts','module_settings','summary'];
      }
      if (this.wizardStepOrder.length === 0) {
        this.wizardStepOrder = ['welcome','channel','tts_provider','voice_select','visual_provider','video_style','tts_advanced','subtitle_detail','ai_system','api_keys','notifications','social_meta','youtube_oauth','module_tts','module_settings','summary'];
      }
    },
    isWizardStep(key) {
      if (this.wizardStepOrder.length === 0) return false;
      const currentKey = this.wizardStepOrder[this.onboardingStep - 1];
      return currentKey === key;
    },
    get wizardTotalSteps() {
      return this.wizardStepOrder.length || 16;
    },
    nextWizardStep() {
      if (this.onboardingStep < this.wizardTotalSteps) {
        this.onboardingStep++;
      }
    },
    prevWizardStep() {
      if (this.onboardingStep > 1) {
        this.onboardingStep--;
      }
    },

    previewVideo(sessionId) {
      this.videoPreviewUrl = `/api/sessions/${sessionId}/video`;
      this.videoPreviewOpen = true;
    },

    // ── Video Gallery ──
    _galleryParams() {
      const params = new URLSearchParams();
      if (this.galleryFilter) params.set('status', this.galleryFilter);
      if (this.gallerySearch) params.set('search', this.gallerySearch);
      if (this.galleryModuleFilter) params.set('module', this.galleryModuleFilter);
      if (this.galleryChannelFilter) params.set('channel', this.galleryChannelFilter);
      return params;
    },
    async loadGallery() {
      this.galleryOffset = 0;
      const params = this._galleryParams();
      params.set('limit', '20');
      try {
        const resp = await fetch(`/api/sessions/gallery?${params}`);
        if (resp.ok) {
          const d = await resp.json();
          this.galleryVideos = d.videos || [];
          this.galleryTotal = d.total || 0;
          this.galleryHasMore = d.total > 20;
          this.galleryOffset = 20;
          if (d.filters) this.galleryAvailableFilters = d.filters;
        }
      } catch(e) { console.warn('[loadGallery]', e); this.showToast(this.t('load_error') || 'Failed to load gallery', 'error'); }
    },
    async loadMoreGallery() {
      const params = this._galleryParams();
      params.set('limit', '20'); params.set('offset', String(this.galleryOffset));
      try {
        const resp = await fetch(`/api/sessions/gallery?${params}`);
        if (resp.ok) { const d = await resp.json(); this.galleryVideos = [...this.galleryVideos, ...(d.videos||[])]; this.galleryHasMore = d.total > this.galleryOffset + 20; this.galleryOffset += 20; }
      } catch(e) { console.warn('[loadMoreGallery]', e); }
    },

    // ── Gallery Quick Actions ──
    async galleryQuickDelete(sid) {
      if (!confirm('Bu videoyu silmek istediginize emin misiniz?')) return;
      try {
        const resp = await fetch('/api/sessions/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_ids: [sid], action: 'delete' })
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        this.showToast(this.t('video_deleted'), 'success');
        this.loadGallery();
      } catch(e) { this.showToast(this.t('delete_error'), 'error'); }
    },
    async galleryQuickUploadYT(sid) {
      try {
        const resp = await fetch(`/api/youtube/upload/${sid}`, { method: 'POST' });
        if (resp.ok) this.showToast(this.t('yt_upload_started'), 'success');
        else this.showToast(this.t('yt_upload_error'), 'error');
      } catch(e) { this.showToast(this.t('yt_upload_error'), 'error'); }
    },
    async galleryQuickSeo(sid) {
      try {
        const resp = await fetch(`/api/social/generate/${sid}`, { method: 'POST' });
        if (resp.ok) {
          const data = await resp.json();
          this.showToast(this.t('seo_score') + ': ' + (data.seo_score || this.t('seo_calculated') || '?'), 'success');
        }
      } catch(e) { this.showToast(this.t('generic_error'), 'error'); }
    },
    async galleryQuickThumbnail(sid) {
      try {
        const resp = await fetch(`/api/sessions/${sid}/thumbnail`);
        if (resp.ok) this.showToast(this.t('thumbnail_created'), 'success');
        else this.showToast(this.t('thumbnail_error'), 'error');
        this.loadGallery();
      } catch(e) { this.showToast(this.t('thumbnail_error'), 'error'); }
    },

    // ── Gallery Bulk Actions ──
    async bulkDeleteGallery() {
      if (this.galleryBulkSelected.length === 0) return;
      if (!confirm(`${this.galleryBulkSelected.length} video silinecek. Emin misiniz?`)) return;
      try {
        const resp = await fetch('/api/sessions/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_ids: this.galleryBulkSelected, action: 'delete' })
        });
        if (resp.ok) {
          this.showToast(`${this.galleryBulkSelected.length} ${this.t('video_deleted')}`, 'success');
          this.galleryBulkSelected = [];
          this.galleryBulkMode = false;
          this.loadGallery();
        }
      } catch(e) { this.showToast(this.t('delete_error'), 'error'); }
    },
    toggleGalleryBulkSelect(sid) {
      const idx = this.galleryBulkSelected.indexOf(sid);
      if (idx > -1) this.galleryBulkSelected.splice(idx, 1);
      else this.galleryBulkSelected.push(sid);
    },
    selectAllGalleryByStatus(status) {
      this.galleryBulkSelected = this.galleryVideos.filter(v => v.status === status).map(v => v.session_id);
      this.galleryBulkMode = true;
    },

    // ── Settings Search ──
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

    // ── Scheduler ──
    async loadSchedule() {
      try {
        const resp = await fetch('/api/scheduler/');
        if (resp.ok) { const d = await resp.json(); this.scheduledVideos = d.entries || []; }
      } catch(e) { console.warn('[loadSchedule]', e); this.showToast(this.t('load_error') || 'Failed to load data', 'error'); }
    },
    async loadScheduledVideos() {
      this.loadSchedule();
      this.loadChannelVideosForSchedule();
    },
    async loadChannelVideosForSchedule() {
      try {
        const params = new URLSearchParams({ status: 'completed', limit: '200' });
        if (this.bulkScheduleChannel) params.set('channel', this.bulkScheduleChannel);
        const resp = await fetch(`/api/sessions/gallery?${params}`);
        if (resp.ok) {
          const data = await resp.json();
          this.schedulableVideos = (data.videos || []).filter(v => v.has_video && v.status === 'completed');
        }
      } catch(e) { console.warn('[loadChannelVideosForSchedule]', e); }
    },
    async cancelSchedule(sessionId) {
      try {
        await fetch(`/api/scheduler/${sessionId}`, { method: 'DELETE' });
        this.loadSchedule();
        if (this.showToast) this.showToast(this.t('schedule_cancelled') || 'Schedule cancelled', 'success');
      } catch(e) { console.warn('[cancelSchedule]', e); this.showToast(this.t('cancel_error') || 'Cancel failed', 'error'); }
    },
    async executeBulkSchedule() {
      if (this.bulkScheduleSelected.length === 0) return;
      const intervalHours = parseInt(this.bulkScheduleInterval) || 24;
      const startDate = this.bulkScheduleStart ? new Date(this.bulkScheduleStart) : new Date();
      let scheduled = 0;
      for (let i = 0; i < this.bulkScheduleSelected.length; i++) {
        const sid = this.bulkScheduleSelected[i];
        const scheduleAt = new Date(startDate.getTime() + i * intervalHours * 3600000);
        try {
          const resp = await fetch('/api/scheduler/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sid, scheduled_at: scheduleAt.toISOString() })
          });
          if (resp.ok) scheduled++;
        } catch(e) { console.warn('[bulkSchedule]', e); }
      }
      this.showToast(`${scheduled} video zamanlandı`, 'success');
      this.bulkScheduleSelected = [];
      this.bulkScheduleSelectedAll = false;
      this.loadSchedule();
    },

    // ── A/B Testing Methods ──
    async loadAbTests() {
      try {
        const params = new URLSearchParams();
        if (this.activeChannelId && this.activeChannelId !== '_default') params.set('channel_id', this.activeChannelId);
        const resp = await fetch(`/api/ab-test/?${params}`);
        if (resp.ok) { const d = await resp.json(); this.abTests = d.tests || []; }
      } catch(e) { console.warn('[loadAbTests]', e); this.showToast(this.t('load_error') || 'Failed to load', 'error'); }
    },
    async createAbTest() {
      if (!this.abTestForm.video_id || !this.abTestForm.video_id.trim()) {
        this.showToast(this.t('form_field_required'), 'warning'); return;
      }
      const variants = this.abTestForm.variants.filter(v => v.trim());
      if (variants.length < 2) { this.showToast(this.t('ab_test_min_variants'), 'warning'); return; }
      try {
        const resp = await fetch('/api/ab-test/', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ video_id: this.abTestForm.video_id, variants, channel_id: this.activeChannelId || '_default' })
        });
        if (resp.ok) {
          this.abTestModalOpen = false;
          this.abTestForm = { video_id: '', variants: ['', ''] };
          this.loadAbTests();
          this.showToast(this.t('ab_test_create') + ' OK', 'success');
        }
      } catch(e) { console.warn('[createAbTest]', e); this.showToast(this.t('generic_error'), 'error'); }
    },
    async completeAbTest(testId) {
      try {
        const resp = await fetch(`/api/ab-test/${testId}/complete`, { method: 'POST' });
        if (resp.ok) { this.loadAbTests(); this.showToast(this.t('ab_test_complete') + ' OK', 'success'); }
      } catch(e) { console.warn('[completeAbTest]', e); this.showToast(this.t('generic_error'), 'error'); }
    },
    abTestCtr(variant) {
      if (!variant.impressions || variant.impressions === 0) return '0.0';
      return ((variant.clicks / variant.impressions) * 100).toFixed(1);
    },
    abTestWinnerIndex(test) {
      if (test.status !== 'completed' || !test.variants?.length) return -1;
      let best = -1, bestCtr = -1;
      test.variants.forEach((v, i) => {
        const ctr = v.impressions > 0 ? v.clicks / v.impressions : 0;
        if (ctr > bestCtr) { bestCtr = ctr; best = i; }
      });
      return best;
    },
    addAbVariant() { this.abTestForm.variants.push(''); },
    removeAbVariant(idx) { if (this.abTestForm.variants.length > 2) this.abTestForm.variants.splice(idx, 1); },

    // ── Calendar Methods ──
    async loadCalendarEntries() {
      try {
        const params = new URLSearchParams();
        if (this.activeChannelId && this.activeChannelId !== '_default') params.set('channel_id', this.activeChannelId);
        const m = this.calendarMonth;
        params.set('month', `${m.getFullYear()}-${String(m.getMonth()+1).padStart(2,'0')}`);
        const resp = await fetch(`/api/calendar/?${params}`);
        if (resp.ok) { const d = await resp.json(); this.calendarEntries = d.entries || []; }
      } catch(e) { console.warn('[loadCalendarEntries]', e); this.showToast(this.t('load_error') || 'Failed to load', 'error'); }
    },
    calendarDays() {
      const y = this.calendarMonth.getFullYear(), m = this.calendarMonth.getMonth();
      const first = new Date(y, m, 1), last = new Date(y, m+1, 0);
      const startDay = (first.getDay() + 6) % 7; // Mon=0
      const days = [];
      for (let i = 0; i < startDay; i++) days.push(null);
      for (let d = 1; d <= last.getDate(); d++) days.push(d);
      return days;
    },
    calendarMonthLabel() {
      const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      const trMonths = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
      const m = this.calendarMonth;
      const names = this.lang === 'tr' ? trMonths : months;
      return `${names[m.getMonth()]} ${m.getFullYear()}`;
    },
    calendarPrevMonth() { this.calendarMonth = new Date(this.calendarMonth.getFullYear(), this.calendarMonth.getMonth()-1, 1); this.loadCalendarEntries(); },
    calendarNextMonth() { this.calendarMonth = new Date(this.calendarMonth.getFullYear(), this.calendarMonth.getMonth()+1, 1); this.loadCalendarEntries(); },
    calendarEntriesForDay(day) {
      if (!day) return [];
      const y = this.calendarMonth.getFullYear(), m = this.calendarMonth.getMonth();
      const dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      return this.calendarEntries.filter(e => e.planned_date === dateStr);
    },
    calendarVideosForDay(day) {
      if (!day) return [];
      const y = this.calendarMonth.getFullYear();
      const m = this.calendarMonth.getMonth();
      const dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      return this.sessions.filter(s => {
        if (s.status !== 'completed') return false;
        const created = s.created_at || s.start_time;
        if (!created) return false;
        return created.startsWith(dateStr);
      });
    },
    calendarScheduledForDay(day) {
      if (!day) return [];
      const y = this.calendarMonth.getFullYear();
      const m = this.calendarMonth.getMonth();
      const dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      return this.scheduledVideos.filter(sv => {
        if (!sv.scheduled_at) return false;
        return sv.scheduled_at.startsWith(dateStr);
      });
    },
    calendarStatusColor(status) {
      const colors = { idea: 'bg-slate-600', planned: 'bg-blue-600', recorded: 'bg-yellow-600', published: 'bg-green-600' };
      return colors[status] || 'bg-slate-600';
    },
    openCalendarModal(day = null, entry = null) {
      if (entry) {
        this.calendarEditId = entry.id;
        this.calendarForm = { title: entry.title||'', topic: entry.topic||'', planned_date: entry.planned_date||'', status: entry.status||'idea', notes: entry.notes||'', channel_id: entry.channel_id||'_default' };
      } else {
        this.calendarEditId = null;
        const y = this.calendarMonth.getFullYear(), m = this.calendarMonth.getMonth();
        const dateStr = day ? `${y}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}` : '';
        this.calendarForm = { title: '', topic: '', planned_date: dateStr, status: 'idea', notes: '', channel_id: this.activeChannelId || '_default' };
      }
      this.calendarScheduleMode = false;
      this.calendarScheduleVideoId = '';
      this.calendarScheduleTime = '09:00';
      this.calendarModalOpen = true;
    },
    async saveCalendarEntry() {
      if (!this.calendarForm.title || !this.calendarForm.title.trim()) {
        this.showToast(this.t('form_title_required'), 'warning'); return;
      }
      try {
        if (this.calendarEditId) {
          await fetch(`/api/calendar/${this.calendarEditId}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(this.calendarForm)
          });
        } else {
          await fetch('/api/calendar/', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(this.calendarForm)
          });
        }
        this.calendarModalOpen = false;
        this.loadCalendarEntries();
        this.showToast(this.calendarEditId ? 'Updated' : 'Created', 'success');
      } catch(e) { console.warn('[saveCalendarEntry]', e); this.showToast(this.t('generic_error'), 'error'); }
    },
    async deleteCalendarEntry(id) {
      if (!confirm(this.t('confirm_delete'))) return;
      try {
        const resp = await fetch(`/api/calendar/${id}`, { method: 'DELETE' });
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err.detail || `Delete failed (${resp.status})`);
        }
        this.calendarModalOpen = false;
        this.loadCalendarEntries();
        this.showToast('Deleted', 'success');
      } catch(e) { console.warn('[deleteCalendarEntry]', e); this.showToast(e.message || this.t('generic_error'), 'error'); }
    },
    async saveCalendarSchedule() {
      if (!this.calendarScheduleVideoId) {
        this.showToast(this.t('schedule_select_video'), 'error');
        return;
      }
      if (!this.calendarForm.planned_date) {
        this.showToast(this.t('schedule_select_date'), 'error');
        return;
      }
      try {
        const scheduledAt = new Date(`${this.calendarForm.planned_date}T${this.calendarScheduleTime || '09:00'}:00`);
        const resp = await fetch('/api/scheduler/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: this.calendarScheduleVideoId, scheduled_at: scheduledAt.toISOString() })
        });
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err.detail || `Schedule failed (${resp.status})`);
        }
        this.calendarModalOpen = false;
        this.calendarScheduleMode = false;
        this.calendarScheduleVideoId = '';
        this.calendarScheduleTime = '09:00';
        this.loadSchedule();
        this.showToast(this.t('video_scheduled'), 'success');
      } catch(e) { console.warn('[saveCalendarSchedule]', e); this.showToast(e.message || this.t('generic_error'), 'error'); }
    },

    // ── Playlist Methods ──
    async loadPlaylists() {
      try {
        const params = new URLSearchParams();
        if (this.activeChannelId && this.activeChannelId !== '_default') params.set('channel_id', this.activeChannelId);
        const resp = await fetch(`/api/playlists/?${params}`);
        if (resp.ok) { const d = await resp.json(); this.playlists = d.playlists || []; }
      } catch(e) { console.warn('[loadPlaylists]', e); this.showToast(this.t('load_error') || 'Failed to load', 'error'); }
    },
    async createPlaylist() {
      try {
        const resp = await fetch('/api/playlists/', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.playlistForm)
        });
        if (resp.ok) {
          this.playlistModalOpen = false;
          this.playlistForm = { name: '', description: '', channel_id: this.activeChannelId || '_default' };
          this.loadPlaylists();
          this.showToast(this.t('playlists_create') + ' OK', 'success');
        }
      } catch(e) { console.warn('[createPlaylist]', e); this.showToast(this.t('generic_error'), 'error'); }
    },
    async openPlaylistDetail(playlistId) {
      try {
        const resp = await fetch(`/api/playlists/${playlistId}`);
        if (resp.ok) { const d = await resp.json(); this.selectedPlaylist = d.playlist; }
      } catch(e) { console.warn('[openPlaylistDetail]', e); this.showToast(this.t('generic_error'), 'error'); }
    },
    async deletePlaylist(id) {
      if (!confirm(this.t('confirm_delete'))) return;
      try {
        await fetch(`/api/playlists/${id}`, { method: 'DELETE' });
        this.selectedPlaylist = null;
        this.loadPlaylists();
        this.showToast('Deleted', 'success');
      } catch(e) { console.warn('[deletePlaylist]', e); this.showToast(this.t('generic_error'), 'error'); }
    },
    async addVideoToPlaylist(playlistId) {
      if (!this.playlistAddVideoId) return;
      try {
        const resp = await fetch(`/api/playlists/${playlistId}/videos`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: this.playlistAddVideoId })
        });
        if (resp.ok) { this.playlistAddVideoId = ''; this.openPlaylistDetail(playlistId); this.showToast(this.t('playlists_add_video') + ' OK', 'success'); }
      } catch(e) { console.warn('[addVideoToPlaylist]', e); this.showToast(this.t('generic_error'), 'error'); }
    },
    async bulkAddToPlaylist() {
      if (!this.selectedPlaylist || this.playlistBulkSelected.length === 0) return;
      let added = 0;
      for (const sid of this.playlistBulkSelected) {
        try {
          const resp = await fetch(`/api/playlists/${this.selectedPlaylist.id}/videos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sid })
          });
          if (resp.ok) added++;
        } catch(e) { console.warn('[bulkAddToPlaylist]', e); }
      }
      this.showToast(`${added} video eklendi`, 'success');
      this.playlistBulkSelected = [];
      this.playlistBulkOpen = false;
      this.openPlaylistDetail(this.selectedPlaylist.id);
    },
    async generatePlaylistMeta() {
      this.playlistAiLoading = true;
      try {
        const resp = await fetch('/api/playlists/generate-meta', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videos: this.sessions.filter(s => s.status === 'completed').slice(0, 10).map(s => s.topic || s.id),
            channel_id: this.activeChannelId || '_default',
            language: this.lang === 'tr' ? 'Turkish' : 'English'
          })
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data.name) this.playlistForm.name = data.name;
          if (data.description) this.playlistForm.description = data.description;
          this.showToast(this.t('ai_metadata_created'), 'success');
        } else {
          this.showToast(this.t('ai_metadata_error'), 'error');
        }
      } catch(e) {
        console.warn('[generatePlaylistMeta]', e);
        this.showToast(this.t('ai_metadata_error'), 'error');
      }
      this.playlistAiLoading = false;
    },
    async removeVideoFromPlaylist(playlistId, sessionId) {
      try {
        await fetch(`/api/playlists/${playlistId}/videos/${sessionId}`, { method: 'DELETE' });
        this.openPlaylistDetail(playlistId);
        this.showToast('Removed', 'success');
      } catch(e) { console.warn('[removeVideoFromPlaylist]', e); this.showToast(this.t('generic_error'), 'error'); }
    },
    async syncPlaylistToYoutube(playlistId) {
      try {
        const resp = await fetch(`/api/playlists/${playlistId}/sync-youtube`, { method: 'POST' });
        if (resp.ok) { this.showToast(this.t('playlists_sync') + ' OK', 'success'); this.openPlaylistDetail(playlistId); }
        else { const d = await resp.json(); this.showToast(d.detail || 'Sync failed', 'error'); }
      } catch(e) { console.warn('[syncPlaylistToYoutube]', e); this.showToast(this.t('generic_error'), 'error'); }
    },

    // ── Template Methods ──
    async loadTemplates() {
      try {
        const params = new URLSearchParams();
        if (this.activeChannelId && this.activeChannelId !== '_default') params.set('channel_id', this.activeChannelId);
        const resp = await fetch(`/api/templates/?${params}`);
        if (resp.ok) { const d = await resp.json(); this.templates = d.templates || []; }
      } catch(e) { console.warn('[loadTemplates]', e); this.showToast(this.t('load_error') || 'Failed to load', 'error'); }
    },
    async createTemplate() {
      if (!this.templateForm.name || !this.templateForm.name.trim()) {
        this.showToast(this.t('form_title_required'), 'warning'); return;
      }
      let settings;
      try { settings = JSON.parse(this.templateForm.settings); } catch(e) { this.showToast('Invalid JSON', 'error'); return; }
      try {
        const resp = await fetch('/api/templates/', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: this.templateForm.name, description: this.templateForm.description, settings, channel_id: this.templateForm.channel_id })
        });
        if (resp.ok) {
          this.templateModalOpen = false;
          this.templateForm = { name: '', description: '', settings: '{}', channel_id: this.activeChannelId || '_default' };
          this.loadTemplates();
          this.showToast(this.t('templates_create') + ' OK', 'success');
        }
      } catch(e) { console.warn('[createTemplate]', e); this.showToast(this.t('generic_error'), 'error'); }
    },
    async applyTemplate(templateId) {
      try {
        const resp = await fetch(`/api/templates/${templateId}/apply`, { method: 'POST' });
        if (resp.ok) {
          const d = await resp.json();
          if (d.settings) Object.assign(this.settings, d.settings);
          this.showToast(this.t('templates_applied'), 'success');
        }
      } catch(e) { console.warn('[applyTemplate]', e); this.showToast(this.t('generic_error'), 'error'); }
    },
    async deleteTemplate(id) {
      if (!confirm(this.t('confirm_delete'))) return;
      try {
        const resp = await fetch(`/api/templates/${id}`, { method: 'DELETE' });
        if (!resp.ok) throw new Error(`Delete failed (${resp.status})`);
        this.loadTemplates();
        this.showToast('Deleted', 'success');
      } catch(e) { console.warn('[deleteTemplate]', e); this.showToast(e.message || this.t('generic_error'), 'error'); }
    },
    async createTemplateFromSession() {
      if (!this.templateFromSessionId) return;
      try {
        const resp = await fetch(`/api/templates/from-session/${this.templateFromSessionId}`, { method: 'POST' });
        if (resp.ok) {
          this.templateFromSessionId = '';
          this.loadTemplates();
          this.showToast(this.t('templates_from_session') + ' OK', 'success');
        }
      } catch(e) { console.warn('[createTemplateFromSession]', e); this.showToast(this.t('generic_error'), 'error'); }
    },
    templateSettingsSummary(tpl) {
      if (!tpl.settings) return '';
      const parts = [];
      if (tpl.settings.TTS_PROVIDER || tpl.settings.tts_provider) parts.push('TTS: ' + (tpl.settings.TTS_PROVIDER || tpl.settings.tts_provider));
      if (tpl.settings.VISUALS_PROVIDER || tpl.settings.visuals_provider) parts.push('Visuals: ' + (tpl.settings.VISUALS_PROVIDER || tpl.settings.visuals_provider));
      if (tpl.settings.OUTPUT_QUALITY || tpl.settings.output_quality) parts.push(tpl.settings.OUTPUT_QUALITY || tpl.settings.output_quality);
      return parts.join(' / ') || 'Custom settings';
    },

    // ── SEO Methods ──
    async analyzeSeo() {
      if (!this.currentSession?.metadata) { this.showToast(this.t('seo_no_metadata'), 'warning'); return; }
      this.seoLoading = true;
      try {
        const resp = await fetch('/api/seo/analyze', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: this.currentSession.metadata.title || '',
            description: this.currentSession.metadata.description || '',
            tags: this.currentSession.metadata.tags || [],
            language: 'tr'
          })
        });
        if (resp.ok) { this.seoResult = await resp.json(); }
      } catch(e) { console.warn('[analyzeSeo]', e); this.showToast(this.t('generic_error'), 'error'); }
      finally { this.seoLoading = false; }
    },
    seoScoreColor(score) {
      if (score >= 70) return 'bg-green-600 text-green-100';
      if (score >= 40) return 'bg-yellow-600 text-yellow-100';
      return 'bg-red-600 text-red-100';
    },

    // ── YouTube Upload Methods ──
    openUploadModal() {
      const meta = this.currentSession?.metadata || {};
      this.uploadForm = {
        channel_id: this.activeChannelId || '_default',
        privacy: 'private',
        title: meta.title || this.currentSession?.topic || '',
        description: meta.description || '',
        tags: (meta.tags || []).join(', ')
      };
      this.uploadProgress = 0;
      this.uploadStatus = '';
      this.uploadYoutubeUrl = '';
      this.uploadModal = true;
    },
    async uploadToYoutube() {
      if (!this.currentSession?.id) return;
      this.uploadStatus = 'uploading';
      this.uploadProgress = 10;
      try {
        const resp = await fetch('/api/youtube/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: this.currentSession.id,
            channel_id: this.uploadForm.channel_id,
            privacy: this.uploadForm.privacy,
            title: this.uploadForm.title,
            description: this.uploadForm.description,
            tags: this.uploadForm.tags.split(',').map(t => t.trim()).filter(Boolean)
          })
        });
        this.uploadProgress = 70;
        if (resp.ok) {
          const data = await resp.json();
          this.uploadProgress = 100;
          this.uploadStatus = 'success';
          this.uploadYoutubeUrl = data.youtube_url || data.url || '';
          this.showSuccess('YouTube\'a yüklendi!');
          this.playSound('success');
        } else {
          const err = await resp.json();
          this.uploadStatus = 'error';
          this.showError(err.detail || err.error || 'Upload failed');
        }
      } catch(e) {
        this.uploadStatus = 'error';
        this.showError(e.message);
      }
    },

    // ── Editable Metadata Methods ──
    initEditableMetadata() {
      const meta = this.currentSession?.metadata || {};
      this.editableMetadata = {
        title: meta.title || '',
        description: meta.description || '',
        tags: (meta.tags || []).join(', ')
      };
      this.metadataEditing = true;
    },
    async saveMetadata() {
      if (!this.currentSession?.id) return;
      try {
        await fetch(`/api/sessions/${this.currentSession.id}/metadata`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: this.editableMetadata.title,
            description: this.editableMetadata.description,
            tags: this.editableMetadata.tags.split(',').map(t => t.trim()).filter(Boolean)
          })
        });
        if (this.currentSession.metadata) {
          this.currentSession.metadata.title = this.editableMetadata.title;
          this.currentSession.metadata.description = this.editableMetadata.description;
          this.currentSession.metadata.tags = this.editableMetadata.tags.split(',').map(t => t.trim()).filter(Boolean);
        }
        this.metadataEditing = false;
        this.showSuccess('Metadata kaydedildi');
      } catch(e) { this.showError('Metadata kaydedilemedi'); }
    },
    downloadVideo() {
      if (!this.currentSession?.id) return;
      window.open(`/api/sessions/${this.currentSession.id}/video?download=1`, '_blank');
    },
    saveAsTemplate() {
      if (!this.currentSession?.id) return;
      this.templateFromSessionId = this.currentSession.id;
      this.createTemplateFromSession();
    },

    // ── Channel Analytics ──
    async loadChannelAnalytics(channelId) {
      if (!channelId) { this.channelAnalytics = null; return; }
      try {
        const data = await this.apiFetch(`/api/channels/${channelId}/analytics`);
        this.channelAnalytics = data;
      } catch(e) { console.warn('[channelAnalytics]', e); this.channelAnalytics = null; }
    },

    // ── TTS Provider Label ──
    ttsProviderLabel() {
      const labels = { speshaudio: 'Spes Audio', elevenlabs: 'ElevenLabs', openai: 'OpenAI TTS', google: 'Google TTS', qwen3: 'Qwen3 (Local)' };
      return labels[this.settings.TTS_PROVIDER] || this.settings.TTS_PROVIDER || 'N/A';
    },

    // ── Toast API ──
    showToast(message, type = 'info', duration = 5000) {
      const id = ++this._toastIdCounter;
      // Keep max 5 toasts — remove oldest if over limit
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

    // ── YouTube Analytics Methods ──
    async loadYtAnalytics() {
      this.ytAnalyticsLoading = true;
      try {
        const chId = this.ytAnalyticsChannel || '_default';
        const [channelResp, videosResp] = await Promise.allSettled([
          this.apiFetch(`/api/youtube/analytics/channel?channel_id=${chId}`),
          this.apiFetch(`/api/youtube/analytics/videos?channel_id=${chId}&limit=10`)
        ]);
        if (channelResp.status === 'fulfilled') this.ytAnalytics.channel = channelResp.value;
        if (videosResp.status === 'fulfilled') this.ytAnalytics.videos = videosResp.value.videos || [];
      } catch(e) { console.warn('[ytAnalytics]', e); }
      finally { this.ytAnalyticsLoading = false; }
    },

    async loadYtVideoDetail(videoId) {
      try {
        const chId = this.ytAnalyticsChannel || '_default';
        this.ytVideoDetail = await this.apiFetch(`/api/youtube/analytics/video/${videoId}?channel_id=${chId}`);
      } catch(e) { console.warn('[ytVideoDetail]', e); this.ytVideoDetail = null; }
    },

    // ── Audit Log Methods ──
    async loadAuditLogs() {
      try {
        const params = new URLSearchParams({ limit: '50', offset: String(this.auditOffset) });
        if (this.auditCategory) params.set('category', this.auditCategory);
        const data = await this.apiFetch(`/api/audit/?${params}`);
        if (this.auditOffset === 0) {
          this.auditLogs = data.entries || [];
        } else {
          this.auditLogs = [...this.auditLogs, ...(data.entries || [])];
        }
      } catch(e) { console.warn('[auditLogs]', e); }
    },

    async loadMoreAuditLogs() {
      this.auditOffset += 50;
      await this.loadAuditLogs();
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
        const data = await this.apiFetch('/api/channels');
        this.channelsData = (data.channels || []).filter(c => c.id !== '_default');
        try {
          const active = await this.apiFetch('/api/channels/active');
          this.activeChannelId = active.id || '_default';
          this.activeChannelName = active.name || 'Varsayılan Kanal';
        } catch(e) { console.warn('[loadChannels:active]', e); }
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
        const r = await fetch(`/api/channels/${channelId}`, { method: 'DELETE' });
        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          throw new Error(err.detail || err.error || `Hata (${r.status})`);
        }
        if (this.activeChannelId === channelId) {
          this.activeChannelId = '_default';
          this.activeChannelName = 'Varsayılan Kanal';
        }
        await this.loadChannels();
        this.showSuccess('Kanal silindi.');
      } catch (e) {
        console.error('Failed to delete channel:', e);
        this.showError(e.message || 'Kanal silinemedi.');
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

    initDragDrop() {
        const dropZone = document.getElementById('drop-zone') || document.body;

        ['dragenter', 'dragover'].forEach(evt => {
            document.addEventListener(evt, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        document.addEventListener('drop', async (e) => {
            e.preventDefault();
            e.stopPropagation();
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

    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Don't trigger shortcuts when typing in inputs
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

            // Ctrl+Enter or Cmd+Enter: Start video generation
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                if (this.view === 'new-run' && typeof this.submitRun === 'function') this.submitRun();
                return;
            }

            // Alt+1-9: Quick view switching
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

            // Escape: Close modals
            if (e.key === 'Escape') {
                if (this.videoPreviewOpen) { this.videoPreviewOpen = false; return; }
                if (this.channelFormOpen) { this.channelFormOpen = false; return; }
            }
        });
    },

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

    async loadDashboard() {
      try {
        const stats = await this.apiFetch('/api/stats');
        this.dashboardStats = { totalRenders: stats.total_renders || 0, successCount: stats.success_count || 0, failCount: stats.fail_count || 0 };
        this.recentActivity = (stats.recent || []).slice(0, 5);
      } catch(e) { console.warn('Dashboard load failed:', e); }
      try {
        this.queueStatus = await this.apiFetch('/api/stats/queue');
      } catch(e) { console.warn('[loadDashboard:queue]', e); }
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

    async agUseTitle(entry) {
      // Mark as used via API, then send to video wizard
      try {
        const slug = this.activeChannelId || '_default';
        await fetch(`/api/competitor/titles/${entry.id}/use?channel_slug=${slug}`, { method: 'POST' });
        entry.status = 'used';
      } catch(e) { console.warn('[agUseTitle]', e); }
      this.view = 'new-run';
      this.wizardStep = 2;
      this.videoModule = 'normal';
      this.$nextTick(() => { this.newTopic = entry.rewritten_title || entry.original_title; });
    },

    get agFilteredTitles() {
      if (!this.competitorData?.title_pool) return [];
      let pool = this.competitorData.title_pool;
      // Apply min score filter
      const minScore = parseFloat(this.agMinScore) || 0;
      if (minScore > 0) pool = pool.filter(t => (t.viral_score || 0) >= minScore);
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
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { labels: { color: '#94a3b8', font: { size: 10 } } },
            tooltip: { enabled: true, mode: 'index', intersect: false },
          },
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
      if (!confirm(this.t('confirm_delete') || 'Are you sure?')) return;
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
      if (this._sseConnecting) return;
      this._sseConnecting = true;
      const es = new EventSource(`/api/sessions/${session.id}/logs`);
      this._sse = es;
      this._sseConnecting = false;
      es.onmessage = (e) => {
        const line = JSON.parse(e.data);
        if (line === '__DONE__') { es.close(); this._sse = null; this.loadSessions(); return; }
        this.logLines.push(line);
        this.$nextTick(() => { const el = document.getElementById('log-container'); if (el) el.scrollTop = el.scrollHeight; });
      };
      es.onerror = () => { es.close(); this._sse = null; this._sseConnecting = false; };
    },

    closeSession() {
      if (this._sse) { this._sse.close(); this._sse = null; }
      this.currentSession = null; this.logLines = []; this.view = 'dashboard';
    },

    async saveNotes() {
      if (!this.currentSession) return;
      try {
        await fetch(`/api/sessions/${this.currentSession.id}`, {
          method: 'PATCH', headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ notes: this.notes }),
        });
        this.notesSaved = true; setTimeout(() => this.notesSaved = false, 2000);
      } catch(e) {
        console.warn('[saveNotes]', e);
        this.showToast(this.t('save_error') || 'Save failed', 'error');
      }
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
      // Yayın ayarları
      if (this.wizardPlaylistId) body.playlist_id = this.wizardPlaylistId;
      if (this.wizardScheduleAt) body.schedule_at = this.wizardScheduleAt;
      this.submitting = true;
      try {
        const data = await this.apiFetch('/api/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const session_id = data.session_id;
        // Zamanlama varsa schedule et
        if (this.wizardScheduleAt && session_id) {
          try {
            await fetch('/api/scheduler/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ session_id, scheduled_at: new Date(this.wizardScheduleAt).toISOString() })
            });
          } catch(e) { console.warn('[wizardSchedule]', e); }
        }
        // Playlist'e ekle
        if (this.wizardPlaylistId && session_id) {
          try {
            await fetch(`/api/playlists/${this.wizardPlaylistId}/videos`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ session_id })
            });
          } catch(e) { console.warn('[wizardPlaylist]', e); }
        }
        this.newTopic = ''; this.newScriptFile = '';
        this.wizardPlaylistId = ''; this.wizardScheduleAt = '';
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
      if (!confirm(this.t('confirm_delete') || 'Are you sure?')) return;
      await fetch(`/api/presets/${encodeURIComponent(name)}`, { method: 'DELETE' });
      if (this.selectedPreset === name) this.selectedPreset = '';
      await this.loadPresets();
    },

    async copyMetadata() {
      if (!this.currentSession?.metadata) return;
      const m = this.currentSession.metadata;
      const text = `Title: ${m.title}\n\nDescription:\n${m.description}\n\nTags: ${(m.tags||[]).join(', ')}`;
      try {
        await navigator.clipboard.writeText(text);
      } catch(e) {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
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
      if (this.dashboardChannelFilter !== 'all') list = list.filter(s => (s.channel_id || '_default') === this.dashboardChannelFilter);
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

    async copySocialMeta() {
      if (!this.socialMetaResult) return;
      const r = this.socialMetaResult;
      let text = '';
      if (r.title) text += `📌 BAŞLIK:\n${r.title}\n\n`;
      if (r.description) text += `📝 AÇIKLAMA:\n${r.description}\n\n`;
      if (r.tags && r.tags.length) text += `🏷️ ETİKETLER:\n${Array.isArray(r.tags) ? r.tags.join(', ') : r.tags}\n\n`;
      if (r.source) text += `📰 KAYNAK: ${r.source}\n`;
      if (r.link) text += `🔗 LİNK: ${r.link}\n`;
      try {
        await navigator.clipboard.writeText(text.trim());
      } catch(e) {
        const ta = document.createElement('textarea');
        ta.value = text.trim();
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      this.socialMetaCopied = true;
      setTimeout(() => this.socialMetaCopied = false, 2000);
    },

    computeSeoScore(result) {
      if (!result) return null;
      let score = 0;
      const checks = [];
      const title = result.title || '';
      if (title.length >= 20 && title.length <= 60) {
        score += 25; checks.push({ label: this.t('seo_title_length') || 'Title length', ok: true, msg: title.length+' '+(this.t('seo_chars') || 'chars')+' (ideal: 20-60)' });
      } else {
        checks.push({ label: this.t('seo_title_length') || 'Title length', ok: false, msg: title.length+' '+(this.t('seo_chars') || 'chars')+' (ideal: 20-60)' });
      }
      const desc = result.description || '';
      if (desc.length >= 100 && desc.length <= 500) {
        score += 25; checks.push({ label: this.t('seo_desc_length') || 'Description length', ok: true, msg: desc.length+' '+(this.t('seo_chars') || 'chars')+' (ideal: 100-500)' });
      } else {
        checks.push({ label: this.t('seo_desc_length') || 'Description length', ok: false, msg: desc.length+' '+(this.t('seo_chars') || 'chars')+' (ideal: 100-500)' });
      }
      const tags = Array.isArray(result.tags) ? result.tags : (result.tags||'').split(',').filter(Boolean);
      if (tags.length >= 10 && tags.length <= 20) {
        score += 25; checks.push({ label: this.t('seo_tag_count') || 'Tag count', ok: true, msg: tags.length+' '+(this.t('seo_tags') || 'tags')+' (ideal: 10-20)' });
      } else {
        checks.push({ label: this.t('seo_tag_count') || 'Tag count', ok: false, msg: tags.length+' '+(this.t('seo_tags') || 'tags')+' (ideal: 10-20)' });
      }
      const titleWords = title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const descLower = desc.toLowerCase();
      const matchCount = titleWords.filter(w => descLower.includes(w)).length;
      const pct = titleWords.length > 0 ? Math.round(matchCount/titleWords.length*100) : 0;
      if (titleWords.length > 0 && pct >= 50) {
        score += 25; checks.push({ label: this.t('seo_keyword_match') || 'Keyword match', ok: true, msg: pct+'% '+(this.t('seo_overlap') || 'overlap') });
      } else {
        checks.push({ label: this.t('seo_keyword_match') || 'Keyword match', ok: false, msg: pct+'% '+(this.t('seo_overlap') || 'overlap')+' (ideal: ≥50%)' });
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

    async sessionAction(action, sid, e) {
      e.stopPropagation();
      try {
        const resp = await fetch(`/api/sessions/${sid}/${action}`, { method: 'POST' });
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err.detail || `Action '${action}' failed (${resp.status})`);
        }
        await this.loadSessions();
      } catch(err) {
        console.error(err);
        this.showToast(err.message || this.t('generic_error'), 'error');
      }
    },

    async deleteSession(sid, e) {
      e.stopPropagation();
      if (!window.confirm(this.t('confirm_delete_msg'))) return;
      try {
        const resp = await fetch('/api/sessions/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_ids: [sid], action: 'delete' })
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        if (this.currentSession?.id === sid) this.closeSession();
        await this.loadSessions();
        this.showToast(this.t('session_deleted') || 'Session deleted', 'success');
      } catch (err) {
        console.error('Failed to delete session:', err);
        this.showToast(this.t('generic_error') || 'Delete failed', 'error');
      }
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
          this.prAutoError = err.detail || this.t('generic_error') || 'An error occurred';
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
          this.showToast(this.t('cleanup_success'), 'success');
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
