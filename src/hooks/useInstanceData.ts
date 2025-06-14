
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/sonner';
import { evolutionApi } from '@/services/evolution/evolutionApi';
import { InstanceStatus } from '@/types/evolution';

export const useInstanceData = (userId?: string) => {
  const [instanceData, setInstanceData] = useState<any>(null);
  const [instanceStatus, setInstanceStatus] = useState<InstanceStatus['status']>('disconnected');
  const [connectedPhone, setConnectedPhone] = useState<string>('');

  const cleanInstanceName = useCallback((name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '')
      .replace(/\s+/g, '');
  }, []);

  const fetchInstanceData = useCallback(async () => {
    if (!userId) return null;

    try {
      console.log('Buscando instância com ID:', userId);
      
      const response = await supabase.get<any[]>(`/clients_instances?id=eq.${userId}`);
      
      if (!response || response.length === 0) {
        console.error('Instância não encontrada para o ID:', userId);
        toast.error('Dados da instância não encontrados');
        return null;
      }

      let instance = response[0];
      console.log('Instância encontrada:', instance);

      if (!instance.instance_name && instance.company_name) {
        const instanceName = cleanInstanceName(instance.company_name);
        console.log('Gerando instance_name:', instanceName);
        
        try {
          await supabase.patch(`/clients_instances?id=eq.${instance.id}`, {
            instance_name: instanceName
          });
          instance.instance_name = instanceName;
          console.log('Instance_name atualizado com sucesso');
        } catch (error) {
          console.error('Erro ao atualizar instance_name:', error);
          instance.instance_name = instanceName;
        }
      }

      setInstanceData(instance);
      return instance;
    } catch (error) {
      console.error('Erro ao buscar dados da instância:', error);
      toast.error('Erro ao carregar dados da instância');
      return null;
    }
  }, [userId, cleanInstanceName]);

  const checkInstanceStatus = useCallback(async (instanceName: string) => {
    try {
      console.log('Verificando status da instância:', instanceName);
      const status = await evolutionApi.getInstanceStatus(instanceName);
      console.log('Status atual da instância:', status);
      
      if (status && status.instance) {
        const mappedStatus: InstanceStatus = {
          instance: status.instance.instanceName,
          status: status.instance.state === 'open' ? 'connected' : 'disconnected',
          phone: status.instance.profilePictureUrl ? status.instance.profileName : undefined,
          instanceId: status.instance.instanceId
        };
        
        console.log('Status mapeado:', mappedStatus);
        setInstanceStatus(mappedStatus.status);
        
        if (mappedStatus.phone) {
          setConnectedPhone(mappedStatus.phone);
        }
        
        return mappedStatus;
      }
    } catch (error) {
      console.log('Erro ao verificar status da instância, continuando...', error);
    }
  }, []);

  const updateInstanceStatus = useCallback(async (status: InstanceStatus) => {
    if (!instanceData?.id) return;

    try {
      const updateData: any = {
        is_connected: status.status === 'connected'
      };

      if (status.phone) {
        updateData.phone = status.phone;
        setConnectedPhone(status.phone);
      }
      if (status.instanceId) {
        updateData.instance_id = status.instanceId;
      }

      if (status.status === 'disconnected') {
        updateData.phone = null;
        updateData.instance_id = null;
        setConnectedPhone('');
      }

      await supabase.patch(`/clients_instances?id=eq.${instanceData.id}`, updateData);
      setInstanceData(prev => ({ ...prev, ...updateData }));
      
      console.log('Status da instância atualizado no banco:', updateData);
    } catch (error) {
      console.error('Erro ao atualizar status da instância:', error);
    }
  }, [instanceData]);

  return {
    instanceData,
    instanceStatus,
    connectedPhone,
    setInstanceData,
    setInstanceStatus,
    setConnectedPhone,
    fetchInstanceData,
    checkInstanceStatus,
    updateInstanceStatus
  };
};
