const DEFAULT_API_BASE_URL = '';

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

function normalizeApiBaseUrl(value?: string | null) {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) {
    return '';
  }

  if (!/^https?:\/\//i.test(trimmed)) {
    return trimTrailingSlash(trimmed);
  }

  try {
    const url = new URL(trimmed);
    if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') {
      return '';
    }
  } catch {
    return trimTrailingSlash(trimmed);
  }

  return trimTrailingSlash(trimmed);
}

const configuredApiBaseUrl = trimTrailingSlash(
  normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL) || DEFAULT_API_BASE_URL,
);
const useSameOriginApi = import.meta.env.DEV || import.meta.env.VITE_API_SAME_ORIGIN === 'true';

export const API_BASE_URL = useSameOriginApi ? '' : configuredApiBaseUrl;
export const CONFIGURED_API_BASE_URL = configuredApiBaseUrl;
