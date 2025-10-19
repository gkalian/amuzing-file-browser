import { describe, it, expect, vi } from 'vitest';
import { api } from '@/client/services/apiClient';

describe('apiClient', () => {
  it('publicFileUrl uses window origin when mediaDomain is absent', async () => {
    const url = await api.publicFileUrl('/foo.jpg');
    expect(url).toContain(window.location.origin);
    expect(url).toContain('/files/foo.jpg');
  });

  // Note: mediaDomain branch is exercised indirectly via public API elsewhere; here we avoid accessing internals.

  it('uploadWithProgressCancelable resolves and reports progress', async () => {
    const progress = vi.fn();
    const xhrMock: any = {
      open: vi.fn(),
      send: vi.fn(),
      set responseType(v: string) {},
      get responseType() {
        return 'json';
      },
      upload: { onprogress: (e: any) => {} },
      onload: null as any,
      onerror: null as any,
      onabort: null as any,
      status: 200,
      response: { ok: true, files: [] },
      getResponseHeader: vi.fn(),
    };
    vi.spyOn(window as any, 'XMLHttpRequest').mockImplementation(() => xhrMock);

    const { promise } = api.uploadWithProgressCancelable('/p', [new File(['x'], 'x.txt')], progress);
    // simulate progress + load success
    xhrMock.upload.onprogress({ lengthComputable: true, loaded: 1, total: 1 });
    xhrMock.onload();
    const res = await promise;
    expect(res).toMatchObject({ ok: true });
    expect(progress).toHaveBeenCalledWith(1, 1);
  });

  it('uploadWithProgressCancelable rejects on network error and abort', async () => {
    const baseXhr = () => ({
      open: vi.fn(),
      send: vi.fn(),
      upload: {},
      status: 0,
      responseType: 'json',
      getResponseHeader: vi.fn(),
    });

    let xhr: any = baseXhr();
    vi.spyOn(window as any, 'XMLHttpRequest').mockImplementation(() => xhr);
    const p1 = api.uploadWithProgressCancelable('/p', [new File(['x'], 'x.txt')]).promise;
    setTimeout(() => xhr.onerror());
    await expect(p1).rejects.toMatchObject({ code: 'network_error' });

    xhr = baseXhr();
    vi.spyOn(window as any, 'XMLHttpRequest').mockImplementation(() => xhr);
    const p2 = api.uploadWithProgressCancelable('/p', [new File(['x'], 'x.txt')]).promise;
    setTimeout(() => xhr.onabort());
    await expect(p2).rejects.toMatchObject({ code: 'aborted' });
  });

  it('uploadWithProgressCancelable rejects with ApiError on non-2xx', async () => {
    const xhrMock: any = {
      open: vi.fn(),
      send: vi.fn(),
      upload: {},
      status: 500,
      responseType: 'json',
      response: { code: 'server_error', message: 'boom' },
      getResponseHeader: vi.fn().mockReturnValue('rid-123'),
      onload: null,
      onerror: null,
      onabort: null,
    };
    vi.spyOn(window as any, 'XMLHttpRequest').mockImplementation(() => xhrMock);
    const p = api.uploadWithProgressCancelable('/p', [new File(['x'], 'x.txt')]).promise;
    setTimeout(() => xhrMock.onload());
    await expect(p).rejects.toMatchObject({ status: 500 });
  });
});
