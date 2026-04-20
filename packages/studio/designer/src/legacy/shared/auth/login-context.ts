const LOGIN_CONTEXT_STORAGE_KEY = 'ls-ai-tool-login-context';

export interface LoginContextState {
  employeeId: number;
  employeeName: string;
  password: string;
  remember: boolean;
}

function readLoginContext(storage: Storage | null) {
  if (!storage) {
    return null;
  }

  const rawValue = storage.getItem(LOGIN_CONTEXT_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<LoginContextState>;
    if (
      typeof parsed.employeeId !== 'number'
      || !Number.isFinite(parsed.employeeId)
      || typeof parsed.employeeName !== 'string'
      || typeof parsed.password !== 'string'
      || typeof parsed.remember !== 'boolean'
    ) {
      storage.removeItem(LOGIN_CONTEXT_STORAGE_KEY);
      return null;
    }

    return {
      employeeId: parsed.employeeId,
      employeeName: parsed.employeeName,
      password: parsed.password,
      remember: parsed.remember,
    };
  } catch {
    storage.removeItem(LOGIN_CONTEXT_STORAGE_KEY);
    return null;
  }
}

export function getStoredLoginContext() {
  if (typeof window === 'undefined') {
    return null;
  }

  return readLoginContext(window.sessionStorage) ?? readLoginContext(window.localStorage);
}

export function persistLoginContext(state: LoginContextState) {
  if (typeof window === 'undefined') {
    return;
  }

  const targetStorage = state.remember ? window.localStorage : window.sessionStorage;
  const otherStorage = state.remember ? window.sessionStorage : window.localStorage;

  otherStorage.removeItem(LOGIN_CONTEXT_STORAGE_KEY);
  targetStorage.setItem(LOGIN_CONTEXT_STORAGE_KEY, JSON.stringify(state));
}

export function clearTransientLoginContext() {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.removeItem(LOGIN_CONTEXT_STORAGE_KEY);
}
