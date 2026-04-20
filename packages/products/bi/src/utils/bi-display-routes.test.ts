import { describe, expect, it } from 'vitest';

import { resolveBiDisplayRoute } from './bi-display-routes';

describe('bi display routes', () => {
  it('resolves the selector route', () => {
    expect(resolveBiDisplayRoute('/bi-display')).toEqual({ kind: 'selector' });
    expect(resolveBiDisplayRoute('/bi-display/')).toEqual({ kind: 'selector' });
  });

  it('resolves platform routes', () => {
    expect(resolveBiDisplayRoute('/bi-display/platform/langsu')).toEqual({
      kind: 'platform',
      platformCode: 'langsu',
    });
  });

  it('falls back to not-found for unrelated routes', () => {
    expect(resolveBiDisplayRoute('/bi')).toEqual({ kind: 'not-found' });
  });
});
