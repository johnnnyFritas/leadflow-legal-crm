
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays } from 'lucide-react';
import { calendarService } from '@/services/calendarService';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { WeeklyGrid } from '@/components/agenda/WeeklyGrid';
import { DayView } from '@/components/agenda/DayView';
import { MonthView } from '@/components/agenda/MonthView';
import { NewEventModal } from '@/components/agenda/NewEventModal';

const Agenda = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');

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

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      console.log('Data selecionada no calendário lateral:', format(date, 'yyyy-MM-dd'));
      setSelectedDate(date);
    }
  };

  const handleEventCreated = () => {
    console.log('Evento criado, atualizando todas as queries...');
    refetchDay();
    refetchWeek();
    refetchMonth();
  };

  const renderViewContent = () => {
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
            onDateChange={setSelectedDate}
          />
        );
      case 'month':
        return (
          <MonthView
            selectedDate={selectedDate}
            events={monthEvents}
            onDateChange={setSelectedDate}
            isLoading={isMonthLoading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">Agenda</h2>
        <NewEventModal 
          selectedDate={selectedDate} 
          onEventCreated={handleEventCreated}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Calendário Lateral - Responsivo */}
        <Card className="xl:col-span-1 order-2 xl:order-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarDays size={20} />
              Calendário
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Calendário com responsividade melhorada */}
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                className="rounded-md border w-full max-w-none"
                locale={ptBR}
              />
            </div>
            
            {/* Botões de Visualização */}
            <div className="space-y-3">
              <div className="text-sm font-medium text-muted-foreground">Visualização</div>
              <div className="grid grid-cols-3 xl:grid-cols-1 gap-2">
                <Button 
                  variant={viewMode === 'day' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setViewMode('day')}
                  className="w-full justify-center xl:justify-start text-xs xl:text-sm"
                >
                  Dia
                </Button>
                <Button 
                  variant={viewMode === 'week' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setViewMode('week')}
                  className="w-full justify-center xl:justify-start text-xs xl:text-sm"
                >
                  Semana
                </Button>
                <Button 
                  variant={viewMode === 'month' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setViewMode('month')}
                  className="w-full justify-center xl:justify-start text-xs xl:text-sm"
                >
                  Mês
                </Button>
              </div>
            </div>

            {/* Debug Info - remover em produção */}
            <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
              <div>Modo: {viewMode}</div>
              <div>Data: {format(selectedDate, 'dd/MM/yyyy')}</div>
              <div>Eventos: {
                viewMode === 'day' ? dayEvents.length :
                viewMode === 'week' ? weekEvents.length :
                monthEvents.length
              }</div>
            </div>
          </CardContent>
        </Card>

        {/* Área Principal - Responsiva */}
        <div className="xl:col-span-3 order-1 xl:order-2">
          {renderViewContent()}
        </div>
      </div>
    </div>
  );
};

export default Agenda;
