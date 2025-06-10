
export type AreaDireito = 
  | 'trabalhista'
  | 'previdenciario'
  | 'civil'
  | 'tributario'
  | 'penal'
  | 'empresarial'
  | 'consumidor'
  | 'familia'
  | 'outro';

export type FaseKanban = 
  | 'em_qualificacao'
  | 'aguardando_documentos'
  | 'documentos_recebidos'
  | 'analise_juridica'
  | 'aguardando_reuniao'
  | 'reuniao_agendada'
  | 'aguardando_aprovacao'
  | 'aprovado'
  | 'rejeitado'
  | 'concluido';

// Definindo Score como um tipo para compatibilidade com código legado
export type Score = 'low' | 'medium' | 'high';

export interface FaseKanbanConfig {
  id: FaseKanban;
  title: string;
  color?: string;
  order: number;
}

export interface Lead {
  id: string;
  id_visual: string;
  nome: string;
  telefone: string;
  email?: string;
  estado: string;
  profissao: string;
  canal_entrada: string;
  campanha_origem: string;
  data_entrada: string;
  area_direito: AreaDireito;
  resumo_caso: string;
  tese_juridica: string;
  ainda_trabalha?: boolean;
  tipo_vinculo?: 'clt' | 'pj' | 'outro';
  carteira_assinada?: boolean;
  tem_advogado?: boolean;
  tempo_empresa?: string;
  motivo_demissao?: string;
  
  // Campos específicos para Previdenciário
  tipo_beneficio?: string;
  ja_recebe_beneficio?: boolean;
  contribuiu_autonomo?: boolean;
  possui_laudo_medico?: boolean;
  
  // Campos específicos para Família
  tipo_caso_familia?: 'divorcio' | 'pensao' | 'guarda' | 'outro';
  filhos_menores?: boolean;
  acordo_entre_partes?: boolean;
  tempo_uniao?: string;
  
  // Campos específicos para Consumidor
  produto_servico?: string;
  empresa_reclamada?: string;
  data_problema?: string;
  tentou_resolver?: boolean;
  
  // Campos específicos para Criminal
  prisao_flagrante?: boolean;
  advogado_atuando?: boolean;
  vitimas_testemunhas?: boolean;
  caso_andamento?: 'andamento' | 'iniciando';
  
  // Campos genéricos para outras áreas
  tipo_problema?: string;
  possui_urgencia?: boolean;
  documentos_disponiveis?: string;
  
  mensagem_inicial: string;
  score: number; // Alterado de Score para number
  fase_atual: FaseKanban;
  tempo_na_fase: number;
  responsavel_id?: string;
  created_at: string;
  updated_at: string;
}

// Helper para obter rótulo do score (para compatibilidade)
export const getScoreLabel = (score: number): string => {
  if (score <= 30) return 'Baixo';
  if (score <= 70) return 'Médio';
  return 'Alto';
};

// Helper para obter cor do score
export const getScoreColor = (score: number): string => {
  if (score <= 30) return 'text-red-500';
  if (score <= 70) return 'text-amber-500';
  return 'text-green-500';
};

// Helper para converter o antigo score textual para numérico (para compatibilidade)
export const convertOldScoreToNumber = (oldScore: Score): number => {
  switch (oldScore) {
    case 'low': return 25;
    case 'medium': return 50;
    case 'high': return 100;
    default: return 50;
  }
};

// Helper to get area label
export const getAreaLabel = (area: AreaDireito): string => {
  switch (area) {
    case 'trabalhista': return 'Trabalhista';
    case 'previdenciario': return 'Previdenciário';
    case 'civil': return 'Civil';
    case 'tributario': return 'Tributário';
    case 'penal': return 'Penal';
    case 'familia': return 'Família';
    case 'empresarial': return 'Empresarial';
    case 'consumidor': return 'Consumidor';
    case 'outro': return 'Outro';
    default: return 'Desconhecido';
  }
};

// Helper to format time elapsed
export const formatTimeElapsed = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}min`;
  } else if (minutes < 1440) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins > 0 ? `${mins}min` : ''}`;
  } else {
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    return `${days}d ${hours > 0 ? `${hours}h` : ''}`;
  }
};

