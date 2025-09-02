// Vite plugin to inject React globally for libraries that expect it
export function reactGlobalPlugin() {
  return {
    name: 'react-global',
    transformIndexHtml: {
      enforce: 'pre',
      transform(html) {
        return html.replace(
          '<head>',
          `<head>
  <script>
    // Inject React globally before any modules load
    window.React = null;
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = window.__REACT_DEVTOOLS_GLOBAL_HOOK__ || {};
  </script>`
        );
      }
    },
    generateBundle(options, bundle) {
      // Find the main entry chunk and prepend React global assignment
      for (const [, chunk] of Object.entries(bundle)) {
        if (chunk.type === 'chunk' && chunk.isEntry) {
          const reactImportRegex = /import\s+(?:\*\s+as\s+)?React(?:\s*,\s*\{[^}]*\})?\s+from\s+['"]react['"]/;
          if (reactImportRegex.test(chunk.code)) {
            chunk.code = chunk.code.replace(
              reactImportRegex,
              (match) => `${match}; window.React = React; if (typeof global !== 'undefined') global.React = React;`
            );
          }
        }
      }
    }
  };
}
