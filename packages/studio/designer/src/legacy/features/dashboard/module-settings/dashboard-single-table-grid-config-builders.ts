import { buildDetailBoardConfig } from './detail-board-config';

export function buildDashboardGridColorRule(index: number, overrides: Record<string, any> = {}) {
  return {
    id: `color_${Date.now()}_${index}`,
    label: `颜色规则 ${index}`,
    disabled: false,
    tab: '',
    condition: '',
    forcecolor: '#9f1239',
    backcolor: '#ffe4e6',
    orderid: index,
    useflag: 1,
    dfcolor: '#9f1239',
    dbcolor: '#ffe4e6',
    ifBold: 0,
    ifItalic: 0,
    ifStrickOut: 0,
    ifUnderLine: 0,
    fontsize: 12,
    textColor: '#9f1239',
    backgroundColor: '#ffe4e6',
    ...overrides,
  };
}

export function buildDashboardDetailChartConfig(overrides: Record<string, any> = {}) {
  return {
    chartType: '0',
    chartTitle: '',
    chartColor: '#2563eb',
    chartColorDf: '#60a5fa',
    chart3D: false,
    gridLineVisible: true,
    XLabelField: '',
    YValueField: '',
    XAxisTitle: '',
    YAxisTitle: '',
    YAxisShared: false,
    markVisible: false,
    legendVisible: false,
    isVisible: false,
    orderId: 0,
    IsAbsolutely: false,
    YScale: '',
    yvaluefield1: '',
    yvaluefield2: '',
    valueVisible: false,
    labelangle: '',
    labelvisible: false,
    labelsize: '',
    labelSpaced: '',
    circlejagge: false,
    circlehollow: false,
    ...overrides,
  };
}

export function normalizeDashboardDetailChartConfig(config: any) {
  const baseConfig = buildDashboardDetailChartConfig();
  const nextConfig = { ...baseConfig, ...(config ?? {}) };

  return {
    ...nextConfig,
    chartColor: String(nextConfig.chartColor || baseConfig.chartColor),
    chartColorDf: String(nextConfig.chartColorDf || baseConfig.chartColorDf),
    chart3D: Boolean(nextConfig.chart3D),
    gridLineVisible: Boolean(nextConfig.gridLineVisible),
    YAxisShared: Boolean(nextConfig.YAxisShared),
    markVisible: Boolean(nextConfig.markVisible),
    legendVisible: Boolean(nextConfig.legendVisible),
    isVisible: Boolean(nextConfig.isVisible),
    IsAbsolutely: Boolean(nextConfig.IsAbsolutely),
    valueVisible: Boolean(nextConfig.valueVisible),
    labelvisible: Boolean(nextConfig.labelvisible),
    circlejagge: Boolean(nextConfig.circlejagge),
    circlehollow: Boolean(nextConfig.circlehollow),
  };
}

export function buildDashboardGridConfig(mainSql: string, defaultQuery: string, overrides: Record<string, any> = {}) {
  return {
    mainSql,
    defaultQuery,
    addEnable: 1,
    createTableSql: '',
    deleteEnable: 1,
    tableName: '',
    sqlPrompt: '',
    sourceMode: 'sql',
    sourceModuleCode: '',
    sourceCondition: '',
    tableType: '普通表格',
    modifyEnable: 1,
    contextMenuEnabled: false,
    contextMenuItems: [],
    colorRulesEnabled: false,
    colorRules: [],
    chartConfig: buildDashboardDetailChartConfig(),
    detailBoard: buildDetailBoardConfig(),
    webUrl: '',
    ...overrides,
  };
}

export function buildDashboardDefaultLeftTableConfig() {
  return buildDashboardGridConfig('', '', {
    tableType: '树表格',
    contextMenuItems: [],
    colorRules: [],
    detailBoard: buildDetailBoardConfig([], { enabled: false }),
  });
}

export function buildDashboardDefaultMainTableConfig() {
  return buildDashboardGridConfig('', '', {
    contextMenuItems: [],
    colorRules: [],
    detailBoard: buildDetailBoardConfig([], {
      enabled: false,
      theme: 'aurora',
    }),
  });
}

export function buildDashboardDefaultBillDetailConfig() {
  return buildDashboardGridConfig('', '', {
    tableType: '普通表格',
    contextMenuEnabled: false,
    contextMenuItems: [],
    detailBoard: buildDetailBoardConfig([], { enabled: false }),
  });
}

export function buildDashboardDetailTabConfig(currentModuleCode: string, overrides: Record<string, any> = {}) {
  return {
    tab: currentModuleCode,
    tabKey: '',
    detailName: '',
    detailType: '表格',
    detailTypeCode: '0',
    dllTemplate: '',
    relatedModuleField: '',
    relatedValue: '',
    rightDisplay: false,
    addDisplay: false,
    defaultOpen: false,
    scanMode: false,
    cardMode: false,
    bandHeight: '36',
    bandWidth: '160',
    displayRows: 12,
    noColumnHeader: false,
    gridDetailCheck: false,
    unionFlag: 0,
    dragcond: '',
    isMrpDrag: false,
    mrpDragTag: '',
    privilegeOper: '',
    Fremark: '',
    relatedModule: '',
    relatedCondition: '',
    autoRefresh: true,
    disabled: false,
    disabledCondition: '',
    ...overrides,
  };
}
