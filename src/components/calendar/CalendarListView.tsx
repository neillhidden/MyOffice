import React, { useState, useMemo } from 'react';
import {
  Check,
  Search,
  Users,
  Truck,
  Calendar,
  Clock,
  Trash2,
  Edit2,
  ExternalLink,
  Filter,
} from 'lucide-react';
import { Agenda, CalendarEvent, EventStatus } from '../../types/calendar';

interface CalendarListViewProps {
  events: CalendarEvent[];
  agendas: Agenda[];
  onSelectEvent: (event: CalendarEvent) => void;
  onToggleEventStatus: (eventId: string, e: React.MouseEvent) => void;
  onDeleteEvent: (eventId: string) => void;
  onEditEvent: (event: CalendarEvent) => void;
}

export const CalendarListView: React.FC<CalendarListViewProps> = ({
  events,
  agendas,
  onSelectEvent,
  onToggleEventStatus,
  onDeleteEvent,
  onEditEvent,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendente' | 'concluido'>('todos');
  const [selectedAgendaFilter, setSelectedAgendaFilter] = useState<string>('todas');

  const agendaMap = useMemo(() => {
    const map = new Map<string, Agenda>();
    agendas.forEach((a) => map.set(a.id, a));
    return map;
  }, [agendas]);

  const filteredEvents = useMemo(() => {
    return events
      .filter((ev) => {
        // Status filter
        if (statusFilter !== 'todos' && ev.status !== statusFilter) return false;

        // Agenda filter
        if (selectedAgendaFilter !== 'todas' && ev.agendaId !== selectedAgendaFilter) return false;

        // Search text
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const matchesTitle = ev.title.toLowerCase().includes(term);
          const matchesDesc = (ev.description || '').toLowerCase().includes(term);
          const matchesDate = ev.date.includes(term);
          const matchesOrigin = (ev.originRef?.label || '').toLowerCase().includes(term);
          if (!matchesTitle && !matchesDesc && !matchesDate && !matchesOrigin) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Sort by date ascending, then time
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return (a.time || '').localeCompare(b.time || '');
      });
  }, [events, statusFilter, selectedAgendaFilter, searchTerm]);

  return (
    <div id="calendar-list-view" className="flex-1 flex flex-col bg-white dark:bg-slate-900 overflow-hidden">
      {/* List Toolbar: Search & Status Filters */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 flex flex-wrap items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative min-w-[240px] flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            id="calendar-list-search"
            type="text"
            placeholder="Pesquisar compromissos, datas ou origem..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400"
          />
        </div>

        {/* Status Filters & Agenda Filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Agenda Filter Dropdown */}
          <select
            id="calendar-list-agenda-filter"
            value={selectedAgendaFilter}
            onChange={(e) => setSelectedAgendaFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400"
          >
            <option value="todas">Todas as agendas</option>
            {agendas.map((ag) => (
              <option key={ag.id} value={ag.id}>
                {ag.name}
              </option>
            ))}
          </select>

          {/* Status Segmented Control */}
          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200/60 dark:border-slate-700/80">
            {(
              [
                { id: 'todos', label: 'Todos' },
                { id: 'pendente', label: 'Pendentes' },
                { id: 'concluido', label: 'Concluídos' },
              ] as const
            ).map((item) => {
              const isActive = statusFilter === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setStatusFilter(item.id)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                    isActive
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none">
              <th className="py-2.5 px-4 w-12 text-center">Status</th>
              <th className="py-2.5 px-4">Compromisso</th>
              <th className="py-2.5 px-4">Agenda</th>
              <th className="py-2.5 px-4">Data & Horário</th>
              <th className="py-2.5 px-4">Origem</th>
              <th className="py-2.5 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
            {filteredEvents.map((event) => {
              const agenda = agendaMap.get(event.agendaId);
              const colorHex = agenda?.colorHex || '#64748b';
              const isDone = event.status === 'concluido';
              const isManual = !event.originRef;

              return (
                <tr
                  key={event.id}
                  id={`table-row-${event.id}`}
                  onClick={() => onSelectEvent(event)}
                  className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${
                    isDone ? 'bg-slate-50/40 dark:bg-slate-900/40 text-slate-400 dark:text-slate-500' : 'bg-white dark:bg-slate-900'
                  }`}
                >
                  {/* Status Checkbox */}
                  <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => onToggleEventStatus(event.id, e)}
                      title={isDone ? 'Marcar como pendente' : 'Marcar como concluído'}
                      className={`w-4 h-4 mx-auto rounded border flex items-center justify-center transition-colors ${
                        isDone
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 dark:border-slate-600 hover:border-emerald-600 bg-white dark:bg-slate-800'
                      }`}
                    >
                      {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>
                  </td>

                  {/* Title & Description */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-medium ${
                          isDone ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {event.title}
                      </span>
                    </div>
                    {event.description && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                        {event.description}
                      </p>
                    )}
                  </td>

                  {/* Agenda with discrete pill & dot */}
                  <td className="py-3 px-4">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/80">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: colorHex }}
                      />
                      <span className="text-slate-700 dark:text-slate-300">{agenda?.name || 'Geral'}</span>
                    </div>
                  </td>

                  {/* Date & Time */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-800 dark:text-slate-200 font-mono text-[11px]">
                        {event.date}
                      </span>
                      {event.time && (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" />
                          {event.time}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Origin */}
                  <td className="py-3 px-4">
                    {event.originRef ? (
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                        {event.originRef.type === 'empregado' ? (
                          <>
                            <Users className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{event.originRef.label}</span>
                          </>
                        ) : (
                          <>
                            <Truck className="w-3.5 h-3.5 text-amber-600" />
                            <span>Transporte #{event.originRef.label}</span>
                          </>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500">Manual</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {isManual && (
                        <>
                          <button
                            onClick={() => onEditEvent(event)}
                            title="Editar compromisso"
                            className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteEvent(event.id)}
                            title="Excluir compromisso"
                            className="p-1 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => onSelectEvent(event)}
                        title="Ver detalhes"
                        className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredEvents.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-slate-500">
                  <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Nenhum compromisso encontrado</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    Tente ajustar seus filtros de busca ou adicione um novo evento.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
