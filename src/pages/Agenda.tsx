
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
import { useIsMobile } from '@/hooks/use-mobile';

const Agenda = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const isMobile = useIsMobile();

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
    <div className="space-y-4 p-3 sm:p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Agenda</h2>
        <NewEventModal 
          selectedDate={selectedDate} 
          onEventCreated={handleEventCreated}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
        {/* Calendário Lateral - Melhor responsividade */}
        <Card className="lg:col-span-1 xl:col-span-1 order-2 lg:order-1">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <CalendarDays size={isMobile ? 18 : 20} />
              <span className="hidden sm:inline">Calendário</span>
              <span className="sm:hidden">Cal</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">
            {/* Calendário com melhor responsividade */}
            <div className="flex justify-center">
              <div className="w-full max-w-[280px] sm:max-w-none">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  className="rounded-md border w-full"
                  locale={ptBR}
                />
              </div>
            </div>
            
            {/* Botões de Visualização - Layout melhorado para mobile */}
            <div className="space-y-2 sm:space-y-3">
              <div className="text-xs sm:text-sm font-medium text-muted-foreground">
                {isMobile ? 'Ver' : 'Visualização'}
              </div>
              <div className="grid grid-cols-3 lg:grid-cols-1 gap-1 sm:gap-2">
                <Button 
                  variant={viewMode === 'day' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setViewMode('day')}
                  className="w-full justify-center lg:justify-start text-xs sm:text-sm h-8 sm:h-9"
                >
                  Dia
                </Button>
                <Button 
                  variant={viewMode === 'week' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setViewMode('week')}
                  className="w-full justify-center lg:justify-start text-xs sm:text-sm h-8 sm:h-9"
                >
                  Semana
                </Button>
                <Button 
                  variant={viewMode === 'month' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setViewMode('month')}
                  className="w-full justify-center lg:justify-start text-xs sm:text-sm h-8 sm:h-9"
                >
                  Mês
                </Button>
              </div>
            </div>

            {/* Debug Info - mais compacto em mobile */}
            <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-1 lg:gap-0">
                <div>Modo: {viewMode}</div>
                <div>Data: {format(selectedDate, isMobile ? 'dd/MM' : 'dd/MM/yyyy')}</div>
                <div className="col-span-2 lg:col-span-1">
                  Eventos: {
                    viewMode === 'day' ? dayEvents.length :
                    viewMode === 'week' ? weekEvents.length :
                    monthEvents.length
                  }
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Área Principal - Responsiva com overflow controlado */}
        <div className="lg:col-span-3 xl:col-span-4 order-1 lg:order-2 min-w-0 overflow-hidden">
          {renderViewContent()}
        </div>
      </div>
    </div>
  );
};

export default Agenda;
