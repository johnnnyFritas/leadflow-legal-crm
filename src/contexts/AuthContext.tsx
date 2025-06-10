
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, AuthUser } from '@/services/authService';

interface AuthContextType {
  user: AuthUser | null;
  instanceId: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
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

  const logout = () => {
    authService.logout();
    setUser(null);
    setInstanceId(null);
  };

  return (
    <AuthContext.Provider value={{ user, instanceId, login, logout, isLoading }}>
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
