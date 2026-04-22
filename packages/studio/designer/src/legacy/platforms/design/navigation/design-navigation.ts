import type {
  DesignRouteContext,
} from '../../../app/contracts/platform-routing';
import type {
  BackendMenuNode,
  BackendSubsystemNode,
} from '../../../lib/backend-menus';

type NavigateOptions = {
  replace?: boolean;
};

type SearchValue = boolean | number | string | null | undefined;

type DesignMenuSelection = {
  expandedSubsystemId: string | null;
  selectedMenu: BackendMenuNode | null;
  selectedSubsystem: BackendSubsystemNode | null;
};

function normalizeToken(value?: string | null) {
  return value?.trim().toLowerCase() || '';
}

function encodeSegment(value: string) {
  return encodeURIComponent(value.trim());
}

function decodeSegment(value?: string) {
  if (!value) {
    return undefined;
  }

  try {
    return decodeURIComponent(value).trim();
  } catch {
    return value.trim();
  }
}

function isNodeEnabled<T extends { enabled: boolean }>(node: T) {
  return node.enabled !== false;
}

function getEnabledNodes<T extends { enabled: boolean }>(nodes?: readonly T[] | null): T[] {
  return (nodes ?? []).filter(isNodeEnabled);
}

function matchesRouteToken(candidate: Array<string | number | null | undefined>, expected?: string) {
  const normalizedExpected = normalizeToken(expected);

  if (!normalizedExpected) {
    return false;
  }

  return candidate.some((item) => normalizeToken(String(item ?? '')) === normalizedExpected);
}

function findFirstLevelMenuAcrossSubsystems(
  subsystemMenus: readonly BackendSubsystemNode[],
  menuCode?: string,
) {
  for (const subsystem of subsystemMenus) {
    const nextMenu = getEnabledNodes(subsystem.children).find((item) => (
      matchesRouteToken([item.code, item.menuStruct, item.purviewId], menuCode)
    ));

    if (nextMenu) {
      return {
        menu: nextMenu,
        subsystem,
      };
    }
  }

  return null;
}

function resolveFallbackSubsystem(subsystemMenus: readonly BackendSubsystemNode[]) {
  return subsystemMenus.find((item) => getEnabledNodes(item.children).length > 0) ?? subsystemMenus[0] ?? null;
}

export function decodeDesignRouteSegment(value?: string) {
  return decodeSegment(value);
}

export function buildDesignWorkspacePath(context?: Pick<DesignRouteContext, 'menuCode' | 'subsystemCode'>) {
  const segments = ['/design', 'workspace'];

  if (context?.subsystemCode) {
    segments.push(encodeSegment(context.subsystemCode));
  }

  if (context?.subsystemCode && context?.menuCode) {
    segments.push(encodeSegment(context.menuCode));
  }

  return segments.join('/');
}

export function buildDesignModulePath(context?: Pick<DesignRouteContext, 'menuCode' | 'moduleCode' | 'subsystemCode'>) {
  const segments = ['/design', 'module'];

  if (context?.subsystemCode) {
    segments.push(encodeSegment(context.subsystemCode));
  }

  if (context?.subsystemCode && context?.menuCode) {
    segments.push(encodeSegment(context.menuCode));
  }

  if (context?.subsystemCode && context?.menuCode && context?.moduleCode) {
    segments.push(encodeSegment(context.moduleCode));
  }

  return segments.join('/');
}

export function buildDesignBillPath(context?: Pick<DesignRouteContext, 'moduleCode'>) {
  const segments = ['/design', 'bill'];

  if (context?.moduleCode) {
    segments.push(encodeSegment(context.moduleCode));
  }

  return segments.join('/');
}

export function navigateToDesignPath(path: string, options: NavigateOptions = {}) {
  if (typeof window === 'undefined') {
    return;
  }

  if (options.replace) {
    window.history.replaceState({}, '', path);
  } else {
    window.history.pushState({}, '', path);
  }

  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function updateCurrentDesignSearch(
  updates: Record<string, SearchValue>,
  options: NavigateOptions = {},
) {
  if (typeof window === 'undefined') {
    return;
  }

  const url = new URL(window.location.href);

  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === undefined || value === false || value === '') {
      url.searchParams.delete(key);
      continue;
    }

    url.searchParams.set(key, value === true ? '1' : String(value));
  }

  const nextUrl = `${url.pathname}${url.search}${url.hash}`;

  if (options.replace) {
    window.history.replaceState({}, '', nextUrl);
  } else {
    window.history.pushState({}, '', nextUrl);
  }

  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function resolveDesignMenuSelection(
  subsystemMenus: readonly BackendSubsystemNode[],
  routeContext: Pick<DesignRouteContext, 'menuCode' | 'subsystemCode'>,
): DesignMenuSelection {
  const enabledSubsystemMenus = getEnabledNodes(subsystemMenus);

  if (enabledSubsystemMenus.length === 0) {
    return {
      expandedSubsystemId: null,
      selectedMenu: null,
      selectedSubsystem: null,
    };
  }

  let selectedSubsystem = enabledSubsystemMenus.find((item) => (
    matchesRouteToken([item.subsysCode, item.code], routeContext.subsystemCode)
  )) ?? null;

  let selectedMenu = selectedSubsystem
    ? getEnabledNodes(selectedSubsystem.children).find((item) => (
      matchesRouteToken([item.code, item.menuStruct, item.purviewId], routeContext.menuCode)
    )) ?? null
    : null;

  if (!selectedSubsystem && routeContext.menuCode) {
    const globalMatch = findFirstLevelMenuAcrossSubsystems(enabledSubsystemMenus, routeContext.menuCode);
    selectedSubsystem = globalMatch?.subsystem ?? null;
    selectedMenu = globalMatch?.menu ?? null;
  }

  if (!selectedSubsystem) {
    selectedSubsystem = resolveFallbackSubsystem(enabledSubsystemMenus);
  }

  if (!selectedMenu && selectedSubsystem) {
    selectedMenu = getEnabledNodes(selectedSubsystem.children)[0] ?? null;
  }

  return {
    expandedSubsystemId: selectedSubsystem?.id ?? null,
    selectedMenu,
    selectedSubsystem,
  };
}

export function resolveDesignModuleSelection(
  secondLevelMenus: readonly BackendMenuNode[],
  moduleCode?: string,
) {
  if (!moduleCode) {
    return secondLevelMenus[0] ?? null;
  }

  return secondLevelMenus.find((item) => (
    matchesRouteToken([item.purviewId, item.code, item.menuStruct, item.id], moduleCode)
  )) ?? secondLevelMenus[0] ?? null;
}
