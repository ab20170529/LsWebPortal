import React, { useEffect, useMemo, useState } from 'react';

import type { ServerOption } from '../types';

type OrganizationSelectorProps = {
  disabled?: boolean;
  helperText: string;
  isLoading: boolean;
  onChange: (organizationKey: string) => void;
  organizations: ServerOption[];
  selectedKey: string;
};

export function OrganizationSelector({
  disabled = false,
  helperText,
  isLoading,
  onChange,
  organizations,
  selectedKey,
}: OrganizationSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef(null as HTMLDivElement | null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, []);

  const selectedOrganization = useMemo(
    () => organizations.find((org) => org.companyKey === selectedKey) ?? null,
    [organizations, selectedKey],
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) {
      return;
    }

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        setIsOpen((open) => !open);
        break;
      case 'Escape':
        event.preventDefault();
        setIsOpen(false);
        break;
      case 'ArrowDown':
        if (!isOpen) {
          event.preventDefault();
          setIsOpen(true);
        }
        break;
      case 'ArrowUp':
        if (isOpen) {
          event.preventDefault();
          setIsOpen(false);
        }
        break;
      default:
        break;
    }
  };

  return (
    <div ref={containerRef} className="space-y-1.5">
      <label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-slate-400">
        登录账套
      </label>

      <div className="relative">
        <input name="organization" type="hidden" value={selectedKey} />

        <button
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          className="group relative w-full text-left outline-none disabled:cursor-not-allowed disabled:opacity-70"
          disabled={disabled || isLoading}
          onClick={() => {
            setIsOpen((open) => !open);
          }}
          onKeyDown={handleKeyDown}
          type="button"
        >
          <div className="pointer-events-none absolute inset-0 rounded-[22px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(255,255,255,0.62)_42%,rgba(224,242,254,0.74))] shadow-[inset_0_1px_0_rgba(255,255,255,0.98),0_22px_42px_-28px_rgba(14,116,144,0.8)] transition-all duration-300 group-hover:border-primary/30 group-hover:shadow-[inset_0_1px_0_rgba(255,255,255,1),0_24px_46px_-24px_rgba(14,116,144,0.9)] group-focus-visible:border-primary/40 group-focus-visible:shadow-[inset_0_1px_0_rgba(255,255,255,1),0_28px_52px_-22px_rgba(14,116,144,1)]" />
          <div className="pointer-events-none absolute inset-[1px] rounded-[21px] bg-white/35 backdrop-blur-2xl" />
          <div className="pointer-events-none absolute -right-6 top-1/2 h-16 w-16 -translate-y-1/2 rounded-full bg-cyan-200/60 opacity-70 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />

          <div className="relative flex h-12 items-center gap-3 px-4 pr-20">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/80 bg-white/70 text-primary shadow-[0_10px_24px_-18px_rgba(14,116,144,0.8)]">
              <span className="material-symbols-outlined text-[20px]">domain</span>
            </div>

            <div
              className={`min-w-0 flex-1 truncate text-[13px] font-semibold tracking-[0.01em] transition-colors ${
                selectedOrganization ? 'text-slate-900' : 'text-slate-500'
              }`}
            >
              {selectedOrganization?.title ?? (isLoading ? '正在加载账套...' : '请选择登录账套')}
            </div>
          </div>

          <div
            className={`pointer-events-none absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-2xl border border-white/80 bg-white/78 text-slate-500 shadow-[0_16px_30px_-22px_rgba(15,23,42,0.75)] transition-all duration-300 ${
              isOpen ? 'scale-105 border-primary/35 bg-cyan-50/90 text-primary' : ''
            }`}
          >
            <span
              className={`material-symbols-outlined text-[20px] transition-transform duration-300 ${
                isOpen ? 'rotate-180' : ''
              }`}
            >
              expand_more
            </span>
          </div>
        </button>

        {isOpen && organizations.length > 0 ? (
          <div className="absolute left-0 right-0 z-20 mt-3 overflow-hidden rounded-[24px] border border-white/70 bg-white/72 shadow-[0_28px_60px_-30px_rgba(15,23,42,0.5)] backdrop-blur-2xl">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.18),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.72),rgba(248,250,252,0.62))]" />

            <div className="relative p-2" role="listbox">
              {organizations.map((option) => {
                const isActive = option.companyKey === selectedKey;

                return (
                  <button
                    key={option.companyKey}
                    aria-selected={isActive}
                    className={`flex w-full items-center gap-3 rounded-[18px] px-3 py-3 text-left transition-all duration-200 ${
                      isActive
                        ? 'bg-[linear-gradient(135deg,rgba(224,242,254,0.95),rgba(255,255,255,0.92))] text-slate-900 shadow-[0_18px_28px_-24px_rgba(14,116,144,0.95)]'
                        : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'
                    }`}
                    onClick={() => {
                      onChange(option.companyKey);
                      setIsOpen(false);
                    }}
                    role="option"
                    type="button"
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-2xl border transition-all duration-200 ${
                        isActive
                          ? 'border-primary/20 bg-primary/10 text-primary'
                          : 'border-white/70 bg-white/55 text-slate-400'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {isActive ? 'check' : 'apartment'}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1 truncate text-[13px] font-semibold">
                      {option.title}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      <div className="ml-1 text-[11px] text-slate-400">{helperText}</div>
    </div>
  );
}
