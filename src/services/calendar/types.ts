
export interface CreateEventData {
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

export interface GoogleCredentials {
  clientId: string;
  clientSecret: string;
}

export interface BusySlot {
  start: string;
  end: string;
}
