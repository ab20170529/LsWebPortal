import React from 'react';

import type { DetailLayoutDocument, DetailLayoutFieldOption } from '../detail-layout-designer/types';
import type {
  ArchiveLayoutScheme,
  ArchiveLayoutSchemeGroup,
} from './detail-board-layout-designer-adapter';
import {
  ARCHIVE_LAYOUT_PREVIEW_WIDTH_MAX,
  ARCHIVE_LAYOUT_PREVIEW_WIDTH_MIN,
  cloneArchiveLayoutScheme,
  cloneArchiveLayoutSchemeGroup,
  createArchiveLayoutSchemeGroupId,
  createArchiveLayoutSchemeId,
  createEmptyArchiveLayoutScheme,
  getArchiveLayoutSchemePreviewWorkbenchWidth,
  normalizeArchiveLayoutPreviewWorkbenchWidth,
} from './archive-layout-scheme-workbench-utils';

export type SchemeFieldFilterMode = 'all' | 'selected' | 'unassigned';

type VisibleSchemeFieldRow = {
  assignedGroupName: string;
  canMoveToNextGroup: boolean;
  canMoveToPreviousGroup: boolean;
  checked: boolean;
  fieldId: string;
  heightInput: string;
  isExpanded: boolean;
  label: string;
  resolvedHeight: number;
  resolvedWidth: number;
  showAssignedGroupName: boolean;
  title: string;
  widthInput: string;
};

type UseArchiveLayoutSchemeWorkbenchParams = {
  buildCurrentLayoutScheme: () => ArchiveLayoutScheme;
  buildSchemeDocument: (scheme: ArchiveLayoutScheme, previewWorkbenchWidth?: number) => DetailLayoutDocument;
  commitDocument: (document: DetailLayoutDocument, previewWorkbenchWidth?: number) => void;
  fieldOptions: DetailLayoutFieldOption[];
  getDefaultSize: (field: Record<string, any>) => { h: number; w: number };
  hasPlacedFields: boolean;
  onOpenSchemesView: () => void;
  onOpenStructureView: () => void;
  onSchemesChange: (schemes: ArchiveLayoutScheme[]) => void;
  previewWorkbenchWidth: number;
  schemes: ArchiveLayoutScheme[];
  shouldAutoOpen: boolean;
  suggestedScheme: ArchiveLayoutScheme;
};

function parseCommittedNumber(rawValue: string, fallback: number, min: number, max: number) {
  const normalizedValue = rawValue.trim();
  if (!normalizedValue) {
    return fallback;
  }
  const parsedValue = Number(normalizedValue);
  if (!Number.isFinite(parsedValue)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, parsedValue));
}

function isEditableEventTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();
  return target.isContentEditable || tagName === 'input' || tagName === 'textarea' || tagName === 'select';
}

