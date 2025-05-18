export type Score = 'low' | 'medium' | 'high';

export type AreaDireito = 
  | 'trabalhista'
  | 'previdenciario'
  | 'civil'
  | 'tributario'
  | 'penal'
  | 'empresarial'
  | 'outro';

export type FaseKanban = 
  | 'em_analise'
  | 'notificacao_recebida'
  | 'envio_para_reuniao'
  | 'reuniao_marcada'
  | 'nao_compareceu'
  | 'reuniao_sem_contrato'
  | 'reuniao_com_contrato'
  | 'descartado';

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
  ainda_trabalha: boolean;
  carteira_assinada: boolean;
  tem_advogado: boolean;
  tempo_empresa?: string;
  motivo_demissao?: string;
  mensagem_inicial: string;
  score: Score;
  fase_atual: FaseKanban;
  tempo_na_fase: number;
  responsavel_id?: string;
  created_at: string;
  updated_at: string;
}

// Helper to convert score number to type
export const getScoreType = (score: number): Score => {
  if (score <= 30) return 'low';
  if (score <= 70) return 'medium';
  return 'high';
};

// Helper to get score label
export const getScoreLabel = (score: Score): string => {
  switch (score) {
    case 'low': return 'Baixo';
    case 'medium': return 'Médio';
    case 'high': return 'Alto';
    default: return 'Desconhecido';
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
    case 'empresarial': return 'Empresarial';
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

// Default kanban phases configuration
export const defaultFases: FaseKanbanConfig[] = [
  { id: 'notificacao_recebida', title: 'Notificação Recebida', order: 1 },
  { id: 'em_analise', title: 'Em Análise', order: 2 },
  { id: 'envio_para_reuniao', title: 'Envio para Reunião', order: 3 },
  { id: 'reuniao_marcada', title: 'Reunião Marcada', order: 4 },
  { id: 'nao_compareceu', title: 'Não Compareceu', order: 5 },
  { id: 'reuniao_feita_sem_contrato', title: 'Reunião Feita (sem contrato)', order: 6 },
  { id: 'reuniao_feita_com_contrato', title: 'Reunião Feita (com contrato)', order: 7 },
  { id: 'descartado', title: 'Descartado', order: 8 },
];
