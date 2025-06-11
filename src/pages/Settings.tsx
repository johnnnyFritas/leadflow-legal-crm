import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/components/ui/sonner';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { User, Eye, EyeOff, Moon, Sun, Users, Lock, UserCog, Palette } from 'lucide-react';

const Settings = () => {
  const { user, updateUserProfile, changePassword } = useAuth();
  
  // Profile state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || '');
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Preferences state
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  
  // Team state
  const [attendants, setAttendants] = useState([
    { id: 1, name: '', email: '', phone: '' },
    { id: 2, name: '', email: '', phone: '' }
  ]);
  
  const [isLoading, setIsLoading] = useState(false);

  // Hidden file input reference for avatar upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check for existing theme preference in local storage
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
      // Default to system preference
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(isDark ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', isDark);
    }
    
    // Update form data when user changes
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setAvatarPreview(user.avatarUrl || '');
    }
  }, [user]);

  const handleThemeChange = (value: 'light' | 'dark') => {
    setTheme(value);
    document.documentElement.classList.toggle('dark', value === 'dark');
    localStorage.setItem('theme', value);
    toast.success(`Tema alterado para ${value === 'dark' ? 'escuro' : 'claro'}`);
  };

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Create updated user data object
    const updatedUserData = {
      ...user,
      name,
      email,
      phone,
      avatarUrl: avatarPreview
    };
    
    // Update user profile in context
    updateUserProfile(updatedUserData);
    
    setTimeout(() => {
      toast.success('Perfil atualizado com sucesso!');
      setIsLoading(false);
    }, 500);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    
    if (!currentPassword || !newPassword) {
      toast.error('Preencha todos os campos');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await changePassword(currentPassword, newPassword);
      toast.success('Senha alterada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao alterar senha');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    
    if (files && files.length > 0) {
      const selectedFile = files[0];
      setAvatarFile(selectedFile);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setAvatarPreview(reader.result);
        }
      };
      reader.readAsDataURL(selectedFile);
      
      toast.success('Foto de perfil alterada com sucesso!');
    }
  };

  const handleAttendantChange = (index: number, field: string, value: string) => {
    const updatedAttendants = [...attendants];
    updatedAttendants[index] = { ...updatedAttendants[index], [field]: value };
    setAttendants(updatedAttendants);
  };

  const handleTeamUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      toast.success('Equipe atualizada com sucesso!');
      setIsLoading(false);
    }, 1000);
  };

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
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>
                Atualize suas informações pessoais e de contato.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="flex flex-col items-center justify-center space-y-2 mb-4">
                  <Avatar className="h-24 w-24 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <AvatarImage src={avatarPreview} />
                    <AvatarFallback className="text-2xl">
                      {user?.name?.charAt(0) || <User size={36} />}
                    </AvatarFallback>
                  </Avatar>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Alterar foto
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input 
                      id="name" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome completo"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Profissional</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu.email@exemplo.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input 
                      id="phone" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(99) 99999-9999"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="role">Cargo</Label>
                    <Input 
                      id="role" 
                      value={user?.role || 'Advogado'} 
                      disabled 
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <span className="h-4 w-4 border-2 border-t-transparent border-white border-solid rounded-full animate-spin mr-2"></span>
                        Salvando...
                      </>
                    ) : (
                      "Salvar alterações"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="password" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alterar Senha</CardTitle>
              <CardDescription>
                Altere sua senha para manter sua conta segura.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Senha Atual</Label>
                  <div className="relative">
                    <Input 
                      id="current-password" 
                      type={showCurrentPassword ? "text" : "password"} 
                      value={currentPassword} 
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </Button>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nova Senha</Label>
                  <div className="relative">
                    <Input 
                      id="new-password" 
                      type={showNewPassword ? "text" : "password"} 
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                  <div className="relative">
                    <Input 
                      id="confirm-password" 
                      type={showConfirmPassword ? "text" : "password"} 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <span className="h-4 w-4 border-2 border-t-transparent border-white border-solid rounded-full animate-spin mr-2"></span>
                        Alterando...
                      </>
                    ) : (
                      "Alterar senha"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tema</CardTitle>
              <CardDescription>
                Escolha entre tema claro ou escuro para o sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={theme} onValueChange={(v) => handleThemeChange(v as 'light' | 'dark')} className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="light" id="light" className="sr-only" />
                  <Label
                    htmlFor="light"
                    className={`flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer ${
                      theme === 'light' ? 'border-primary' : ''
                    }`}
                  >
                    <Sun className="h-6 w-6 mb-2" />
                    <span>Claro</span>
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dark" id="dark" className="sr-only" />
                  <Label
                    htmlFor="dark"
                    className={`flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer ${
                      theme === 'dark' ? 'border-primary' : ''
                    }`}
                  >
                    <Moon className="h-6 w-6 mb-2" />
                    <span>Escuro</span>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="team" className="space-y-4">
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
