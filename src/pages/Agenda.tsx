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
import { cn } from '@/lib/utils';

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
    <div className="space-y-3 sm:space-y-4 p-1 sm:p-2 lg:p-4 xl:p-6 min-h-screen overflow-x-hidden">
      {/* Header - Melhor responsividade */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
        <h2 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold tracking-tight">Agenda</h2>
        <div className="w-full sm:w-auto">
          <NewEventModal 
            selectedDate={selectedDate} 
            onEventCreated={handleEventCreated}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4 xl:gap-6">
        {/* Calendário Lateral - Responsivo e adaptável */}
        <Card className="lg:col-span-3 xl:col-span-1 order-2 lg:order-1 w-full min-w-0">
          <CardHeader className="pb-1 sm:pb-2 lg:pb-3 px-2 sm:px-3 lg:px-6 pt-2 sm:pt-3 lg:pt-6">
            <CardTitle className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm lg:text-base xl:text-lg">
              <CalendarDays size={isMobile ? 14 : 16} />
              <span>
                {isMobile ? 'Cal' : 'Calendário'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-3 px-2 sm:px-3 lg:px-6 pb-2 sm:pb-3 lg:pb-6">
            {/* Calendário compacto e responsivo */}
            <div className="flex justify-center w-full">
              <div className="w-full max-w-[240px] sm:max-w-[260px] lg:max-w-none">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  className="rounded-md border w-full"
                  locale={ptBR}
                />
              </div>
            </div>
            
            {/* Botões de Visualização responsivos */}
            <div className="space-y-1 sm:space-y-2">
              <div className="text-[10px] sm:text-xs lg:text-sm font-medium text-muted-foreground">
                Visualização
              </div>
              <div className="flex flex-col gap-1">
                <Button 
                  variant={viewMode === 'day' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setViewMode('day')}
                  className="w-full justify-center lg:justify-start text-[10px] sm:text-xs lg:text-sm h-6 sm:h-7 lg:h-8"
                >
                  Dia
                </Button>
                <Button 
                  variant={viewMode === 'week' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setViewMode('week')}
                  className="w-full justify-center lg:justify-start text-[10px] sm:text-xs lg:text-sm h-6 sm:h-7 lg:h-8"
                >
                  Semana
                </Button>
                <Button 
                  variant={viewMode === 'month' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setViewMode('month')}
                  className="w-full justify-center lg:justify-start text-[10px] sm:text-xs lg:text-sm h-6 sm:h-7 lg:h-8"
                >
                  Mês
                </Button>
              </div>
            </div>

            {/* Debug Info compacto */}
            <div className="text-[9px] sm:text-xs text-muted-foreground bg-muted/30 p-1 sm:p-2 rounded-md">
              <div className="space-y-0.5 sm:space-y-1">
                <div className="flex justify-between">
                  <span>Modo:</span>
                  <span className="font-medium">{viewMode}</span>
                </div>
                <div className="flex justify-between">
                  <span>Data:</span>
                  <span className="font-medium">
                    {format(selectedDate, isMobile ? 'dd/MM' : 'dd/MM/yyyy')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Eventos:</span>
                  <span className="font-medium">
                    {viewMode === 'day' ? dayEvents.length :
                     viewMode === 'week' ? weekEvents.length :
                     monthEvents.length}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Área Principal - Sem overflow e completamente responsiva */}
        <div className="lg:col-span-9 xl:col-span-4 order-1 lg:order-2 min-w-0 w-full overflow-hidden">
          <div className="w-full">
            {renderViewContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Agenda;
