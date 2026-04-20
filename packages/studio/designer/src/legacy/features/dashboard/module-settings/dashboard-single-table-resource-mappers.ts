import type {
  SingleTableColorRuleDto,
  SingleTableContextMenuDto,
  SingleTableDetailChartDto,
  SingleTableDetailDto,
} from '../../../lib/backend-module-config';
import { normalizeContextMenuItem } from './context-menu-utils';
import {
  buildDashboardDetailTabConfig,
  buildDashboardGridColorRule,
  buildDashboardGridConfig,
  normalizeDashboardDetailChartConfig,
} from './dashboard-single-table-grid-config-builders';
import {
  getRecordFieldValue,
  toRecordBoolean,
  toRecordNumber,
  toRecordText,
} from './dashboard-field-type-utils';
import {
  getDetailFillTypeBackendValue,
  resolveSingleTableDetailFillType,
} from './dashboard-detail-fill-utils';

export function mapSingleTableContextMenuItem(item: SingleTableContextMenuDto, index: number) {
  return normalizeContextMenuItem({
    ...item,
    id: getRecordFieldValue(item, 'id'),
    backendId: getRecordFieldValue(item, 'id'),
    tab: getRecordFieldValue(item, 'tab'),
    menuname: getRecordFieldValue(item, 'menuname', 'menuName'),
    dllname: getRecordFieldValue(item, 'dllname', 'dllName'),
    action: getRecordFieldValue(item, 'action', 'actionSql'),
    actiontype: getRecordFieldValue(item, 'actiontype', 'actionType'),
    orderid: getRecordFieldValue(item, 'orderid', 'orderId'),
    menuid: getRecordFieldValue(item, 'menuid', 'menuId'),
    menuCond: getRecordFieldValue(item, 'menucond', 'menuCondition'),
    beforeMsg: getRecordFieldValue(item, 'beforemsg', 'beforeMessage'),
    menuType: getRecordFieldValue(item, 'menutype', 'menuType'),
  }, index + 1);
}

export function mapSingleTableColorRule(rule: SingleTableColorRuleDto, index: number) {
  const orderId = toRecordNumber(getRecordFieldValue(rule, 'orderid', 'orderId'), index + 1);
  const conditionSql = toRecordText(getRecordFieldValue(rule, 'conditionsql', 'conditionSql', 'condition'));
  const foregroundToken = toRecordText(getRecordFieldValue(rule, 'foregroundtoken', 'foregroundToken', 'dfcolor'));
  const backgroundToken = toRecordText(getRecordFieldValue(rule, 'backgroundtoken', 'backgroundToken', 'dbcolor'));
  const foregroundColor = toRecordText(getRecordFieldValue(rule, 'foregroundcolor', 'foregroundColor', 'forcecolor'));
  const backgroundColor = toRecordText(getRecordFieldValue(rule, 'backgroundcolor', 'backgroundColor', 'backcolor'));
  const useFlag = toRecordBoolean(getRecordFieldValue(rule, 'useflag', 'useFlag'), true);
  const label = conditionSql || `颜色规则 ${orderId}`;

  return buildDashboardGridColorRule(orderId, {
    ...rule,
    id: getRecordFieldValue(rule, 'id') ?? `color_${Date.now()}_${orderId}`,
    orderId,
    tab: toRecordText(getRecordFieldValue(rule, 'tab')),
    label,
    condition: conditionSql,
    disabled: !useFlag,
    useflag: useFlag ? 1 : 0,
    forcecolor: foregroundColor || foregroundToken || '#9f1239',
    backcolor: backgroundColor || backgroundToken || '#ffe4e6',
    dfcolor: foregroundToken || foregroundColor || '#9f1239',
    dbcolor: backgroundToken || backgroundColor || '#ffe4e6',
    useFlag,
    foregroundToken,
    backgroundToken,
    foregroundColor,
    textColor: foregroundColor || foregroundToken || '#9f1239',
    backgroundColor: backgroundColor || backgroundToken || '#ffe4e6',
    isBold: toRecordBoolean(getRecordFieldValue(rule, 'ifbold', 'ifBold', 'isbold', 'isBold'), false),
    isItalic: toRecordBoolean(getRecordFieldValue(rule, 'ifitalic', 'ifItalic', 'isitalic', 'isItalic'), false),
    isStrikeOut: toRecordBoolean(getRecordFieldValue(rule, 'ifstrickout', 'ifStrickOut', 'isstrikeout', 'isStrikeOut'), false),
    isUnderline: toRecordBoolean(getRecordFieldValue(rule, 'ifunderline', 'ifUnderLine', 'isunderline', 'isUnderline'), false),
    ifBold: toRecordBoolean(getRecordFieldValue(rule, 'ifbold', 'ifBold', 'isbold', 'isBold'), false) ? 1 : 0,
    ifItalic: toRecordBoolean(getRecordFieldValue(rule, 'ifitalic', 'ifItalic', 'isitalic', 'isItalic'), false) ? 1 : 0,
    ifStrickOut: toRecordBoolean(getRecordFieldValue(rule, 'ifstrickout', 'ifStrickOut', 'isstrikeout', 'isStrikeOut'), false) ? 1 : 0,
    ifUnderLine: toRecordBoolean(getRecordFieldValue(rule, 'ifunderline', 'ifUnderLine', 'isunderline', 'isUnderline'), false) ? 1 : 0,
    fontsize: toRecordNumber(getRecordFieldValue(rule, 'fontsize', 'fontSize'), 12),
  });
}

