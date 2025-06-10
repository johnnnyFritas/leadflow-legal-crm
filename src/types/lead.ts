
import { Conversation } from './supabase';

// Mapear steps do Supabase para fases do Kanban
export const SUPABASE_STEPS = {
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

export type FaseKanban = keyof typeof SUPABASE_STEPS;

export const defaultFases: FaseKanbanConfig[] = [
  { id: 'em_qualificacao', title: 'Em Qualificação', color: 'bg-blue-100 text-blue-800', order: 1 },
  { id: 'aguardando_documentos', title: 'Aguardando Documentos', color: 'bg-yellow-100 text-yellow-800', order: 2 },
  { id: 'documentos_recebidos', title: 'Documentos Recebidos', color: 'bg-orange-100 text-orange-800', order: 3 },
  { id: 'analise_juridica', title: 'Análise Jurídica', color: 'bg-purple-100 text-purple-800', order: 4 },
  { id: 'aguardando_reuniao', title: 'Aguardando Reunião', color: 'bg-indigo-100 text-indigo-800', order: 5 },
  { id: 'reuniao_agendada', title: 'Reunião Agendada', color: 'bg-teal-100 text-teal-800', order: 6 },
  { id: 'aguardando_aprovacao', title: 'Aguardando Aprovação', color: 'bg-pink-100 text-pink-800', order: 7 },
  { id: 'aprovado', title: 'Aprovado', color: 'bg-green-100 text-green-800', order: 8 },
  { id: 'rejeitado', title: 'Rejeitado', color: 'bg-red-100 text-red-800', order: 9 },
  { id: 'concluido', title: 'Concluído', color: 'bg-gray-100 text-gray-800', order: 10 }
];

export interface FaseKanbanConfig {
  id: FaseKanban;
  title: string;
  color: string;
  order: number;
}

export type AreaDireito = 
  | 'trabalhista' 
  | 'previdenciario' 
  | 'civil' 
  | 'tributario' 
  | 'penal' 
  | 'familia' 
  | 'consumidor'
  | 'empresarial'
  | 'outro';

export type Score = 25 | 50 | 75 | 100;

export interface Lead {
  id: string;
  id_visual: string;
  nome: string;
  telefone: string;
  email?: string;
  estado?: string;
  profissao?: string;
  canal_entrada: string;
  campanha_origem?: string;
  data_entrada: string;
  area_direito: AreaDireito;
  resumo_caso: string;
  tese_juridica?: string;
  ainda_trabalha?: boolean;
  carteira_assinada?: boolean;
  tem_advogado?: boolean;
  tempo_empresa?: string;
  motivo_demissao?: string;
  mensagem_inicial?: string;
  score: Score;
  fase_atual: FaseKanban;
  tempo_na_fase: number;
  responsavel_id?: string;
  created_at: string;
  updated_at: string;
  
  // Campos específicos do Supabase
  thread_id?: string;
  employment_status?: string;
  employment_duration_text?: string;
  employment_duration_standardized?: number;
  location?: string;
  legal_area?: string;
  legal_thesis?: string;
  approved?: boolean;
  on_hold?: boolean;
  user_choice?: boolean;
  meeting_start_time?: string;
  meeting_link?: string;
  event_id?: string;
  attendant_phone?: string;

  // Campos específicos por área do direito
  tipo_vinculo?: string;
  tipo_beneficio?: string;
  ja_recebe_beneficio?: boolean;
  contribuiu_autonomo?: boolean;
  possui_laudo_medico?: boolean;
  tipo_caso_familia?: 'divorcio' | 'pensao' | 'guarda' | 'outro';
  filhos_menores?: boolean;
  acordo_entre_partes?: boolean;
  tempo_uniao?: string;
  produto_servico?: string;
  empresa_reclamada?: string;
  data_problema?: string;
  tentou_resolver?: boolean;
  prisao_flagrante?: boolean;
  advogado_atuando?: boolean;
  vitimas_testemunhas?: boolean;
  caso_andamento?: 'andamento' | 'iniciando';
  tipo_problema?: string;
  possui_urgencia?: boolean;
  documentos_disponiveis?: string;
}

// Utility functions
export function getScoreLabel(score: number): string {
  if (score <= 30) return 'Baixo';
  if (score <= 70) return 'Médio';
  return 'Alto';
}

export function formatTimeElapsed(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}min`;
  } else if (minutes < 1440) {
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  } else {
    const days = Math.floor(minutes / 1440);
    return `${days}d`;
  }
}

export function getAreaLabel(area: AreaDireito): string {
  const labels: Record<AreaDireito, string> = {
    'trabalhista': 'Trabalhista',
    'previdenciario': 'Previdenciário', 
    'civil': 'Civil',
    'tributario': 'Tributário',
    'penal': 'Penal',
    'familia': 'Família',
    'consumidor': 'Consumidor',
    'empresarial': 'Empresarial',
    'outro': 'Outro'
  };
  return labels[area] || 'Outro';
}

// Função para converter Conversation do Supabase para Lead
export function conversationToLead(conversation: Conversation): Lead {
  // Calcular score baseado nos dados disponíveis
  let score: Score = 50; // Score padrão
  
  if (conversation.approved) score = 100;
  else if (conversation.legal_area && conversation.case_summary) score = 75;
  else if (conversation.case_summary) score = 50;
  else score = 25;

  // Mapear área do direito
  const areaMapping: Record<string, AreaDireito> = {
    'Trabalhista': 'trabalhista',
    'Previdenciário': 'previdenciario',
    'Civil': 'civil',
    'Tributário': 'tributario',
    'Penal': 'penal',
    'Família': 'familia',
    'Consumidor': 'consumidor',
    'Empresarial': 'empresarial'
  };

  const area_direito = areaMapping[conversation.legal_area || ''] || 'outro';

  // Calcular tempo na fase (em minutos desde entry_datetime)
  const tempoNaFase = conversation.entry_datetime 
    ? Math.floor((Date.now() - new Date(conversation.entry_datetime).getTime()) / (1000 * 60))
    : 0;

  // Extrair nome do telefone ou usar número
  const nome = conversation.profession || conversation.phone || 'Cliente Anônimo';

  return {
    id: conversation.id,
    id_visual: `QD-${new Date(conversation.entry_datetime || Date.now()).getFullYear()}-${conversation.id.slice(-6).toUpperCase()}`,
    nome,
    telefone: conversation.phone,
    email: undefined, // Não mapeado na conversation
    estado: conversation.location || undefined,
    profissao: conversation.profession || undefined,
    canal_entrada: conversation.channel || 'Site',
    campanha_origem: undefined,
    data_entrada: conversation.entry_datetime || new Date().toISOString(),
    area_direito,
    resumo_caso: conversation.case_summary || '',
    tese_juridica: conversation.legal_thesis || undefined,
    ainda_trabalha: conversation.employment_status === 'Empregado',
    carteira_assinada: conversation.employment_status === 'Empregado',
    tem_advogado: false, // Padrão
    tempo_empresa: conversation.employment_duration_text || undefined,
    motivo_demissao: conversation.employment_status === 'Desempregado' ? 'Não informado' : undefined,
    mensagem_inicial: conversation.case_summary || '',
    score,
    fase_atual: (conversation.step as FaseKanban) || 'em_qualificacao',
    tempo_na_fase: tempoNaFase,
    responsavel_id: conversation.attendant_phone || undefined,
    created_at: conversation.entry_datetime || new Date().toISOString(),
    updated_at: conversation.entry_datetime || new Date().toISOString(),
    
    // Campos específicos do Supabase
    thread_id: conversation.thread_id,
    employment_status: conversation.employment_status,
    employment_duration_text: conversation.employment_duration_text,
    employment_duration_standardized: conversation.employment_duration_standardized,
    location: conversation.location,
    legal_area: conversation.legal_area,
    legal_thesis: conversation.legal_thesis,
    approved: conversation.approved,
    on_hold: conversation.on_hold,
    user_choice: conversation.user_choice,
    meeting_start_time: conversation.meeting_start_time || undefined,
    meeting_link: conversation.meeting_link,
    event_id: conversation.event_id,
    attendant_phone: conversation.attendant_phone
  };
}

// Função para converter Lead para Conversation (para updates)
export function leadToConversation(lead: Lead, instanceId: string): Partial<Conversation> {
  return {
    id: lead.id,
    instance_id: instanceId,
    phone: lead.telefone,
    thread_id: lead.thread_id || `thread_${Date.now()}`,
    entry_datetime: lead.data_entrada,
    channel: lead.canal_entrada,
    case_summary: lead.resumo_caso,
    employment_status: lead.employment_status || (lead.ainda_trabalha ? 'Empregado' : 'Desempregado'),
    employment_duration_text: lead.employment_duration_text || lead.tempo_empresa,
    employment_duration_standardized: lead.employment_duration_standardized || 0,
    location: lead.location || lead.estado,
    legal_area: lead.legal_area || lead.area_direito,
    legal_thesis: lead.legal_thesis || lead.tese_juridica,
    step: lead.fase_atual,
    event_id: lead.event_id || '',
    approved: lead.approved || false,
    on_hold: lead.on_hold || false,
    user_choice: lead.user_choice || false,
    message_id_approval: '',
    message_id_choice: '',
    thread_id_auxiliary: '',
    attached_files: null,
    meeting_start_time: lead.meeting_start_time || null,
    meeting_link: lead.meeting_link || '',
    profession: lead.profissao || '',
    attendant_phone: lead.attendant_phone || null
  };
}
