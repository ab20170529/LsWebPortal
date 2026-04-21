import { useEffect, useMemo, useState } from 'react';
import { Button } from '@lserp/ui';

import type { BiRuntimeModule, BiRuntimeScreen } from '../types';

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
  const fallbackSpan = module.moduleType === 'table' ? 2 : 1;
  return Math.max(1, Math.min(2, layoutSpan ?? fallbackSpan));
}

function getModuleMinHeight(module: BiRuntimeModule) {
  const rawHeight = module.layout?.height ?? module.style?.height;
  const numericHeight = toFiniteNumber(rawHeight);

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

function renderMetricModule(module: BiRuntimeModule) {
  return (
    <section className="bi-runtime-module bi-runtime-module--metric">
      <div className="bi-runtime-module-head">
        <span className="bi-runtime-module-tag">{module.moduleType}</span>
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
        <span className="bi-runtime-module-tag">{module.moduleType}</span>
        <span className="bi-runtime-module-code">{module.moduleCode}</span>
      </div>
      <div className="bi-runtime-module-title">{module.moduleName}</div>
      <p className="bi-runtime-module-text">{getModuleSummaryText(module)}</p>
    </section>
  );
}

function renderChartModule(module: BiRuntimeModule) {
  const rows = getModuleRows(module).slice(0, 6);
  const maxValue = rows.reduce((currentMax, row) => {
    const numericCandidate = Object.values(row).find((value) => typeof value === 'number');
    const numericValue = Number(numericCandidate ?? 0);
    return Number.isFinite(numericValue) ? Math.max(currentMax, numericValue) : currentMax;
  }, 0);

  return (
    <section className="bi-runtime-module">
      <div className="bi-runtime-module-head">
        <span className="bi-runtime-module-tag">{module.moduleType}</span>
        <span className="bi-runtime-module-code">{module.moduleCode}</span>
      </div>
      <div className="bi-runtime-module-title">{module.moduleName}</div>
      <div className="bi-runtime-chart-list">
        {rows.length === 0 ? (
          <div className="bi-runtime-empty-inline">暂无模块数据</div>
        ) : (
          rows.map((row, index) => {
            const values = Object.values(row);
            const label = String(values[0] ?? `Item ${index + 1}`);
            const numericValue = Number(
              values.find((value) => typeof value === 'number') ?? values[1] ?? 0,
            );
            const width = maxValue > 0
              ? Math.max(12, Math.round((numericValue / maxValue) * 100))
              : 12;

            return (
              <div key={`${module.moduleId}-${index}`} className="bi-runtime-chart-item">
                <div className="bi-runtime-chart-meta">
                  <span>{label}</span>
                  <span>{Number.isFinite(numericValue) ? numericValue : '--'}</span>
                </div>
                <div className="bi-runtime-chart-track">
                  <div className="bi-runtime-chart-bar" style={{ width: `${width}%` }} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function renderTableModule(module: BiRuntimeModule) {
  const rows = getModuleRows(module).slice(0, 8);

  return (
    <section className="bi-runtime-module">
      <div className="bi-runtime-module-head">
        <span className="bi-runtime-module-tag">{module.moduleType}</span>
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
          <span className="bi-runtime-module-tag">{module.moduleType}</span>
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
          <div className="bi-runtime-summary-label">Screen Summary</div>
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
