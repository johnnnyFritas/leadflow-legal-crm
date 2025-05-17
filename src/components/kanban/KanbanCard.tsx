
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Draggable } from 'react-beautiful-dnd';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Lead, 
  getScoreLabel, 
  formatTimeElapsed, 
  getAreaLabel 
} from '@/types/lead';

interface KanbanCardProps {
  lead: Lead;
  index: number;
  onClick: () => void;
}

const KanbanCard = ({ lead, index, onClick }: KanbanCardProps) => {
  const formattedDate = format(parseISO(lead.data_entrada), "dd/MM 'às' HH:mm", { locale: ptBR });
  
  // Calculate time elapsed since lead entry
  const minutesElapsed = Math.floor(
    (Date.now() - new Date(lead.data_entrada).getTime()) / (1000 * 60)
  );
  
  const timeElapsed = formatTimeElapsed(minutesElapsed);
  const timeInPhase = formatTimeElapsed(lead.tempo_na_fase);
  
  const getScoreClass = (score: string) => {
    switch (score) {
      case 'high': return 'score-high';
      case 'medium': return 'score-medium';
      case 'low': return 'score-low';
      default: return 'score-low';
    }
  };
  
  const getAreaClass = (area: string) => {
    switch (area) {
      case 'trabalhista': return 'area-trabalhista';
      case 'previdenciario': return 'area-previdenciario';
      case 'civil': return 'area-civil';
      case 'tributario': return 'area-tributario';
      case 'penal': return 'area-penal';
      case 'empresarial': return 'area-empresarial';
      default: return 'area-default';
    }
  };

  return (
    <Draggable draggableId={lead.id} index={index}>
      {(provided) => (
        <div
          className="kanban-card"
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <div className="flex items-start justify-between gap-1 mb-2">
            <span className="text-xs font-medium text-muted-foreground">
              {lead.id_visual}
            </span>
            <span className={`score-badge ${getScoreClass(lead.score)}`}>
              {getScoreLabel(lead.score)}
            </span>
          </div>
          
          <h4 className="font-medium text-sm mb-1 line-clamp-2">{lead.nome}</h4>
          
          <div className="text-xs mb-2 text-muted-foreground line-clamp-1">
            {lead.telefone}
          </div>
          
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted-foreground">
              {formattedDate}
            </span>
            <span className={`area-badge ${getAreaClass(lead.area_direito)}`}>
              {getAreaLabel(lead.area_direito)}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
            <div className="timer">
              <span className="font-medium">Total:</span> {timeElapsed}
            </div>
            <div className="timer">
              <span className="font-medium">Na fase:</span> {timeInPhase}
            </div>
          </div>
          
          <Button 
            size="sm" 
            className="w-full" 
            variant="outline"
            onClick={onClick}
          >
            Ver detalhes
          </Button>
        </div>
      )}
    </Draggable>
  );
};

export default KanbanCard;
