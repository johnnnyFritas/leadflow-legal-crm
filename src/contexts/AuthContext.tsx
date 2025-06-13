
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, AuthUser } from '@/services/authService';

interface AuthContextType {
  user: AuthUser | null;
  instanceId: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  updateUserProfile: (userData: AuthUser) => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [instanceId, setInstanceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('🔐 CONTEXT: Inicializando AuthProvider...');
    
    // Verificar se há usuário logado ao carregar a aplicação
    const currentUser = authService.getCurrentUser();
    const currentInstanceId = authService.getInstanceId();
    
    console.log('🔐 CONTEXT: Dados recuperados do localStorage:', {
      hasUser: !!currentUser,
      hasInstanceId: !!currentInstanceId,
      userEmail: currentUser?.email,
      instanceName: currentUser?.instance_name,
      isDataComplete: authService.isUserDataComplete()
    });
    
    // Só definir o usuário se os dados estiverem completos
    if (currentUser && currentInstanceId && authService.isUserDataComplete()) {
      console.log('✅ CONTEXT: Usuário válido encontrado, definindo estado');
      setUser(currentUser);
      setInstanceId(currentInstanceId);
    } else {
      console.log('⚠️ CONTEXT: Dados incompletos ou ausentes, limpando estado');
      // Limpar dados inválidos
      if (currentUser || currentInstanceId) {
        authService.logout();
      }
      setUser(null);
      setInstanceId(null);
    }
    
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('🔐 CONTEXT: Tentando login...');
      const authUser = await authService.login(email, password);
      if (authUser && authService.isUserDataComplete()) {
        console.log('✅ CONTEXT: Login bem-sucedido, definindo estado');
        setUser(authUser);
        setInstanceId(authUser.id);
      } else {
        console.error('❌ CONTEXT: Login falhou - dados incompletos');
        throw new Error('Dados de login incompletos');
      }
    } catch (error) {
      console.error('❌ CONTEXT: Erro no login:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      console.log('🔐 CONTEXT: Tentando registro...');
      const authUser = await authService.register(email, password, name);
      if (authUser && authService.isUserDataComplete()) {
        console.log('✅ CONTEXT: Registro bem-sucedido, definindo estado');
        setUser(authUser);
        setInstanceId(authUser.id);
      } else {
        console.error('❌ CONTEXT: Registro falhou - dados incompletos');
        throw new Error('Dados de registro incompletos');
      }
    } catch (error) {
      console.error('❌ CONTEXT: Erro no registro:', error);
      throw error;
    }
  };

  const logout = () => {
    console.log('🔐 CONTEXT: Fazendo logout...');
    authService.logout();
    setUser(null);
    setInstanceId(null);
    console.log('✅ CONTEXT: Logout realizado');
  };

  const updateUserProfile = (userData: AuthUser) => {
    console.log('🔐 CONTEXT: Atualizando perfil do usuário...');
    setUser(userData);
    localStorage.setItem('authUser', JSON.stringify(userData));
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      await authService.changePassword(currentPassword, newPassword);
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, instanceId, login, register, logout, isLoading, updateUserProfile, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
