const DEFAULT_API_BASE_URL = 'http://222.211.229.79:8888';

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

const configuredApiBaseUrl = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL);
const useSameOriginApi = import.meta.env.DEV || import.meta.env.VITE_API_SAME_ORIGIN === 'true';

export const API_BASE_URL = useSameOriginApi ? '' : configuredApiBaseUrl;
export const CONFIGURED_API_BASE_URL = configuredApiBaseUrl;
