
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useIsMobile } from '@/hooks/use-mobile';

interface AgendaCalendarProps {
  selectedDate: Date;
  viewMode: 'day' | 'week' | 'month';
  onDateSelect: (date: Date | undefined) => void;
  onViewModeChange: (mode: 'day' | 'week' | 'month') => void;
  dayEventsCount: number;
  weekEventsCount: number;
  monthEventsCount: number;
}

export const AgendaCalendar = ({ 
  selectedDate, 
  viewMode, 
  onDateSelect, 
  onViewModeChange,
  dayEventsCount,
  weekEventsCount,
  monthEventsCount
}: AgendaCalendarProps) => {
  const isMobile = useIsMobile();

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      console.log('Data selecionada no calendário lateral:', format(date, 'yyyy-MM-dd'));
      onDateSelect(date);
    }
  };

  const getEventsCount = () => {
    switch (viewMode) {
      case 'day': return dayEventsCount;
      case 'week': return weekEventsCount;
      case 'month': return monthEventsCount;
      default: return 0;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2 lg:pb-3 px-3 lg:px-6 pt-3 lg:pt-6">
        <CardTitle className="flex items-center gap-2 text-sm lg:text-base xl:text-lg">
          <CalendarDays size={isMobile ? 14 : 16} />
          <span>Calendário</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-3 lg:px-6 pb-3 lg:pb-6">
        {/* Container do calendário com overflow controlado */}
        <div className="w-full overflow-hidden">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            className="w-full rounded-md border"
            locale={ptBR}
          />
        </div>
        
        {/* Botões de Visualização */}
        <div className="space-y-2">
          <div className="text-xs lg:text-sm font-medium text-muted-foreground">
            Visualização
          </div>
          <div className="flex flex-row gap-1">
            <Button 
              variant={viewMode === 'day' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => onViewModeChange('day')}
              className="flex-1 justify-center text-xs lg:text-sm h-7 lg:h-8"
            >
              Dia
            </Button>
            <Button 
              variant={viewMode === 'week' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => onViewModeChange('week')}
              className="flex-1 justify-center text-xs lg:text-sm h-7 lg:h-8"
            >
              Semana
            </Button>
            <Button 
              variant={viewMode === 'month' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => onViewModeChange('month')}
              className="flex-1 justify-center text-xs lg:text-sm h-7 lg:h-8"
            >
              Mês
            </Button>
          </div>
        </div>

        {/* Debug Info */}
        <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded-md">
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Modo:</span>
              <span className="font-medium">{viewMode}</span>
            </div>
            <div className="flex justify-between">
              <span>Data:</span>
              <span className="font-medium">
                {format(selectedDate, isMobile ? 'dd/MM' : 'dd/MM/yyyy')}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Eventos:</span>
              <span className="font-medium">{getEventsCount()}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
