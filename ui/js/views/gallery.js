// ── Gallery Module Mixin ─────────────────────────────────────────────────────
// Returns state + methods for the Video Gallery view.
// Loaded via <script> tag; defines a global function.
function galleryMixin() {
  return {
    // ── State ──
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
    videoPreviewOpen: false,
    videoPreviewUrl: '',

    // ── Methods ──

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

    previewVideo(sessionId) {
      this.videoPreviewUrl = `/api/sessions/${sessionId}/video`;
      this.videoPreviewOpen = true;
    },
  };
}
