import { useCallback } from 'react';

export const DETAIL_BOARD_FIELD_DEFAULT_WIDTH = 280;
export const DETAIL_BOARD_FIELD_MIN_WIDTH = 220;
export const DETAIL_BOARD_FIELD_MAX_WIDTH = 920;
export const DETAIL_BOARD_FIELD_DEFAULT_HEIGHT = 52;
export const DETAIL_BOARD_TALL_FIELD_DEFAULT_HEIGHT = 96;
export const DETAIL_BOARD_TALL_FIELD_MIN_HEIGHT = 88;
export const DETAIL_BOARD_TALL_FIELD_MAX_HEIGHT = 340;

export type NormalizeLayoutWorkbenchField = (field: any) => any;

export type LayoutFieldWorkbenchMeta = {
  field: any;
  frameClass: string;
  height: number;
  isTallControl: boolean;
  minHeight: number;
  minWidth: number;
  previewRows: number;
  width: number;
};

export type LayoutFieldWorkbenchMetaResolver = (
  rawField: any,
  customWidth?: number | null,
  customHeight?: number | null,
) => LayoutFieldWorkbenchMeta;

function clampNumber(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function isTallLayoutWorkbenchField(field: any) {
  const typeText = String(field.type ?? '').toLowerCase();
  return ['备注', '说明', '多行', '文本域', 'textarea', '富文本', 'markdown']
    .some((keyword) => typeText.includes(keyword.toLowerCase()))
    || Number(field.previewRows) >= 3
    || Number(field.layoutRows) >= 2;
}

export function buildLayoutFieldWorkbenchMeta(
  normalizeField: NormalizeLayoutWorkbenchField,
  rawField: any,
  customWidth?: number | null,
  customHeight?: number | null,
): LayoutFieldWorkbenchMeta {
  const field = normalizeField(rawField);
  const isTallControl = isTallLayoutWorkbenchField(field);
  const minWidth = isTallControl ? 320 : DETAIL_BOARD_FIELD_MIN_WIDTH;
  const minHeight = isTallControl ? DETAIL_BOARD_TALL_FIELD_MIN_HEIGHT : DETAIL_BOARD_FIELD_DEFAULT_HEIGHT;
  const preferredWidth = Number.isFinite(Number(customWidth)) && Number(customWidth) > 0
    ? Number(customWidth)
    : Number.isFinite(Number(field.width)) && Number(field.width) > 0
      ? Number(field.width)
      : (isTallControl ? 360 : DETAIL_BOARD_FIELD_DEFAULT_WIDTH);
  const preferredHeight = Number.isFinite(Number(customHeight)) && Number(customHeight) > 0
    ? Number(customHeight)
    : Number.isFinite(Number(field.layoutHeight)) && Number(field.layoutHeight) > 0
      ? Number(field.layoutHeight)
      : (isTallControl ? DETAIL_BOARD_TALL_FIELD_DEFAULT_HEIGHT : DETAIL_BOARD_FIELD_DEFAULT_HEIGHT);

  return {
    field,
    isTallControl,
    width: clampNumber(preferredWidth, minWidth, DETAIL_BOARD_FIELD_MAX_WIDTH),
    height: isTallControl
      ? clampNumber(preferredHeight, minHeight, DETAIL_BOARD_TALL_FIELD_MAX_HEIGHT)
      : DETAIL_BOARD_FIELD_DEFAULT_HEIGHT,
    minWidth,
    minHeight,
    previewRows: isTallControl ? 4 : 1,
    frameClass: isTallControl ? 'min-h-[96px]' : 'min-h-[52px]',
  };
}

export function useLayoutFieldWorkbenchMeta(
  normalizeField: NormalizeLayoutWorkbenchField,
): LayoutFieldWorkbenchMetaResolver {
  return useCallback((rawField, customWidth, customHeight) => (
    buildLayoutFieldWorkbenchMeta(normalizeField, rawField, customWidth, customHeight)
  ), [normalizeField]);
}
