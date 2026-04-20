import type { AuthSession } from '../../shared/api/auth';
import { clearAuthSession, getStoredAuthSession } from '../../shared/auth/session';

export function getInitialAuthSession() {
  return getStoredAuthSession();
}

export function clearCurrentAuthSession() {
  clearAuthSession();
}

export type { AuthSession };
