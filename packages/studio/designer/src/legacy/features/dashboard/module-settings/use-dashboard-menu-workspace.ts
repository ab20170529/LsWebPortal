import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  fetchSubsystemMenuTree,
  fetchSubsystemSecondLevelMenus,
  type BackendMenuNode,
  type BackendSubsystemNode,
} from '../../../lib/backend-menus';
import { resolveDesignMenuSelection } from '../../../platforms/design/navigation/design-navigation';

type SyncWorkspaceMenuIntent = (
  intent: Partial<{
    menuCode: string;
    moduleCode: string;
    subsystemCode: string;
  }>,
  options?: { replace?: boolean },
) => void;

function getDashboardMenuErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return '菜单加载失败，请稍后重试。';
}

function getEnabledMenuNodes<T extends { enabled: boolean }>(nodes?: readonly T[] | null): T[] {
  return (nodes ?? []).filter((node): node is T => node.enabled !== false);
}

export function useDashboardMenuWorkspace({
  initialMenuCode,
  initialSubsystemCode,
  menuPageRefreshNonce,
  onFirstLevelMenuClick,
  routeMenuCode,
  routeSubsystemCode,
  syncWorkspaceMenuIntent,
}: {
  initialMenuCode?: string;
  initialSubsystemCode?: string;
  menuPageRefreshNonce: number;
  onFirstLevelMenuClick: () => void;
  routeMenuCode?: string;
  routeSubsystemCode?: string;
  syncWorkspaceMenuIntent?: SyncWorkspaceMenuIntent;
}) {
  const [expandedSubsystemId, setExpandedSubsystemId] = useState<string | null>(null);
  const [subsystemMenus, setSubsystemMenus] = useState<BackendSubsystemNode[]>([]);
  const [activeSubsystem, setActiveSubsystem] = useState('');
  const [activeFirstLevelMenuId, setActiveFirstLevelMenuId] = useState('');
  const [secondLevelMenus, setSecondLevelMenus] = useState<BackendMenuNode[]>([]);
  const [isLoadingSubsystemMenus, setIsLoadingSubsystemMenus] = useState(true);
  const [isLoadingSecondLevelMenus, setIsLoadingSecondLevelMenus] = useState(false);
  const [menuLoadError, setMenuLoadError] = useState<string | null>(null);

  const selectedSubsystem = useMemo(
    () => subsystemMenus.find((item) => item.id === activeSubsystem) ?? null,
    [activeSubsystem, subsystemMenus],
  );
  const firstLevelMenus = useMemo(
    () => getEnabledMenuNodes(selectedSubsystem?.children),
    [selectedSubsystem],
  );
  const activeFirstLevelMenu = useMemo(
    () => firstLevelMenus.find((item) => item.id === activeFirstLevelMenuId) ?? null,
    [activeFirstLevelMenuId, firstLevelMenus],
  );

  const resolveInitialSelection = useCallback((menus: BackendSubsystemNode[]) => (
    resolveDesignMenuSelection(menus, {
      menuCode: initialMenuCode ?? routeMenuCode,
      subsystemCode: initialSubsystemCode ?? routeSubsystemCode,
    })
  ), [initialMenuCode, initialSubsystemCode, routeMenuCode, routeSubsystemCode]);

  const loadSubsystemMenus = useCallback(async () => {
    setIsLoadingSubsystemMenus(true);
    setMenuLoadError(null);

    try {
      const data = getEnabledMenuNodes(await fetchSubsystemMenuTree());
      const nextSelection = resolveInitialSelection(data);

      setSubsystemMenus(data);
      setExpandedSubsystemId(nextSelection.expandedSubsystemId);
      setActiveSubsystem(nextSelection.selectedSubsystem?.id ?? '');
      setActiveFirstLevelMenuId(nextSelection.selectedMenu?.id ?? '');
      setSecondLevelMenus([]);
    } catch (error) {
      setMenuLoadError(getDashboardMenuErrorMessage(error));
      setSubsystemMenus([]);
      setExpandedSubsystemId(null);
      setActiveSubsystem('');
      setActiveFirstLevelMenuId('');
      setSecondLevelMenus([]);
    } finally {
      setIsLoadingSubsystemMenus(false);
    }
  }, [resolveInitialSelection]);

  useEffect(() => {
    void loadSubsystemMenus();
  }, [loadSubsystemMenus]);

  useEffect(() => {
    if (subsystemMenus.length === 0) {
      return;
    }

    const nextSelection = resolveInitialSelection(subsystemMenus);

    setExpandedSubsystemId(nextSelection.expandedSubsystemId);
    setActiveSubsystem(nextSelection.selectedSubsystem?.id ?? '');
    setActiveFirstLevelMenuId(nextSelection.selectedMenu?.id ?? '');
  }, [resolveInitialSelection, subsystemMenus]);

  useEffect(() => {
    let isActive = true;

    const loadSecondLevelMenus = async () => {
      if (!selectedSubsystem || !activeFirstLevelMenu?.menuId) {
        setSecondLevelMenus([]);
        setIsLoadingSecondLevelMenus(false);
        return;
      }

      setIsLoadingSecondLevelMenus(true);

      try {
        const data = getEnabledMenuNodes(
          await fetchSubsystemSecondLevelMenus({
            menuId: activeFirstLevelMenu.menuId,
            subsysId: selectedSubsystem.subsysId,
          }),
        );

        if (!isActive) {
          return;
        }

        setSecondLevelMenus(data);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setMenuLoadError(getDashboardMenuErrorMessage(error));
        setSecondLevelMenus([]);
      } finally {
        if (isActive) {
          setIsLoadingSecondLevelMenus(false);
        }
      }
    };

    void loadSecondLevelMenus();

    return () => {
      isActive = false;
    };
  }, [activeFirstLevelMenu?.menuId, menuPageRefreshNonce, selectedSubsystem]);

  const toggleSubsystemExpansion = useCallback((subsystemId: string) => {
    setExpandedSubsystemId((prev) => (prev === subsystemId ? null : subsystemId));
  }, []);

  const handleFirstLevelMenuClick = useCallback((subsystemId: string, menu: BackendMenuNode) => {
    const clickedSubsystem = subsystemMenus.find((item) => item.id === subsystemId) ?? null;

    onFirstLevelMenuClick();
    setActiveSubsystem(subsystemId);
    setActiveFirstLevelMenuId(menu.id);
    setSecondLevelMenus([]);
    setMenuLoadError(null);
    setExpandedSubsystemId(subsystemId);
    syncWorkspaceMenuIntent?.({
      menuCode: menu.code,
      subsystemCode: clickedSubsystem?.subsysCode ?? clickedSubsystem?.code,
    });
  }, [onFirstLevelMenuClick, subsystemMenus, syncWorkspaceMenuIntent]);

  return {
    activeFirstLevelMenu,
    activeFirstLevelMenuId,
    activeSubsystem,
    expandedSubsystemId,
    handleFirstLevelMenuClick,
    isLoadingSecondLevelMenus,
    isLoadingSubsystemMenus,
    menuLoadError,
    reloadSubsystemMenus: loadSubsystemMenus,
    secondLevelMenus,
    selectedSubsystem,
    setSecondLevelMenus,
    subsystemMenus,
    toggleSubsystemExpansion,
  };
}
