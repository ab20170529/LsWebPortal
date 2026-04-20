import React from 'react';

type ModuleGuideOption = {
  configTable: string;
  configTableDesc: string;
  icon: string;
  intro: string;
  keyFields: string[];
  label: string;
  value: string;
};

type ModuleTypeSelectionStepProps = {
  businessType: string;
  menuConfigTableName: string;
  onBusinessTypeChange: (businessType: string) => void;
  options: ModuleGuideOption[];
};

export function ModuleTypeSelectionStep({
  businessType,
  menuConfigTableName,
  onBusinessTypeChange,
  options,
}: ModuleTypeSelectionStepProps) {
  return (
    <div className="flex flex-1 flex-col gap-8">
      <div className="rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_top_right,rgba(49,98,255,0.12),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,250,255,0.98))] p-8 shadow-[0_28px_80px_-48px_rgba(15,23,42,0.32)] dark:border-slate-700 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(15,23,42,0.98))]">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-[11px] font-bold tracking-[0.24em] text-primary">
            模块引导
          </div>
          <h3 className="text-[30px] font-black tracking-tight text-slate-900 dark:text-white">先选择本次要创建的模块类型</h3>
          <p className="text-[14px] leading-7 text-slate-500 dark:text-slate-300">
            这一步只决定后续模块主配置表。第二步菜单信息统一写入{' '}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[12px] text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {menuConfigTableName}
            </code>
            ，选中的类型会影响后续模块配置落到哪张主表。
          </p>
        </div>
      </div>

      <div className="grid flex-1 gap-6 lg:grid-cols-2">
        {options.map((option) => {
          const isActive = businessType === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onBusinessTypeChange(option.value)}
              className={`group relative overflow-hidden rounded-[28px] border p-7 text-left transition-all ${
                isActive
                  ? 'border-primary/35 bg-[linear-gradient(180deg,rgba(239,246,255,0.96),rgba(255,255,255,0.98))] shadow-[0_32px_70px_-42px_rgba(49,98,255,0.42)] dark:border-primary/40 dark:bg-[linear-gradient(180deg,rgba(30,41,59,0.98),rgba(15,23,42,1))]'
                  : 'border-slate-200 bg-white hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_30px_60px_-46px_rgba(15,23,42,0.3)] dark:border-slate-700 dark:bg-slate-900/80'
              }`}
            >
              <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-primary/8 blur-3xl transition-opacity group-hover:opacity-100" />
              <div className="relative z-10 flex h-full flex-col">
                <div className="flex items-start justify-between gap-4">
                  <div className={`flex size-14 items-center justify-center rounded-2xl border ${
                    isActive
                      ? 'border-primary/20 bg-primary text-white shadow-[0_18px_34px_-20px_rgba(49,98,255,0.46)]'
                      : 'border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}>
                    <span className="material-symbols-outlined text-[26px]">{option.icon}</span>
                  </div>
                  <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold ${
                    isActive
                      ? 'border-primary/20 bg-primary/10 text-primary'
                      : 'border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}>
                    <span className="material-symbols-outlined text-[15px]">{isActive ? 'check_circle' : 'radio_button_unchecked'}</span>
                    {isActive ? '当前选择' : '点击选择'}
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <h4 className="text-[24px] font-black tracking-tight text-slate-900 dark:text-white">{option.label}</h4>
                    <code className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {option.configTable}
                    </code>
                  </div>
                  <p className="text-[14px] leading-7 text-slate-500 dark:text-slate-300">{option.intro}</p>
                </div>

                <div className="mt-6 rounded-[22px] border border-slate-200/80 bg-white/82 p-5 dark:border-slate-700 dark:bg-slate-950/40">
                  <div className="text-[12px] font-bold tracking-[0.18em] text-slate-400">后续模块主表</div>
                  <div className="mt-2 text-[16px] font-bold text-slate-800 dark:text-slate-100">{option.configTableDesc}</div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {option.keyFields.map((field) => (
                      <span
                        key={`${option.value}-${field}`}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      >
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
