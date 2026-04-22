import type { AuthSession } from '../api/auth';

const AUTH_STORAGE_KEY = 'ls-ai-tool-auth-session';

function readSessionFrom(storage: Storage | null) {
  if (!storage) {
    return null;
  }

  const rawValue = storage.getItem(AUTH_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as AuthSession;
  } catch {
    storage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function getStoredAuthSession() {
  if (typeof window === 'undefined') {
    return null;
  }

  return readSessionFrom(window.localStorage) ?? readSessionFrom(window.sessionStorage);
}

export function persistAuthSession(session: AuthSession, remember: boolean) {
  if (typeof window === 'undefined') {
    return;
  }

  const targetStorage = remember ? window.localStorage : window.sessionStorage;
  const otherStorage = remember ? window.sessionStorage : window.localStorage;

  otherStorage.removeItem(AUTH_STORAGE_KEY);
  targetStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearAuthSession() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
}

export function getAccessToken() {
  return getStoredAuthSession()?.accessToken ?? null;
}
