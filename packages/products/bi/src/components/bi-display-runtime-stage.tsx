import type { BiRuntimeModule, BiRuntimeScreen } from '../types';

type BiDisplayRuntimeStageProps = {
  error: string | null;
  isLoading: boolean;
  screen: BiRuntimeScreen | null;
};

function getModuleRows(module: BiRuntimeModule) {
  return Array.isArray(module.rows) ? module.rows : [];
}

function getLeadingValue(module: BiRuntimeModule) {
  const firstRow = getModuleRows(module)[0] ?? {};
  const values = Object.values(firstRow);
  return values[0] ?? '--';
}

function renderMetricModule(module: BiRuntimeModule) {
  return (
    <section className="bi-display-stage-card bi-display-stage-card--metric">
      <div className="bi-display-stage-card-header">
        <span className="bi-display-stage-card-tag">{module.moduleType}</span>
        <span className="bi-display-stage-card-code">{module.moduleCode}</span>
      </div>
      <div className="bi-display-stage-card-title">{module.moduleName}</div>
      <div className="bi-display-stage-card-metric">{String(getLeadingValue(module))}</div>
    </section>
  );
}

function renderTextModule(module: BiRuntimeModule) {
  return (
    <section className="bi-display-stage-card">
      <div className="bi-display-stage-card-header">
        <span className="bi-display-stage-card-tag">{module.moduleType}</span>
        <span className="bi-display-stage-card-code">{module.moduleCode}</span>
      </div>
      <div className="bi-display-stage-card-title">{module.moduleName}</div>
      <p className="bi-display-stage-card-text">
        {String((module.style?.content as string | undefined) ?? getLeadingValue(module))}
      </p>
    </section>
  );
}

function renderChartModule(module: BiRuntimeModule) {
  const rows = getModuleRows(module).slice(0, 6);
  const maxValue = rows.reduce((maxValue, row) => {
    const numericValue = Object.values(row).find((value) => typeof value === 'number');
    const nextValue = Number(numericValue ?? 0);
    return Number.isFinite(nextValue) ? Math.max(maxValue, nextValue) : maxValue;
  }, 0);

  return (
    <section className="bi-display-stage-card">
      <div className="bi-display-stage-card-header">
        <span className="bi-display-stage-card-tag">{module.moduleType}</span>
        <span className="bi-display-stage-card-code">{module.moduleCode}</span>
      </div>
      <div className="bi-display-stage-card-title">{module.moduleName}</div>
      <div className="bi-display-stage-chart-list">
        {rows.length === 0 ? (
          <div className="bi-display-stage-empty-inline">暂无模块数据</div>
        ) : (
          rows.map((row, index) => {
            const values = Object.values(row);
            const label = String(values[0] ?? `Item ${index + 1}`);
            const numericValue = Number(values.find((value) => typeof value === 'number') ?? values[1] ?? 0);
            const width = maxValue > 0 ? Math.max(12, Math.round((numericValue / maxValue) * 100)) : 12;

            return (
              <div key={`${module.moduleId}-${index}`} className="bi-display-stage-chart-item">
                <div className="bi-display-stage-chart-meta">
                  <span>{label}</span>
                  <span>{Number.isFinite(numericValue) ? numericValue : '--'}</span>
                </div>
                <div className="bi-display-stage-chart-track">
                  <div className="bi-display-stage-chart-bar" style={{ width: `${width}%` }} />
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
    <section className="bi-display-stage-card bi-display-stage-card--wide">
      <div className="bi-display-stage-card-header">
        <span className="bi-display-stage-card-tag">{module.moduleType}</span>
        <span className="bi-display-stage-card-code">{module.moduleCode}</span>
      </div>
      <div className="bi-display-stage-card-title">{module.moduleName}</div>
      <div className="bi-display-stage-table-wrap">
        <table className="bi-display-stage-table">
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
                <td className="bi-display-stage-table-empty" colSpan={Math.max(module.columns.length, 1)}>
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
      <section className="bi-display-stage-card">
        <div className="bi-display-stage-card-header">
          <span className="bi-display-stage-card-tag">{module.moduleType}</span>
          <span className="bi-display-stage-card-code">{module.moduleCode}</span>
        </div>
        <div className="bi-display-stage-card-title">{module.moduleName}</div>
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

export function BiDisplayRuntimeStage({ error, isLoading, screen }: BiDisplayRuntimeStageProps) {
  if (isLoading) {
    return (
      <div className="bi-display-stage-shell">
        <div className="bi-display-stage-loading">
          <div className="bi-display-stage-loading-title">正在加载当前节点大屏</div>
          <div className="bi-display-stage-loading-text">同步 BI runtime 元数据、查询结果和模块内容。</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bi-display-stage-shell">
        <div className="bi-display-stage-loading">
          <div className="bi-display-stage-loading-title">当前节点尚未加载出展示大屏</div>
          <div className="bi-display-stage-error">{error}</div>
        </div>
      </div>
    );
  }

  if (!screen) {
    return (
      <div className="bi-display-stage-shell">
        <div className="bi-display-stage-loading">
          <div className="bi-display-stage-loading-title">请选择一个组织节点</div>
          <div className="bi-display-stage-loading-text">左侧或上方组织架构节点点击后，会在这里加载对应的大屏内容。</div>
        </div>
      </div>
    );
  }

  const externalTargetUrl = String(screen.externalConfig?.targetUrl ?? '');
  const externalOpenMode = String(screen.externalConfig?.openMode ?? 'iframe').toLowerCase();

  return (
    <div className="bi-display-stage-shell">
      <div className="bi-display-stage-topline">
        <div>
          <div className="bi-display-stage-title">
            {String(screen.pageSchema?.title ?? screen.screenName ?? screen.nodeName ?? screen.screenCode)}
          </div>
          <div className="bi-display-stage-subtitle">
            {String(screen.pageSchema?.prompt ?? screen.nodeName ?? screen.screenCode)}
          </div>
        </div>
        <div className="bi-display-stage-badges">
          <span className="bi-display-stage-badge">{screen.biType}</span>
          <span className="bi-display-stage-badge">{screen.publishStatus ?? 'PUBLISHED'}</span>
        </div>
      </div>

      {screen.biType === 'EXTERNAL' ? (
        externalOpenMode === 'blank' ? (
          <div className="bi-display-stage-loading">
            <div className="bi-display-stage-loading-title">当前节点使用外链 BI</div>
            <div className="bi-display-stage-loading-text">{externalTargetUrl || '未配置外链地址。'}</div>
          </div>
        ) : (
          <div className="bi-display-stage-frame-wrap">
            <iframe
              allowFullScreen
              className="bi-display-stage-frame"
              src={externalTargetUrl}
              title={screen.screenName}
            />
          </div>
        )
      ) : null}

      {screen.biType === 'INTERNAL' ? (
        <div className="bi-display-stage-grid">
          {screen.modules.map((module) => (
            <div
              key={module.moduleId}
              className={module.moduleType === 'table' ? 'bi-display-stage-grid-span-2' : undefined}
            >
              {renderModule(module)}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
