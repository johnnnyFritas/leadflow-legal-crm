
import { Lead, AreaDireito, FaseKanban, Score } from '@/types/lead';

// Função para gerar um ID visual no formato QD-2025-XXXXXX
const gerarIdVisual = (): string => {
  const numeroRandom = Math.floor(100000 + Math.random() * 900000);
  return `QD-2025-${numeroRandom}`;
};

// Função para gerar um tempo aleatório em minutos (de 5 minutos a 10 dias)
const gerarTempoAleatorio = (): number => {
  return Math.floor(5 + Math.random() * 14400); // 5 minutos a 10 dias em minutos
};

// Função para gerar uma data aleatória nos últimos 30 dias
const gerarDataAleatoria = (): string => {
  const hoje = new Date();
  const diasAleatorios = Math.floor(Math.random() * 30);
  const horasAleatorias = Math.floor(Math.random() * 24);
  const minutosAleatorios = Math.floor(Math.random() * 60);
  
  const data = new Date(
    hoje.getFullYear(),
    hoje.getMonth(),
    hoje.getDate() - diasAleatorios,
    horasAleatorias,
    minutosAleatorios
  );
  
  return data.toISOString();
};

// Arrays com valores possíveis
const nomes = [
  'João Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Souza', 
  'Carlos Pereira', 'Juliana Costa', 'Roberto Almeida', 'Fernanda Lima',
  'Bruno Ferreira', 'Patricia Gomes', 'Ricardo Martins', 'Camila Rodrigues',
  'Eduardo Santos', 'Luciana Oliveira', 'Marcelo Sousa', 'Beatriz Pereira',
  'Daniel Costa', 'Amanda Almeida', 'Felipe Lima', 'Cristina Ferreira'
];

const telefones = [
  '(11) 98765-4321', '(21) 98765-1234', '(31) 97654-3210', '(41) 96543-2109',
  '(51) 95432-1098', '(61) 94321-0987', '(71) 93210-9876', '(81) 92109-8765',
  '(91) 91098-7654', '(12) 90987-6543', '(22) 98756-4312', '(32) 97645-3201'
];

const estados = [
  'SP', 'RJ', 'MG', 'PR', 'RS', 'SC', 'BA', 'PE', 'CE', 'GO', 'DF', 'AM'
];

const profissoes = [
  'Professor', 'Engenheiro', 'Médico', 'Advogado', 'Contador', 'Programador',
  'Designer', 'Vendedor', 'Motorista', 'Enfermeiro', 'Administrador', 'Empresário'
];

const canaisEntrada = [
  'Site', 'Instagram', 'Facebook', 'Google', 'Indicação', 'WhatsApp',
  'Email', 'Ligação', 'LinkedIn', 'TikTok', 'YouTube', 'Presencial'
];

const campanhasOrigem = [
  'Google Ads', 'Facebook Ads', 'Instagram Ads', 'Email Marketing', 'Orgânico',
  'YouTube Ads', 'Referência', 'Parceria', 'TikTok Ads', 'LinkedIn Ads'
];

const areasDireito: AreaDireito[] = [
  'trabalhista', 'previdenciario', 'civil', 'tributario', 'penal', 'empresarial', 'outro'
];

const fases: FaseKanban[] = [
  'em_analise', 'notificacao_recebida', 'envio_para_reuniao', 'reuniao_marcada',
  'nao_compareceu', 'reuniao_sem_contrato', 'reuniao_com_contrato', 'descartado'
];

// Valores numéricos de score em vez do tipo String
const scores = [25, 50, 75, 100];

const resumosCaso = [
  'Cliente foi demitido sem justa causa e não recebeu todas as verbas rescisórias.',
  'Acidente de trabalho sem CAT emitida pela empresa.',
  'Cliente busca revisão de aposentadoria.',
  'Ação de danos morais contra empresa de telefonia.',
  'Processo de inventário e partilha de bens.',
  'Cobrança indevida de imposto.',
  'Cliente sofreu calúnia e difamação.',
  'Precisa de defesa em processo criminal.',
  'Abertura de empresa com orientação tributária.',
  'Execução de título extrajudicial.'
];

