export function MesPlatformPresenter() {
  return (
    <div className="space-y-5">
      <div className="rounded-[24px] border border-white/70 bg-white/72 p-6 shadow-[0_20px_42px_-30px_rgba(15,23,42,0.3)]">
        <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">Current state</div>
        <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">Business platform slot is reserved</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          This phase only lands platform registration, entry paths, and an independent login mode placeholder. When
          MES starts real delivery, we can build its fixed pages, shell layout, and resource permissions inside this
          platform boundary.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-white/70 bg-white/75 p-5">
          <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Independent shell</div>
          <p className="mt-3 text-sm leading-7 text-slate-600">MES stays outside the design studio shell and owns its own layout.</p>
        </div>
        <div className="rounded-3xl border border-white/70 bg-white/75 p-5">
          <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Independent login</div>
          <p className="mt-3 text-sm leading-7 text-slate-600">The auth core can stay shared while `/mes/login` gets a dedicated experience later.</p>
        </div>
      </div>
    </div>
  );
}
