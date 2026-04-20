import { type Dispatch, type SetStateAction, useCallback, useState } from 'react';

import { type BackendMenuNode } from '../../../lib/backend-menus';
import {
  deleteBillTypeConfig,
  deleteSingleTableModuleConfig,
} from '../../../lib/backend-module-config';
import { deleteSubsystemMenuConfig } from '../../../lib/backend-subsystem-menu-config';

function normalizeMenuTitle(value?: string) {
  return value?.trim() || '';
}

function normalizeMenuCode(value?: string) {
  return value?.trim() || '';
}

export function useDashboardMenuDeleteFlow({
  activeConfigMenu,
  closeConfigWizard,
  setActiveConfigMenu,
  setMenuInfoError,
  setSecondLevelMenus,
  showToast,
}: {
  activeConfigMenu: BackendMenuNode | null;
  closeConfigWizard: () => void;
  setActiveConfigMenu: Dispatch<SetStateAction<BackendMenuNode | null>>;
  setMenuInfoError: Dispatch<SetStateAction<string | null>>;
  setSecondLevelMenus: Dispatch<SetStateAction<BackendMenuNode[]>>;
  showToast: (message: string) => void;
}) {
  const [deletingMenuId, setDeletingMenuId] = useState<string | null>(null);
  const [pendingDeleteMenu, setPendingDeleteMenu] = useState<BackendMenuNode | null>(null);

  const closeDeleteConfirm = useCallback(() => {
    setPendingDeleteMenu(null);
  }, []);

  const handleSecondLevelMenuDelete = useCallback(async (menu: BackendMenuNode) => {
    const moduleKey = normalizeMenuCode(menu.purviewId);
    const menuId = Number(menu.menuId);
    const normalizedModuleType = String(menu.moduleType || '').trim().toLowerCase();
    const menuTitle = normalizeMenuTitle(menu.title) || '当前模块';
    const shouldDeleteBillConfig = normalizedModuleType === 'bill';
    const shouldDeleteSingleTableConfig = normalizedModuleType === 'single-table';

    if (!Number.isFinite(menuId) || menuId <= 0) {
      showToast('当前菜单缺少菜单编号，无法删除。');
      return;
    }

    setDeletingMenuId(menu.id);

    try {
      if (shouldDeleteBillConfig && moduleKey) {
        await deleteBillTypeConfig(moduleKey);
      } else if (shouldDeleteSingleTableConfig && moduleKey) {
        await deleteSingleTableModuleConfig(moduleKey);
      }

      await deleteSubsystemMenuConfig(menuId);

      setSecondLevelMenus((prev) => prev.filter((item) => item.id !== menu.id));

      if (activeConfigMenu?.id === menu.id) {
        setActiveConfigMenu(null);
        setMenuInfoError(null);
        closeConfigWizard();
      }

      setPendingDeleteMenu((prev) => (prev?.id === menu.id ? null : prev));
      showToast(`模块「${menuTitle}」已删除`);
    } catch (error) {
      const message = error instanceof Error && error.message.trim()
        ? error.message
        : '菜单删除失败，请稍后重试。';
      showToast(message);
    } finally {
      setDeletingMenuId(null);
    }
  }, [
    activeConfigMenu,
    closeConfigWizard,
    setActiveConfigMenu,
    setMenuInfoError,
    setSecondLevelMenus,
    showToast,
  ]);

  const confirmDeleteMenu = useCallback(() => {
    if (!pendingDeleteMenu) {
      return;
    }

    void handleSecondLevelMenuDelete(pendingDeleteMenu);
  }, [handleSecondLevelMenuDelete, pendingDeleteMenu]);

  return {
    closeDeleteConfirm,
    confirmDeleteMenu,
    deletingMenuId,
    handleSecondLevelMenuDelete,
    pendingDeleteMenu,
    requestDeleteMenu: setPendingDeleteMenu,
  };
}
