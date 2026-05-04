import type { CSSProperties } from 'react';

const DEFAULT_GRID_COLUMNS = 12;
const MAX_GRID_COLUMNS = 24;
const DEFAULT_ROW_HEIGHT = 56;
const COMPACT_ROW_HEIGHT = 36;

function toFiniteNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : null;
  }

  return null;
}

function clampInteger(value: unknown, min: number, max: number, fallback: number) {
  const numericValue = toFiniteNumber(value);
  if (numericValue == null) {
    return fallback;
  }
  return Math.max(min, Math.min(max, Math.round(numericValue)));
}

export function getBiGridColumnCount(moduleLayout?: Record<string, unknown> | null) {
  return clampInteger(
    moduleLayout?.columns ?? moduleLayout?.cols ?? moduleLayout?.columnCount,
    1,
    MAX_GRID_COLUMNS,
    DEFAULT_GRID_COLUMNS,
  );
}

export function getBiGridTemplateStyle(
  moduleLayout?: Record<string, unknown> | null,
  variableName = '--bi-layout-columns',
) {
  return { [variableName]: getBiGridColumnCount(moduleLayout) } as CSSProperties;
}

export function getBiModuleGridItemStyle({
  compact = false,
  fallbackSpan,
  layout,
  minHeight,
  moduleLayout,
}: {
  compact?: boolean;
  fallbackSpan: number;
  layout?: Record<string, unknown> | null;
  minHeight?: string;
  moduleLayout?: Record<string, unknown> | null;
}) {
  const columns = getBiGridColumnCount(moduleLayout);
  const rawX = toFiniteNumber(layout?.x);
  const rawY = toFiniteNumber(layout?.y);
  const width = clampInteger(layout?.w ?? layout?.width ?? layout?.colSpan ?? layout?.span, 1, columns, fallbackSpan);
  const height = clampInteger(layout?.h ?? layout?.heightRows ?? layout?.rowSpan, 1, 60, 1);
  const gridStyle: CSSProperties = {
    gridColumn: `span ${Math.max(1, Math.min(columns, width))}`,
    gridRow: height > 1 ? `span ${height}` : undefined,
    minHeight: minHeight ?? `${Math.max(compact ? 92 : 150, height * (compact ? COMPACT_ROW_HEIGHT : DEFAULT_ROW_HEIGHT))}px`,
  };

  if (rawX != null) {
    const x = Math.max(0, Math.min(columns - 1, Math.round(rawX)));
    gridStyle.gridColumn = `${x + 1} / span ${Math.max(1, Math.min(width, columns - x))}`;
  }

  if (rawY != null) {
    gridStyle.gridRow = `${Math.max(0, Math.round(rawY)) + 1} / span ${height}`;
  }

  return gridStyle;
}
