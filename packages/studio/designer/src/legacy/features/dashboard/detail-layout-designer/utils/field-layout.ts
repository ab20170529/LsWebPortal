import { createDetailLayoutPaletteItem } from '../registry';
import type {
  DetailLayoutDocument,
  DetailLayoutFieldOption,
  DetailLayoutPaletteItem,
} from '../types';

type BuildFieldBackedPaletteItemsOptions<T> = {
  baseItems?: DetailLayoutPaletteItem[];
  document: DetailLayoutDocument;
  fieldOptions: DetailLayoutFieldOption<T>[];
  getDefaultSize: (field: T) => { h: number; w: number };
};

export function buildFieldBackedPaletteItems<T>({
  baseItems = [],
  document,
  fieldOptions,
  getDefaultSize,
}: BuildFieldBackedPaletteItemsOptions<T>) {
  const usedFieldIds = new Set(
    document.items
      .map((item) => item.field)
      .filter((field): field is string => typeof field === 'string' && field.trim().length > 0),
  );

  const fieldPaletteItems = fieldOptions
    .filter((fieldOption) => !usedFieldIds.has(fieldOption.value))
    .map((fieldOption) => {
      const defaultSize = getDefaultSize(fieldOption.rawField);
      return createDetailLayoutPaletteItem(fieldOption.itemType, {
        id: `detail-layout-field:${fieldOption.value}`,
        label: fieldOption.label,
        description: fieldOption.description ?? '字段控件',
        defaultSize,
        template: {
          field: fieldOption.value,
          h: defaultSize.h,
          readOnly: Boolean(fieldOption.readOnly),
          required: Boolean(fieldOption.required),
          title: fieldOption.title ?? fieldOption.label,
          w: defaultSize.w,
        },
      });
    });

  return [...baseItems, ...fieldPaletteItems];
}
