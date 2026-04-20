import React from 'react';
import {
  shadcnFieldClass,
  shadcnInfoCardClass,
  shadcnMutedLabelClass,
  shadcnSectionCardClass,
  shadcnSectionTitleClass,
} from '../../../components/ui/shadcn-inspector';

type DetailChartFieldOption = {
  label: string;
  value: string;
};

type DetailChartTypeOption = {
  label: string;
  value: string;
};

type DetailChartConfigSectionProps = {
  chartTypeOptions: DetailChartTypeOption[];
  currentDetailChartConfig: Record<string, any>;
  currentDetailTabName: string;
  datalistId: string;
  detailChartFieldOptions: DetailChartFieldOption[];
  onUpdateChartConfig: (patch: Record<string, any>) => void;
};

const primaryToggleFields = [
  { key: 'chart3D', label: '3D 模式' },
  { key: 'YAxisShared', label: 'Y轴共享' },
  { key: 'gridLineVisible', label: '显示网格线' },
  { key: 'IsAbsolutely', label: '绝对值轴' },
] as const;

const visibilityToggleFields = [
  { key: 'isVisible', label: '禁用图表' },
  { key: 'valueVisible', label: '禁显数字' },
  { key: 'markVisible', label: '标签禁显' },
  { key: 'legendVisible', label: '标题禁显' },
  { key: 'labelvisible', label: '禁显标签' },
  { key: 'circlejagge', label: '锯齿圆' },
  { key: 'circlehollow', label: '空心圆' },
] as const;

