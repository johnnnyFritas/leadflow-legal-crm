
import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';
import { toast } from '@/components/ui/sonner';
import { Lead, FaseKanban, defaultFases, FaseKanbanConfig } from '@/types/lead';
import KanbanColumn from './KanbanColumn';
import { conversationsService } from '@/services/conversationsService';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

interface KanbanBoardProps {
  onViewLead: (lead: Lead) => void;
  searchQuery: string;
  selectedArea: string;
  leads: Lead[];
}

const KanbanBoard = ({ onViewLead, searchQuery, selectedArea, leads }: KanbanBoardProps) => {
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>(leads);
  const [fases] = useState<FaseKanbanConfig[]>(defaultFases);
  const { instanceId } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    let filtered = [...leads];
    
    // Apply area filter
    if (selectedArea && selectedArea !== 'all') {
      filtered = filtered.filter(lead => lead.area_direito === selectedArea);
    }
    
    // Apply search filter - buscar por nome do lead e área do direito
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(lead => {
        const nameMatch = lead.nome?.toLowerCase().includes(query) || false;
        const areaMatch = lead.area_direito?.toLowerCase().includes(query) || false;
        const caseMatch = lead.resumo_caso?.toLowerCase().includes(query) || false;
        
        return nameMatch || areaMatch || caseMatch;
      });
    }
    
    setFilteredLeads(filtered);
  }, [searchQuery, selectedArea, leads]);

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    console.log('Drag result:', result);

    if (!destination) {
      console.log('No destination, returning');
      return;
    }
    
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      console.log('Same position, returning');
      return;
    }
    
    const leadId = draggableId;
    const lead = filteredLeads.find(l => l.id === leadId);
    
    if (!lead || !instanceId) {
      console.log('Lead not found or no instanceId');
      return;
    }
    
    const newStep = destination.droppableId as FaseKanban;
    const previousStep = source.droppableId as FaseKanban;
    
    console.log(`Movendo lead ${lead.nome} (${leadId}) de "${previousStep}" para "${newStep}"`);
    
    // Optimistic update - atualizar UI imediatamente
    const updatedFilteredLeads = filteredLeads.map(l => {
      if (l.id === leadId) {
        return {
          ...l,
          fase_atual: newStep,
          tempo_na_fase: 0,
          updated_at: new Date().toISOString()
        };
      }
      return l;
    });
    
    setFilteredLeads(updatedFilteredLeads);
    
    try {
      // Atualizar no Supabase e enviar webhook
      await conversationsService.updateConversationStep(leadId, newStep, previousStep);
      
      console.log('Lead movido com sucesso no Supabase e webhook enviado');
      
      // Invalidar queries para refrescar os dados
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      
      const sourcePhase = fases.find(f => f.id === previousStep);
      const destPhase = fases.find(f => f.id === newStep);
      
      toast.success(
        `Lead ${lead.nome} movido de ${sourcePhase?.title || previousStep} para ${destPhase?.title || newStep}`
      );
      
    } catch (error) {
      console.error('Erro ao atualizar step:', error);
      
      // Reverter a mudança otimista em caso de erro
      setFilteredLeads(filteredLeads);
      
      toast.error('Erro ao mover lead. Tente novamente.');
    }
  };

  // Group leads by phase
  const leadsByPhase = fases.reduce((acc, fase) => {
    acc[fase.id] = filteredLeads.filter((lead) => lead.fase_atual === fase.id);
    return acc;
  }, {} as Record<FaseKanban, Lead[]>);

  console.log('Leads by phase:', leadsByPhase);
  console.log('Search query:', searchQuery);
  console.log('Filtered leads count:', filteredLeads.length);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-3 overflow-x-auto px-1 pb-8 min-w-full">
        {fases.sort((a, b) => a.order - b.order).map((fase) => (
          <Droppable key={fase.id} droppableId={fase.id}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`kanban-column w-56 min-w-56 max-w-56 flex-shrink-0 bg-secondary/20 rounded-md p-2 ${
                  snapshot.isDraggingOver ? 'bg-secondary/40' : ''
                }`}
              >
                <h3 className="text-sm font-medium mb-2 flex items-center justify-between">
                  <span>{fase.title}</span>
                  <span className="bg-secondary text-secondary-foreground text-xs px-2 py-0.5 rounded-full">
                    {leadsByPhase[fase.id]?.length || 0}
                  </span>
                </h3>
                
                <div className="space-y-2 min-h-[200px]">
                  {(leadsByPhase[fase.id] || []).map((lead, index) => (
                    <KanbanColumn
                      key={lead.id}
                      title=""
                      leads={[lead]}
                      provided={provided}
                      onViewLead={onViewLead}
                      index={index}
                    />
                  ))}
                </div>
                
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
};

export default KanbanBoard;
