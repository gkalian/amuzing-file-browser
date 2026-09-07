// Basic tests for useUploads: type filtering, a successful upload run,
// uploading into a specific directory, and cancellation.
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUploads } from '@/client/hooks/uploads/useUploads';

vi.mock('@/client/services/apiClient', async (orig) => {
  const actual = await (orig as any)();
  return {
    ...actual,
    api: {
      ...actual.api,
      uploadWithProgressCancelable: vi.fn(),
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

function makeFile(name: string, size = 10) {
  return new File([new Uint8Array(size)], name);
}

function setup(allowedTypes = '') {
  const loadList = vi.fn().mockResolvedValue(undefined);
  const { result } = renderHook(() => useUploads({ cwd: '/photos', allowedTypes, t, loadList }));
  return { result, loadList };
}

describe('useUploads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uploads an allowed file and refreshes the list', async () => {
    (api.uploadWithProgressCancelable as any).mockImplementation((_dir: string, files: File[]) => ({
      promise: Promise.resolve({
        ok: true,
        files: [
          {
            originalname: files[0].name,
            filename: files[0].name,
            size: files[0].size,
            path: `/photos/${files[0].name}`,
          },
        ],
      }),
      abort: vi.fn(),
    }));
    const { result, loadList } = setup();

    await act(async () => {
      await result.current.handleUpload([makeFile('a.txt')]);
    });

    expect(api.uploadWithProgressCancelable).toHaveBeenCalledTimes(1);
    expect(loadList).toHaveBeenCalledWith('/photos');
    expect(notifySuccess).toHaveBeenCalled();
    expect(result.current.uploading).toBe(false);
  });

  it('rejects files whose extension is not in allowedTypes and skips the upload', async () => {
    const { result, loadList } = setup('png,jpg');

    await act(async () => {
      await result.current.handleUpload([makeFile('virus.exe')]);
    });

    expect(api.uploadWithProgressCancelable).not.toHaveBeenCalled();
    expect(notifyError).toHaveBeenCalled();
    expect(loadList).not.toHaveBeenCalled();
  });

  it('uploads into a specific directory via handleUploadTo', async () => {
    (api.uploadWithProgressCancelable as any).mockImplementation((dir: string, files: File[]) => ({
      promise: Promise.resolve({
        ok: true,
        files: [
          {
            originalname: files[0].name,
            filename: files[0].name,
            size: files[0].size,
            path: `${dir}/${files[0].name}`,
          },
        ],
      }),
      abort: vi.fn(),
    }));
    const { result } = setup();

    await act(async () => {
      await result.current.handleUploadTo('/archive', [makeFile('b.txt')]);
    });

    expect(api.uploadWithProgressCancelable).toHaveBeenCalledWith(
      '/archive',
      expect.any(Array),
      expect.any(Function)
    );
  });

  it('cancelUploads aborts the in-flight upload', async () => {
    const abort = vi.fn();
    let resolveUpload: (v: unknown) => void = () => {};
    (api.uploadWithProgressCancelable as any).mockImplementation(() => ({
      promise: new Promise((resolve) => {
        resolveUpload = resolve;
      }),
      abort,
    }));
    const { result } = setup();

    let uploadDone: Promise<void>;
    act(() => {
      uploadDone = result.current.handleUpload([makeFile('a.txt')]);
    });

    await waitFor(() => expect(result.current.uploading).toBe(true));

    act(() => {
      result.current.cancelUploads();
    });

    expect(abort).toHaveBeenCalled();

    // Let the pending upload settle so state updates don't leak into other tests
    await act(async () => {
      resolveUpload({ ok: true, files: [] });
      await uploadDone;
    });
  });

  it('cancelUploads is a no-op when nothing is uploading', () => {
    const { result } = setup();
    expect(() => result.current.cancelUploads()).not.toThrow();
  });
});
