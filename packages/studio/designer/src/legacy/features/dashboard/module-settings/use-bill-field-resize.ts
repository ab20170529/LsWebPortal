import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  alignBillHeaderFieldsToFlowLayout,
  BILL_FORM_MAX_CONTROL_HEIGHT,
  BILL_FORM_MIN_CONTROL_HEIGHT,
  BILL_FORM_WORKBENCH_LAYOUT_GAP_X,
  BILL_FORM_WORKBENCH_LAYOUT_GAP_Y,
  BILL_FORM_WORKBENCH_LAYOUT_PADDING_X,
  BILL_FORM_WORKBENCH_LAYOUT_PADDING_Y,
  BILL_FORM_WORKBENCH_MIN_ROW_HEIGHT,
} from './dashboard-bill-form-layout-utils';

type BillCanvasFieldScope = 'main' | 'meta';
type BillFieldResizeDimension = 'width' | 'height';

type UseBillFieldResizeParams = {
  billHeaderCanvasRef: React.RefObject<HTMLDivElement | null>;
  billHeaderWorkbenchRows: number;
  billMetaFields: any[];
  mainTableColumns: any[];
  setBillMetaFields: React.Dispatch<React.SetStateAction<any[]>>;
  setMainTableColumns: React.Dispatch<React.SetStateAction<any[]>>;
  clampValue: (value: number, min: number, max: number) => number;
  normalizeColumn: (column: any) => any;
  buildResizeSnapCandidates: (
    siblingWidths: number[],
    options: {
      minWidth: number;
      maxWidth: number;
      baseWidth: number;
    },
  ) => number[];
  resolveResizeWidthWithSnap: (
    rawWidth: number,
    options: {
      minWidth: number;
      maxWidth: number;
      snapCandidates: number[];
    },
  ) => {
    width: number;
  };
  constants: {
    defaultWidth: number;
    layoutPaddingX: number;
    maxRows: number;
    maxWidth: number;
    minRows: number;
    minWidth: number;
  };
};

