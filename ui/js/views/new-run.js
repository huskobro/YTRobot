// ── New Run / Wizard Module Mixin ────────────────────────────────────────────
// Returns state + methods for the video creation wizard.
// Loaded via <script> tag; defines a global function.
function newRunMixin() {
  return {
    // ── State ──
    newTopic: '', newScriptFile: '',
    mode: 'topic',
    videoModule: 'normal',
    submitting: false, runError: '',
    wizardStep: 1,
    wizardMaxSteps: 3,
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
    wizardMood: 'informative',
    wizardCaptions: 'karaoke',
    wizardTone: 'balanced',
    wizardStyle: 'dynamic',
    batchTopics: '',
    batchSubmitting: false,
    batchSubmitResult: null,
    batchError: '',
    wizardConfigOpen: false,
    wizardConfigSteps: [],
    wizardConfigDragIdx: -1,
    wizardConfigDragOverIdx: -1,

    // ── Methods ──

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
      if (module === 'normal') this.wizardMaxSteps = 5;
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
      return (this.wizardStepOrder || []).length || 16;
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
  };
}