export function useArchiveLayoutSchemeWorkbench({
  buildCurrentLayoutScheme,
  buildSchemeDocument,
  commitDocument,
  fieldOptions,
  getDefaultSize,
  hasPlacedFields,
  onOpenSchemesView,
  onOpenStructureView,
  onSchemesChange,
  previewWorkbenchWidth,
  schemes,
  shouldAutoOpen,
  suggestedScheme,
}: UseArchiveLayoutSchemeWorkbenchParams) {
  const optionMap = React.useMemo(
    () => new Map(fieldOptions.map((option) => [String(option.value), option])),
    [fieldOptions],
  );
  const [isSchemeModalOpen, setIsSchemeModalOpen] = React.useState(false);
  const [schemeSourceId, setSchemeSourceId] = React.useState<string | null>(schemes[0]?.id ?? null);
  const [isEditingUnsavedScheme, setIsEditingUnsavedScheme] = React.useState(false);
  const [schemeDraft, setSchemeDraft] = React.useState<ArchiveLayoutScheme>(() => (
    schemes[0] ? cloneArchiveLayoutScheme(schemes[0]) : cloneArchiveLayoutScheme(suggestedScheme)
  ));
  const [selectedSchemeGroupId, setSelectedSchemeGroupId] = React.useState<string | null>(
    (schemes[0]?.groups[0] ?? suggestedScheme.groups[0])?.id ?? null,
  );
  const [schemeFieldKeyword, setSchemeFieldKeyword] = React.useState('');
  const [schemeFieldFilterMode, setSchemeFieldFilterMode] = React.useState<SchemeFieldFilterMode>('all');
  const [isBatchSizePanelOpen, setIsBatchSizePanelOpen] = React.useState(false);
  const [expandedSchemeFieldId, setExpandedSchemeFieldId] = React.useState<string | null>(null);
  const [schemeFieldSizeInputs, setSchemeFieldSizeInputs] = React.useState<Record<string, { h: string; w: string }>>({});
  const [schemeBatchSizeInput, setSchemeBatchSizeInput] = React.useState({ h: '', w: '' });
  const [schemePreviewWorkbenchWidthInput, setSchemePreviewWorkbenchWidthInput] = React.useState(
    String(getArchiveLayoutSchemePreviewWorkbenchWidth(schemes[0] ?? suggestedScheme, previewWorkbenchWidth)),
  );
  const schemeAutoOpenedRef = React.useRef(false);
  const schemeFieldSearchInputRef = React.useRef<HTMLInputElement | null>(null);
  const schemeDraftSeedKeyRef = React.useRef('');
  const deferredSchemeFieldKeyword = React.useDeferredValue(schemeFieldKeyword);

  const schemeById = React.useMemo(() => {
    const nextMap = new Map<string, ArchiveLayoutScheme>();
    schemes.forEach((scheme) => {
      nextMap.set(scheme.id, scheme);
    });
    return nextMap;
  }, [schemes]);

  React.useEffect(() => {
    if (isEditingUnsavedScheme) {
      return;
    }

    const activeScheme = schemeSourceId ? schemeById.get(schemeSourceId) ?? null : null;
    if (activeScheme) {
      setSchemeDraft(cloneArchiveLayoutScheme(activeScheme));
      setSelectedSchemeGroupId(activeScheme.groups[0]?.id ?? null);
      return;
    }
    if (schemes.length > 0) {
      setSchemeSourceId(schemes[0].id);
      setSchemeDraft(cloneArchiveLayoutScheme(schemes[0]));
      setSelectedSchemeGroupId(schemes[0].groups[0]?.id ?? null);
      return;
    }
    setSchemeSourceId(null);
    setSchemeDraft(cloneArchiveLayoutScheme(suggestedScheme));
    setSelectedSchemeGroupId(suggestedScheme.groups[0]?.id ?? null);
  }, [isEditingUnsavedScheme, schemeById, schemeSourceId, schemes, suggestedScheme]);

  React.useEffect(() => {
    if (!selectedSchemeGroupId || !schemeDraft.groups.some((group) => group.id === selectedSchemeGroupId)) {
      setSelectedSchemeGroupId(schemeDraft.groups[0]?.id ?? null);
    }
  }, [schemeDraft.groups, selectedSchemeGroupId]);

  React.useEffect(() => {
    const nextSeedKey = `${isSchemeModalOpen ? 'open' : 'closed'}:${isEditingUnsavedScheme ? 'draft' : 'saved'}:${schemeSourceId ?? 'none'}:${schemeDraft.id}`;
    if (schemeDraftSeedKeyRef.current === nextSeedKey) {
      return;
    }
    schemeDraftSeedKeyRef.current = nextSeedKey;
    setSchemeFieldSizeInputs({});
    setSchemePreviewWorkbenchWidthInput(
      String(getArchiveLayoutSchemePreviewWorkbenchWidth(schemeDraft, previewWorkbenchWidth)),
    );
  }, [isEditingUnsavedScheme, isSchemeModalOpen, previewWorkbenchWidth, schemeDraft, schemeSourceId]);

  const schemeView = React.useMemo(() => {
    const groupNameById = new Map<string, string>();
    const fieldAssignments = new Map<string, string>();

    schemeDraft.groups.forEach((group) => {
      groupNameById.set(group.id, group.name);
      group.fieldIds.forEach((fieldId) => {
        fieldAssignments.set(String(fieldId), group.id);
      });
    });

    const selectedSchemeGroup = (
      selectedSchemeGroupId
        ? schemeDraft.groups.find((group) => group.id === selectedSchemeGroupId) ?? null
        : null
    ) ?? schemeDraft.groups[0] ?? null;
    const selectedSchemeGroupIndex = selectedSchemeGroup
      ? schemeDraft.groups.findIndex((group) => group.id === selectedSchemeGroup.id)
      : -1;
    const selectedSchemeFieldIds = Array.from(fieldAssignments.keys());
    const selectedSchemeFieldIdSet = new Set(selectedSchemeFieldIds);
    const selectedSchemeGroupFieldIdSet = new Set(selectedSchemeGroup?.fieldIds.map(String) ?? []);
    const selectedSchemeBatchFieldIds = selectedSchemeGroup?.fieldIds.map(String) ?? [];
    const normalizedSchemeKeyword = deferredSchemeFieldKeyword.trim().toLowerCase();
    const visibleSchemeFieldRows: VisibleSchemeFieldRow[] = [];
    let filteredSelectedSchemeFieldCount = 0;
    let filteredUnassignedSchemeFieldCount = 0;

    fieldOptions.forEach((option) => {
      const fieldId = String(option.value);
      const text = `${option.title || ''} ${option.label || ''} ${option.description || ''}`.toLowerCase();
      const assignedGroupId = fieldAssignments.get(fieldId) ?? null;
      const checked = selectedSchemeGroupFieldIdSet.has(fieldId);

      if (schemeFieldFilterMode === 'selected' && !checked) {
        return;
      }
      if (schemeFieldFilterMode === 'unassigned' && assignedGroupId) {
        return;
      }
      if (normalizedSchemeKeyword && !text.includes(normalizedSchemeKeyword)) {
        return;
      }

      if (checked) {
        filteredSelectedSchemeFieldCount += 1;
      }
      if (!assignedGroupId) {
        filteredUnassignedSchemeFieldCount += 1;
      }

      const defaults = schemeDraft.fieldDefaults?.[fieldId];
      const rawField = (optionMap.get(fieldId)?.rawField ?? {}) as Record<string, any>;
      const defaultSize = getDefaultSize(rawField);
      const resolvedWidth = typeof defaults?.w === 'number' && defaults.w > 0 ? defaults.w : defaultSize.w;
      const resolvedHeight = typeof defaults?.h === 'number' && defaults.h > 0 ? defaults.h : defaultSize.h;
      const draftInputs = schemeFieldSizeInputs[fieldId];

      visibleSchemeFieldRows.push({
        assignedGroupName: assignedGroupId ? groupNameById.get(assignedGroupId) ?? '' : '',
        canMoveToNextGroup: checked && selectedSchemeGroupIndex >= 0 && selectedSchemeGroupIndex < schemeDraft.groups.length - 1,
        canMoveToPreviousGroup: checked && selectedSchemeGroupIndex > 0,
        checked,
        fieldId,
        heightInput: draftInputs?.h ?? String(resolvedHeight),
        isExpanded: expandedSchemeFieldId === fieldId,
        label: String(option.label || option.title || fieldId),
        resolvedHeight,
        resolvedWidth,
        showAssignedGroupName: Boolean(assignedGroupId && !checked),
        title: String(option.title || option.label || fieldId),
        widthInput: draftInputs?.w ?? String(resolvedWidth),
      });
    });

    return {
      filteredSelectedSchemeFieldCount,
      filteredUnassignedSchemeFieldCount,
      groupNameById,
      selectedSchemeBatchFieldIds,
      selectedSchemeFieldIdSet,
      selectedSchemeFieldIds,
      selectedSchemeGroup,
      selectedSchemeGroupFieldIdSet,
      selectedSchemeGroupIndex,
      visibleSchemeFieldRows,
    };
  }, [
    deferredSchemeFieldKeyword,
    expandedSchemeFieldId,
    fieldOptions,
    getDefaultSize,
    optionMap,
    schemeDraft,
    schemeFieldFilterMode,
    schemeFieldSizeInputs,
    selectedSchemeGroupId,
  ]);

  const {
    filteredSelectedSchemeFieldCount,
    filteredUnassignedSchemeFieldCount,
    selectedSchemeBatchFieldIds,
    selectedSchemeFieldIdSet,
    selectedSchemeFieldIds,
    selectedSchemeGroup,
    selectedSchemeGroupFieldIdSet,
    selectedSchemeGroupIndex,
    visibleSchemeFieldRows,
  } = schemeView;

  React.useEffect(() => {
    if (!expandedSchemeFieldId || selectedSchemeGroupFieldIdSet.has(expandedSchemeFieldId)) {
      return;
    }
    setExpandedSchemeFieldId(null);
  }, [expandedSchemeFieldId, selectedSchemeGroupFieldIdSet]);

  const closeSchemeModal = React.useCallback(() => {
    setIsSchemeModalOpen(false);
  }, []);

  const openSchemeModal = React.useCallback((schemeId?: string | null, draft?: ArchiveLayoutScheme | null) => {
    React.startTransition(() => {
      if (draft) {
        setIsEditingUnsavedScheme(true);
        setSchemeSourceId(null);
        setSchemeDraft(cloneArchiveLayoutScheme(draft));
        setSelectedSchemeGroupId(draft.groups[0]?.id ?? null);
      } else if (schemeId) {
        const targetScheme = schemeById.get(schemeId);
        if (targetScheme) {
          setIsEditingUnsavedScheme(false);
          setSchemeSourceId(targetScheme.id);
          setSchemeDraft(cloneArchiveLayoutScheme(targetScheme));
          setSelectedSchemeGroupId(targetScheme.groups[0]?.id ?? null);
        }
      } else if (schemes.length > 0) {
        const fallbackScheme = (schemeSourceId ? schemeById.get(schemeSourceId) : null) ?? schemes[0];
        setIsEditingUnsavedScheme(false);
        setSchemeSourceId(fallbackScheme.id);
        setSchemeDraft(cloneArchiveLayoutScheme(fallbackScheme));
        setSelectedSchemeGroupId(fallbackScheme.groups[0]?.id ?? null);
      } else {
        setIsEditingUnsavedScheme(true);
        setSchemeSourceId(null);
        setSchemeDraft(cloneArchiveLayoutScheme(suggestedScheme));
        setSelectedSchemeGroupId(suggestedScheme.groups[0]?.id ?? null);
      }

      onOpenSchemesView();
      setIsSchemeModalOpen(true);
    });
  }, [onOpenSchemesView, schemeById, schemeSourceId, schemes, suggestedScheme]);

  React.useEffect(() => {
    if (!shouldAutoOpen) {
      schemeAutoOpenedRef.current = false;
      return;
    }
    if (isSchemeModalOpen || schemeAutoOpenedRef.current || fieldOptions.length === 0) {
      return;
    }
    const autoOpenTimer = globalThis.setTimeout(() => {
      if (schemeAutoOpenedRef.current) {
        return;
      }
      schemeAutoOpenedRef.current = true;
      onOpenSchemesView();
      openSchemeModal();
    }, 180);
    return () => globalThis.clearTimeout(autoOpenTimer);
  }, [fieldOptions.length, isSchemeModalOpen, onOpenSchemesView, openSchemeModal, shouldAutoOpen]);

  React.useEffect(() => {
    if (!isSchemeModalOpen) {
      return;
    }

    const focusTimer = globalThis.setTimeout(() => {
      schemeFieldSearchInputRef.current?.focus();
      schemeFieldSearchInputRef.current?.select();
    }, 40);

    return () => globalThis.clearTimeout(focusTimer);
  }, [isSchemeModalOpen, schemeSourceId]);

  const applySchemeDraft = React.useCallback((forceConfirm = hasPlacedFields) => {
    if (forceConfirm && !window.confirm('应用方案会按方案内容重建当前布局，是否继续？')) {
      return false;
    }
    const schemePreviewWidth = getArchiveLayoutSchemePreviewWorkbenchWidth(schemeDraft, previewWorkbenchWidth);
    commitDocument(buildSchemeDocument(schemeDraft, schemePreviewWidth), schemePreviewWidth);
    setIsSchemeModalOpen(false);
    onOpenStructureView();
    return true;
  }, [buildSchemeDocument, commitDocument, hasPlacedFields, onOpenStructureView, previewWorkbenchWidth, schemeDraft]);

  const saveSchemeDraft = React.useCallback(() => {
    const trimmedName = schemeDraft.name.trim() || `方案 ${schemes.length + 1}`;
    const validFieldIds = new Set(selectedSchemeFieldIds.map(String));
    const nextFieldDefaults = Object.entries(
      (schemeDraft.fieldDefaults ?? {}) as Record<string, { h?: number; w?: number }>,
    ).reduce<Record<string, { h?: number; w?: number }>>((result, [fieldId, defaults]) => {
      if (!validFieldIds.has(fieldId) || !defaults || (typeof defaults.w !== 'number' && typeof defaults.h !== 'number')) {
        return result;
      }
      result[fieldId] = { ...defaults };
      return result;
    }, {});
    const normalizedDraft: ArchiveLayoutScheme = {
      ...schemeDraft,
      fieldDefaults: nextFieldDefaults,
      groups: schemeDraft.groups.map((group, index) => ({
        ...group,
        fieldIds: Array.from(new Set(group.fieldIds.map(String))),
        name: group.name.trim() || `信息分组 ${index + 1}`,
      })),
      name: trimmedName,
      previewWorkbenchWidth: typeof schemeDraft.previewWorkbenchWidth === 'number'
        ? normalizeArchiveLayoutPreviewWorkbenchWidth(schemeDraft.previewWorkbenchWidth)
        : undefined,
    };

    if (schemeSourceId) {
      const nextSchemes = schemes.map((scheme) => (
        scheme.id === schemeSourceId ? normalizedDraft : scheme
      ));
      onSchemesChange(nextSchemes);
      setIsEditingUnsavedScheme(false);
      setSchemeDraft(cloneArchiveLayoutScheme(normalizedDraft));
      return normalizedDraft;
    }

    const nextScheme = {
      ...normalizedDraft,
      id: normalizedDraft.id || createArchiveLayoutSchemeId(),
    };
    onSchemesChange([...schemes, nextScheme]);
    setIsEditingUnsavedScheme(false);
    setSchemeSourceId(nextScheme.id);
    setSchemeDraft(cloneArchiveLayoutScheme(nextScheme));
    return nextScheme;
  }, [onSchemesChange, schemeDraft, schemeSourceId, schemes, selectedSchemeFieldIds]);

  const saveSchemeDraftAsCopy = React.useCallback(() => {
    const baseName = schemeDraft.name.trim() || '新方案';
    const nextScheme: ArchiveLayoutScheme = {
      ...cloneArchiveLayoutScheme(schemeDraft),
      id: createArchiveLayoutSchemeId(),
      name: baseName.endsWith('副本') ? baseName : `${baseName} 副本`,
      groups: schemeDraft.groups.map((group, index) => ({
        ...cloneArchiveLayoutSchemeGroup(group),
        id: createArchiveLayoutSchemeGroupId(`archive_layout_scheme_copy_group_${index + 1}`),
      })),
    };
    onSchemesChange([...schemes, nextScheme]);
    setIsEditingUnsavedScheme(false);
    setSchemeSourceId(nextScheme.id);
    setSchemeDraft(cloneArchiveLayoutScheme(nextScheme));
    setSelectedSchemeGroupId(nextScheme.groups[0]?.id ?? null);
    return nextScheme;
  }, [onSchemesChange, schemeDraft, schemes]);

  React.useEffect(() => {
    if (!isSchemeModalOpen || typeof globalThis.window === 'undefined') {
      return;
    }

    const handleSchemeModalKeyDown = (event: KeyboardEvent) => {
      const modifierKey = event.metaKey || event.ctrlKey;
      if (modifierKey && event.key.toLowerCase() === 's') {
        event.preventDefault();
        if (event.shiftKey) {
          saveSchemeDraftAsCopy();
          return;
        }
        saveSchemeDraft();
        return;
      }

      if (modifierKey && event.key === 'Enter') {
        event.preventDefault();
        saveSchemeDraft();
        applySchemeDraft(false);
        return;
      }

      if (!isEditableEventTarget(event.target) && event.key === '/') {
        event.preventDefault();
        schemeFieldSearchInputRef.current?.focus();
        schemeFieldSearchInputRef.current?.select();
        return;
      }

      if (!isEditableEventTarget(event.target) && event.key === 'Escape') {
        event.preventDefault();
        if (expandedSchemeFieldId) {
          setExpandedSchemeFieldId(null);
          return;
        }
        if (isBatchSizePanelOpen) {
          setIsBatchSizePanelOpen(false);
          return;
        }
        setIsSchemeModalOpen(false);
      }
    };

    globalThis.window.addEventListener('keydown', handleSchemeModalKeyDown);
    return () => globalThis.window.removeEventListener('keydown', handleSchemeModalKeyDown);
  }, [applySchemeDraft, expandedSchemeFieldId, isBatchSizePanelOpen, isSchemeModalOpen, saveSchemeDraft, saveSchemeDraftAsCopy]);

  const createNewSchemeDraft = React.useCallback(() => {
    const nextScheme = {
      ...createEmptyArchiveLayoutScheme(`方案 ${schemes.length + 1}`),
      previewWorkbenchWidth,
    };
    React.startTransition(() => {
      setIsEditingUnsavedScheme(true);
      setSchemeSourceId(null);
      setSchemeDraft(nextScheme);
      setSelectedSchemeGroupId(nextScheme.groups[0]?.id ?? null);
      onOpenSchemesView();
      setIsSchemeModalOpen(true);
    });
  }, [onOpenSchemesView, previewWorkbenchWidth, schemes.length]);

  const createSchemeFromCurrentLayout = React.useCallback(() => {
    const nextScheme = {
      ...buildCurrentLayoutScheme(),
      previewWorkbenchWidth,
    };
    React.startTransition(() => {
      setIsEditingUnsavedScheme(true);
      setSchemeSourceId(null);
      setSchemeDraft(nextScheme);
      setSelectedSchemeGroupId(nextScheme.groups[0]?.id ?? null);
      onOpenSchemesView();
      setIsSchemeModalOpen(true);
    });
  }, [buildCurrentLayoutScheme, onOpenSchemesView, previewWorkbenchWidth]);

  const deleteActiveScheme = React.useCallback(() => {
    if (!schemeSourceId) {
      const nextDraft = createEmptyArchiveLayoutScheme(`方案 ${schemes.length + 1}`);
      setIsEditingUnsavedScheme(true);
      setSchemeDraft(nextDraft);
      setSelectedSchemeGroupId(nextDraft.groups[0]?.id ?? null);
      return;
    }

    const nextSchemes = schemes.filter((scheme) => scheme.id !== schemeSourceId);
    onSchemesChange(nextSchemes);
    if (nextSchemes.length > 0) {
      setIsEditingUnsavedScheme(false);
      setSchemeSourceId(nextSchemes[0].id);
      setSchemeDraft(cloneArchiveLayoutScheme(nextSchemes[0]));
      setSelectedSchemeGroupId(nextSchemes[0].groups[0]?.id ?? null);
      return;
    }

    const nextDraft = createEmptyArchiveLayoutScheme('新方案');
    setIsEditingUnsavedScheme(true);
    setSchemeSourceId(null);
    setSchemeDraft(nextDraft);
    setSelectedSchemeGroupId(nextDraft.groups[0]?.id ?? null);
  }, [onSchemesChange, schemeSourceId, schemes]);

  const duplicateScheme = React.useCallback((scheme: ArchiveLayoutScheme) => {
    const duplicatedScheme: ArchiveLayoutScheme = {
      ...cloneArchiveLayoutScheme(scheme),
      id: createArchiveLayoutSchemeId(),
      name: scheme.name.endsWith('副本') ? scheme.name : `${scheme.name} 副本`,
      groups: scheme.groups.map((group, index) => ({
        ...cloneArchiveLayoutSchemeGroup(group),
        id: createArchiveLayoutSchemeGroupId(`archive_layout_scheme_duplicate_group_${index + 1}`),
      })),
    };
    onSchemesChange([...schemes, duplicatedScheme]);
    React.startTransition(() => {
      setIsEditingUnsavedScheme(false);
      setSchemeSourceId(duplicatedScheme.id);
      setSchemeDraft(cloneArchiveLayoutScheme(duplicatedScheme));
      setSelectedSchemeGroupId(duplicatedScheme.groups[0]?.id ?? null);
      onOpenSchemesView();
    });
    return duplicatedScheme;
  }, [onOpenSchemesView, onSchemesChange, schemes]);

  const applySpecificScheme = React.useCallback((scheme: ArchiveLayoutScheme, forceConfirm = hasPlacedFields) => {
    if (forceConfirm && !window.confirm('应用方案会按方案内容重建当前布局，是否继续？')) {
      return false;
    }
    const schemePreviewWidth = getArchiveLayoutSchemePreviewWorkbenchWidth(scheme, previewWorkbenchWidth);
    commitDocument(buildSchemeDocument(scheme, schemePreviewWidth), schemePreviewWidth);
    onOpenStructureView();
    setIsSchemeModalOpen(false);
    return true;
  }, [buildSchemeDocument, commitDocument, hasPlacedFields, onOpenStructureView, previewWorkbenchWidth]);

  const selectScheme = React.useCallback((scheme: ArchiveLayoutScheme) => {
    React.startTransition(() => {
      setIsEditingUnsavedScheme(false);
      setSchemeSourceId(scheme.id);
      setSchemeDraft(cloneArchiveLayoutScheme(scheme));
      setSelectedSchemeGroupId(scheme.groups[0]?.id ?? null);
      onOpenSchemesView();
    });
  }, [onOpenSchemesView]);

  const updateSchemeDraft = React.useCallback((updater: (scheme: ArchiveLayoutScheme) => ArchiveLayoutScheme) => {
    setSchemeDraft((current) => {
      const nextScheme = updater(current);
      return {
        ...nextScheme,
        fieldDefaults: nextScheme.fieldDefaults ?? {},
        groups: nextScheme.groups.length > 0 ? nextScheme.groups : [
          {
            fieldIds: [],
            id: createArchiveLayoutSchemeGroupId(),
            name: '信息分组 1',
          },
        ],
        previewWorkbenchWidth: typeof nextScheme.previewWorkbenchWidth === 'number'
          ? normalizeArchiveLayoutPreviewWorkbenchWidth(nextScheme.previewWorkbenchWidth)
          : undefined,
      };
    });
  }, []);

  const setSchemeDraftName = React.useCallback((name: string) => {
    setSchemeDraft((current) => ({
      ...current,
      name,
    }));
  }, []);

  const updateSchemeFieldDefault = React.useCallback((fieldId: string, dimension: 'w' | 'h', value: number | undefined) => {
    updateSchemeDraft((current) => {
      const currentDefaults = current.fieldDefaults ?? {};
      const nextDefaults = { ...(currentDefaults[fieldId] ?? {}) };
      if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
        nextDefaults[dimension] = value;
      } else {
        delete nextDefaults[dimension];
      }

      const mergedDefaults = { ...currentDefaults };
      if (typeof nextDefaults.w === 'number' || typeof nextDefaults.h === 'number') {
        mergedDefaults[fieldId] = nextDefaults;
      } else {
        delete mergedDefaults[fieldId];
      }

      return {
        ...current,
        fieldDefaults: mergedDefaults,
      };
    });
  }, [updateSchemeDraft]);

  const addSchemeGroup = React.useCallback(() => {
    const nextGroup: ArchiveLayoutSchemeGroup = {
      fieldIds: [],
      id: createArchiveLayoutSchemeGroupId(),
      name: `信息分组 ${schemeDraft.groups.length + 1}`,
    };
    updateSchemeDraft((current) => ({
      ...current,
      groups: [...current.groups, nextGroup],
    }));
    setSelectedSchemeGroupId(nextGroup.id);
  }, [schemeDraft.groups.length, updateSchemeDraft]);

  const renameSchemeGroup = React.useCallback((groupId: string, name: string) => {
    updateSchemeDraft((current) => ({
      ...current,
      groups: current.groups.map((group) => (
        group.id === groupId ? { ...group, name } : group
      )),
    }));
  }, [updateSchemeDraft]);

  const removeSchemeGroup = React.useCallback((groupId: string) => {
    updateSchemeDraft((current) => ({
      ...current,
      groups: current.groups.filter((group) => group.id !== groupId),
    }));
    if (selectedSchemeGroupId === groupId) {
      const fallbackGroup = schemeDraft.groups.find((group) => group.id !== groupId) ?? null;
      setSelectedSchemeGroupId(fallbackGroup?.id ?? null);
    }
  }, [schemeDraft.groups, selectedSchemeGroupId, updateSchemeDraft]);

  const moveSchemeGroup = React.useCallback((groupId: string, direction: 'down' | 'up') => {
    updateSchemeDraft((current) => {
      const currentIndex = current.groups.findIndex((group) => group.id === groupId);
      if (currentIndex < 0) {
        return current;
      }

      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= current.groups.length) {
        return current;
      }

      const nextGroups = [...current.groups];
      const [targetGroup] = nextGroups.splice(currentIndex, 1);
      nextGroups.splice(targetIndex, 0, targetGroup);
      return {
        ...current,
        groups: nextGroups,
      };
    });
  }, [updateSchemeDraft]);

  const toggleFieldInSchemeGroup = React.useCallback((groupId: string, fieldId: string, checked: boolean) => {
    updateSchemeDraft((current) => {
      const nextGroups = current.groups.map((group) => ({
        ...group,
        fieldIds: checked
          ? group.fieldIds.filter((id) => id !== fieldId)
          : [...group.fieldIds],
      }));

      return {
        ...current,
        groups: nextGroups.map((group) => {
          if (group.id !== groupId) {
            return group;
          }
          return {
            ...group,
            fieldIds: checked
              ? [...group.fieldIds, fieldId]
              : group.fieldIds.filter((id) => id !== fieldId),
          };
        }),
      };
    });
  }, [updateSchemeDraft]);

  const moveSchemeFieldToGroup = React.useCallback((fieldId: string, target: 'down' | 'up' | 'unassigned') => {
    if (!selectedSchemeGroupId) {
      return;
    }

    updateSchemeDraft((current) => {
      const sourceIndex = current.groups.findIndex((group) => group.id === selectedSchemeGroupId);
      if (sourceIndex < 0) {
        return current;
      }

      const targetIndex = target === 'unassigned'
        ? -1
        : sourceIndex + (target === 'up' ? -1 : 1);
      if (targetIndex < -1 || targetIndex >= current.groups.length) {
        return current;
      }

      const nextGroups = current.groups.map((group) => ({
        ...group,
        fieldIds: group.fieldIds.filter((id) => id !== fieldId),
      }));

      if (targetIndex >= 0) {
        nextGroups[targetIndex] = {
          ...nextGroups[targetIndex],
          fieldIds: [...nextGroups[targetIndex].fieldIds, fieldId],
        };
      }

      return {
        ...current,
        groups: nextGroups,
      };
    });
    setExpandedSchemeFieldId((current) => (current === fieldId && target === 'unassigned' ? null : current));
  }, [selectedSchemeGroupId, updateSchemeDraft]);

  const moveCurrentSchemeGroupFields = React.useCallback((target: 'down' | 'up' | 'unassigned') => {
    if (!selectedSchemeGroup) {
      return;
    }

    const fieldIdsToMove = [...selectedSchemeGroup.fieldIds];
    if (fieldIdsToMove.length === 0) {
      return;
    }

    updateSchemeDraft((current) => {
      const sourceIndex = current.groups.findIndex((group) => group.id === selectedSchemeGroup.id);
      if (sourceIndex < 0) {
        return current;
      }

      const targetIndex = target === 'unassigned'
        ? -1
        : sourceIndex + (target === 'up' ? -1 : 1);
      if (targetIndex < -1 || targetIndex >= current.groups.length) {
        return current;
      }

      const movedFieldIds = new Set(fieldIdsToMove);
      const nextGroups = current.groups.map((group) => ({
        ...group,
        fieldIds: group.fieldIds.filter((fieldId) => !movedFieldIds.has(fieldId)),
      }));

      if (targetIndex >= 0) {
        nextGroups[targetIndex] = {
          ...nextGroups[targetIndex],
          fieldIds: [...nextGroups[targetIndex].fieldIds, ...fieldIdsToMove],
        };
      }

      return {
        ...current,
        groups: nextGroups,
      };
    });
    setExpandedSchemeFieldId(null);
  }, [selectedSchemeGroup, updateSchemeDraft]);

  const handleSchemeFieldSizeInputKeyDown = React.useCallback((
    event: React.KeyboardEvent<HTMLInputElement>,
    commit: () => void,
    reset: () => void,
  ) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      commit();
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      reset();
    }
  }, []);

  const handleToggleSchemeFieldExpanded = React.useCallback((fieldId: string) => {
    setExpandedSchemeFieldId((current) => (current === fieldId ? null : fieldId));
    const targetRow = visibleSchemeFieldRows.find((row) => row.fieldId === fieldId);
    if (!targetRow) {
      return;
    }
    setSchemeFieldSizeInputs((current) => (
      current[fieldId]
        ? current
        : {
          ...current,
          [fieldId]: {
            h: String(targetRow.resolvedHeight),
            w: String(targetRow.resolvedWidth),
          },
        }
    ));
  }, [visibleSchemeFieldRows]);

  const handleSchemeFieldSizeDraftChange = React.useCallback((
    fieldId: string,
    patch: { h?: string; w?: string },
    resolvedWidth: number,
    resolvedHeight: number,
  ) => {
    setSchemeFieldSizeInputs((current) => ({
      ...current,
      [fieldId]: {
        h: patch.h ?? current[fieldId]?.h ?? String(resolvedHeight),
        w: patch.w ?? current[fieldId]?.w ?? String(resolvedWidth),
      },
    }));
  }, []);

  const handleResetSchemeFieldSizeDraft = React.useCallback((fieldId: string, resolvedWidth: number, resolvedHeight: number) => {
    setSchemeFieldSizeInputs((current) => ({
      ...current,
      [fieldId]: {
        h: String(resolvedHeight),
        w: String(resolvedWidth),
      },
    }));
  }, []);

  const handleCommitSchemeFieldSizeDraft = React.useCallback((
    fieldId: string,
    dimension: 'w' | 'h',
    rawValue: string,
    fallback: number,
    resolvedWidth: number,
    resolvedHeight: number,
  ) => {
    const nextValue = parseCommittedNumber(
      rawValue,
      fallback,
      dimension === 'w' ? 120 : 28,
      dimension === 'w' ? ARCHIVE_LAYOUT_PREVIEW_WIDTH_MAX : 160,
    );
    updateSchemeFieldDefault(fieldId, dimension, nextValue);
    setSchemeFieldSizeInputs((current) => ({
      ...current,
      [fieldId]: {
        h: dimension === 'h' ? String(nextValue) : current[fieldId]?.h ?? String(resolvedHeight),
        w: dimension === 'w' ? String(nextValue) : current[fieldId]?.w ?? String(resolvedWidth),
      },
    }));
    return nextValue;
  }, [updateSchemeFieldDefault]);

  const handleNudgeSchemeFieldSizeDraft = React.useCallback((
    fieldId: string,
    dimension: 'w' | 'h',
    currentValue: number,
    delta: number,
    resolvedWidth: number,
    resolvedHeight: number,
  ) => {
    const nextValue = parseCommittedNumber(
      String(currentValue + delta),
      currentValue,
      dimension === 'w' ? 120 : 28,
      dimension === 'w' ? ARCHIVE_LAYOUT_PREVIEW_WIDTH_MAX : 160,
    );
    updateSchemeFieldDefault(fieldId, dimension, nextValue);
    setSchemeFieldSizeInputs((current) => ({
      ...current,
      [fieldId]: {
        h: dimension === 'h' ? String(nextValue) : current[fieldId]?.h ?? String(resolvedHeight),
        w: dimension === 'w' ? String(nextValue) : current[fieldId]?.w ?? String(resolvedWidth),
      },
    }));
    return nextValue;
  }, [updateSchemeFieldDefault]);

  const handleSchemeFieldCheckedChange = React.useCallback((fieldId: string, checked: boolean) => {
    if (!selectedSchemeGroup) {
      return;
    }
    toggleFieldInSchemeGroup(selectedSchemeGroup.id, fieldId, checked);
  }, [selectedSchemeGroup, toggleFieldInSchemeGroup]);

  const applySchemeBatchFieldSize = React.useCallback(() => {
    if (selectedSchemeBatchFieldIds.length === 0) {
      return;
    }

    const nextWidth = schemeBatchSizeInput.w.trim()
      ? parseCommittedNumber(schemeBatchSizeInput.w, 0, 120, ARCHIVE_LAYOUT_PREVIEW_WIDTH_MAX)
      : null;
    const nextHeight = schemeBatchSizeInput.h.trim()
      ? parseCommittedNumber(schemeBatchSizeInput.h, 0, 28, 160)
      : null;

    updateSchemeDraft((current) => {
      const nextFieldDefaults = { ...(current.fieldDefaults ?? {}) };
      selectedSchemeBatchFieldIds.forEach((fieldId) => {
        const currentDefaults = { ...(nextFieldDefaults[fieldId] ?? {}) };
        if (nextWidth != null) {
          currentDefaults.w = nextWidth;
        }
        if (nextHeight != null) {
          currentDefaults.h = nextHeight;
        }
        nextFieldDefaults[fieldId] = currentDefaults;
      });
      return {
        ...current,
        fieldDefaults: nextFieldDefaults,
      };
    });

    if (nextWidth != null || nextHeight != null) {
      setSchemeFieldSizeInputs((current) => {
        const nextInputs = { ...current };
        selectedSchemeBatchFieldIds.forEach((fieldId) => {
          const existingRow = visibleSchemeFieldRows.find((row) => row.fieldId === fieldId);
          nextInputs[fieldId] = {
            h: nextHeight != null ? String(nextHeight) : current[fieldId]?.h ?? String(existingRow?.resolvedHeight ?? ''),
            w: nextWidth != null ? String(nextWidth) : current[fieldId]?.w ?? String(existingRow?.resolvedWidth ?? ''),
          };
        });
        return nextInputs;
      });
    }
  }, [schemeBatchSizeInput.h, schemeBatchSizeInput.w, selectedSchemeBatchFieldIds, updateSchemeDraft, visibleSchemeFieldRows]);

  const commitSchemePreviewWorkbenchWidth = React.useCallback((rawValue: string) => {
    const nextWidth = normalizeArchiveLayoutPreviewWorkbenchWidth(
      parseCommittedNumber(
        rawValue,
        getArchiveLayoutSchemePreviewWorkbenchWidth(schemeDraft, previewWorkbenchWidth),
        ARCHIVE_LAYOUT_PREVIEW_WIDTH_MIN,
        ARCHIVE_LAYOUT_PREVIEW_WIDTH_MAX,
      ),
    );
    setSchemePreviewWorkbenchWidthInput(String(nextWidth));
    updateSchemeDraft((current) => ({
      ...current,
      previewWorkbenchWidth: nextWidth,
    }));
    return nextWidth;
  }, [previewWorkbenchWidth, schemeDraft, updateSchemeDraft]);

  const handleSchemePreviewWorkbenchWidthSliderChange = React.useCallback((nextWidth: number) => {
    const normalizedWidth = normalizeArchiveLayoutPreviewWorkbenchWidth(nextWidth);
    setSchemePreviewWorkbenchWidthInput(String(normalizedWidth));
    updateSchemeDraft((current) => ({
      ...current,
      previewWorkbenchWidth: normalizedWidth,
    }));
  }, [updateSchemeDraft]);

  const handleSchemePreviewWorkbenchWidthPresetSelect = React.useCallback((value: number) => {
    const normalizedWidth = normalizeArchiveLayoutPreviewWorkbenchWidth(value);
    setSchemePreviewWorkbenchWidthInput(String(normalizedWidth));
    updateSchemeDraft((current) => ({
      ...current,
      previewWorkbenchWidth: normalizedWidth,
    }));
  }, [updateSchemeDraft]);

  const handleSchemePreviewWorkbenchWidthInputChange = React.useCallback((value: string) => {
    const nextValue = value.replace(/[^\d]/g, '');
    setSchemePreviewWorkbenchWidthInput(nextValue);
    if (!nextValue) {
      updateSchemeDraft((current) => ({
        ...current,
        previewWorkbenchWidth: undefined,
      }));
      return;
    }
    updateSchemeDraft((current) => ({
      ...current,
      previewWorkbenchWidth: normalizeArchiveLayoutPreviewWorkbenchWidth(Number(nextValue)),
    }));
  }, [updateSchemeDraft]);

  const handleSchemePreviewWorkbenchWidthInputBlur = React.useCallback(() => {
    commitSchemePreviewWorkbenchWidth(schemePreviewWorkbenchWidthInput);
  }, [commitSchemePreviewWorkbenchWidth, schemePreviewWorkbenchWidthInput]);

  const handleSchemePreviewWorkbenchWidthInputKeyDown = React.useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    handleSchemeFieldSizeInputKeyDown(
      event,
      () => {
        commitSchemePreviewWorkbenchWidth(schemePreviewWorkbenchWidthInput);
      },
      () => {
        const fallbackWidth = getArchiveLayoutSchemePreviewWorkbenchWidth(schemeDraft, previewWorkbenchWidth);
        setSchemePreviewWorkbenchWidthInput(String(fallbackWidth));
      },
    );
  }, [commitSchemePreviewWorkbenchWidth, handleSchemeFieldSizeInputKeyDown, previewWorkbenchWidth, schemeDraft, schemePreviewWorkbenchWidthInput]);

  return {
    applySchemeBatchFieldSize,
    applySchemeDraft,
    applySpecificScheme,
    closeSchemeModal,
    createNewSchemeDraft,
    createSchemeFromCurrentLayout,
    deleteActiveScheme,
    duplicateScheme,
    filteredSelectedSchemeFieldCount,
    filteredUnassignedSchemeFieldCount,
    handleCommitSchemeFieldSizeDraft,
    handleSchemeFieldCheckedChange,
    handleSchemeFieldSizeDraftChange,
    handleSchemeFieldSizeInputKeyDown,
    handleSchemePreviewWorkbenchWidthInputBlur,
    handleSchemePreviewWorkbenchWidthInputChange,
    handleSchemePreviewWorkbenchWidthInputKeyDown,
    handleSchemePreviewWorkbenchWidthPresetSelect,
    handleSchemePreviewWorkbenchWidthSliderChange,
    handleToggleSchemeFieldExpanded,
    handleNudgeSchemeFieldSizeDraft,
    handleResetSchemeFieldSizeDraft,
    isBatchSizePanelOpen,
    isEditingUnsavedScheme,
    isSchemeModalOpen,
    moveCurrentSchemeGroupFields,
    moveSchemeFieldToGroup,
    moveSchemeGroup,
    openSchemeModal,
    removeSchemeGroup,
    renameSchemeGroup,
    saveSchemeDraft,
    saveSchemeDraftAsCopy,
    schemeBatchSizeInput,
    schemeDraft,
    schemeFieldFilterMode,
    schemeFieldKeyword,
    schemeFieldSearchInputRef,
    schemePreviewWorkbenchWidthInput,
    schemeSourceId,
    selectedSchemeBatchFieldIds,
    selectedSchemeFieldCount: selectedSchemeFieldIdSet.size,
    selectedSchemeGroup,
    selectedSchemeGroupId,
    selectedSchemeGroupIndex,
    selectedSchemeGroupFieldCount: selectedSchemeGroupFieldIdSet.size,
    setIsBatchSizePanelOpen,
    setSchemeBatchSizeInput,
    setSchemeDraftName,
    setSchemeFieldFilterMode,
    setSchemeFieldKeyword,
    setSelectedSchemeGroupId,
    visibleSchemeFieldRows,
    addSchemeGroup,
    selectScheme,
  };
}
