import { useCallback, useMemo, useState } from 'react';

import {
  deleteBillTypeDesignerGroup,
  deleteBillTypeDesignerLayout,
  fetchBillTypeDesignerGroups,
  fetchBillTypeDesignerLayout,
  saveBillTypeDesignerGroup,
  saveBillTypeDesignerLayout,
  deleteSingleTableDesignerGroup,
  deleteSingleTableDesignerLayout,
  fetchSingleTableDesignerControls,
  fetchSingleTableDesignerGroups,
  fetchSingleTableDesignerLayout,
  saveSingleTableDesignerGroup,
  saveSingleTableDesignerLayout,
  syncSingleTableDesignerLayout,
} from '../../../lib/backend-module-config';
import { buildArchiveLayoutDesignerState, buildArchiveLayoutSavePlan } from './archive-layout-designer-backend';

type UseArchiveLayoutDesignerSaveOptions = {
  businessType: string;
  currentDetailBoard: Record<string, any>;
  currentModuleCode: string;
  layoutColumns: Record<string, any>[];
  onShowToast: (message: string) => void;
  onUpdateDetailBoard: (patch: Record<string, any> | ((current: any) => any)) => void;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return '\u5b9a\u4e49\u8bbe\u8ba1\u4fdd\u5b58\u5931\u8d25\u3002';
}

export function useArchiveLayoutDesignerSave({
  businessType,
  currentDetailBoard,
  currentModuleCode,
  layoutColumns,
  onShowToast,
  onUpdateDetailBoard,
}: UseArchiveLayoutDesignerSaveOptions) {
  const [isSaving, setIsSaving] = useState(false);
  const isDirty = Boolean(currentDetailBoard?.archiveLayoutDirty);

  const saveArchiveLayout = useCallback(async () => {
    const moduleCode = currentModuleCode.trim();
    if (!moduleCode) {
      onShowToast('\u8bf7\u5148\u4fdd\u5b58\u6a21\u5757\u4fe1\u606f\uff0c\u518d\u4fdd\u5b58\u5b9a\u4e49\u8bbe\u8ba1\u3002');
      return false;
    }

    const savePlan = buildArchiveLayoutSavePlan(currentDetailBoard, layoutColumns);
    const hasChanges = savePlan.groupSaveBodies.length > 0
      || savePlan.groupDeleteIds.length > 0
      || savePlan.layoutSaveBodies.length > 0
      || savePlan.layoutDeleteFieldIds.length > 0;
    const hasLayoutChanges = savePlan.layoutSaveBodies.length > 0 || savePlan.layoutDeleteFieldIds.length > 0;

    if (!hasChanges) {
      onShowToast('\u5f53\u524d\u6ca1\u6709\u53ef\u4fdd\u5b58\u7684\u5b9a\u4e49\u8bbe\u8ba1\u5e03\u5c40\u3002');
      return false;
    }

    setIsSaving(true);
    try {
      for (const body of savePlan.groupSaveBodies) {
        if (businessType === 'table') {
          await saveBillTypeDesignerGroup(moduleCode, body);
        } else {
          await saveSingleTableDesignerGroup(moduleCode, body);
        }
      }

      for (const body of savePlan.layoutSaveBodies) {
        if (businessType === 'table') {
          await saveBillTypeDesignerLayout(moduleCode, body);
        } else {
          await saveSingleTableDesignerLayout(moduleCode, body);
        }
      }

      for (const fieldId of savePlan.layoutDeleteFieldIds) {
        if (businessType === 'table') {
          await deleteBillTypeDesignerLayout(moduleCode, fieldId);
        } else {
          await deleteSingleTableDesignerLayout(moduleCode, fieldId);
        }
      }

      for (const groupId of savePlan.groupDeleteIds) {
        if (businessType === 'table') {
          await deleteBillTypeDesignerGroup(moduleCode, groupId);
        } else {
          await deleteSingleTableDesignerGroup(moduleCode, groupId);
        }
      }

      if (businessType !== 'table' && hasLayoutChanges) {
        await syncSingleTableDesignerLayout(moduleCode);
      }

      const [controlRows, groupRows, layoutRows] = await Promise.all([
        businessType === 'table'
          ? Promise.resolve([])
          : fetchSingleTableDesignerControls(moduleCode),
        businessType === 'table'
          ? fetchBillTypeDesignerGroups(moduleCode)
          : fetchSingleTableDesignerGroups(moduleCode),
        businessType === 'table'
          ? fetchBillTypeDesignerLayout(moduleCode)
          : fetchSingleTableDesignerLayout(moduleCode),
      ]);
      const designerState = buildArchiveLayoutDesignerState(
        moduleCode,
        controlRows,
        groupRows,
        layoutRows,
        layoutColumns,
      );

      onUpdateDetailBoard((current: any) => {
        return {
          ...current,
          ...designerState.detailBoardPatch,
        };
      });

      onShowToast('\u5b9a\u4e49\u8bbe\u8ba1\u5df2\u4fdd\u5b58\u3002');
      return true;
    } catch (error) {
      onShowToast(getErrorMessage(error));
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [businessType, currentDetailBoard, currentModuleCode, layoutColumns, onShowToast, onUpdateDetailBoard]);

  return useMemo(() => ({
    isDirty,
    isSaving,
    saveArchiveLayout,
  }), [isDirty, isSaving, saveArchiveLayout]);
}
