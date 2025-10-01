// Hook: keyboard navigation with ArrowUp/ArrowDown and Enter to open folder or select for preview
import { useEffect, useRef, useState } from 'react';
import type { FsItem } from '../../core/types';

function isTextInput(el: Element | null): boolean {
  const e = el as HTMLElement | null;
  if (!e) return false;
  if (e.isContentEditable) return true;
  const tag = (e.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  const role = (e.getAttribute && e.getAttribute('role')) || '';
  if (role && role.toLowerCase() === 'textbox') return true;
  return false;
}

export function useKeyboardNav(params: {
  items: FsItem[];
  selectedPaths: Set<string>;
  setSelectedPaths: (next: Set<string>) => void;
  onOpenDir: (path: string) => void;
  onGoUp?: () => void;
  enabled?: boolean;
}) {
  const { items, selectedPaths, setSelectedPaths, onOpenDir, onGoUp, enabled = true } = params;
  const [cursor, setCursor] = useState<number>(0);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  // Keep cursor in sync with selection or clamp when list changes
  useEffect(() => {
    const list = itemsRef.current;
    if (!list.length) {
      setCursor(0);
      return;
    }
    // If selection points to an item in current list, use that index; else clamp
    const sel = Array.from(selectedPaths || []);
    if (sel.length === 1) {
      const idx = list.findIndex((i) => i.path === sel[0]);
      if (idx >= 0) {
        setCursor(idx);
        return;
      }
    }
    setCursor((i) => Math.max(0, Math.min(i, list.length - 1)));
  }, [items, selectedPaths]);

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (isTextInput(document.activeElement)) return;
      if (e.key === 'Backspace') {
        if (!onGoUp) return;
        e.preventDefault();
        onGoUp();
        return;
      }
      const list = itemsRef.current;
      if (!list.length) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setCursor((i) => {
          const ni = Math.min(i + 1, list.length - 1);
          const it = list[ni];
          setSelectedPaths(new Set([it.path]));
          return ni;
        });
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setCursor((i) => {
          const ni = Math.max(i - 1, 0);
          const it = list[ni];
          setSelectedPaths(new Set([it.path]));
          return ni;
        });
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const it = list[cursor] || list[0];
        if (!it) return;
        if (it.isDir) {
          onOpenDir(it.path);
        } else {
          // Select single file; preview panel will open if image
          setSelectedPaths(new Set([it.path]));
        }
        return;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled, cursor, onOpenDir, onGoUp, setSelectedPaths]);
}
