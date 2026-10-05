import React from 'react';
import {
  Check,
  Eye,
  EyeOff,
  MoreVertical,
  Archive,
  Trash2,
  Users,
  Truck,
  FolderDot,
} from 'lucide-react';
import { Agenda, CalendarEvent } from '../../types/calendar';

interface CalendarSidebarAgendasProps {
  agendas: Agenda[];
  events: CalendarEvent[];
  visibleAgendaIds: Set<string>;
  onToggleAgendaVisibility: (agendaId: string) => void;
  onSelectAllAgendas: () => void;
  onDeselectAllAgendas: () => void;
  onOpenCreateAgenda: () => void;
  onToggleArchiveAgenda: (agendaId: string) => void;
  onDeleteAgenda: (agendaId: string) => void;
}

export const CalendarSidebarAgendas: React.FC<CalendarSidebarAgendasProps> = ({
  agendas,
  events,
  visibleAgendaIds,
  onToggleAgendaVisibility,
  onSelectAllAgendas,
  onDeselectAllAgendas,
  onOpenCreateAgenda,
  onToggleArchiveAgenda,
  onDeleteAgenda,
}) => {
  const [menuOpenAgendaId, setMenuOpenAgendaId] = React.useState<string | null>(null);
  const [showArchived, setShowArchived] = React.useState(false);

  // Count events per agenda
  const countsByAgenda = React.useMemo(() => {
    const map: Record<string, { total: number; pending: number }> = {};
    events.forEach((ev) => {
      if (!map[ev.agendaId]) {
        map[ev.agendaId] = { total: 0, pending: 0 };
      }
      map[ev.agendaId].total += 1;
      if (ev.status === 'pendente') {
        map[ev.agendaId].pending += 1;
      }
    });
    return map;
  }, [events]);

  const activeAgendas = agendas.filter((a) => a.status === 'ativa');
  const archivedAgendas = agendas.filter((a) => a.status === 'arquivada');

  const displayedAgendas = showArchived ? agendas : activeAgendas;

  return (
    <aside
      id="calendar-sidebar-agendas"
      className="w-full lg:w-64 bg-slate-50/70 dark:bg-slate-900/70 border-r border-slate-200/80 dark:border-slate-800 p-4 flex flex-col gap-4 select-none shrink-0"
    >
      {/* Header with Title & Add Agenda Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Agendas
          </h2>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            {activeAgendas.length} ativas
          </span>
        </div>

        {/* User Directive: Botão 'Adicionar' (sem ícone '+') para nova agenda */}
        <button
          id="calendar-add-agenda-btn"
          onClick={onOpenCreateAgenda}
          className="dm-btn-primary px-2.5 py-1 bg-white dark:bg-dm-text border border-slate-200 dark:border-transparent hover:bg-slate-100/80 dark:hover:bg-white text-slate-800 dark:text-dm-page rounded-md text-xs font-semibold transition-colors shadow-2xs"
        >
          Adicionar
        </button>
      </div>

      {/* Visibility Quick Controls */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-200/70 dark:border-slate-800">
        <span>Filtro de exibição:</span>
        <div className="flex items-center gap-2">
          <button
            onClick={onSelectAllAgendas}
            className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors underline cursor-pointer"
          >
            Todas
          </button>
          <span>•</span>
          <button
            onClick={onDeselectAllAgendas}
            className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors underline cursor-pointer"
          >
            Nenhuma
          </button>
        </div>
      </div>

      {/* Agendas List */}
      <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
        {displayedAgendas.map((agenda) => {
          const isVisible = visibleAgendaIds.has(agenda.id);
          const counts = countsByAgenda[agenda.id] || { total: 0, pending: 0 };
          const isAutomated = agenda.origin === 'automatica';
          const isMenuOpen = menuOpenAgendaId === agenda.id;

          return (
            <div
              key={agenda.id}
              id={`agenda-item-${agenda.id}`}
              className={`group relative flex items-center justify-between p-2 rounded-lg transition-all text-xs ${
                isVisible
                  ? 'bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 shadow-2xs'
                  : 'bg-transparent text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 border border-transparent'
              }`}
            >
              {/* Clickable check toggle */}
              <button
                onClick={() => onToggleAgendaVisibility(agenda.id)}
                className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
              >
                {/* Discrete Color Pill / Dot */}
                <div
                  className="w-3 h-3 rounded-full flex items-center justify-center shrink-0 transition-transform"
                  style={{
                    backgroundColor: isVisible ? agenda.colorHex : '#cbd5e1',
                    boxShadow: isVisible ? `0 0 0 2px ${agenda.colorHex}20` : 'none',
                  }}
                >
                  {isVisible && <Check className="w-2 h-2 text-white stroke-[3]" />}
                </div>

                <div className="truncate flex-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`font-medium truncate ${
                        isVisible ? 'text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {agenda.name}
                    </span>
                    {agenda.status === 'arquivada' && (
                      <span className="text-[10px] px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300">
                        Arquivada
                      </span>
                    )}
                  </div>

                  {/* Subtitle for automated source */}
                  {isAutomated && (
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                      {agenda.automaticSource === 'aniversarios' ? (
                        <>
                          <Users className="w-2.5 h-2.5" />
                          <span>Módulo Empregado</span>
                        </>
                      ) : agenda.automaticSource === 'entregas' ? (
                        <>
                          <Truck className="w-2.5 h-2.5" />
                          <span>Módulo Transporte</span>
                        </>
                      ) : (
                        <span>Automática</span>
                      )}
                    </div>
                  )}
                </div>
              </button>

              {/* Event Counter & Options Menu */}
              <div className="flex items-center gap-1 shrink-0 ml-1">
                <span
                  title={`${counts.pending} pendentes de ${counts.total} eventos`}
                  className={`text-[11px] px-1.5 py-0.5 rounded-full font-mono font-medium ${
                    counts.pending > 0
                      ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {counts.total}
                </span>

                {/* More Options Dropdown button */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpenAgendaId(isMenuOpen ? null : agenda.id);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>

                  {/* Dropdown menu */}
                  {isMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-20"
                        onClick={() => setMenuOpenAgendaId(null)}
                      />
                      <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1 z-30 text-xs">
                        <button
                          onClick={() => {
                            onToggleArchiveAgenda(agenda.id);
                            setMenuOpenAgendaId(null);
                          }}
                          className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                        >
                          <Archive className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          {agenda.status === 'ativa' ? 'Arquivar' : 'Desarquivar'}
                        </button>
                        {!isAutomated && (
                          <button
                            onClick={() => {
                              onDeleteAgenda(agenda.id);
                              setMenuOpenAgendaId(null);
                            }}
                            className="w-full px-3 py-1.5 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 flex items-center gap-2"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                            Excluir
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {displayedAgendas.length === 0 && (
          <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-xs">
            Nenhuma agenda encontrada.
          </div>
        )}
      </div>

      {/* Toggle Archived Agendas */}
      {archivedAgendas.length > 0 && (
        <div className="mt-auto pt-2 border-t border-slate-200/70 dark:border-slate-800">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="w-full flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors py-1"
          >
            <span className="flex items-center gap-1.5">
              <FolderDot className="w-3 h-3 text-slate-400 dark:text-slate-500" />
              {showArchived ? 'Ocultar arquivadas' : 'Ver arquivadas'}
            </span>
            <span className="font-mono text-slate-400 dark:text-slate-500">({archivedAgendas.length})</span>
          </button>
        </div>
      )}
    </aside>
  );
};
