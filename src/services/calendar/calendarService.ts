
import { GoogleCalendarEvent } from '@/types/supabase';
import { CreateEventData } from './types';
import { googleCalendarApiService } from './googleCalendarApi';

export class CalendarService {
  async getCalendarEvents(startDate?: string, endDate?: string): Promise<GoogleCalendarEvent[]> {
    return googleCalendarApiService.getCalendarEvents(startDate, endDate);
  }

  async createEvent(eventData: CreateEventData): Promise<GoogleCalendarEvent> {
    return googleCalendarApiService.createEvent(eventData);
  }

  async getBusySlots(startDate: string, endDate: string): Promise<Array<{start: string, end: string}>> {
    return googleCalendarApiService.getBusySlots(startDate, endDate);
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
