import { type Dispatch, type SetStateAction, useCallback, useEffect, useRef } from 'react';

import { normalizeContextMenuItem } from './context-menu-utils';

const POPUP_PARAM_KEYS = Array.from({ length: 10 }, (_, index) => `dllpar${index + 1}`);

export function useDashboardGridMenuSelectionState({
  inspectorTargetKind,
  leftColorRules,
  leftContextMenuItems,
  mainColorRules,
  mainContextMenuItems,
  selectedLeftColorRuleId,
  selectedLeftContextMenuId,
  selectedMainColorRuleId,
  selectedMainContextMenuId,
  setSelectedLeftColorRuleId,
  setSelectedLeftContextMenuId,
  setSelectedMainColorRuleId,
  setSelectedMainContextMenuId,
  setSelectedPopupMenuParamKey,
}: {
  inspectorTargetKind: string;
  leftColorRules: any[];
  leftContextMenuItems: any[];
  mainColorRules: any[];
  mainContextMenuItems: any[];
  selectedLeftColorRuleId: string | null;
  selectedLeftContextMenuId: string | null;
  selectedMainColorRuleId: string | null;
  selectedMainContextMenuId: string | null;
  setSelectedLeftColorRuleId: Dispatch<SetStateAction<string | null>>;
  setSelectedLeftContextMenuId: Dispatch<SetStateAction<string | null>>;
  setSelectedMainColorRuleId: Dispatch<SetStateAction<string | null>>;
  setSelectedMainContextMenuId: Dispatch<SetStateAction<string | null>>;
  setSelectedPopupMenuParamKey: Dispatch<SetStateAction<string>>;
}) {
  const selectedPopupMenuOwnerRef = useRef<string | null>(null);

  const resetGridMenuSelectionState = useCallback(() => {
    setSelectedLeftContextMenuId(null);
    setSelectedMainContextMenuId(null);
    setSelectedLeftColorRuleId(null);
    setSelectedMainColorRuleId(null);
    setSelectedPopupMenuParamKey('dllpar1');
    selectedPopupMenuOwnerRef.current = null;
  }, [
    setSelectedLeftColorRuleId,
    setSelectedLeftContextMenuId,
    setSelectedMainColorRuleId,
    setSelectedMainContextMenuId,
    setSelectedPopupMenuParamKey,
  ]);

  useEffect(() => {
    if (!leftContextMenuItems.some((item: any) => item.id === selectedLeftContextMenuId)) {
      setSelectedLeftContextMenuId(leftContextMenuItems[0]?.id ?? null);
    }
  }, [leftContextMenuItems, selectedLeftContextMenuId, setSelectedLeftContextMenuId]);

  useEffect(() => {
    if (!leftColorRules.some((rule: any) => rule.id === selectedLeftColorRuleId)) {
      setSelectedLeftColorRuleId(leftColorRules[0]?.id ?? null);
    }
  }, [leftColorRules, selectedLeftColorRuleId, setSelectedLeftColorRuleId]);

  useEffect(() => {
    if (!mainContextMenuItems.some((item: any) => item.id === selectedMainContextMenuId)) {
      setSelectedMainContextMenuId(mainContextMenuItems[0]?.id ?? null);
    }
  }, [mainContextMenuItems, selectedMainContextMenuId, setSelectedMainContextMenuId]);

  useEffect(() => {
    const useLeftMenuScope = inspectorTargetKind === 'left-grid';
    const contextMenuItems = (useLeftMenuScope ? leftContextMenuItems : mainContextMenuItems)
      .map((item: any, index: number) => normalizeContextMenuItem(item, index + 1));
    const selectedMenuId = useLeftMenuScope ? selectedLeftContextMenuId : selectedMainContextMenuId;
    const selectedMenu = contextMenuItems.find((item: any) => item.id === selectedMenuId) ?? contextMenuItems[0] ?? null;

    setSelectedPopupMenuParamKey((prev) => {
      if (!selectedMenu) {
        selectedPopupMenuOwnerRef.current = null;
        return 'dllpar1';
      }

      const isMenuChanged = selectedPopupMenuOwnerRef.current !== selectedMenu.id;
      selectedPopupMenuOwnerRef.current = selectedMenu.id;

      if (!POPUP_PARAM_KEYS.includes(prev)) return 'dllpar1';
      if (!isMenuChanged) return prev;

      return POPUP_PARAM_KEYS.find((key) => String(selectedMenu[key] ?? '').trim().length > 0) ?? 'dllpar1';
    });
  }, [
    inspectorTargetKind,
    leftContextMenuItems,
    mainContextMenuItems,
    selectedLeftContextMenuId,
    selectedMainContextMenuId,
    setSelectedPopupMenuParamKey,
  ]);

  useEffect(() => {
    if (!mainColorRules.some((rule: any) => rule.id === selectedMainColorRuleId)) {
      setSelectedMainColorRuleId(mainColorRules[0]?.id ?? null);
    }
  }, [mainColorRules, selectedMainColorRuleId, setSelectedMainColorRuleId]);

  return {
    resetGridMenuSelectionState,
  };
}