export function mapSingleTableDetailChartConfig(chart: SingleTableDetailChartDto) {
  return normalizeDashboardDetailChartConfig({
    ...chart,
    id: getRecordFieldValue(chart, 'id'),
    orderId: toRecordNumber(getRecordFieldValue(chart, 'orderid', 'orderId'), 0),
    chartType: toRecordText(getRecordFieldValue(chart, 'charttype', 'chartType')) || '0',
    chartTitle: toRecordText(getRecordFieldValue(chart, 'charttitle', 'chartTitle')),
    chartColor: toRecordText(getRecordFieldValue(chart, 'chartcolor', 'chartColor')) || '#2563eb',
    chartColorDf: toRecordText(getRecordFieldValue(chart, 'chartcolordf', 'chartColorDf', 'chartColorDF')) || '#60a5fa',
    chart3D: toRecordBoolean(getRecordFieldValue(chart, 'chart3d', 'chart3D'), false),
    gridLineVisible: toRecordBoolean(getRecordFieldValue(chart, 'gridlinevisible', 'gridLineVisible'), true),
    XLabelField: toRecordText(getRecordFieldValue(chart, 'xlabelfield', 'XLabelField')),
    YValueField: toRecordText(getRecordFieldValue(chart, 'yvaluefield', 'YValueField')),
    XAxisTitle: toRecordText(getRecordFieldValue(chart, 'xaxistitle', 'XAxisTitle')),
    YAxisTitle: toRecordText(getRecordFieldValue(chart, 'yaxistitle', 'YAxisTitle')),
    YAxisShared: toRecordBoolean(getRecordFieldValue(chart, 'yaxisshared', 'YAxisShared'), false),
    markVisible: toRecordBoolean(getRecordFieldValue(chart, 'markvisible', 'markVisible'), false),
    legendVisible: toRecordBoolean(getRecordFieldValue(chart, 'legendvisible', 'legendVisible'), false),
    isVisible: toRecordBoolean(getRecordFieldValue(chart, 'isvisible', 'isVisible'), false),
    IsAbsolutely: toRecordBoolean(getRecordFieldValue(chart, 'isabsolutely', 'IsAbsolutely'), false),
    YScale: toRecordText(getRecordFieldValue(chart, 'yscale', 'YScale')),
    yvaluefield1: toRecordText(getRecordFieldValue(chart, 'yvaluefield1')),
    yvaluefield2: toRecordText(getRecordFieldValue(chart, 'yvaluefield2')),
    valueVisible: toRecordBoolean(getRecordFieldValue(chart, 'valuevisible', 'valueVisible'), false),
    labelangle: toRecordText(getRecordFieldValue(chart, 'labelangle')),
    labelvisible: toRecordBoolean(getRecordFieldValue(chart, 'labelvisible'), false),
    labelsize: toRecordText(getRecordFieldValue(chart, 'labelsize')),
    labelSpaced: toRecordText(getRecordFieldValue(chart, 'labelspaced', 'labelSpaced')),
    circlejagge: toRecordBoolean(getRecordFieldValue(chart, 'circlejagge'), false),
    circlehollow: toRecordBoolean(getRecordFieldValue(chart, 'circlehollow'), false),
  });
}

