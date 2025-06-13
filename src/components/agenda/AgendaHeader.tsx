
import { GoogleCalendarStatus } from '@/components/agenda/GoogleCalendarStatus';
import { NewEventModal } from '@/components/agenda/NewEventModal';

interface AgendaHeaderProps {
  selectedDate: Date;
  onEventCreated: () => void;
}

export const AgendaHeader = ({ selectedDate, onEventCreated }: AgendaHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
      <h2 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold tracking-tight">Agenda</h2>
      
      {/* Container dos botões de ação */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
        {/* Status do Google Calendar */}
        <GoogleCalendarStatus />
        
        {/* Botão de novo evento */}
        <div className="w-full sm:w-auto">
          <NewEventModal 
            selectedDate={selectedDate} 
            onEventCreated={onEventCreated}
          />
        </div>
      </div>
    </div>
  );
};
