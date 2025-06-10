
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameMonth, isSameDay, isToday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GoogleCalendarEvent } from '@/types/supabase';
import { useState } from 'react';

interface MonthViewProps {
  selectedDate: Date;
  events: GoogleCalendarEvent[];
  onDateChange: (date: Date) => void;
  isLoading?: boolean;
}

export const MonthView = ({ selectedDate, events, onDateChange, isLoading }: MonthViewProps) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  // Criar grade completa do calendário (42 dias - 6 semanas)
  const startDate = new Date(monthStart);
  const dayOfWeek = startDate.getDay(); // 0 = domingo
  startDate.setDate(startDate.getDate() - dayOfWeek);
  
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 41); // 42 dias total
  
  const allDays = eachDayOfInterval({ start: startDate, end: endDate });

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = direction === 'prev' ? subMonths(currentMonth, 1) : addMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
  };

  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      if (!event.start?.dateTime) return false;
      try {
        const eventDate = parseISO(event.start.dateTime);
        return isSameDay(eventDate, day);
      } catch (error) {
        console.warn('Erro ao parsear data do evento:', event.start.dateTime);
        return false;
      }
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Carregando agenda do mês...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon size={20} />
            <span className="capitalize">
              {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
            </span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
              <ChevronLeft size={16} />
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-0 border border-border rounded-lg overflow-hidden">
          {/* Cabeçalho dos dias da semana */}
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
            <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground bg-muted/50 border-r border-b border-border last:border-r-0">
              {day}
            </div>
          ))}
          
          {/* Dias do mês */}
          {allDays.map((day, index) => {
            const dayEvents = getEventsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = isSameDay(day, selectedDate);
            const isTodayDate = isToday(day);

            return (
              <div
                key={index}
                className={`
                  min-h-[80px] sm:min-h-[100px] p-1 sm:p-2 border-r border-b border-border cursor-pointer hover:bg-muted/50 transition-colors last:border-r-0
                  ${!isCurrentMonth ? 'text-muted-foreground bg-muted/20' : ''}
                  ${isSelected ? 'bg-primary/20 border-primary shadow-sm' : ''}
                  ${isTodayDate ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300' : ''}
                `}
                onClick={() => onDateChange(day)}
              >
                <div className={`
                  text-sm font-medium mb-1 flex items-center justify-center w-6 h-6 rounded-full
                  ${isTodayDate ? 'bg-blue-600 text-white' : ''}
                  ${isSelected && !isTodayDate ? 'bg-primary text-primary-foreground' : ''}
                `}>
                  {format(day, 'd')}
                </div>
                
                {/* Lista de eventos */}
                <div className="space-y-1 overflow-hidden">
                  {dayEvents.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      className="text-xs p-1 bg-primary text-primary-foreground rounded truncate leading-tight"
                      title={`${event.summary} - ${event.start?.dateTime ? format(parseISO(event.start.dateTime), 'HH:mm') : ''}`}
                    >
                      {event.summary}
                    </div>
                  ))}
                  
                  {/* Indicador de mais eventos */}
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-muted-foreground font-medium">
                      +{dayEvents.length - 2} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Debug info - pode ser removido em produção */}
        <div className="mt-4 text-xs text-muted-foreground bg-muted/30 p-2 rounded">
          Total de eventos no mês: {events.length} | 
          Data selecionada: {format(selectedDate, 'dd/MM/yyyy')} |
          Mês atual: {format(currentMonth, 'MM/yyyy')}
        </div>
      </CardContent>
    </Card>
  );
};
