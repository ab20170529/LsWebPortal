type AppLoadingScreenProps = {
  description?: string;
  title?: string;
};

export function AppLoadingScreen({
  description = 'Preparing the selected platform entry and loading its workspace bundle.',
  title = 'Loading Platform',
}: AppLoadingScreenProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#eef5ff_0%,#f8fbff_44%,#f2f6fb_100%)] px-6">
      <div className="w-full max-w-xl rounded-[32px] border border-white/80 bg-white/84 p-8 shadow-[0_28px_72px_-44px_rgba(15,23,42,0.34)] backdrop-blur-2xl">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-white shadow-[0_18px_36px_-24px_rgba(37,99,235,0.7)]">
            <span className="material-symbols-outlined text-2xl">deployed_code</span>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">Platform bootstrap</div>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950">{title}</h1>
          </div>
        </div>

        <p className="mt-5 text-sm leading-7 text-slate-600">{description}</p>

        <div className="mt-6 flex items-center gap-3">
          <span className="inline-flex size-3 rounded-full bg-primary animate-pulse" />
          <span className="inline-flex size-3 rounded-full bg-sky-400 animate-pulse [animation-delay:120ms]" />
          <span className="inline-flex size-3 rounded-full bg-slate-300 animate-pulse [animation-delay:240ms]" />
        </div>
      </div>
    </div>
  );
}
