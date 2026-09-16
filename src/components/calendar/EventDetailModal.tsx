import React from 'react';
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  Check,
  RotateCcw,
  Edit2,
  Trash2,
  Users,
  Truck,
  Building,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { CalendarEvent, Agenda } from '../../types/calendar';

interface EventDetailModalProps {
  event: CalendarEvent | null;
  agenda?: Agenda;
  isOpen: boolean;
  onClose: () => void;
  onToggleStatus: (eventId: string) => void;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (eventId: string) => void;
  onNavigateToModule?: (module: string, submodule?: string) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  agenda,
  isOpen,
  onClose,
  onToggleStatus,
  onEdit,
  onDelete,
  onNavigateToModule,
}) => {
  if (!isOpen || !event) return null;

  const colorHex = agenda?.colorHex || '#64748b';
  const isDone = event.status === 'concluido';
  const isManual = !event.originRef;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div
        id="event-detail-modal-container"
        className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header with Agenda Pill and Close */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: colorHex }}
            />
            <span className="text-xs font-semibold text-slate-700">
              {agenda?.name || 'Agenda Geral'}
            </span>
            {agenda?.origin === 'automatica' && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-medium">
                Automática
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Title & Status Badge */}
          <div>
            <div className="flex items-start justify-between gap-3">
              <h2
                className={`text-base font-semibold leading-snug ${
                  isDone ? 'line-through text-slate-400' : 'text-slate-900'
                }`}
              >
                {event.title}
              </h2>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0 flex items-center gap-1 ${
                  isDone
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                    : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                }`}
              >
                {isDone ? (
                  <>
                    <Check className="w-3 h-3" />
                    Concluído
                  </>
                ) : (
                  <>
                    <Clock className="w-3 h-3" />
                    Pendente
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Date & Time Info Box */}
          <div className="bg-slate-50 border border-slate-200/70 rounded-lg p-3 grid grid-cols-2 gap-2 text-slate-700">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-slate-400" />
              <div>
                <span className="block text-[10px] text-slate-400 uppercase font-medium">Data</span>
                <span className="font-semibold text-slate-800 font-mono">{event.date}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <div>
                <span className="block text-[10px] text-slate-400 uppercase font-medium">Horário</span>
                <span className="font-medium text-slate-800 font-mono">
                  {event.time || 'Dia inteiro'}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <div>
              <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Detalhes
              </span>
              <p className="text-slate-700 bg-white p-3 rounded-lg border border-slate-200/60 leading-relaxed text-xs">
                {event.description}
              </p>
            </div>
          )}

          {/* Origin Section if Automated */}
          {event.originRef && (
            <div className="bg-slate-50 border border-slate-200/70 rounded-lg p-3">
              <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Vínculo Automático
              </span>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {event.originRef.type === 'empregado' ? (
                    <>
                      <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <Users className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">{event.originRef.label}</div>
                        <div className="text-[10px] text-slate-400">Colaborador no sistema</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                        <Truck className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">Transporte #{event.originRef.label}</div>
                        <div className="text-[10px] text-slate-400">Módulo Caixa / Transporte</div>
                      </div>
                    </>
                  )}
                </div>

                {onNavigateToModule && (
                  <button
                    onClick={() => {
                      if (event.originRef?.type === 'transporte') {
                        onNavigateToModule('Caixa', 'transporte');
                        onClose();
                      } else if (event.originRef?.type === 'empregado') {
                        onNavigateToModule('Empregado');
                        onClose();
                      }
                    }}
                    className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-medium hover:underline cursor-pointer"
                  >
                    Abrir módulo
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
          {/* Quick Toggle Status */}
          <button
            onClick={() => onToggleStatus(event.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
              isDone
                ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs'
            }`}
          >
            {isDone ? (
              <>
                <RotateCcw className="w-3.5 h-3.5" />
                Marcar Pendente
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                Marcar Concluído
              </>
            )}
          </button>

          {/* Right Action buttons */}
          <div className="flex items-center gap-1.5">
            {isManual && (
              <>
                <button
                  onClick={() => {
                    onEdit(event);
                    onClose();
                  }}
                  className="p-1.5 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                  title="Editar evento"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    onDelete(event.id);
                    onClose();
                  }}
                  className="p-1.5 text-rose-600 hover:text-rose-700 border border-rose-200 rounded-lg hover:bg-rose-50 transition-colors"
                  title="Excluir evento"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-medium transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
