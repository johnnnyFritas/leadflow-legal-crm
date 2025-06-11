
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Lock, UserCog, Palette, Users } from 'lucide-react';
import ProfileTab from '@/components/settings/ProfileTab';
import PasswordTab from '@/components/settings/PasswordTab';
import PreferencesTab from '@/components/settings/PreferencesTab';
import TeamTab from '@/components/settings/TeamTab';

const Settings = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
        <p className="text-muted-foreground">
          Gerencie suas preferências e informações de conta.
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <UserCog size={16} />
            <span>Meu Perfil</span>
          </TabsTrigger>
          <TabsTrigger value="password" className="flex items-center gap-2">
            <Lock size={16} />
            <span>Senha</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Palette size={16} />
            <span>Preferências</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users size={16} />
            <span>Equipe</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-4">
          <ProfileTab />
        </TabsContent>
        
        <TabsContent value="password" className="space-y-4">
          <PasswordTab />
        </TabsContent>
        
        <TabsContent value="preferences" className="space-y-4">
          <PreferencesTab />
        </TabsContent>
        
        <TabsContent value="team" className="space-y-4">
          <TeamTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
