
import { supabase } from '@/lib/supabase';
import { ClientInstance, GoogleCalendarEvent } from '@/types/supabase';
import { authService } from './authService';

interface CreateEventData {
  summary: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  attendees?: Array<{ email: string }>;
}

// ATENÇÃO: Configure suas credenciais Google reais aqui
// Em produção, use secrets do Supabase ou variáveis de ambiente
const GOOGLE_CLIENT_ID = 'your-google-client-id.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = 'your-google-client-secret';

class CalendarService {
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
      console.log('Buscando instância do cliente:', instanceId);
      const endpoint = `/clients_instances?id=eq.${instanceId}`;
      const result = await supabase.get<ClientInstance[]>(endpoint);
      console.log('Instância encontrada:', result[0] ? 'Sim' : 'Não');
      return result[0] || null;
    } catch (error) {
      console.error('Erro ao buscar instância do cliente:', error);
      return null;
    }
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
    
    console.log('Atualizando tokens Google para instância:', instanceId);
    await supabase.patch(endpoint, updates);
  }

  async refreshGoogleToken(instance: ClientInstance): Promise<string | null> {
    if (!instance.google_refresh_token) {
      console.warn('Refresh token não encontrado para a instância');
      return null;
    }

    try {
      console.log('Tentando renovar token Google...');
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          refresh_token: instance.google_refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erro ao renovar token Google:', errorData);
        return null;
      }

      const data = await response.json();
      const newAccessToken = data.access_token;

      await this.updateGoogleTokens(newAccessToken);
      console.log('Token Google renovado com sucesso');
      
      return newAccessToken;
    } catch (error) {
      console.error('Erro ao renovar token Google:', error);
      return null;
    }
  }

  async getCalendarEvents(startDate?: string, endDate?: string): Promise<GoogleCalendarEvent[]> {
    try {
      console.log('=== BUSCANDO EVENTOS DO GOOGLE CALENDAR ===');
      const instance = await this.getClientInstance();
      
      if (!instance) {
        console.warn('Instância do cliente não encontrada');
        return [];
      }

      console.log('Dados da instância:', {
        hasCalendarId: !!instance.google_calendar_id,
        hasAccessToken: !!instance.google_access_token,
        hasRefreshToken: !!instance.google_refresh_token,
        calendarId: instance.google_calendar_id
      });
      
      if (!instance?.google_calendar_id || !instance?.google_access_token) {
        console.warn('Google Calendar não configurado para esta instância - Calendar ID ou Access Token ausente');
        return [];
      }

      const timeMin = startDate || new Date().toISOString();
      const timeMax = endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      console.log('Parâmetros da busca:', { 
        timeMin, 
        timeMax, 
        calendarId: instance.google_calendar_id 
      });

      let accessToken = instance.google_access_token;
      let response = await this.fetchCalendarEvents(instance.google_calendar_id, accessToken, timeMin, timeMax);

      console.log('Resposta inicial da API Google:', response.status, response.statusText);

      if (!response.ok && response.status === 401) {
        console.log('Token expirado (401), tentando renovar...');
        const newToken = await this.refreshGoogleToken(instance);
        
        if (newToken) {
          accessToken = newToken;
          console.log('Fazendo nova tentativa com token renovado...');
          response = await this.fetchCalendarEvents(instance.google_calendar_id, accessToken, timeMin, timeMax);
          console.log('Resposta após renovação do token:', response.status, response.statusText);
        } else {
          console.error('Não foi possível renovar o token');
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro da API Google Calendar:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        return [];
      }

      const data = await response.json();
      console.log('Dados recebidos do Google Calendar:', {
        totalItems: data.items?.length || 0,
        items: data.items?.map((item: any) => ({
          id: item.id,
          summary: item.summary,
          start: item.start,
          end: item.end
        })) || []
      });
      
      return data.items || [];
    } catch (error) {
      console.error('Erro geral ao buscar eventos do Google Calendar:', error);
      return [];
    }
  }

  async createEvent(eventData: CreateEventData): Promise<GoogleCalendarEvent> {
    try {
      console.log('=== CRIANDO EVENTO NO GOOGLE CALENDAR ===');
      const instance = await this.getClientInstance();
      
      if (!instance?.google_calendar_id || !instance?.google_access_token) {
        throw new Error('Google Calendar não configurado para esta instância');
      }

      console.log('Dados do evento a ser criado:', eventData);

      let accessToken = instance.google_access_token;
      let response = await this.postCalendarEvent(instance.google_calendar_id, accessToken, eventData);

      if (!response.ok && response.status === 401) {
        console.log('Token expirado, tentando renovar...');
        const newToken = await this.refreshGoogleToken(instance);
        
        if (newToken) {
          accessToken = newToken;
          response = await this.postCalendarEvent(instance.google_calendar_id, accessToken, eventData);
        }
      }

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Erro ao criar evento:', errorData);
        throw new Error(`Erro ao criar evento: ${response.status} - ${errorData}`);
      }

      const createdEvent = await response.json();
      console.log('Evento criado com sucesso:', createdEvent.id);
      return createdEvent;
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      throw error;
    }
  }

  private async fetchCalendarEvents(calendarId: string, accessToken: string, timeMin: string, timeMax: string): Promise<Response> {
    const params = new URLSearchParams({
      timeMin,
      timeMax,
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '100'
    });

    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`;
    console.log('URL da requisição Google Calendar:', url);

    return fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
  }

  private async postCalendarEvent(calendarId: string, accessToken: string, eventData: CreateEventData): Promise<Response> {
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;
    console.log('Criando evento na URL:', url);
    
    return fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventData)
    });
  }

  async getBusySlots(startDate: string, endDate: string): Promise<Array<{start: string, end: string}>> {
    try {
      console.log('=== BUSCANDO SLOTS OCUPADOS ===');
      const instance = await this.getClientInstance();
      
      if (!instance?.google_calendar_id || !instance?.google_access_token) {
        console.warn('Google Calendar não configurado para buscar slots ocupados');
        return [];
      }

      let accessToken = instance.google_access_token;
      let response = await this.fetchFreeBusy(instance.google_calendar_id, accessToken, startDate, endDate);

      if (!response.ok && response.status === 401) {
        console.log('Token expirado, tentando renovar...');
        const newToken = await this.refreshGoogleToken(instance);
        
        if (newToken) {
          accessToken = newToken;
          response = await this.fetchFreeBusy(instance.google_calendar_id, accessToken, startDate, endDate);
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro na API FreeBusy:', errorText);
        return [];
      }

      const data = await response.json();
      const calendar = data.calendars[instance.google_calendar_id];
      const busySlots = calendar?.busy || [];
      
      console.log('Slots ocupados encontrados:', busySlots);
      return busySlots;
    } catch (error) {
      console.error('Erro ao buscar slots ocupados:', error);
      return [];
    }
  }

  private async fetchFreeBusy(calendarId: string, accessToken: string, timeMin: string, timeMax: string): Promise<Response> {
    return fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        timeMin,
        timeMax,
        items: [{ id: calendarId }]
      })
    });
  }

  async getAvailableSlots(date: string): Promise<string[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(8, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(18, 0, 0, 0);

    const busySlots = await this.getBusySlots(
      startOfDay.toISOString(),
      endOfDay.toISOString()
    );

    const availableSlots: string[] = [];
    const slotDuration = 60;

    for (let hour = 8; hour < 18; hour++) {
      const slotStart = new Date(date);
      slotStart.setHours(hour, 0, 0, 0);
      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration);

      const isOccupied = busySlots.some(slot => {
        const slotStartTime = new Date(slot.start);
        const slotEndTime = new Date(slot.end);
        
        return (slotStart < slotEndTime && slotEnd > slotStartTime);
      });

      if (!isOccupied) {
        availableSlots.push(slotStart.toISOString());
      }
    }

    return availableSlots;
  }
}

export const calendarService = new CalendarService();
