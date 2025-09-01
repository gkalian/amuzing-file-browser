// Unit tests for server-side MIME helper utilities
import { describe, it, expect } from 'vitest';
import { isTextLike, isImageLike } from '../../src/server/utils';

describe('utils mime helpers (smoke)', () => {
  it('isTextLike returns true for text/plain and application/json', () => {
    expect(isTextLike('text/plain')).toBe(true);
    expect(isTextLike('application/json')).toBe(true);
  });

  it('isTextLike returns false for images', () => {
    expect(isTextLike('image/png')).toBe(false);
  });

  it('isImageLike returns true for image/webp and image/png', () => {
    expect(isImageLike('image/webp')).toBe(true);
    expect(isImageLike('image/png')).toBe(true);
  });

  it('isImageLike returns false for text/plain', () => {
    expect(isImageLike('text/plain')).toBe(false);
  });
});
