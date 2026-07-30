// Global settings for Vitest
// Import jest-dom to register matchers like toBeInTheDocument and others.
// v7+ no longer auto-extends via the root import; the /vitest entry wires the
// matchers into Vitest's expect explicitly.
import '@testing-library/jest-dom/vitest';
// Initialize i18n for all tests
import '@/client/i18n';
import { vi } from 'vitest';
import { DEFAULT_ALLOWED_TYPES } from '@/client/core/constants';

// Stub the network for the whole suite so the API client never hits a real
// server in jsdom. Individual tests still override behavior via vi.spyOn(api, ...)
// or vi.mock, which take precedence over this fallback.
function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

vi.stubGlobal('fetch', (input: RequestInfo | URL, _init?: RequestInit) => {
  const url =
    typeof input === 'string' ? input : input instanceof URL ? input.toString() : String(input);
  const path = (() => {
    try {
      return new URL(url, 'http://localhost').searchParams.get('path') || '/';
    } catch {
      return '/';
    }
  })();

  if (url.includes('/api/config')) {
    return Promise.resolve(
      jsonResponse({
        root: '/',
        rootMasked: false,
        maxUploadMB: 100,
        allowedTypes: DEFAULT_ALLOWED_TYPES,
        theme: 'light',
      })
    );
  }
  if (url.includes('/api/health')) return Promise.resolve(jsonResponse({ ok: true, root: '/' }));
  if (url.includes('/api/fs/list')) return Promise.resolve(jsonResponse({ path, items: [] }));
  if (url.includes('/api/fs/stat'))
    return Promise.resolve(jsonResponse({ path, isDir: true, size: 0, mtimeMs: 0 }));
  if (url.includes('/api/fs/mkdir'))
    return Promise.resolve(jsonResponse({ ok: true, path: '/', name: 'mock' }));
  if (url.includes('/api/fs/rename') || url.includes('/api/fs/delete'))
    return Promise.resolve(jsonResponse({ ok: true }));

  return Promise.resolve(jsonResponse({}));
});

// Polyfill localStorage for jsdom 29+ (file-based storage breaks clear/setItem).
// Class-based so vi.spyOn(window.localStorage.__proto__, ...) works correctly.
if (typeof window !== 'undefined') {
  class LocalStorageMock implements Storage {
    private store: Record<string, string> = {};
    get length() {
      return Object.keys(this.store).length;
    }
    key(index: number) {
      return Object.keys(this.store)[index] ?? null;
    }
    getItem(key: string) {
      return this.store[key] ?? null;
    }
    setItem(key: string, value: string) {
      this.store[key] = String(value);
    }
    removeItem(key: string) {
      delete this.store[key];
    }
    clear() {
      Object.keys(this.store).forEach((k) => delete this.store[k]);
    }
  }
  Object.defineProperty(window, 'localStorage', {
    value: new LocalStorageMock(),
    writable: true,
  });
}

// Polyfill matchMedia for Mantine (color scheme detection)
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) => {
    return {
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {}, // deprecated
      removeListener: () => {}, // deprecated
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    } as MediaQueryList;
  };
}

// Polyfill ResizeObserver for Mantine components in jsdom
if (typeof window !== 'undefined' && typeof (window as any).ResizeObserver === 'undefined') {
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  (window as any).ResizeObserver = ResizeObserver;
}

// Guard getComputedStyle against a jsdom 30 regression: resolving a `font-size`
// declared with calc() (as Mantine v9 does via `calc(... * var(--mantine-scale))`)
// throws deep in jsdom's CSS engine. This surfaces whenever Testing Library computes
// an accessible name (e.g. getByRole(..., { name })). We keep the real result when
// it works and fall back to an empty declaration only when jsdom throws, so the
// accessible-name algorithm can proceed instead of crashing the whole test.
if (typeof window !== 'undefined') {
  const nativeGetComputedStyle = window.getComputedStyle.bind(window);
  const emptyDeclaration = new Proxy(
    {
      getPropertyValue: () => '',
      getPropertyPriority: () => '',
      item: () => '',
      length: 0,
    },
    {
      get(target, prop) {
        if (prop in target) return (target as any)[prop];
        // Any longhand/shorthand access (e.g. .display, .visibility) resolves to ''
        return '';
      },
    }
  ) as unknown as CSSStyleDeclaration;

  window.getComputedStyle = ((elt: Element, pseudoElt?: string | null) => {
    try {
      return nativeGetComputedStyle(elt, pseudoElt ?? undefined);
    } catch {
      return emptyDeclaration;
    }
  }) as typeof window.getComputedStyle;
}
