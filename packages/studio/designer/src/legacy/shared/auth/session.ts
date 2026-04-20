import type { AuthSession } from '../api/auth';

const LEGACY_AUTH_STORAGE_KEY = 'ls-ai-tool-auth-session';
const PORTAL_AUTH_STORAGE_KEY = 'lserp.portal.auth.session';
const PORTAL_BOOTSTRAP_STORAGE_KEY = 'lserp.portal.auth.v2';

type StoredSession = AuthSession & {
  admin?: boolean;
  isAdmin?: boolean;
  selectedCompanyOptionKey?: string;
};

function normalizeSession(session: StoredSession): AuthSession {
  const activeCompany = session.activeCompany ?? (
    session.companyKey || session.datasourceCode || session.companyTitle
      ? {
          companyKey: session.companyKey ?? session.selectedCompanyOptionKey ?? '',
          datasourceCode: session.datasourceCode,
          title: session.companyTitle,
        }
      : null
  );

  return {
    ...session,
    activeCompany,
    companyKey: activeCompany?.companyKey ?? session.companyKey,
    companyTitle: activeCompany?.title ?? session.companyTitle,
    datasourceCode: activeCompany?.datasourceCode ?? session.datasourceCode,
    isAdmin: session.isAdmin ?? session.admin,
    loginStage:
      session.loginStage
      ?? (activeCompany?.companyKey || activeCompany?.datasourceCode ? 'company' : 'identity'),
    selectedCompanyOptionKey: session.selectedCompanyOptionKey ?? activeCompany?.companyKey,
  };
}

function readSessionFrom(storage: Storage | null, keys: string[]) {
  if (!storage) {
    return null;
  }

  for (const key of keys) {
    const rawValue = storage.getItem(key);
    if (!rawValue) {
      continue;
    }

    try {
      return normalizeSession(JSON.parse(rawValue) as StoredSession);
    } catch {
      storage.removeItem(key);
    }
  }

  return null;
}

function clearAuthKeys(storage: Storage | null) {
  if (!storage) {
    return;
  }

  storage.removeItem(LEGACY_AUTH_STORAGE_KEY);
  storage.removeItem(PORTAL_AUTH_STORAGE_KEY);
  storage.removeItem(PORTAL_BOOTSTRAP_STORAGE_KEY);
}

function serializeSession(session: AuthSession) {
  return JSON.stringify({
    ...session,
    admin: session.isAdmin,
    isAdmin: session.isAdmin,
    selectedCompanyOptionKey:
      session.selectedCompanyOptionKey ?? session.activeCompany?.companyKey ?? session.companyKey,
  });
}

export function getStoredAuthSession() {
  if (typeof window === 'undefined') {
    return null;
  }

  const storageKeys = [LEGACY_AUTH_STORAGE_KEY, PORTAL_BOOTSTRAP_STORAGE_KEY, PORTAL_AUTH_STORAGE_KEY];
  return readSessionFrom(window.sessionStorage, storageKeys) ?? readSessionFrom(window.localStorage, storageKeys);
}

export function persistAuthSession(session: AuthSession, remember: boolean) {
  if (typeof window === 'undefined') {
    return;
  }

  const targetStorage = remember ? window.localStorage : window.sessionStorage;
  const otherStorage = remember ? window.sessionStorage : window.localStorage;
  const serialized = serializeSession(session);

  clearAuthKeys(otherStorage);
  clearAuthKeys(targetStorage);
  targetStorage.setItem(LEGACY_AUTH_STORAGE_KEY, serialized);
  targetStorage.setItem(PORTAL_AUTH_STORAGE_KEY, serialized);
  targetStorage.setItem(PORTAL_BOOTSTRAP_STORAGE_KEY, serialized);
}

export function clearAuthSession() {
  if (typeof window === 'undefined') {
    return;
  }

  clearAuthKeys(window.localStorage);
  clearAuthKeys(window.sessionStorage);
}

export function getAccessToken() {
  return getStoredAuthSession()?.accessToken ?? null;
}
