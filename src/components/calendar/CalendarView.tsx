import React, { useState, useMemo } from 'react';
import { useStock } from '../../context/StockContext';
import {
  CalendarViewMode,
  CalendarDisplayType,
  CalendarEvent,
  Agenda,
  AgendaColor,
} from '../../types/calendar';
import { CalendarHeader } from './CalendarHeader';
import { CalendarSidebarAgendas } from './CalendarSidebarAgendas';
import { CalendarMonthGrid } from './CalendarMonthGrid';
import { CalendarWeekGrid } from './CalendarWeekGrid';
import { CalendarYearGrid } from './CalendarYearGrid';
import { CalendarListView } from './CalendarListView';
import { EventModal } from './EventModal';
import { AgendaModal } from './AgendaModal';
import { EventDetailModal } from './EventDetailModal';

interface CalendarViewProps {
  onNavigateToModule?: (module: string, submodule?: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onNavigateToModule }) => {
  const {
    agendas,
    events,
    addAgenda,
    updateAgenda,
    toggleArchiveAgenda,
    deleteAgenda,
    addEvent,
    updateEvent,
    toggleEventStatus,
    deleteEvent,
  } = useStock();

  // Calendar State
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date(2026, 8, 13)); // 13 Setembro 2026
  const [viewMode, setViewMode] = useState<CalendarViewMode>('mes');
  const [displayType, setDisplayType] = useState<CalendarDisplayType>('grade');

  // Visible Agendas Filter (Set of agenda IDs)
  const [visibleAgendaIds, setVisibleAgendaIds] = useState<Set<string>>(() => {
    return new Set(agendas.filter((a) => a.status === 'ativa').map((a) => a.id));
  });

  // Modal States
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [defaultEventDate, setDefaultEventDate] = useState<string | undefined>(undefined);

  const [isAgendaModalOpen, setIsAgendaModalOpen] = useState(false);
  const [editingAgenda, setEditingAgenda] = useState<Agenda | null>(null);

  const [selectedDetailEvent, setSelectedDetailEvent] = useState<CalendarEvent | null>(null);

  // Toggle single agenda visibility
  const handleToggleAgendaVisibility = (agendaId: string) => {
    setVisibleAgendaIds((prev) => {
      const next = new Set(prev);
      if (next.has(agendaId)) {
        next.delete(agendaId);
      } else {
        next.add(agendaId);
      }
      return next;
    });
  };

  const handleSelectAllAgendas = () => {
    setVisibleAgendaIds(new Set(agendas.map((a) => a.id)));
  };

  const handleDeselectAllAgendas = () => {
    setVisibleAgendaIds(new Set());
  };

  // Filter events according to visible agendas
  const visibleEvents = useMemo(() => {
    return events.filter((ev) => visibleAgendaIds.has(ev.agendaId));
  }, [events, visibleAgendaIds]);

  // Today handler
  const handleToday = () => {
    setCurrentDate(new Date(2026, 8, 13));
  };

  // Event handlers
  const handleOpenCreateEventForDate = (dateStr: string) => {
    setDefaultEventDate(dateStr);
    setEditingEvent(null);
    setIsEventModalOpen(true);
  };

  const handleOpenCreateEvent = () => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    setDefaultEventDate(`${year}-${month}-${day}`);
    setEditingEvent(null);
    setIsEventModalOpen(true);
  };

  const handleEditEvent = (ev: CalendarEvent) => {
    setEditingEvent(ev);
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = (data: {
    agendaId: string;
    title: string;
    date: string;
    time?: string;
    description?: string;
    status: 'pendente' | 'concluido';
  }) => {
    if (editingEvent) {
      updateEvent(editingEvent.id, data);
    } else {
      addEvent(data);
    }
  };

  const handleSaveAgenda = (data: {
    name: string;
    color: AgendaColor;
    colorHex: string;
    description?: string;
  }) => {
    if (editingAgenda) {
      updateAgenda(editingAgenda.id, data);
    } else {
      const newAgenda = addAgenda(data);
      // Automatically make new agenda visible
      setVisibleAgendaIds((prev) => new Set([...prev, newAgenda.id]));
    }
  };

  // Find agenda for selected detail event
  const selectedEventAgenda = useMemo(() => {
    if (!selectedDetailEvent) return undefined;
    return agendas.find((a) => a.id === selectedDetailEvent.agendaId);
  }, [selectedDetailEvent, agendas]);

  return (
    <div id="calendar-module-root" className="flex-1 flex flex-col h-full bg-slate-100 overflow-hidden">
      {/* Top Header Toolbar */}
      <CalendarHeader
        currentDate={currentDate}
        viewMode={viewMode}
        displayType={displayType}
        onChangeDate={setCurrentDate}
        onToday={handleToday}
        onChangeViewMode={setViewMode}
        onChangeDisplayType={setDisplayType}
        onOpenCreateEvent={handleOpenCreateEvent}
      />

      {/* Main Body: Agendas Sidebar + Calendar View Matrix */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Agendas Sidebar */}
        <CalendarSidebarAgendas
          agendas={agendas}
          events={events}
          visibleAgendaIds={visibleAgendaIds}
          onToggleAgendaVisibility={handleToggleAgendaVisibility}
          onSelectAllAgendas={handleSelectAllAgendas}
          onDeselectAllAgendas={handleDeselectAllAgendas}
          onOpenCreateAgenda={() => {
            setEditingAgenda(null);
            setIsAgendaModalOpen(true);
          }}
          onToggleArchiveAgenda={toggleArchiveAgenda}
          onDeleteAgenda={(id) => {
            const res = deleteAgenda(id);
            if (!res.success && res.message) {
              alert(res.message);
            }
          }}
        />

        {/* View Content (Grid or List) */}
        <main className="flex-1 flex flex-col overflow-hidden bg-white">
          {displayType === 'lista' ? (
            <CalendarListView
              events={visibleEvents}
              agendas={agendas}
              onSelectEvent={setSelectedDetailEvent}
              onToggleEventStatus={(id, e) => {
                e.stopPropagation();
                toggleEventStatus(id);
              }}
              onDeleteEvent={deleteEvent}
              onEditEvent={handleEditEvent}
            />
          ) : viewMode === 'mes' ? (
            <CalendarMonthGrid
              currentDate={currentDate}
              events={visibleEvents}
              agendas={agendas}
              onSelectEvent={setSelectedDetailEvent}
              onToggleEventStatus={(id, e) => {
                e.stopPropagation();
                toggleEventStatus(id);
              }}
              onSelectDate={handleOpenCreateEventForDate}
            />
          ) : viewMode === 'semana' ? (
            <CalendarWeekGrid
              currentDate={currentDate}
              events={visibleEvents}
              agendas={agendas}
              onSelectEvent={setSelectedDetailEvent}
              onToggleEventStatus={(id, e) => {
                e.stopPropagation();
                toggleEventStatus(id);
              }}
              onSelectDate={handleOpenCreateEventForDate}
            />
          ) : (
            <CalendarYearGrid
              currentDate={currentDate}
              events={visibleEvents}
              agendas={agendas}
              onSelectMonth={(monthIdx) => {
                const next = new Date(currentDate);
                next.setMonth(monthIdx);
                setCurrentDate(next);
                setViewMode('mes');
              }}
              onSelectEvent={setSelectedDetailEvent}
            />
          )}
        </main>
      </div>

      {/* Modal: Add/Edit Event */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onSave={handleSaveEvent}
        agendas={agendas}
        initialEvent={editingEvent}
        defaultDate={defaultEventDate}
      />

      {/* Modal: Add/Edit Agenda */}
      <AgendaModal
        isOpen={isAgendaModalOpen}
        onClose={() => setIsAgendaModalOpen(false)}
        onSave={handleSaveAgenda}
        initialAgenda={editingAgenda}
      />

      {/* Modal: Event Detail */}
      <EventDetailModal
        isOpen={!!selectedDetailEvent}
        event={selectedDetailEvent}
        agenda={selectedEventAgenda}
        onClose={() => setSelectedDetailEvent(null)}
        onToggleStatus={(id) => {
          toggleEventStatus(id);
          // Keep updated in modal
          setSelectedDetailEvent((prev) =>
            prev && prev.id === id
              ? {
                  ...prev,
                  status: prev.status === 'concluido' ? 'pendente' : 'concluido',
                }
              : prev
          );
        }}
        onEdit={(ev) => {
          setSelectedDetailEvent(null);
          handleEditEvent(ev);
        }}
        onDelete={(id) => {
          deleteEvent(id);
          setSelectedDetailEvent(null);
        }}
        onNavigateToModule={onNavigateToModule}
      />
    </div>
  );
};