const tesesJuridicas = [
  'Rescisão indireta do contrato de trabalho',
  'Pagamento de horas extras não registradas',
  'Adicional de insalubridade',
  'Revisão de benefício por incapacidade',
  'Contagem especial de tempo de contribuição',
  'Reparação por dano moral e material',
  'Nulidade de cláusulas abusivas em contrato',
  'Planejamento tributário',
  'Exclusão de inscrição em órgãos de proteção ao crédito',
  'Legítima defesa'
];

const motivosDemissao = [
  'Corte de custos', 'Fechamento de unidade', 'Baixo desempenho',
  'Comportamento inadequado', 'Justa causa', 'Término de contrato',
  'Acordo entre as partes', 'Reestruturação da empresa'
];

const mensagensIniciais = [
  'Olá, gostaria de saber como proceder para entrar com uma ação trabalhista.',
  'Bom dia, fui demitido ontem e gostaria de saber meus direitos.',
  'Preciso de orientação sobre aposentadoria, podem me ajudar?',
  'Sofri um acidente de trabalho e a empresa não quer reconhecer.',
  'Estou com um problema com uma operadora de celular, cobranças indevidas.',
  'Quero abrir um processo contra meu vizinho por perturbação do sossego.',
  'Preciso fazer um inventário, como funciona?',
  'Estou sendo processado e preciso de um advogado com urgência.',
  'Quero montar uma empresa, vocês podem me auxiliar?',
  'Fui multado injustamente, como recorrer?'
];

// Função para gerar um lead aleatório
const gerarLeadAleatorio = (index: number): Lead => {
  const id = `lead-${index}`;
  const fase_atual = fases[Math.floor(Math.random() * fases.length)];
  const area_direito = areasDireito[Math.floor(Math.random() * areasDireito.length)];
  const score = scores[Math.floor(Math.random() * scores.length)];
  const ainda_trabalha = Math.random() > 0.5;
  
  const data_entrada = gerarDataAleatoria();
  const created_at = data_entrada;
  const updated_at = data_entrada;
  
  return {
    id,
    id_visual: gerarIdVisual(),
    nome: nomes[Math.floor(Math.random() * nomes.length)],
    telefone: telefones[Math.floor(Math.random() * telefones.length)],
    email: `cliente${index}@exemplo.com`,
    estado: estados[Math.floor(Math.random() * estados.length)],
    profissao: profissoes[Math.floor(Math.random() * profissoes.length)],
    canal_entrada: canaisEntrada[Math.floor(Math.random() * canaisEntrada.length)],
    campanha_origem: campanhasOrigem[Math.floor(Math.random() * campanhasOrigem.length)],
    data_entrada,
    area_direito,
    resumo_caso: resumosCaso[Math.floor(Math.random() * resumosCaso.length)],
    tese_juridica: tesesJuridicas[Math.floor(Math.random() * tesesJuridicas.length)],
    ainda_trabalha,
    carteira_assinada: Math.random() > 0.3,
    tem_advogado: Math.random() > 0.8,
    tempo_empresa: ainda_trabalha ? `${Math.floor(Math.random() * 10) + 1} anos` : undefined,
    motivo_demissao: !ainda_trabalha ? motivosDemissao[Math.floor(Math.random() * motivosDemissao.length)] : undefined,
    mensagem_inicial: mensagensIniciais[Math.floor(Math.random() * mensagensIniciais.length)],
    score,
    fase_atual,
    tempo_na_fase: gerarTempoAleatorio(),
    responsavel_id: Math.random() > 0.7 ? '1' : undefined,
    created_at,
    updated_at
  };
};

// Generate 50 random leads
export const mockLeads: Lead[] = Array.from({ length: 50 }, (_, index) => gerarLeadAleatorio(index));