// Função para converter Conversation para Lead (para compatibilidade)
export const conversationToLead = (conversation: any): Lead => {
  return {
    id: conversation.id,
    id_visual: conversation.thread_id || `L-${conversation.id.slice(-4)}`,
    nome: conversation.phone, // Usando telefone como nome temporário
    telefone: conversation.phone,
    email: '',
    estado: 'BA',
    profissao: 'Não informado',
    canal_entrada: conversation.channel || 'Site',
    campanha_origem: 'Organic',
    data_entrada: conversation.entry_datetime,
    area_direito: mapLegalAreaToAreaDireito(conversation.legal_area),
    resumo_caso: conversation.case_summary || '',
    tese_juridica: '',
    mensagem_inicial: conversation.case_summary || '',
    score: calculateScoreFromConversation(conversation),
    fase_atual: mapStepToFaseKanban(conversation.step),
    tempo_na_fase: calculateTimeInPhase(conversation.entry_datetime),
    created_at: conversation.entry_datetime,
    updated_at: conversation.entry_datetime,
  };
};

// Helper para mapear área legal para AreaDireito
const mapLegalAreaToAreaDireito = (legalArea: string): AreaDireito => {
  const mapping: Record<string, AreaDireito> = {
    'Trabalhista': 'trabalhista',
    'Previdenciário': 'previdenciario',
    'Civil': 'civil',
    'Cível': 'civil',
    'Tributário': 'tributario',
    'Penal': 'penal',
    'Empresarial': 'empresarial',
    'Consumidor': 'consumidor',
    'Família': 'familia',
  };
  return mapping[legalArea] || 'outro';
};

// Helper para mapear step para FaseKanban
const mapStepToFaseKanban = (step: string): FaseKanban => {
  const mapping: Record<string, FaseKanban> = {
    'em_qualificacao': 'em_qualificacao',
    'aguardando_documentos': 'aguardando_documentos',
    'documentos_recebidos': 'documentos_recebidos',
    'analise_juridica': 'analise_juridica',
    'aguardando_reuniao': 'aguardando_reuniao',
    'reuniao_agendada': 'reuniao_agendada',
    'aguardando_aprovacao': 'aguardando_aprovacao',
    'aprovado': 'aprovado',
    'rejeitado': 'rejeitado',
    'concluido': 'concluido',
  };
  return mapping[step] || 'em_qualificacao';
};

// Helper para calcular score baseado na conversa
const calculateScoreFromConversation = (conversation: any): number => {
  let score = 50; // Score base
  
  // Aumenta score se tem resumo do caso
  if (conversation.case_summary && conversation.case_summary.length > 20) {
    score += 20;
  }
  
  // Aumenta score se já foi aprovado
  if (conversation.approved) {
    score += 30;
  }
  
  // Aumenta score se tem reunião agendada
  if (conversation.meeting_start_time) {
    score += 15;
  }
  
  return Math.min(100, score);
};

// Helper para calcular tempo na fase
const calculateTimeInPhase = (entryDate: string): number => {
  const now = new Date();
  const entry = new Date(entryDate);
  return Math.floor((now.getTime() - entry.getTime()) / (1000 * 60)); // em minutos
};

// Default kanban phases configuration - atualizado para o novo sistema
export const defaultFases: FaseKanbanConfig[] = [
  { id: 'em_qualificacao', title: 'Em Qualificação', order: 1 },
  { id: 'aguardando_documentos', title: 'Aguardando Documentos', order: 2 },
  { id: 'documentos_recebidos', title: 'Documentos Recebidos', order: 3 },
  { id: 'analise_juridica', title: 'Análise Jurídica', order: 4 },
  { id: 'aguardando_reuniao', title: 'Aguardando Reunião', order: 5 },
  { id: 'reuniao_agendada', title: 'Reunião Agendada', order: 6 },
  { id: 'aguardando_aprovacao', title: 'Aguardando Aprovação', order: 7 },
  { id: 'aprovado', title: 'Aprovado', order: 8 },
  { id: 'rejeitado', title: 'Rejeitado', order: 9 },
  { id: 'concluido', title: 'Concluído', order: 10 },
];
