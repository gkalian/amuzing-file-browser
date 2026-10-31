import { renderHook, act } from '@testing-library/react';
import { useModalsController } from '@/client/hooks/modals/useModalsController';
import type { FsItem } from '@/client/core/types';

const target: FsItem = {
  name: 'old.txt',
  path: '/old.txt',
  isDir: false,
  size: 1,
  mtimeMs: 0,
  mime: 'text/plain',
};

function setup() {
  const params = {
    onMkdir: vi.fn(),
    onRename: vi.fn(),
    onMove: vi.fn(),
    afterRenameSuccess: vi.fn(),
    settings: {
      opened: false,
      open: vi.fn(),
      close: vi.fn(),
      cfgRoot: '/root',
      setCfgRoot: vi.fn(),
      cfgMaxUpload: 100,
      setCfgMaxUpload: vi.fn(),
      cfgAllowedTypes: 'image/*',
      setCfgAllowedTypes: vi.fn(),
      theme: 'light' as const,
      setTheme: vi.fn(),
      showPreview: true,
      setShowPreview: vi.fn(),
    },
  };
  const hook = renderHook(() => useModalsController(params));
  return { params, hook };
}

describe('useModalsController', () => {
  it('mkdir: opens, creates with trimmed name, then resets and closes', async () => {
    const { params, hook } = setup();
    act(() => hook.result.current.api.openMkdir());
    expect(hook.result.current.mkdir.opened).toBe(true);

    act(() => hook.result.current.mkdir.setName('  new  '));
    await act(() => hook.result.current.mkdir.onCreate());

    expect(params.onMkdir).toHaveBeenCalledWith('new');
    expect(hook.result.current.mkdir.opened).toBe(false);
    expect(hook.result.current.mkdir.name).toBe('');
  });

  it('mkdir: blank name is ignored', async () => {
    const { params, hook } = setup();
    act(() => hook.result.current.api.openMkdir());
    act(() => hook.result.current.mkdir.setName('   '));
    await act(() => hook.result.current.mkdir.onCreate());
    expect(params.onMkdir).not.toHaveBeenCalled();
    expect(hook.result.current.mkdir.opened).toBe(true);
  });

  it('mkdir: onClose closes the modal', () => {
    const { hook } = setup();
    act(() => hook.result.current.api.openMkdir());
    act(() => hook.result.current.mkdir.onClose());
    expect(hook.result.current.mkdir.opened).toBe(false);
  });

  it('rename: opens prefilled with the current name', () => {
    const { hook } = setup();
    act(() => hook.result.current.api.openRename(target));
    expect(hook.result.current.rename.opened).toBe(true);
    expect(hook.result.current.rename.name).toBe('old.txt');
  });

  it('rename: submits trimmed name, closes and calls afterRenameSuccess', async () => {
    const { params, hook } = setup();
    act(() => hook.result.current.api.openRename(target));
    act(() => hook.result.current.rename.setName(' new.txt '));
    await act(() => hook.result.current.rename.onRename());

    expect(params.onRename).toHaveBeenCalledWith(target, 'new.txt');
    expect(params.afterRenameSuccess).toHaveBeenCalledWith(target);
    expect(hook.result.current.rename.opened).toBe(false);
  });

  it('rename: does nothing without a target or with a blank name', async () => {
    const { params, hook } = setup();
    await act(() => hook.result.current.rename.onRename());
    act(() => hook.result.current.api.openRename(target));
    act(() => hook.result.current.rename.setName(''));
    await act(() => hook.result.current.rename.onRename());
    expect(params.onRename).not.toHaveBeenCalled();
  });

  it('rename: onClose closes the modal', () => {
    const { hook } = setup();
    act(() => hook.result.current.api.openRename(target));
    act(() => hook.result.current.rename.onClose());
    expect(hook.result.current.rename.opened).toBe(false);
  });

  it('move: opens with initial destination, moves and resets', async () => {
    const { params, hook } = setup();
    act(() => hook.result.current.api.openMove('/dest'));
    expect(hook.result.current.move.opened).toBe(true);
    expect(hook.result.current.move.dest).toBe('/dest');

    await act(() => hook.result.current.move.onMove());
    expect(params.onMove).toHaveBeenCalledWith('/dest');
    expect(hook.result.current.move.opened).toBe(false);
    expect(hook.result.current.move.dest).toBe('');
  });

  it('move: blank destination is ignored; onClose closes', async () => {
    const { params, hook } = setup();
    act(() => hook.result.current.api.openMove(''));
    await act(() => hook.result.current.move.onMove());
    expect(params.onMove).not.toHaveBeenCalled();
    act(() => hook.result.current.move.onClose());
    expect(hook.result.current.move.opened).toBe(false);
  });

  it('settings: passes through the external controller', () => {
    const { params, hook } = setup();
    const s = hook.result.current.settings;
    expect(s.cfgRoot).toBe('/root');
    expect(s.cfgMaxUpload).toBe(100);
    expect(s.theme).toBe('light');
    hook.result.current.api.openSettings();
    s.onClose();
    expect(params.settings.open).toHaveBeenCalled();
    expect(params.settings.close).toHaveBeenCalled();
  });
});
