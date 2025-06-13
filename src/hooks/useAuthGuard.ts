
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/authService';

export const useAuthGuard = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🛡️ GUARD: useAuthGuard executado:', {
      isLoading,
      hasUser: !!user,
      userEmail: user?.email,
      instanceName: user?.instance_name,
      isDataComplete: user ? authService.isUserDataComplete() : false
    });

    if (!isLoading) {
      if (!user) {
        console.log('🛡️ GUARD: Usuário não encontrado, redirecionando para login');
        navigate('/login');
      } else if (!authService.isUserDataComplete()) {
        console.log('🛡️ GUARD: Dados do usuário incompletos, fazendo logout e redirecionando');
        authService.logout();
        navigate('/login');
      } else {
        console.log('✅ GUARD: Usuário autenticado e dados completos');
      }
    }
  }, [user, isLoading, navigate]);

  return { user, isLoading };
};
