import type { Alpine } from 'alpinejs';
import type { ThemeStore, LanguageStore } from './types';

declare global {
  var turnstile:
    | {
        render: (element: HTMLElement, options: { sitekey: string; theme: string; language: string }) => string;
        remove: (widgetId: string) => void;
        reset: (widgetId: string) => void;
      }
    | undefined;
  var onTurnstileLoad: (() => void) | undefined;
}

const contactForm = (Alpine: Alpine) => {
  Alpine.data('contactForm', (turnstileSiteKey: string) => ({
    status: 'idle',
    widgetId: null as string | null,

    init() {
      if (globalThis.turnstile === undefined) {
        globalThis.onTurnstileLoad = () => {
          this.renderTurnstile();
        };
      } else {
        this.renderTurnstile();
      }

      this.$watch('$store.theme.isDark', () => {
        if (this.widgetId && globalThis.turnstile !== undefined) {
          globalThis.turnstile.remove(this.widgetId);
          this.renderTurnstile();
        }
      });
    },

    renderTurnstile() {
      if (!this.$refs.turnstileContainer) return;

      const themeStore = Alpine.store('theme') as ThemeStore;
      const languageStore = Alpine.store('language') as LanguageStore;

      this.widgetId = globalThis.turnstile!.render(this.$refs.turnstileContainer, {
        sitekey: turnstileSiteKey,
        theme: themeStore.isDark ? 'dark' : 'light',
        language: languageStore.lang,
      });
    },

    destroy() {
      if (this.widgetId && globalThis.turnstile !== undefined) {
        globalThis.turnstile.remove(this.widgetId);
        this.widgetId = null;
      }
    },

    async submit() {
      this.status = 'submitting';

      const form = this.$refs.form as HTMLFormElement;
      const formData = new FormData(form);
      const actionUrl = form.action;

      try {
        const response = await fetch(actionUrl, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
          },
          body: formData,
        });

        if (response.ok) {
          this.status = 'success';
        } else {
          this.status = 'error';
        }
      } catch (e) {
        console.error(e);
        this.status = 'error';
      } finally {
        if (this.status === 'error' && this.widgetId && globalThis.turnstile !== undefined) {
          globalThis.turnstile.reset(this.widgetId);
        }
      }
    },
  }));
};

export default contactForm;
