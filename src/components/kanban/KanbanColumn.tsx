
import { DroppableProvided } from 'react-beautiful-dnd';
import { Lead } from '@/types/lead';
import KanbanCard from './KanbanCard';

interface KanbanColumnProps {
  title: string;
  leads: Lead[];
  provided: DroppableProvided;
  onViewLead: (lead: Lead) => void;
  index?: number;
}

const KanbanColumn = ({ leads, onViewLead, index = 0 }: KanbanColumnProps) => {
  // Se há apenas um lead, renderizar o card diretamente
  if (leads.length === 1) {
    return (
      <KanbanCard
        key={leads[0].id}
        lead={leads[0]}
        index={index}
        onClick={() => onViewLead(leads[0])}
      />
    );
  }

  // Se há múltiplos leads, renderizar todos
  return (
    <>
      {leads.map((lead, idx) => (
        <KanbanCard
          key={lead.id}
          lead={lead}
          index={idx}
          onClick={() => onViewLead(lead)}
        />
      ))}
    </>
  );
};

export default KanbanColumn;
