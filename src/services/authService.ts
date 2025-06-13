
import { AuthUser } from '@/types/auth';
import { AuthStorage } from '@/services/auth/authStorage';
import { AuthApi } from '@/services/auth/authApi';
import { generateInstanceName } from '@/utils/instanceUtils';

class AuthService {
  async updateInstanceData(instanceId: string, phone: string): Promise<void> {
    try {
      const user = this.getCurrentUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      await AuthApi.updateInstanceData(instanceId, phone);

      // Atualizar dados locais do usuário
      const updatedUser = { ...user, phone };
      AuthStorage.setAuthUser(updatedUser);
    } catch (error) {
      console.error('Erro ao atualizar dados da instância:', error);
      throw error;
    }
  }

  async login(email: string, password: string): Promise<AuthUser | null> {
    try {
      console.log('Tentando fazer login com:', email);
      console.log('Senha fornecida:', password);
      
      let instance = await AuthApi.findUserByEmail(email);
      
      if (!instance) {
        throw new Error('Email não encontrado');
      }

      console.log('Instância encontrada:', {
        id: instance.id,
        email: instance.email,
        instance_name: instance.instance_name
      });

      if (instance.password !== password) {
        console.log('Senha incorreta');
        throw new Error('Senha incorreta');
      }

      if (!instance.instance_name || instance.instance_name.trim() === '') {
        const newInstanceName = generateInstanceName(instance.company_name);
        console.log('Gerando instance_name:', newInstanceName);
        
        await AuthApi.updateInstanceName(instance.id, newInstanceName);
        instance.instance_name = newInstanceName;
      }

      const authUser = AuthApi.createAuthUserFromInstance(instance);

      AuthStorage.setAuthUser(authUser);
      AuthStorage.setInstanceId(instance.id);

      return authUser;
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  }

  async register(email: string, password: string, name: string): Promise<AuthUser | null> {
    try {
      console.log('Tentando registrar com:', email);
      
      const existingInstance = await AuthApi.findUserByEmail(email);

      if (existingInstance) {
        throw new Error('Email já cadastrado');
      }

      const newInstance = await AuthApi.createNewInstance(email, password, name);
      const authUser = AuthApi.createAuthUserFromInstance(newInstance);

      AuthStorage.setAuthUser(authUser);
      AuthStorage.setInstanceId(newInstance.id);

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

      const instance = await AuthApi.findUserByEmail(user.email);
      
      if (!instance) {
        throw new Error('Usuário não encontrado');
      }
      
      if (instance.password !== currentPassword) {
        throw new Error('Senha atual incorreta');
      }

      await AuthApi.updatePassword(instance.id, newPassword);
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      throw error;
    }
  }

  logout(): void {
    AuthStorage.clearAuth();
  }

  getCurrentUser(): AuthUser | null {
    return AuthStorage.getAuthUser();
  }

  getInstanceId(): string | null {
    return AuthStorage.getInstanceId();
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null && this.getInstanceId() !== null;
  }
}

export const authService = new AuthService();
