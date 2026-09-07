// Basic tests for asyncHandler: forwards rejections to next() and leaves next()
// untouched when the wrapped handler resolves.
import { describe, it, expect, vi } from 'vitest';
import { asyncHandler } from '../../src/server/middleware/asyncHandler';

describe('asyncHandler', () => {
  it('does not call next() when the wrapped handler resolves', async () => {
    const next = vi.fn();
    const handler = asyncHandler(async () => 'ok');

    handler({} as any, {} as any, next);
    await new Promise((r) => setImmediate(r));

    expect(next).not.toHaveBeenCalled();
  });

  it('forwards a rejection to next(err)', async () => {
    const next = vi.fn();
    const err = new Error('boom');
    const handler = asyncHandler(async () => {
      throw err;
    });

    handler({} as any, {} as any, next);
    await new Promise((r) => setImmediate(r));

    expect(next).toHaveBeenCalledWith(err);
  });
});
