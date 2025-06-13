
import { useState } from 'react';
import { AgendaHeader } from '@/components/agenda/AgendaHeader';
import { AgendaCalendar } from '@/components/agenda/AgendaCalendar';
import { AgendaViewRenderer } from '@/components/agenda/AgendaViewRenderer';
import { useAgendaQueries } from '@/hooks/useAgendaQueries';

const Agenda = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');

  const {
    dayEvents,
    weekEvents,
    monthEvents,
    isDayLoading,
    isWeekLoading,
    isMonthLoading,
    handleEventCreated
  } = useAgendaQueries(selectedDate);

  return (
    <div className="w-full min-h-screen overflow-hidden">
      <div className="space-y-3 sm:space-y-4 p-2 sm:p-4 lg:p-6">
        {/* Header */}
        <AgendaHeader 
          selectedDate={selectedDate}
          onEventCreated={handleEventCreated}
        />

        {/* Layout vertical empilhado */}
        <div className="w-full space-y-3 sm:space-y-4">
          {/* Calendário Lateral */}
          <div className="w-full">
            <AgendaCalendar
              selectedDate={selectedDate}
              viewMode={viewMode}
              onDateSelect={setSelectedDate}
              onViewModeChange={setViewMode}
              dayEventsCount={dayEvents.length}
              weekEventsCount={weekEvents.length}
              monthEventsCount={monthEvents.length}
            />
          </div>

          {/* Área Principal */}
          <div className="w-full overflow-hidden">
            <AgendaViewRenderer
              viewMode={viewMode}
              selectedDate={selectedDate}
              dayEvents={dayEvents}
              weekEvents={weekEvents}
              monthEvents={monthEvents}
              isDayLoading={isDayLoading}
              isMonthLoading={isMonthLoading}
              onDateChange={setSelectedDate}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Agenda;
