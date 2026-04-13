import type { AuthSession, RememberedLoginState } from '../types';

const REMEMBERED_LOGIN_KEY = 'lserp.portal.login.view.v1';
const AUTH_SESSION_KEY = 'lserp.portal.auth.session';

export function getRememberedLoginState(): RememberedLoginState | null {
  if (typeof window === 'undefined') return null;

  const raw = localStorage.getItem(REMEMBERED_LOGIN_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as RememberedLoginState;
  } catch {
    localStorage.removeItem(REMEMBERED_LOGIN_KEY);
    return null;
  }
}

export function persistRememberedLoginState(state: RememberedLoginState): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(REMEMBERED_LOGIN_KEY, JSON.stringify(state));
}

export function clearRememberedLoginState(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(REMEMBERED_LOGIN_KEY);
}

export function getAuthSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;

  const raw =
    localStorage.getItem(AUTH_SESSION_KEY) ??
    sessionStorage.getItem(AUTH_SESSION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    localStorage.removeItem(AUTH_SESSION_KEY);
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    return null;
  }
}

export function persistAuthSession(session: AuthSession, remember: boolean): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(AUTH_SESSION_KEY);
  sessionStorage.removeItem(AUTH_SESSION_KEY);

  if (remember) {
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  } else {
    sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  }
}

export function clearAuthSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_SESSION_KEY);
  sessionStorage.removeItem(AUTH_SESSION_KEY);
}

export function getAccessToken(): string | null {
  const session = getAuthSession();
  return session?.accessToken ?? null;
}
