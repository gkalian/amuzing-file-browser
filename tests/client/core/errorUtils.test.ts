// Basic tests for formatErrorMessage/toErrorDetails: covers ApiError, plain Error,
// plain objects, primitives, and the various fallback-message branches.
import { toErrorDetails, formatErrorMessage } from '@/client/core/errorUtils';
import { ApiError } from '@/client/services/apiClient';

describe('toErrorDetails', () => {
  it('extracts code and message from an ApiError', () => {
    const err = new ApiError({ code: 'not_found', message: 'File missing', status: 404 });
    expect(toErrorDetails(err)).toEqual({ code: 'not_found', message: 'File missing' });
  });

  it('defaults code and message when an ApiError is constructed without either', () => {
    const err = new ApiError({ status: 500 });
    expect(toErrorDetails(err)).toEqual({ code: 'unknown_error', message: 'Request failed' });
  });

  it('extracts message from a plain Error and defaults code to unknown_error', () => {
    const err = new Error('disk full');
    expect(toErrorDetails(err)).toEqual({ code: 'unknown_error', message: 'disk full' });
  });

  it('honors a custom .code on a plain Error', () => {
    const err = new Error('nope') as Error & { code: string };
    err.code = 'EACCES';
    expect(toErrorDetails(err)).toEqual({ code: 'EACCES', message: 'nope' });
  });

  it('reads code/message off a plain object', () => {
    expect(toErrorDetails({ code: 'weird', message: 'oops' })).toEqual({
      code: 'weird',
      message: 'oops',
    });
  });

  it('uses the fallback message for an object without a message', () => {
    expect(toErrorDetails({}, 'Fallback message')).toEqual({
      code: 'unknown_error',
      message: 'Fallback message',
    });
  });

  it('uses a string error as the message', () => {
    expect(toErrorDetails('boom')).toEqual({ code: 'unknown_error', message: 'boom' });
  });

  it('falls back to a generic message when nothing usable is provided', () => {
    expect(toErrorDetails(null)).toEqual({
      code: 'unknown_error',
      message: 'An unexpected error occurred',
    });
  });
});

describe('formatErrorMessage', () => {
  it('prefixes the message with the error code', () => {
    expect(formatErrorMessage(new Error('disk full'))).toBe('[unknown_error] disk full');
  });
});
