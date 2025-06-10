
import { supabase } from '@/lib/supabase';
import { ClientInstance, GoogleCalendarEvent } from '@/types/supabase';
import { authService } from './authService';

class CalendarService {
  private getInstanceId(): string {
    const instanceId = authService.getInstanceId();
    if (!instanceId) {
      throw new Error('Usuário não autenticado');
    }
    return instanceId;
  }

  async getClientInstance(): Promise<ClientInstance | null> {
    const instanceId = this.getInstanceId();
    const endpoint = `/clients_instances?id=eq.${instanceId}`;
    const result = await supabase.get<ClientInstance[]>(endpoint);
    return result[0] || null;
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
    
    await supabase.patch(endpoint, updates);
  }

  async refreshGoogleToken(instance: ClientInstance): Promise<string | null> {
    if (!instance.google_refresh_token || !instance.google_calendar_id) {
      console.warn('Tokens Google não configurados');
      return null;
    }

    try {
      // Simular refresh do token (em produção, usar googleapis)
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID || '',
          client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
          refresh_token: instance.google_refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao renovar token Google');
      }

      const data = await response.json();
      const newAccessToken = data.access_token;

      // Atualizar no Supabase
      await this.updateGoogleTokens(newAccessToken);
      
      return newAccessToken;
    } catch (error) {
      console.error('Erro ao renovar token Google:', error);
      return null;
    }
  }

  async getCalendarEvents(startDate?: string, endDate?: string): Promise<GoogleCalendarEvent[]> {
    try {
      const instance = await this.getClientInstance();
      
      if (!instance?.google_calendar_id || !instance?.google_access_token) {
        console.warn('Google Calendar não configurado para esta instância');
        return [];
      }

      const timeMin = startDate || new Date().toISOString();
      const timeMax = endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 dias

      let accessToken = instance.google_access_token;

      // Tentar buscar eventos
      let response = await this.fetchCalendarEvents(instance.google_calendar_id, accessToken, timeMin, timeMax);

      // Se falhar, tentar renovar token
      if (!response.ok && response.status === 401) {
        console.log('Token expirado, tentando renovar...');
        const newToken = await this.refreshGoogleToken(instance);
        
        if (newToken) {
          accessToken = newToken;
          response = await this.fetchCalendarEvents(instance.google_calendar_id, accessToken, timeMin, timeMax);
        }
      }

      if (!response.ok) {
        throw new Error(`Google Calendar API error: ${response.status}`);
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('Erro ao buscar eventos do Google Calendar:', error);
      return [];
    }
  }

  private async fetchCalendarEvents(calendarId: string, accessToken: string, timeMin: string, timeMax: string): Promise<Response> {
    const params = new URLSearchParams({
      timeMin,
      timeMax,
      singleEvents: 'true',
      orderBy: 'startTime'
    });

    return fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
  }

  async getBusySlots(startDate: string, endDate: string): Promise<Array<{start: string, end: string}>> {
    try {
      const instance = await this.getClientInstance();
      
      if (!instance?.google_calendar_id || !instance?.google_access_token) {
        console.warn('Google Calendar não configurado');
        return [];
      }

      let accessToken = instance.google_access_token;

      // Usar freebusy API
      let response = await this.fetchFreeBusy(instance.google_calendar_id, accessToken, startDate, endDate);

      // Se falhar, tentar renovar token
      if (!response.ok && response.status === 401) {
        console.log('Token expirado, tentando renovar...');
        const newToken = await this.refreshGoogleToken(instance);
        
        if (newToken) {
          accessToken = newToken;
          response = await this.fetchFreeBusy(instance.google_calendar_id, accessToken, startDate, endDate);
        }
      }

      if (!response.ok) {
        throw new Error(`Google Calendar FreeBusy API error: ${response.status}`);
      }

      const data = await response.json();
      const calendar = data.calendars[instance.google_calendar_id];
      
      return calendar?.busy || [];
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
    startOfDay.setHours(8, 0, 0, 0); // 8:00
    const endOfDay = new Date(date);
    endOfDay.setHours(18, 0, 0, 0); // 18:00

    const busySlots = await this.getBusySlots(
      startOfDay.toISOString(),
      endOfDay.toISOString()
    );

    const availableSlots: string[] = [];
    const slotDuration = 60; // 1 hora em minutos

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
