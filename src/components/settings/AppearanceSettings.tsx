import React from 'react';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useTheme, ThemeMode } from '../../context/ThemeContext';

interface ThemeOption {
  value: ThemeMode;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function AppearanceSettings() {
  const { theme, actualTheme, setTheme } = useTheme();

  const options: ThemeOption[] = [
    {
      value: 'light',
      label: 'Claro',
      description: 'Superfícies claras e contraste equilibrado para o dia a dia.',
      icon: Sun,
    },
    {
      value: 'dark',
      label: 'Anoitecer',
      description: 'Tons escuros de alto contraste que reduzem o cansaço visual.',
      icon: Moon,
    },
    {
      value: 'system',
      label: 'Seguir o dispositivo',
      description: 'Alterna automaticamente com base nas definições do sistema.',
      icon: Monitor,
    },
  ];

  return (
    <section className="rounded-xl border border-slate-200 dark:border-dm-border bg-white dark:bg-dm-surface p-5 sm:p-6 space-y-5">
      <div>
        <h2 className="text-base font-semibold text-slate-900 dark:text-dm-text">
          Aparência e Iluminação
        </h2>
        <p className="text-xs text-slate-500 dark:text-dm-muted mt-1 leading-relaxed">
          Escolhe o tema visual para os modos Home e Business. A preferência é memorizada neste navegador.
        </p>
      </div>

      <div
        role="radiogroup"
        aria-label="Tema visual"
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {options.map(({ value, label, description, icon: Icon }) => {
          const isSelected = theme === value;

          return (
            <button
              key={value}
              id={`settings-theme-${value}`}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setTheme(value)}
              className={`flex flex-col items-center text-left rounded-xl p-3.5 transition-all cursor-pointer relative ${
                isSelected
                  ? 'border-2 border-indigo-600 dark:border-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-xs'
                  : 'border border-slate-200 dark:border-dm-border bg-slate-50/40 dark:bg-dm-elevated/40 hover:bg-slate-100/60 dark:hover:bg-dm-elevated hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              {/* Badge indicadora de seleção no topo direito */}
              <div className="absolute top-2.5 right-2.5">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-2xs'
                      : 'border border-slate-300 dark:border-slate-600 bg-white dark:bg-dm-surface'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>

              {/* Pré-visualização miniatura (~160 × 96 px) */}
              <div className="w-full max-w-[180px] h-[96px] rounded-lg overflow-hidden border border-slate-200/90 dark:border-slate-700/80 shadow-2xs mb-3.5 select-none shrink-0">
                {value === 'light' ? (
                  // Mock Claro
                  <div className="w-full h-full flex bg-[#f8fafc]">
                    {/* Sidebar */}
                    <div className="w-1/4 h-full bg-white border-r border-slate-200 p-1.5 flex flex-col gap-1.5 shrink-0">
                      <div className="w-3.5 h-3.5 bg-slate-900 rounded shrink-0" />
                      <div className="w-full h-1 bg-slate-200 rounded" />
                      <div className="w-3/4 h-1 bg-slate-200 rounded" />
                      <div className="w-4/5 h-1 bg-slate-200 rounded" />
                    </div>
                    {/* Content */}
                    <div className="flex-1 flex flex-col h-full overflow-hidden">
                      {/* Header */}
                      <div className="h-4 bg-white border-b border-slate-200 flex items-center justify-between px-2 shrink-0">
                        <div className="w-10 h-1.5 bg-slate-100 rounded" />
                        <div className="w-2.5 h-2.5 bg-slate-200 rounded-full" />
                      </div>
                      {/* Main */}
                      <div className="flex-1 p-2 space-y-1.5 bg-[#f8fafc]">
                        <div className="flex gap-1.5">
                          <div className="flex-1 h-5 bg-white border border-slate-200/80 rounded p-1">
                            <div className="w-3/5 h-1 bg-slate-300 rounded mb-0.5" />
                            <div className="w-4/5 h-1 bg-indigo-500 rounded" />
                          </div>
                          <div className="flex-1 h-5 bg-white border border-slate-200/80 rounded p-1">
                            <div className="w-3/5 h-1 bg-slate-300 rounded mb-0.5" />
                            <div className="w-2/3 h-1 bg-emerald-500 rounded" />
                          </div>
                        </div>
                        <div className="h-9 bg-white border border-slate-200/80 rounded p-1.5 space-y-1">
                          <div className="w-full h-1 bg-slate-200 rounded" />
                          <div className="w-4/5 h-1 bg-slate-100 rounded" />
                          <div className="w-2/3 h-1 bg-slate-100 rounded" />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : value === 'dark' ? (
                  // Mock Anoitecer
                  <div className="w-full h-full flex bg-[#030712]">
                    {/* Sidebar */}
                    <div className="w-1/4 h-full bg-[#0b0f19] border-r border-slate-800 p-1.5 flex flex-col gap-1.5 shrink-0">
                      <div className="w-3.5 h-3.5 bg-white rounded shrink-0" />
                      <div className="w-full h-1 bg-slate-700 rounded" />
                      <div className="w-3/4 h-1 bg-slate-700 rounded" />
                      <div className="w-4/5 h-1 bg-slate-700 rounded" />
                    </div>
                    {/* Content */}
                    <div className="flex-1 flex flex-col h-full overflow-hidden">
                      {/* Header */}
                      <div className="h-4 bg-[#111827] border-b border-slate-800 flex items-center justify-between px-2 shrink-0">
                        <div className="w-10 h-1.5 bg-slate-800 rounded" />
                        <div className="w-2.5 h-2.5 bg-slate-700 rounded-full" />
                      </div>
                      {/* Main */}
                      <div className="flex-1 p-2 space-y-1.5 bg-[#030712]">
                        <div className="flex gap-1.5">
                          <div className="flex-1 h-5 bg-[#111827] border border-slate-800 rounded p-1">
                            <div className="w-3/5 h-1 bg-slate-600 rounded mb-0.5" />
                            <div className="w-4/5 h-1 bg-indigo-400 rounded" />
                          </div>
                          <div className="flex-1 h-5 bg-[#111827] border border-slate-800 rounded p-1">
                            <div className="w-3/5 h-1 bg-slate-600 rounded mb-0.5" />
                            <div className="w-2/3 h-1 bg-emerald-400 rounded" />
                          </div>
                        </div>
                        <div className="h-9 bg-[#111827] border border-slate-800 rounded p-1.5 space-y-1">
                          <div className="w-full h-1 bg-slate-700 rounded" />
                          <div className="w-4/5 h-1 bg-slate-800 rounded" />
                          <div className="w-2/3 h-1 bg-slate-800 rounded" />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Mock Seguir o Dispositivo (Split Metade Claro / Metade Anoitecer)
                  <div className="w-full h-full flex relative overflow-hidden">
                    {/* Metade Esquerda: Claro */}
                    <div className="w-1/2 h-full flex bg-[#f8fafc] border-r border-slate-300 dark:border-slate-700">
                      <div className="w-2/5 h-full bg-white border-r border-slate-200 p-1 flex flex-col gap-1 shrink-0">
                        <div className="w-2.5 h-2.5 bg-slate-900 rounded shrink-0" />
                        <div className="w-full h-1 bg-slate-200 rounded" />
                        <div className="w-3/4 h-1 bg-slate-200 rounded" />
                      </div>
                      <div className="flex-1 p-1.5 space-y-1 bg-[#f8fafc]">
                        <div className="h-5 bg-white border border-slate-200 rounded p-0.5">
                          <div className="w-3/4 h-1 bg-indigo-500 rounded" />
                        </div>
                        <div className="h-9 bg-white border border-slate-200 rounded p-1 space-y-0.5">
                          <div className="w-full h-1 bg-slate-200 rounded" />
                          <div className="w-2/3 h-1 bg-slate-100 rounded" />
                        </div>
                      </div>
                    </div>
                    {/* Metade Direita: Anoitecer */}
                    <div className="w-1/2 h-full flex bg-[#030712]">
                      <div className="flex-1 p-1.5 space-y-1 bg-[#030712]">
                        <div className="h-5 bg-[#111827] border border-slate-800 rounded p-0.5">
                          <div className="w-3/4 h-1 bg-indigo-400 rounded" />
                        </div>
                        <div className="h-9 bg-[#111827] border border-slate-800 rounded p-1 space-y-0.5">
                          <div className="w-full h-1 bg-slate-700 rounded" />
                          <div className="w-2/3 h-1 bg-slate-800 rounded" />
                        </div>
                      </div>
                    </div>
                    {/* Split line badge */}
                    <div className="absolute inset-x-0 bottom-1 flex justify-center pointer-events-none">
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-slate-900/80 text-white font-mono shadow-xs backdrop-blur-xs">
                        Auto ({actualTheme === 'dark' ? 'Noite' : 'Dia'})
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Informação do Tema */}
              <div className="w-full">
                <div className="flex items-center gap-2 mb-1">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isSelected
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-500 dark:text-dm-muted'
                    }`}
                  />
                  <span
                    className={`text-sm font-semibold ${
                      isSelected
                        ? 'text-indigo-950 dark:text-white'
                        : 'text-slate-800 dark:text-dm-text'
                    }`}
                  >
                    {label}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-dm-muted leading-relaxed">
                  {description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
