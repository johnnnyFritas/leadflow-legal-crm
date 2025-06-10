
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, CalendarIcon, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { calendarService } from '@/services/calendarService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface NewEventModalProps {
  selectedDate?: Date;
  onEventCreated?: () => void;
}

export const NewEventModal = ({ selectedDate, onEventCreated }: NewEventModalProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [formData, setFormData] = useState({
    title: '',
    startDate: selectedDate ? selectedDate : new Date(),
    endDate: selectedDate ? new Date(selectedDate.getTime() + 60 * 60 * 1000) : new Date(Date.now() + 60 * 60 * 1000),
    startTime: '09:00',
    endTime: '10:00',
    participants: ''
  });

  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Combinar data com horário
      const [startHour, startMinute] = formData.startTime.split(':').map(Number);
      const [endHour, endMinute] = formData.endTime.split(':').map(Number);
      
      const startDateTime = new Date(formData.startDate);
      startDateTime.setHours(startHour, startMinute, 0, 0);
      
      const endDateTime = new Date(formData.endDate);
      endDateTime.setHours(endHour, endMinute, 0, 0);

      const eventData = {
        summary: formData.title,
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: 'America/Sao_Paulo'
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: 'America/Sao_Paulo'
        },
        attendees: formData.participants 
          ? formData.participants.split(',').map(email => ({ email: email.trim() }))
          : []
      };

      await calendarService.createEvent(eventData);
      
      toast({
        title: "Evento criado com sucesso!",
        description: "O evento foi adicionado à sua agenda.",
      });

      setOpen(false);
      setFormData({
        title: '',
        startDate: new Date(),
        endDate: new Date(),
        startTime: '09:00',
        endTime: '10:00',
        participants: ''
      });
      
      if (onEventCreated) {
        onEventCreated();
      }
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      toast({
        title: "Erro ao criar evento",
        description: "Não foi possível criar o evento. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Gerar opções de horário
  const timeOptions = Array.from({ length: 24 * 4 }, (_, i) => {
    const hour = Math.floor(i / 4);
    const minute = (i % 4) * 15;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto">
          <Plus size={16} className="mr-2" />
          {isMobile ? 'Novo' : 'Novo Agendamento'}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[500px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Criar Novo Evento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">Título do Evento</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Reunião com cliente"
              required
              className="w-full"
            />
          </div>
          
          {/* Data e Hora de Início */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Data e Hora de Início</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Data de Início */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Data</Label>
                <Popover open={showStartCalendar} onOpenChange={setShowStartCalendar}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-10",
                        !formData.startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="truncate">
                        {formData.startDate ? format(formData.startDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-auto p-0 z-[60]" 
                    align="start"
                    side={isMobile ? "bottom" : "bottom"}
                    sideOffset={4}
                  >
                    <Calendar
                      mode="single"
                      selected={formData.startDate}
                      onSelect={(date) => {
                        if (date) {
                          setFormData({ ...formData, startDate: date });
                          setShowStartCalendar(false);
                        }
                      }}
                      initialFocus
                      className="pointer-events-auto"
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              {/* Hora de Início */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Hora</Label>
                <select 
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full h-10 px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {timeOptions.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Data e Hora de Fim */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Data e Hora de Fim</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Data de Fim */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Data</Label>
                <Popover open={showEndCalendar} onOpenChange={setShowEndCalendar}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-10",
                        !formData.endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="truncate">
                        {formData.endDate ? format(formData.endDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-auto p-0 z-[60]" 
                    align="start"
                    side={isMobile ? "bottom" : "bottom"}
                    sideOffset={4}
                  >
                    <Calendar
                      mode="single"
                      selected={formData.endDate}
                      onSelect={(date) => {
                        if (date) {
                          setFormData({ ...formData, endDate: date });
                          setShowEndCalendar(false);
                        }
                      }}
                      initialFocus
                      className="pointer-events-auto"
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              {/* Hora de Fim */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Hora</Label>
                <select 
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full h-10 px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {timeOptions.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="participants" className="text-sm font-medium">Participantes (emails)</Label>
            <Input
              id="participants"
              value={formData.participants}
              onChange={(e) => setFormData({ ...formData, participants: e.target.value })}
              placeholder="email1@gmail.com, email2@gmail.com"
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">Separe múltiplos emails com vírgula</p>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              {loading ? 'Criando...' : 'Criar Evento'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
