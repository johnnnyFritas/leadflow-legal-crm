
import { useState, useRef, useCallback } from 'react';
import { ConnectionStatus, InstanceStatus } from '@/types/evolution';
import { EvolutionApi } from '@/services/evolution/evolutionApi';
import { authService } from '@/services/authService';

export const useEvolutionStatus = () => {
  const [instanceStatus, setInstanceStatus] = useState<InstanceStatus | null>(null);
  const statusCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const saveInstanceDataToSupabase = useCallback(async (status: InstanceStatus) => {
    try {
      console.log('Salvando dados da instância no Supabase:', status);
      
      if (status.instanceId && status.phone) {
        await authService.updateInstanceData(status.instanceId, status.phone);
        console.log('Dados salvos no Supabase com sucesso');
      }
    } catch (error) {
      console.error('Erro ao salvar dados no Supabase:', error);
    }
  }, []);

  const startStatusCheck = useCallback((
    instanceName: string,
    connectionStatus: ConnectionStatus,
    onStatusChange: (status: ConnectionStatus) => void,
    onConnected: (status: InstanceStatus) => void
  ) => {
    if (statusCheckIntervalRef.current) {
      clearInterval(statusCheckIntervalRef.current);
    }

    statusCheckIntervalRef.current = setInterval(async () => {
      try {
        const status = await EvolutionApi.fetchInstanceStatus(instanceName);
        setInstanceStatus(status);
        
        if (status?.ownerJid) {
          // WhatsApp está conectado
          if (connectionStatus !== 'connected') {
            console.log('WhatsApp conectado detectado:', status);
            onStatusChange('connected');
            
            // Salvar dados no Supabase
            await saveInstanceDataToSupabase(status);
            
            // Notificar conexão
            onConnected(status);
            
            // Parar verificação contínua
            if (statusCheckIntervalRef.current) {
              clearInterval(statusCheckIntervalRef.current);
              statusCheckIntervalRef.current = null;
            }
          }
        } else {
          // WhatsApp não está conectado
          if (connectionStatus === 'connected') {
            onStatusChange('waiting_qr');
          }
        }
      } catch (error) {
        console.error('Erro na verificação de status:', error);
      }
    }, 3000); // Verificar a cada 3 segundos
  }, [saveInstanceDataToSupabase]);

  const stopStatusCheck = useCallback(() => {
    if (statusCheckIntervalRef.current) {
      clearInterval(statusCheckIntervalRef.current);
      statusCheckIntervalRef.current = null;
    }
  }, []);

  return {
    instanceStatus,
    setInstanceStatus,
    startStatusCheck,
    stopStatusCheck
  };
};
