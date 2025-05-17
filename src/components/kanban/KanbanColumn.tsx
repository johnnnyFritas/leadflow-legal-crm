
import { DroppableProvided } from 'react-beautiful-dnd';
import { Lead } from '@/types/lead';
import KanbanCard from './KanbanCard';

interface KanbanColumnProps {
  title: string;
  leads: Lead[];
  provided: DroppableProvided;
  onViewLead: (lead: Lead) => void;
}

const KanbanColumn = ({ title, leads, provided, onViewLead }: KanbanColumnProps) => {
  return (
    <div className="kanban-column">
      <h3 className="text-sm font-medium mb-2 flex items-center justify-between">
        <span>{title}</span>
        <span className="bg-secondary text-secondary-foreground text-xs px-2 py-0.5 rounded-full">
          {leads.length}
        </span>
      </h3>
      
      <div
        {...provided.droppableProps}
        ref={provided.innerRef}
        className="h-full overflow-y-auto"
      >
        {leads.map((lead, index) => (
          <KanbanCard
            key={lead.id}
            lead={lead}
            index={index}
            onClick={() => onViewLead(lead)}
          />
        ))}
        {provided.placeholder}
      </div>
    </div>
  );
};

export default KanbanColumn;
