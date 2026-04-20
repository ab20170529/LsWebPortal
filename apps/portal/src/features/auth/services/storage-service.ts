import type { AuthSession, RememberedLoginState } from '../types';

const REMEMBERED_LOGIN_KEY = 'lserp.portal.login.view.v1';
const AUTH_SESSION_KEY = 'lserp.portal.auth.session';
const PORTAL_BOOTSTRAP_KEY = 'lserp.portal.auth.v2';
const LEGACY_DESIGNER_SESSION_KEY = 'ls-ai-tool-auth-session';
const LEGACY_DESIGNER_LOGIN_CONTEXT_KEY = 'ls-ai-tool-login-context';

function readJsonFromStorage<T>(storage: Storage | null, key: string) {
  if (!storage) {
    return null;
  }

  const raw = storage.getItem(key);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    storage.removeItem(key);
    return null;
  }
}

function clearSessionKeys(storage: Storage | null) {
  if (!storage) {
    return;
  }

  storage.removeItem(AUTH_SESSION_KEY);
  storage.removeItem(PORTAL_BOOTSTRAP_KEY);
  storage.removeItem(LEGACY_DESIGNER_SESSION_KEY);
}

function toLegacyDesignerSession(session: AuthSession) {
  return {
    ...session,
    isAdmin: session.admin ?? session.isAdmin,
    selectedCompanyOptionKey: session.activeCompany?.companyKey ?? session.companyKey,
  };
}

export function getRememberedLoginState(): RememberedLoginState | null {
  if (typeof window === 'undefined') return null;

  return readJsonFromStorage<RememberedLoginState>(localStorage, REMEMBERED_LOGIN_KEY);
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

  return (
    readJsonFromStorage<AuthSession>(sessionStorage, AUTH_SESSION_KEY)
    ?? readJsonFromStorage<AuthSession>(localStorage, AUTH_SESSION_KEY)
  );
}

export function shouldRememberAuthSession(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return Boolean(localStorage.getItem(AUTH_SESSION_KEY));
}

export function persistAuthSession(session: AuthSession, remember: boolean): void {
  if (typeof window === 'undefined') return;

  clearSessionKeys(localStorage);
  clearSessionKeys(sessionStorage);

  const targetStorage = remember ? localStorage : sessionStorage;
  targetStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  targetStorage.setItem(LEGACY_DESIGNER_SESSION_KEY, JSON.stringify(toLegacyDesignerSession(session)));
}

export function clearAuthSession(): void {
  if (typeof window === 'undefined') return;
  clearSessionKeys(localStorage);
  clearSessionKeys(sessionStorage);
  localStorage.removeItem(LEGACY_DESIGNER_LOGIN_CONTEXT_KEY);
  sessionStorage.removeItem(LEGACY_DESIGNER_LOGIN_CONTEXT_KEY);
}

export function getAccessToken(): string | null {
  const session = getAuthSession();
  return session?.accessToken ?? null;
}

export function persistLegacyDesignerLoginContext(state: {
  employeeId: number;
  employeeName: string;
  password: string;
  remember: boolean;
}): void {
  if (typeof window === 'undefined') return;

  const targetStorage = state.remember ? localStorage : sessionStorage;
  const otherStorage = state.remember ? sessionStorage : localStorage;
  otherStorage.removeItem(LEGACY_DESIGNER_LOGIN_CONTEXT_KEY);
  targetStorage.setItem(LEGACY_DESIGNER_LOGIN_CONTEXT_KEY, JSON.stringify(state));
}
