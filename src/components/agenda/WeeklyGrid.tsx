
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addWeeks, subWeeks, startOfWeek, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GoogleCalendarEvent } from '@/types/supabase';
import { useIsMobile } from '@/hooks/use-mobile';

interface WeeklyGridProps {
  selectedDate: Date;
  events: GoogleCalendarEvent[];
  onDateChange: (date: Date) => void;
}

export const WeeklyGrid = ({ selectedDate, events, onDateChange }: WeeklyGridProps) => {
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(selectedDate, { weekStartsOn: 1 }));
  const isMobile = useIsMobile();

  const timeSlots = Array.from({ length: 11 }, (_, i) => i + 8); // 8:00 às 18:00
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = direction === 'prev' ? subWeeks(currentWeek, 1) : addWeeks(currentWeek, 1);
    setCurrentWeek(newWeek);
    onDateChange(newWeek);
  };

  const getEventsForSlot = (day: Date, hour: number) => {
    return events.filter(event => {
      const eventDate = new Date(event.start.dateTime);
      return (
        format(eventDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd') &&
        eventDate.getHours() === hour
      );
    });
  };

  const isToday = (date: Date) => {
    return format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3 sm:pb-4">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg sm:text-xl truncate">
            {isMobile ? 'Semana' : 'Agenda Semanal'}
          </CardTitle>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')} className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3">
              <ChevronLeft size={16} />
            </Button>
            <span className="text-xs sm:text-sm font-medium min-w-[100px] sm:min-w-[120px] text-center px-1 sm:px-2">
              {format(currentWeek, "dd/MM", { locale: ptBR })} - {format(addDays(currentWeek, 6), "dd/MM/yy", { locale: ptBR })}
            </span>
            <Button variant="outline" size="sm" onClick={() => navigateWeek('next')} className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3">
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-2 sm:p-6">
        {/* Container com scroll horizontal para telas pequenas */}
        <div className="overflow-x-auto">
          <div className="min-w-[640px] lg:min-w-0">
            <div className="grid grid-cols-8 gap-0 border border-border rounded-lg overflow-hidden">
              {/* Header com horários */}
              <div className="p-2 sm:p-3 bg-muted/50 border-r border-border flex items-center justify-center">
                <span className="text-xs sm:text-sm font-medium text-muted-foreground">Hora</span>
              </div>
              {weekDays.map((day) => (
                <div 
                  key={day.toISOString()} 
                  className={`p-2 sm:p-3 text-center border-r border-border bg-muted/50 min-w-[80px] ${
                    isToday(day) ? 'bg-primary/20' : ''
                  }`}
                >
                  <div className="text-xs font-medium text-muted-foreground">
                    {format(day, isMobile ? "EE" : "EEE", { locale: ptBR })}
                  </div>
                  <div className={`text-sm sm:text-lg font-semibold ${isToday(day) ? 'text-primary' : ''}`}>
                    {format(day, "dd", { locale: ptBR })}
                  </div>
                </div>
              ))}
              
              {/* Grade de horários */}
              {timeSlots.map((hour) => (
                <div key={hour} className="contents">
                  <div className="p-2 sm:p-3 text-xs sm:text-sm font-medium text-muted-foreground border-r border-b border-border bg-muted/30 flex items-center justify-center">
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                  {weekDays.map((day) => {
                    const slotEvents = getEventsForSlot(day, hour);
                    const isCurrentHour = isToday(day) && new Date().getHours() === hour;
                    
                    return (
                      <div 
                        key={`${day.toISOString()}-${hour}`} 
                        className={`min-h-[50px] sm:min-h-[60px] p-1 border-r border-b border-border relative hover:bg-muted/50 cursor-pointer transition-colors min-w-[80px] ${
                          isCurrentHour ? 'bg-primary/10' : ''
                        }`}
                        onClick={() => onDateChange(day)}
                      >
                        {slotEvents.map((event) => (
                          <div 
                            key={event.id} 
                            className="bg-primary text-primary-foreground text-xs p-1 rounded mb-1 truncate leading-tight"
                            title={event.summary}
                          >
                            {event.summary}
                          </div>
                        ))}
                        {slotEvents.length === 0 && (
                          <div className="text-xs text-muted-foreground opacity-0 hover:opacity-100 transition-opacity p-1">
                            Livre
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Dica de scroll para mobile */}
        {isMobile && (
          <div className="mt-2 text-xs text-muted-foreground text-center">
            ← Deslize para ver mais →
          </div>
        )}
      </CardContent>
    </Card>
  );
};
