// Hook: unified keyboard shortcuts for file browser
// Handles: ArrowUp/ArrowDown (move selection), Enter (open dir/select file),
// Delete (bulk delete), Backspace (go up), F2 (rename)
import { useEffect, useRef, useState } from 'react';
import type { FsItem } from '../../core/types';

function isTextInput(el: Element | null): boolean {
  const e = el as HTMLElement | null;
  if (!e) return false;
  if ((e as any).isContentEditable) return true;
  const tag = (e.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  const role = (e.getAttribute && e.getAttribute('role')) || '';
  if (role && role.toLowerCase() === 'textbox') return true;
  return false;
}

export function useKeyboardShortcuts(params: {
  items: FsItem[];
  selectedPaths: Set<string>;
  setSelectedPaths: (next: Set<string>) => void;
  onOpenDir: (path: string) => void;
  onGoUp: () => void;
  onDelete: () => void;
  onRename: () => void;
  enabled?: boolean;
}) {
  const {
    items,
    selectedPaths,
    setSelectedPaths,
    onOpenDir,
    onGoUp,
    onDelete,
    onRename,
    enabled = true,
  } = params;
  const [cursor, setCursor] = useState<number>(0);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  // Sync cursor when selection or items change
  useEffect(() => {
    const list = itemsRef.current;
    if (!list.length) {
      setCursor(0);
      return;
    }
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
      const active = document.activeElement as HTMLElement | null;

      // Backspace: navigate up (allow in empty inputs)
      if (e.key === 'Backspace') {
        // If focused element is a text input with non-empty value, let default deletion happen
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
          const asAny = active as unknown as { value?: string };
          const val = (asAny.value ?? '').toString();
          if (val.length > 0) return;
        }
        // contentEditable -> don't hijack
        if (active && (active as any).isContentEditable) return;
        e.preventDefault();
        e.stopPropagation();
        onGoUp();
        return;
      }

      // Ignore other keys when typing in inputs
      if (isTextInput(active)) return;
      const list = itemsRef.current;

      if (e.key === 'Delete') {
        if (selectedPaths.size === 0) return;
        e.preventDefault();
        onDelete();
        return;
      }

      if (!list.length) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setCursor((i) => {
          const ni = Math.min(i + 1, list.length - 1);
          const it = list[ni];
          if (it) setSelectedPaths(new Set([it.path]));
          return ni;
        });
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setCursor((i) => {
          const ni = Math.max(i - 1, 0);
          const it = list[ni];
          if (it) setSelectedPaths(new Set([it.path]));
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
          setSelectedPaths(new Set([it.path]));
        }
        return;
      }

      if (e.key === 'F2') {
        e.preventDefault();
        onRename();
        return;
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled, cursor, onOpenDir, onGoUp, onDelete, onRename, selectedPaths, setSelectedPaths]);
}
