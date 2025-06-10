
import { supabase } from '@/lib/supabase';
import { ClientInstance, GoogleCalendarEvent } from '@/types/supabase';

class CalendarService {
  private instanceId = '550e8400-e29b-41d4-a716-446655440000'; // ID fixo para demonstração

  async getClientInstance(): Promise<ClientInstance | null> {
    const endpoint = `/clients_instances?id=eq.${this.instanceId}`;
    const result = await supabase.get<ClientInstance[]>(endpoint);
    return result[0] || null;
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

      const params = new URLSearchParams({
        calendarId: instance.google_calendar_id,
        timeMin,
        timeMax,
        singleEvents: 'true',
        orderBy: 'startTime'
      });

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${instance.google_calendar_id}/events?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${instance.google_access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

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

  async getAvailableSlots(date: string): Promise<string[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(8, 0, 0, 0); // 8:00
    const endOfDay = new Date(date);
    endOfDay.setHours(18, 0, 0, 0); // 18:00

    const events = await this.getCalendarEvents(
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

      const isOccupied = events.some(event => {
        const eventStart = new Date(event.start.dateTime);
        const eventEnd = new Date(event.end.dateTime);
        
        return (slotStart < eventEnd && slotEnd > eventStart);
      });

      if (!isOccupied) {
        availableSlots.push(slotStart.toISOString());
      }
    }

    return availableSlots;
  }
}

export const calendarService = new CalendarService();
