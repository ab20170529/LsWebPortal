export type DetailLayoutItemType =
  | 'input'
  | 'select'
  | 'date'
  | 'number'
  | 'textarea'
  | 'label'
  | 'button'
  | 'groupbox';

export type DetailLayoutMode = 'design' | 'runtime';

export type DetailLayoutRect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type DetailLayoutItem = DetailLayoutRect & {
  id: string;
  type: DetailLayoutItemType;
  title?: string;
  field?: string;
  parentId?: string | null;
  readOnly?: boolean;
  required?: boolean;
};

export type DetailLayoutDocument = {
  version: 1;
  gridSize: number;
  items: DetailLayoutItem[];
};

export type DetailLayoutUiState = {
  mode: DetailLayoutMode;
  selectedId: string | null;
  hoveringId: string | null;
  draggingId: string | null;
  resizingId: string | null;
  activeParentId: string | null;
};

export type DetailLayoutHistory<T = DetailLayoutDocument> = {
  past: T[];
  present: T;
  future: T[];
};

export type DetailLayoutSelectionState = {
  selectedId: string | null;
};

export type DetailLayoutRegistryItem = {
  type: DetailLayoutItemType;
  label: string;
  description: string;
  defaultTitle: string;
  defaultField?: string;
  defaultSize: Pick<DetailLayoutRect, 'w' | 'h'>;
  supportsField: boolean;
  isContainer: boolean;
};

export type DetailLayoutPaletteItem = {
  id: string;
  type: DetailLayoutItemType;
  label: string;
  description: string;
  defaultSize: Pick<DetailLayoutRect, 'w' | 'h'>;
  template?: Partial<DetailLayoutItem>;
};

export type DetailLayoutFieldOption<T = any> = {
  description?: string;
  itemType: DetailLayoutItemType;
  label: string;
  rawField: T;
  required?: boolean;
  readOnly?: boolean;
  title?: string;
  value: string;
};

export type DetailLayoutItemPatch = Partial<Omit<DetailLayoutItem, 'id' | 'type'>> & {
  parentId?: string | null;
};

export const DETAIL_LAYOUT_DEFAULT_GRID_SIZE = 8;

export const DETAIL_LAYOUT_DEFAULT_DOCUMENT: DetailLayoutDocument = {
  version: 1,
  gridSize: DETAIL_LAYOUT_DEFAULT_GRID_SIZE,
  items: [],
};
