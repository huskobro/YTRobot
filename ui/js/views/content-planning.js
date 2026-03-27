// ── Content Planning Module Mixin ────────────────────────────────────────────
// Returns state + methods for Calendar, Playlists, Templates, A/B Testing, Scheduler.
// Loaded via <script> tag; defines a global function.
function contentPlanningMixin() {
  return {
    // ── State ──
    contentPlanningTab: 'calendar',

    // Scheduler
    scheduledVideos: [],
    schedulableVideos: [],
    bulkScheduleChannel: '',
    bulkScheduleInterval: '24',
    bulkScheduleStart: '',
    bulkScheduleSelected: [],
    bulkScheduleSelectedAll: false,

    // A/B Testing
    abTests: [],
    abTestModalOpen: false,
    abTestForm: { video_id: '', variants: ['', ''] },

    // Calendar
    calendarEntries: [],
    calendarMonth: new Date(),
    calendarModalOpen: false,
    calendarEditId: null,
    calendarForm: { title: '', topic: '', planned_date: '', status: 'idea', notes: '', channel_id: '_default' },
    calendarScheduleMode: false,
    calendarScheduleVideoId: '',
    calendarScheduleTime: '09:00',

    // Playlists
    playlists: [],
    selectedPlaylist: null,
    playlistModalOpen: false,
    playlistForm: { name: '', description: '', channel_id: '_default' },
    playlistAddVideoId: '',
    playlistBulkOpen: false,
    playlistBulkSelected: [],
    playlistAiLoading: false,

    // Templates
    templates: [],
    templateModalOpen: false,
    templateForm: { name: '', description: '', settings: '{}', channel_id: '_default' },
    templateFromSessionId: '',

    // ── Scheduler Methods ──

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
    async produceFromCalendar(entryId) {
      try {
        const resp = await fetch(`/api/calendar/${entryId}/produce`, { method: 'POST' });
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err.detail || `Hata (${resp.status})`);
        }
        const data = await resp.json();
        this.showToast(this.t('calendar_produce_started') || 'Video üretimi başladı!', 'success');
        this.playSound('pop');
        await this.loadSessions();
        await this.loadCalendarEntries();
        await this.loadDashboardSummary();
        // Open the new session
        const session = this.sessions.find(s => s.id === data.session_id);
        if (session) this.openSession(session);
      } catch(e) {
        console.error('[produceFromCalendar]', e);
        this.showToast(e.message || this.t('generic_error'), 'error');
      }
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
  };
}
