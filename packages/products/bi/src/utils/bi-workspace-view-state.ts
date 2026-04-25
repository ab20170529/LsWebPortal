export type BiWorkspaceSection = 'archives' | 'canvas' | 'settings' | 'sources';

export type BiArchiveTab = 'base' | 'design' | 'sharing' | 'versions';

export type BiWorkspaceViewState = {
  nodeId: number | null;
  screenId: number | null;
  section: BiWorkspaceSection;
  tab: BiArchiveTab;
};

const DEFAULT_STATE: BiWorkspaceViewState = {
  nodeId: null,
  screenId: null,
  section: 'canvas',
  tab: 'base',
};

const SECTION_SET = new Set<BiWorkspaceSection>(['archives', 'canvas', 'settings', 'sources']);
const TAB_SET = new Set<BiArchiveTab>(['base', 'design', 'sharing', 'versions']);

function parseNumber(value: string | null) {
  if (!value) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function readBiWorkspaceViewState(search: string): BiWorkspaceViewState {
  const params = new URLSearchParams(search);
  const section = params.get('section');
  const tab = params.get('tab');

  return {
    nodeId: parseNumber(params.get('nodeId')),
    screenId: parseNumber(params.get('screenId')),
    section: section && SECTION_SET.has(section as BiWorkspaceSection) ? (section as BiWorkspaceSection) : 'canvas',
    tab: tab && TAB_SET.has(tab as BiArchiveTab) ? (tab as BiArchiveTab) : 'base',
  };
}

export function buildBiWorkspaceViewSearch(state: Partial<BiWorkspaceViewState>) {
  const params = new URLSearchParams();
  const nextState = {
    ...DEFAULT_STATE,
    ...state,
  };

  if (nextState.section !== DEFAULT_STATE.section) {
    params.set('section', nextState.section);
  }
  if (nextState.nodeId && nextState.nodeId > 0) {
    params.set('nodeId', String(nextState.nodeId));
  }
  if (nextState.screenId && nextState.screenId > 0) {
    params.set('screenId', String(nextState.screenId));
  }
  if (nextState.section === 'archives' && nextState.tab !== DEFAULT_STATE.tab) {
    params.set('tab', nextState.tab);
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}
