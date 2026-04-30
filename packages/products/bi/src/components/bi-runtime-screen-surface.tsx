import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@lserp/ui';
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';

import type { BiRuntimeModule, BiRuntimeScreen } from '../types';

echarts.use([BarChart, LineChart, PieChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer]);

type BiRuntimeScreenSurfaceProps = {
  screen: BiRuntimeScreen;
};

function toFiniteNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : null;
  }

  return null;
}

function getModuleRows(module: BiRuntimeModule) {
  return Array.isArray(module.rows) ? module.rows : [];
}

function getModuleLeadingValue(module: BiRuntimeModule) {
  const firstRow = getModuleRows(module)[0] ?? {};
  const values = Object.values(firstRow);
  return values[0] ?? '--';
}

function getModuleSpan(module: BiRuntimeModule) {
  const layoutSpan = toFiniteNumber(module.layout?.colSpan) ?? toFiniteNumber(module.layout?.span);
  const gridWidth = toFiniteNumber(module.layout?.w);
  if (gridWidth) {
    return gridWidth >= 8 ? 2 : 1;
  }
  const fallbackSpan = module.moduleType === 'table' ? 2 : 1;
  return Math.max(1, Math.min(2, layoutSpan ?? fallbackSpan));
}

function getModuleMinHeight(module: BiRuntimeModule) {
  const rawHeight = module.layout?.height ?? module.style?.height;
  const numericHeight = toFiniteNumber(rawHeight);
  const gridHeight = toFiniteNumber(module.layout?.h);

  if (gridHeight) {
    return `${Math.max(150, gridHeight * 56)}px`;
  }

  if (numericHeight) {
    return `${Math.max(160, numericHeight)}px`;
  }

  if (typeof rawHeight === 'string' && rawHeight.trim()) {
    return rawHeight;
  }

  if (module.moduleType === 'table') {
    return '320px';
  }

  if (module.moduleType === 'stat-card') {
    return '220px';
  }

  return '240px';
}

function getModuleSummaryText(module: BiRuntimeModule) {
  const content = module.style?.content;
  return typeof content === 'string' && content.trim() ? content : String(getModuleLeadingValue(module));
}

function getModuleTagLabel(moduleType: BiRuntimeModule['moduleType']) {
  switch (moduleType) {
    case 'stat-card':
      return '指标卡';
    case 'text':
      return '说明';
    case 'table':
      return '数据表';
    case 'line-chart':
      return '趋势图';
    case 'bar-chart':
      return '柱状图';
    case 'pie-chart':
      return '占比图';
    default:
      return '模块';
  }
}

