
import { useState } from 'react';
import { Lead } from '@/types/lead';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import KanbanBoard from '@/components/kanban/KanbanBoard';
import LeadDetails from '@/components/lead/LeadDetails';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const areasDireito = [
  { value: 'all', label: 'Todas as áreas' },
  { value: 'trabalhista', label: 'Trabalhista' },
  { value: 'previdenciario', label: 'Previdenciário' },
  { value: 'civil', label: 'Civil' },
  { value: 'tributario', label: 'Tributário' },
  { value: 'penal', label: 'Penal' },
  { value: 'empresarial', label: 'Empresarial' }
];

const Kanban = () => {
  const [selectedLead, setSelectedLead] = useState<Lead | undefined>(undefined);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState('all');
  
  const handleViewLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDetailsOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Kanban de Leads</h2>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar leads..."
              className="w-[200px] pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select value={selectedArea} onValueChange={setSelectedArea}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione a área" />
            </SelectTrigger>
            <SelectContent>
              {areasDireito.map((area) => (
                <SelectItem key={area.value} value={area.value}>
                  {area.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button>Adicionar Lead</Button>
        </div>
      </div>
      
      <KanbanBoard onViewLead={handleViewLead} />
      
      <LeadDetails 
        lead={selectedLead} 
        open={isDetailsOpen} 
        onOpenChange={setIsDetailsOpen}
      />
    </div>
  );
};

export default Kanban;
