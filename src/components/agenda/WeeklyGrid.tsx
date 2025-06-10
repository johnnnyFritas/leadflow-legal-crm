
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
    <Card className="w-full max-w-full overflow-hidden">
      <CardHeader className="pb-2 sm:pb-4">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm sm:text-lg md:text-xl truncate">
            {isMobile ? 'Semana' : 'Agenda Semanal'}
          </CardTitle>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigateWeek('prev')} 
              className="h-7 w-7 p-0 sm:h-8 sm:w-8 md:h-9 md:w-auto md:px-3"
            >
              <ChevronLeft size={isMobile ? 14 : 16} />
            </Button>
            <span className="text-[10px] sm:text-xs md:text-sm font-medium min-w-[80px] sm:min-w-[100px] md:min-w-[120px] text-center px-1">
              {format(currentWeek, "dd/MM", { locale: ptBR })} - {format(addDays(currentWeek, 6), "dd/MM/yy", { locale: ptBR })}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigateWeek('next')} 
              className="h-7 w-7 p-0 sm:h-8 sm:w-8 md:h-9 md:w-auto md:px-3"
            >
              <ChevronRight size={isMobile ? 14 : 16} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-1 sm:p-2 md:p-4 lg:p-6">
        {/* Container com scroll horizontal otimizado */}
        <div className="w-full overflow-x-auto overflow-y-hidden">
          <div className="min-w-[280px] xs:min-w-[320px] sm:min-w-[480px] md:min-w-[640px] lg:min-w-0">
            <div className="grid grid-cols-8 gap-0 border border-border rounded-lg overflow-hidden bg-background">
              {/* Header com horários */}
              <div className="p-1 sm:p-2 md:p-3 bg-muted/50 border-r border-border flex items-center justify-center min-h-[40px] sm:min-h-[50px]">
                <span className="text-[10px] sm:text-xs md:text-sm font-medium text-muted-foreground">
                  {isMobile ? 'H' : 'Hora'}
                </span>
              </div>
              
              {/* Header dos dias */}
              {weekDays.map((day) => (
                <div 
                  key={day.toISOString()} 
                  className={`p-1 sm:p-2 md:p-3 text-center border-r border-border bg-muted/50 min-w-[32px] sm:min-w-[60px] md:min-w-[80px] min-h-[40px] sm:min-h-[50px] flex flex-col justify-center ${
                    isToday(day) ? 'bg-primary/20' : ''
                  }`}
                >
                  <div className="text-[9px] sm:text-xs md:text-sm font-medium text-muted-foreground">
                    {format(day, isMobile ? "E" : "EEE", { locale: ptBR })}
                  </div>
                  <div className={`text-xs sm:text-sm md:text-lg font-semibold ${isToday(day) ? 'text-primary' : ''}`}>
                    {format(day, "dd", { locale: ptBR })}
                  </div>
                </div>
              ))}
              
              {/* Grade de horários */}
              {timeSlots.map((hour) => (
                <div key={hour} className="contents">
                  {/* Coluna de horário */}
                  <div className="p-1 sm:p-2 md:p-3 text-[9px] sm:text-xs md:text-sm font-medium text-muted-foreground border-r border-b border-border bg-muted/30 flex items-center justify-center min-h-[35px] sm:min-h-[45px] md:min-h-[60px]">
                    <span className="whitespace-nowrap">
                      {hour.toString().padStart(2, '0')}:{isMobile ? '00' : '00'}
                    </span>
                  </div>
                  
                  {/* Células dos dias */}
                  {weekDays.map((day) => {
                    const slotEvents = getEventsForSlot(day, hour);
                    const isCurrentHour = isToday(day) && new Date().getHours() === hour;
                    
                    return (
                      <div 
                        key={`${day.toISOString()}-${hour}`} 
                        className={`min-h-[35px] sm:min-h-[45px] md:min-h-[60px] p-0.5 sm:p-1 border-r border-b border-border relative hover:bg-muted/50 cursor-pointer transition-colors min-w-[32px] sm:min-w-[60px] md:min-w-[80px] ${
                          isCurrentHour ? 'bg-primary/10' : ''
                        }`}
                        onClick={() => onDateChange(day)}
                      >
                        <div className="h-full w-full flex flex-col gap-0.5">
                          {slotEvents.map((event) => (
                            <div 
                              key={event.id} 
                              className="bg-primary text-primary-foreground text-[8px] sm:text-[10px] md:text-xs p-0.5 sm:p-1 rounded truncate leading-tight flex-shrink-0"
                              title={event.summary}
                            >
                              <span className="block truncate">
                                {isMobile ? event.summary.slice(0, 8) + (event.summary.length > 8 ? '...' : '') : event.summary}
                              </span>
                            </div>
                          ))}
                          {slotEvents.length === 0 && (
                            <div className="text-[8px] sm:text-[10px] md:text-xs text-muted-foreground opacity-0 hover:opacity-100 transition-opacity p-0.5 sm:p-1 h-full flex items-center justify-center">
                              {!isMobile && 'Livre'}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Dica de scroll melhorada */}
        <div className="mt-2 text-[10px] sm:text-xs text-muted-foreground text-center md:hidden">
          ← Deslize horizontalmente para navegar →
        </div>
      </CardContent>
    </Card>
  );
};
