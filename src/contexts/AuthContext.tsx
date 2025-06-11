
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
    // Verificar se há usuário logado ao carregar a aplicação
    const currentUser = authService.getCurrentUser();
    const currentInstanceId = authService.getInstanceId();
    
    if (currentUser && currentInstanceId) {
      setUser(currentUser);
      setInstanceId(currentInstanceId);
    }
    
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const authUser = await authService.login(email, password);
      if (authUser) {
        setUser(authUser);
        setInstanceId(authUser.id);
      }
    } catch (error) {
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const authUser = await authService.register(email, password, name);
      if (authUser) {
        setUser(authUser);
        setInstanceId(authUser.id);
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setInstanceId(null);
  };

  const updateUserProfile = (userData: AuthUser) => {
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
