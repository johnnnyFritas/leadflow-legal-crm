
export interface ClientInstance {
  id: string;
  company_name: string;
  instance_name: string;
  phone: string;
  email: string;
  assistant_reception_id?: string;
  assistant_scheduling_id?: string;
  google_calendar_id?: string;
  google_access_token?: string;
  google_refresh_token?: string;
  meeting_duration_minutes: number;
  min_notice_minutes: number;
  needs_approval: boolean;
  lead_notification_phone?: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  instance_id: string;
  phone: string;
  thread_id: string;
  entry_datetime: string;
  case_summary: string;
  legal_area: string;
  step: string;
  channel: string;
  meeting_link?: string;
  meeting_start_time?: string;
  event_id?: string;
  approved: boolean;
  attendant_phone?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_role: 'client' | 'agent';
  sender_phone: string;
  content: string;
  message_type: 'text' | 'file' | 'image';
  sent_at: string;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
}

// Mapeamento dos steps do kanban
export const KANBAN_STEPS = {
  'em_qualificacao': 'Em Qualificação',
  'aguardando_documentos': 'Aguardando Documentos',
  'documentos_recebidos': 'Documentos Recebidos',
  'analise_juridica': 'Análise Jurídica',
  'aguardando_reuniao': 'Aguardando Reunião',
  'reuniao_agendada': 'Reunião Agendada',
  'aguardando_aprovacao': 'Aguardando Aprovação',
  'aprovado': 'Aprovado',
  'rejeitado': 'Rejeitado',
  'concluido': 'Concluído'
} as const;

export type KanbanStep = keyof typeof KANBAN_STEPS;
