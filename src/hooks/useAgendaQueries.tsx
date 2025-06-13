
import { useQuery } from '@tanstack/react-query';
import { calendarService } from '@/services/calendarService';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export const useAgendaQueries = (selectedDate: Date) => {
  // Query para eventos do dia selecionado
  const { data: dayEvents = [], isLoading: isDayLoading, refetch: refetchDay } = useQuery({
    queryKey: ['calendar-events-day', format(selectedDate, 'yyyy-MM-dd')],
    queryFn: () => {
      console.log('=== QUERY: Buscando eventos do dia ===', format(selectedDate, 'yyyy-MM-dd'));
      return calendarService.getCalendarEvents(
        startOfDay(selectedDate).toISOString(),
        endOfDay(selectedDate).toISOString()
      );
    },
  });

  // Query para eventos da semana
  const { data: weekEvents = [], isLoading: isWeekLoading, refetch: refetchWeek } = useQuery({
    queryKey: ['calendar-events-week', format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd')],
    queryFn: () => {
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
      console.log('=== QUERY: Buscando eventos da semana ===', format(weekStart, 'yyyy-MM-dd'), 'até', format(weekEnd, 'yyyy-MM-dd'));
      return calendarService.getCalendarEvents(
        weekStart.toISOString(),
        weekEnd.toISOString()
      );
    },
  });

  // Query para eventos do mês
  const { data: monthEvents = [], isLoading: isMonthLoading, refetch: refetchMonth } = useQuery({
    queryKey: ['calendar-events-month', format(startOfMonth(selectedDate), 'yyyy-MM-dd')],
    queryFn: () => {
      const monthStart = startOfMonth(selectedDate);
      const monthEnd = endOfMonth(selectedDate);
      console.log('=== QUERY: Buscando eventos do mês ===', format(monthStart, 'yyyy-MM-dd'), 'até', format(monthEnd, 'yyyy-MM-dd'));
      return calendarService.getCalendarEvents(
        monthStart.toISOString(),
        monthEnd.toISOString()
      );
    },
  });

  const handleEventCreated = () => {
    console.log('Evento criado, atualizando todas as queries...');
    refetchDay();
    refetchWeek();
    refetchMonth();
  };

  return {
    dayEvents,
    weekEvents,
    monthEvents,
    isDayLoading,
    isWeekLoading,
    isMonthLoading,
    handleEventCreated
  };
};
