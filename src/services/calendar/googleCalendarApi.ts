
import { GoogleCalendarEvent } from '@/types/supabase';
import { CreateEventData, BusySlot } from './types';
import { googleAuthService } from './googleAuth';

export class GoogleCalendarApiService {
  private async fetchCalendarEvents(calendarId: string, accessToken: string, timeMin: string, timeMax: string): Promise<Response> {
    const params = new URLSearchParams({
      timeMin,
      timeMax,
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '100'
    });

    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`;
    console.log('🌐 URL da requisição Google Calendar:', url);

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

  async getCalendarEvents(startDate?: string, endDate?: string): Promise<GoogleCalendarEvent[]> {
    try {
      console.log('📅 === BUSCANDO EVENTOS DO GOOGLE CALENDAR ===');
      const instance = await googleAuthService.getClientInstance();
      
      if (!instance) {
        console.warn('⚠️ Instância do cliente não encontrada');
        return [];
      }
      
      if (!instance?.google_calendar_id || !instance?.google_access_token) {
        console.warn('⚠️ Google Calendar não configurado para esta instância - Calendar ID ou Access Token ausente');
        console.log('📊 Status da configuração:', {
          hasCalendarId: !!instance?.google_calendar_id,
          hasAccessToken: !!instance?.google_access_token,
          hasRefreshToken: !!instance?.google_refresh_token
        });
        return [];
      }

      const timeMin = startDate || new Date().toISOString();
      const timeMax = endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      console.log('📅 Parâmetros da busca:', { 
        timeMin, 
        timeMax, 
        calendarId: instance.google_calendar_id 
      });

      let accessToken = instance.google_access_token;
      let response = await this.fetchCalendarEvents(instance.google_calendar_id, accessToken, timeMin, timeMax);

      console.log('📡 Resposta inicial da API Google:', response.status, response.statusText);

      if (!response.ok && response.status === 401) {
        console.log('🔄 Token expirado (401), tentando renovar...');
        const newToken = await googleAuthService.refreshGoogleToken(instance);
        
        if (newToken) {
          accessToken = newToken;
          console.log('🔄 Fazendo nova tentativa com token renovado...');
          response = await this.fetchCalendarEvents(instance.google_calendar_id, accessToken, timeMin, timeMax);
          console.log('📡 Resposta após renovação do token:', response.status, response.statusText);
        } else {
          console.error('❌ Não foi possível renovar o token');
          return [];
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro da API Google Calendar:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        return [];
      }

      const data = await response.json();
      console.log('✅ Dados recebidos do Google Calendar:', {
        totalItems: data.items?.length || 0,
        items: data.items?.slice(0, 3).map((item: any) => ({
          id: item.id,
          summary: item.summary,
          start: item.start,
          end: item.end
        })) || []
      });
      
      return data.items || [];
    } catch (error) {
      console.error('❌ Erro geral ao buscar eventos do Google Calendar:', error);
      return [];
    }
  }

  async createEvent(eventData: CreateEventData): Promise<GoogleCalendarEvent> {
    try {
      console.log('=== CRIANDO EVENTO NO GOOGLE CALENDAR ===');
      const instance = await googleAuthService.getClientInstance();
      
      if (!instance?.google_calendar_id || !instance?.google_access_token) {
        throw new Error('Google Calendar não configurado para esta instância');
      }

      console.log('Dados do evento a ser criado:', eventData);

      let accessToken = instance.google_access_token;
      let response = await this.postCalendarEvent(instance.google_calendar_id, accessToken, eventData);

      if (!response.ok && response.status === 401) {
        console.log('Token expirado, tentando renovar...');
        const newToken = await googleAuthService.refreshGoogleToken(instance);
        
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

  async getBusySlots(startDate: string, endDate: string): Promise<BusySlot[]> {
    try {
      console.log('=== BUSCANDO SLOTS OCUPADOS ===');
      const instance = await googleAuthService.getClientInstance();
      
      if (!instance?.google_calendar_id || !instance?.google_access_token) {
        console.warn('Google Calendar não configurado para buscar slots ocupados');
        return [];
      }

      let accessToken = instance.google_access_token;
      let response = await this.fetchFreeBusy(instance.google_calendar_id, accessToken, startDate, endDate);

      if (!response.ok && response.status === 401) {
        console.log('Token expirado, tentando renovar...');
        const newToken = await googleAuthService.refreshGoogleToken(instance);
        
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
}

export const googleCalendarApiService = new GoogleCalendarApiService();
