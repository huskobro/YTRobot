// ── Translations ─────────────────────────────────────────────────────────────
const LANG = {
  en: {
    app_subtitle: 'Auto Video Generator',
    nav_dashboard: 'Dashboard', nav_new_video: 'New Video', nav_settings: 'Settings',
    sidebar_running: 'Running', sidebar_completed: 'Completed', sidebar_total: 'Total',
    dashboard_title: 'Dashboard', dashboard_subtitle: 'All your video generation sessions',
    dashboard_new_video: '+ New Video',
    empty_title: 'No videos yet', empty_subtitle: 'Start generating your first YouTube video', empty_cta: 'Create First Video',
    steps_label: 'steps',
    status_queued: 'QUEUED', status_running: 'RUNNING', status_completed: 'COMPLETED', status_failed: 'FAILED',
    status_stopped: 'STOPPED', status_paused: 'PAUSED',
    filter_all: 'All', filter_running: 'Running', filter_queued: 'Queued', filter_paused: 'Paused',
    filter_completed: 'Completed', filter_failed: 'Failed', filter_stopped: 'Stopped',
    btn_stop: 'Stop', btn_pause: 'Pause', btn_resume: 'Resume',
    btn_restart: 'Restart', btn_delete: 'Delete',
    confirm_delete_msg: 'Delete this session and all its files? This cannot be undone.',
    back: '← Back',
    progress_title: 'Pipeline Progress', progress_complete: 'complete',
    live_log: 'Live Log', live: 'Live', done: 'Done', failed_label: 'Failed', waiting: 'Waiting for output...',
    lines: 'lines',
    info: 'Info', session_id: 'Session ID', started: 'Started', completed_at: 'Completed',
    output_file: 'Output File', error: 'Error',
    notes: 'Notes', notes_placeholder: 'Add notes here... (auto-saves on blur)', notes_saved: '✓ Saved',
    yt_metadata: 'YouTube Metadata', copy_all: 'Copy All', copied: '✓ Copied',
    title_label: 'TITLE', desc_label: 'DESCRIPTION', tags_label: 'TAGS',
    new_video_title: 'New Video', new_video_subtitle: 'Generate a full YouTube video from a topic or script file',
    mode_topic: '💬 Generate from Topic', mode_script: '📄 Use Script File',
    topic_label: 'Video Topic', topic_placeholder: 'e.g. The history of ancient Rome\n10 Python tips for beginners...',
    topic_hint: 'The AI (Gemini 2.5 Flash) will generate a complete 10-scene script from your topic.',
    script_label: 'Script File Path', script_placeholder: '/absolute/path/to/script.txt',
    script_hint: 'Supports .txt (one scene per paragraph) or .json format.',
    error_topic: 'Please enter a video topic.', error_script: 'Please enter a script file path.',
    submit: '🚀 Start Generation', submitting: 'Starting...',
    pipeline_steps_title: 'Pipeline Steps',
    pipeline_steps: ['Script generation','YouTube metadata','Text-to-speech','AI visuals','Subtitle alignment','Video composition'],
    settings_title: 'Settings', settings_subtitle: 'Manage API keys and pipeline configuration',
    save_settings: 'Save Settings', settings_saved: '✓ Settings saved successfully',
    section_llm: '🧠 Script & LLM',
    kieai_key: 'KIE.AI API Key (Gemini 2.5 Flash — primary)',
    openai_key: 'OpenAI API Key (fallback)', anthropic_key: 'Anthropic API Key',
    target_audience_label: 'Target Audience (optional)',
    target_audience_placeholder: 'e.g. beginner YouTubers under 1k subscribers who want to grow fast',
    target_audience_hint: 'Gemini uses this to tailor the script voice, examples, and pain points to your audience.',
    script_humanize_label: 'Gemini Script Humanization',
    script_humanize_hint: 'After generation, Gemini rewrites each scene to sound like a real person — removes AI-isms, adds contractions, natural imperfections. Runs before TTS.',
    section_tts: '🔊 Text-to-Speech', provider_label: 'Provider',
    tts_speed_label: 'Speech Speed',
    speed_slow: '0.75× — Slow', speed_slightly_slow: '0.9× — Slightly Slow',
    speed_normal: '1.0× — Normal (default)', speed_slightly_fast: '1.1× — Slightly Fast',
    speed_fast: '1.25× — Very Fast', speed_very_fast: '1.5× — Very Fast',
    spesh_key: 'Spesh Audio API Key', voice_id: 'Voice ID',
    language_setting: 'Language (empty = auto-detect)', elevenlabs_key: 'ElevenLabs API Key',
    openai_voice_label: 'Voice',
    fetch_voices_btn: 'Fetch Voices', voice_select_label: 'Select Voice',
    slider_expressive: 'Expressive', slider_consistent: 'Consistent',
    slider_low: 'Low', slider_high: 'High',
    slider_none: 'None', slider_strong: 'Strong',
    spesh_voice_quality_title: 'Voice Quality Settings',
    spesh_stability_label: 'Stability',
    spesh_similarity_label: 'Similarity Boost',
    spesh_style_label: 'Style',
    tts_enhance_label: 'Gemini TTS Enhancement',
    tts_enhance_hint: 'Second Gemini pass to add CAPS emphasis and "..." pauses before synthesis — makes AI voice sound more natural.',
    toggle_on: 'Enabled', toggle_off: 'Disabled',
    section_visuals: '🎨 Visuals', zimage_aspect: 'Z-Image Aspect Ratio',
    pexels_key: 'Pexels API Key', pixabay_key: 'Pixabay API Key',
    section_subtitles: '💬 Subtitles',
    subtitle_provider_label: 'Subtitle Engine',
    subtitle_ffmpeg: 'FFmpeg — soft track embed (fast, compatible)',
    subtitle_pycaps: 'pycaps — animated CSS subtitles (styled, slower)',
    pycaps_style_label: 'pycaps Style',
    pycaps_note_title: 'pycaps animated subtitles',
    pycaps_note_body: 'Renders CSS-styled animated subtitles using Chromium. ~40-60s extra render time per video.',
    ffmpeg_note: 'Embeds subtitles as a soft track (visible in players that support subtitle tracks).',
    section_composer: '🎬 Video Composer',
    composer_desc: 'Choose how the final video is rendered.',
    composer_provider_label: 'Composer Engine',
    composer_moviepy: 'MoviePy — Python/FFmpeg (default, no setup needed)',
    composer_remotion: 'Remotion — React renderer (Ken Burns, animations)',
    remotion_free: '(free for individuals)',
    remotion_concurrency_label: 'Render Concurrency (parallel threads)',
    ken_burns_zoom_label: 'Ken Burns Zoom Intensity',
    ken_burns_none: 'None (disabled)',
    ken_burns_subtle: 'Subtle (5%)',
    ken_burns_normal: 'Normal (8%) — Default',
    ken_burns_strong: 'Strong (15%)',
    ken_burns_direction_label: 'Ken Burns Direction',
    kb_dir_center: 'Center — zoom toward center',
    kb_dir_pan_left: 'Pan Left → Right',
    kb_dir_pan_right: 'Pan Right → Left',
    kb_dir_random: 'Random corners (alternating)',
    remotion_subtitle_font_label: 'Subtitle Font',
    font_bebas: 'Bebas Neue — bold/impactful (popular YouTube)',
    font_montserrat: 'Montserrat — bold/clean (trending)',
    font_oswald: 'Oswald — condensed/strong',
    font_roboto: 'Roboto — modern/neutral',
    font_inter: 'Inter — clean/minimal',
    font_serif: 'Georgia — cinematic/elegant',
    font_sans: 'Arial — sans-serif/simple',
    remotion_subtitle_size_label: 'Subtitle Size',
    size_small: 'Small (28px)',
    size_medium: 'Medium (40px) — Default',
    size_large: 'Large (52px)',
    size_xlarge: 'Extra Large (64px)',
    remotion_subtitle_color_label: 'Subtitle Color',
    color_white: 'White',
    color_yellow: 'Yellow',
    color_cyan: 'Cyan',
    color_orange: 'Orange',
    color_pink: 'Hot Pink',
    color_lime: 'Lime Green',
    color_red: 'Red',
    subtitle_bg_label: 'Subtitle Background',
    subtitle_bg_none: 'None (shadow only)',
    subtitle_bg_box: 'Dark Box',
    subtitle_bg_pill: 'Rounded Pill',
    subtitle_stroke_label: 'Text Outline/Stroke',
    stroke_none: 'None',
    stroke_thin: 'Thin (1px)',
    stroke_medium: 'Medium (2px)',
    stroke_thick: 'Thick (3px)',
    video_effect_label: 'Video Overlay Effect',
    effect_none: 'None',
    effect_vignette: 'Vignette — dark edges',
    effect_warm: 'Warm — orange tint',
    effect_cool: 'Cool — blue tint',
    effect_cinematic: 'Cinematic — letterbox bars',
    remotion_transition_label: 'Scene Fade-In Duration',
    transition_none: 'None (instant cut)',
    transition_fast: 'Fast (8 frames)',
    transition_normal: 'Normal (12 frames) — Default',
    transition_slow: 'Slow (24 frames)',
    remotion_setup: 'First-time setup: run this command in the project folder:',
    remotion_features: 'Features: Ken Burns effect, smooth fade transitions, SRT-timed subtitles.',
    karaoke_enabled_label: 'Karaoke Highlight',
    karaoke_color_label: 'Highlight Color',
    subtitle_animation_label: 'Subtitle Animation',
    subtitle_animation_hint: 'Pycaps-inspired animation preset for word-level karaoke effects.',
    tts_remove_apostrophes_label: 'Remove Apostrophes',
    tts_remove_apostrophes_hint: "Strip ' characters before TTS to avoid micro-pauses (safe for Turkish suffixes).",
    tts_trim_silence_label: 'Trim Silence',
    tts_trim_silence_hint: 'Remove leading/trailing silence from each audio clip to tighten pacing.',
    section_output: '📁 Output', output_dir_label: 'Output Directory',
    resolution_label: 'Resolution', fps_label: 'FPS',
    section_presets: '⚙️ Presets',
    preset_name_placeholder: 'Preset name...',
    preset_save_btn: 'Save Preset',
    preset_saved_ok: '✓ Saved!',
    preset_empty: 'No presets saved yet.',
    preset_load_btn: 'Load',
    preset_delete_btn: 'Delete',
    preset_run_label: 'Preset',
    preset_run_default: 'Default (.env settings)',
    section_prompts: '✏️ Master Prompts',
    prompts_hint: 'Override the default Gemini system prompts. Leave empty to use the built-in default. Changes take effect on the next run.',
    save_prompts_btn: 'Save Prompts',
    prompts_saved: '✓ Prompts saved',
    prompt_reset: 'Reset to default',
    prompt_script_label: '1 · Script Generation Prompt',
    prompt_script_hint: 'Use {audience} placeholder — it will be replaced with your Target Audience setting.',
    prompt_humanize_label: '2 · Script Humanization Prompt',
    prompt_humanize_hint: 'Rewrites AI narration to sound like a real person. Activate with "Gemini Script Humanization" toggle above.',
    prompt_metadata_label: '3 · YouTube Metadata Prompt (title / description / tags / thumbnail)',
    prompt_tts_enhance_label: '4 · TTS Enhancement Prompt (CAPS emphasis, pauses, exclamation)',
    prompt_view_default: '▸ View built-in default',
    prompt_loading: 'Loading...',
    prompt_default_placeholder: 'Leave empty to use the built-in default prompt...',
    nav_bulletin: 'Bulletin', nav_product_review: 'Product Review',
    pr_title: 'Product Review', pr_subtitle: 'Create product review / affiliate videos',
    pr_mode_manual: 'Manuel Giriş',
    pr_auto_title: '✨ Auto — URL ile AI Doldur',
    pr_auto_header_sub: 'Ürün linkini ver, AI tüm alanları otomatik doldursun',
    pr_manual_header_sub: 'Tüm ürün bilgilerini kendin gir ve videoyu render et',
    pr_auto_hint: 'Ürün sayfasının URL\'ini yapıştır — AI ürün bilgilerini, artı/eksileri, puanı ve değerlendirmeyi otomatik çıkarsın.',
    pr_product_url: 'Ürün Sayfası URL\'i',
    pr_url_placeholder: 'https://www.trendyol.com/...',
    pr_auto_prompt_label: 'Özel Talimatlar (isteğe bağlı)',
    pr_auto_prompt_ph: 'örn. Oyun özelliklerine odaklan, resmi dilde yaz...',
    pr_auto_fill_btn: '✨ AI ile Doldur',
    pr_auto_loading: 'Analiz ediliyor...',
    pr_auto_success: '✓ Form dolduruldu! Aşağıdan gözden geçir.',
    pr_auto_filled_note: 'AI formu doldurdu. Render etmeden önce istediğin alanı düzenleyebilirsin.',
    pr_auto_error_no_key: 'AI key bulunamadı. Ayarlar\'dan KIEAI_API_KEY veya OPENAI_API_KEY gir.',
    pr_product_name: 'Ürün Adı', pr_price: 'Fiyat', pr_original_price: 'Orijinal Fiyat',
    pr_currency: 'Para Birimi', pr_rating: 'Puan', pr_review_count: 'Yorum Sayısı',
    pr_image_url: 'Ürün Görseli URL', pr_gallery_urls: 'Galeri Görselleri (ek)',
    pr_category: 'Kategori', pr_platform: 'Platform',
    pr_pros: 'Avantajlar', pr_cons: 'Dezavantajlar', pr_score: 'Genel Puan (1-10)',
    pr_verdict: 'Değerlendirme', pr_cta: 'CTA Metni', pr_comments: 'Öne Çıkan Kullanıcı Yorumları',
    pr_add_item: '+ Ekle', pr_remove: 'Kaldır', pr_start_render: 'Render Başlat',
    pr_rendering: 'Render ediliyor...', pr_style: 'Görsel Stil', pr_format: 'Format',
    pr_channel: 'Kanal Adı', pr_basic_info: 'Temel Bilgiler', pr_details: 'Detaylar',
    pr_download: 'Videoyu İndir',
    pr_tts_title: '🎙️ Seslendirme (TTS)',
    pr_tts_hint: 'Ürün içeriğinden otomatik seslendirme oluştur veya kendi audio URL\'ini gir.',
    pr_tts_audio_url: 'Ses Dosyası URL (isteğe bağlı)',
    pr_tts_audio_url_ph: 'https://... veya aşağıdaki butonu kullan',
    pr_tts_generate_btn: 'Seslendirme Oluştur',
    pr_tts_generating: 'Oluşturuluyor...',
    pr_tts_show_script: 'Narrasyon metnini göster',
    bulletin_title: 'News Bulletin', bulletin_subtitle: 'RSS → AI narration → video broadcast',
    bulletin_tab_sources: '📡 Sources', bulletin_tab_draft: '📝 Draft', bulletin_tab_render: '🎬 Render',
    bulletin_add_source: 'Add RSS Source',
    bulletin_src_name: 'Name', bulletin_src_name_ph: 'e.g. BBC News',
    bulletin_src_url: 'RSS Feed URL',
    bulletin_src_category: 'Category', bulletin_src_category_ph: 'e.g. World, Economy, Tech',
    bulletin_src_lang: 'Language',
    bulletin_add_btn: '+ Add Source',
    bulletin_no_sources: 'No sources yet. Add an RSS feed URL above.',
    bulletin_max_items: 'Items per source',
    bulletin_lang_override: 'Language',
    bulletin_lang_auto: 'Auto (source default)',
    bulletin_fetch_btn: '🔄 Fetch & Draft',
    bulletin_fetching: 'Fetching…',
    bulletin_items_found: 'items fetched',
    bulletin_draft_empty: 'Click "Fetch & Draft" to pull the latest news from your sources.',
    bulletin_selected: 'items selected',
    bulletin_select_all: 'Select All', bulletin_deselect_all: 'Deselect All',
    bulletin_narration: 'Narration (editable)',
    bulletin_fetch_errors: 'Fetch errors',
    bulletin_proceed_render: '▶ Proceed to Render',
    bulletin_render_config: 'Render Configuration',
    bulletin_network_name: 'Network Name',
    bulletin_style: 'Visual Style',
    bulletin_format: 'Output Format',
    bulletin_fps: 'Frame Rate',
    bulletin_selected_items: 'Selected items for this bulletin',
    bulletin_no_items_selected: 'No items selected. Go to Draft tab and select items.',
    bulletin_render_btn: '🎬 Start Render',
    bulletin_rendering: 'Rendering…',
    bulletin_rendering_wait: 'Rendering in progress, please wait…',
    bulletin_render_status: 'Render Status',
    bulletin_render_done: '✓ Render complete! Download your bulletin below.',
    bulletin_download_btn: '⬇ Download MP4',
    bulletin_source_select: 'Source Selection',
    bulletin_src_all: 'All Sources',
    bulletin_src_selected: 'sources selected',
    bulletin_select_all_sources: 'Select all enabled sources',
    bulletin_active_preset: 'Active Channel Preset',
    bulletin_dedup_note: 'items already used in this channel and will be skipped.',
    bulletin_dedup_clear: 'Clear channel history',
    bulletin_category_mapping: 'Category → Visual Style Mapping',
    bulletin_mapping_hint: 'Automatically apply a specific visual style based on the news category. If unmapped, the global style is used.',
    // Navigation
    nav_api_keys: 'API Keys',
    api_keys_subtitle: 'Manage all service API keys in one place',
    api_keys_ai_section: 'AI / LLM Keys',
    api_keys_tts_section: 'Text-to-Speech Keys',
    api_keys_visuals_section: 'Visuals Keys',
    api_keys_link_hint: 'API keys are managed separately',
    api_keys_link_sub: 'Click to manage all API keys in one place',
    api_keys_go_btn: 'Go to API Keys →',
    // Dashboard module filter
    filter_module_label: 'Module:',
    filter_module_all: 'All',
    filter_module_yt_video: 'YT Video',
    filter_module_bulletin: 'Bulletin',
    filter_module_product_review: 'Product Review',
    // Module selector
    module_normal_title: '🎬 Normal Video',
    module_normal_desc: 'Generate a full 10-scene YouTube video from a topic or custom script using AI.',
    module_bulletin_title: '📺 News Bulletin',
    module_bulletin_desc: 'Create a professional live-style news broadcast from RSS feeds with lower thirds & ticker.',
    module_product_review_title: '🛒 Product Review',
    module_product_review_desc: 'Create affiliate/review videos from product URLs with AI autofill.',
    // Social Media Metadata
    section_social_meta: '📱 Social Media',
    social_meta_enabled_label: 'Generate social media metadata after render',
    social_meta_enabled_hint: 'After each render, a button will appear to generate platform-ready metadata.',
    social_meta_fields_title: 'Include fields',
    social_meta_field_title: 'Title',
    social_meta_field_description: 'Description',
    social_meta_field_tags: 'Tags',
    social_meta_field_source: 'Source',
    social_meta_field_link: 'Link',
    social_meta_master_prompt_label: 'Master Prompt (optional)',
    social_meta_prompt_placeholder: 'e.g. Write in a casual tone, target Turkish audience, use emojis...',
    social_meta_generate_btn: '📱 Generate Social Media Metadata',
    social_meta_generating: 'Generating...',
    social_meta_result_title: '📱 Social Media Metadata',
    social_meta_copy_btn: 'Copy All',
    social_meta_copied: '✓ Copied!',
    social_meta_settings_title: 'Social Media Metadata Settings',
    social_meta_settings_hint: 'Configure AI-generated metadata (title, description, tags) shown after each video render.',
    social_meta_fields_hint: 'These fields will be generated after every render where social media is enabled.',
    social_meta_prompt_hint: 'Applied to all modules. Module-specific context (product name, headline, script topic) is added automatically.',
    social_meta_modules_title: 'Enable per module',
    settings_module_social_meta: '📱 Social',
    nav_social_meta: 'Social Media',
    api_key_test_btn: 'Test',
    api_keys_save_note: 'Save before testing — test uses the currently saved key.',
    section_advanced: '⚙ Advanced Settings',
    section_advanced_hint: '(rarely changed — uses global TTS defaults)',
    // Bulletin Lower Third
    section_bulletin_lower_third: '📋 Lower Third',
    bulletin_lower_third_hint: 'The bar shown at the bottom with channel name / category label.',
    bulletin_lower_third_enabled_label: 'Show Lower Third',
    bulletin_lower_third_enabled_hint: 'Display a lower-third bar with text over each news item.',
    bulletin_lower_third_text_label: 'Lower Third Text Override',
    bulletin_lower_third_text_ph: 'e.g. BREAKING NEWS — leave empty to use network name',
    bulletin_lower_third_text_hint: 'If left empty, the network name from above is used.',
    bulletin_lower_third_font_label: 'Lower Third Font',
    bulletin_lower_third_color_label: 'Text Color',
    bulletin_lower_third_size_label: 'Font Size',
    // Bulletin Ticker
    section_bulletin_ticker: '📰 Ticker (Scrolling Headline Bar)',
    bulletin_ticker_hint: 'The bottom crawl bar that scrolls headlines continuously during the broadcast.',
    bulletin_ticker_enabled_label: 'Show Ticker',
    bulletin_ticker_enabled_hint: 'Display a scrolling news ticker at the very bottom of the screen.',
    bulletin_ticker_speed_label: 'Scroll Speed',
    bulletin_ticker_speed_slow: 'Slow',
    bulletin_ticker_speed_fast: 'Fast',
    bulletin_ticker_bg_label: 'Ticker Background',
    bulletin_ticker_color_label: 'Ticker Text Color',
    bulletin_show_live_label: 'Live On-Air Indicator',
    bulletin_show_live_hint: 'Show a pulsing red dot + "LIVE" label next to the network name.',
    // Bulletin Prompts
    section_bulletin_prompts: '✏️ Bulletin Master Prompt',
    bulletin_prompts_hint: 'Customize the AI prompt for generating bulletin narrations. Leave empty to use the built-in default. Changes take effect on the next run.',
    prompt_bulletin_narration_label: '1 · Bulletin Narration Prompt',
    prompt_bulletin_narration_hint: 'Controls how the AI summarizes and narrates news items for TTS.',
    anim_desc_hype: 'Zoom up', anim_desc_explosive: 'Slide left', anim_desc_vibrant: 'Pop', anim_desc_minimal: 'Fade', anim_desc_none: 'Static',
    settings_module_ytrobot: 'YTRobot', settings_module_bulletin: 'Bulletin', settings_module_product_review: 'Product Review',
    section_bulletin_tts: '🔊 Bulletin TTS', bulletin_tts_fallback_note: 'Override TTS settings for the Bulletin pipeline. Leave Provider empty to inherit the main TTS settings.',
    bulletin_tts_provider_label: 'TTS Provider', bulletin_tts_inherit: '— Inherit from YTRobot —',
    bulletin_tts_voice_label: 'Voice ID', bulletin_tts_default: '— Global Voice —',
    bulletin_tts_manual_voice_ph: 'Enter manual Voice ID...',
    bulletin_fetch_voices: 'Fetch Voices',
    bulletin_tts_speed_label: 'Speed', bulletin_tts_inherit_hint: 'Using inherited speed from YTRobot settings.',
    bulletin_tts_lang_label: 'TTS Language (Optional)',
    bulletin_tts_lang_placeholder: 'e.g. en, tr',
    bulletin_tts_lang_hint: 'Leave empty to inherit from global settings. Recommended to set "tr" for Turkish.',
    section_bulletin_presets: '⚙️ Channel Presets',
    bulletin_presets_hint: 'Save and reload complete channel configurations (name, style, colors, font, ticker settings) for quick switching between different broadcast styles.',
    bulletin_preset_name_ph: 'e.g. Breaking News Channel, Sports 9:16...',
    bulletin_preset_save_btn: 'Save Channel Preset',
    bulletin_preset_empty: 'No channel presets saved yet.',
    bulletin_narration_default_fallback: '(Loading default prompt...)',
    bulletin_style_sport: 'Sport', bulletin_style_finance: 'Finance',
    bulletin_style_weather: 'Weather', bulletin_style_science: 'Science',
    bulletin_style_entertainment: 'Entertainment', bulletin_style_dark: 'Dark Minimal',
    spesaudio_stability: 'Stability', spesaudio_similarity: 'Benzerlik Artışı', spesaudio_style: 'Stil',
    section_bulletin_visual: '🎨 Görsel Stil', bulletin_settings_network: 'Network Name', bulletin_settings_fps: 'FPS',
    section_bulletin_content: '📋 Content Defaults',
    bulletin_default_max_items_label: 'Default items per source', bulletin_default_lang_label: 'Default language',
    bulletin_default_lang_auto: 'Auto (source default)', bulletin_content_defaults_hint: 'These defaults are pre-filled when you open the Draft tab.',
    preview_font_sample: 'Hello World',
    save_modal_title: 'Save Settings',
    save_modal_desc: 'You have an active preset "%s". Where do you want to save these settings?',
    save_modal_global: 'Save Globally (Default)',
    save_modal_preset: 'Update Preset "%s"',
    save_modal_cancel: 'Cancel',
    settings_tab_tts: 'Voice',
    settings_tab_visuals: 'Visual & Effects',
    settings_tab_ai: 'AI & Script',
    settings_tab_social: 'Social Media',
    settings_tab_system: 'System',
    tts_default_section: 'Default Voice',
    tts_module_overrides: 'Module Overrides',
    tts_voice_library: 'Voice Library',
    visuals_source_section: 'Visual Source',
    visuals_compose_section: 'Composition & Effects',
    visuals_module_overrides: 'Module Style Overrides',
    ai_default_section: 'Default AI Settings',
    ai_module_section: 'Module Settings',
    system_output_section: 'Output Settings',
    system_subtitle_section: 'Subtitles',
    system_api_section: 'API Keys',
    module_yt_video: 'YT Video',
    module_bulletin: 'Bulletin',
    module_product_review: 'Product Review',
    override_hint_ytv: 'YT Video uses the default TTS settings.',
    override_hint_ytv_visuals: 'YT Video uses Remotion settings directly.',
    bulletin_override_label: 'Bulletin-specific setting (empty = use default)',
    pr_override_label: 'Product Review-specific setting (empty = use default)',
    go_to_api_keys: 'Go to API Keys Page',
    go_to_social_meta: 'Go to Social Media Tab',
  },
  tr: {
    app_subtitle: 'Otomatik Video Üretici',
    nav_dashboard: 'Panel', nav_new_video: 'Yeni Video', nav_settings: 'Ayarlar',
    sidebar_running: 'Çalışan', sidebar_completed: 'Tamamlanan', sidebar_total: 'Toplam',
    dashboard_title: 'Panel', dashboard_subtitle: 'Tüm video üretim oturumlarınız',
    dashboard_new_video: '+ Yeni Video',
    empty_title: 'Henüz video yok', empty_subtitle: 'İlk YouTube videonuzu üretmeye başlayın', empty_cta: 'İlk Videoyu Oluştur',
    steps_label: 'adım',
    status_queued: 'KUYRUKTA', status_running: 'ÇALIŞIYOR', status_completed: 'TAMAMLANDI', status_failed: 'BAŞARISIZ',
    status_stopped: 'DURDURULDU', status_paused: 'DURAKLATILDI',
    filter_all: 'Tümü', filter_running: 'Çalışan', filter_queued: 'Kuyrukta', filter_paused: 'Duraklatılan',
    filter_completed: 'Tamamlanan', filter_failed: 'Başarısız', filter_stopped: 'Durdurulan',
    btn_stop: 'Durdur', btn_pause: 'Duraklat', btn_resume: 'Devam Et',
    btn_restart: 'Yeniden Başlat', btn_delete: 'Sil',
    confirm_delete_msg: 'Bu oturum ve tüm dosyaları silinsin mi? Bu işlem geri alınamaz.',
    back: '← Geri',
    progress_title: 'Pipeline İlerlemesi', progress_complete: 'tamamlandı',
    live_log: 'Canlı Log', live: 'Canlı', done: 'Bitti', failed_label: 'Başarısız', waiting: 'Çıktı bekleniyor...',
    lines: 'satır',
    info: 'Bilgi', session_id: 'Oturum ID', started: 'Başladı', completed_at: 'Tamamlandı',
    output_file: 'Çıktı Dosyası', error: 'Hata',
    notes: 'Notlar', notes_placeholder: 'Buraya not ekleyin... (odak kaybında otomatik kaydeder)', notes_saved: '✓ Kaydedildi',
    yt_metadata: 'YouTube Meta Verileri', copy_all: 'Hepsini Kopyala', copied: '✓ Kopyalandı',
    title_label: 'BAŞLIK', desc_label: 'AÇIKLAMA', tags_label: 'ETİKETLER',
    new_video_title: 'Yeni Video', new_video_subtitle: 'Bir konu veya script dosyasından tam YouTube videosu üret',
    mode_topic: '💬 Konudan Üret', mode_script: '📄 Script Dosyası Kullan',
    topic_label: 'Video Konusu', topic_placeholder: 'örn. Antik Roma tarihi\nYeni başlayanlar için 10 Python ipucu...',
    topic_hint: 'Yapay zeka (Gemini 2.5 Flash) konunuzdan 10 sahneli tam bir script üretecek.',
    script_label: 'Script Dosya Yolu', script_placeholder: '/tam/yol/script.txt',
    script_hint: '.txt (paragraf başına bir sahne) veya .json formatı desteklenir.',
    error_topic: 'Lütfen bir video konusu girin.', error_script: 'Lütfen bir script dosya yolu girin.',
    submit: '🚀 Üretimi Başlat', submitting: 'Başlatılıyor...',
    pipeline_steps_title: 'Pipeline Adımları',
    pipeline_steps: ['Script üretimi','YouTube meta verileri','Metinden sese','Yapay zeka görseller','Altyazı hizalama','Video birleştirme'],
    settings_title: 'Ayarlar', settings_subtitle: 'API anahtarlarını ve pipeline yapılandırmasını yönetin',
    save_settings: 'Ayarları Kaydet', settings_saved: '✓ Ayarlar başarıyla kaydedildi',
    section_llm: '🧠 Script & Dil Modeli',
    kieai_key: 'KIE.AI API Anahtarı (Gemini 2.5 Flash — birincil)',
    openai_key: 'OpenAI API Anahtarı (yedek)', anthropic_key: 'Anthropic API Anahtarı',
    target_audience_label: 'Hedef Kitle (isteğe bağlı)',
    target_audience_placeholder: 'örn. 1.000 abonenin altındaki büyümek isteyen yeni başlayan YouTuberlar',
    target_audience_hint: 'Gemini bu bilgiyi script sesini, örnekleri ve sorun noktalarını kitlenize göre uyarlamak için kullanır.',
    script_humanize_label: 'Gemini Script İnsanlaştırma',
    script_humanize_hint: 'Oluşturulduktan sonra Gemini her sahneyi gerçek bir insan gibi yeniden yazar — yapay zeka klişelerini kaldırır, doğal konuşma ekler. TTS öncesi çalışır.',
    section_tts: '🔊 Metinden Sese', provider_label: 'Sağlayıcı',
    tts_speed_label: 'Konuşma Hızı',
    speed_slow: '0.75× — Yavaş', speed_slightly_slow: '0.9× — Biraz Yavaş',
    speed_normal: '1.0× — Normal (varsayılan)', speed_slightly_fast: '1.1× — Biraz Hızlı',
    speed_fast: '1.25× — Çok Hızlı', speed_very_fast: '1.5× — Çok Hızlı',
    spesh_key: 'Spesh Audio API Anahtarı', voice_id: 'Ses ID',
    language_setting: 'Dil (boş = otomatik algıla)', elevenlabs_key: 'ElevenLabs API Anahtarı',
    openai_voice_label: 'Ses',
    fetch_voices_btn: 'Sesleri Getir', voice_select_label: 'Ses Seçin',
    slider_expressive: 'İfadeli', slider_consistent: 'Tutarlı',
    slider_low: 'Düşük', slider_high: 'Yüksek',
    slider_none: 'Yok', slider_strong: 'Güçlü',
    spesh_voice_quality_title: 'Ses Kalitesi Ayarları',
    spesh_stability_label: 'Stabilite',
    spesh_similarity_label: 'Benzerlik Artışı',
    spesh_style_label: 'Stil',
    tts_enhance_label: 'Gemini TTS İyileştirme',
    tts_enhance_hint: 'Sentez öncesi BÜYÜK HARF vurgu ve "..." duraklamaları eklemek için ikinci bir Gemini geçişi — yapay zeka sesini daha doğal yapar.',
    toggle_on: 'Etkin', toggle_off: 'Devre Dışı',
    section_visuals: '🎨 Görseller', zimage_aspect: 'Z-Image En-Boy Oranı',
    pexels_key: 'Pexels API Anahtarı', pixabay_key: 'Pixabay API Anahtarı',
    section_subtitles: '💬 Altyazılar',
    subtitle_provider_label: 'Altyazı Motoru',
    subtitle_ffmpeg: 'FFmpeg — yumuşak parça gömme (hızlı, uyumlu)',
    subtitle_pycaps: 'pycaps — animasyonlu CSS altyazıları (stilli, daha yavaş)',
    pycaps_style_label: 'pycaps Stili',
    pycaps_note_title: 'pycaps animasyonlu altyazılar',
    pycaps_note_body: 'Chromium kullanarak CSS stilli animasyonlu altyazılar render eder. Video başına ~40-60 sn ek render süresi.',
    ffmpeg_note: 'Altyazıları yumuşak parça olarak gömer (altyazı parçası destekleyen oynatıcılarda görünür).',
    section_composer: '🎬 Video Birleştirici',
    composer_desc: 'Son videonun nasıl oluşturulacağını seçin.',
    composer_provider_label: 'Birleştirici Motor',
    composer_moviepy: 'MoviePy — Python/FFmpeg (varsayılan, kurulum gerekmez)',
    composer_remotion: 'Remotion — React renderer (Ken Burns, animasyonlar)',
    remotion_free: '(bireyler için ücretsiz)',
    remotion_concurrency_label: 'Render Eş Zamanlılığı (paralel thread)',
    ken_burns_zoom_label: 'Ken Burns Zoom Yoğunluğu',
    ken_burns_none: 'Yok (devre dışı)',
    ken_burns_subtle: 'Hafif (%5)',
    ken_burns_normal: 'Normal (%8) — Varsayılan',
    ken_burns_strong: 'Güçlü (%15)',
    ken_burns_direction_label: 'Ken Burns Yönü',
    kb_dir_center: 'Merkeze — merkeze doğru zoom',
    kb_dir_pan_left: 'Sola Pan → Sağa',
    kb_dir_pan_right: 'Sağa Pan → Sola',
    kb_dir_random: 'Rastgele köşeler (dönüşümlü)',
    remotion_subtitle_font_label: 'Altyazı Fontu',
    font_bebas: 'Bebas Neue — kalın/çarpıcı (YouTube popüler)',
    font_montserrat: 'Montserrat — kalın/temiz (trend)',
    font_oswald: 'Oswald — dar/güçlü',
    font_roboto: 'Roboto — modern/nötr',
    font_inter: 'Inter — temiz/minimal',
    font_serif: 'Georgia — sinematik/zarif',
    font_sans: 'Arial — sans-serif/sade',
    remotion_subtitle_size_label: 'Altyazı Boyutu',
    size_small: 'Küçük (28px)',
    size_medium: 'Orta (40px) — Varsayılan',
    size_large: 'Büyük (52px)',
    size_xlarge: 'Çok Büyük (64px)',
    remotion_subtitle_color_label: 'Altyazı Rengi',
    color_white: 'Beyaz',
    color_yellow: 'Sarı',
    color_cyan: 'Camgöbeği',
    color_orange: 'Turuncu',
    color_pink: 'Pembe',
    color_lime: 'Limon Yeşili',
    color_red: 'Kırmızı',
    subtitle_bg_label: 'Altyazı Arka Planı',
    subtitle_bg_none: 'Yok (sadece gölge)',
    subtitle_bg_box: 'Koyu Kutu',
    subtitle_bg_pill: 'Yuvarlak Pill',
    subtitle_stroke_label: 'Metin Çerçevesi/Stroke',
    stroke_none: 'Yok',
    stroke_thin: 'İnce (1px)',
    stroke_medium: 'Orta (2px)',
    stroke_thick: 'Kalın (3px)',
    video_effect_label: 'Video Efekti',
    effect_none: 'Yok',
    effect_vignette: 'Vignet — karanlık kenarlar',
    effect_warm: 'Sıcak — turuncu ton',
    effect_cool: 'Soğuk — mavi ton',
    effect_cinematic: 'Sinematik — letterbox çubuklar',
    remotion_transition_label: 'Sahne Geçiş Süresi',
    transition_none: 'Yok (anlık kesim)',
    transition_fast: 'Hızlı (8 kare)',
    transition_normal: 'Normal (12 kare) — Varsayılan',
    transition_slow: 'Yavaş (24 kare)',
    remotion_setup: 'İlk kurulum: proje klasöründe şu komutu çalıştırın:',
    remotion_features: 'Özellikler: Ken Burns efekti, yumuşak geçişler, SRT zamanlı altyazılar.',
    karaoke_enabled_label: 'Karaoke Vurgu',
    karaoke_color_label: 'Vurgu Rengi',
    subtitle_animation_label: 'Altyazı Animasyonu',
    subtitle_animation_hint: 'Pycaps ilhamli kelime bazlı karaoke animasyon stili.',
    tts_remove_apostrophes_label: 'Kesme İşaretlerini Kaldır',
    tts_remove_apostrophes_hint: "Mikro duraklamaları önlemek için TTS'e göndermeden önce ' karakterlerini siler (Türkçe ekler için güvenli).",
    tts_trim_silence_label: 'Sessizliği Kırp',
    tts_trim_silence_hint: 'Her ses dosyasının başındaki ve sonundaki sessizliği kaldırarak tempoyu sıkılaştırır.',
    section_output: '📁 Çıktı', output_dir_label: 'Çıktı Klasörü',
    resolution_label: 'Çözünürlük', fps_label: 'FPS',
    section_presets: '⚙️ Önayarlar',
    preset_name_placeholder: 'Önayar adı...',
    preset_save_btn: 'Önayarı Kaydet',
    preset_saved_ok: '✓ Kaydedildi!',
    preset_empty: 'Henüz önayar kaydedilmedi.',
    preset_load_btn: 'Yükle',
    preset_delete_btn: 'Sil',
    preset_run_label: 'Önayar',
    preset_run_default: 'Varsayılan (.env ayarları)',
    section_prompts: '✏️ Master Promptlar',
    prompts_hint: 'Varsayılan Gemini sistem promptlarını özelleştirin. Boş bırakırsanız yerleşik varsayılan kullanılır. Değişiklikler sonraki çalıştırmada etkin olur.',
    save_prompts_btn: 'Promptları Kaydet',
    prompts_saved: '✓ Promptlar kaydedildi',
    prompt_reset: 'Varsayılana sıfırla',
    prompt_script_label: '1 · Script Oluşturma Promptu',
    prompt_script_hint: '{audience} yer tutucusunu kullanın — Hedef Kitle ayarınızla değiştirilecek.',
    prompt_humanize_label: '2 · Script İnsanlaştırma Promptu',
    prompt_humanize_hint: 'Yapay zeka narrasyonunu gerçek bir insan gibi ses çıkaracak şekilde yeniden yazar. Yukarıdaki "Gemini Script Humanization" toggle ile etkinleştirin.',
    prompt_metadata_label: '3 · YouTube Meta Veri Promptu (başlık / açıklama / etiketler / thumbnail)',
    prompt_tts_enhance_label: '4 · TTS İyileştirme Promptu (BÜYÜK HARF vurgu, duraklamalar, ünlem)',
    prompt_view_default: '▸ Yerleşik varsayılanı görüntüle',
    prompt_loading: 'Yükleniyor...',
    prompt_default_placeholder: 'Yerleşik varsayılan promptu kullanmak için boş bırakın...',
    nav_bulletin: 'Bülten', nav_product_review: 'Ürün İnceleme',
    pr_title: 'Ürün İnceleme', pr_subtitle: 'Ürün inceleme / affiliate videoları oluşturun',
    pr_mode_manual: 'Manuel Giriş',
    pr_auto_title: '✨ Auto — URL ile AI Doldur',
    pr_auto_header_sub: 'Ürün linkini ver, AI tüm alanları otomatik doldursun',
    pr_manual_header_sub: 'Tüm ürün bilgilerini kendin gir ve videoyu render et',
    pr_auto_hint: 'Ürün sayfasının URL\'sini yapıştır — AI ürün bilgilerini, artı/eksileri, puanı ve değerlendirmeyi otomatik çıkarsın.',
    pr_product_url: 'Ürün Sayfası URL\'i',
    pr_url_placeholder: 'https://www.trendyol.com/...',
    pr_auto_prompt_label: 'Özel Talimatlar (isteğe bağlı)',
    pr_auto_prompt_ph: 'örn. Oyun özelliklerine odaklan, resmi dilde yaz...',
    pr_auto_fill_btn: '✨ AI ile Doldur',
    pr_auto_loading: 'Analiz ediliyor...',
    pr_auto_success: '✓ Form dolduruldu! Aşağıdan gözden geçir.',
    pr_auto_filled_note: 'AI formu doldurdu. Render etmeden önce istediğin alanı düzenleyebilirsin.',
    pr_auto_error_no_key: 'AI key bulunamadı. Ayarlar\'dan KIEAI_API_KEY veya OPENAI_API_KEY gir.',
    pr_product_name: 'Ürün Adı', pr_price: 'Fiyat', pr_original_price: 'Orijinal Fiyat',
    pr_currency: 'Para Birimi', pr_rating: 'Puan', pr_review_count: 'Yorum Sayısı',
    pr_image_url: 'Ürün Görseli URL', pr_gallery_urls: 'Galeri Görselleri (ek)',
    pr_category: 'Kategori', pr_platform: 'Platform',
    pr_pros: 'Avantajlar', pr_cons: 'Dezavantajlar', pr_score: 'Genel Puan (1-10)',
    pr_verdict: 'Değerlendirme', pr_cta: 'CTA Metni', pr_comments: 'Öne Çıkan Kullanıcı Yorumları',
    pr_add_item: '+ Ekle', pr_remove: 'Kaldır', pr_start_render: 'Render Başlat',
    pr_rendering: 'Render ediliyor...', pr_style: 'Görsel Stil', pr_format: 'Format',
    pr_channel: 'Kanal Adı', pr_basic_info: 'Temel Bilgiler', pr_details: 'Detaylar',
    pr_download: 'Videoyu İndir',
    pr_tts_title: '🎙️ Seslendirme (TTS)',
    pr_tts_hint: 'Ürün içeriğinden otomatik seslendirme oluştur veya kendi audio URL\'ini gir.',
    pr_tts_audio_url: 'Ses Dosyası URL (isteğe bağlı)',
    pr_tts_audio_url_ph: 'https://... veya aşağıdaki butonu kullan',
    pr_tts_generate_btn: 'Seslendirme Oluştur',
    pr_tts_generating: 'Oluşturuluyor...',
    pr_tts_show_script: 'Narrasyon metnini göster',
    bulletin_title: 'Haber Bülteni', bulletin_subtitle: 'RSS → Yapay zeka anlatımı → video yayını',
    bulletin_tab_sources: '📡 Kaynaklar', bulletin_tab_draft: '📝 Taslak', bulletin_tab_render: '🎬 Render',
    bulletin_add_source: 'RSS Kaynağı Ekle',
    bulletin_src_name: 'Ad', bulletin_src_name_ph: 'örn. BBC Türkçe',
    bulletin_src_url: 'RSS Besleme URL',
    bulletin_src_category: 'Kategori', bulletin_src_category_ph: 'örn. Dünya, Ekonomi, Teknoloji',
    bulletin_src_lang: 'Dil',
    bulletin_add_btn: '+ Kaynak Ekle',
    bulletin_no_sources: 'Henüz kaynak yok. Yukarıya bir RSS besleme URL ekleyin.',
    bulletin_max_items: 'Kaynak başına haber',
    bulletin_lang_override: 'Dil',
    bulletin_lang_auto: 'Otomatik (kaynak varsayılanı)',
    bulletin_fetch_btn: '🔄 Çek ve Taslak Oluştur',
    bulletin_fetching: 'Çekiliyor…',
    bulletin_items_found: 'haber çekildi',
    bulletin_draft_empty: 'En son haberleri kaynaklarınızdan çekmek için "Çek ve Taslak Oluştur" düğmesine tıklayın.',
    bulletin_selected: 'haber seçildi',
    bulletin_select_all: 'Tümünü Seç', bulletin_deselect_all: 'Seçimi Kaldır',
    bulletin_narration: 'Anlatım (düzenlenebilir)',
    bulletin_fetch_errors: 'Çekme hataları',
    bulletin_proceed_render: '▶ Render\'a Geç',
    bulletin_render_config: 'Render Yapılandırması',
    bulletin_network_name: 'Kanal Adı',
    bulletin_style: 'Görsel Stil',
    bulletin_format: 'Çıktı Formatı',
    bulletin_fps: 'Kare Hızı',
    bulletin_selected_items: 'Bu bülten için seçilen haberler',
    bulletin_no_items_selected: 'Haber seçilmedi. Taslak sekmesine gidip haber seçin.',
    bulletin_render_btn: '🎬 Renderi Başlat',
    bulletin_rendering: 'Render ediliyor…',
    bulletin_rendering_wait: 'Render devam ediyor, lütfen bekleyin…',
    bulletin_render_status: 'Render Durumu',
    bulletin_render_done: '✓ Render tamamlandı! Bülteninizi aşağıdan indirin.',
    bulletin_download_btn: '⬇ MP4 İndir',
    bulletin_source_select: 'Kaynak Seçimi',
    bulletin_src_all: 'Tüm Kaynaklar',
    bulletin_src_selected: 'kaynak seçildi',
    bulletin_select_all_sources: 'Tüm aktif kaynakları seç',
    bulletin_active_preset: 'Aktif Kanal Önayarı',
    bulletin_dedup_note: 'haber bu kanalda daha önce kullanıldı ve atlanacak.',
    bulletin_dedup_clear: 'Kanal geçmişini temizle',
    bulletin_category_mapping: 'Kategori → Görsel Stil Eşleştirme',
    bulletin_mapping_hint: 'Haber kategorisine göre otomatik olarak belirli bir görsel stil uygular. Eşleşme yoksa genel stil kullanılır.',
    // Navigasyon
    nav_api_keys: 'API Anahtarları',
    api_keys_subtitle: 'Tüm servis API anahtarlarını tek yerden yönet',
    api_keys_ai_section: 'AI / Dil Modeli Anahtarları',
    api_keys_tts_section: 'Seslendirme (TTS) Anahtarları',
    api_keys_visuals_section: 'Görsel Sağlayıcı Anahtarları',
    api_keys_link_hint: 'API anahtarları ayrı bir sayfada yönetilir',
    api_keys_link_sub: 'Tüm API anahtarlarını tek yerden yönetmek için tıklayın',
    api_keys_go_btn: 'API Anahtarlarına Git →',
    // Dashboard modül filtresi
    filter_module_label: 'Modül:',
    filter_module_all: 'Tümü',
    filter_module_yt_video: 'YT Video',
    filter_module_bulletin: 'Bülten',
    filter_module_product_review: 'Ürün İnceleme',
    // Module selector
    module_normal_title: '🎬 Normal Video',
    module_normal_desc: 'Bir konu veya özel script dosyasından yapay zeka ile tam 10 sahneli YouTube videosu üret.',
    module_bulletin_title: '📺 Haber Bülteni',
    module_bulletin_desc: 'RSS beslemelerinden lower third ve kayan yazılı profesyonel canlı haber yayını oluştur.',
    module_product_review_title: '🛒 Ürün İnceleme',
    module_product_review_desc: 'Ürün URL\'inden AI ile otomatik doldurulmuş inceleme videosu oluştur.',
    // Sosyal Medya Meta
    section_social_meta: '📱 Sosyal Medya',
    social_meta_enabled_label: 'Render sonrası sosyal medya metası oluştur',
    social_meta_enabled_hint: 'Her render tamamlandığında platform için hazır metadata oluşturma butonu çıkar.',
    social_meta_fields_title: 'Dahil edilecek alanlar',
    social_meta_field_title: 'Başlık',
    social_meta_field_description: 'Açıklama',
    social_meta_field_tags: 'Etiketler',
    social_meta_field_source: 'Kaynak',
    social_meta_field_link: 'Link',
    social_meta_master_prompt_label: 'Master Prompt (isteğe bağlı)',
    social_meta_prompt_placeholder: 'örn. Samimi bir ton kullan, Türk kitleye hitap et, emoji ekle...',
    social_meta_generate_btn: '📱 Sosyal Medya Metası Oluştur',
    social_meta_generating: 'Oluşturuluyor...',
    social_meta_result_title: '📱 Sosyal Medya Metası',
    social_meta_copy_btn: 'Tümünü Kopyala',
    social_meta_copied: '✓ Kopyalandı!',
    social_meta_settings_title: 'Sosyal Medya Meta Ayarları',
    social_meta_settings_hint: 'Her video render\'ı sonrası oluşturulacak yapay zeka meta verilerini (başlık, açıklama, etiketler) yapılandırın.',
    social_meta_fields_hint: 'Sosyal medya etkin olan her render\'da bu alanlar oluşturulacak.',
    social_meta_prompt_hint: 'Tüm modüllere uygulanır. Her modülün kendi bağlamı (ürün adı, manşet, konu) otomatik eklenir.',
    social_meta_modules_title: 'Modül bazında etkinleştir',
    settings_module_social_meta: '📱 Sosyal',
    nav_social_meta: 'Sosyal Medya',
    api_key_test_btn: 'Test',
    api_keys_save_note: 'Test etmeden önce kaydedin — test, kayıtlı anahtarı kullanır.',
    section_advanced: '⚙ Gelişmiş Ayarlar',
    section_advanced_hint: '(nadir değiştirilir — global TTS varsayılanlarını kullanır)',
    // Bulletin Lower Third
    section_bulletin_lower_third: '📋 Lower Third (Alt Şerit)',
    bulletin_lower_third_hint: 'Her haber öğesinin altında gösterilen kanal adı / kategori şeridi.',
    bulletin_lower_third_enabled_label: 'Lower Third Göster',
    bulletin_lower_third_enabled_hint: 'Her haber öğesinin üzerinde metin bulunan alt şeridi göster.',
    bulletin_lower_third_text_label: 'Lower Third Metin Geçersiz Kılma',
    bulletin_lower_third_text_ph: 'örn. SON DAKİKA — boş bırakırsanız kanal adı kullanılır',
    bulletin_lower_third_text_hint: 'Boş bırakılırsa yukarıdaki kanal adı kullanılır.',
    bulletin_lower_third_font_label: 'Lower Third Yazı Tipi',
    bulletin_lower_third_color_label: 'Metin Rengi',
    bulletin_lower_third_size_label: 'Font Boyutu',
    // Bulletin Ticker
    section_bulletin_ticker: '📰 Kayan Yazı (Alt Bant)',
    bulletin_ticker_hint: 'Yayın sırasında sürekli kayan manşetlerin göründüğü alt bant.',
    bulletin_ticker_enabled_label: 'Kayan Yazı Göster',
    bulletin_ticker_enabled_hint: 'Ekranın en altında kayan haber manşeti bandı göster.',
    bulletin_ticker_speed_label: 'Kaydırma Hızı',
    bulletin_ticker_speed_slow: 'Yavaş',
    bulletin_ticker_speed_fast: 'Hızlı',
    bulletin_ticker_bg_label: 'Kayan Yazı Arka Planı',
    bulletin_ticker_color_label: 'Kayan Yazı Metin Rengi',
    bulletin_show_live_label: 'Canlı/On-Air Göstergesi',
    bulletin_show_live_hint: 'Kanal adının yanında yanıp sönen kırmızı nokta + "CANLI" etiketi göster.',
    // Bulletin Prompts
    section_bulletin_prompts: '✏️ Bülten Master Promptu',
    bulletin_prompts_hint: 'Bülten anlatımları için yapay zeka promptunu özelleştirin. Boş bırakırsanız yerleşik varsayılan kullanılır.',
    prompt_bulletin_narration_label: '1 · Bülten Anlatım Promptu',
    prompt_bulletin_narration_hint: 'Yapay zekanın haber öğelerini TTS için nasıl özetleyip anlattığını kontrol eder.',
    anim_desc_hype: 'Zoom yukarı', anim_desc_explosive: 'Sola kaydır', anim_desc_vibrant: 'Pop', anim_desc_minimal: 'Solma', anim_desc_none: 'Statik',
    settings_module_ytrobot: 'YTRobot', settings_module_bulletin: 'Bülten', settings_module_product_review: 'Ürün İnceleme',
    section_bulletin_tts: '🔊 Bülten TTS', bulletin_tts_fallback_note: 'Bülten pipeline\'ı için TTS ayarlarını geçersiz kılın. Sağlayıcıyı boş bırakırsanız ana TTS ayarları devralınır.',
    bulletin_tts_provider_label: 'TTS Sağlayıcı', bulletin_tts_inherit: '— YTRobot\'tan Devral —',
    bulletin_tts_voice_label: 'Ses ID', bulletin_tts_default: '— Global Ses —',
    bulletin_tts_manual_voice_ph: 'Manuel Ses ID girin...',
    bulletin_fetch_voices: 'Sesleri Getir',
    bulletin_tts_speed_label: 'Hız', bulletin_tts_inherit_hint: 'YTRobot ayarlarından devralınan hız kullanılıyor.',
    bulletin_tts_lang_label: 'TTS Dili (İsteğe Bağlı)',
    bulletin_tts_lang_placeholder: 'örn. en, tr',
    bulletin_tts_lang_hint: 'Boş bırakılırsa global ayarlardan devralınır. Türkçe için "tr" olarak ayarlanması önerilir.',
    section_bulletin_presets: '⚙️ Kanal Önayarları',
    bulletin_presets_hint: 'Farklı yayın stilleri arasında hızlı geçiş için tam kanal yapılandırmalarını (ad, stil, renkler, font, kayan yazı ayarları) kaydedin ve yeniden yükleyin.',
    bulletin_preset_name_ph: 'örn. Son Dakika Kanalı, Spor 9:16...',
    bulletin_preset_save_btn: 'Kanal Önayarını Kaydet',
    bulletin_preset_empty: 'Henüz kanal önayarı kaydedilmedi.',
    bulletin_narration_default_fallback: '(Varsayılan prompt yükleniyor...)',
    bulletin_style_sport: 'Spor', bulletin_style_finance: 'Finans',
    bulletin_style_weather: 'Hava Durumu', bulletin_style_science: 'Bilim',
    bulletin_style_entertainment: 'Eğlence', bulletin_style_dark: 'Koyu Minimal',
    spesaudio_stability: 'Stabilite', spesaudio_similarity: 'Benzerlik Artışı', spesaudio_style: 'Stil',
    section_bulletin_visual: '🎨 Görsel Stil', bulletin_settings_network: 'Kanal Adı', bulletin_settings_fps: 'FPS',
    section_bulletin_content: '📋 İçerik Varsayılanları',
    bulletin_default_max_items_label: 'Kaynak başına varsayılan haber', bulletin_default_lang_label: 'Varsayılan dil',
    bulletin_default_lang_auto: 'Otomatik (kaynak varsayılanı)', bulletin_content_defaults_hint: 'Bu varsayılanlar Taslak sekmesini açtığınızda otomatik doldurulur.',
    preview_font_sample: 'Merhaba Dünya',
    save_modal_title: 'Ayarları Kaydet',
    save_modal_desc: '"%s" adlı aktif bir önayar var. Bu ayarları nereye kaydetmek istersiniz?',
    save_modal_global: 'Global (Varsayılan) Olarak Kaydet',
    save_modal_preset: '"%s" Önayarını Güncelle',
    save_modal_cancel: 'İptal',
    settings_tab_tts: 'Seslendirme',
    settings_tab_visuals: 'Görsel & Efekt',
    settings_tab_ai: 'AI & Script',
    settings_tab_social: 'Sosyal Medya',
    settings_tab_system: 'Sistem',
    tts_default_section: 'Global Seslendirme',
    tts_module_overrides: 'Modül Overrideları',
    tts_voice_library: 'Ses Kütüphanesi',
    visuals_source_section: 'Görsel Kaynak',
    visuals_compose_section: 'Kompozisyon & Efektler',
    visuals_module_overrides: 'Modül Stil Overrideları',
    ai_default_section: 'Global AI Ayarları',
    ai_module_section: 'Modül Bazlı Ayarlar',
    system_output_section: 'Çıktı Ayarları',
    system_subtitle_section: 'Altyazı',
    system_api_section: 'API Anahtarları',
    module_yt_video: 'YT Video',
    module_bulletin: 'Bülten',
    module_product_review: 'Ürün İnceleme',
    override_hint_ytv: 'YT Video varsayılan TTS ayarlarını kullanır.',
    override_hint_ytv_visuals: 'YT Video Remotion ayarlarını doğrudan kullanır.',
    bulletin_override_label: 'Bülten için farklı ayar (boş = global kullanılır)',
    pr_override_label: 'Ürün İnceleme için farklı ayar (boş = global kullanılır)',
    go_to_api_keys: 'API Anahtarları Sayfasına Git',
    go_to_social_meta: 'Sosyal Medya Sekmesine Git',
  }
};