export function useBillFieldResize({
  billHeaderCanvasRef,
  billHeaderWorkbenchRows,
  billMetaFields,
  mainTableColumns,
  setBillMetaFields,
  setMainTableColumns,
  clampValue,
  normalizeColumn,
  buildResizeSnapCandidates,
  resolveResizeWidthWithSnap,
  constants,
}: UseBillFieldResizeParams) {
  const [activeBillResizeId, setActiveBillResizeId] = useState<string | null>(null);
  const [billFieldLivePreview, setBillFieldLivePreview] = useState<{
    id: string;
    scope: BillCanvasFieldScope;
    height?: number;
    width?: number;
  } | null>(null);
  const billFieldResizeRef = useRef<{
    dimension: BillFieldResizeDimension;
    id: string;
    scope: BillCanvasFieldScope;
    startCanvasX: number;
    startHeight: number;
    startX: number;
    startY: number;
    startWidth: number;
    boardWidth: number;
  } | null>(null);
  const billCanvasFieldsRef = useRef<any[]>([...mainTableColumns, ...billMetaFields]);
  const billResizeFrameRef = useRef<number | null>(null);
  const pendingBillResizeRef = useRef<{
    id: string;
    height?: number;
    scope: BillCanvasFieldScope;
    width: number;
  } | null>(null);

  const resetBillFieldResize = useCallback(() => {
    if (billResizeFrameRef.current !== null) {
      window.cancelAnimationFrame(billResizeFrameRef.current);
      billResizeFrameRef.current = null;
    }
    pendingBillResizeRef.current = null;
    setBillFieldLivePreview(null);
    setActiveBillResizeId(null);
    billFieldResizeRef.current = null;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  const startBillFieldResize = useCallback((
    event: React.MouseEvent<HTMLDivElement>,
    columnId: string,
    scope: BillCanvasFieldScope = 'main',
    dimension: BillFieldResizeDimension = 'width',
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const canvasRect = billHeaderCanvasRef.current?.getBoundingClientRect();
    const targetColumn = (scope === 'main' ? mainTableColumns : billMetaFields).find((column) => column.id === columnId);
    if (!canvasRect || !targetColumn) return;

    const normalizedColumn = normalizeColumn(targetColumn);
    const nextWidth = Math.max(constants.minWidth, normalizedColumn.width || constants.defaultWidth);
    const nextHeight = Math.max(
      BILL_FORM_MIN_CONTROL_HEIGHT,
      Math.min(
        BILL_FORM_MAX_CONTROL_HEIGHT,
        Math.round(Number(normalizedColumn.controlHeight ?? normalizedColumn.layoutHeight ?? BILL_FORM_MIN_CONTROL_HEIGHT) || BILL_FORM_MIN_CONTROL_HEIGHT),
      ),
    );
    billFieldResizeRef.current = {
      dimension,
      id: columnId,
      scope,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: nextWidth,
      startHeight: nextHeight,
      startCanvasX: Number(normalizedColumn.canvasX ?? normalizedColumn.controlLeft ?? 0) || 0,
      boardWidth: canvasRect.width,
    };
    setBillFieldLivePreview({
      id: columnId,
      scope,
      height: nextHeight,
      width: nextWidth,
    });
    setActiveBillResizeId(columnId);
    document.body.style.cursor = dimension === 'height' ? 'ns-resize' : 'ew-resize';
    document.body.style.userSelect = 'none';
  }, [
    billHeaderCanvasRef,
    billMetaFields,
    constants.defaultWidth,
    constants.minWidth,
    mainTableColumns,
    normalizeColumn,
  ]);

  useEffect(() => {
    billCanvasFieldsRef.current = [...mainTableColumns, ...billMetaFields];
  }, [mainTableColumns, billMetaFields]);

  useEffect(() => {
    const activeResizeId = billFieldResizeRef.current?.id ?? activeBillResizeId;
    if (!activeResizeId) {
      return;
    }

    const hasActiveField = billCanvasFieldsRef.current.some((column) => column.id === activeResizeId);
    if (hasActiveField) {
      return;
    }

    const cleanupId = window.setTimeout(() => {
      resetBillFieldResize();
    }, 0);

    return () => {
      window.clearTimeout(cleanupId);
    };
  }, [activeBillResizeId, billMetaFields, mainTableColumns, resetBillFieldResize]);

  useEffect(() => {
    const handlePointerMove = (event: MouseEvent) => {
      if (!billFieldResizeRef.current) return;

      const resize = billFieldResizeRef.current;
      if (resize.dimension === 'height') {
        pendingBillResizeRef.current = {
          id: resize.id,
          scope: resize.scope,
          width: resize.startWidth,
          height: Math.max(
            BILL_FORM_MIN_CONTROL_HEIGHT,
            Math.min(
              BILL_FORM_MAX_CONTROL_HEIGHT,
              Math.round(resize.startHeight + (event.clientY - resize.startY)),
            ),
          ),
        };
      } else {
        const maxWidth = Math.max(
          constants.minWidth,
          Math.min(constants.maxWidth, resize.boardWidth - resize.startCanvasX - constants.layoutPaddingX),
        );
        const resizeField = billCanvasFieldsRef.current.find((column) => column.id === resize.id);
        const resizeRow = clampValue(
          Number.isFinite(Number(resizeField?.panelRow)) ? Number(resizeField.panelRow) : constants.minRows,
          constants.minRows,
          billHeaderWorkbenchRows,
        );
        const siblingWidths = billCanvasFieldsRef.current
          .filter((column) => column.id !== resize.id)
          .filter((column) => (
            clampValue(
              Number.isFinite(Number(column?.panelRow)) ? Number(column.panelRow) : constants.minRows,
              constants.minRows,
              billHeaderWorkbenchRows,
            ) === resizeRow
          ))
          .map((column) => Math.max(constants.minWidth, Number(column?.width) || constants.defaultWidth));
        const snapCandidates = buildResizeSnapCandidates(siblingWidths, {
          minWidth: constants.minWidth,
          maxWidth,
          baseWidth: constants.defaultWidth,
        });
        const rawWidth = resize.startWidth + (event.clientX - resize.startX);
        const { width: nextWidth } = resolveResizeWidthWithSnap(rawWidth, {
          minWidth: constants.minWidth,
          maxWidth,
          snapCandidates,
        });

        pendingBillResizeRef.current = {
          id: resize.id,
          scope: resize.scope,
          width: nextWidth,
          height: resize.startHeight,
        };
      }

      if (billResizeFrameRef.current !== null) return;
      billResizeFrameRef.current = window.requestAnimationFrame(() => {
        billResizeFrameRef.current = null;
        const nextResize = pendingBillResizeRef.current;
        if (!nextResize) return;

        setBillFieldLivePreview((prev) => (
          prev
          && prev.id === nextResize.id
          && prev.scope === nextResize.scope
          && prev.width === nextResize.width
          && prev.height === nextResize.height
            ? prev
            : {
                id: nextResize.id,
                scope: nextResize.scope,
                height: nextResize.height,
                width: nextResize.width,
              }
        ));
      });
    };

    const stopResize = () => {
      if (!billFieldResizeRef.current) return;

      if (billResizeFrameRef.current !== null) {
        window.cancelAnimationFrame(billResizeFrameRef.current);
        billResizeFrameRef.current = null;
      }
      const nextResize = pendingBillResizeRef.current;
      if (nextResize) {
        const metaIdSet = new Set(billMetaFields.map((column) => column.id));
        const nextFields = alignBillHeaderFieldsToFlowLayout(
          billCanvasFieldsRef.current.map((column) => (
            column.id === nextResize.id
              ? {
                  ...column,
                  controlHeight: nextResize.height ?? column.controlHeight ?? column.layoutHeight,
                  controlWidth: nextResize.width,
                  layoutHeight: nextResize.height ?? column.layoutHeight ?? column.controlHeight,
                  width: nextResize.width,
                }
              : column
          )),
          {
            defaultWidth: constants.defaultWidth,
            gapX: BILL_FORM_WORKBENCH_LAYOUT_GAP_X,
            gapY: BILL_FORM_WORKBENCH_LAYOUT_GAP_Y,
            layoutPaddingX: BILL_FORM_WORKBENCH_LAYOUT_PADDING_X,
            layoutPaddingY: BILL_FORM_WORKBENCH_LAYOUT_PADDING_Y,
            maxHeight: BILL_FORM_MAX_CONTROL_HEIGHT,
            maxWidth: constants.maxWidth,
            minHeight: BILL_FORM_MIN_CONTROL_HEIGHT,
            minRowHeight: BILL_FORM_WORKBENCH_MIN_ROW_HEIGHT,
            minWidth: constants.minWidth,
          },
        );
        setBillMetaFields(nextFields.filter((column) => metaIdSet.has(column.id)));
        setMainTableColumns(nextFields.filter((column) => !metaIdSet.has(column.id)));
      }

      resetBillFieldResize();
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', stopResize);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', stopResize);
    };
  }, [
    billHeaderWorkbenchRows,
    buildResizeSnapCandidates,
    clampValue,
    constants.defaultWidth,
    constants.layoutPaddingX,
    constants.maxWidth,
    constants.minRows,
    constants.minWidth,
    billMetaFields,
    resetBillFieldResize,
    resolveResizeWidthWithSnap,
    setBillMetaFields,
    setMainTableColumns,
  ]);

  return {
    activeBillResizeId,
    billFieldLivePreview,
    startBillFieldResize,
  };
}
