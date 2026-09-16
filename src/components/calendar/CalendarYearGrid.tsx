import React from 'react';
import { CalendarEvent, Agenda } from '../../types/calendar';

interface CalendarYearGridProps {
  currentDate: Date;
  events: CalendarEvent[];
  agendas: Agenda[];
  onSelectMonth: (monthIndex: number) => void;
  onSelectEvent: (event: CalendarEvent) => void;
}

export const CalendarYearGrid: React.FC<CalendarYearGridProps> = ({
  currentDate,
  events,
  agendas,
  onSelectMonth,
  onSelectEvent,
}) => {
  const year = currentDate.getFullYear();
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

  const todayStr = '2026-09-13';

  // Group events by month (0..11)
  const eventsByMonth = React.useMemo(() => {
    const map = new Map<number, CalendarEvent[]>();
    for (let m = 0; m < 12; m++) map.set(m, []);

    events.forEach((ev) => {
      // ev.date is YYYY-MM-DD
      const [evYear, evMonth] = ev.date.split('-').map(Number);
      if (evYear === year) {
        const mIdx = evMonth - 1;
        const list = map.get(mIdx) || [];
        list.push(ev);
        map.set(mIdx, list);
      }
    });

    return map;
  }, [events, year]);

  return (
    <div id="calendar-year-grid" className="flex-1 bg-white dark:bg-slate-900 p-6 overflow-y-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {monthsPt.map((monthName, monthIdx) => {
          const monthEvents = eventsByMonth.get(monthIdx) || [];
          const firstDayOfMonth = new Date(year, monthIdx, 1);
          const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
          const startWeekday = (firstDayOfMonth.getDay() + 6) % 7; // Mon = 0, Sun = 6

          // Dates with events in this month
          const datesWithEvents = new Set(
            monthEvents.map((e) => Number(e.date.split('-')[2]))
          );

          return (
            <div
              key={monthName}
              id={`year-month-${monthIdx}`}
              onClick={() => onSelectMonth(monthIdx)}
              className="bg-white dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 rounded-xl p-4 transition-all hover:shadow-sm cursor-pointer group flex flex-col"
            >
              {/* Header: Month name & events count */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-700/60">
                <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {monthName}
                </h3>
                <span
                  className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-medium ${
                    monthEvents.length > 0
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {monthEvents.length} {monthEvents.length === 1 ? 'evento' : 'eventos'}
                </span>
              </div>

              {/* Mini-Month Days Matrix */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-slate-400 dark:text-slate-500 font-medium mb-1 select-none">
                <span>S</span>
                <span>T</span>
                <span>Q</span>
                <span>Q</span>
                <span>S</span>
                <span>S</span>
                <span>D</span>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-[11px] select-none">
                {/* Blank days before 1st */}
                {Array.from({ length: startWeekday }).map((_, i) => (
                  <div key={`blank-${i}`} className="h-6" />
                ))}

                {/* Days 1 to N */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const dateStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  const isToday = dateStr === todayStr;
                  const hasEvents = datesWithEvents.has(dayNum);

                  return (
                    <div
                      key={dayNum}
                      className={`h-6 flex flex-col items-center justify-center rounded-md relative ${
                        isToday
                          ? 'bg-blue-600 text-white font-bold'
                          : hasEvents
                          ? 'font-semibold text-slate-900 dark:text-slate-100 bg-slate-100/80 dark:bg-slate-700/60'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/40'
                      }`}
                    >
                      <span>{dayNum}</span>
                      {hasEvents && !isToday && (
                        <span className="w-1 h-1 rounded-full bg-blue-600 absolute bottom-0.5" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Top upcoming events preview */}
              {monthEvents.length > 0 && (
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 space-y-1">
                  {monthEvents.slice(0, 2).map((ev) => (
                    <div
                      key={ev.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvent(ev);
                      }}
                      className="text-[11px] truncate text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1.5"
                    >
                      <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
                        {ev.date.split('-')[2]}
                      </span>
                      <span className="truncate">{ev.title}</span>
                    </div>
                  ))}
                  {monthEvents.length > 2 && (
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 italic">
                      +{monthEvents.length - 2} outros compromissos
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
