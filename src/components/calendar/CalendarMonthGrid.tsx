import React from 'react';
import { Check, Clock, Plus, Users, Truck } from 'lucide-react';
import { Agenda, CalendarEvent } from '../../types/calendar';

interface CalendarMonthGridProps {
  currentDate: Date;
  events: CalendarEvent[];
  agendas: Agenda[];
  onSelectEvent: (event: CalendarEvent) => void;
  onToggleEventStatus: (eventId: string, e: React.MouseEvent) => void;
  onSelectDate: (dateStr: string) => void;
}

export const CalendarMonthGrid: React.FC<CalendarMonthGridProps> = ({
  currentDate,
  events,
  agendas,
  onSelectEvent,
  onToggleEventStatus,
  onSelectDate,
}) => {
  // Map agendas by id for quick lookup
  const agendaMap = React.useMemo(() => {
    const map = new Map<string, Agenda>();
    agendas.forEach((a) => map.set(a.id, a));
    return map;
  }, [agendas]);

  // Group events by date (YYYY-MM-DD)
  const eventsByDate = React.useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((ev) => {
      const list = map.get(ev.date) || [];
      list.push(ev);
      map.set(ev.date, list);
    });
    return map;
  }, [events]);

  // Today string (fixed to 2026-09-13 or client today)
  const todayStr = '2026-09-13';

  // Build grid calendar days
  const calendarDays = React.useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Days in week: Monday = 1, Sunday = 0
    // We start grid on Monday (Segunda-feira)
    const firstDayWeekday = firstDayOfMonth.getDay(); // 0 is Sun, 1 is Mon...
    const mondayOffset = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1;

    const days: Array<{
      date: Date;
      dateStr: string;
      isCurrentMonth: boolean;
      isToday: boolean;
    }> = [];

    // 1. Previous month trailing days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = mondayOffset - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({
        date: d,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    // 2. Current month days
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      const d = new Date(year, month, day);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        date: d,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      });
    }

    // 3. Next month leading days to complete full weeks (multiples of 7)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let day = 1; day <= remaining; day++) {
      const d = new Date(year, month + 1, day);
      const dateStr = d.toISOString().split('T')[0];
      days.push({
        date: d,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    return days;
  }, [currentDate, todayStr]);

  const weekdays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

  return (
    <div id="calendar-month-grid" className="flex-1 flex flex-col bg-white dark:bg-slate-900 overflow-hidden">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/80 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 py-2.5 select-none">
        {weekdays.map((day, idx) => (
          <div key={day} className={idx >= 5 ? 'text-slate-400 dark:text-slate-500' : ''}>
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day.slice(0, 3)}</span>
          </div>
        ))}
      </div>

      {/* Grid of days */}
      <div className="flex-1 grid grid-cols-7 grid-rows-5 sm:grid-rows-6 divide-x divide-y divide-slate-100 dark:divide-slate-800/80 border-b border-slate-200 dark:border-slate-800 overflow-y-auto">
        {calendarDays.map((day) => {
          const dayEvents = eventsByDate.get(day.dateStr) || [];
          const maxDisplay = 3;
          const visibleEvents = dayEvents.slice(0, maxDisplay);
          const hiddenCount = dayEvents.length - maxDisplay;

          return (
            <div
              key={day.dateStr}
              id={`calendar-day-${day.dateStr}`}
              onClick={() => onSelectDate(day.dateStr)}
              className={`min-h-[100px] sm:min-h-[120px] p-1.5 flex flex-col transition-colors group cursor-pointer ${
                day.isCurrentMonth
                  ? day.isToday
                    ? 'bg-blue-50/30 dark:bg-blue-950/20'
                    : 'bg-white dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
                  : 'bg-slate-50/30 dark:bg-slate-950/40 text-slate-300 dark:text-slate-600 hover:bg-slate-50/70 dark:hover:bg-slate-900/60'
              }`}
            >
              {/* Day header: number + add button */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`inline-flex items-center justify-center w-6 h-6 text-xs rounded-full font-medium transition-all ${
                    day.isToday
                      ? 'bg-blue-600 text-white font-bold shadow-2xs'
                      : day.isCurrentMonth
                      ? 'text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100'
                      : 'text-slate-400 dark:text-slate-600'
                  }`}
                >
                  {day.date.getDate()}
                </span>

                {/* Quick add button on day hover */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectDate(day.dateStr);
                  }}
                  title="Novo compromisso neste dia"
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-opacity"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Events list for day */}
              <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                {visibleEvents.map((event) => {
                  const agenda = agendaMap.get(event.agendaId);
                  const colorHex = agenda?.colorHex || '#64748b';
                  const isDone = event.status === 'concluido';

                  return (
                    <div
                      key={event.id}
                      id={`event-item-${event.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvent(event);
                      }}
                      className={`group/item flex items-center gap-1.5 px-1.5 py-1 rounded text-[11px] leading-tight border transition-all cursor-pointer ${
                        isDone
                          ? 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 border-slate-200/50 dark:border-slate-800/60'
                          : 'bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700/70 shadow-2xs hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                      style={{
                        borderLeftWidth: '3px',
                        borderLeftColor: colorHex,
                      }}
                    >
                      {/* Checkbox toggle status */}
                      <button
                        onClick={(e) => onToggleEventStatus(event.id, e)}
                        title={isDone ? 'Marcar como pendente' : 'Marcar como concluído'}
                        className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          isDone
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 dark:border-slate-600 group-hover/item:border-slate-400 dark:group-hover/item:border-slate-500 bg-white dark:bg-slate-900 hover:border-emerald-600'
                        }`}
                      >
                        {isDone && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </button>

                      {/* Origin icon badge if automatic */}
                      {event.originRef?.type === 'empregado' && (
                        <Users className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                      )}
                      {event.originRef?.type === 'transporte' && (
                        <Truck className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                      )}

                      {/* Event Title */}
                      <span
                        className={`truncate flex-1 font-medium ${
                          isDone ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-100'
                        }`}
                      >
                        {event.title}
                      </span>

                      {/* Time if available */}
                      {event.time && (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0 font-mono hidden sm:inline">
                          {event.time}
                        </span>
                      )}
                    </div>
                  );
                })}

                {/* More events indicator */}
                {hiddenCount > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDate(day.dateStr);
                    }}
                    className="text-[10px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-left px-1.5 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mt-auto"
                  >
                    +{hiddenCount} mais
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
