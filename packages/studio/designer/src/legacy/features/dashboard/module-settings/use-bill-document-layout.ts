import React, { useEffect, useRef } from 'react';

type UseBillDocumentLayoutParams = {
  autoArrangeBillHeaderFields: () => void;
  billDetailColumnCount: number;
  billDocumentPaperRef: React.RefObject<HTMLDivElement | null>;
  billDocumentViewportRef: React.RefObject<HTMLDivElement | null>;
  billMetaFields: any[];
  businessType: string;
  isModuleSettingFullscreen: boolean;
  mainTableColumns: any[];
  normalizeColumn: (column: any) => any;
  getBillFieldLayout: (index: number, width?: number) => { canvasX: number; canvasY: number };
  constants: {
    defaultWidth: number;
    minWidth: number;
  };
};

export function useBillDocumentLayout({
  autoArrangeBillHeaderFields,
  billMetaFields,
  businessType,
  isModuleSettingFullscreen,
  mainTableColumns,
  normalizeColumn,
  getBillFieldLayout,
  constants,
}: UseBillDocumentLayoutParams) {
  const billDocumentScale = 1;
  const billHeaderAutoFillRef = useRef(false);



  useEffect(() => {
    if (businessType !== 'table' || isModuleSettingFullscreen || billHeaderAutoFillRef.current) return;
    if (mainTableColumns.length === 0) return;
    if (mainTableColumns.some((field) => field?.layoutRowId != null && field?.layoutRowId !== '')) {
      billHeaderAutoFillRef.current = true;
      return;
    }

    const mainLayoutMatches = mainTableColumns.every((field, index) => {
      const normalizedField = normalizeColumn(field);
      const width = Math.max(constants.minWidth, normalizedField.width || constants.defaultWidth);
      const expectedLayout = getBillFieldLayout(index, width);
      return Math.abs((normalizedField.canvasX ?? expectedLayout.canvasX) - expectedLayout.canvasX) <= 4
        && Math.abs((normalizedField.canvasY ?? expectedLayout.canvasY) - expectedLayout.canvasY) <= 4;
    });
    const legacyMetaLayout = [
      { id: 'bill_meta_date', x: 540, y: 100 },
      { id: 'bill_meta_operator', x: 540, y: 160 },
      { id: 'bill_meta_operate_time', x: 540, y: 220 },
    ];
    const metaLayoutMatches = billMetaFields.every((field, index) => {
      const expectedLayout = legacyMetaLayout[index];
      return Boolean(expectedLayout)
        && field.id === expectedLayout.id
        && Math.abs((field.canvasX ?? expectedLayout.x) - expectedLayout.x) <= 4
        && Math.abs((field.canvasY ?? expectedLayout.y) - expectedLayout.y) <= 4;
    });

    if (!mainLayoutMatches || !metaLayoutMatches) {
      billHeaderAutoFillRef.current = true;
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      billHeaderAutoFillRef.current = true;
      autoArrangeBillHeaderFields();
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [
    autoArrangeBillHeaderFields,
    billMetaFields,
    businessType,
    constants.defaultWidth,
    constants.minWidth,
    getBillFieldLayout,
    isModuleSettingFullscreen,
    mainTableColumns,
    normalizeColumn,
  ]);

  return {
    billDocumentScale,
  };
}
