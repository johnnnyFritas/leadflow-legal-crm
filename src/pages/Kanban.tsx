
import { useState, useMemo } from 'react';
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';
import { mockLeads } from '@/data/mockLeads';

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
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [selectedLead, setSelectedLead] = useState<Lead | undefined>(undefined);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState('all');
  
  // Form state for new lead
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadEmail, setNewLeadEmail] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadArea, setNewLeadArea] = useState('');
  const [isAddLeadDialogOpen, setIsAddLeadDialogOpen] = useState(false);
  
  // Filter leads based on area and search query
  const filteredLeads = useMemo(() => {
    let filtered = [...leads];
    
    // Apply area filter
    if (selectedArea && selectedArea !== 'all') {
      filtered = filtered.filter(lead => lead.area_direito === selectedArea);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(lead => 
        lead.nome.toLowerCase().includes(query) ||
        lead.email.toLowerCase().includes(query) ||
        lead.telefone.includes(query)
      );
    }
    
    return filtered;
  }, [leads, selectedArea, searchQuery]);
  
  const handleViewLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDetailsOpen(true);
  };

  const handleAddLead = () => {
    // Validation
    if (!newLeadName || !newLeadEmail || !newLeadPhone || !newLeadArea) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }
    
    // Create new lead
    const newLead: Lead = {
      id: `lead-${Date.now()}`,
      nome: newLeadName,
      email: newLeadEmail,
      telefone: newLeadPhone,
      area_direito: newLeadArea,
      pontuacao: 0,
      fase_atual: 'notificacao_recebida',
      tempo_na_fase: 0,
      notas: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Add to leads array
    setLeads([...leads, newLead]);
    
    toast.success(`Lead ${newLeadName} adicionado com sucesso!`);
    
    // Reset form and close dialog
    setNewLeadName('');
    setNewLeadEmail('');
    setNewLeadPhone('');
    setNewLeadArea('');
    setIsAddLeadDialogOpen(false);
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
          
          <Dialog open={isAddLeadDialogOpen} onOpenChange={setIsAddLeadDialogOpen}>
            <DialogTrigger asChild>
              <Button>Adicionar Lead</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Adicionar Novo Lead</DialogTitle>
                <DialogDescription>
                  Adicione um novo lead ao sistema. Todos os campos são obrigatórios.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Nome
                  </Label>
                  <Input
                    id="name"
                    value={newLeadName}
                    onChange={(e) => setNewLeadName(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={newLeadEmail}
                    onChange={(e) => setNewLeadEmail(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="phone" className="text-right">
                    Telefone
                  </Label>
                  <Input
                    id="phone"
                    value={newLeadPhone}
                    onChange={(e) => setNewLeadPhone(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="area" className="text-right">
                    Área
                  </Label>
                  <Select value={newLeadArea} onValueChange={setNewLeadArea}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione a área" />
                    </SelectTrigger>
                    <SelectContent>
                      {areasDireito.filter(area => area.value !== 'all').map((area) => (
                        <SelectItem key={area.value} value={area.value}>
                          {area.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleAddLead}>Adicionar Lead</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <KanbanBoard 
        onViewLead={handleViewLead} 
        searchQuery={searchQuery} 
        selectedArea={selectedArea}
      />
      
      <LeadDetails 
        lead={selectedLead} 
        open={isDetailsOpen} 
        onOpenChange={setIsDetailsOpen}
      />
    </div>
  );
};

export default Kanban;
