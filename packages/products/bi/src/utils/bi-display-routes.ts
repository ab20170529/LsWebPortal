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
    return { kind: 'home' };
  }

  const nodeMatch = normalized.match(/^\/bi-display\/platform\/([^/]+)\/node\/([^/]+)$/);
  if (nodeMatch) {
    const platformCode = nodeMatch[1];
    const nodeCode = nodeMatch[2];
    if (!platformCode || !nodeCode) {
      return { kind: 'not-found' };
    }

    return {
      kind: 'node',
      nodeCode: decodeURIComponent(nodeCode),
      platformCode: decodeURIComponent(platformCode),
    };
  }

  const platformMatch = normalized.match(/^\/bi-display\/platform\/([^/]+)$/);
  if (platformMatch) {
    const platformCode = platformMatch[1];
    if (!platformCode) {
      return { kind: 'not-found' };
    }

    return {
      kind: 'platform',
      platformCode: decodeURIComponent(platformCode),
    };
  }

  return { kind: 'not-found' };
}

export function getBiDisplayPlatformPath(platformCode: string) {
  return `/bi-display/platform/${encodeURIComponent(platformCode)}`;
}

export function getBiDisplayPlatformNodePath(platformCode: string, nodeCode: string) {
  return `${getBiDisplayPlatformPath(platformCode)}/node/${encodeURIComponent(nodeCode)}`;
}

export function navigateBiDisplay(to: string) {
  const nextPath = normalizePathname(to);
  window.history.pushState({}, '', nextPath);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function replaceBiDisplay(to: string) {
  const nextPath = normalizePathname(to);
  window.history.replaceState({}, '', nextPath);
  window.dispatchEvent(new PopStateEvent('popstate'));
}
