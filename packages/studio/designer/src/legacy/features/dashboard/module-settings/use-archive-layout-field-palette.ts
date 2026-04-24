import React from 'react';

import type { DetailLayoutFieldOption } from '../detail-layout-designer/types';

export type ArchiveLayoutFieldPaletteEntry = {
  description: string;
  fieldId: string;
  isPlaced: boolean;
  label: string;
  placedGroupId: string | null;
  placedGroupName: string | null;
  placedItemId: string | null;
  title: string;
};

type UseArchiveLayoutFieldPaletteInput = {
  groupTitleById: Map<string, string>;
  onLocatePlacedField: (groupId: string, itemId: string | null) => void;
  options: DetailLayoutFieldOption[];
  placedFieldItemIdByValue: Map<string, string>;
  placedGroupIdByFieldValue: Map<string, string>;
};

type UseArchiveLayoutFieldPaletteResult = {
  paletteEntries: ArchiveLayoutFieldPaletteEntry[];
  resolveDragFieldIds: (fieldId: string) => string[];
  selectedFieldIdSet: Set<string>;
  selectedFieldIds: string[];
  setSelectedFieldIds: React.Dispatch<React.SetStateAction<string[]>>;
  toggleFieldSelection: (
    event: Pick<React.MouseEvent<HTMLElement>, 'ctrlKey' | 'metaKey'>,
    entry: ArchiveLayoutFieldPaletteEntry,
  ) => void;
};

function getPaletteEntryLabel(option: DetailLayoutFieldOption) {
  return String(option.title || option.label || option.value).trim();
}

function getPaletteEntryDescription(option: DetailLayoutFieldOption) {
  return String(option.label || option.description || option.value).trim();
}

export function useArchiveLayoutFieldPalette({
  groupTitleById,
  onLocatePlacedField,
  options,
  placedFieldItemIdByValue,
  placedGroupIdByFieldValue,
}: UseArchiveLayoutFieldPaletteInput): UseArchiveLayoutFieldPaletteResult {
  const [selectedFieldIds, setSelectedFieldIds] = React.useState<string[]>([]);
  const paletteEntries = React.useMemo(() => options.map((option) => {
    const fieldId = String(option.value);
    const placedGroupId = placedGroupIdByFieldValue.get(fieldId) ?? null;

    return {
      description: getPaletteEntryDescription(option),
      fieldId,
      isPlaced: Boolean(placedGroupId),
      label: String(option.label || option.value || fieldId),
      placedGroupId,
      placedGroupName: placedGroupId ? (groupTitleById.get(placedGroupId) ?? null) : null,
      placedItemId: placedFieldItemIdByValue.get(fieldId) ?? null,
      title: getPaletteEntryLabel(option),
    } satisfies ArchiveLayoutFieldPaletteEntry;
  }), [groupTitleById, options, placedFieldItemIdByValue, placedGroupIdByFieldValue]);
  const availableFieldIdSet = React.useMemo(
    () => new Set(paletteEntries.filter((entry) => !entry.isPlaced).map((entry) => entry.fieldId)),
    [paletteEntries],
  );
  const selectedFieldIdSet = React.useMemo(
    () => new Set(selectedFieldIds),
    [selectedFieldIds],
  );

  React.useEffect(() => {
    setSelectedFieldIds((current) => current.filter((fieldId) => availableFieldIdSet.has(fieldId)));
  }, [availableFieldIdSet]);

  const toggleFieldSelection = React.useCallback((
    event: Pick<React.MouseEvent<HTMLElement>, 'ctrlKey' | 'metaKey'>,
    entry: ArchiveLayoutFieldPaletteEntry,
  ) => {
    if (entry.isPlaced) {
      setSelectedFieldIds((current) => current.filter((fieldId) => fieldId !== entry.fieldId));
      if (entry.placedGroupId) {
        onLocatePlacedField(entry.placedGroupId, entry.placedItemId);
      }
      return;
    }

    const hasModifier = event.ctrlKey || event.metaKey;

    setSelectedFieldIds((current) => {
      if (hasModifier) {
        return current.includes(entry.fieldId)
          ? current.filter((fieldId) => fieldId !== entry.fieldId)
          : [...current, entry.fieldId];
      }
      return [entry.fieldId];
    });

  }, [onLocatePlacedField]);

  const resolveDragFieldIds = React.useCallback((fieldId: string) => {
    const nextSelectedIdSet = selectedFieldIdSet.has(fieldId)
      ? selectedFieldIdSet
      : new Set([fieldId]);

    return paletteEntries
      .filter((entry) => nextSelectedIdSet.has(entry.fieldId) && !entry.isPlaced)
      .map((entry) => entry.fieldId);
  }, [paletteEntries, selectedFieldIdSet]);

  return {
    paletteEntries,
    resolveDragFieldIds,
    selectedFieldIdSet,
    selectedFieldIds,
    setSelectedFieldIds,
    toggleFieldSelection,
  };
}
