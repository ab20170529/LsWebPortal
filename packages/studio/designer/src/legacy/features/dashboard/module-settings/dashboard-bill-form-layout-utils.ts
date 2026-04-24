export const BILL_FORM_DEFAULT_WIDTH = 236;
export const BILL_FORM_MIN_WIDTH = 168;
export const BILL_FORM_MAX_WIDTH = 560;
export const BILL_FORM_MIN_CONTROL_HEIGHT = 21;
export const BILL_FORM_MAX_CONTROL_HEIGHT = 160;
export const BILL_FORM_DEFAULT_LABEL_WIDTH = 72;
export const BILL_FORM_DEFAULT_FONT_SIZE = 12;
export const BILL_FORM_LAYOUT_PADDING_X = 28;
export const BILL_FORM_LAYOUT_PADDING_Y = 28;
export const BILL_FORM_LAYOUT_GAP_X = 24;
export const BILL_FORM_LAYOUT_GAP_Y = 18;
export const BILL_FORM_LAYOUT_COLUMNS = 3;
export const BILL_FORM_ROW_HEIGHT = 56;
export const BILL_FORM_WORKBENCH_MIN_ROW_HEIGHT = 28;
export const BILL_FORM_WORKBENCH_FIELD_CHROME_HEIGHT = 7;
export const BILL_FORM_MIN_PREVIEW_WIDTH = 92;
export const BILL_FORM_WORKBENCH_LAYOUT_PADDING_X = 12;
export const BILL_FORM_WORKBENCH_LAYOUT_PADDING_Y = 12;
export const BILL_FORM_WORKBENCH_LAYOUT_GAP_X = 4;
export const BILL_FORM_WORKBENCH_LAYOUT_GAP_Y = 1;

export function getBillFieldLayout(index: number, width = BILL_FORM_DEFAULT_WIDTH) {
  const columnIndex = index % BILL_FORM_LAYOUT_COLUMNS;
  const rowIndex = Math.floor(index / BILL_FORM_LAYOUT_COLUMNS);
  return {
    canvasX: BILL_FORM_LAYOUT_PADDING_X + columnIndex * (width + BILL_FORM_LAYOUT_GAP_X),
    canvasY: BILL_FORM_LAYOUT_PADDING_Y + rowIndex * (BILL_FORM_ROW_HEIGHT + BILL_FORM_LAYOUT_GAP_Y),
    labelWidth: BILL_FORM_DEFAULT_LABEL_WIDTH,
    fontSize: BILL_FORM_DEFAULT_FONT_SIZE,
    sourceTable: 'bill-source',
    sourceField: '',
  };
}

