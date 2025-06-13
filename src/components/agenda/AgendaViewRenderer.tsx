
import { DayView } from '@/components/agenda/DayView';
import { WeeklyGrid } from '@/components/agenda/WeeklyGrid';
import { MonthView } from '@/components/agenda/MonthView';
import { GoogleCalendarEvent } from '@/types/supabase';

interface AgendaViewRendererProps {
  viewMode: 'day' | 'week' | 'month';
  selectedDate: Date;
  dayEvents: GoogleCalendarEvent[];
  weekEvents: GoogleCalendarEvent[];
  monthEvents: GoogleCalendarEvent[];
  isDayLoading: boolean;
  isMonthLoading: boolean;
  onDateChange: (date: Date) => void;
}

export const AgendaViewRenderer = ({
  viewMode,
  selectedDate,
  dayEvents,
  weekEvents,
  monthEvents,
  isDayLoading,
  isMonthLoading,
  onDateChange
}: AgendaViewRendererProps) => {
  console.log(`Renderizando visualização: ${viewMode}`);
  console.log(`Eventos disponíveis:`, {
    day: dayEvents.length,
    week: weekEvents.length,
    month: monthEvents.length
  });

  switch (viewMode) {
    case 'day':
      return (
        <DayView 
          selectedDate={selectedDate} 
          events={dayEvents} 
          isLoading={isDayLoading}
        />
      );
    case 'week':
      return (
        <WeeklyGrid
          selectedDate={selectedDate}
          events={weekEvents}
          onDateChange={onDateChange}
        />
      );
    case 'month':
      return (
        <MonthView
          selectedDate={selectedDate}
          events={monthEvents}
          onDateChange={onDateChange}
          isLoading={isMonthLoading}
        />
      );
    default:
      return null;
  }
};
