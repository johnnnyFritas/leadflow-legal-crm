
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addWeeks, subWeeks, startOfWeek, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GoogleCalendarEvent } from '@/types/supabase';

interface WeeklyGridProps {
  selectedDate: Date;
  events: GoogleCalendarEvent[];
  onDateChange: (date: Date) => void;
}

export const WeeklyGrid = ({ selectedDate, events, onDateChange }: WeeklyGridProps) => {
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(selectedDate, { weekStartsOn: 1 }));

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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Agenda Semanal</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
              <ChevronLeft size={16} />
            </Button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {format(currentWeek, "dd/MM", { locale: ptBR })} - {format(addDays(currentWeek, 6), "dd/MM/yyyy", { locale: ptBR })}
            </span>
            <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-8 gap-0 border border-border rounded-lg overflow-hidden">
          {/* Header com horários */}
          <div className="p-3 bg-muted/50 border-r border-border"></div>
          {weekDays.map((day) => (
            <div 
              key={day.toISOString()} 
              className={`p-3 text-center border-r border-border bg-muted/50 ${
                isToday(day) ? 'bg-primary/20' : ''
              }`}
            >
              <div className="text-xs font-medium text-muted-foreground">
                {format(day, "EEE", { locale: ptBR })}
              </div>
              <div className={`text-lg font-semibold ${isToday(day) ? 'text-primary' : ''}`}>
                {format(day, "dd", { locale: ptBR })}
              </div>
            </div>
          ))}
          
          {/* Grade de horários */}
          {timeSlots.map((hour) => (
            <div key={hour} className="contents">
              <div className="p-3 text-sm font-medium text-muted-foreground border-r border-b border-border bg-muted/30">
                {hour.toString().padStart(2, '0')}:00
              </div>
              {weekDays.map((day) => {
                const slotEvents = getEventsForSlot(day, hour);
                const isCurrentHour = isToday(day) && new Date().getHours() === hour;
                
                return (
                  <div 
                    key={`${day.toISOString()}-${hour}`} 
                    className={`min-h-[60px] p-1 border-r border-b border-border relative hover:bg-muted/50 cursor-pointer transition-colors ${
                      isCurrentHour ? 'bg-primary/10' : ''
                    }`}
                    onClick={() => onDateChange(day)}
                  >
                    {slotEvents.map((event) => (
                      <div 
                        key={event.id} 
                        className="bg-primary text-primary-foreground text-xs p-1 rounded mb-1 truncate"
                        title={event.summary}
                      >
                        {event.summary}
                      </div>
                    ))}
                    {slotEvents.length === 0 && (
                      <div className="text-xs text-muted-foreground opacity-0 hover:opacity-100 transition-opacity">
                        Disponível
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
