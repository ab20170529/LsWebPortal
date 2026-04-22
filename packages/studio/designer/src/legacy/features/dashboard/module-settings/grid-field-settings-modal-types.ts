export type GridFieldSettingsModalMode =
  | 'single-table-main'
  | 'single-table-detail'
  | 'bill-main'
  | 'bill-detail';

export type GridFieldSettingsOpenRequest = {
  fieldId?: string | null;
  key: number;
  mode: GridFieldSettingsModalMode;
} | null;
