import React from 'react';
import { ArrowLeft, Sparkles, LucideIcon } from 'lucide-react';

export interface ComingSoonHighlight {
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface ComingSoonViewProps {
  id?: string;
  badge?: string;
  moduleName: string;
  title: string;
  description: string;
  icon: LucideIcon;
  highlights?: ComingSoonHighlight[];
  onBack: () => void;
  backLabel?: string;
}

export const ComingSoonView: React.FC<ComingSoonViewProps> = ({
  id = 'coming-soon-view',
  badge = 'Em breve',
  moduleName,
  title,
  description,
  icon: Icon,
  highlights = [],
  onBack,
  backLabel = 'Voltar para o Dashboard',
}) => {
  return (
    <div id={id} className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Top Breadcrumb & Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {moduleName}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              {badge}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-dm-muted mt-1">
            Esta funcionalidade está reservada e em fase de preparação no MyOffice.
          </p>
        </div>

        {/* Action de regresso rápida no topo */}
        <button
          type="button"
          onClick={onBack}
          id={`${id}-top-back-btn`}
          className="inline-flex min-h-[44px] items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-dm-border bg-white dark:bg-dm-surface text-slate-700 dark:text-dm-text hover:bg-slate-50 dark:hover:bg-dm-elevated transition-colors cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{backLabel}</span>
        </button>
      </div>

      {/* Main Feature Announcement Card */}
      <div className="bg-white dark:bg-dm-surface rounded-2xl border border-slate-200/80 dark:border-dm-border p-8 sm:p-12 text-center shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 flex items-center justify-center mx-auto mb-5 border border-purple-100 dark:border-purple-800/60">
          <Icon className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-dm-elevated text-slate-700 dark:text-dm-text text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          <span>Funcionalidade em Desenvolvimento</span>
        </div>

        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
          {title}
        </h2>
        <p className="text-xs text-slate-500 dark:text-dm-muted leading-relaxed max-w-lg mx-auto mb-6">
          {description}
        </p>

        {/* Action de Regresso Principal com 44px target */}
        <div className="mb-8">
          <button
            type="button"
            id={`${id}-main-back-btn`}
            onClick={onBack}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 dm-btn-primary transition-colors cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{backLabel}</span>
          </button>
        </div>

        {/* Feature Highlights Grid */}
        {highlights.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left pt-6 border-t border-slate-100 dark:border-dm-border">
            {highlights.map((h, i) => {
              const HighlightIcon = h.icon;
              return (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-slate-50/70 dark:bg-dm-elevated border border-slate-200/60 dark:border-dm-border"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center mb-2.5">
                    <HighlightIcon className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {h.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-dm-muted mt-1 leading-normal">
                    {h.description}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
