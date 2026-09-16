export type AgendaOrigin = 'manual' | 'automatica';
export type AgendaStatus = 'ativa' | 'arquivada';
export type AutomaticAgendaSource = 'aniversarios' | 'entregas';

export interface Agenda {
  id: string;
  name: string;
  color: string; // Tailwind color class or hex string (e.g., 'indigo', 'emerald', 'amber', 'rose', 'sky', 'slate', 'violet')
  colorHex: string; // Discrete hex color code for badges/dots
  origin: AgendaOrigin;
  automaticSource?: AutomaticAgendaSource;
  status: AgendaStatus;
  description?: string;
  createdAt: string;
}

export type EventStatus = 'pendente' | 'concluido';

export type EventOriginType = 'manual' | 'empregado' | 'transporte' | 'venda';

export interface CalendarEvent {
  id: string;
  agendaId: string;
  title: string;
  date: string; // Format: YYYY-MM-DD
  time?: string; // Format: HH:mm (optional)
  description?: string;
  status: EventStatus;
  originRef?: {
    type: EventOriginType;
    id: string;
    label?: string;
  };
  createdAt: string;
  updatedAt?: string;
}

export type AgendaColor = string;

export type CalendarGranularity = 'semana' | 'mes' | 'ano';
export type CalendarViewMode = 'semana' | 'mes' | 'ano';
export type CalendarDisplayType = 'grade' | 'lista';
