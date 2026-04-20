import React, { useCallback } from 'react';
import {
  alignBillHeaderFieldsToFlowLayout,
  getBillHeaderFieldWidth,
} from './dashboard-bill-form-layout-utils';

type BillCanvasFieldScope = 'main' | 'meta';

type UseBillHeaderWorkbenchParams = {
  billHeaderCanvasRef: React.RefObject<HTMLDivElement | null>;
  billHeaderWorkbenchRows: number;
  billMetaFields: any[];
  mainTableColumns: any[];
  setBillHeaderWorkbenchConfig: React.Dispatch<React.SetStateAction<{ rows: number }>>;
  setBillMetaFields: React.Dispatch<React.SetStateAction<any[]>>;
  setMainTableColumns: React.Dispatch<React.SetStateAction<any[]>>;
  clampValue: (value: number, min: number, max: number) => number;
  normalizeColumn: (column: any) => any;
  constants: {
    defaultWidth: number;
    gapX: number;
    gapY: number;
    layoutPaddingX: number;
    layoutPaddingY: number;
    maxRows: number;
    maxWidth: number;
    minRows: number;
    minWidth: number;
    rowHeight: number;
  };
};

export function useBillHeaderWorkbench({
  billHeaderCanvasRef,
  billHeaderWorkbenchRows,
  billMetaFields,
  mainTableColumns,
  setBillHeaderWorkbenchConfig,
  setBillMetaFields,
  setMainTableColumns,
  clampValue,
  normalizeColumn,
  constants,
}: UseBillHeaderWorkbenchParams) {
  const getBillHeaderDragItemId = useCallback((fieldId: string, scope: BillCanvasFieldScope) => (
    `bill-header-item:${scope}:${fieldId}`
  ), []);

  const getBillHeaderDropItemId = useCallback((fieldId: string, scope: BillCanvasFieldScope) => (
    `bill-header-drop:${scope}:${fieldId}`
  ), []);

  const getBillHeaderRowDropId = useCallback((row: number) => `bill-header-row:${row}`, []);

  const getBillHeaderLegacyRow = useCallback((field: any) => {
    const legacyY = Number.isFinite(Number(field?.canvasY))
      ? Number(field.canvasY)
      : constants.layoutPaddingY;
    return Math.floor(
      Math.max(0, legacyY - constants.layoutPaddingY) / (constants.rowHeight + constants.gapY),
    ) + 1;
  }, [constants.gapY, constants.layoutPaddingY, constants.rowHeight]);

  const getBillHeaderLegacyMetrics = useCallback((field: any) => ({
    x: Number.isFinite(Number(field?.canvasX)) ? Number(field.canvasX) : constants.layoutPaddingX,
    y: Number.isFinite(Number(field?.canvasY)) ? Number(field.canvasY) : constants.layoutPaddingY,
    row: getBillHeaderLegacyRow(field),
  }), [constants.layoutPaddingX, constants.layoutPaddingY, getBillHeaderLegacyRow]);

  const resolveBillHeaderFieldRow = useCallback((field: any) => clampValue(
    Number.isFinite(Number(field?.panelRow))
      ? Number(field.panelRow)
      : getBillHeaderLegacyMetrics(field).row,
    constants.minRows,
    constants.maxRows,
  ), [clampValue, constants.maxRows, constants.minRows, getBillHeaderLegacyMetrics]);

  const getBillHeaderRowCount = useCallback((
    metaFields = billMetaFields,
    mainFields = mainTableColumns,
  ) => clampValue(
    [...metaFields, ...mainFields].reduce((maxRow, field) => (
      Math.max(maxRow, resolveBillHeaderFieldRow(field))
    ), Number.isFinite(Number(billHeaderWorkbenchRows)) ? Number(billHeaderWorkbenchRows) : 3),
    constants.minRows,
    constants.maxRows,
  ), [
    billHeaderWorkbenchRows,
    billMetaFields,
    clampValue,
    constants.maxRows,
    constants.minRows,
    mainTableColumns,
    resolveBillHeaderFieldRow,
  ]);

  const alignBillHeaderFields = useCallback((fields: any[], rowCount = getBillHeaderRowCount()) => (
    alignBillHeaderFieldsToFlowLayout(
      fields.map((field, index) => {
        const normalized = normalizeColumn(field);
        return {
          ...normalized,
          __scope: field.__scope ?? normalized.__scope,
          panelOrder: Number.isFinite(Number(normalized.panelOrder))
            ? Number(normalized.panelOrder)
            : index + 1,
          panelRow: clampValue(resolveBillHeaderFieldRow(normalized), constants.minRows, rowCount),
          width: getBillHeaderFieldWidth(normalized, {
            defaultWidth: constants.defaultWidth,
            maxWidth: constants.maxWidth,
            minWidth: constants.minWidth,
          }),
        };
      }),
      {
        defaultWidth: constants.defaultWidth,
        gapX: constants.gapX,
        gapY: constants.gapY,
        layoutPaddingX: constants.layoutPaddingX,
        layoutPaddingY: constants.layoutPaddingY,
        maxWidth: constants.maxWidth,
        minRowHeight: constants.rowHeight,
        minWidth: constants.minWidth,
      },
    )
  ), [
    clampValue,
    constants.defaultWidth,
    constants.gapX,
    constants.gapY,
    constants.layoutPaddingX,
    constants.layoutPaddingY,
    constants.maxWidth,
    constants.minRows,
    constants.minWidth,
    constants.rowHeight,
    getBillHeaderRowCount,
    normalizeColumn,
    resolveBillHeaderFieldRow,
  ]);

  const getOrderedBillHeaderFields = useCallback((
    metaFields = billMetaFields,
    mainFields = mainTableColumns,
    rowCount = getBillHeaderRowCount(metaFields, mainFields),
  ) => {
    const scopedFields = [
      ...metaFields.map((field) => ({ ...field, __scope: 'meta' as BillCanvasFieldScope })),
      ...mainFields.map((field) => ({ ...field, __scope: 'main' as BillCanvasFieldScope })),
    ];
    const legacySorted = scopedFields
      .slice()
      .sort((left, right) => {
        const leftMetrics = getBillHeaderLegacyMetrics(left);
        const rightMetrics = getBillHeaderLegacyMetrics(right);
        if (leftMetrics.row !== rightMetrics.row) return leftMetrics.row - rightMetrics.row;
        if (leftMetrics.y !== rightMetrics.y) return leftMetrics.y - rightMetrics.y;
        return leftMetrics.x - rightMetrics.x;
      });
    const legacyOrderMap = new Map(legacySorted.map((field, index) => [field.id, index + 1]));

    return alignBillHeaderFields(scopedFields
      .map((field) => {
        const normalized = normalizeColumn(field);
        return {
          ...normalized,
          __scope: field.__scope,
          panelRow: clampValue(resolveBillHeaderFieldRow(normalized), constants.minRows, rowCount),
          panelOrder: Number.isFinite(Number(normalized.panelOrder))
            ? Number(normalized.panelOrder)
            : (legacyOrderMap.get(field.id) ?? 1),
        };
      })
      .sort((left, right) => {
        if (left.panelRow !== right.panelRow) return left.panelRow - right.panelRow;
        if (left.panelOrder !== right.panelOrder) return left.panelOrder - right.panelOrder;
        return (legacyOrderMap.get(left.id) ?? 0) - (legacyOrderMap.get(right.id) ?? 0);
      }), rowCount);
  }, [
    alignBillHeaderFields,
    billMetaFields,
    clampValue,
    constants.minRows,
    getBillHeaderLegacyMetrics,
    getBillHeaderRowCount,
    resolveBillHeaderFieldRow,
    mainTableColumns,
    normalizeColumn,
  ]);

  const commitBillHeaderFields = useCallback((
    updater: any[] | ((fields: any[]) => any[]),
    rowCount = getBillHeaderRowCount(),
  ) => {
    const metaIdSet = new Set(billMetaFields.map((field) => field.id));
    const currentFields = getOrderedBillHeaderFields(billMetaFields, mainTableColumns, rowCount)
      .map(({ ...field }) => ({ ...field }));
    const nextRaw = typeof updater === 'function' ? updater(currentFields) : updater;
    const nextFields = alignBillHeaderFields(nextRaw, rowCount);
    setBillMetaFields(nextFields.filter((field) => metaIdSet.has(field.id)));
    setMainTableColumns(nextFields.filter((field) => !metaIdSet.has(field.id)));
  }, [
    alignBillHeaderFields,
    billMetaFields,
    getBillHeaderRowCount,
    getOrderedBillHeaderFields,
    mainTableColumns,
    setBillMetaFields,
    setMainTableColumns,
  ]);

  const updateBillHeaderWorkbenchRows = useCallback((nextRows: number) => {
    const clampedRows = clampValue(nextRows, constants.minRows, constants.maxRows);
    setBillHeaderWorkbenchConfig((prev) => (
      prev.rows === clampedRows ? prev : { ...prev, rows: clampedRows }
    ));
    commitBillHeaderFields(
      (fields) => fields.map((field) => ({
        ...field,
        panelRow: clampValue(
          Number.isFinite(Number(field?.panelRow)) ? Number(field.panelRow) : constants.minRows,
          constants.minRows,
          clampedRows,
        ),
      })),
      clampedRows,
    );
  }, [clampValue, commitBillHeaderFields, constants.maxRows, constants.minRows, setBillHeaderWorkbenchConfig]);

  const moveBillHeaderField = useCallback((fieldId: string, rowNumber: number, beforeId: string | null = null) => {
    const rowCount = getBillHeaderRowCount();
    const nextRow = clampValue(rowNumber, constants.minRows, rowCount);
    commitBillHeaderFields((fields) => {
      const sourceIndex = fields.findIndex((field) => field.id === fieldId);
      if (sourceIndex === -1) return fields;
      if (beforeId && beforeId === fieldId) return fields;

      const sourceField = {
        ...fields[sourceIndex],
        panelRow: nextRow,
      };
      const remaining = fields.filter((field) => field.id !== fieldId);

      let insertIndex = beforeId ? remaining.findIndex((field) => field.id === beforeId) : -1;
      if (insertIndex === -1) {
        insertIndex = remaining.findIndex((field) => (
          clampValue(
            Number.isFinite(Number(field?.panelRow)) ? Number(field.panelRow) : constants.minRows,
            constants.minRows,
            rowCount,
          ) > nextRow
        ));
        if (insertIndex === -1) {
          insertIndex = remaining.length;
        }
      }

      return [
        ...remaining.slice(0, insertIndex),
        sourceField,
        ...remaining.slice(insertIndex),
      ];
    }, rowCount);
  }, [clampValue, commitBillHeaderFields, constants.minRows, getBillHeaderRowCount]);

  const autoArrangeBillHeaderFields = useCallback(() => {
    const boardWidth = billHeaderCanvasRef.current?.clientWidth ?? 1080;
    const usableWidth = Math.max(760, boardWidth - 40);
    const rowCount = getBillHeaderRowCount();
    let currentRow = 1;
    let currentRowWidth = 0;

    commitBillHeaderFields((fields) => (
      fields.map((field) => {
        const normalizedField = normalizeColumn(field);
        const nextWidth = getBillHeaderFieldWidth(normalizedField, {
          defaultWidth: constants.defaultWidth,
          maxWidth: constants.maxWidth,
          minWidth: constants.minWidth,
        });

        if (
          currentRowWidth > 0
          && currentRowWidth + nextWidth > usableWidth
          && currentRow < rowCount
        ) {
          currentRow += 1;
          currentRowWidth = 0;
        }

        currentRowWidth += nextWidth + constants.gapX;
        return {
          ...field,
          panelRow: currentRow,
        };
      })
    ), rowCount);
  }, [
    billHeaderCanvasRef,
    commitBillHeaderFields,
    constants.defaultWidth,
    constants.gapX,
    constants.maxWidth,
    constants.minWidth,
    getBillHeaderRowCount,
    normalizeColumn,
  ]);

  return {
    autoArrangeBillHeaderFields,
    commitBillHeaderFields,
    getBillHeaderDragItemId,
    getBillHeaderDropItemId,
    getBillHeaderRowCount,
    getBillHeaderRowDropId,
    getOrderedBillHeaderFields,
    moveBillHeaderField,
    updateBillHeaderWorkbenchRows,
  };
}
