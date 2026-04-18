import type { BiRoute } from '../types';

function normalizePathname(pathname: string) {
  if (!pathname || pathname === '/') {
    return '/';
  }

  const trimmed = pathname.replace(/\/+$/, '');
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

export function resolveBiRoute(pathname: string): BiRoute {
  const normalized = normalizePathname(pathname);

  if (normalized === '/bi' || normalized === '/bi/workspace') {
    return { kind: 'workspace' };
  }

  if (normalized.startsWith('/bi/node/')) {
    return { kind: 'node', value: decodeURIComponent(normalized.slice('/bi/node/'.length)) };
  }

  if (normalized.startsWith('/bi/screen/')) {
    return { kind: 'screen', value: decodeURIComponent(normalized.slice('/bi/screen/'.length)) };
  }

  if (normalized.startsWith('/bi/share/')) {
    return { kind: 'share', value: decodeURIComponent(normalized.slice('/bi/share/'.length)) };
  }

  return { kind: 'not-found' };
}
