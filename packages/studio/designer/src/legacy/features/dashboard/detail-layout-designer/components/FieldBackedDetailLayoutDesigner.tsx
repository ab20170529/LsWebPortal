import React, { useCallback, useMemo } from 'react';

import { createDetailLayoutPaletteItem } from '../registry';
import type {
  DetailLayoutDocument,
  DetailLayoutFieldOption,
  DetailLayoutItem,
} from '../types';
import { buildFieldBackedPaletteItems } from '../utils/field-layout';
import { DetailLayoutDesigner } from './DetailLayoutDesigner';

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
  renderFieldPreview: (field: T, index: number, scope: string) => React.ReactNode;
  toolbarActions?: React.ReactNode | ((helpers: {
    addPaletteItem: (paletteItem: any) => void;
    itemCount: number;
    selectedId: string | null;
    selectedItem: DetailLayoutItem | null;
  }) => React.ReactNode);
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
  renderFieldPreview,
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
      renderItemContent={renderItemContent}
      toolbarActions={toolbarActions}
    />
  );
}
