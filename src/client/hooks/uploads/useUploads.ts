// Hook: manages queued uploads with type filtering, per-file and total progress,
// notifications, and directory refresh on completion.
import { useCallback, useState } from 'react';
import { api } from '../../services/apiClient';
import { notifyError, notifySuccess } from '../../core/notify';
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

  const handleUpload = useCallback(
    async (files: File[]) => {
      if (!files?.length) return;
      let arr = Array.from(files);
      // Parse allowed extensions (comma-separated); empty list means allow all
      const allowed = (allowedTypes || '')
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      if (allowed.length > 0) {
        const [ok, bad] = arr.reduce<[File[], File[]]>((acc, f) => {
          const ext = (f.name.split('.').pop() || '').toLowerCase();
          (allowed.includes(ext) ? acc[0] : acc[1]).push(f);
          return acc;
        }, [[], []]);
        bad.forEach((f) =>
          notifyError(
            t('notifications.uploadTypeNotAllowed', { defaultValue: 'Not allowed format: {{name}}', name: f.name }),
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
      setUploadItems(
        arr.map((f) => ({ name: f.name, size: f.size || 0, uploaded: 0, status: 'pending' as const }))
      );
      try {
        let base = 0; // accumulated bytes from completed files
        for (let idx = 0; idx < arr.length; idx++) {
          const f = arr[idx];
          setUploadItems((prev) => prev.map((it, i) => (i === idx ? { ...it, status: 'uploading' } : it)));
          try {
            const resp = await api.uploadWithProgress(cwd, [f], (loaded, _tot) => {
              const current = base + Math.min(loaded, f.size || 0);
              setUploadedBytes(current);
              setUploadItems((prev) =>
                prev.map((it, i) => (i === idx ? { ...it, uploaded: Math.min(loaded, f.size || 0) } : it))
              );
            });
            base += f.size || 0;
            setUploadedBytes(base);
            setUploadItems((prev) => prev.map((it, i) => (i === idx ? { ...it, uploaded: f.size || 0, status: 'done' } : it)));
            setUploadItems((prev) => prev.filter((it) => it.status !== 'done'));
            const saved = (resp?.files && resp.files[0]?.filename) || f.name;
            notifySuccess(t('notifications.uploadSuccess', { defaultValue: 'Uploaded: {{name}}', name: saved }));
          } catch (e: any) {
            notifyError(`${f.name}: ${String(e?.message || e)}`, t('notifications.uploadFailed', { defaultValue: 'Upload failed' }), true);
            base += f.size || 0;
            setUploadedBytes(base);
            setUploadItems((prev) => prev.map((it, i) => (i === idx ? { ...it, status: 'error', error: String(e?.message || e) } : it)));
            continue;
          }
        }
        await loadList(cwd);
      } finally {
        setUploading(false);
        // Small delay to let the user see the completion, then reset UI state
        setTimeout(() => {
          setUploadedBytes(0);
          setTotalBytes(0);
          setUploadItems([]);
        }, 300);
      }
    },
    [cwd, allowedTypes, t, loadList]
  );

  return { uploading, uploadedBytes, totalBytes, uploadItems, handleUpload } as const;
}
