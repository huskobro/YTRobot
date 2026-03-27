// ── Channels Module Mixin ────────────────────────────────────────────────────
// Returns state + methods for the Channel Hub view.
// Loaded via <script> tag; defines a global function.
function channelsMixin() {
  return {
    // ── State ──
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

    // ── Master Prompt Templates ──
    _masterPromptTemplates: {
      educational: "Sen bu kanal için içerik üreten bir AI asistanısın.\n\n## Stil\n- Akademik ama anlaşılır dil kullan\n- Her konuyu günlük hayattan örneklerle açıkla\n- \"Biliyor muydunuz?\" gibi sorular sor\n\n## Yapı\n- Giriş: Hook + konu tanıtımı (30 saniye)\n- Gelişme: 3-5 başlık, her biri 1-2 dakika\n- Sonuç: Özet + izleyiciye soru\n\n## Ton\n- Heyecanlı ama sakin, bir öğretmen gibi\n- \"Siz\" hitabı kullan",
      entertainment: "Sen bu kanal için eğlence içeriği üreten bir AI asistanısın.\n\n## Stil\n- Enerjik ve samimi dil kullan\n- Mizah unsurlarını doğal şekilde ekle\n- İzleyiciyi sürekli meşgul tut\n\n## Yapı\n- Giriş: Güçlü hook, merak uyandır\n- Gelişme: Hızlı geçişler, kısa sahneler\n- Sonuç: Sürpriz final + CTA\n\n## Ton\n- Arkadaş gibi konuş\n- Günlük dil, argo OK",
      news: "Sen bu kanal için haber bülteni metni üreten bir AI asistanısın.\n\n## Stil\n- Profesyonel ve tarafsız dil\n- Kısa, öz cümleler\n- Kaynak belirt\n\n## Yapı\n- Giriş: Başlık haberi\n- Gelişme: Detaylar ve bağlam\n- Sonuç: Özet ve gelecek perspektifi\n\n## Ton\n- Ciddi ama anlaşılır\n- Duygusal yorum YAPMA",
      tech: "Sen bu kanal için teknoloji inceleme içeriği üreten bir AI asistanısın.\n\n## Stil\n- Teknik detayları anlaşılır şekilde anlat\n- Karşılaştırma ve benchmarklar ekle\n- Artılar ve eksiler dengeli sun\n\n## Yapı\n- Giriş: Ürün tanıtımı + ilk izlenim\n- Gelişme: Özellikler, performans, kullanım\n- Sonuç: Kime önerilir + puan\n\n## Ton\n- Bilgili ama kibirli değil\n- Samimi uzman havası"
    },

    applyMasterPromptTemplate(templateKey) {
      if (!templateKey) return;
      const tpl = this._masterPromptTemplates[templateKey];
      if (tpl) this.channelForm.master_prompt = tpl;
    },

    // ── Methods ──

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
  };
}
