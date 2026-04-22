export const shadcnPanelShellClass =
  'flex h-full min-h-0 flex-col overflow-hidden border-l border-slate-200/60 bg-slate-50/30 shadow-[-4px_0_24px_-12px_rgba(0,0,0,0.05)] dark:border-slate-800 dark:bg-slate-950';

export const shadcnInspectorSurfaceToneClass =
  'border-slate-200/60 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80';

export const shadcnPanelHeaderClass =
  `shrink-0 border-b px-4 py-3.5 ${shadcnInspectorSurfaceToneClass}`;

export const shadcnPanelHeaderMainClass = 'flex min-w-0 flex-1 items-center gap-3';

export const shadcnPanelBodyClass =
  'flex min-h-0 flex-1 w-full flex-col overflow-y-auto bg-white/80 px-0 py-0 backdrop-blur-md dark:bg-slate-900/80';

export const shadcnPanelSectionsClass = 'flex min-h-0 flex-1 w-full flex-col';

export const shadcnPanelTitleClass =
  'text-[14px] font-bold leading-6 text-slate-800 break-words tracking-tight dark:text-slate-100';

export const shadcnPanelBadgeClass =
  'inline-flex items-center rounded-full border border-slate-200/60 bg-slate-100/50 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400';

export const shadcnPanelIconShellClass =
  'flex size-9 shrink-0 items-center justify-center rounded-xl border border-slate-200/60 bg-white text-[color:var(--workspace-accent)] shadow-sm dark:border-slate-700 dark:bg-slate-800';

export const shadcnInfoCardClass =
  'rounded-xl border border-slate-200/60 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900';

export const shadcnSectionCardClass =
  'rounded-xl border border-slate-200/60 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900';

export const shadcnSectionTitleClass =
  'mb-3.5 flex items-center gap-2 text-[13px] font-bold text-slate-800 dark:text-slate-100';

export const shadcnInspectorCardClass =
  `w-full rounded-xl border p-4 ${shadcnInspectorSurfaceToneClass}`;

export const shadcnInspectorInfoCardClass =
  `rounded-xl border p-3 ${shadcnInspectorSurfaceToneClass}`;

export const shadcnInspectorSectionClass =
  'w-full bg-white/80 px-4 py-4 backdrop-blur-md dark:bg-slate-900/80';

export const shadcnInspectorSectionHeaderClass = 'mb-3 flex items-center justify-between gap-3';

export const shadcnInspectorSectionTitleClass =
  'flex min-w-0 items-center gap-2 text-[13px] font-bold text-slate-800 dark:text-slate-100';

export const shadcnInspectorSectionDescriptionClass =
  'mt-1 text-[11px] font-normal leading-5 text-slate-500 dark:text-slate-300';

export const shadcnInspectorActionButtonClass =
  'inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white px-3 text-[11px] font-semibold text-slate-600 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100';

export const shadcnInspectorPrimaryActionButtonClass =
  'inline-flex h-8 items-center gap-1.5 rounded-lg bg-[color:var(--workspace-accent)] px-3 text-[11px] font-semibold text-white shadow-sm transition-colors hover:bg-[color:var(--workspace-accent-strong)]';

export const shadcnInspectorDangerActionButtonClass =
  'inline-flex h-8 items-center gap-1.5 rounded-lg border border-rose-200/80 bg-rose-50/90 px-3 text-[11px] font-semibold text-rose-600 shadow-sm transition-colors hover:border-rose-300 hover:bg-rose-100 hover:text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/20';

export const shadcnInspectorListClass = 'space-y-2';

export const getShadcnInspectorListItemClass = (active = false) =>
  active
    ? 'group flex w-full items-center justify-between rounded-[14px] border border-[color:var(--workspace-accent-border)]/70 bg-[color:var(--workspace-accent-soft)]/35 px-3.5 py-2.5 text-left text-slate-800 shadow-[inset_2px_0_0_0_var(--workspace-accent)] transition-all dark:border-slate-700 dark:bg-slate-800/88 dark:text-slate-100'
    : 'group flex w-full items-center justify-between rounded-[14px] border border-slate-200/70 bg-white/82 px-3.5 py-2.5 text-left text-slate-600 shadow-[0_1px_0_rgba(15,23,42,0.03)] transition-all hover:border-slate-300 hover:bg-white hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900/65 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:bg-slate-800/72 dark:hover:text-slate-200';

export const getShadcnInspectorListBadgeClass = (active = false) =>
  active
    ? 'rounded-full border border-[color:var(--workspace-accent-border)]/70 bg-white/90 px-2.5 py-0.5 text-[11px] font-bold text-[color:var(--workspace-accent-strong)] transition-colors dark:border-slate-700 dark:bg-slate-900 dark:text-indigo-300'
    : 'rounded-full border border-slate-200/70 bg-slate-100/88 px-2.5 py-0.5 text-[11px] font-bold text-slate-500 transition-colors group-hover:border-slate-300 group-hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400';

export const shadcnMutedLabelClass =
  'mb-1.5 block text-[11px] font-semibold text-slate-500 dark:text-slate-400';

export const shadcnFieldClass =
  'flex h-9 w-full rounded-lg border border-slate-200/80 bg-slate-50/50 px-3 text-[12px] text-slate-700 transition-all placeholder:text-slate-400 hover:border-slate-300 focus-visible:border-[color:var(--workspace-accent)] focus-visible:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--workspace-accent-soft)] disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-200 dark:placeholder:text-slate-500 dark:hover:border-slate-600 dark:focus-visible:bg-slate-950';

export const shadcnTextareaClass =
  'flex min-h-[80px] w-full rounded-lg border border-slate-200/80 bg-slate-50/50 px-3 py-2.5 text-[12px] leading-relaxed text-slate-700 transition-all placeholder:text-slate-400 hover:border-slate-300 focus-visible:border-[color:var(--workspace-accent)] focus-visible:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--workspace-accent-soft)] disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-200 dark:placeholder:text-slate-500 dark:hover:border-slate-600 dark:focus-visible:bg-slate-950';

export const shadcnTabListClass =
  'mt-3 flex w-full items-center gap-1 rounded-xl border border-slate-200/60 bg-slate-100/50 p-1 dark:border-slate-800 dark:bg-slate-900/50';

export const getShadcnTabTriggerClass = (active: boolean) =>
  active
    ? 'relative flex min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200/60 bg-white px-3 py-1.5 text-[12px] font-bold text-[color:var(--workspace-accent)] shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-[color:var(--workspace-accent-soft)]'
    : 'relative flex min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-[12px] font-semibold text-slate-500 transition-colors hover:bg-slate-200/50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-300';
