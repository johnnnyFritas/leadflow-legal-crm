
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
      // Buscar instância pelo email
      const instances = await supabase.get<ClientInstance[]>(`/clients_instances?email=eq.${encodeURIComponent(email.toLowerCase().trim())}&limit=1`);

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
