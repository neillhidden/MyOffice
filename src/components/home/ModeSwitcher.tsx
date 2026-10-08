import React from 'react';
import { House, Building2 } from 'lucide-react';
import { OfficeMode } from '../../types/home';

export function ModeSwitcher({
  mode,
  onChange,
  compact,
}: {
  mode: OfficeMode;
  onChange: (mode: OfficeMode) => void;
  compact: boolean;
}) {
  if (compact)
    return (
      <div className="px-1 py-3 shrink-0 border-t border-slate-200 dark:border-dm-border">
        <button
          id="mode-switch-compact"
          type="button"
          aria-label={mode === 'home' ? 'Ir para Business' : 'Ir para Home'}
          title={mode === 'home' ? 'Ir para Business' : 'Ir para Home'}
          onClick={() => onChange(mode === 'home' ? 'business' : 'home')}
          className="flex mx-auto h-11 w-11 items-center justify-center rounded-lg text-slate-600 dark:text-dm-text hover:bg-slate-100 dark:hover:bg-dm-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          {mode === 'home' ? (
            <Building2 className="h-5 w-5" aria-hidden="true" />
          ) : (
            <House className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </div>
    );
  return (
    <div className="px-3 py-3 shrink-0 border-t border-slate-200 dark:border-dm-border">
      <div
        role="group"
        aria-label="Modo do MyOffice"
        className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 dark:bg-dm-elevated p-1"
      >
        {(
          [
            { mode: 'home', title: 'Home', icon: House },
            { mode: 'business', title: 'Business', icon: Building2 },
          ] as const
        ).map(({ mode: choice, title, icon: Icon }) => (
          <button
            type="button"
            key={choice}
            id={`mode-btn-${choice}`}
            aria-pressed={mode === choice}
            onClick={() => onChange(choice)}
            className={`flex min-h-10 items-center justify-center gap-2 rounded-lg text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${mode === choice ? 'bg-white dark:bg-dm-surface text-slate-900 dark:text-dm-text shadow-xs' : 'text-slate-500 dark:text-dm-muted hover:text-slate-900 dark:hover:text-dm-text'}`}
          >
            <Icon className="w-3.5 h-3.5" aria-hidden="true" />
            {title}
          </button>
        ))}
      </div>
    </div>
  );
}
