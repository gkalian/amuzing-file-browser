// Hook: handles global Delete hotkey to trigger bulk delete
import { useEffect } from 'react';

function isTextInput(el: Element | null): boolean {
  const e = el as HTMLElement | null;
  if (!e) return false;
  if (e.isContentEditable) return true;
  const tag = (e.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  // Avoid triggering inside elements with role textbox
  const role = (e.getAttribute && e.getAttribute('role')) || '';
  if (role && role.toLowerCase() === 'textbox') return true;
  return false;
}

export function useDeleteHotkey(enabled: boolean, onDelete: () => void) {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Delete') return;
      // Ignore when focus is inside text inputs/editable elements
      if (isTextInput(document.activeElement)) return;
      e.preventDefault();
      onDelete();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled, onDelete]);
}
