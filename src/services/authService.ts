
import { supabase } from '@/lib/supabase';
import { ClientInstance } from '@/types/supabase';

export interface AuthUser {
  id: string;
  email: string;
  company_name: string;
  instance_name: string;
  phone?: string;
  main_lawyer_name?: string;
  name?: string; // Derived from main_lawyer_name or company_name
  role?: string; // Default role
  avatarUrl?: string; // Optional avatar
}

class AuthService {
  async login(email: string, password: string): Promise<AuthUser | null> {
    try {
      console.log('Tentando fazer login com:', email);
      console.log('Senha fornecida:', password);
      
      // Buscar instância pelo email
      const instances = await supabase.get<ClientInstance[]>(`/clients_instances?email=eq.${encodeURIComponent(email.toLowerCase().trim())}&limit=1`);

      if (!instances || instances.length === 0) {
        throw new Error('Email não encontrado');
      }

      const instance = instances[0];
      console.log('Instância encontrada:', {
        id: instance.id,
        email: instance.email
      });

      // Verificar se a senha está correta
      if (instance.password !== password) {
        console.log('Senha incorreta');
        throw new Error('Senha incorreta');
      }

      // Criar objeto do usuário autenticado
      const authUser: AuthUser = {
        id: instance.id,
        email: instance.email,
        company_name: instance.company_name,
        instance_name: instance.instance_name,
        phone: instance.phone,
        main_lawyer_name: instance.main_lawyer_name,
        name: instance.main_lawyer_name || instance.company_name,
        role: 'Advogado',
        avatarUrl: undefined
      };

      // Salvar no localStorage
      localStorage.setItem('authUser', JSON.stringify(authUser));
      localStorage.setItem('instanceId', instance.id);

      return authUser;
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  }

  async register(email: string, password: string, name: string): Promise<AuthUser | null> {
    try {
      console.log('Tentando registrar com:', email);
      
      // Verificar se email já existe
      const existingInstances = await supabase.get<ClientInstance[]>(`/clients_instances?email=eq.${encodeURIComponent(email.toLowerCase().trim())}&limit=1`);

      if (existingInstances && existingInstances.length > 0) {
        throw new Error('Email já cadastrado');
      }

      // Criar nova instância
      const instanceData = {
        email: email.toLowerCase().trim(),
        company_name: name,
        instance_name: name.toLowerCase().replace(/\s+/g, '_'),
        main_lawyer_name: name,
        password: password,
        created_at: new Date().toISOString()
      };

      const newInstances = await supabase.post<ClientInstance[]>('/clients_instances', instanceData);

      if (!newInstances || newInstances.length === 0) {
        throw new Error('Erro ao criar conta');
      }

      const newInstance = newInstances[0];

      // Criar objeto do usuário autenticado
      const authUser: AuthUser = {
        id: newInstance.id,
        email: newInstance.email,
        company_name: newInstance.company_name,
        instance_name: newInstance.instance_name,
        phone: newInstance.phone,
        main_lawyer_name: newInstance.main_lawyer_name,
        name: newInstance.main_lawyer_name || newInstance.company_name,
        role: 'Advogado',
        avatarUrl: undefined
      };

      // Salvar no localStorage
      localStorage.setItem('authUser', JSON.stringify(authUser));
      localStorage.setItem('instanceId', newInstance.id);

      return authUser;
    } catch (error) {
      console.error('Erro no registro:', error);
      throw error;
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const user = this.getCurrentUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Verificar senha atual
      const instances = await supabase.get<ClientInstance[]>(`/clients_instances?email=eq.${encodeURIComponent(user.email)}&limit=1`);
      
      if (!instances || instances.length === 0) {
        throw new Error('Usuário não encontrado');
      }

      const instance = instances[0];
      
      if (instance.password !== currentPassword) {
        throw new Error('Senha atual incorreta');
      }

      // Atualizar senha
      await supabase.patch(`/clients_instances?id=eq.${instance.id}`, {
        password: newPassword
      });

    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      throw error;
    }
  }

  logout(): void {
    localStorage.removeItem('authUser');
    localStorage.removeItem('instanceId');
  }

  getCurrentUser(): AuthUser | null {
    try {
      const userStr = localStorage.getItem('authUser');
      if (!userStr) return null;
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  getInstanceId(): string | null {
    return localStorage.getItem('instanceId');
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null && this.getInstanceId() !== null;
  }
}

export const authService = new AuthService();
