import { describe, expect, it } from 'vitest';

import {
  getBiDisplayPlatformNodePath,
  getBiDisplayPlatformPath,
  resolveBiDisplayRoute,
} from './bi-display-routes';

describe('bi display routes', () => {
  it('resolves the home route', () => {
    expect(resolveBiDisplayRoute('/bi-display')).toEqual({ kind: 'home' });
    expect(resolveBiDisplayRoute('/bi-display/')).toEqual({ kind: 'home' });
  });

  it('resolves platform routes', () => {
    expect(resolveBiDisplayRoute('/bi-display/platform/langsu')).toEqual({
      kind: 'platform',
      platformCode: 'langsu',
    });
  });

  it('resolves platform node routes', () => {
    expect(resolveBiDisplayRoute('/bi-display/platform/langsu/node/dept-sales')).toEqual({
      kind: 'node',
      nodeCode: 'dept-sales',
      platformCode: 'langsu',
    });
  });

  it('builds platform routes', () => {
    expect(getBiDisplayPlatformPath('langsu')).toBe('/bi-display/platform/langsu');
    expect(getBiDisplayPlatformNodePath('langsu', 'dept-sales')).toBe(
      '/bi-display/platform/langsu/node/dept-sales',
    );
  });

  it('falls back to not-found for unrelated routes', () => {
    expect(resolveBiDisplayRoute('/bi')).toEqual({ kind: 'not-found' });
    expect(resolveBiDisplayRoute('/bi-display/platform/langsu/extra')).toEqual({
      kind: 'not-found',
    });
  });
});
