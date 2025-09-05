/* @vitest-environment node */
import { describe, it, expect } from 'vitest';
import { sanitizeFilename } from '../../src/server/lib/fsSafe';

describe('sanitizeFilename()', () => {
  it('removes path separators and control chars, normalizes unicode', () => {
    expect(sanitizeFilename('../a/b/c.txt')).toBe('c.txt');
    expect(sanitizeFilename('..\\a\\b\\c.txt')).toBe('c.txt');
  });

  it('replaces reserved chars and trims dots/spaces', () => {
    expect(sanitizeFilename('  name<>:"|?*.txt  ')).toBe('name_.txt');
    expect(sanitizeFilename('...file...')).toBe('file');
  });

  it('prevents empty or dot-only names', () => {
    expect(sanitizeFilename('..')).toBe('unnamed');
    expect(sanitizeFilename('.')).toBe('unnamed');
    expect(sanitizeFilename('')).toBe('unnamed');
  });

  it('preserves extension and enforces length limit', () => {
    const long = 'x'.repeat(200) + '.jpg';
    const out = sanitizeFilename(long);
    expect(out.endsWith('.jpg')).toBe(true);
    expect(out.length).toBeLessThanOrEqual(120);
  });
});
