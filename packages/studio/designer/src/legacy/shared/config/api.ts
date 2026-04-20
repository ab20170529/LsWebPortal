const DEFAULT_API_BASE_URL = 'http://localhost:8080';

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

const configuredApiBaseUrl = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL);

// The merged Portal host does not provide a Vite same-origin proxy for legacy designer routes.
// Keep same-origin only when it is explicitly requested by env.
const useSameOriginApi = import.meta.env.VITE_API_SAME_ORIGIN === 'true';

export const API_BASE_URL = useSameOriginApi ? '' : configuredApiBaseUrl;
export const CONFIGURED_API_BASE_URL = configuredApiBaseUrl;
