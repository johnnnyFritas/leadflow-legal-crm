
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { calendarService } from '@/services/calendarService';
import { GoogleCalendarEvent } from '@/types/supabase';
import { format, parseISO, startOfDay, endOfDay, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Agenda = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['calendar-events', format(selectedDate, 'yyyy-MM-dd')],
    queryFn: () => calendarService.getCalendarEvents(
      startOfDay(selectedDate).toISOString(),
      endOfDay(selectedDate).toISOString()
    ),
  });

  const { data: weekEvents = [] } = useQuery({
    queryKey: ['week-events', format(currentWeek, 'yyyy-MM-dd')],
    queryFn: () => {
      const weekStart = startOfDay(currentWeek);
      const weekEnd = endOfDay(addDays(currentWeek, 6));
      return calendarService.getCalendarEvents(
        weekStart.toISOString(),
        weekEnd.toISOString()
      );
    },
  });

  const formatEventTime = (event: GoogleCalendarEvent) => {
    const start = format(parseISO(event.start.dateTime), "HH:mm", { locale: ptBR });
    const end = format(parseISO(event.end.dateTime), "HH:mm", { locale: ptBR });
    return `${start} - ${end}`;
  };

  const getTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 17; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  };

  const getEventsForTime = (timeSlot: string) => {
    const [hour] = timeSlot.split(':').map(Number);
    return events.filter(event => {
      const eventStart = parseISO(event.start.dateTime);
      return eventStart.getHours() === hour;
    });
  };

  const getWeekDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(currentWeek, i));
    }
    return days;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentWeek(subDays(currentWeek, 7));
    } else {
      setCurrentWeek(addDays(currentWeek, 7));
    }
  };

  const weekDays = getWeekDays();
  const timeSlots = getTimeSlots();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Agenda</h2>
        <Button>
          <Plus size={16} className="mr-2" />
          Novo Agendamento
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendário */}
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
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
              locale={ptBR}
            />
          </CardContent>
        </Card>

        {/* Visualização da agenda */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock size={20} />
                {format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">Dia</Button>
                <Button variant="outline" size="sm">Semana</Button>
                <Button variant="outline" size="sm">Mês</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div>Carregando agenda...</div>
              </div>
            ) : (
              <div className="space-y-2">
                {timeSlots.map((timeSlot) => {
                  const slotEvents = getEventsForTime(timeSlot);
                  return (
                    <div key={timeSlot} className="flex items-start gap-4 py-2 border-b border-border/50">
                      <div className="w-16 text-sm text-muted-foreground font-medium">
                        {timeSlot}
                      </div>
                      <div className="flex-1">
                        {slotEvents.length > 0 ? (
                          <div className="space-y-2">
                            {slotEvents.map((event) => (
                              <div
                                key={event.id}
                                className="p-3 bg-primary/10 border border-primary/20 rounded-md"
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
                          <div className="text-sm text-muted-foreground italic">
                            Horário disponível
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Visualização semanal */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Visão Semanal</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
                <ChevronLeft size={16} />
              </Button>
              <span className="text-sm font-medium">
                {format(currentWeek, "dd/MM", { locale: ptBR })} - {format(addDays(currentWeek, 6), "dd/MM/yyyy", { locale: ptBR })}
              </span>
              <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-8 gap-2">
            <div className="p-2"></div>
            {weekDays.map((day) => (
              <div key={day.toISOString()} className="p-2 text-center border-b border-border">
                <div className="text-sm font-medium">
                  {format(day, "EEE", { locale: ptBR })}
                </div>
                <div className="text-lg">
                  {format(day, "dd", { locale: ptBR })}
                </div>
              </div>
            ))}
            
            {timeSlots.slice(0, 8).map((timeSlot) => (
              <div key={timeSlot} className="contents">
                <div className="p-2 text-sm text-muted-foreground border-r border-border">
                  {timeSlot}
                </div>
                {weekDays.map((day) => {
                  const dayEvents = weekEvents.filter(event => {
                    const eventDate = parseISO(event.start.dateTime);
                    return format(eventDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd') &&
                           eventDate.getHours() === parseInt(timeSlot.split(':')[0]);
                  });
                  
                  return (
                    <div key={`${day.toISOString()}-${timeSlot}`} className="p-1 border border-border/30 min-h-[40px]">
                      {dayEvents.map((event) => (
                        <div key={event.id} className="bg-primary/20 text-xs p-1 rounded text-center">
                          {event.summary}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Agenda;
