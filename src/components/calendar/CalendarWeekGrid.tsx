import React from 'react';
import { Check, Clock, Plus, Users, Truck, Calendar } from 'lucide-react';
import { Agenda, CalendarEvent } from '../../types/calendar';

interface CalendarWeekGridProps {
  currentDate: Date;
  events: CalendarEvent[];
  agendas: Agenda[];
  onSelectEvent: (event: CalendarEvent) => void;
  onToggleEventStatus: (eventId: string, e: React.MouseEvent) => void;
  onSelectDate: (dateStr: string) => void;
}

export const CalendarWeekGrid: React.FC<CalendarWeekGridProps> = ({
  currentDate,
  events,
  agendas,
  onSelectEvent,
  onToggleEventStatus,
  onSelectDate,
}) => {
  const agendaMap = React.useMemo(() => {
    const map = new Map<string, Agenda>();
    agendas.forEach((a) => map.set(a.id, a));
    return map;
  }, [agendas]);

  // Today string
  const todayStr = '2026-09-13';

  // Calculate the 7 days of the week starting from Monday
  const weekDays = React.useMemo(() => {
    const d = new Date(currentDate);
    const dayOfWeek = d.getDay(); // 0 is Sunday
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diffToMonday);

    const list: Array<{
      date: Date;
      dateStr: string;
      dayName: string;
      isToday: boolean;
    }> = [];

    const dayNames = [
      'Segunda-feira',
      'Terça-feira',
      'Quarta-feira',
      'Quinta-feira',
      'Sexta-feira',
      'Sábado',
      'Domingo',
    ];

    for (let i = 0; i < 7; i++) {
      const cur = new Date(monday);
      cur.setDate(monday.getDate() + i);
      const dateStr = cur.toISOString().split('T')[0];
      list.push({
        date: cur,
        dateStr,
        dayName: dayNames[i],
        isToday: dateStr === todayStr,
      });
    }

    return list;
  }, [currentDate, todayStr]);

  // Events grouped by date
  const eventsByDate = React.useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((ev) => {
      const list = map.get(ev.date) || [];
      list.push(ev);
      map.set(ev.date, list);
    });
    return map;
  }, [events]);

  return (
    <div id="calendar-week-grid" className="flex-1 flex flex-col bg-white dark:bg-slate-900 overflow-hidden">
      {/* 7 Columns Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800 overflow-y-auto">
        {weekDays.map((day) => {
          const dayEvents = (eventsByDate.get(day.dateStr) || []).sort((a, b) => {
            const timeA = a.time || '00:00';
            const timeB = b.time || '00:00';
            return timeA.localeCompare(timeB);
          });

          return (
            <div
              key={day.dateStr}
              id={`week-col-${day.dateStr}`}
              className={`flex flex-col min-h-[180px] p-3 transition-colors ${
                day.isToday ? 'bg-blue-50/20 dark:bg-blue-950/20' : 'bg-white dark:bg-slate-900'
              }`}
            >
              {/* Day Column Header */}
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {day.dayName.split('-')[0]}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 text-sm font-bold rounded-full ${
                        day.isToday
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800'
                      }`}
                    >
                      {day.date.getDate()}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                      {dayEvents.length} {dayEvents.length === 1 ? 'evento' : 'eventos'}
                    </span>
                  </div>
                </div>

                {/* Quick Add Button */}
                <button
                  onClick={() => onSelectDate(day.dateStr)}
                  title="Novo compromisso neste dia"
                  className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Event Cards List */}
              <div className="flex-1 space-y-2 overflow-y-auto">
                {dayEvents.map((event) => {
                  const agenda = agendaMap.get(event.agendaId);
                  const colorHex = agenda?.colorHex || '#64748b';
                  const isDone = event.status === 'concluido';

                  return (
                    <div
                      key={event.id}
                      onClick={() => onSelectEvent(event)}
                      className={`group p-2.5 rounded-lg border text-xs transition-all cursor-pointer ${
                        isDone
                          ? 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800/60 opacity-70'
                          : 'bg-white dark:bg-slate-800/90 border-slate-200/90 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-xs'
                      }`}
                      style={{
                        borderLeftWidth: '3.5px',
                        borderLeftColor: colorHex,
                      }}
                    >
                      {/* Top row: Checkbox, Agenda Pill, Time */}
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <button
                          onClick={(e) => onToggleEventStatus(event.id, e)}
                          title={isDone ? 'Marcar pendente' : 'Marcar concluído'}
                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                            isDone
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 hover:border-emerald-600'
                          }`}
                        >
                          {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>

                        <span
                          className="text-[10px] px-1.5 py-0.2 rounded-full font-medium truncate max-w-[110px]"
                          style={{
                            backgroundColor: `${colorHex}15`,
                            color: colorHex,
                          }}
                        >
                          {agenda?.name || 'Geral'}
                        </span>

                        {event.time && (
                          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {event.time}
                          </span>
                        )}
                      </div>

                      {/* Event Title */}
                      <h4
                        className={`font-medium text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug ${
                          isDone ? 'line-through text-slate-400 dark:text-slate-500' : ''
                        }`}
                      >
                        {event.title}
                      </h4>

                      {/* Description if any */}
                      {event.description && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-normal">
                          {event.description}
                        </p>
                      )}

                      {/* Automatic Badge */}
                      {event.originRef && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 mt-2 pt-1 border-t border-slate-100 dark:border-slate-700/50">
                          {event.originRef.type === 'empregado' ? (
                            <>
                              <Users className="w-3 h-3 text-emerald-600" />
                              <span className="truncate">{event.originRef.label}</span>
                            </>
                          ) : (
                            <>
                              <Truck className="w-3 h-3 text-amber-600" />
                              <span className="truncate">Carga #{event.originRef.label}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {dayEvents.length === 0 && (
                  <div
                    onClick={() => onSelectDate(day.dateStr)}
                    className="h-24 flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 hover:text-slate-400 dark:hover:text-slate-400 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 cursor-pointer transition-colors"
                  >
                    <span className="text-[11px]">Sem eventos</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Clique para adicionar</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
