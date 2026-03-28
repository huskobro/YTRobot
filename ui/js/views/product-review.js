// ── Product Review Module Mixin ──────────────────────────────────────────────
// Returns state + methods for the Product Review view.
// Loaded via <script> tag; defines a global function.
function productReviewMixin() {
  return {
    // ── State ──
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

    // ── Methods ──

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
          // rating (1-5 yıldız) → score (1-10) otomatik dönüşüm
          // Gerçek müşteri rating'i varsa her zaman onu kullan (LLM tahminine göre daha güvenilir)
          const rating = parseFloat(this.prForm.rating) || 0;
          if (rating > 0) {
            this.prForm.score = Math.round(rating * 2 * 10) / 10;
          }
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
  };
}
