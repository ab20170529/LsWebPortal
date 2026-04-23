import type {
  ArchiveLayoutScheme,
  ArchiveLayoutSchemeFieldDefaults,
  ArchiveLayoutSchemeGroup,
} from './detail-board-layout-designer-adapter';

export const ARCHIVE_LAYOUT_PREVIEW_WIDTH_MIN = 720;
export const ARCHIVE_LAYOUT_PREVIEW_WIDTH_MAX = 1320;

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function normalizeArchiveLayoutPreviewWorkbenchWidth(value: number) {
  return clampNumber(
    Math.round(value / 20) * 20,
    ARCHIVE_LAYOUT_PREVIEW_WIDTH_MIN,
    ARCHIVE_LAYOUT_PREVIEW_WIDTH_MAX,
  );
}

export function cloneArchiveLayoutSchemeGroup(group: ArchiveLayoutSchemeGroup): ArchiveLayoutSchemeGroup {
  return {
    ...group,
    fieldIds: [...group.fieldIds],
  };
}

export function cloneArchiveLayoutSchemeFieldDefaults(
  fieldDefaults?: Record<string, ArchiveLayoutSchemeFieldDefaults>,
): Record<string, ArchiveLayoutSchemeFieldDefaults> {
  if (!fieldDefaults) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(fieldDefaults).map(([fieldId, defaults]) => [fieldId, { ...defaults }]),
  );
}

export function cloneArchiveLayoutScheme(scheme: ArchiveLayoutScheme): ArchiveLayoutScheme {
  return {
    ...scheme,
    fieldDefaults: cloneArchiveLayoutSchemeFieldDefaults(scheme.fieldDefaults),
    groups: scheme.groups.map(cloneArchiveLayoutSchemeGroup),
    previewWorkbenchWidth: typeof scheme.previewWorkbenchWidth === 'number'
      ? normalizeArchiveLayoutPreviewWorkbenchWidth(scheme.previewWorkbenchWidth)
      : undefined,
  };
}

export function createArchiveLayoutSchemeId(prefix = 'archive_layout_scheme') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createArchiveLayoutSchemeGroupId(prefix = 'archive_layout_scheme_group') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createEmptyArchiveLayoutScheme(name = '新方案'): ArchiveLayoutScheme {
  return {
    fieldDefaults: {},
    groups: [
      {
        fieldIds: [],
        id: createArchiveLayoutSchemeGroupId(),
        name: '信息分组 1',
      },
    ],
    id: createArchiveLayoutSchemeId(),
    name,
    previewWorkbenchWidth: undefined,
  };
}

export function getArchiveLayoutSchemePreviewWorkbenchWidth(
  scheme: ArchiveLayoutScheme,
  fallbackWidth: number,
) {
  return normalizeArchiveLayoutPreviewWorkbenchWidth(
    typeof scheme.previewWorkbenchWidth === 'number' && Number.isFinite(scheme.previewWorkbenchWidth)
      ? scheme.previewWorkbenchWidth
      : fallbackWidth,
  );
}

export function countArchiveLayoutSchemeFields(scheme: ArchiveLayoutScheme) {
  return scheme.groups.reduce((count, group) => count + group.fieldIds.length, 0);
}