export const DetailChartConfigSection = React.memo(function DetailChartConfigSection({
  chartTypeOptions,
  currentDetailChartConfig,
  currentDetailTabName,
  datalistId,
  detailChartFieldOptions,
  onUpdateChartConfig,
}: DetailChartConfigSectionProps) {
  const primaryChartColor = /^#(?:[0-9a-f]{3}){1,2}$/i.test(currentDetailChartConfig.chartColor)
    ? currentDetailChartConfig.chartColor
    : '#2563eb';
  const secondaryChartColor = /^#(?:[0-9a-f]{3}){1,2}$/i.test(currentDetailChartConfig.chartColorDf)
    ? currentDetailChartConfig.chartColorDf
    : '#60a5fa';

  const renderToggleRow = (key: string, label: string) => (
    <label
      key={key}
      className="flex cursor-pointer items-center justify-between gap-3 rounded-[14px] border border-slate-200/80 bg-white/92 px-3.5 py-2.5 text-[12px] font-semibold text-slate-600 transition-colors hover:border-[color:var(--workspace-accent-border)] dark:border-slate-700 dark:bg-slate-950/72 dark:text-slate-200"
    >
      <span>{label}</span>
      <input
        type="checkbox"
        checked={Boolean(currentDetailChartConfig[key])}
        onChange={(event) => onUpdateChartConfig({ [key]: event.target.checked })}
        className="size-4"
        style={{ accentColor: 'var(--workspace-accent)' }}
      />
    </label>
  );

  return (
    <section className={`${shadcnSectionCardClass} space-y-4`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className={shadcnSectionTitleClass}>
          <span className="material-symbols-outlined text-[18px] text-[color:var(--workspace-accent)]">bar_chart</span>
          <h4>图表视图配置</h4>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-[color:var(--workspace-accent-border)] bg-[color:var(--workspace-accent-soft)] px-3 py-1 text-[11px] font-bold text-[color:var(--workspace-accent-strong)]">
            p_systemdlltabchart
          </span>
        </div>
      </div>

      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(140px,1fr))]">
        <div className={shadcnInfoCardClass}>
          <div className="text-[11px] font-bold tracking-[0.08em] text-slate-400">当前明细</div>
          <div className="mt-1 text-[13px] font-bold text-slate-700 dark:text-slate-100">{currentDetailTabName}</div>
        </div>
        <div className={shadcnInfoCardClass}>
          <div className="text-[11px] font-bold tracking-[0.08em] text-slate-400">图表类型</div>
          <div className="mt-1 text-[13px] font-bold text-slate-700 dark:text-slate-100">
            {chartTypeOptions.find((option) => option.value === String(currentDetailChartConfig.chartType))?.label ?? '未设置'}
          </div>
        </div>
        <div className={shadcnInfoCardClass}>
          <div className="text-[11px] font-bold tracking-[0.08em] text-slate-400">可选字段</div>
          <div className="mt-1 text-[13px] font-bold text-slate-700 dark:text-slate-100">{detailChartFieldOptions.length} 个</div>
        </div>
      </div>

      <section className="rounded-[18px] border border-slate-200/80 bg-slate-50/55 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.78)] dark:border-slate-700 dark:bg-slate-900/42">
        <div className="mb-3 text-[12px] font-semibold tracking-[0.04em] text-slate-500 dark:text-slate-300">基础定义</div>
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(210px,1fr))]">
          <div>
            <label className={shadcnMutedLabelClass}>图表标题</label>
            <input
              type="text"
              value={currentDetailChartConfig.chartTitle}
              onChange={(event) => onUpdateChartConfig({ chartTitle: event.target.value })}
              className={shadcnFieldClass}
            />
          </div>
          <div>
            <label className={shadcnMutedLabelClass}>图表类型</label>
            <select
              value={String(currentDetailChartConfig.chartType)}
              onChange={(event) => onUpdateChartConfig({ chartType: event.target.value })}
              className={shadcnFieldClass}
            >
              {chartTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(210px,1fr))]">
          <div>
            <label className={shadcnMutedLabelClass}>图表颜色</label>
            <div className="flex items-center gap-3 rounded-[16px] border border-slate-200/80 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950">
              <input
                type="color"
                value={primaryChartColor}
                onChange={(event) => onUpdateChartConfig({ chartColor: event.target.value })}
                className="h-9 w-12 cursor-pointer rounded-lg border border-slate-200 bg-transparent p-0 dark:border-slate-700"
              />
              <input
                type="text"
                value={currentDetailChartConfig.chartColor}
                onChange={(event) => onUpdateChartConfig({ chartColor: event.target.value })}
                placeholder="#2563eb"
                className="min-w-0 flex-1 bg-transparent text-[12px] font-medium text-slate-700 outline-none dark:text-slate-100"
              />
            </div>
          </div>
          <div>
            <label className={shadcnMutedLabelClass}>备用颜色</label>
            <div className="flex items-center gap-3 rounded-[16px] border border-slate-200/80 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950">
              <input
                type="color"
                value={secondaryChartColor}
                onChange={(event) => onUpdateChartConfig({ chartColorDf: event.target.value })}
                className="h-9 w-12 cursor-pointer rounded-lg border border-slate-200 bg-transparent p-0 dark:border-slate-700"
              />
              <input
                type="text"
                value={currentDetailChartConfig.chartColorDf}
                onChange={(event) => onUpdateChartConfig({ chartColorDf: event.target.value })}
                placeholder="#60a5fa"
                className="min-w-0 flex-1 bg-transparent text-[12px] font-medium text-slate-700 outline-none dark:text-slate-100"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[18px] border border-slate-200/80 bg-slate-50/55 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.78)] dark:border-slate-700 dark:bg-slate-900/42">
        <div className="mb-3 text-[12px] font-semibold tracking-[0.04em] text-slate-500 dark:text-slate-300">轴字段</div>
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(210px,1fr))]">
          <div>
            <label className={shadcnMutedLabelClass}>X轴字段</label>
            <input
              type="text"
              list={datalistId}
              value={currentDetailChartConfig.XLabelField}
              onChange={(event) => onUpdateChartConfig({ XLabelField: event.target.value })}
              placeholder="选择字段"
              className={shadcnFieldClass}
            />
          </div>
          <div>
            <label className={shadcnMutedLabelClass}>X轴标题</label>
            <input
              type="text"
              value={currentDetailChartConfig.XAxisTitle}
              onChange={(event) => onUpdateChartConfig({ XAxisTitle: event.target.value })}
              className={shadcnFieldClass}
            />
          </div>
          <div>
            <label className={shadcnMutedLabelClass}>Y轴字段</label>
            <input
              type="text"
              list={datalistId}
              value={currentDetailChartConfig.YValueField}
              onChange={(event) => onUpdateChartConfig({ YValueField: event.target.value })}
              placeholder="选择字段"
              className={shadcnFieldClass}
            />
          </div>
          <div>
            <label className={shadcnMutedLabelClass}>Y轴标题</label>
            <input
              type="text"
              value={currentDetailChartConfig.YAxisTitle}
              onChange={(event) => onUpdateChartConfig({ YAxisTitle: event.target.value })}
              className={shadcnFieldClass}
            />
          </div>
          <div>
            <label className={shadcnMutedLabelClass}>Y轴字段2</label>
            <input
              type="text"
              list={datalistId}
              value={currentDetailChartConfig.yvaluefield1}
              onChange={(event) => onUpdateChartConfig({ yvaluefield1: event.target.value })}
              className={shadcnFieldClass}
            />
          </div>
          <div>
            <label className={shadcnMutedLabelClass}>Y轴字段3</label>
            <input
              type="text"
              list={datalistId}
              value={currentDetailChartConfig.yvaluefield2}
              onChange={(event) => onUpdateChartConfig({ yvaluefield2: event.target.value })}
              className={shadcnFieldClass}
            />
          </div>
        </div>
      </section>

      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
        <section className="rounded-[18px] border border-slate-200/80 bg-slate-50/55 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.78)] dark:border-slate-700 dark:bg-slate-900/42">
          <div className="mb-3 text-[12px] font-semibold tracking-[0.04em] text-slate-500 dark:text-slate-300">图形表现</div>
          <div className="space-y-2.5">
            {primaryToggleFields.map((item) => renderToggleRow(item.key, item.label))}
          </div>
        </section>
        <section className="rounded-[18px] border border-slate-200/80 bg-slate-50/55 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.78)] dark:border-slate-700 dark:bg-slate-900/42">
          <div className="mb-3 text-[12px] font-semibold tracking-[0.04em] text-slate-500 dark:text-slate-300">显示控制</div>
          <div className="space-y-2.5">
            {visibilityToggleFields.map((item) => renderToggleRow(item.key, item.label))}
          </div>
        </section>
      </div>

      <section className="rounded-[18px] border border-slate-200/80 bg-slate-50/55 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.78)] dark:border-slate-700 dark:bg-slate-900/42">
        <div className="mb-3 text-[12px] font-semibold tracking-[0.04em] text-slate-500 dark:text-slate-300">标签与刻度</div>
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]">
          <div>
            <label className={shadcnMutedLabelClass}>序号</label>
            <input
              type="number"
              value={currentDetailChartConfig.orderId}
              onChange={(event) => onUpdateChartConfig({ orderId: Number(event.target.value || 0) })}
              className={shadcnFieldClass}
            />
          </div>
          <div>
            <label className={shadcnMutedLabelClass}>Y轴刻度</label>
            <input
              type="text"
              value={currentDetailChartConfig.YScale}
              onChange={(event) => onUpdateChartConfig({ YScale: event.target.value })}
              className={shadcnFieldClass}
            />
          </div>
          <div>
            <label className={shadcnMutedLabelClass}>标签角度</label>
            <input
              type="number"
              value={currentDetailChartConfig.labelangle}
              onChange={(event) => onUpdateChartConfig({ labelangle: event.target.value })}
              className={shadcnFieldClass}
            />
          </div>
          <div>
            <label className={shadcnMutedLabelClass}>标签字号</label>
            <input
              type="number"
              value={currentDetailChartConfig.labelsize}
              onChange={(event) => onUpdateChartConfig({ labelsize: event.target.value })}
              className={shadcnFieldClass}
            />
          </div>
          <div>
            <label className={shadcnMutedLabelClass}>标签间隔</label>
            <input
              type="number"
              value={currentDetailChartConfig.labelSpaced}
              onChange={(event) => onUpdateChartConfig({ labelSpaced: event.target.value })}
              className={shadcnFieldClass}
            />
          </div>
        </div>
      </section>

      <datalist id={datalistId}>
        {detailChartFieldOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </datalist>
    </section>
  );
});
