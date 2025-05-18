
import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';
import { toast } from '@/components/ui/sonner';
import { Lead, FaseKanban, defaultFases, FaseKanbanConfig } from '@/types/lead';
import KanbanColumn from './KanbanColumn';
import { mockLeads } from '@/data/mockLeads';

interface KanbanBoardProps {
  onViewLead: (lead: Lead) => void;
  searchQuery: string;
  selectedArea: string;
}

const KanbanBoard = ({ onViewLead, searchQuery, selectedArea }: KanbanBoardProps) => {
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>(mockLeads);
  const [fases] = useState<FaseKanbanConfig[]>(defaultFases);

  useEffect(() => {
    let filtered = [...mockLeads];
    
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
  }, [searchQuery, selectedArea]);

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }
    
    const leadId = draggableId;
    const lead = leads.find(l => l.id === leadId);
    
    if (!lead) return;
    
    const updatedLeads = leads.map(l => {
      if (l.id === leadId) {
        return {
          ...l,
          fase_atual: destination.droppableId as FaseKanban,
          tempo_na_fase: 0, // Reset time in phase when moved
          updated_at: new Date().toISOString()
        };
      }
      return l;
    });
    
    setLeads(updatedLeads);
    
    // Also update filtered leads
    const updatedFilteredLeads = filteredLeads.map(l => {
      if (l.id === leadId) {
        return {
          ...l,
          fase_atual: destination.droppableId as FaseKanban,
          tempo_na_fase: 0,
          updated_at: new Date().toISOString()
        };
      }
      return l;
    });
    
    setFilteredLeads(updatedFilteredLeads);
    
    const sourcePhase = fases.find(f => f.id === source.droppableId);
    const destPhase = fases.find(f => f.id === destination.droppableId);
    
    toast.success(
      `Lead ${lead.nome} movido de ${sourcePhase?.title || source.droppableId} para ${destPhase?.title || destination.droppableId}`
    );
  };

  // Group leads by phase
  const leadsByPhase = fases.reduce((acc, fase) => {
    acc[fase.id] = filteredLeads.filter((lead) => lead.fase_atual === fase.id);
    return acc;
  }, {} as Record<FaseKanban, Lead[]>);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-3 overflow-x-auto p-4 pb-8">
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