function toFiniteNumber(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function estimateBillHeaderLabelWidth(label: string) {
  const measuredWidth = Array.from(String(label || '')).reduce((width, character) => {
    if (/[\u3400-\u9fff]/.test(character)) {
      return width + 11.5;
    }

    if (/[A-Z0-9]/.test(character)) {
      return width + 7.5;
    }

    return width + 6.5;
  }, 0);

  return Math.max(34, Math.min(240, Math.ceil(measuredWidth + 8)));
}

type BillHeaderFlowLayoutField = Record<string, any>;

type AlignBillHeaderFieldsToFlowLayoutOptions = {
  defaultHeight?: number;
  defaultWidth?: number;
  enforceLabelMinWidth?: boolean;
  gapX?: number;
  gapY?: number;
  maxHeight?: number;
  maxWidth?: number;
  minHeight?: number;
  minPreviewWidth?: number;
  minRowHeight?: number;
  minWidth?: number;
  workbenchFieldChromeHeight?: number;
  layoutPaddingX?: number;
  layoutPaddingY?: number;
};

export function getBillHeaderFieldHeight(
  field: BillHeaderFlowLayoutField,
  options: AlignBillHeaderFieldsToFlowLayoutOptions = {},
) {
  const minHeight = options.minHeight ?? BILL_FORM_MIN_CONTROL_HEIGHT;
  const maxHeight = options.maxHeight ?? BILL_FORM_MAX_CONTROL_HEIGHT;
  const defaultHeight = options.defaultHeight ?? BILL_FORM_MIN_CONTROL_HEIGHT;

  return clampNumber(
    Math.round(toFiniteNumber(field.controlHeight ?? field.layoutHeight ?? field.height, defaultHeight)),
    minHeight,
    maxHeight,
  );
}

export function getBillHeaderFieldWidth(
  field: BillHeaderFlowLayoutField,
  options: AlignBillHeaderFieldsToFlowLayoutOptions = {},
) {
  const defaultWidth = options.defaultWidth ?? BILL_FORM_DEFAULT_WIDTH;
  const enforceLabelMinWidth = options.enforceLabelMinWidth ?? true;
  const minWidth = options.minWidth ?? BILL_FORM_MIN_WIDTH;
  const maxWidth = options.maxWidth ?? BILL_FORM_MAX_WIDTH;
  const minPreviewWidth = options.minPreviewWidth ?? BILL_FORM_MIN_PREVIEW_WIDTH;
  const labelWidth = estimateBillHeaderLabelWidth(String(field.name ?? field.username ?? field.username1 ?? field.displayName ?? ''));
  const requestedWidth = clampNumber(
    Math.round(toFiniteNumber(field.width ?? field.controlWidth, defaultWidth)),
    minWidth,
    maxWidth,
  );

  if (!enforceLabelMinWidth) {
    return requestedWidth;
  }

  return Math.max(requestedWidth, Math.min(maxWidth, labelWidth + minPreviewWidth + 8));
}

export function getBillHeaderFieldShellHeight(
  field: BillHeaderFlowLayoutField,
  options: AlignBillHeaderFieldsToFlowLayoutOptions = {},
) {
  const minRowHeight = options.minRowHeight ?? BILL_FORM_WORKBENCH_MIN_ROW_HEIGHT;
  const workbenchFieldChromeHeight = options.workbenchFieldChromeHeight ?? BILL_FORM_WORKBENCH_FIELD_CHROME_HEIGHT;

  return Math.max(
    minRowHeight,
    getBillHeaderFieldHeight(field, options) + workbenchFieldChromeHeight,
  );
}

export function alignBillHeaderFieldsToFlowLayout<T extends BillHeaderFlowLayoutField>(
  fields: T[],
  options: AlignBillHeaderFieldsToFlowLayoutOptions = {},
) {
  const layoutPaddingX = options.layoutPaddingX ?? BILL_FORM_LAYOUT_PADDING_X;
  const layoutPaddingY = options.layoutPaddingY ?? BILL_FORM_LAYOUT_PADDING_Y;
  const gapX = options.gapX ?? BILL_FORM_LAYOUT_GAP_X;
  const gapY = options.gapY ?? BILL_FORM_LAYOUT_GAP_Y;
  const minRowHeight = options.minRowHeight ?? BILL_FORM_WORKBENCH_MIN_ROW_HEIGHT;

  const normalizedFields = fields
    .map((field, index) => ({
      ...field,
      __alignIndex: index,
      panelRow: Math.max(1, Math.round(toFiniteNumber(field.panelRow, 1))),
      panelOrder: Math.max(1, Math.round(toFiniteNumber(field.panelOrder ?? field.orderId, index + 1))),
    }))
    .sort((left, right) => (
      left.panelRow - right.panelRow
      || left.panelOrder - right.panelOrder
      || toFiniteNumber(left.canvasY ?? left.controlTop, 0) - toFiniteNumber(right.canvasY ?? right.controlTop, 0)
      || toFiniteNumber(left.canvasX ?? left.controlLeft, 0) - toFiniteNumber(right.canvasX ?? right.controlLeft, 0)
      || left.__alignIndex - right.__alignIndex
    ));

  if (normalizedFields.length === 0) {
    return [] as T[];
  }

  const rows = new Map<number, Array<BillHeaderFlowLayoutField & { __alignIndex: number }>>();
  normalizedFields.forEach((field) => {
    const rowFields = rows.get(field.panelRow) ?? [];
    rowFields.push(field);
    rows.set(field.panelRow, rowFields);
  });

  const maxRow = Math.max(...Array.from(rows.keys()));
  const alignedFields: Array<BillHeaderFlowLayoutField & { __alignIndex: number }> = [];
  let currentTop = layoutPaddingY;

  for (let rowNumber = 1; rowNumber <= maxRow; rowNumber += 1) {
    const rowFields = (rows.get(rowNumber) ?? [])
      .slice()
      .sort((left, right) => left.panelOrder - right.panelOrder || left.__alignIndex - right.__alignIndex);

    if (rowFields.length === 0) {
      currentTop += minRowHeight + gapY;
      continue;
    }

    let currentLeft = layoutPaddingX;
    let rowHeight = minRowHeight;

    rowFields.forEach((field, index) => {
      const width = getBillHeaderFieldWidth(field, options);
      const height = getBillHeaderFieldHeight(field, options);
      rowHeight = Math.max(rowHeight, getBillHeaderFieldShellHeight({ ...field, width, controlHeight: height }, options));
      alignedFields.push({
        ...field,
        width,
        controlWidth: width,
        controlHeight: height,
        layoutHeight: height,
        canvasX: currentLeft,
        canvasY: currentTop,
        controlLeft: currentLeft,
        controlTop: currentTop,
        panelRow: rowNumber,
        panelOrder: index + 1,
      });
      currentLeft += width + gapX;
    });

    currentTop += rowHeight + gapY;
  }

  return alignedFields
    .sort((left, right) => (
      left.panelRow - right.panelRow
      || left.panelOrder - right.panelOrder
      || left.__alignIndex - right.__alignIndex
    ))
    .map((field) => {
      const nextField = { ...field } as BillHeaderFlowLayoutField & { __alignIndex?: number };
      delete nextField.__alignIndex;
      return nextField as T;
    });
}