function getStringStyleValue(module: BiRuntimeModule, key: string) {
  const value = module.style?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function resolveChartFields(module: BiRuntimeModule) {
  const firstRow = getModuleRows(module)[0] ?? {};
  const keys = module.columns.length > 0 ? module.columns : Object.keys(firstRow);
  const preferredLabelKey = getStringStyleValue(module, 'xField');
  const preferredValueKey = getStringStyleValue(module, 'yField');
  const labelKey = keys.find((key) => key === preferredLabelKey)
    ?? keys.find((key) => key === 'category_value')
    ?? keys[0]
    ?? '';
  const valueKey = keys.find((key) => key === preferredValueKey)
    ?? keys.find((key) => key === 'total_count')
    ?? keys.find((key) => key !== labelKey && Number.isFinite(Number(firstRow[key])))
    ?? keys[1]
    ?? labelKey;

  return { labelKey, valueKey };
}

function BiRuntimeEchartsModule({ module }: { module: BiRuntimeModule }) {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const rows = useMemo(() => getModuleRows(module).slice(0, 12), [module]);

  useEffect(() => {
    if (!chartRef.current) {
      return undefined;
    }

    const chart = echarts.init(chartRef.current);
    const { labelKey, valueKey } = resolveChartFields(module);
    const categories = rows.map((row, index) => String(row[labelKey] ?? `项目 ${index + 1}`));
    const values = rows.map((row) => {
      const numericValue = Number(row[valueKey]);
      return Number.isFinite(numericValue) ? numericValue : 0;
    });
    const chartType = module.moduleType === 'line-chart'
      ? 'line'
      : module.moduleType === 'pie-chart'
        ? 'pie'
        : 'bar';
    const option = chartType === 'pie'
      ? {
          color: ['#00f0ff', '#38bdf8', '#22d3ee', '#60a5fa', '#818cf8', '#2dd4bf'],
          legend: {
            bottom: 0,
            icon: 'circle',
            textStyle: { color: '#94a3b8' },
          },
          series: [
            {
              type: 'pie',
              radius: ['42%', '72%'],
              center: ['50%', '43%'],
              data: categories.map((name, index) => ({ name, value: values[index] ?? 0 })),
              label: { color: '#cbd5e1' },
              itemStyle: {
                borderColor: 'rgba(3, 7, 18, 0.92)',
                borderWidth: 2,
              },
            },
          ],
          tooltip: { trigger: 'item' },
        }
      : {
          color: ['#00f0ff'],
          grid: { bottom: 46, containLabel: true, left: 18, right: 18, top: 24 },
          series: [
            {
              type: chartType,
              data: values,
              smooth: chartType === 'line',
              barMaxWidth: 36,
              areaStyle: chartType === 'line'
                ? {
                    opacity: 0.18,
                    color: 'rgba(0, 240, 255, 0.12)',
                  }
                : undefined,
              lineStyle: chartType === 'line'
                ? {
                    width: 3,
                    color: '#00f0ff',
                  }
                : undefined,
              itemStyle: chartType === 'bar'
                ? {
                    borderRadius: [6, 6, 0, 0],
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                      { offset: 0, color: '#36f3ff' },
                      { offset: 1, color: '#1d4ed8' },
                    ]),
                  }
                : undefined,
            },
          ],
          tooltip: { trigger: 'axis' },
          xAxis: {
            type: 'category',
            data: categories,
            axisLabel: {
              color: '#7dd3fc',
              interval: 0,
              overflow: 'truncate',
              width: 88,
              rotate: categories.length > 6 ? 20 : 0,
              margin: 14,
            },
            axisLine: { lineStyle: { color: 'rgba(34, 211, 238, 0.24)' } },
            axisTick: { show: false },
          },
          yAxis: {
            type: 'value',
            axisLabel: { color: '#94a3b8' },
            splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.14)' } },
          },
        };

    chart.setOption(option);

    const resizeObserver = new ResizeObserver(() => chart.resize());
    resizeObserver.observe(chartRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.dispose();
    };
  }, [module, rows]);

  return (
    <div className="bi-runtime-chart-canvas-wrap">
      {rows.length === 0 ? (
        <div className="bi-runtime-empty-inline">暂无模块数据</div>
      ) : (
        <div ref={chartRef} className="bi-runtime-chart-canvas" />
      )}
    </div>
  );
}

function renderMetricModule(module: BiRuntimeModule) {
  return (
    <section className="bi-runtime-module bi-runtime-module--metric">
      <div className="bi-runtime-module-head">
        <span className="bi-runtime-module-tag">{getModuleTagLabel(module.moduleType)}</span>
        <span className="bi-runtime-module-code">{module.moduleCode}</span>
      </div>
      <div className="bi-runtime-module-title">{module.moduleName}</div>
      <div className="bi-runtime-module-metric">{String(getModuleLeadingValue(module))}</div>
    </section>
  );
}

function renderTextModule(module: BiRuntimeModule) {
  return (
    <section className="bi-runtime-module">
      <div className="bi-runtime-module-head">
        <span className="bi-runtime-module-tag">{getModuleTagLabel(module.moduleType)}</span>
        <span className="bi-runtime-module-code">{module.moduleCode}</span>
      </div>
      <div className="bi-runtime-module-title">{module.moduleName}</div>
      <p className="bi-runtime-module-text">{getModuleSummaryText(module)}</p>
    </section>
  );
}

function renderChartModule(module: BiRuntimeModule) {
  return (
    <section className="bi-runtime-module">
      <div className="bi-runtime-module-head">
        <span className="bi-runtime-module-tag">{getModuleTagLabel(module.moduleType)}</span>
        <span className="bi-runtime-module-code">{module.moduleCode}</span>
      </div>
      <div className="bi-runtime-module-title">{module.moduleName}</div>
      <BiRuntimeEchartsModule module={module} />
    </section>
  );
}

