// Basic tests for useFsActions: mkdir/rename/bulkDelete/bulkMove happy paths
// and simple failure handling, against a mocked apiClient.
import { renderHook, act } from '@testing-library/react';
import { useFsActions } from '@/client/hooks/data/useFsActions';
import type { FsItem } from '@/client/core/types';

vi.mock('@/client/services/apiClient', async (orig) => {
  const actual = await (orig as any)();
  return {
    ...actual,
    api: {
      ...actual.api,
      mkdir: vi.fn(),
      rename: vi.fn(),
      delete: vi.fn(),
      stat: vi.fn(),
    },
  };
});

vi.mock('@/client/core/notify', () => ({
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
  notifyInfo: vi.fn(),
}));

import { api } from '@/client/services/apiClient';
import { notifySuccess, notifyError } from '@/client/core/notify';

// Minimal translate stub: returns defaultValue with {{placeholders}} interpolated
function t(key: string, opts?: Record<string, unknown>) {
  let s = (opts?.defaultValue as string) || key;
  for (const k of Object.keys(opts || {})) {
    if (k === 'defaultValue') continue;
    s = s.replace(`{{${k}}}`, String((opts as any)[k]));
  }
  return s;
}

function setup(items: FsItem[] = []) {
  const loadList = vi.fn().mockResolvedValue(undefined);
  const { result } = renderHook(() => useFsActions({ cwd: '/photos', items, loadList, t }));
  return { result, loadList };
}

describe('useFsActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('mkdir creates a folder under cwd and refreshes the list', async () => {
    (api.mkdir as any).mockResolvedValue({ ok: true, path: '/photos/New', name: 'New' });
    const { result, loadList } = setup();

    await act(async () => {
      await result.current.mkdir('New');
    });

    expect(api.mkdir).toHaveBeenCalledWith('/photos/New');
    expect(loadList).toHaveBeenCalledWith('/photos');
    expect(notifySuccess).toHaveBeenCalled();
  });

  it('mkdir does nothing for a blank name', async () => {
    const { result, loadList } = setup();

    await act(async () => {
      await result.current.mkdir('   ');
    });

    expect(api.mkdir).not.toHaveBeenCalled();
    expect(loadList).not.toHaveBeenCalled();
  });

  it('mkdir notifies and rethrows on failure', async () => {
    (api.mkdir as any).mockRejectedValue(new Error('disk full'));
    const { result } = setup();

    await expect(
      act(async () => {
        await result.current.mkdir('New');
      })
    ).rejects.toThrow('disk full');

    expect(notifyError).toHaveBeenCalled();
  });

  it('rename moves an item to its new name within the same folder', async () => {
    (api.rename as any).mockResolvedValue({ ok: true });
    const item: FsItem = {
      name: 'a.txt',
      path: '/photos/a.txt',
      isDir: false,
      size: 1,
      mtimeMs: 0,
      mime: 'text/plain',
    };
    const { result, loadList } = setup([item]);

    await act(async () => {
      await result.current.rename(item, 'b.txt');
    });

    expect(api.rename).toHaveBeenCalledWith('/photos/a.txt', '/photos/b.txt');
    expect(loadList).toHaveBeenCalledWith('/photos');
  });

  it('bulkDelete reports partial success and failure counts', async () => {
    (api.delete as any).mockImplementation((p: string) =>
      p === '/photos/bad.txt' ? Promise.reject(new Error('locked')) : Promise.resolve({ ok: true })
    );
    const { result, loadList } = setup();

    let outcome: { ok: number; fail: number } | undefined;
    await act(async () => {
      outcome = await result.current.bulkDelete(new Set(['/photos/a.txt', '/photos/bad.txt']));
    });

    expect(outcome).toEqual({ ok: 1, fail: 1 });
    expect(api.delete).toHaveBeenCalledTimes(2);
    expect(loadList).toHaveBeenCalledWith('/photos');
    expect(notifySuccess).toHaveBeenCalled();
    expect(notifyError).toHaveBeenCalled();
  });

  it('bulkMove moves items into an existing destination folder', async () => {
    const item: FsItem = {
      name: 'a.txt',
      path: '/photos/a.txt',
      isDir: false,
      size: 1,
      mtimeMs: 0,
      mime: 'text/plain',
    };
    // '/archive' already exists as a folder; the candidate target file does not.
    (api.stat as any).mockImplementation((p: string) =>
      p === '/archive' ? Promise.resolve({ isDir: true }) : Promise.reject(new Error('not found'))
    );
    (api.rename as any).mockResolvedValue({ ok: true });
    const { result, loadList } = setup([item]);

    let outcome: { ok: number; fail: number } | undefined;
    await act(async () => {
      outcome = await result.current.bulkMove(new Set(['/photos/a.txt']), '/archive');
    });

    expect(outcome).toEqual({ ok: 1, fail: 0 });
    expect(api.rename).toHaveBeenCalledWith('/photos/a.txt', '/archive/a.txt');
    expect(loadList).toHaveBeenCalledWith('/photos');
  });

  it('bulkMove reports failure when an item is missing from the current listing', async () => {
    const { result, loadList } = setup([]); // items list does not contain the requested path
    (api.stat as any).mockResolvedValue({ isDir: true });

    let outcome: { ok: number; fail: number } | undefined;
    await act(async () => {
      outcome = await result.current.bulkMove(new Set(['/photos/missing.txt']), '/archive');
    });

    expect(outcome).toEqual({ ok: 0, fail: 1 });
    expect(api.rename).not.toHaveBeenCalled();
    expect(loadList).toHaveBeenCalledWith('/photos');
  });
});
