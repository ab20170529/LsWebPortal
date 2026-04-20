import type { BiDisplayRoute } from '../types';

function normalizePathname(pathname: string) {
  if (!pathname || pathname === '/') {
    return '/';
  }

  const trimmed = pathname.replace(/\/+$/, '');
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

export function resolveBiDisplayRoute(pathname: string): BiDisplayRoute {
  const normalized = normalizePathname(pathname);

  if (normalized === '/bi-display') {
    return { kind: 'selector' };
  }

  if (normalized.startsWith('/bi-display/platform/')) {
    return {
      kind: 'platform',
      platformCode: decodeURIComponent(normalized.slice('/bi-display/platform/'.length)),
    };
  }

  return { kind: 'not-found' };
}

export function navigateBiDisplay(to: string) {
  const nextPath = normalizePathname(to);
  window.history.pushState({}, '', nextPath);
  window.dispatchEvent(new PopStateEvent('popstate'));
}
