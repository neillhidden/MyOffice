import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Agenda, CalendarEvent, EventStatus } from '../../types/calendar';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: {
    agendaId: string;
    title: string;
    date: string;
    time?: string;
    description?: string;
    status: EventStatus;
  }) => void;
  agendas: Agenda[];
  initialEvent?: CalendarEvent | null;
  defaultDate?: string;
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  agendas,
  initialEvent,
  defaultDate,
}) => {
  const activeAgendas = agendas.filter((a) => a.status === 'ativa');
  const defaultAgendaId =
    initialEvent?.agendaId ||
    activeAgendas.find((a) => a.origin === 'manual')?.id ||
    activeAgendas[0]?.id ||
    '';

  const [agendaId, setAgendaId] = useState(defaultAgendaId);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('2026-09-13');
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<EventStatus>('pendente');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialEvent) {
      setAgendaId(initialEvent.agendaId);
      setTitle(initialEvent.title);
      setDate(initialEvent.date);
      setTime(initialEvent.time || '');
      setDescription(initialEvent.description || '');
      setStatus(initialEvent.status);
    } else {
      setAgendaId(defaultAgendaId);
      setTitle('');
      const fallbackDate = () => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      };
      setDate(defaultDate || fallbackDate());
      setTime('');
      setDescription('');
      setStatus('pendente');
    }
    setError('');
  }, [initialEvent, defaultDate, defaultAgendaId, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Por favor, informe o título do compromisso.');
      return;
    }
    if (!date) {
      setError('Por favor, selecione a data.');
      return;
    }
    if (!agendaId) {
      setError('Por favor, selecione uma agenda.');
      return;
    }

    onSave({
      agendaId,
      title: title.trim(),
      date,
      time: time.trim() || undefined,
      description: description.trim() || undefined,
      status,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-xs">
      <div
        id="event-modal-container"
        className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
              {initialEvent ? 'Editar Compromisso' : 'Novo Compromisso'}
            </h3>
          </div>
          <button
            type="button"
            id="btn-close-event-modal"
            onClick={onClose}
            aria-label="Fechar"
            title="Fechar"
            className="p-1 rounded-md text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-lg text-xs">
              {error}
            </div>
          )}

          {/* Agenda Selection */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Agenda <span className="text-rose-500">*</span>
            </label>
            <select
              id="event-agenda-select"
              value={agendaId}
              onChange={(e) => setAgendaId(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400"
            >
              {activeAgendas.map((ag) => (
                <option key={ag.id} value={ag.id}>
                  {ag.name} ({ag.origin === 'automatica' ? 'Automática' : 'Manual'})
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Título do Compromisso <span className="text-rose-500">*</span>
            </label>
            <input
              id="event-title-input"
              type="text"
              required
              placeholder="Ex: Pagamento de Licença de Software, Entrega de Peças"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError('');
              }}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400 font-medium"
            />
          </div>

          {/* Date & Time Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Data <span className="text-rose-500">*</span>
              </label>
              <input
                id="event-date-input"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Horário (opcional)
              </label>
              <div className="relative">
                <input
                  id="event-time-input"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Status Segmented Control */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Status</label>
            <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200/60 dark:border-slate-700/80 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setStatus('pendente')}
                className={`flex-1 sm:flex-initial px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                  status === 'pendente'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Pendente
              </button>
              <button
                type="button"
                onClick={() => setStatus('concluido')}
                className={`flex-1 sm:flex-initial px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                  status === 'concluido'
                    ? 'bg-emerald-600 text-white shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Concluído
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Observações / Detalhes
            </label>
            <textarea
              id="event-description-input"
              rows={3}
              placeholder="Detalhes adicionais, local, links ou instruções..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400 resize-none leading-relaxed"
            />
          </div>

          {/* Footer Actions: Botão 'Adicionar' (sem ícone '+') */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="event-submit-btn"
              className="px-4 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white rounded-lg text-xs font-medium transition-colors shadow-xs"
            >
              {initialEvent ? 'Salvar' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
