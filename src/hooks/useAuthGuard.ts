
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const useAuthGuard = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🛡️ GUARD: useAuthGuard executado:', {
      isLoading,
      hasUser: !!user,
      userEmail: user?.email,
      instanceName: user?.instance_name
    });

    if (!isLoading) {
      if (!user) {
        console.log('🛡️ GUARD: Usuário não encontrado, redirecionando para login');
        navigate('/login');
      } else {
        console.log('✅ GUARD: Usuário autenticado');
      }
    }
  }, [user, isLoading, navigate]);

  return { user, isLoading };
};
