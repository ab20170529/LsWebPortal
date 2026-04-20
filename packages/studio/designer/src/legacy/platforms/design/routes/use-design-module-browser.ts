import { useEffect, useMemo, useState } from 'react';

import type { DesignRouteContext } from '../../../app/contracts/platform-routing';
import {
  fetchSubsystemMenuTree,
  fetchSubsystemSecondLevelMenus,
  type BackendMenuNode,
  type BackendSubsystemNode,
} from '../../../lib/backend-menus';
import { getEnabledMenuNodes, getModuleBrowserErrorMessage } from './design-module-browser-utils';
import {
  resolveDesignMenuSelection,
  resolveDesignModuleSelection,
} from '../navigation/design-navigation';

export function useDesignModuleBrowser(routeContext: DesignRouteContext) {
  const [activeFirstLevelMenuId, setActiveFirstLevelMenuId] = useState('');
  const [activeSubsystemId, setActiveSubsystemId] = useState('');
  const [expandedSubsystemId, setExpandedSubsystemId] = useState<string | null>(null);
  const [isLoadingSecondLevelMenus, setIsLoadingSecondLevelMenus] = useState(false);
  const [isLoadingSubsystemMenus, setIsLoadingSubsystemMenus] = useState(true);
  const [menuLoadError, setMenuLoadError] = useState<string | null>(null);
  const [secondLevelMenus, setSecondLevelMenus] = useState<BackendMenuNode[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [subsystemMenus, setSubsystemMenus] = useState<BackendSubsystemNode[]>([]);

  const selectedSubsystem = useMemo(
    () => subsystemMenus.find((item) => item.id === activeSubsystemId) ?? null,
    [activeSubsystemId, subsystemMenus],
  );
  const firstLevelMenus = useMemo<BackendMenuNode[]>(
    () => getEnabledMenuNodes<BackendMenuNode>(selectedSubsystem?.children),
    [selectedSubsystem],
  );
  const activeFirstLevelMenu = useMemo(
    () => firstLevelMenus.find((item) => item.id === activeFirstLevelMenuId) ?? firstLevelMenus[0] ?? null,
    [activeFirstLevelMenuId, firstLevelMenus],
  );
  const selectedModule = useMemo(
    () => secondLevelMenus.find((item) => item.id === selectedModuleId) ?? secondLevelMenus[0] ?? null,
    [secondLevelMenus, selectedModuleId],
  );

  useEffect(() => {
    const loadSubsystemMenus = async () => {
      setIsLoadingSubsystemMenus(true);
      setMenuLoadError(null);

      try {
        const data = getEnabledMenuNodes(await fetchSubsystemMenuTree());
        const nextSelection = resolveDesignMenuSelection(data, routeContext);

        setSubsystemMenus(data);
        setExpandedSubsystemId(nextSelection.expandedSubsystemId);
        setActiveSubsystemId(nextSelection.selectedSubsystem?.id ?? '');
        setActiveFirstLevelMenuId(nextSelection.selectedMenu?.id ?? '');
        setSecondLevelMenus([]);
        setSelectedModuleId('');
      } catch (error) {
        setMenuLoadError(getModuleBrowserErrorMessage(error));
        setSubsystemMenus([]);
        setExpandedSubsystemId(null);
        setActiveSubsystemId('');
        setActiveFirstLevelMenuId('');
        setSecondLevelMenus([]);
        setSelectedModuleId('');
      } finally {
        setIsLoadingSubsystemMenus(false);
      }
    };

    void loadSubsystemMenus();
  }, [routeContext]);

  useEffect(() => {
    if (subsystemMenus.length === 0) {
      return;
    }

    const nextSelection = resolveDesignMenuSelection(subsystemMenus, routeContext);

    setExpandedSubsystemId(nextSelection.expandedSubsystemId);
    setActiveSubsystemId(nextSelection.selectedSubsystem?.id ?? '');
    setActiveFirstLevelMenuId(nextSelection.selectedMenu?.id ?? '');
  }, [routeContext, subsystemMenus]);

  useEffect(() => {
    let isCurrent = true;

    const loadSecondLevelMenus = async () => {
      if (!selectedSubsystem || !activeFirstLevelMenu?.menuId) {
        setSecondLevelMenus([]);
        setSelectedModuleId('');
        setIsLoadingSecondLevelMenus(false);
        return;
      }

      setIsLoadingSecondLevelMenus(true);
      setMenuLoadError(null);

      try {
        const data = getEnabledMenuNodes(
          await fetchSubsystemSecondLevelMenus({
            menuId: activeFirstLevelMenu.menuId,
            subsysId: selectedSubsystem.subsysId,
          }),
        );

        if (!isCurrent) {
          return;
        }

        const nextSelectedModule = resolveDesignModuleSelection(data, routeContext.moduleCode);

        setSecondLevelMenus(data);
        setSelectedModuleId((currentSelectedId) => {
          if (nextSelectedModule) {
            return nextSelectedModule.id;
          }

          return data.some((item) => item.id === currentSelectedId) ? currentSelectedId : (data[0]?.id ?? '');
        });
      } catch (error) {
        if (!isCurrent) {
          return;
        }

        setMenuLoadError(getModuleBrowserErrorMessage(error));
        setSecondLevelMenus([]);
        setSelectedModuleId('');
      } finally {
        if (isCurrent) {
          setIsLoadingSecondLevelMenus(false);
        }
      }
    };

    void loadSecondLevelMenus();

    return () => {
      isCurrent = false;
    };
  }, [activeFirstLevelMenu?.menuId, routeContext.moduleCode, selectedSubsystem]);

  return {
    activeFirstLevelMenu,
    activeFirstLevelMenuId,
    activeSubsystemId,
    expandedSubsystemId,
    firstLevelMenus,
    isLoadingSecondLevelMenus,
    isLoadingSubsystemMenus,
    menuLoadError,
    secondLevelMenus,
    selectedModule,
    selectedSubsystem,
    subsystemMenus,
    setActiveFirstLevelMenuId,
    setActiveSubsystemId,
    setExpandedSubsystemId,
    setSelectedModuleId,
  };
}