function renderTableModule(module: BiRuntimeModule) {
  const rows = getModuleRows(module).slice(0, 8);

  return (
    <section className="bi-runtime-module">
      <div className="bi-runtime-module-head">
        <span className="bi-runtime-module-tag">{getModuleTagLabel(module.moduleType)}</span>
        <span className="bi-runtime-module-code">{module.moduleCode}</span>
      </div>
      <div className="bi-runtime-module-title">{module.moduleName}</div>
      <div className="bi-runtime-table-wrap">
        <table className="bi-runtime-table">
          <thead>
            <tr>
              {module.columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="bi-runtime-table-empty" colSpan={Math.max(module.columns.length, 1)}>
                  暂无模块数据
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={`${module.moduleId}-${index}`}>
                  {module.columns.map((column) => (
                    <td key={column}>{String(row[column] ?? '--')}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function renderModule(module: BiRuntimeModule) {
  if (module.error) {
    return (
      <section className="bi-runtime-module">
        <div className="bi-runtime-module-head">
          <span className="bi-runtime-module-tag">{getModuleTagLabel(module.moduleType)}</span>
          <span className="bi-runtime-module-code">{module.moduleCode}</span>
        </div>
        <div className="bi-runtime-module-title">{module.moduleName}</div>
        <div className="bi-display-stage-error">{module.error}</div>
      </section>
    );
  }

  if (module.moduleType === 'stat-card') {
    return renderMetricModule(module);
  }

  if (module.moduleType === 'text') {
    return renderTextModule(module);
  }

  if (module.moduleType === 'table') {
    return renderTableModule(module);
  }

  return renderChartModule(module);
}

export function BiRuntimeScreenSurface({ screen }: BiRuntimeScreenSurfaceProps) {
  const [didBlockPopup, setDidBlockPopup] = useState(false);
  const lastOpenedUrlState = useMemo(() => ({ current: null as string | null }), []);
  const externalTargetUrl = String(screen.externalConfig?.targetUrl ?? '').trim();
  const externalOpenMode = String(screen.externalConfig?.openMode ?? 'iframe').toLowerCase();
  const summaryText = typeof screen.pageSchema?.summary === 'string' ? screen.pageSchema.summary.trim() : '';

  useEffect(() => {
    if (screen.biType !== 'EXTERNAL' || externalOpenMode !== 'blank' || !externalTargetUrl) {
      return;
    }

    if (lastOpenedUrlState.current === `${screen.screenCode}:${externalTargetUrl}`) {
      return;
    }

    lastOpenedUrlState.current = `${screen.screenCode}:${externalTargetUrl}`;
    const openedWindow = window.open(externalTargetUrl, '_blank', 'noopener,noreferrer');
    setDidBlockPopup(!openedWindow);
  }, [externalOpenMode, externalTargetUrl, lastOpenedUrlState, screen.biType, screen.screenCode]);

  if (screen.biType === 'EXTERNAL') {
    if (externalOpenMode === 'blank') {
      return (
        <div className="bi-runtime-surface">
          <div className="bi-runtime-external-state">
            <div className="bi-runtime-external-title">当前节点使用外链 BI 展示</div>
            <div className="bi-runtime-external-text">
              {didBlockPopup ? '浏览器阻止了自动打开，请点击下方按钮重新打开。' : '已按新窗口方式打开外链大屏。'}
            </div>
            <div className="bi-runtime-external-url">{externalTargetUrl || '未配置外链地址。'}</div>
            {externalTargetUrl ? (
              <div className="bi-runtime-external-actions">
                <Button
                  onClick={() => {
                    const openedWindow = window.open(externalTargetUrl, '_blank', 'noopener,noreferrer');
                    setDidBlockPopup(!openedWindow);
                  }}
                >
                  重新打开外链
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      );
    }

    return (
      <div className="bi-runtime-surface">
        <div className="bi-runtime-frame-wrap">
          <iframe
            allowFullScreen
            className="bi-runtime-frame"
            src={externalTargetUrl}
            title={screen.screenName}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bi-runtime-surface">
      {summaryText ? (
        <div className="bi-runtime-summary">
          <div className="bi-runtime-summary-label">数据摘要</div>
          <div className="bi-runtime-summary-text">{summaryText}</div>
        </div>
      ) : null}

      {screen.modules.length === 0 ? (
        <div className="bi-runtime-empty-state">当前节点已绑定 BI 档案，但还没有可渲染的模块。</div>
      ) : (
        <div className="bi-runtime-grid">
          {screen.modules.map((module) => (
            <div
              key={module.moduleId}
              className={`bi-runtime-grid-item ${getModuleSpan(module) === 2 ? 'is-span-2' : ''}`}
              style={{ minHeight: getModuleMinHeight(module) }}
            >
              {renderModule(module)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
