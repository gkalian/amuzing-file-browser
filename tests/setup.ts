// Global settings for Vitest
// Import jest-dom, to use matchers like toBeInTheDocument and others.
import '@testing-library/jest-dom';
// Initialize i18n for all tests
import '@/client/i18n';

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
