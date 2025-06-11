export interface ClientInstance {
  id: string;
  instance_id: string; // Added missing property
  company_name: string;
  instance_name: string;
  phone: string;
  phone_admin?: string;
  google_access_token?: string;
  google_refresh_token?: string;
  google_calendar_id?: string;
  min_notice_minutes: number;
  meeting_duration_minutes: number;
  email: string;
  password?: string; // Added password field
  main_lawyer_name?: string;
  secondary_attendant_name?: string;
  secondary_attendant_phone?: string;
  needs_approval: boolean;
  assistant_reception_id?: string;
  assistant_scheduling_id?: string;
  toggle_switch: boolean;
  form_link?: string;
  gmb_link?: string;
  instagram?: string;
  tiktok?: string;
  official_website?: string;
  linkedin?: string;
  billing_percentage?: number;
  lead_notification_phone?: string;
  created_at: string;
  supabase_table_name?: string;
  plan?: string;
  address?: string;
  cpf?: string;
  cnpj?: string;
}

export interface Conversation {
  id: string;
  instance_id: string;
  phone: string;
  name?: string; // Added name field
  thread_id: string;
  entry_datetime: string;
  channel: string;
  case_summary: string;
  employment_status: string;
  employment_duration_text: string;
  employment_duration_standardized: number;
  location: string;
  legal_area: string;
  legal_thesis: string;
  step: string;
  event_id: string;
  approved: boolean;
  on_hold: boolean;
  user_choice: boolean;
  message_id_approval: string;
  message_id_choice: string;
  thread_id_auxiliary: string;
  attached_files: any; // JSONB
  meeting_start_time: string | null;
  meeting_link: string;
  profession: string;
  attendant_phone: string | null;
  ConclusãoCaso?: string; // Added field for case conclusion
  Coments?: string; // Added field for comments
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_role: 'client' | 'agent' | 'system';
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
