import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  return (
    <section className="rounded-xl border border-slate-200 dark:border-dm-border bg-white dark:bg-dm-surface p-5 space-y-4">
      <div>
        <h2 className="text-sm font-semibold">Aparência</h2>
        <p className="text-xs text-slate-500 dark:text-dm-muted mt-1">
          Escolhe a iluminação para Home e Business. A preferência fica guardada
          neste navegador.
        </p>
      </div>
      <div
        role="group"
        aria-label="Tema visual"
        className="grid grid-cols-1 sm:grid-cols-3 gap-3"
      >
        {(
          [
            { value: 'light', label: 'Claro', icon: Sun },
            { value: 'dark', label: 'Anoitecer', icon: Moon },
            { value: 'system', label: 'Seguir o dispositivo', icon: Monitor },
          ] as const
        ).map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            id={`settings-theme-${value}`}
            type="button"
            aria-pressed={theme === value}
            onClick={() => setTheme(value)}
            className={`min-h-16 rounded-lg border flex items-center justify-center gap-2 text-sm focus-visible:ring-2 focus-visible:ring-indigo-400 ${theme === value ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300' : 'border-slate-200 dark:border-dm-border hover:bg-slate-50 dark:hover:bg-dm-elevated'}`}
          >
            <Icon className="h-5 w-5" />
            {label}
          </button>
        ))}
      </div>
    </section>
  );
}
