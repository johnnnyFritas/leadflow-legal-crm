
import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle 
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Lead,
  formatTimeElapsed, 
  getAreaLabel,
  defaultFases
} from '@/types/lead';
import { toast } from '@/components/ui/sonner';
import { MessageSquare, Copy, FileText, Check } from 'lucide-react';
import { conversationsService } from '@/services/conversationsService';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

interface LeadDetailProps {
  lead?: Lead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenConversation?: (lead: Lead) => void;
}

interface Comment {
  id: string;
  text: string;
  date: string;
  author: string;
}

const CopyButton = ({ text, className }: { text: string, className?: string }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    toast.success('Telefone copiado para a área de transferência');
  };

  return (
    <Button 
      variant="ghost"
      size="icon"
      className={`h-5 w-5 copy-button ${className || ''}`}
      onClick={handleCopy}
    >
      <Copy size={14} />
    </Button>
  );
};

const DetailItem = ({ label, value, copyable = false }: { label: string; value: string | React.ReactNode; copyable?: boolean }) => (
  <div className="mb-3">
    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
      {label}
    </div>
    <div className="flex items-center gap-1">
      <div className="text-sm">{value}</div>
      {copyable && typeof value === 'string' && <CopyButton text={value} />}
    </div>
  </div>
);

const YesNoItem = ({ label, value }: { label: string; value: boolean | undefined }) => (
  <div className="mb-3">
    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
      {label}
    </div>
    <div className="flex items-center gap-2">
      {value !== undefined ? (
        <>
          <div className={`rounded-full p-1 ${value ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            <Check size={16} className={value ? 'text-green-500' : 'text-red-500'} />
          </div>
          <div className="text-sm">{value ? 'Sim' : 'Não'}</div>
        </>
      ) : (
        <div className="text-sm text-muted-foreground">Não informado</div>
      )}
    </div>
  </div>
);

const LeadDetails = ({ lead, open, onOpenChange, onOpenConversation }: LeadDetailProps) => {
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [selectedPhase, setSelectedPhase] = useState('');
  const [isConclusionOpen, setIsConclusionOpen] = useState(false);
  const [isPhaseChanged, setIsPhaseChanged] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Carregar comentários quando o lead mudar
  useEffect(() => {
    if (lead?.id) {
      // Carregar comentários do campo Coments (não ConclusãoCaso)
      const savedComments = localStorage.getItem(`comments_${lead.id}`);
      if (savedComments) {
        try {
          setComments(JSON.parse(savedComments));
        } catch (error) {
          console.error('Erro ao carregar comentários:', error);
          setComments([]);
        }
      } else {
        setComments([]);
      }
    }
  }, [lead?.id]);

  // Mutation para mover lead
  const moveLeadMutation = useMutation({
    mutationFn: async ({ leadId, newStep, previousStep }: { leadId: string, newStep: string, previousStep: string }) => {
      return conversationsService.updateConversationStep(leadId, newStep as any, previousStep as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success(`Lead movido com sucesso!`);
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Erro ao mover lead');
    }
  });

  // Mutation para adicionar comentário
  const addCommentMutation = useMutation({
    mutationFn: async ({ leadId, comment }: { leadId: string, comment: string }) => {
      return conversationsService.updateConversation(leadId, { Coments: comment });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success('Comentário adicionado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao adicionar comentário');
    }
  });
  
  if (!lead) return null;
  
  const formattedDate = format(parseISO(lead.data_entrada), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  
  // Calculate time elapsed
  const minutesElapsed = Math.floor(
    (Date.now() - new Date(lead.data_entrada).getTime()) / (1000 * 60)
  );
  const timeElapsed = formatTimeElapsed(minutesElapsed);

  const handleOpenConversation = () => {
    // Fechar o modal primeiro
    onOpenChange(false);
    
    // Navegar diretamente para a página de conversas
    navigate('/app/conversas');
  };

  const handleMovePhase = () => {
    if (!selectedPhase || !isPhaseChanged || !lead) {
      toast.error('Selecione uma fase diferente para mover o lead');
      return;
    }
    
    moveLeadMutation.mutate({
      leadId: lead.id,
      newStep: selectedPhase,
      previousStep: lead.fase_atual
    });
  };

  const handlePhaseChange = (value: string) => {
    setSelectedPhase(value);
    setIsPhaseChanged(value !== lead.fase_atual);
  };
  
  const handleAddComment = () => {
    if (!comment.trim() || !lead) return;
    
    const newComment = {
      id: Date.now().toString(),
      text: comment,
      date: new Date().toISOString(),
      author: 'Você',
    };
    
    const updatedComments = [newComment, ...comments];
    setComments(updatedComments);
    
    // Salvar no localStorage
    localStorage.setItem(`comments_${lead.id}`, JSON.stringify(updatedComments));
    
    addCommentMutation.mutate({
      leadId: lead.id,
      comment: comment.trim()
    });

    setComment('');
  };

  const hasCaseConclusion = lead.ConclusãoCaso && lead.ConclusãoCaso.trim().length > 0;

  const renderDynamicFields = () => {
    switch (lead.area_direito) {
      case 'previdenciario':
        return (
          <div className="space-y-2 bg-muted/30 p-3 rounded-md">
            <h5 className="font-medium text-sm mb-3">Informações Previdenciárias</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailItem label="Tipo de benefício buscado" value={lead.tipo_beneficio || 'Não informado'} />
              <YesNoItem label="Já recebe algum benefício?" value={lead.ja_recebe_beneficio} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <YesNoItem label="Contribuiu como autônomo?" value={lead.contribuiu_autonomo} />
              <YesNoItem label="Possui laudos médicos?" value={lead.possui_laudo_medico} />
            </div>
          </div>
        );
        
      case 'familia':
        return (
          <div className="space-y-2 bg-muted/30 p-3 rounded-md">
            <h5 className="font-medium text-sm mb-3">Informações de Família</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailItem label="Tipo de caso" value={
                lead.tipo_caso_familia === 'divorcio' ? 'Divórcio' : 
                lead.tipo_caso_familia === 'pensao' ? 'Pensão' : 
                lead.tipo_caso_familia === 'guarda' ? 'Guarda' : 
                lead.tipo_caso_familia === 'outro' ? 'Outro' : 'Não informado'
              } />
              <YesNoItem label="Há filhos menores?" value={lead.filhos_menores} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <YesNoItem label="Há acordo entre as partes?" value={lead.acordo_entre_partes} />
              <DetailItem label="Tempo de união" value={lead.tempo_uniao || 'Não informado'} />
            </div>
          </div>
        );
        
      case 'consumidor':
        return (
          <div className="space-y-2 bg-muted/30 p-3 rounded-md">
            <h5 className="font-medium text-sm mb-3">Informações de Consumidor</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailItem label="Produto ou serviço envolvido" value={lead.produto_servico || 'Não informado'} />
              <DetailItem label="Empresa reclamada" value={lead.empresa_reclamada || 'Não informado'} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailItem label="Data do problema" value={lead.data_problema || 'Não informado'} />
              <YesNoItem label="Tentou resolver diretamente?" value={lead.tentou_resolver} />
            </div>
          </div>
        );
        
      case 'penal':
        return (
          <div className="space-y-2 bg-muted/30 p-3 rounded-md">
            <h5 className="font-medium text-sm mb-3">Informações Criminais</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <YesNoItem label="Houve prisão em flagrante?" value={lead.prisao_flagrante} />
              <YesNoItem label="Já existe advogado atuando?" value={lead.advogado_atuando} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <YesNoItem label="Há vítimas ou testemunhas envolvidas?" value={lead.vitimas_testemunhas} />
              <DetailItem label="O caso está" value={
                lead.caso_andamento === 'andamento' ? 'Em andamento' : 
                lead.caso_andamento === 'iniciando' ? 'A ser iniciado' : 'Não informado'
              } />
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full md:max-w-md overflow-y-auto">
          <SheetHeader className="mb-5">
            <SheetTitle>Detalhes do Lead</SheetTitle>
            <SheetDescription>
              {lead.id_visual} - {getAreaLabel(lead.area_direito)}
            </SheetDescription>
          </SheetHeader>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium">{lead.nome}</h3>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-1 gap-4">
              <DetailItem label="Telefone" value={lead.telefone} copyable={true} />
              <DetailItem label="Estado" value={lead.estado || 'Não informado'} />
              <DetailItem label="Profissão" value={lead.profissao || 'Não informado'} />
              <DetailItem label="Canal de Entrada" value={lead.canal_entrada} />
              <DetailItem label="Data/hora de entrada" value={formattedDate} />
              <DetailItem label="Área do Direito" value={getAreaLabel(lead.area_direito)} />
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <h4 className="font-medium">Resumo do Caso</h4>
              
              <div className="bg-muted/30 p-3 rounded-md">
                <p className="text-sm">{lead.resumo_caso}</p>
              </div>
              
              {renderDynamicFields()}
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <h4 className="font-medium">Comentários</h4>
              <div className="space-y-2">
                <Textarea 
                  placeholder="Adicione um comentário sobre este lead..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="min-h-[100px]"
                />
                <Button 
                  onClick={handleAddComment} 
                  size="sm" 
                  className="w-full"
                  disabled={addCommentMutation.isPending}
                >
                  {addCommentMutation.isPending ? 'Salvando...' : 'Adicionar comentário'}
                </Button>
              </div>
              
              <div className="space-y-3 mt-4">
                {comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum comentário ainda
                  </p>
                ) : (
                  comments.map((item) => (
                    <div key={item.id} className="bg-secondary/20 p-3 rounded-md">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium">{item.author}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(parseISO(item.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      <p className="text-sm">{item.text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-3 pt-4">
              <Button 
                className="w-full" 
                onClick={handleOpenConversation}
              >
                <MessageSquare size={18} className="mr-2" />
                Abrir conversa
              </Button>
              
              <Button 
                variant={hasCaseConclusion ? "default" : "secondary"}
                className="w-full"
                onClick={() => setIsConclusionOpen(true)}
              >
                <FileText size={18} className="mr-2" />
                Conclusão do caso
              </Button>
            </div>
            
            <div className="space-y-3">
              <Select value={selectedPhase} onValueChange={handlePhaseChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={`Atual: ${lead.fase_atual}`} />
                </SelectTrigger>
                <SelectContent>
                  {defaultFases.map((fase) => (
                    <SelectItem key={fase.id} value={fase.id}>
                      {fase.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button 
                variant={isPhaseChanged ? "default" : "secondary"}
                className="w-full"
                onClick={handleMovePhase}
                disabled={!isPhaseChanged || moveLeadMutation.isPending}
              >
                <Check size={18} className="mr-2" />
                {moveLeadMutation.isPending ? 'Movendo...' : 'Mover lead'}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={isConclusionOpen} onOpenChange={setIsConclusionOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Conclusão do Caso</DialogTitle>
            <DialogDescription>
              {hasCaseConclusion ? 'Conclusão do caso para este lead' : 'Nenhuma conclusão disponível ainda'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            {hasCaseConclusion ? (
              <div className="bg-muted p-4 rounded-md">
                <p className="text-sm whitespace-pre-wrap">{lead.ConclusãoCaso}</p>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText size={48} className="mx-auto mb-4 opacity-50" />
                <p>Nenhuma conclusão de caso disponível ainda.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LeadDetails;
