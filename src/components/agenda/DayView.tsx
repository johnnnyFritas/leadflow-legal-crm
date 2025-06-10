
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GoogleCalendarEvent } from '@/types/supabase';

interface DayViewProps {
  selectedDate: Date;
  events: GoogleCalendarEvent[];
  isLoading?: boolean;
}

export const DayView = ({ selectedDate, events, isLoading }: DayViewProps) => {
  const timeSlots = Array.from({ length: 11 }, (_, i) => i + 8); // 8:00 às 18:00

  const getEventsForTime = (hour: number) => {
    return events.filter(event => {
      const eventStart = parseISO(event.start.dateTime);
      return eventStart.getHours() === hour;
    });
  };

  const formatEventTime = (event: GoogleCalendarEvent) => {
    const start = format(parseISO(event.start.dateTime), "HH:mm", { locale: ptBR });
    const end = format(parseISO(event.end.dateTime), "HH:mm", { locale: ptBR });
    return `${start} - ${end}`;
  };

  if (isLoading) {
    return (
      <Card className="lg:col-span-3">
        <CardContent className="flex items-center justify-center h-64">
          <div>Carregando agenda...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock size={20} />
          {format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {timeSlots.map((hour) => {
            const slotEvents = getEventsForTime(hour);
            const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
            
            return (
              <div key={hour} className="flex items-start gap-4 py-3 border-b border-border/50 last:border-b-0">
                <div className="w-16 text-sm text-muted-foreground font-medium">
                  {timeSlot}
                </div>
                <div className="flex-1">
                  {slotEvents.length > 0 ? (
                    <div className="space-y-2">
                      {slotEvents.map((event) => (
                        <div
                          key={event.id}
                          className="p-3 bg-primary/10 border border-primary/20 rounded-md hover:bg-primary/15 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{event.summary}</h4>
                            <Badge variant="outline">
                              {formatEventTime(event)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground italic py-2">
                      Horário disponível
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
