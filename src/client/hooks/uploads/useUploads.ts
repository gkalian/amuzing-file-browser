// Hook: manages queued uploads with type filtering, per-file and total progress,
// notifications, and directory refresh on completion.
import { useCallback, useRef, useState } from 'react';
import { api } from '../../services/apiClient';
import { notifyError, notifySuccess } from '../../core/notify';
import { formatErrorMessage } from '../../core/errorUtils';
import type { UploadItem } from '../../components/upload/UploadQueue';

export function useUploads(params: {
  cwd: string;
  allowedTypes: string;
  t: (key: string, opts?: any) => string;
  loadList: (path: string) => Promise<void> | void;
}) {
  const { cwd, allowedTypes, t, loadList } = params;
  const [uploading, setUploading] = useState(false);
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [uploadSpeedBps, setUploadSpeedBps] = useState(0);

  // cancellation and speed measurement refs
  const cancelRequestedRef = useRef(false);
  const currentAbortRef = useRef<null | (() => void)>(null);
  const lastMeasureRef = useRef<{ t: number; bytes: number }>({ t: 0, bytes: 0 });

  const runUpload = useCallback(
    async (targetDir: string, files: File[]) => {
      if (!files?.length) return;
      let arr = Array.from(files);
      // Parse allowed extensions (comma-separated); empty list means allow all
      const allowed = (allowedTypes || '')
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      if (allowed.length > 0) {
        const [ok, bad] = arr.reduce<[File[], File[]]>(
          (acc, f) => {
            const ext = (f.name.split('.').pop() || '').toLowerCase();
            (allowed.includes(ext) ? acc[0] : acc[1]).push(f);
            return acc;
          },
          [[], []]
        );
        bad.forEach((f) =>
          notifyError(
            t('notifications.uploadTypeNotAllowed', {
              defaultValue: 'Not allowed format: {{name}}',
              name: f.name,
            }),
            t('notifications.uploadFailed', { defaultValue: 'Upload failed' })
          )
        );
        arr = ok;
        if (arr.length === 0) return;
      }
      const total = arr.reduce((a, f) => a + (f.size || 0), 0);
      setTotalBytes(total);
      setUploadedBytes(0);
      setUploading(true);
      setUploadSpeedBps(0);
      cancelRequestedRef.current = false;
      currentAbortRef.current = null;
      lastMeasureRef.current = { t: Date.now(), bytes: 0 };
      setUploadItems(
        arr.map((f) => ({
          name: f.name,
          size: f.size || 0,
          uploaded: 0,
          status: 'pending' as const,
        }))
      );
      try {
        let base = 0; // accumulated bytes from completed files
        for (let idx = 0; idx < arr.length; idx++) {
          if (cancelRequestedRef.current) break;
          const f = arr[idx];
          setUploadItems((prev) =>
            prev.map((it, i) => (i === idx ? { ...it, status: 'uploading' } : it))
          );
          try {
            const { promise, abort } = api.uploadWithProgressCancelable(
              targetDir,
              [f],
              (loaded, _tot) => {
                const now = Date.now();
                const current = base + Math.min(loaded, f.size || 0);
                // speed calculation
                const dtMs = now - lastMeasureRef.current.t;
                const dBytes = current - lastMeasureRef.current.bytes;
                if (dtMs > 250 && dBytes >= 0) {
                  setUploadSpeedBps((dBytes * 1000) / dtMs);
                  lastMeasureRef.current = { t: now, bytes: current };
                }
                setUploadedBytes(current);
                setUploadItems((prev) =>
                  prev.map((it, i) =>
                    i === idx ? { ...it, uploaded: Math.min(loaded, f.size || 0) } : it
                  )
                );
              }
            );
            currentAbortRef.current = abort;
            const resp = await promise;
            base += f.size || 0;
            setUploadedBytes(base);
            lastMeasureRef.current = { t: Date.now(), bytes: base };
            setUploadItems((prev) =>
              prev.map((it, i) =>
                i === idx ? { ...it, uploaded: f.size || 0, status: 'done' } : it
              )
            );
            setUploadItems((prev) => prev.filter((it) => it.status !== 'done'));
            const saved = (resp?.files && resp.files[0]?.filename) || f.name;
            notifySuccess(
              t('notifications.uploadSuccess', { defaultValue: 'Uploaded: {{name}}', name: saved })
            );
          } catch (e: any) {
            if (cancelRequestedRef.current) {
              // mark current as error-aborted
              setUploadItems((prev) =>
                prev.map((it, i) =>
                  i === idx
                    ? {
                        ...it,
                        status: 'error',
                        error: t('notifications.uploadAborted', {
                          defaultValue: 'Upload aborted',
                        }),
                      }
                    : it
                )
              );
              break;
            }
            notifyError(
              `${f.name}: ${formatErrorMessage(e, t('notifications.uploadFailed', { defaultValue: 'Upload failed' }))}`,
              t('notifications.uploadFailed', { defaultValue: 'Upload failed' }),
              true
            );
            base += f.size || 0;
            setUploadedBytes(base);
            setUploadItems((prev) =>
              prev.map((it, i) =>
                i === idx
                  ? {
                      ...it,
                      status: 'error',
                      error: formatErrorMessage(
                        e,
                        t('notifications.uploadFailed', { defaultValue: 'Upload failed' })
                      ),
                    }
                  : it
              )
            );
            continue;
          }
        }
        // Refresh current working directory list (table shows cwd)
        if (!cancelRequestedRef.current) {
          await loadList(cwd);
        }
      } finally {
        setUploading(false);
        // Small delay to let the user see the completion, then reset UI state
        setTimeout(() => {
          setUploadedBytes(0);
          setTotalBytes(0);
          setUploadItems([]);
          setUploadSpeedBps(0);
          }, 300);
        currentAbortRef.current = null;
      }
    },
    [cwd, allowedTypes, t, loadList]
  );

  // Backward-compatible handler: upload into the current working directory
  const handleUpload = useCallback(
    async (files: File[]) => runUpload(cwd, files),
    [runUpload, cwd]
  );

  // New handler: upload into a specific directory (used for folder drop)
  const handleUploadTo = useCallback(
    async (dirPath: string, files: File[]) => runUpload(dirPath, files),
    [runUpload]
  );

  const cancelUploads = useCallback(() => {
    if (!uploading) return;
    cancelRequestedRef.current = true;
    try {
      currentAbortRef.current?.();
    } catch {
      // ignore
    }
  }, [uploading]);

  return {
    uploading,
    uploadedBytes,
    totalBytes,
    uploadItems,
    uploadSpeedBps,
    handleUpload,
    handleUploadTo,
    cancelUploads,
  } as const;
}
