import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import contactFormPlugin from '@scripts/contact-form';

const mockAlpine = {
  plugin: vi.fn(),
  data: vi.fn(),
  store: vi.fn(),
};

describe('contactForm data', () => {
  let mockTurnstile: any;
  let originalConsoleError: any;
  let originalFormData: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockTurnstile = {
      render: vi.fn().mockReturnValue('mock-widget-id'),
      reset: vi.fn(),
      remove: vi.fn(),
    };
    originalConsoleError = console.error;
    console.error = vi.fn();

    originalFormData = (globalThis as any).FormData;
    (globalThis as any).FormData = class FormData {
      append() {}
    };

    mockAlpine.store.mockImplementation((name: string, value?: any) => {
      if (value !== undefined) return;
      if (name === 'theme') return { isDark: false };
      if (name === 'language') return { lang: 'en' };
    });
  });

  afterEach(() => {
    delete (globalThis as any).turnstile;
    delete (globalThis as any).onTurnstileLoad;
    console.error = originalConsoleError;
    (globalThis as any).FormData = originalFormData;
    mockAlpine.store.mockReset();
  });

  it('initializes and sets onTurnstileLoad if turnstile is undefined', () => {
    contactFormPlugin(mockAlpine as any);
    const dataCall = mockAlpine.data.mock.calls.find((call: any) => call[0] === 'contactForm');
    const getContactFormData = dataCall?.[1];
    const contactForm = getContactFormData('test-site-key');

    contactForm.renderTurnstile = vi.fn();
    contactForm.$watch = vi.fn();

    contactForm.init();

    expect((globalThis as any).onTurnstileLoad).toBeDefined();
    expect(contactForm.renderTurnstile).not.toHaveBeenCalled();

    // Trigger callback
    (globalThis as any).onTurnstileLoad();
    expect(contactForm.renderTurnstile).toHaveBeenCalled();
  });

  it('initializes and calls renderTurnstile if turnstile is defined', () => {
    (globalThis as any).turnstile = mockTurnstile;
    contactFormPlugin(mockAlpine as any);
    const dataCall = mockAlpine.data.mock.calls.find((call: any) => call[0] === 'contactForm');
    const getContactFormData = dataCall?.[1];
    const contactForm = getContactFormData('test-site-key');

    contactForm.renderTurnstile = vi.fn();
    contactForm.$watch = vi.fn();

    contactForm.init();

    expect((globalThis as any).onTurnstileLoad).toBeUndefined();
    expect(contactForm.renderTurnstile).toHaveBeenCalled();
  });

  it('registers a $watch on theme and removes/re-renders turnstile when triggered', () => {
    contactFormPlugin(mockAlpine as any);
    const dataCall = mockAlpine.data.mock.calls.find((call: any) => call[0] === 'contactForm');
    const getContactFormData = dataCall?.[1];
    const contactForm = getContactFormData('test-site-key');

    contactForm.renderTurnstile = vi.fn();
    contactForm.$watch = vi.fn();
    contactForm.widgetId = 'existing-widget';

    contactForm.init();

    expect(contactForm.$watch).toHaveBeenCalledWith('$store.theme.isDark', expect.any(Function));

    // Trigger the watch callback
    const watchCallback = contactForm.$watch.mock.calls[0][1];

    // turnstile is undefined initially, so it shouldn't do anything
    watchCallback();

    // set turnstile
    (globalThis as any).turnstile = mockTurnstile;
    watchCallback();

    expect(mockTurnstile.remove).toHaveBeenCalledWith('existing-widget');
    expect(contactForm.renderTurnstile).toHaveBeenCalled();
  });

  it('renderTurnstile does nothing if $refs.turnstileContainer is missing', () => {
    contactFormPlugin(mockAlpine as any);
    const dataCall = mockAlpine.data.mock.calls.find((call: any) => call[0] === 'contactForm');
    const getContactFormData = dataCall?.[1];
    const contactForm = getContactFormData('test-site-key');

    contactForm.$refs = {};
    (globalThis as any).turnstile = mockTurnstile;

    contactForm.renderTurnstile();

    expect(mockTurnstile.render).not.toHaveBeenCalled();
  });

  it('renderTurnstile calls turnstile.render with correct parameters', () => {
    contactFormPlugin(mockAlpine as any);
    const dataCall = mockAlpine.data.mock.calls.find((call: any) => call[0] === 'contactForm');
    const getContactFormData = dataCall?.[1];
    const contactForm = getContactFormData('test-site-key');

    const mockContainer = {};
    contactForm.$refs = { turnstileContainer: mockContainer };
    (globalThis as any).turnstile = mockTurnstile;

    contactForm.renderTurnstile();

    expect(mockTurnstile.render).toHaveBeenCalledWith(mockContainer, {
      sitekey: 'test-site-key',
      theme: 'light',
      language: 'en',
    });
    expect(contactForm.widgetId).toBe('mock-widget-id');

    // Test dark theme
    mockAlpine.store.mockImplementation((name: string, value?: any) => {
      if (value !== undefined) return;
      if (name === 'theme') return { isDark: true };
      if (name === 'language') return { lang: 'fr' };
    });

    contactForm.renderTurnstile();
    expect(mockTurnstile.render).toHaveBeenCalledWith(mockContainer, {
      sitekey: 'test-site-key',
      theme: 'dark',
      language: 'fr',
    });
  });

  it('submit handles successful fetch', async () => {
    contactFormPlugin(mockAlpine as any);
    const dataCall = mockAlpine.data.mock.calls.find((call: any) => call[0] === 'contactForm');
    const getContactFormData = dataCall?.[1];
    const contactForm = getContactFormData('test-site-key');

    const mockForm = { action: 'https://example.com/submit' };
    contactForm.$refs = { form: mockForm };
    contactForm.widgetId = 'test-widget-id';
    (globalThis as any).turnstile = mockTurnstile;

    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });

    const submitPromise = contactForm.submit();

    expect(contactForm.status).toBe('submitting');

    await submitPromise;

    expect(globalThis.fetch).toHaveBeenCalledWith('https://example.com/submit', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: expect.any(FormData),
    });
    expect(contactForm.status).toBe('success');
    expect(mockTurnstile.reset).not.toHaveBeenCalled();
  });

  it('submit handles unsuccessful fetch', async () => {
    contactFormPlugin(mockAlpine as any);
    const dataCall = mockAlpine.data.mock.calls.find((call: any) => call[0] === 'contactForm');
    const getContactFormData = dataCall?.[1];
    const contactForm = getContactFormData('test-site-key');

    const mockForm = { action: 'https://example.com/submit' };
    contactForm.$refs = { form: mockForm };
    contactForm.widgetId = 'test-widget-id';
    (globalThis as any).turnstile = mockTurnstile;

    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false });

    await contactForm.submit();

    expect(contactForm.status).toBe('error');
    expect(mockTurnstile.reset).toHaveBeenCalledWith('test-widget-id');
  });

  it('submit handles fetch error (network error)', async () => {
    contactFormPlugin(mockAlpine as any);
    const dataCall = mockAlpine.data.mock.calls.find((call: any) => call[0] === 'contactForm');
    const getContactFormData = dataCall?.[1];
    const contactForm = getContactFormData('test-site-key');

    const mockForm = { action: 'https://example.com/submit' };
    contactForm.$refs = { form: mockForm };
    contactForm.widgetId = 'test-widget-id';
    (globalThis as any).turnstile = mockTurnstile;

    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    await contactForm.submit();

    expect(contactForm.status).toBe('error');
    expect(console.error).toHaveBeenCalledWith(expect.any(Error));
    expect(mockTurnstile.reset).toHaveBeenCalledWith('test-widget-id');
  });

  it('destroy calls turnstile.remove and clears widgetId if widgetId and turnstile are present', () => {
    contactFormPlugin(mockAlpine as any);
    const dataCall = mockAlpine.data.mock.calls.find((call: any) => call[0] === 'contactForm');
    const getContactFormData = dataCall?.[1];
    const contactForm = getContactFormData('test-site-key');

    contactForm.widgetId = 'test-widget-id';
    (globalThis as any).turnstile = mockTurnstile;

    contactForm.destroy();

    expect(mockTurnstile.remove).toHaveBeenCalledWith('test-widget-id');
    expect(contactForm.widgetId).toBeNull();
  });

  it('destroy does nothing if widgetId is null', () => {
    contactFormPlugin(mockAlpine as any);
    const dataCall = mockAlpine.data.mock.calls.find((call: any) => call[0] === 'contactForm');
    const getContactFormData = dataCall?.[1];
    const contactForm = getContactFormData('test-site-key');

    contactForm.widgetId = null;
    (globalThis as any).turnstile = mockTurnstile;

    contactForm.destroy();

    expect(mockTurnstile.remove).not.toHaveBeenCalled();
    expect(contactForm.widgetId).toBeNull();
  });

  it('destroy does nothing if turnstile is undefined', () => {
    contactFormPlugin(mockAlpine as any);
    const dataCall = mockAlpine.data.mock.calls.find((call: any) => call[0] === 'contactForm');
    const getContactFormData = dataCall?.[1];
    const contactForm = getContactFormData('test-site-key');

    contactForm.widgetId = 'test-widget-id';
    delete (globalThis as any).turnstile;

    contactForm.destroy();

    expect(mockTurnstile.remove).not.toHaveBeenCalled();
    expect(contactForm.widgetId).toBe('test-widget-id');
  });
});
