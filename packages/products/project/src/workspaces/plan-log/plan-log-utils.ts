import type { PlanLogPlan, PlanLogReport } from './plan-log-types';

export function formatDateTime(value?: string | null) {
  if (!value) {
    return '--';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('zh-CN', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function formatPlanType(planType?: string | null) {
  const normalized = (planType ?? '').trim().toUpperCase();
  if (normalized.includes('MONTH')) {
    return '月计划';
  }
  if (normalized.includes('WEEK')) {
    return '周计划';
  }
  if (normalized.includes('DAY')) {
    return '日计划';
  }
  return planType ?? '计划';
}

export function formatReportType(reportType?: string | null) {
  const normalized = (reportType ?? '').trim().toUpperCase();
  if (normalized.includes('MONTH')) {
    return '月总结';
  }
  if (normalized.includes('WEEK')) {
    return '周总结';
  }
  if (normalized.includes('DAY')) {
    return '日志';
  }
  return reportType ?? '汇报';
}

export function groupPlans(plans: PlanLogPlan[]) {
  return {
    day: plans.filter((item) => formatPlanType(item.planType) === '日计划'),
    month: plans.filter((item) => formatPlanType(item.planType) === '月计划'),
    week: plans.filter((item) => formatPlanType(item.planType) === '周计划'),
  };
}

export function groupReports(reports: PlanLogReport[]) {
  return {
    day: reports.filter((item) => formatReportType(item.reportType) === '日志'),
    month: reports.filter((item) => formatReportType(item.reportType) === '月总结'),
    week: reports.filter((item) => formatReportType(item.reportType) === '周总结'),
  };
}
