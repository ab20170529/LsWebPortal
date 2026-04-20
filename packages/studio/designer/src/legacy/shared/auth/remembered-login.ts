const REMEMBERED_LOGIN_STORAGE_KEY = 'ls-ai-tool-remembered-login';

export interface RememberedLoginState {
  employeeId: number;
  employeeName: string;
  organizationKey?: string;
  password: string;
}

export function getRememberedLoginState() {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawValue = window.localStorage.getItem(REMEMBERED_LOGIN_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<RememberedLoginState>;
    if (
      typeof parsed.employeeId !== 'number'
      || !Number.isFinite(parsed.employeeId)
      || typeof parsed.employeeName !== 'string'
      || typeof parsed.password !== 'string'
    ) {
      window.localStorage.removeItem(REMEMBERED_LOGIN_STORAGE_KEY);
      return null;
    }

    return {
      employeeId: parsed.employeeId,
      employeeName: parsed.employeeName,
      organizationKey: typeof parsed.organizationKey === 'string' ? parsed.organizationKey : '',
      password: parsed.password,
    };
  } catch {
    window.localStorage.removeItem(REMEMBERED_LOGIN_STORAGE_KEY);
    return null;
  }
}

export function persistRememberedLoginState(state: RememberedLoginState) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(REMEMBERED_LOGIN_STORAGE_KEY, JSON.stringify(state));
}

export function clearRememberedLoginState() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(REMEMBERED_LOGIN_STORAGE_KEY);
}
