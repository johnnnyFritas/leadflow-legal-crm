
import { supabase } from '@/lib/supabase';
import { ClientInstance } from '@/types/supabase';
import { authService } from '@/services/authService';
import { GoogleCredentials } from './types';

export class GoogleAuthService {
  private getInstanceId(): string {
    const instanceId = authService.getInstanceId();
    if (!instanceId) {
      throw new Error('Usuário não autenticado');
    }
    return instanceId;
  }

  async getClientInstance(): Promise<ClientInstance | null> {
    try {
      const instanceId = this.getInstanceId();
      console.log('🔍 Buscando instância do cliente:', instanceId);
      const endpoint = `/clients_instances?id=eq.${instanceId}`;
      const result = await supabase.get<ClientInstance[]>(endpoint);
      console.log('📊 Instância encontrada:', result[0] ? 'Sim' : 'Não');
      if (result[0]) {
        console.log('🔑 Dados da instância:', {
          hasCalendarId: !!result[0].google_calendar_id,
          hasAccessToken: !!result[0].google_access_token,
          hasRefreshToken: !!result[0].google_refresh_token,
          calendarId: result[0].google_calendar_id
        });
      }
      return result[0] || null;
    } catch (error) {
      console.error('❌ Erro ao buscar instância do cliente:', error);
      return null;
    }
  }

  async getGoogleCredentials(): Promise<GoogleCredentials | null> {
    try {
      // Primeiro tenta buscar das secrets do Supabase
      const secrets = await supabase.get<any>('/secrets');
      if (secrets.GOOGLE_CLIENT_ID && secrets.GOOGLE_CLIENT_SECRET) {
        console.log('🔐 Usando credenciais Google do Supabase Secrets');
        return {
          clientId: secrets.GOOGLE_CLIENT_ID,
          clientSecret: secrets.GOOGLE_CLIENT_SECRET
        };
      }
    } catch (error) {
      console.warn('⚠️ Não foi possível acessar secrets do Supabase:', error);
    }

    // Fallback para variáveis de ambiente (se disponíveis)
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;
    
    if (clientId && clientSecret) {
      console.log('🔐 Usando credenciais Google das variáveis de ambiente');
      return { clientId, clientSecret };
    }

    console.error('❌ Credenciais Google não encontradas! Configure GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET no Supabase');
    return null;
  }

  async updateGoogleTokens(accessToken: string, refreshToken?: string): Promise<void> {
    const instanceId = this.getInstanceId();
    const endpoint = `/clients_instances?id=eq.${instanceId}`;
    const updates: Partial<ClientInstance> = {
      google_access_token: accessToken
    };
    
    if (refreshToken) {
      updates.google_refresh_token = refreshToken;
    }
    
    console.log('🔄 Atualizando tokens Google para instância:', instanceId);
    await supabase.patch(endpoint, updates);
  }

  async refreshGoogleToken(instance: ClientInstance): Promise<string | null> {
    if (!instance.google_refresh_token) {
      console.warn('⚠️ Refresh token não encontrado para a instância');
      return null;
    }

    const credentials = await this.getGoogleCredentials();
    if (!credentials) {
      console.error('❌ Não foi possível obter credenciais Google para renovar token');
      return null;
    }

    try {
      console.log('🔄 Tentando renovar token Google...');
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: credentials.clientId,
          client_secret: credentials.clientSecret,
          refresh_token: instance.google_refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Erro ao renovar token Google:', errorData);
        return null;
      }

      const data = await response.json();
      const newAccessToken = data.access_token;

      await this.updateGoogleTokens(newAccessToken);
      console.log('✅ Token Google renovado com sucesso');
      
      return newAccessToken;
    } catch (error) {
      console.error('❌ Erro ao renovar token Google:', error);
      return null;
    }
  }
}

export const googleAuthService = new GoogleAuthService();
