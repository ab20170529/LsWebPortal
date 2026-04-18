import { Card } from '@lserp/ui';

import type { BiRuntimeModule } from '../types';

type BiRuntimeModuleCardProps = {
  module: BiRuntimeModule;
};

function renderSimpleChart(module: BiRuntimeModule) {
  const firstRow = module.rows[0] ?? null;
  if (!firstRow) {
    return <div className="theme-text-muted text-sm">暂无数据</div>;
  }

  const entries = module.rows.slice(0, 6).map((row, index) => {
    const values = Object.values(row);
    const label = String(values[0] ?? `Item ${index + 1}`);
    const numericValue = Number(values.find((value) => typeof value === 'number') ?? values[1] ?? 0);
    const width = Number.isFinite(numericValue) ? Math.max(8, Math.min(100, numericValue)) : 20;

    return (
      <div key={`${module.moduleId}-${index}`} className="space-y-2">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="theme-text-strong font-semibold">{label}</span>
          <span className="theme-text-muted">{Number.isFinite(numericValue) ? numericValue : '--'}</span>
        </div>
        <div className="h-2 rounded-full bg-[color:color-mix(in_srgb,var(--portal-color-surface-muted)_88%,white)]">
          <div
            className="h-2 rounded-full"
            style={{
              width: `${width}%`,
              background:
                'linear-gradient(90deg, var(--portal-color-brand-500), color-mix(in srgb, var(--portal-color-brand-700) 82%, white))',
            }}
          />
        </div>
      </div>
    );
  });

  return <div className="space-y-4">{entries}</div>;
}

export function BiRuntimeModuleCard({ module }: BiRuntimeModuleCardProps) {
  const firstRow = module.rows[0] ?? {};
  const firstValue = Object.values(firstRow)[0];

  return (
    <Card className="rounded-[28px] p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="theme-text-soft text-xs font-bold uppercase tracking-[0.24em]">
            {module.moduleType}
          </div>
          <div className="theme-text-strong mt-2 text-xl font-black tracking-tight">
            {module.moduleName}
          </div>
        </div>
      </div>

      <div className="mt-5">
        {module.error ? (
          <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {module.error}
          </div>
        ) : null}

        {!module.error && module.moduleType === 'text' ? (
          <div className="theme-text-muted text-sm leading-7">
            {String((module.style?.content as string | undefined) ?? firstValue ?? '文本模块')}
          </div>
        ) : null}

        {!module.error && module.moduleType === 'stat-card' ? (
          <div className="space-y-2">
            <div className="theme-text-soft text-xs font-bold uppercase tracking-[0.2em]">
              {String((module.style?.metricLabel as string | undefined) ?? 'Metric')}
            </div>
            <div className="theme-text-strong text-4xl font-black tracking-tight">
              {String(firstValue ?? '--')}
            </div>
          </div>
        ) : null}

        {!module.error && ['line-chart', 'bar-chart', 'pie-chart'].includes(module.moduleType) ? (
          renderSimpleChart(module)
        ) : null}

        {!module.error && module.moduleType === 'table' ? (
          <div className="overflow-auto">
            <table className="min-w-full border-separate border-spacing-y-2 text-sm">
              <thead>
                <tr>
                  {module.columns.map((column) => (
                    <th
                      key={column}
                      className="theme-text-soft px-3 py-2 text-left text-xs font-bold uppercase tracking-[0.16em]"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {module.rows.slice(0, 10).map((row, index) => (
                  <tr
                    key={`${module.moduleId}-${index}`}
                    className="rounded-[18px]"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--portal-color-surface-panel) 84%, white)',
                    }}
                  >
                    {module.columns.map((column) => (
                      <td key={column} className="theme-text-strong px-3 py-3">
                        {String(row[column] ?? '--')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
