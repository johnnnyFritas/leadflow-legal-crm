
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays } from 'lucide-react';
import { calendarService } from '@/services/calendarService';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { WeeklyGrid } from '@/components/agenda/WeeklyGrid';
import { DayView } from '@/components/agenda/DayView';
import { NewEventModal } from '@/components/agenda/NewEventModal';

const Agenda = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');

  // Query para eventos do dia selecionado
  const { data: dayEvents = [], isLoading: isDayLoading, refetch: refetchDay } = useQuery({
    queryKey: ['calendar-events-day', format(selectedDate, 'yyyy-MM-dd')],
    queryFn: () => calendarService.getCalendarEvents(
      startOfDay(selectedDate).toISOString(),
      endOfDay(selectedDate).toISOString()
    ),
  });

  // Query para eventos da semana
  const { data: weekEvents = [], isLoading: isWeekLoading, refetch: refetchWeek } = useQuery({
    queryKey: ['calendar-events-week', format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd')],
    queryFn: () => {
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
      return calendarService.getCalendarEvents(
        weekStart.toISOString(),
        weekEnd.toISOString()
      );
    },
  });

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleEventCreated = () => {
    refetchDay();
    refetchWeek();
  };

  const renderViewContent = () => {
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
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">
                Visualização mensal em desenvolvimento
              </div>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Agenda</h2>
        <NewEventModal 
          selectedDate={selectedDate} 
          onEventCreated={handleEventCreated}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendário Lateral */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays size={20} />
              Calendário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              className="rounded-md border"
              locale={ptBR}
            />
            
            {/* Botões de Visualização */}
            <div className="mt-4 space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Visualização</div>
              <div className="flex flex-col gap-1">
                <Button 
                  variant={viewMode === 'day' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setViewMode('day')}
                  className="w-full justify-start"
                >
                  Dia
                </Button>
                <Button 
                  variant={viewMode === 'week' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setViewMode('week')}
                  className="w-full justify-start"
                >
                  Semana
                </Button>
                <Button 
                  variant={viewMode === 'month' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setViewMode('month')}
                  className="w-full justify-start"
                >
                  Mês
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Área Principal */}
        <div className="lg:col-span-3">
          {renderViewContent()}
        </div>
      </div>
    </div>
  );
};

export default Agenda;
