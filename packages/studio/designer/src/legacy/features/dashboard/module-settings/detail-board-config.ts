export const DETAIL_BOARD_DEFAULT_THEME = 'aurora';
export const DETAIL_BOARD_GROUP_MIN_ROWS = 1;
export const DETAIL_BOARD_GROUP_MAX_ROWS = 6;

export const DETAIL_BOARD_THEME_OPTIONS = [
  { value: 'aurora', label: '星雾玻璃', hint: '蓝青渐层，适合主档详情' },
  { value: 'sunset', label: '日落暖光', hint: '暖橙层次，更偏业务看板' },
  { value: 'jade', label: '青玉留白', hint: '轻绿色块，适合信息分组' },
] as const;

export const DETAIL_BOARD_THEME_STYLES: Record<string, {
  tableSurface: string;
  tableCanvas: string;
  badge: string;
  hero: string;
  heroBadge: string;
  groupShell: string;
  groupLabel: string;
  groupMetric: string;
  groupItem: string;
  groupValue: string;
  listCard: string;
}> = {
  aurora: {
    tableSurface: 'bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.1),transparent_28%)]',
    tableCanvas: 'bg-[radial-gradient(circle_at_top_left,rgba(191,219,254,0.36),transparent_34%),linear-gradient(180deg,rgba(245,250,255,0.98),rgba(249,252,255,0.96))]',
    badge: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/20 dark:bg-sky-500/10 dark:text-sky-200',
    hero: 'border-[#d7e7fb] bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_38%),linear-gradient(160deg,rgba(239,246,255,0.96),rgba(255,255,255,0.98))]',
    heroBadge: 'bg-white/88 text-sky-700 dark:bg-slate-900/72 dark:text-sky-200',
    groupShell: 'border-[#dbeafe] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(245,250,255,0.96))]',
    groupLabel: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-200',
    groupMetric: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-200',
    groupItem: 'border-[#dbeafe] bg-white/94 dark:border-slate-700 dark:bg-slate-900/58',
    groupValue: 'text-slate-800 dark:text-slate-100',
    listCard: 'hover:border-sky-300/60 hover:shadow-[0_24px_40px_-32px_rgba(59,130,246,0.3)]',
  },
  sunset: {
    tableSurface: 'bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.08),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(244,114,182,0.1),transparent_30%)]',
    tableCanvas: 'bg-[radial-gradient(circle_at_top_left,rgba(254,215,170,0.34),transparent_34%),linear-gradient(180deg,rgba(255,247,240,0.98),rgba(255,250,245,0.96))]',
    badge: 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-400/20 dark:bg-orange-500/10 dark:text-orange-200',
    hero: 'border-[#f8d7bf] bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.18),transparent_38%),linear-gradient(160deg,rgba(255,247,237,0.96),rgba(255,255,255,0.98))]',
    heroBadge: 'bg-white/88 text-orange-700 dark:bg-slate-900/72 dark:text-orange-200',
    groupShell: 'border-[#fde7d5] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,248,243,0.96))]',
    groupLabel: 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-200',
    groupMetric: 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-200',
    groupItem: 'border-[#fde7d5] bg-white/94 dark:border-slate-700 dark:bg-slate-900/58',
    groupValue: 'text-slate-800 dark:text-slate-100',
    listCard: 'hover:border-orange-300/60 hover:shadow-[0_24px_40px_-32px_rgba(251,146,60,0.3)]',
  },
  jade: {
    tableSurface: 'bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.08),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(20,184,166,0.1),transparent_28%)]',
    tableCanvas: 'bg-[radial-gradient(circle_at_top_left,rgba(167,243,208,0.32),transparent_34%),linear-gradient(180deg,rgba(242,252,248,0.98),rgba(248,253,251,0.96))]',
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200',
    hero: 'border-[#caeddc] bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_38%),linear-gradient(160deg,rgba(236,253,245,0.96),rgba(255,255,255,0.98))]',
    heroBadge: 'bg-white/88 text-emerald-700 dark:bg-slate-900/72 dark:text-emerald-200',
    groupShell: 'border-[#d1fae5] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(243,252,248,0.96))]',
    groupLabel: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200',
    groupMetric: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-200',
    groupItem: 'border-[#d1fae5] bg-white/94 dark:border-slate-700 dark:bg-slate-900/58',
    groupValue: 'text-slate-800 dark:text-slate-100',
    listCard: 'hover:border-emerald-300/60 hover:shadow-[0_24px_40px_-32px_rgba(16,185,129,0.28)]',
  },
};

