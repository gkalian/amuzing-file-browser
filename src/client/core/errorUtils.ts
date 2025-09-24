// Shared helpers for formatting API errors for UI notifications.
import { ApiError } from '../services/apiClient';

type ErrorDetails = {
  code: string;
  message: string;
};

function pickCode(raw: unknown, fallback: string): string {
  if (!raw) return fallback;
  if (typeof raw === 'string' && raw.trim()) return raw.trim();
  return fallback;
}

export function toErrorDetails(error: unknown, fallbackMessage?: string): ErrorDetails {
  if (error instanceof ApiError) {
    return {
      code: pickCode(error.code, error.status ? `http_${error.status}` : 'unknown_error'),
      message: error.message || fallbackMessage || 'Request failed',
    };
  }
  if (error instanceof Error) {
    const anyErr = error as any;
    return {
      code: pickCode(anyErr?.code, 'unknown_error'),
      message: error.message || fallbackMessage || 'An unexpected error occurred',
    };
  }
  if (error && typeof error === 'object') {
    const anyErr = error as Record<string, unknown>;
    return {
      code: pickCode(anyErr.code, 'unknown_error'),
      message:
        (typeof anyErr.message === 'string' && anyErr.message) ||
        fallbackMessage ||
        'An unexpected error occurred',
    };
  }
  return {
    code: 'unknown_error',
    message:
      (typeof error === 'string' && error.trim()) ||
      fallbackMessage ||
      'An unexpected error occurred',
  };
}

export function formatErrorMessage(error: unknown, fallbackMessage?: string): string {
  const { code, message } = toErrorDetails(error, fallbackMessage);
  return code ? `[${code}] ${message}` : message;
}
