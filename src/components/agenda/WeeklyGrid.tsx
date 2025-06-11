
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

  // Responsive sizing based on screen size
  const getResponsiveSizes = () => {
    if (isMobile) {
      return {
        cellWidth: 'w-8',
        cellHeight: 'h-8',
        textSize: 'text-[8px]',
        headerHeight: 'h-10',
        timeWidth: 'w-10',
        eventText: 'text-[7px]',
        padding: 'p-0.5',
        gap: 'gap-0'
      };
    } else if (isTablet) {
      return {
        cellWidth: 'w-12',
        cellHeight: 'h-10',
        textSize: 'text-xs',
        headerHeight: 'h-12',
        timeWidth: 'w-12',
        eventText: 'text-[9px]',
        padding: 'p-1',
        gap: 'gap-0.5'
      };
    } else {
      return {
        cellWidth: 'w-16',
        cellHeight: 'h-12',
        textSize: 'text-sm',
        headerHeight: 'h-14',
        timeWidth: 'w-16',
        eventText: 'text-xs',
        padding: 'p-2',
        gap: 'gap-1'
      };
    }
  };

  const sizes = getResponsiveSizes();

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="pb-2 sm:pb-4">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className={`${isMobile ? 'text-sm' : isTablet ? 'text-base' : 'text-lg'} truncate`}>
            {isMobile ? 'Semana' : 'Agenda Semanal'}
          </CardTitle>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigateWeek('prev')} 
              className={`${isMobile ? 'h-6 w-6 p-0' : isTablet ? 'h-7 w-7 p-0' : 'h-8 w-8 p-0'}`}
            >
              <ChevronLeft size={isMobile ? 12 : isTablet ? 14 : 16} />
            </Button>
            <span className={`${isMobile ? 'text-[9px] min-w-[60px]' : isTablet ? 'text-xs min-w-[80px]' : 'text-sm min-w-[100px]'} font-medium text-center px-1`}>
              {format(currentWeek, "dd/MM", { locale: ptBR })} - {format(addDays(currentWeek, 6), "dd/MM/yy", { locale: ptBR })}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigateWeek('next')} 
              className={`${isMobile ? 'h-6 w-6 p-0' : isTablet ? 'h-7 w-7 p-0' : 'h-8 w-8 p-0'}`}
            >
              <ChevronRight size={isMobile ? 12 : isTablet ? 14 : 16} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className={`${sizes.padding}`}>
        {/* Container responsivo sem scroll forçado */}
        <div className="w-full overflow-auto">
          <div className={`${isMobile ? 'min-w-[300px]' : isTablet ? 'min-w-[500px]' : 'w-full'}`}>
            {/* Grid com fr units para responsividade */}
            <div className={`grid grid-cols-8 ${sizes.gap} border border-border rounded-lg overflow-hidden bg-background`} style={{
              gridTemplateColumns: isMobile ? '40px repeat(7, 1fr)' : isTablet ? '60px repeat(7, 1fr)' : '80px repeat(7, 1fr)'
            }}>
              {/* Header com horários */}
              <div className={`${sizes.padding} bg-muted/50 border-r border-border flex items-center justify-center ${sizes.headerHeight}`}>
                <span className={`${sizes.textSize} font-medium text-muted-foreground`}>
                  {isMobile ? 'H' : 'Hora'}
                </span>
              </div>
              
              {/* Header dos dias */}
              {weekDays.map((day) => (
                <div 
                  key={day.toISOString()} 
                  className={`${sizes.padding} text-center border-r border-border bg-muted/50 ${sizes.headerHeight} flex flex-col justify-center ${
                    isToday(day) ? 'bg-primary/20' : ''
                  }`}
                >
                  <div className={`${isMobile ? 'text-[7px]' : isTablet ? 'text-[10px]' : 'text-xs'} font-medium text-muted-foreground`}>
                    {format(day, isMobile ? "E" : "EEE", { locale: ptBR })}
                  </div>
                  <div className={`${isMobile ? 'text-[9px]' : isTablet ? 'text-xs' : 'text-sm'} font-semibold ${isToday(day) ? 'text-primary' : ''}`}>
                    {format(day, "dd", { locale: ptBR })}
                  </div>
                </div>
              ))}
              
              {/* Grade de horários */}
              {timeSlots.map((hour) => (
                <div key={hour} className="contents">
                  {/* Coluna de horário */}
                  <div className={`${sizes.padding} ${sizes.textSize} font-medium text-muted-foreground border-r border-b border-border bg-muted/30 flex items-center justify-center ${sizes.cellHeight}`}>
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
                        className={`${sizes.cellHeight} ${sizes.padding} border-r border-b border-border relative hover:bg-muted/50 cursor-pointer transition-colors ${
                          isCurrentHour ? 'bg-primary/10' : ''
                        }`}
                        onClick={() => onDateChange(day)}
                      >
                        <div className={`h-full w-full flex flex-col ${sizes.gap}`}>
                          {slotEvents.map((event) => (
                            <div 
                              key={event.id} 
                              className={`bg-primary text-primary-foreground ${sizes.eventText} ${sizes.padding} rounded truncate leading-tight flex-shrink-0`}
                              title={event.summary}
                            >
                              <span className="block truncate">
                                {isMobile ? 
                                  event.summary.slice(0, 4) + (event.summary.length > 4 ? '...' : '') : 
                                  isTablet ?
                                  event.summary.slice(0, 8) + (event.summary.length > 8 ? '...' : '') :
                                  event.summary
                                }
                              </span>
                            </div>
                          ))}
                          {slotEvents.length === 0 && (
                            <div className={`${sizes.eventText} text-muted-foreground opacity-0 hover:opacity-100 transition-opacity ${sizes.padding} h-full flex items-center justify-center`}>
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
        {(isMobile || isTablet) && (
          <div className={`mt-2 ${isMobile ? 'text-[9px]' : 'text-xs'} text-muted-foreground text-center`}>
            ← Deslize horizontalmente para navegar →
          </div>
        )}
      </CardContent>
    </Card>
  );
};
