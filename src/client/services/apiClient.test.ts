// Smoke tests for API client URL builders
import { describe, it, expect } from 'vitest';
import { api } from './apiClient';

describe('apiClient urls (smoke)', () => {
  it('previewUrl builds correct query', () => {
    const url = api.previewUrl('/foo/bar.txt');
    expect(url).toContain('/api/fs/preview');
    expect(url).toContain('path=%2Ffoo%2Fbar.txt');
  });

  it('downloadUrl builds correct query', () => {
    const url = api.downloadUrl('/image.webp');
    expect(url).toContain('/api/fs/download');
    expect(url).toContain('path=%2Fimage.webp');
  });
});
