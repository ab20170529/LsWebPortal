import { describe, expect, it } from 'vitest';

import { resolveBiRoute } from './bi-routes';

describe('bi routes', () => {
  it('resolves workspace routes', () => {
    expect(resolveBiRoute('/bi')).toEqual({ kind: 'workspace' });
    expect(resolveBiRoute('/bi/workspace/')).toEqual({ kind: 'workspace' });
  });

  it('resolves node, screen and share routes', () => {
    expect(resolveBiRoute('/bi/node/company-north')).toEqual({
      kind: 'node',
      value: 'company-north',
    });
    expect(resolveBiRoute('/bi/screen/sales-board')).toEqual({
      kind: 'screen',
      value: 'sales-board',
    });
    expect(resolveBiRoute('/bi/share/token123')).toEqual({
      kind: 'share',
      value: 'token123',
    });
  });
});
