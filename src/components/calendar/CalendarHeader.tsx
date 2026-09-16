import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List as ListIcon,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { CalendarViewMode, CalendarDisplayType } from '../../types/calendar';

interface CalendarHeaderProps {
  currentDate: Date;
  viewMode: CalendarViewMode;
  displayType: CalendarDisplayType;
  onChangeDate: (newDate: Date) => void;
  onToday: () => void;
  onChangeViewMode: (mode: CalendarViewMode) => void;
  onChangeDisplayType: (type: CalendarDisplayType) => void;
  onOpenCreateEvent: () => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  viewMode,
  displayType,
  onChangeDate,
  onToday,
  onChangeViewMode,
  onChangeDisplayType,
  onOpenCreateEvent,
}) => {
  // Format period title based on viewMode
  const periodTitle = React.useMemo(() => {
    const monthsPt = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    if (viewMode === 'ano') {
      return `Ano ${year}`;
    }

    if (viewMode === 'mes') {
      return `${monthsPt[month]} de ${year}`;
    }

    // semana
    const day = currentDate.getDate();
    const dayOfWeek = currentDate.getDay(); // 0 is Sunday
    const startOfWeek = new Date(currentDate);
    // start on Monday (if Sunday, go back 6 days, else 1 - dayOfWeek)
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startOfWeek.setDate(day + diffToMonday);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const startMonth = monthsPt[startOfWeek.getMonth()].slice(0, 3);
    const endMonth = monthsPt[endOfWeek.getMonth()].slice(0, 3);

    if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
      return `${startOfWeek.getDate()} - ${endOfWeek.getDate()} de ${monthsPt[startOfWeek.getMonth()]} de ${year}`;
    } else {
      return `${startOfWeek.getDate()} ${startMonth} - ${endOfWeek.getDate()} ${endMonth} de ${year}`;
    }
  }, [currentDate, viewMode]);

  // Navigate back/forward
  const handlePrev = () => {
    const next = new Date(currentDate);
    if (viewMode === 'ano') {
      next.setFullYear(next.getFullYear() - 1);
    } else if (viewMode === 'mes') {
      next.setMonth(next.getMonth() - 1);
    } else {
      next.setDate(next.getDate() - 7);
    }
    onChangeDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewMode === 'ano') {
      next.setFullYear(next.getFullYear() + 1);
    } else if (viewMode === 'mes') {
      next.setMonth(next.getMonth() + 1);
    } else {
      next.setDate(next.getDate() + 7);
    }
    onChangeDate(next);
  };

  return (
    <div
      id="calendar-header-toolbar"
      className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
      {/* Left: Module Title & Period Navigation */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200">
            <CalendarIcon className="w-4 h-4 text-slate-700 dark:text-slate-200" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
              Calendário
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-none mt-0.5">
              Gestão de compromissos e agendas integradas
            </p>
          </div>
        </div>

        {/* Temporal Navigation Controls */}
        <div className="flex items-center gap-1.5 pl-0 sm:pl-4 sm:border-l sm:border-slate-200 dark:sm:border-slate-800">
          <button
            id="calendar-today-btn"
            onClick={onToday}
            className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 rounded-md transition-colors"
          >
            Hoje
          </button>

          <div className="flex items-center gap-0.5">
            <button
              id="calendar-prev-btn"
              onClick={handlePrev}
              title="Período anterior"
              className="p-1 rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              id="calendar-next-btn"
              onClick={handleNext}
              title="Próximo período"
              className="p-1 rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <span
            id="calendar-period-label"
            className="text-sm font-medium text-slate-800 dark:text-slate-200 ml-1.5 select-none"
          >
            {periodTitle}
          </span>
        </div>
      </div>

      {/* Right: Granularity Segmented Control, Grid/List Switcher & Add Button */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Segmented Control: Semana / Mês / Ano */}
        <div
          id="calendar-view-mode-selector"
          className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200/60 dark:border-slate-700/60"
        >
          {(
            [
              { id: 'semana', label: 'Semana' },
              { id: 'mes', label: 'Mês' },
              { id: 'ano', label: 'Ano' },
            ] as const
          ).map((item) => {
            const isActive = viewMode === item.id;
            return (
              <button
                key={item.id}
                id={`calendar-view-${item.id}`}
                onClick={() => onChangeViewMode(item.id)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Grid vs List View Mode Toggle */}
        <div
          id="calendar-display-type-selector"
          className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200/60 dark:border-slate-700/60"
        >
          <button
            id="calendar-display-grid"
            onClick={() => onChangeDisplayType('grade')}
            title="Vista em Grelha"
            className={`p-1.5 rounded-md transition-all ${
              displayType === 'grade'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            id="calendar-display-list"
            onClick={() => onChangeDisplayType('lista')}
            title="Vista em Tabela / Lista"
            className={`p-1.5 rounded-md transition-all ${
              displayType === 'lista'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ListIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* User Directive: Botão 'Adicionar' (sem ícone '+') */}
        <button
          id="calendar-add-event-btn"
          onClick={onOpenCreateEvent}
          className="px-3.5 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-xs font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-xs"
        >
          Adicionar
        </button>
      </div>
    </div>
  );
};
