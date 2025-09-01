// Global settings for Vitest
// Import jest-dom, to use matchers like toBeInTheDocument and others.
import '@testing-library/jest-dom';
// Initialize i18n for all tests
import '@/client/i18n';

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
