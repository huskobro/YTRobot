// ── Session Detail Module Mixin ──────────────────────────────────────────────
// Returns state + methods for individual session/video detail view.
// Loaded via <script> tag; defines a global function.
function sessionMixin() {
  return {
    // ── State ──
    sessions: [],
    currentSession: null,
    notes: '',
    logLines: [],
    _sse: null, _sseConnecting: false,
    filter: 'all',
    dashboardModuleFilter: 'all',
    dashboardChannelFilter: 'all',
    metaCopied: false,
    // Dashboard summary (FAZ 3)
    dashboardSummary: { week: { total: 0, completed: 0, failed: 0, running: 0 }, channels: [], upcoming_calendar: [] },
    notesSaved: false,
    socialMetaLoading: false, socialMetaError: '', socialMetaResult: null, socialMetaCopied: false,
    seoResult: null,
    seoLoading: false,
    uploadModal: false,
    uploadForm: { channel_id: '', privacy: 'private', title: '', description: '', tags: '' },
    uploadProgress: 0,
    uploadStatus: '',
    uploadYoutubeUrl: '',
    editableMetadata: { title: '', description: '', tags: '' },
    metadataEditing: false,
    thumbnailGenerating: false,

    // ── Methods ──

    async loadSessions() {
      try {
        const oldSessions = JSON.parse(JSON.stringify(this.sessions || []));
        this.sessions = await this.apiFetch('/api/sessions');

        // Notify success sound for newly completed jobs
        this.sessions.forEach(s => {
          const old = oldSessions.find(o => o.id === s.id);
          if (old && old.status !== 'completed' && s.status === 'completed') {
            this.playSound('success');
          }
        });

        if (this.currentSession) {
          const u = this.sessions.find(s => s.id === this.currentSession.id);
          if (u) this.currentSession = u;
        }
      } catch(e) { console.warn('[poll] session refresh error:', e); }
    },

    async loadDashboardSummary() {
      try {
        this.dashboardSummary = await this.apiFetch('/api/stats/dashboard-summary');
      } catch(e) { console.warn('[loadDashboardSummary]', e); }
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

    progressPct(session) {
      if (!session?.steps) return 0;
      if (session.status === 'completed') return 100;
      const done = session.steps.filter(s => s.status === 'completed').length;
      return Math.round((done / session.steps.length) * 100);
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
      if (r.title) text += `BASLIK:\n${r.title}\n\n`;
      if (r.description) text += `ACIKLAMA:\n${r.description}\n\n`;
      if (r.tags && r.tags.length) text += `ETIKETLER:\n${Array.isArray(r.tags) ? r.tags.join(', ') : r.tags}\n\n`;
      if (r.source) text += `KAYNAK: ${r.source}\n`;
      if (r.link) text += `LINK: ${r.link}\n`;
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
        checks.push({ label: this.t('seo_keyword_match') || 'Keyword match', ok: false, msg: pct+'% '+(this.t('seo_overlap') || 'overlap')+' (ideal: >=50%)' });
      }
      const color = score >= 75 ? 'emerald' : score >= 50 ? 'amber' : 'red';
      return { score, checks, color };
    },
  };
}
