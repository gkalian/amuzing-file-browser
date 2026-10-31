import { renderHook, fireEvent } from '@testing-library/react';
import { useKeyboardShortcuts } from '@/client/hooks/browser/useKeyboardShortcuts';
import type { FsItem } from '@/client/core/types';

const dir: FsItem = { name: 'dir', path: '/dir', isDir: true, size: 0, mtimeMs: 0, mime: null };
const file: FsItem = {
  name: 'a.txt',
  path: '/a.txt',
  isDir: false,
  size: 1,
  mtimeMs: 0,
  mime: 'text/plain',
};

function setup(overrides: Partial<Parameters<typeof useKeyboardShortcuts>[0]> = {}) {
  const params = {
    items: [dir, file],
    selectedPaths: new Set<string>(),
    setSelectedPaths: vi.fn(),
    onOpenDir: vi.fn(),
    onGoUp: vi.fn(),
    onDelete: vi.fn(),
    onRename: vi.fn(),
    ...overrides,
  };
  renderHook(() => useKeyboardShortcuts(params));
  return params;
}

const press = (key: string) => fireEvent.keyDown(window, { key });

describe('useKeyboardShortcuts', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('ArrowDown selects the next item', () => {
    const p = setup();
    press('ArrowDown');
    expect(p.setSelectedPaths).toHaveBeenLastCalledWith(new Set(['/a.txt']));
  });

  it('ArrowUp at the top keeps the first item selected', () => {
    const p = setup();
    press('ArrowUp');
    expect(p.setSelectedPaths).toHaveBeenLastCalledWith(new Set(['/dir']));
  });

  it('Enter opens a directory under the cursor', () => {
    const p = setup();
    press('Enter');
    expect(p.onOpenDir).toHaveBeenCalledWith('/dir');
  });

  it('Enter on a selected file selects it instead of opening', () => {
    const p = setup({ selectedPaths: new Set(['/a.txt']) });
    press('Enter');
    expect(p.onOpenDir).not.toHaveBeenCalled();
    expect(p.setSelectedPaths).toHaveBeenCalledWith(new Set(['/a.txt']));
  });

  it('Delete calls onDelete only when something is selected', () => {
    const empty = setup();
    press('Delete');
    expect(empty.onDelete).not.toHaveBeenCalled();
  });

  it('Delete with selection calls onDelete', () => {
    const p = setup({ selectedPaths: new Set(['/dir']) });
    press('Delete');
    expect(p.onDelete).toHaveBeenCalledTimes(1);
  });

  it('F2 calls onRename', () => {
    const p = setup();
    press('F2');
    expect(p.onRename).toHaveBeenCalledTimes(1);
  });

  it('Backspace goes up', () => {
    const p = setup();
    press('Backspace');
    expect(p.onGoUp).toHaveBeenCalledTimes(1);
  });

  it('Backspace in a non-empty input is left to the input', () => {
    const p = setup();
    const input = document.createElement('input');
    input.value = 'abc';
    document.body.appendChild(input);
    input.focus();
    press('Backspace');
    expect(p.onGoUp).not.toHaveBeenCalled();
  });

  it('Backspace in an empty input still goes up', () => {
    const p = setup();
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    press('Backspace');
    expect(p.onGoUp).toHaveBeenCalledTimes(1);
  });

  it('ignores navigation keys while typing in an input', () => {
    const p = setup({ selectedPaths: new Set(['/dir']) });
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    press('ArrowDown');
    press('Enter');
    press('Delete');
    expect(p.setSelectedPaths).not.toHaveBeenCalled();
    expect(p.onOpenDir).not.toHaveBeenCalled();
    expect(p.onDelete).not.toHaveBeenCalled();
  });

  it('ignores keys inside an element with role="textbox"', () => {
    const p = setup();
    const box = document.createElement('div');
    box.setAttribute('role', 'textbox');
    box.tabIndex = 0;
    document.body.appendChild(box);
    box.focus();
    press('F2');
    expect(p.onRename).not.toHaveBeenCalled();
  });

  it('does nothing for arrows and Enter when the list is empty', () => {
    const p = setup({ items: [] });
    press('ArrowDown');
    press('Enter');
    expect(p.setSelectedPaths).not.toHaveBeenCalled();
    expect(p.onOpenDir).not.toHaveBeenCalled();
  });

  it('does nothing when disabled', () => {
    const p = setup({ enabled: false, selectedPaths: new Set(['/dir']) });
    press('Backspace');
    press('Delete');
    press('F2');
    press('Enter');
    expect(p.onGoUp).not.toHaveBeenCalled();
    expect(p.onDelete).not.toHaveBeenCalled();
    expect(p.onRename).not.toHaveBeenCalled();
    expect(p.onOpenDir).not.toHaveBeenCalled();
  });
});