// ── App ──────────────────────────────────────────────────────────────────────
function app() {
  return {
    lang: localStorage.getItem('ytrobot-lang') || 'en',
    view: 'dashboard', mode: 'topic',
    videoModule: 'normal',
    sessions: [], currentSession: null, settings: {}, prompts: {}, promptDefaults: {},
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
    bulletinTextMode: 'per_scene',   // 'per_scene' | 'single_chunk'
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
    prAutoGenerateTTS: true,  // Auto-generate TTS on render if audio missing
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

    t(key) { return LANG[this.lang]?.[key] ?? LANG.en[key] ?? key; },
    setLang(l) { this.lang = l; localStorage.setItem('ytrobot-lang', l); },

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
        const r = await fetch('/api/sessions');
        this.sessions = await r.json();
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
        const r = await fetch('/api/run', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
        if (!r.ok) { this.runError = (await r.json()).detail || 'Request failed'; return; }
        const { session_id } = await r.json();
        this.newTopic = ''; this.newScriptFile = '';
        await this.loadSessions();
        const session = this.sessions.find(s => s.id === session_id);
        if (session) this.openSession(session);
      } catch(e) { this.runError = e.message; }
      finally { this.submitting = false; }
    },

    async loadSettings() {
      const r = await fetch('/api/settings');
      this.settings = await r.json();
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
      await fetch('/api/settings', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ values: this.settings }) });
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
        const r = await fetch('/api/prompts');
        if (r.ok) {
          this.prompts = await r.json();
          if (!('bulletin_narration' in this.prompts)) this.prompts.bulletin_narration = '';
        }
      } catch(e) { console.error('loadPrompts /api/prompts error:', e); }
      try {
        const rd = await fetch('/api/prompts/defaults');
        if (rd.ok) this.promptDefaults = await rd.json();
        else console.error('loadPrompts /api/prompts/defaults status:', rd.status, await rd.text());
      } catch(e) { console.error('loadPrompts /api/prompts/defaults error:', e); }
    },

    async savePrompts() {
      await fetch('/api/prompts', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ prompts: this.prompts }) });
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
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: this.settings }),
      });
      keyTests[provider] = 'loading';
      keyTests[provider + '_msg'] = '';
      try {
        const r = await fetch(`/api/test-key/${provider}`, { method: 'POST' });

        // Check if response is JSON
        const contentType = r.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await r.text();
          keyTests[provider] = 'error';
          keyTests[provider + '_msg'] = `Server hatası (HTTP ${r.status}): ${text.substring(0, 100)}`;
          return;
        }

        const data = await r.json();
        keyTests[provider] = data.status === 'ok' ? 'ok' : 'error';
        keyTests[provider + '_msg'] = data.message || '';
      } catch(err) {
        keyTests[provider] = 'error';
        keyTests[provider + '_msg'] = `Bağlantı hatası: ${err.message}`;
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
</script>
