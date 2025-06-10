
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
      
      // Buscar instância pelo email
      const { data: instances, error } = await supabase
        .from('clients_instances')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .limit(1);

      if (error) {
        console.error('Erro ao buscar instância:', error);
        throw new Error('Erro ao verificar credenciais');
      }

      if (!instances || instances.length === 0) {
        throw new Error('Email não encontrado');
      }

      const instance = instances[0];

      // Verificar se a senha (id) está correta
      if (instance.id !== password) {
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
      const { data: existingInstances, error: checkError } = await supabase
        .from('clients_instances')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .limit(1);

      if (checkError) {
        console.error('Erro ao verificar email:', checkError);
        throw new Error('Erro ao verificar email');
      }

      if (existingInstances && existingInstances.length > 0) {
        throw new Error('Email já cadastrado');
      }

      // Criar nova instância
      const instanceData = {
        email: email.toLowerCase().trim(),
        company_name: name,
        instance_name: name.toLowerCase().replace(/\s+/g, '_'),
        main_lawyer_name: name,
        created_at: new Date().toISOString()
      };

      const { data: newInstance, error: insertError } = await supabase
        .from('clients_instances')
        .insert(instanceData)
        .select()
        .single();

      if (insertError || !newInstance) {
        console.error('Erro ao criar instância:', insertError);
        throw new Error('Erro ao criar conta');
      }

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
