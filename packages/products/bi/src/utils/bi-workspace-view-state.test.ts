import { describe, expect, it } from 'vitest';

import { buildBiWorkspaceViewSearch, readBiWorkspaceViewState } from './bi-workspace-view-state';

describe('bi workspace view state helpers', () => {
  it('parses valid workspace query state', () => {
    expect(
      readBiWorkspaceViewState('?section=archives&nodeId=12&screenId=99&tab=design'),
    ).toEqual({
      nodeId: 12,
      screenId: 99,
      section: 'archives',
      tab: 'design',
    });
  });

  it('falls back to defaults for invalid values', () => {
    expect(readBiWorkspaceViewState('?section=oops&nodeId=-1&screenId=abc&tab=nope')).toEqual({
      nodeId: null,
      screenId: null,
      section: 'canvas',
      tab: 'base',
    });
  });

  it('builds compact query strings from view state', () => {
    expect(
      buildBiWorkspaceViewSearch({
        nodeId: 12,
        screenId: 99,
        section: 'archives',
        tab: 'sharing',
      }),
    ).toBe('?section=archives&nodeId=12&screenId=99&tab=sharing');
    expect(buildBiWorkspaceViewSearch({ section: 'canvas' })).toBe('');
  });
});
