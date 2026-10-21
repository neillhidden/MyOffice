import { HomeNotifications } from './HomeNotifications';
import React from 'react';
import { Sun, Moon, ChevronRight, Menu } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { HomeSection } from '../../types/home';
export function HomeHeader({ section, onOpenMobileMenu }: { section: HomeSection; onOpenMobileMenu?: () => void }) {
  const { actualTheme, toggleTheme } = useTheme();
  return (
    <header className="h-14 shrink-0 bg-white dark:bg-dm-surface border-b border-slate-200/80 dark:border-dm-border px-4 sm:px-6 lg:px-8 flex items-center">
      <div className="w-full max-w-7xl mx-auto flex justify-between items-center gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            id="btn-mobile-menu"
            aria-label="Abrir menu"
            onClick={onOpenMobileMenu}
            className="md:hidden w-11 h-11 -ml-2 inline-flex items-center justify-center rounded-lg text-slate-600 dark:text-dm-text hover:bg-slate-100 dark:hover:bg-dm-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400 dark:focus-visible:ring-dm-border cursor-pointer shrink-0"
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
          </button>
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-xs sm:text-sm min-w-0 text-slate-500 dark:text-dm-muted"
          >
            <span>Home</span>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate font-medium text-slate-700 dark:text-dm-text">
              {section === 'Agenda' ? 'Calendário' : section}
            </span>
          </nav>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="hidden sm:block text-[11px] text-slate-500 dark:text-dm-muted">
            Finanças pessoais · Kz / USD
          </span>
          <HomeNotifications />
          <button
            type="button"
            id="btn-toggle-theme"
            aria-label="Alternar modo de tema"
            onClick={toggleTheme}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-dm-elevated"
          >
            {actualTheme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-500" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