function clampDetailBoardValue(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function getDetailBoardGroupRows(group: any) {
  const rawRows = Number.isFinite(Number(group?.rows)) ? Number(group.rows) : DETAIL_BOARD_GROUP_MIN_ROWS;
  return Math.min(DETAIL_BOARD_GROUP_MAX_ROWS, Math.max(DETAIL_BOARD_GROUP_MIN_ROWS, rawRows));
}

export function getDetailBoardGroupColumnRow(group: any, columnId: string) {
  const rows = getDetailBoardGroupRows(group);
  const columnIds = Array.isArray(group?.columnIds) ? group.columnIds : [];
  const explicitRow = Number(group?.columnRows?.[columnId]);
  if (Number.isFinite(explicitRow)) {
    return Math.min(rows, Math.max(DETAIL_BOARD_GROUP_MIN_ROWS, explicitRow));
  }

  const legacyColumnsPerRow = Math.max(1, Math.min(4, Number(group?.columnsPerRow) || 2));
  const columnIndex = Math.max(0, columnIds.indexOf(columnId));
  return Math.min(rows, Math.max(DETAIL_BOARD_GROUP_MIN_ROWS, Math.floor(columnIndex / legacyColumnsPerRow) + 1));
}

export function getDetailBoardDragItemId(groupId: string, fieldId: string) {
  return `detail-board-item:${groupId}:${fieldId}`;
}

export function getDetailBoardDropItemId(groupId: string, fieldId: string) {
  return `detail-board-drop:${groupId}:${fieldId}`;
}

export function getDetailBoardRowDropId(groupId: string, row: number) {
  return `detail-board-row:${groupId}:${row}`;
}

export function buildDetailBoardGroup(index: number, columnIds: string[] = [], overrides: Record<string, any> = {}) {
  const presets = [
    { name: '主信息', description: '适合放编号、名称、主抬头字段' },
    { name: '业务状态', description: '适合放状态、归属、业务阶段' },
    { name: '扩展补充', description: '适合放备注、说明和补充字段' },
  ];
  const preset = presets[index - 1] ?? { name: `信息分组 ${index}`, description: '用于详情流布局展示的一组字段' };

  return {
    id: `detail_group_${Date.now()}_${index}`,
    name: preset.name,
    description: preset.description,
    columnIds,
    rows: Math.min(3, Math.max(DETAIL_BOARD_GROUP_MIN_ROWS, Math.ceil(Math.max(columnIds.length, 1) / 2))),
    columnRows: Object.fromEntries(columnIds.map((columnId, columnIndex) => [columnId, Math.floor(columnIndex / 2) + 1])),
    columnsPerRow: 2,
    columnWidths: {},
    columnHeights: {},
    ...overrides,
  };
}

export function createSuggestedDetailBoardGroups(columns: any[]) {
  const columnIds = columns.map((column) => column.id).filter(Boolean);

  if (columnIds.length === 0) {
    return [
      buildDetailBoardGroup(1),
      buildDetailBoardGroup(2, [], { name: '业务信息', description: '勾选字段后会按流式卡片自动排布' }),
    ];
  }

  const chunks = [
    columnIds.slice(0, 2),
    columnIds.slice(2, 5),
    columnIds.slice(5, 8),
  ].filter((chunk) => chunk.length > 0);

  return chunks.map((columnIdsChunk, index) => (
    buildDetailBoardGroup(index + 1, columnIdsChunk)
  ));
}

export function buildDetailBoardConfig(columns: any[] = [], overrides: Record<string, any> = {}) {
  return {
    archiveLayoutDirty: false,
    archiveLayoutSource: null,
    enabled: false,
    designerLayout: null,
    hiddenColumnIds: [],
    theme: DETAIL_BOARD_DEFAULT_THEME,
    sortColumnId: columns[0]?.id ?? null,
    groups: createSuggestedDetailBoardGroups(columns),
    ...overrides,
  };
}

export function normalizeDetailBoardConfig(config: any, columns: any[] = []) {
  const rawConfig = config && typeof config === 'object' ? config : {};
  const availableColumnIds = new Set(columns.map((column) => column.id));
  const hiddenColumnIds = Array.from(new Set(
    (Array.isArray(rawConfig?.hiddenColumnIds) ? rawConfig.hiddenColumnIds : [])
      .map(String)
      .filter((columnId: string) => availableColumnIds.has(columnId)),
  ));
  const hiddenColumnIdSet = new Set(hiddenColumnIds);
  const assignedColumnIdSet = new Set<string>();
  const suggestedGroups = createSuggestedDetailBoardGroups(columns);
  const hasCustomGroups = Array.isArray(rawConfig?.groups);
  const rawGroups = hasCustomGroups ? rawConfig.groups : suggestedGroups;
  const normalizedGroups = rawGroups.map((group: any, index: number) => (
    (() => {
      const columnIds = Array.from(new Set(
        (group?.columnIds ?? [])
          .map(String)
          .filter((columnId: string) => (
            availableColumnIds.has(columnId)
            && !hiddenColumnIdSet.has(columnId)
            && !assignedColumnIdSet.has(columnId)
          )),
      ));
      columnIds.forEach((columnId: string) => assignedColumnIdSet.add(columnId));
      const legacyColumnsPerRow = Math.max(1, Math.min(4, Number(group?.columnsPerRow) || 2));
      const rows = clampDetailBoardValue(
        Number.isFinite(Number(group?.rows))
          ? Number(group.rows)
          : Math.max(DETAIL_BOARD_GROUP_MIN_ROWS, Math.ceil(Math.max(columnIds.length, 1) / legacyColumnsPerRow)),
        DETAIL_BOARD_GROUP_MIN_ROWS,
        DETAIL_BOARD_GROUP_MAX_ROWS,
      );
      const rawColumnRows = Object.fromEntries(
        columnIds.map((columnId: string, columnIndex: number) => {
          const explicitRow = Number(group?.columnRows?.[columnId]);
          const row = Number.isFinite(explicitRow)
            ? explicitRow
            : Math.floor(columnIndex / legacyColumnsPerRow) + 1;
          return [columnId, clampDetailBoardValue(row, DETAIL_BOARD_GROUP_MIN_ROWS, rows)];
        }),
      );

      return {
        id: group?.id ?? buildDetailBoardGroup(index + 1).id,
        name: typeof group?.name === 'string' ? group.name : `信息分组 ${index + 1}`,
        description: group?.description ?? '',
        columnIds,
        rows,
        columnRows: rawColumnRows,
        columnsPerRow: legacyColumnsPerRow,
        columnWidths: Object.fromEntries(
          Object.entries(group?.columnWidths ?? {}).filter(([columnId, width]) => (
            availableColumnIds.has(columnId) && Number(width) > 0
          )),
        ),
        columnHeights: Object.fromEntries(
          Object.entries(group?.columnHeights ?? {}).filter(([columnId, height]) => (
            availableColumnIds.has(columnId) && Number(height) > 0
          )),
        ),
      };
    })()
  ));

  return {
    ...rawConfig,
    archiveLayoutDirty: Boolean(rawConfig?.archiveLayoutDirty),
    archiveLayoutSource: rawConfig?.archiveLayoutSource && typeof rawConfig.archiveLayoutSource === 'object'
      ? rawConfig.archiveLayoutSource
      : null,
    enabled: Boolean(rawConfig?.enabled),
    designerLayout: rawConfig?.designerLayout && typeof rawConfig.designerLayout === 'object'
      ? rawConfig.designerLayout
      : null,
    hiddenColumnIds,
    theme: DETAIL_BOARD_THEME_OPTIONS.some((option) => option.value === rawConfig?.theme) ? rawConfig.theme : DETAIL_BOARD_DEFAULT_THEME,
    sortColumnId: availableColumnIds.has(rawConfig?.sortColumnId) ? rawConfig.sortColumnId : columns[0]?.id ?? null,
    groups: hasCustomGroups ? normalizedGroups : suggestedGroups,
  };
}

export function getDetailBoardTheme(theme?: string) {
  return DETAIL_BOARD_THEME_STYLES[theme || DETAIL_BOARD_DEFAULT_THEME] ?? DETAIL_BOARD_THEME_STYLES[DETAIL_BOARD_DEFAULT_THEME];
}
