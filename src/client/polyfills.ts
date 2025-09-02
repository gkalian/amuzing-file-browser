// React polyfill for production builds to fix use-callback-ref issues
import * as React from 'react';

// Ensure React is available globally for libraries that expect it
if (typeof window !== 'undefined') {
  (window as any).React = React;
}

// For Node.js environments (SSR)
if (typeof global !== 'undefined') {
  (global as any).React = React;
}

export {};
