
import { supabase } from '@/lib/supabase';
import { ClientInstance } from '@/types/supabase';
import { AuthUser } from '@/types/auth';
import { generateInstanceName } from '@/utils/instanceUtils';

export class AuthApi {
  static async updateInstanceData(instanceId: string, phone: string): Promise<void> {
    try {
      console.log('Atualizando dados da instância no Supabase:', { instanceId, phone });

      await supabase.patch(`/clients_instances?id=eq.${instanceId}`, {
        instance_id: instanceId,
        phone: phone
      });

      console.log('Dados da instância atualizados com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar dados da instância:', error);
      throw error;
    }
  }

  static async findUserByEmail(email: string): Promise<ClientInstance | null> {
    const instances = await supabase.get<ClientInstance[]>(`/clients_instances?email=eq.${encodeURIComponent(email.toLowerCase().trim())}&limit=1`);
    
    if (!instances || instances.length === 0) {
      return null;
    }
    
    return instances[0];
  }

  static async updateInstanceName(instanceId: string, instanceName: string): Promise<void> {
    await supabase.patch(`/clients_instances?id=eq.${instanceId}`, {
      instance_name: instanceName
    });
  }

  static async createNewInstance(email: string, password: string, name: string): Promise<ClientInstance> {
    const instanceName = generateInstanceName(name);

    const instanceData = {
      email: email.toLowerCase().trim(),
      company_name: name,
      instance_name: instanceName,
      main_lawyer_name: name,
      password: password,
      created_at: new Date().toISOString()
    };

    const newInstances = await supabase.post<ClientInstance[]>('/clients_instances', instanceData);

    if (!newInstances || newInstances.length === 0) {
      throw new Error('Erro ao criar conta');
    }

    return newInstances[0];
  }

  static async updatePassword(instanceId: string, newPassword: string): Promise<void> {
    await supabase.patch(`/clients_instances?id=eq.${instanceId}`, {
      password: newPassword
    });
  }

  static createAuthUserFromInstance(instance: ClientInstance): AuthUser {
    return {
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
  }
}
