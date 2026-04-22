import React, { useCallback, useMemo } from 'react';

import { createDetailLayoutPaletteItem } from '../registry';
import type {
  DetailLayoutDocument,
  DetailLayoutFieldOption,
  DetailLayoutItem,
} from '../types';
import { buildFieldBackedPaletteItems } from '../utils/field-layout';
import { DetailLayoutDesigner, type DetailLayoutDesignerRenderHelpers } from './DetailLayoutDesigner';

export type FieldBackedDetailLayoutDesignerHelpers<T = any> = DetailLayoutDesignerRenderHelpers & {
  addFieldOption: (fieldValue: string, overrides?: Partial<DetailLayoutItem>) => DetailLayoutItem | null;
  fieldMap: Map<string, T>;
  fieldOptions: DetailLayoutFieldOption<T>[];
  findFieldOption: (fieldValue: string) => DetailLayoutFieldOption<T> | null;
};

type FieldBackedDetailLayoutDesignerProps<T = any> = {
  allowFieldEdit?: boolean;
  allowParentIdEdit?: boolean;
  className?: string;
  document: DetailLayoutDocument;
  fieldOptions: DetailLayoutFieldOption<T>[];
  getDefaultSize: (field: T) => { h: number; w: number };
  onDocumentChange?: (document: DetailLayoutDocument) => void;
  onSelectedItemChange?: (item: DetailLayoutItem | null) => void;
  paletteDescription?: string;
  paletteLeadItems?: Array<{
    description: string;
    id: string;
    label: string;
    template?: Partial<DetailLayoutItem>;
    type: 'groupbox' | 'label' | 'button';
  }>;
  paletteTitle?: string;
  paletteVariant?: 'cards' | 'plain';
  panelLayoutClassName?: string;
  renderPropertyPanel?: (helpers: FieldBackedDetailLayoutDesignerHelpers<T>) => React.ReactNode;
  renderFieldPreview: (field: T, index: number, scope: string) => React.ReactNode;
  renderSidebar?: (helpers: FieldBackedDetailLayoutDesignerHelpers<T>) => React.ReactNode;
  toolbarActions?: React.ReactNode | ((helpers: FieldBackedDetailLayoutDesignerHelpers<T>) => React.ReactNode);
};

export function FieldBackedDetailLayoutDesigner<T = any>({
  allowFieldEdit = false,
  allowParentIdEdit = false,
  className,
  document,
  fieldOptions,
  getDefaultSize,
  onDocumentChange,
  onSelectedItemChange,
  paletteDescription,
  paletteLeadItems,
  paletteTitle,
  paletteVariant,
  panelLayoutClassName,
  renderPropertyPanel,
  renderFieldPreview,
  renderSidebar,
  toolbarActions,
}: FieldBackedDetailLayoutDesignerProps<T>) {
  const fieldMap = useMemo(
    () => new Map(fieldOptions.map((fieldOption) => [fieldOption.value, fieldOption.rawField])),
    [fieldOptions],
  );
  const paletteItems = useMemo(() => buildFieldBackedPaletteItems({
    baseItems: (paletteLeadItems ?? []).map((item) => createDetailLayoutPaletteItem(item.type, {
      description: item.description,
      id: item.id,
      label: item.label,
      template: item.template,
    })),
    document,
    fieldOptions,
    getDefaultSize,
  }), [document, fieldOptions, getDefaultSize, paletteLeadItems]);
  const basicFieldOptions = useMemo(
    () => fieldOptions.map((fieldOption) => ({ label: fieldOption.label, value: fieldOption.value })),
    [fieldOptions],
  );
  const fieldOptionMap = useMemo(
    () => new Map(fieldOptions.map((fieldOption) => [fieldOption.value, fieldOption])),
    [fieldOptions],
  );

  const renderItemContent = useCallback((item: DetailLayoutItem) => {
    if (!item.field) {
      return null;
    }

    const rawField = fieldMap.get(String(item.field));
    if (!rawField) {
      return null;
    }

    return (
      <div
        className="pointer-events-auto flex h-full w-full items-stretch"
        onMouseDown={(event) => {
          event.stopPropagation();
        }}
      >
        <div className="w-full">
          {renderFieldPreview(rawField, 0, 'table')}
        </div>
      </div>
    );
  }, [fieldMap, renderFieldPreview]);

  const buildRenderHelpers = useCallback((helpers: DetailLayoutDesignerRenderHelpers): FieldBackedDetailLayoutDesignerHelpers<T> => {
    const findFieldOption = (fieldValue: string) => fieldOptionMap.get(fieldValue) ?? null;
    const addFieldOption = (fieldValue: string, overrides: Partial<DetailLayoutItem> = {}) => {
      const fieldOption = findFieldOption(fieldValue);
      if (!fieldOption) {
        return null;
      }

      const defaultSize = getDefaultSize(fieldOption.rawField);
      return helpers.addItem(fieldOption.itemType, {
        field: fieldOption.value,
        h: defaultSize.h,
        readOnly: Boolean(fieldOption.readOnly),
        required: Boolean(fieldOption.required),
        title: fieldOption.title ?? fieldOption.label,
        w: defaultSize.w,
        ...overrides,
      });
    };

    return {
      ...helpers,
      addFieldOption,
      fieldMap,
      fieldOptions,
      findFieldOption,
    };
  }, [fieldMap, fieldOptionMap, fieldOptions, getDefaultSize]);

  return (
    <DetailLayoutDesigner
      allowFieldEdit={allowFieldEdit}
      allowParentIdEdit={allowParentIdEdit}
      className={className}
      document={document}
      fieldOptions={basicFieldOptions}
      onDocumentChange={onDocumentChange}
      onSelectedItemChange={onSelectedItemChange}
      paletteItems={paletteItems}
      paletteDescription={paletteDescription}
      paletteTitle={paletteTitle}
      paletteVariant={paletteVariant}
      panelLayoutClassName={panelLayoutClassName}
      renderPropertyPanel={renderPropertyPanel ? (helpers) => renderPropertyPanel(buildRenderHelpers(helpers)) : undefined}
      renderItemContent={renderItemContent}
      renderSidebar={renderSidebar ? (helpers) => renderSidebar(buildRenderHelpers(helpers)) : undefined}
      toolbarActions={typeof toolbarActions === 'function' ? (helpers) => toolbarActions(buildRenderHelpers(helpers)) : toolbarActions}
    />
  );
}
