import {
  createRuntimeClassName,
  createRuntimeDeclarationBlock,
  joinRuntimeDeclarationBlocks,
} from '../designer/runtime-dimension-rules';
import {
  resolveWorkbenchPreviewWidth,
  type ActiveWorkbenchResize,
} from '../resize/use-workbench-resize-state';

import {
  buildResizeSnapCandidates,
  resolveResizeWidthWithSnap,
} from './dashboard-resize-snap-utils';

export const CONDITION_PANEL_CONTROL_WIDTH = 175;
export const CONDITION_PANEL_RESIZE_MIN_WIDTH = 116;
export const CONDITION_PANEL_RESIZE_MAX_WIDTH = 620;
export const CONDITION_PANEL_ROW_HEIGHT = 46;
export const CONDITION_PANEL_ROW_GAP = 8;
export const CONDITION_PANEL_MIN_ROWS = 1;
export const CONDITION_PANEL_MAX_ROWS = 6;

export function clampValue(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function buildDocumentFilterRuntimeRules(
  fields: any[],
  activeResizeState: ActiveWorkbenchResize | null,
) {
  return joinRuntimeDeclarationBlocks(
    fields.flatMap((field) => {
      const normalizedWidth = Math.min(
        CONDITION_PANEL_RESIZE_MAX_WIDTH,
        Math.max(
          CONDITION_PANEL_RESIZE_MIN_WIDTH,
          Number.isFinite(Number(field?.width)) ? Number(field.width) : CONDITION_PANEL_CONTROL_WIDTH,
        ),
      );
      const normalizedField = {
        ...field,
        name: field?.name ?? '',
        type: field?.type ?? '文本',
        width: normalizedWidth,
      };
      const filterControlWidth = resolveWorkbenchPreviewWidth(
        normalizedField.width,
        168,
        148,
        activeResizeState,
        normalizedField.id,
        'filter',
      );
      const labelWidth = Math.max(60, Math.min(132, normalizedField.name.length * 14 + 12));
      const previewWidth = normalizedField.type === '日期框'
        ? 58
        : normalizedField.type === '数字'
          ? 48
          : normalizedField.type === '搜索框'
            ? 64
            : 52;
      const minimumFilterWidth = labelWidth + previewWidth + 18;
      const filterWidth = Math.max(
        minimumFilterWidth,
        Math.min(188, Math.max(minimumFilterWidth, filterControlWidth - 60)),
      );
      const widthClassName = createRuntimeClassName('document-filter-width', normalizedField.id);
      const labelClassName = createRuntimeClassName('document-filter-label', normalizedField.id);
      const previewClassName = createRuntimeClassName('document-filter-preview', normalizedField.id);

      return [
        createRuntimeDeclarationBlock(widthClassName, { width: filterWidth, 'min-width': filterWidth }),
        createRuntimeDeclarationBlock(labelClassName, { width: labelWidth, 'min-width': labelWidth }),
        createRuntimeDeclarationBlock(previewClassName, { width: previewWidth, 'min-width': previewWidth }),
      ];
    }),
  );
}

export const CONDITION_WORKBENCH_HELPERS = {
  buildResizeSnapCandidates,
  clampValue,
  resolveResizeWidthWithSnap,
} as const;

export const CONDITION_WORKBENCH_METRICS = {
  controlWidth: CONDITION_PANEL_CONTROL_WIDTH,
  maxRows: CONDITION_PANEL_MAX_ROWS,
  maxWidth: CONDITION_PANEL_RESIZE_MAX_WIDTH,
  minRows: CONDITION_PANEL_MIN_ROWS,
  minWidth: CONDITION_PANEL_RESIZE_MIN_WIDTH,
  rowGap: CONDITION_PANEL_ROW_GAP,
  rowHeight: CONDITION_PANEL_ROW_HEIGHT,
} as const;
