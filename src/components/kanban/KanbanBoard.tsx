
import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';
import { toast } from '@/components/ui/sonner';
import { Lead, FaseKanban, defaultFases, FaseKanbanConfig } from '@/types/lead';
import KanbanColumn from './KanbanColumn';
import { conversationsService } from '@/services/conversationsService';
import { useAuth } from '@/contexts/AuthContext';

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

  useEffect(() => {
    let filtered = [...leads];
    
    // Apply area filter
    if (selectedArea && selectedArea !== 'all') {
      filtered = filtered.filter(lead => lead.area_direito === selectedArea);
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(lead => 
        lead.nome.toLowerCase().includes(query) ||
        (lead.email?.toLowerCase().includes(query) || false) ||
        lead.telefone.includes(query)
      );
    }
    
    setFilteredLeads(filtered);
  }, [searchQuery, selectedArea, leads]);

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }
    
    const leadId = draggableId;
    const lead = filteredLeads.find(l => l.id === leadId);
    
    if (!lead || !instanceId) return;
    
    const newStep = destination.droppableId as FaseKanban;
    
    // Update the filtered leads locally for immediate UI feedback
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
    
    const sourcePhase = fases.find(f => f.id === source.droppableId);
    const destPhase = fases.find(f => f.id === destination.droppableId);
    
    try {
      // Update in Supabase
      await conversationsService.updateConversationStep(leadId, newStep);
      
      toast.success(
        `Lead ${lead.nome} movido de ${sourcePhase?.title || source.droppableId} para ${destPhase?.title || destination.droppableId}`
      );
    } catch (error) {
      console.error('Erro ao atualizar step:', error);
      toast.error('Erro ao mover lead. Tente novamente.');
      
      // Revert local changes on error
      setFilteredLeads(leads);
    }
  };

  // Group leads by phase
  const leadsByPhase = fases.reduce((acc, fase) => {
    acc[fase.id] = filteredLeads.filter((lead) => lead.fase_atual === fase.id);
    return acc;
  }, {} as Record<FaseKanban, Lead[]>);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-3 overflow-x-auto px-1 pb-8 min-w-full">
        {fases.sort((a, b) => a.order - b.order).map((fase) => (
          <Droppable key={fase.id} droppableId={fase.id}>
            {(provided) => (
              <KanbanColumn
                title={fase.title}
                leads={leadsByPhase[fase.id] || []}
                provided={provided}
                onViewLead={onViewLead}
              />
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
};

export default KanbanBoard;
