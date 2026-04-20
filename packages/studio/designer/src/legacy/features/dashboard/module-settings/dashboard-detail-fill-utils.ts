import { getRecordFieldValue, toRecordText } from './dashboard-field-type-utils';

export type DetailFillTypeOption = {
  backendValue?: string;
  description: string;
  icon: string;
  label: string;
  value: string;
};

export type DetailChartTypeOption = {
  label: string;
  value: string;
};

export const DETAIL_FILL_TYPE_OPTIONS: DetailFillTypeOption[] = [
  { value: '表格', label: '表格', icon: 'table_rows', description: '适合字段型明细维护', backendValue: '0' },
  { value: '树表格', label: '树表格', icon: 'account_tree', description: '适合层级型明细展示' },
  { value: '图表', label: '图表', icon: 'bar_chart', description: '适合统计型结果呈现', backendValue: '1' },
  { value: '网页', label: '网页', icon: 'language', description: '适合外部页面嵌入', backendValue: '2' },
];

export const DETAIL_CHART_TYPE_OPTIONS: DetailChartTypeOption[] = [
  { value: '0', label: '柱形图' },
  { value: '1', label: '折线图' },
  { value: '2', label: '圆饼图' },
  { value: '3', label: '条形图' },
  { value: '4', label: '面积图' },
];

export function getDetailFillTypeMeta(fillType?: string) {
  return DETAIL_FILL_TYPE_OPTIONS.find((option) => option.value === fillType) ?? DETAIL_FILL_TYPE_OPTIONS[0];
}

export function getDetailFillTypeBackendValue(fillType?: string) {
  return String(getDetailFillTypeMeta(fillType).backendValue || '0');
}

export function getDetailFillTypePlaceholderMeta(fillType?: string) {
  switch (getDetailFillTypeMeta(fillType).value) {
    case '树表格':
      return { label: '树表格', actionLabel: '配置树表格' };
    case '图表':
      return { label: '图表', actionLabel: '配置图表' };
    case '网页':
      return { label: '网页', actionLabel: '配置网页' };
    default:
      return { label: '表格', actionLabel: '配置明细表格' };
  }
}

export function getDetailFillTypeBadgeMeta(fillType?: string) {
  switch (getDetailFillTypeMeta(fillType).value) {
    case '树表格':
      return { icon: 'account_tree', label: '树表格视图' };
    case '图表':
      return { icon: 'monitoring', label: '图表视图' };
    case '网页':
      return { icon: 'language', label: '网页视图' };
    default:
      return { icon: 'table_view', label: '表格视图' };
  }
}

export function isAbsoluteHttpUrl(value: string) {
  return /^https?:\/\//i.test(String(value || '').trim());
}

export function joinHttpUrl(baseUrl: string, nextPath: string) {
  const normalizedBaseUrl = String(baseUrl || '').trim().replace(/\/+$/, '');
  const normalizedPath = String(nextPath || '').trim().replace(/^\/+/, '');

  if (!normalizedBaseUrl) {
    return normalizedPath ? `/${normalizedPath}` : '';
  }

  if (!normalizedPath) {
    return normalizedBaseUrl;
  }

  return `${normalizedBaseUrl}/${normalizedPath}`;
}

export function resolveSingleTableDetailFillType(detail: Record<string, unknown>) {
  const directType = toRecordText(
    getRecordFieldValue(detail, 'detailtype', 'detailType', 'displaymode', 'displayMode', 'tabletype', 'tableType'),
  );

  if (DETAIL_FILL_TYPE_OPTIONS.some((option) => option.value === directType)) {
    return directType;
  }

  if (/(tree|树)/i.test(directType)) {
    return '树表格';
  }

  if (/(chart|图)/i.test(directType)) {
    return '图表';
  }

  if (/(web|page|url|网页)/i.test(directType)) {
    return '网页';
  }

  switch (directType) {
    case '0':
      return '表格';
    case '1':
      return '图表';
    case '2':
    case '3':
      return '网页';
    default:
      return '表格';
  }
}
