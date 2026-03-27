// ── Analytics Module Mixin ───────────────────────────────────────────────────
// Returns state + methods for Pipeline Analytics, YouTube Analytics, Competitor, Audit.
// Loaded via <script> tag; defines a global function.
function analyticsMixin() {
  return {
    // ── State ──
    analyticsData: null,
    analyticsLoading: false,
    analyticsTab: 'pipeline',
    analyticsChannel: '',
    channelAnalytics: null,
    queueStatus: null,
    dashboardStats: { totalRenders: 0, successCount: 0, failCount: 0 },
    recentActivity: [],
    errorDetails: [],
    socialLog: [],
    competitorData: null,
    competitorLoading: false,
    competitorScanning: {},
    agActiveChannel: null,
    agStatusFilter: 'all',
    agMinScore: 0,
    agNewChannel: { id: '', name: '', language: 'Turkish', dna: 'Documentary', pull_count: 10, competitors: [] },
    agNewCompetitorId: '',
    agNewCompetitorName: '',
    _chartInstance: null,
    ytAnalytics: { channel: null, videos: [] },
    ytAnalyticsChannel: '_default',
    ytAnalyticsLoading: false,
    ytVideoDetail: null,
    auditLogs: [],
    auditCategory: '',
    auditOffset: 0,

    // ── Pipeline Analytics Methods ──

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
      // Enriched dashboard summary (FAZ 3)
      try { this.loadDashboardSummary(); } catch(e) {}
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

    // ── Competitor Methods ──

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

    // ── Chart ──

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

    downloadStatsCsv() {
      window.open('/api/stats/export-csv', '_blank');
    },

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

    // ── Channel Analytics ──

    async loadChannelAnalytics(channelId) {
      if (!channelId) { this.channelAnalytics = null; return; }
      try {
        const data = await this.apiFetch(`/api/channels/${channelId}/analytics`);
        this.channelAnalytics = data;
      } catch(e) { console.warn('[channelAnalytics]', e); this.channelAnalytics = null; }
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
  };
}
