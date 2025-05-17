
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/components/ui/sonner";
import { Pencil, Trash2, UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  avatarUrl?: string;
}

const Team = () => {
  const [members, setMembers] = useState<TeamMember[]>([
    {
      id: '1',
      name: 'Ana Silva',
      email: 'ana.silva@querodireito.com',
      phone: '(11) 98765-4321',
      role: 'Atendente',
      avatarUrl: '',
    }
  ]);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  
  // New member form state
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  
  // Edit member form state
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  
  const handleAddMember = () => {
    // Validation
    if (!newMemberName || !newMemberEmail || !newMemberPhone) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }
    
    if (members.length >= 2) {
      toast.error('Você já atingiu o limite de 2 atendentes');
      return;
    }
    
    // Add new member
    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: newMemberName,
      email: newMemberEmail,
      phone: newMemberPhone,
      role: 'Atendente',
    };
    
    setMembers([...members, newMember]);
    toast.success(`${newMemberName} adicionado(a) à equipe`);
    
    // Reset form and close dialog
    setNewMemberName('');
    setNewMemberEmail('');
    setNewMemberPhone('');
    setIsAddDialogOpen(false);
  };
  
  const handleEditMember = () => {
    // Validation
    if (!editName || !editEmail || !editPhone || !editingMember) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }
    
    // Update member
    const updatedMembers = members.map(member => {
      if (member.id === editingMember.id) {
        return {
          ...member,
          name: editName,
          email: editEmail,
          phone: editPhone,
        };
      }
      return member;
    });
    
    setMembers(updatedMembers);
    toast.success(`Dados de ${editName} atualizados com sucesso`);
    
    // Reset form and close dialog
    setEditingMember(null);
    setIsEditDialogOpen(false);
  };
  
  const handleDeleteMember = (id: string) => {
    const memberToDelete = members.find(member => member.id === id);
    if (memberToDelete) {
      setMembers(members.filter(member => member.id !== id));
      toast.success(`${memberToDelete.name} removido(a) da equipe`);
    }
  };
  
  const openEditDialog = (member: TeamMember) => {
    setEditingMember(member);
    setEditName(member.name);
    setEditEmail(member.email);
    setEditPhone(member.phone);
    setIsEditDialogOpen(true);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Equipe</h2>
          <p className="text-muted-foreground">
            Gerencie sua equipe de atendentes (máximo 2).
          </p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={members.length >= 2}>
              <UserPlus className="mr-2 h-4 w-4" />
              Adicionar Atendente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Atendente</DialogTitle>
              <DialogDescription>
                Adicione um novo membro à sua equipe de atendimento.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input 
                  id="name"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email"
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input 
                  id="phone"
                  value={newMemberPhone}
                  onChange={(e) => setNewMemberPhone(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddMember}>Adicionar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {members.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <p className="text-muted-foreground mb-4">Nenhum atendente adicionado ainda</p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Adicionar Atendente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {members.map((member) => (
            <Card key={member.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={member.avatarUrl} />
                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-xl">{member.name}</CardTitle>
                    <CardDescription>{member.role}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <span className="font-medium mr-2">Email:</span>
                    <span>{member.email}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="font-medium mr-2">Telefone:</span>
                    <span>{member.phone}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button variant="outline" size="sm" onClick={() => openEditDialog(member)}>
                  <Pencil className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDeleteMember(member.id)}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Remover
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Atendente</DialogTitle>
            <DialogDescription>
              Atualize as informações do atendente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome Completo</Label>
              <Input 
                id="edit-name" 
                value={editName} 
                onChange={(e) => setEditName(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input 
                id="edit-email" 
                type="email" 
                value={editEmail} 
                onChange={(e) => setEditEmail(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Telefone</Label>
              <Input 
                id="edit-phone" 
                value={editPhone} 
                onChange={(e) => setEditPhone(e.target.value)} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleEditMember}>Salvar alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Team;
