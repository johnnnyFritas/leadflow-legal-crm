
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
      console.log('🔐 AUTH: Tentando fazer login com:', email);
      
      let instance = await AuthApi.findUserByEmail(email);
      
      if (!instance) {
        throw new Error('Email não encontrado');
      }

      console.log('🔐 AUTH: Instância encontrada:', {
        id: instance.id,
        email: instance.email,
        instance_name: instance.instance_name
      });

      if (instance.password !== password) {
        console.log('🔐 AUTH: Senha incorreta');
        throw new Error('Senha incorreta');
      }

      // Verificar e gerar instance_name se necessário
      if (!instance.instance_name || instance.instance_name.trim() === '') {
        const newInstanceName = generateInstanceName(instance.company_name);
        console.log('🔐 AUTH: Gerando novo instance_name:', newInstanceName);
        
        await AuthApi.updateInstanceName(instance.id, newInstanceName);
        instance.instance_name = newInstanceName;
        console.log('🔐 AUTH: Instance_name atualizado na base de dados');
      }

      const authUser = AuthApi.createAuthUserFromInstance(instance);
      
      console.log('🔐 AUTH: AuthUser criado:', {
        id: authUser.id,
        email: authUser.email,
        instance_name: authUser.instance_name
      });

      // Salvar no localStorage
      AuthStorage.setAuthUser(authUser);
      AuthStorage.setInstanceId(instance.id);

      return authUser;
    } catch (error) {
      console.error('🔐 AUTH: Erro no login:', error);
      throw error;
    }
  }

  async register(email: string, password: string, name: string): Promise<AuthUser | null> {
    try {
      console.log('🔐 AUTH: Tentando registrar com:', email);
      
      const existingInstance = await AuthApi.findUserByEmail(email);

      if (existingInstance) {
        throw new Error('Email já cadastrado');
      }

      const newInstance = await AuthApi.createNewInstance(email, password, name);
      console.log('🔐 AUTH: Nova instância criada:', {
        id: newInstance.id,
        instance_name: newInstance.instance_name
      });

      const authUser = AuthApi.createAuthUserFromInstance(newInstance);

      AuthStorage.setAuthUser(authUser);
      AuthStorage.setInstanceId(newInstance.id);

      return authUser;
    } catch (error) {
      console.error('🔐 AUTH: Erro no registro:', error);
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
    console.log('🔐 AUTH: Fazendo logout...');
    AuthStorage.clearAuth();
    console.log('🔐 AUTH: Logout realizado');
  }

  getCurrentUser(): AuthUser | null {
    const user = AuthStorage.getAuthUser();
    console.log('🔐 AUTH: getCurrentUser chamado:', {
      hasUser: !!user,
      userId: user?.id,
      email: user?.email,
      instance_name: user?.instance_name
    });
    return user;
  }

  getInstanceId(): string | null {
    const instanceId = AuthStorage.getInstanceId();
    console.log('🔐 AUTH: getInstanceId chamado:', instanceId);
    return instanceId;
  }

  isAuthenticated(): boolean {
    const user = this.getCurrentUser();
    const instanceId = this.getInstanceId();
    const isAuth = user !== null && instanceId !== null;
    
    console.log('🔐 AUTH: isAuthenticated:', {
      hasUser: !!user,
      hasInstanceId: !!instanceId,
      result: isAuth
    });
    
    return isAuth;
  }
}

export const authService = new AuthService();

// Export AuthUser type for backward compatibility
export type { AuthUser } from '@/types/auth';
