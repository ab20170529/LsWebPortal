import { createApiClient, normalizeApiBaseUrl } from '@lserp/http';

export const PROJECT_API_BASE_URL =
  normalizeApiBaseUrl(import.meta.env.VITE_PROJECT_API_BASE_URL as string | undefined);

export function createProjectApiClient() {
  return createApiClient({
    baseUrl: PROJECT_API_BASE_URL,
  });
}

function isApiPath(pathname: string) {
  return pathname === '/api' || pathname.startsWith('/api/');
}

export function buildProjectApiUrl(path: string) {
  const input = path.trim();
  const normalizedInput =
    input.startsWith('http://') || input.startsWith('https://')
      ? (() => {
          const url = new URL(input);
          return isApiPath(url.pathname)
            ? `${url.pathname}${url.search}${url.hash}`
            : url.toString();
        })()
      : input;

  if (!PROJECT_API_BASE_URL) {
    if (normalizedInput.startsWith('http://') || normalizedInput.startsWith('https://')) {
      return normalizedInput;
    }

    return normalizedInput.startsWith('/') ? normalizedInput : `/${normalizedInput}`;
  }

  const normalizedBaseUrl = PROJECT_API_BASE_URL.endsWith('/')
    ? PROJECT_API_BASE_URL
    : `${PROJECT_API_BASE_URL}/`;
  const normalizedPath = normalizedInput.startsWith('/')
    ? normalizedInput.slice(1)
    : normalizedInput;

  return new URL(normalizedPath, normalizedBaseUrl).toString();
}
