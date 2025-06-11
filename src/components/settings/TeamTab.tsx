
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/sonner';

const TeamTab = () => {
  const [attendants, setAttendants] = useState([
    { id: 1, name: '', email: '', phone: '' },
    { id: 2, name: '', email: '', phone: '' }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleAttendantChange = (index: number, field: string, value: string) => {
    const updatedAttendants = [...attendants];
    updatedAttendants[index] = { ...updatedAttendants[index], [field]: value };
    setAttendants(updatedAttendants);
  };

  const handleTeamUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    setTimeout(() => {
      toast.success('Equipe atualizada com sucesso!');
      setIsLoading(false);
    }, 1000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Equipe de Atendimento</CardTitle>
        <CardDescription>
          Cadastre até 2 atendentes para sua equipe.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleTeamUpdate} className="space-y-6">
          {attendants.map((attendant, index) => (
            <div key={attendant.id} className="space-y-4">
              <h3 className="text-lg font-medium">Atendente {index + 1}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`name-${index}`}>Nome</Label>
                  <Input 
                    id={`name-${index}`} 
                    value={attendant.name} 
                    onChange={(e) => handleAttendantChange(index, 'name', e.target.value)}
                    placeholder="Nome do atendente"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`email-${index}`}>Email</Label>
                  <Input 
                    id={`email-${index}`}
                    type="email"
                    value={attendant.email} 
                    onChange={(e) => handleAttendantChange(index, 'email', e.target.value)}
                    placeholder="email@exemplo.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`phone-${index}`}>Telefone</Label>
                  <Input 
                    id={`phone-${index}`} 
                    value={attendant.phone} 
                    onChange={(e) => handleAttendantChange(index, 'phone', e.target.value)}
                    placeholder="(99) 99999-9999"
                  />
                </div>
              </div>
              {index < attendants.length - 1 && <Separator className="my-4" />}
            </div>
          ))}
          
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="h-4 w-4 border-2 border-t-transparent border-white border-solid rounded-full animate-spin mr-2"></span>
                  Salvando...
                </>
              ) : (
                "Salvar equipe"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default TeamTab;