export function mapSingleTableDetailRecord(detail: SingleTableDetailDto, index: number, currentModuleCode: string) {
  const backendId = getRecordFieldValue(detail, 'id');
  const backendFormKey = toRecordText(getRecordFieldValue(detail, 'formkey', 'formKey'));
  const backendTabKey = toRecordText(getRecordFieldValue(detail, 'tabkey', 'tabKey'));
  const configuredTabCode = toRecordText(getRecordFieldValue(detail, 'tab'));
  const relatedModuleCode = toRecordText(getRecordFieldValue(detail, 'unionmodule', 'UnionModule', 'relatedmodule', 'relatedModule'));
  const detailName = toRecordText(getRecordFieldValue(detail, 'detailname', 'detailName')) || `明细 ${index + 1}`;
  const fillType = resolveSingleTableDetailFillType(detail);
  const detailTabId = backendId == null
    ? (backendFormKey || `detail_${Date.now()}_${index + 1}`)
    : `detail_${backendId}`;
  const relatedCondition = toRecordText(
    getRecordFieldValue(detail, 'unioncond', 'unionCond', 'relatedcondition', 'relatedCondition'),
  );
  const detailSql = toRecordText(getRecordFieldValue(detail, 'detailsql', 'detailSQL', 'detailSql'));
  const tableType = fillType === '树表格' ? '树表格' : '普通表格';

  return {
    tab: {
      id: detailTabId,
      name: detailName,
    },
    fillType,
    config: buildDashboardDetailTabConfig(currentModuleCode, {
      ...detail,
      id: detailTabId,
      backendId,
      formKey: backendFormKey,
      tab: configuredTabCode || currentModuleCode,
      tabKey: backendTabKey || backendFormKey || detailTabId,
      detailName,
      detailType: fillType,
      detailTypeCode: getDetailFillTypeBackendValue(fillType),
      dllTemplate: toRecordText(getRecordFieldValue(detail, 'library', 'dlltemplate', 'dllTemplate')),
      relatedModule: relatedModuleCode,
      relatedModuleField: toRecordText(
        getRecordFieldValue(detail, 'unionparentfield', 'unionParentField', 'relatedmodulefield', 'relatedModuleField'),
      ),
      relatedValue: toRecordText(getRecordFieldValue(detail, 'unionvalue', 'unionValue', 'relatedvalue', 'relatedValue')),
      rightDisplay: toRecordBoolean(
        getRecordFieldValue(detail, 'rightvisible', 'rightVisible', 'rightdisplay', 'rightDisplay'),
        false,
      ),
      addDisplay: toRecordBoolean(getRecordFieldValue(detail, 'addvisible', 'addVisible', 'adddisplay', 'addDisplay'), false),
      defaultOpen: toRecordBoolean(getRecordFieldValue(detail, 'defaultitem', 'defaultItem', 'defaultopen', 'defaultOpen'), false),
      scanMode: toRecordBoolean(getRecordFieldValue(detail, 'scanmode', 'scanMode'), false),
      cardMode: toRecordBoolean(getRecordFieldValue(detail, 'menumode', 'menuMode', 'cardmode', 'cardMode'), false),
      bandHeight: toRecordText(getRecordFieldValue(detail, 'bandheight', 'bandHeight')) || '36',
      bandWidth: toRecordText(getRecordFieldValue(detail, 'bandwidth', 'bandWidth')) || '160',
      displayRows: toRecordNumber(getRecordFieldValue(detail, 'displayrows', 'displayRows'), 12),
      noColumnHeader: toRecordBoolean(getRecordFieldValue(detail, 'nocolumnheader', 'noColumnHeader'), false),
      gridDetailCheck: toRecordBoolean(getRecordFieldValue(detail, 'griddetailcheck', 'gridDetailCheck'), false),
      unionFlag: toRecordNumber(getRecordFieldValue(detail, 'unionflag', 'unionFlag'), 0),
      dragcond: toRecordText(getRecordFieldValue(detail, 'dragcond')),
      isMrpDrag: toRecordBoolean(getRecordFieldValue(detail, 'ismrpdrag', 'isMrpDrag'), false),
      mrpDragTag: toRecordText(getRecordFieldValue(detail, 'mrpdragtag', 'mrpDragTag')),
      privilegeOper: toRecordText(getRecordFieldValue(detail, 'privilegeoper', 'privilegeOper', 'operusers', 'operUsers')),
      Fremark: toRecordText(getRecordFieldValue(detail, 'fremark', 'Fremark')),
      relatedCondition,
      autoRefresh: toRecordBoolean(getRecordFieldValue(detail, 'autorefresh', 'autoRefresh'), true),
      disabled: toRecordBoolean(getRecordFieldValue(detail, 'isvisible', 'isVisible', 'disabled'), false),
      disabledCondition: toRecordText(
        getRecordFieldValue(detail, 'visiblecond', 'visibleCond', 'disabledcondition', 'disabledCondition'),
      ),
    }),
    gridConfig: buildDashboardGridConfig(detailSql, relatedCondition, {
      sourceMode: relatedModuleCode ? 'module' : 'sql',
      sourceModuleCode: relatedModuleCode,
      sourceCondition: relatedCondition,
      tableType,
    }),
  };
}
