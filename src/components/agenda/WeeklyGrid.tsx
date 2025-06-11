
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addWeeks, subWeeks, startOfWeek, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GoogleCalendarEvent } from '@/types/supabase';
import { useIsMobile } from '@/hooks/use-mobile';
import { useIsTablet } from '@/hooks/use-tablet';

interface WeeklyGridProps {
  selectedDate: Date;
  events: GoogleCalendarEvent[];
  onDateChange: (date: Date) => void;
}

export const WeeklyGrid = ({ selectedDate, events, onDateChange }: WeeklyGridProps) => {
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(selectedDate, { weekStartsOn: 1 }));
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

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

  if (isMobile) {
    // Layout vertical empilhado para mobile
    return (
      <div className="w-full max-w-full overflow-hidden">
        <Card className="w-full">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-sm truncate">Agenda Semanal</CardTitle>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigateWeek('prev')} 
                  className="h-6 w-6 p-0"
                >
                  <ChevronLeft size={12} />
                </Button>
                <span className="text-[9px] min-w-[60px] font-medium text-center px-1">
                  {format(currentWeek, "dd/MM", { locale: ptBR })} - {format(addDays(currentWeek, 6), "dd/MM/yy", { locale: ptBR })}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigateWeek('next')} 
                  className="h-6 w-6 p-0"
                >
                  <ChevronRight size={12} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-2">
            <div className="space-y-2 w-full">
              {weekDays.map((day) => (
                <div key={day.toISOString()} className="border border-border rounded-lg overflow-hidden w-full">
                  {/* Header do dia */}
                  <div className={`p-2 text-center bg-muted/50 ${isToday(day) ? 'bg-primary/20' : ''}`}>
                    <div className="text-[10px] font-medium text-muted-foreground">
                      {format(day, "EEEE", { locale: ptBR })}
                    </div>
                    <div className={`text-sm font-semibold ${isToday(day) ? 'text-primary' : ''}`}>
                      {format(day, "dd/MM", { locale: ptBR })}
                    </div>
                  </div>
                  
                  {/* Horários do dia */}
                  <div className="divide-y divide-border w-full">
                    {timeSlots.map((hour) => {
                      const slotEvents = getEventsForSlot(day, hour);
                      const isCurrentHour = isToday(day) && new Date().getHours() === hour;
                      
                      return (
                        <div 
                          key={`${day.toISOString()}-${hour}`} 
                          className={`p-2 flex items-center gap-2 hover:bg-muted/50 cursor-pointer transition-colors w-full ${
                            isCurrentHour ? 'bg-primary/10' : ''
                          }`}
                          onClick={() => onDateChange(day)}
                        >
                          <div className="text-xs font-medium text-muted-foreground w-12 flex-shrink-0">
                            {hour.toString().padStart(2, '0')}:00
                          </div>
                          <div className="flex-1 min-w-0">
                            {slotEvents.length > 0 ? (
                              slotEvents.map((event) => (
                                <div 
                                  key={event.id} 
                                  className="bg-primary text-primary-foreground text-[10px] p-1 rounded truncate"
                                  title={event.summary}
                                >
                                  {event.summary.slice(0, 15) + (event.summary.length > 15 ? '...' : '')}
                                </div>
                              ))
                            ) : (
                              <div className="text-xs text-muted-foreground opacity-50">
                                Livre
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Layout original para tablet e desktop com scroll horizontal controlado
  return (
    <div className="w-full max-w-full overflow-hidden">
      <Card className="w-full">
        <CardHeader className="pb-2 sm:pb-4">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className={`${isTablet ? 'text-base' : 'text-lg'} truncate`}>
              Agenda Semanal
            </CardTitle>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigateWeek('prev')} 
                className={`${isTablet ? 'h-7 w-7 p-0' : 'h-8 w-8 p-0'}`}
              >
                <ChevronLeft size={isTablet ? 14 : 16} />
              </Button>
              <span className={`${isTablet ? 'text-xs min-w-[80px]' : 'text-sm min-w-[100px]'} font-medium text-center px-1`}>
                {format(currentWeek, "dd/MM", { locale: ptBR })} - {format(addDays(currentWeek, 6), "dd/MM/yy", { locale: ptBR })}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigateWeek('next')} 
                className={`${isTablet ? 'h-7 w-7 p-0' : 'h-8 w-8 p-0'}`}
              >
                <ChevronRight size={isTablet ? 14 : 16} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-2 sm:p-4">
          <div className="w-full overflow-x-auto">
            <div className={`${isTablet ? 'min-w-[600px]' : 'min-w-[800px]'} w-full`}>
              <div className="grid grid-cols-8 gap-0 border border-border rounded-lg overflow-hidden bg-background" style={{
                gridTemplateColumns: isTablet ? '60px repeat(7, 1fr)' : '80px repeat(7, 1fr)'
              }}>
                {/* Header com horários */}
                <div className={`p-2 bg-muted/50 border-r border-border flex items-center justify-center h-12`}>
                  <span className={`${isTablet ? 'text-xs' : 'text-sm'} font-medium text-muted-foreground`}>
                    Hora
                  </span>
                </div>
                
                {/* Header dos dias */}
                {weekDays.map((day) => (
                  <div 
                    key={day.toISOString()} 
                    className={`p-2 text-center border-r border-border bg-muted/50 h-12 flex flex-col justify-center ${
                      isToday(day) ? 'bg-primary/20' : ''
                    }`}
                  >
                    <div className={`${isTablet ? 'text-[10px]' : 'text-xs'} font-medium text-muted-foreground`}>
                      {format(day, "EEE", { locale: ptBR })}
                    </div>
                    <div className={`${isTablet ? 'text-xs' : 'text-sm'} font-semibold ${isToday(day) ? 'text-primary' : ''}`}>
                      {format(day, "dd", { locale: ptBR })}
                    </div>
                  </div>
                ))}
                
                {/* Grade de horários */}
                {timeSlots.map((hour) => (
                  <div key={hour} className="contents">
                    {/* Coluna de horário */}
                    <div className={`p-2 ${isTablet ? 'text-xs' : 'text-sm'} font-medium text-muted-foreground border-r border-b border-border bg-muted/30 flex items-center justify-center h-10`}>
                      <span className="whitespace-nowrap">
                        {hour.toString().padStart(2, '0')}:00
                      </span>
                    </div>
                    
                    {/* Células dos dias */}
                    {weekDays.map((day) => {
                      const slotEvents = getEventsForSlot(day, hour);
                      const isCurrentHour = isToday(day) && new Date().getHours() === hour;
                      
                      return (
                        <div 
                          key={`${day.toISOString()}-${hour}`} 
                          className={`h-10 p-1 border-r border-b border-border relative hover:bg-muted/50 cursor-pointer transition-colors ${
                            isCurrentHour ? 'bg-primary/10' : ''
                          }`}
                          onClick={() => onDateChange(day)}
                        >
                          <div className="h-full w-full flex flex-col gap-0.5 overflow-hidden">
                            {slotEvents.map((event) => (
                              <div 
                                key={event.id} 
                                className={`bg-primary text-primary-foreground ${isTablet ? 'text-[8px]' : 'text-xs'} p-1 rounded truncate leading-tight flex-shrink-0`}
                                title={event.summary}
                              >
                                <span className="block truncate">
                                  {isTablet ?
                                    event.summary.slice(0, 6) + (event.summary.length > 6 ? '...' : '') :
                                    event.summary.slice(0, 10) + (event.summary.length > 10 ? '...' : '')
                                  }
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Dica de scroll para tablet */}
          {isTablet && (
            <div className="mt-2 text-xs text-muted-foreground text-center">
              ← Deslize horizontalmente para navegar →
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
