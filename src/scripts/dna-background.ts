import type { Alpine } from 'alpinejs';

type Point = { x: number; y: number; z: number };

const dnaBackground = (Alpine: Alpine) => {
  Alpine.data('dnaBackground', () => ({
    animId: 0,
    resizeHandler: null as (() => void) | null,
    visibilityObserver: null as IntersectionObserver | null,
    themeObserver: null as MutationObserver | null,
    isVisible: false,

    init() {
      const canvas = this.$el as HTMLCanvasElement;
      const container = canvas.parentElement;
      if (!container) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const reducedMotion = globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches;
      let dpr = Math.min(window.devicePixelRatio || 1, 2);
      let w = 0;
      let h = 0;
      let time = 0;

      // Helix config
      const pointsPerTurn = 24;
      const rungEvery = 3;
      const speed = reducedMotion ? 0.0004 : 0.0016;

      let helixAmplitude = 60;
      let horizontalGap = 0;
      let totalPoints = 0;
      let centerY = 0;
      let s1: Point[] = [];
      let s2: Point[] = [];
      let currentColor = getComputedStyle(canvas).color;

      this.themeObserver = new MutationObserver(() => {
        // Need to wait briefly for transition/classes to fully apply
        setTimeout(() => {
          currentColor = getComputedStyle(canvas).color;
        }, 50);
      });
      this.themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      });

      const resize = () => {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        const rect = container.getBoundingClientRect();
        w = rect.width;
        h = rect.height;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        helixAmplitude = Math.min(h * 0.28, 80);
        horizontalGap = w < 640 ? 18 : 22;
        totalPoints = Math.ceil((w + 200) / horizontalGap);
        centerY = h * 0.45;
        s1 = new Array(totalPoints);
        s2 = new Array(totalPoints);
        for (let i = 0; i < totalPoints; i++) {
          s1[i] = { x: 0, y: 0, z: 0 };
          s2[i] = { x: 0, y: 0, z: 0 };
        }
      };

      resize();
      this.resizeHandler = resize;
      window.addEventListener('resize', this.resizeHandler);

      function helixPoint(i: number, strandOffset: number, t: number, out: Point) {
        const angle = (i / pointsPerTurn) * Math.PI * 2 + t;
        out.x = i * horizontalGap - 100;
        out.y = centerY + Math.sin(angle + strandOffset) * helixAmplitude;
        out.z = Math.cos(angle + strandOffset);
      }

      const strandAlpha = 0.6;
      const rungAlpha = 0.4;
      const nodeAlpha = 0.75;

      const draw = () => {
        ctx.clearRect(0, 0, w, h);
        const t = time * speed;

        // Update helix points (reuse pre-allocated arrays)
        for (let i = 0; i < totalPoints; i++) {
          helixPoint(i, 0, t, s1[i]);
          helixPoint(i, Math.PI, t, s2[i]);
        }

        // Draw rungs (base pairs)
        ctx.strokeStyle = currentColor;
        for (let i = 0; i < totalPoints; i += rungEvery) {
          const a = s1[i],
            b = s2[i];
          const d = (a.z + b.z + 2) / 4;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.globalAlpha = rungAlpha * (0.35 + d * 0.65);
          ctx.lineWidth = 0.8 + d * 0.8;
          ctx.stroke();
        }

        // Draw strands with per-segment depth
        ctx.strokeStyle = currentColor;
        for (const strand of [s1, s2]) {
          for (let i = 1; i < strand.length; i++) {
            const p = strand[i - 1],
              q = strand[i];
            const d = (p.z + q.z + 2) / 4;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.globalAlpha = strandAlpha * (0.3 + d * 0.7);
            ctx.lineWidth = 1 + d * 1.5;
            ctx.stroke();
          }
        }

        // Draw nodes at rung endpoints
        ctx.fillStyle = currentColor;
        for (const strand of [s1, s2]) {
          for (let i = 0; i < strand.length; i += rungEvery) {
            const p = strand[i];
            const d = (p.z + 1) / 2;
            const r = 1.5 + d * 2;
            ctx.beginPath();
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            ctx.globalAlpha = nodeAlpha * (0.3 + d * 0.7);
            ctx.fill();
          }
        }

        ctx.globalAlpha = 1; // restore alpha
      };

      const loop = () => {
        if (!this.isVisible) return;
        time++;
        draw();
        this.animId = requestAnimationFrame(loop);
      };

      this.visibilityObserver = new IntersectionObserver((entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          if (!this.isVisible) {
            this.isVisible = true;
            loop();
          }
        } else {
          this.isVisible = false;
          if (this.animId) {
            cancelAnimationFrame(this.animId);
            this.animId = 0;
          }
        }
      });

      this.visibilityObserver.observe(canvas);
    },

    destroy() {
      if (this.animId) cancelAnimationFrame(this.animId);
      if (this.resizeHandler) window.removeEventListener('resize', this.resizeHandler);
      if (this.visibilityObserver) this.visibilityObserver.disconnect();
      if (this.themeObserver) this.themeObserver.disconnect();
      this.animId = 0;
      this.resizeHandler = null;
      this.visibilityObserver = null;
      this.themeObserver = null;
    },
  }));
};

export default dnaBackground;
