
import { useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Lead,
  getScoreLabel, 
  formatTimeElapsed, 
  getAreaLabel,
  defaultFases
} from '@/types/lead';
import { toast } from '@/components/ui/sonner';

// Icons
import { 
  Phone, 
  MessageSquare, 
  Calendar, 
  Check, 
  Copy
} from 'lucide-react';

interface LeadDetailProps {
  lead?: Lead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
    toast.success('Conteúdo copiado para a área de transferência');
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

const DetailItem = ({ label, value, copyable = true }: { label: string; value: string | React.ReactNode; copyable?: boolean }) => (
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

const YesNoItem = ({ label, value }: { label: string; value: boolean }) => (
  <div className="mb-3">
    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
      {label}
    </div>
    <div className="flex items-center gap-2">
      <div className={`rounded-full p-1 ${value ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
        <Check size={16} className={value ? 'text-green-500' : 'text-red-500'} />
      </div>
      <div className="text-sm">{value ? 'Sim' : 'Não'}</div>
    </div>
  </div>
);

const LeadDetails = ({ lead, open, onOpenChange }: LeadDetailProps) => {
  const [isCallLoading, setIsCallLoading] = useState(false);
  const [isWhatsappLoading, setIsWhatsappLoading] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [selectedPhase, setSelectedPhase] = useState('');
  
  if (!lead) return null;
  
  const formattedDate = format(parseISO(lead.data_entrada), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  
  // Calculate time elapsed
  const minutesElapsed = Math.floor(
    (Date.now() - new Date(lead.data_entrada).getTime()) / (1000 * 60)
  );
  const timeElapsed = formatTimeElapsed(minutesElapsed);
  const timeInPhase = formatTimeElapsed(lead.tempo_na_fase);

  const handleCall = () => {
    setIsCallLoading(true);
    setTimeout(() => {
      toast.success(`Ligando para ${lead.nome} (${lead.telefone})`);
      setIsCallLoading(false);
    }, 800);
  };

  const handleWhatsapp = () => {
    setIsWhatsappLoading(true);
    setTimeout(() => {
      toast.success(`Abrindo WhatsApp para ${lead.nome}`);
      setIsWhatsappLoading(false);
      
      // Prepare WhatsApp URL
      const cleanPhone = lead.telefone.replace(/\D/g, '');
      const whatsappUrl = `https://wa.me/55${cleanPhone}`;
      window.open(whatsappUrl, '_blank');
    }, 800);
  };

  const handleSchedule = () => {
    toast.success(`Agendar reunião com ${lead.nome}`);
  };

  const handleMovePhase = () => {
    if (!selectedPhase) {
      toast.error('Selecione uma fase para mover o lead');
      return;
    }
    
    const targetPhase = defaultFases.find(f => f.id === selectedPhase);
    if (targetPhase) {
      toast.success(`Lead ${lead.nome} movido para ${targetPhase.title}`);
      onOpenChange(false);
    }
  };
  
  const handleAddComment = () => {
    if (!comment.trim()) return;
    
    const newComment = {
      id: Date.now().toString(),
      text: comment,
      date: new Date().toISOString(),
      author: 'Você',
    };
    
    setComments([newComment, ...comments]);
    setComment('');
    toast.success('Comentário adicionado');
  };
  
  return (
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
            <Badge className={`score-${lead.score}`}>
              Score: {getScoreLabel(lead.score)}
            </Badge>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DetailItem label="Telefone" value={lead.telefone} />
            <DetailItem label="Estado" value={lead.estado} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DetailItem label="Profissão" value={lead.profissao} />
            <DetailItem label="Canal de Entrada" value={lead.canal_entrada} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DetailItem label="Campanha de Origem" value={lead.campanha_origem} />
            <DetailItem label="Data/hora de entrada" value={formattedDate} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DetailItem label="Área do Direito" value={getAreaLabel(lead.area_direito)} />
            <DetailItem label="Tempo total desde entrada" value={timeElapsed} copyable={false} />
          </div>
          
          <DetailItem label="Tempo na fase atual" value={timeInPhase} copyable={false} />
          
          <Separator />
          
          <div className="space-y-3">
            <h4 className="font-medium">Informações do Caso</h4>
            
            <DetailItem label="Resumo do Caso" value={lead.resumo_caso} />
            <DetailItem label="Tese Jurídica Identificada" value={lead.tese_juridica} />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <YesNoItem label="Ainda trabalha na empresa?" value={lead.ainda_trabalha} />
              <YesNoItem label="Carteira assinada?" value={lead.carteira_assinada} />
              <YesNoItem label="Já tem advogado?" value={lead.tem_advogado} />
            </div>
            
            {lead.tempo_empresa && (
              <DetailItem label="Tempo de empresa" value={lead.tempo_empresa} />
            )}
            
            {lead.motivo_demissao && (
              <DetailItem label="Motivo da demissão" value={lead.motivo_demissao} />
            )}
          </div>
          
          <Separator />
          
          <div className="space-y-3">
            <h4 className="font-medium">Mensagem Inicial</h4>
            <div className="bg-muted p-3 rounded-md text-sm">
              {lead.mensagem_inicial}
              <div className="mt-2 flex justify-end">
                <CopyButton text={lead.mensagem_inicial} />
              </div>
            </div>
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
              <Button onClick={handleAddComment} size="sm" className="w-full">
                Adicionar comentário
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
          
          <div className="grid grid-cols-2 gap-3 pt-4">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleCall}
              disabled={isCallLoading}
            >
              {isCallLoading ? (
                <span className="h-4 w-4 border-2 border-t-transparent border-current border-solid rounded-full animate-spin mr-2"></span>
              ) : (
                <Phone size={18} className="mr-2" />
              )}
              Ligar
            </Button>
            
            <Button 
              className="w-full" 
              onClick={handleWhatsapp}
              disabled={isWhatsappLoading}
            >
              {isWhatsappLoading ? (
                <span className="h-4 w-4 border-2 border-t-transparent border-white border-solid rounded-full animate-spin mr-2"></span>
              ) : (
                <MessageSquare size={18} className="mr-2" />
              )}
              Abrir WhatsApp
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleSchedule}
            >
              <Calendar size={18} className="mr-2" />
              Marcar reunião
            </Button>
            
            <div className="flex flex-col gap-2">
              <Select value={selectedPhase} onValueChange={setSelectedPhase}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione uma fase" />
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
                variant="secondary" 
                className="w-full"
                onClick={handleMovePhase}
              >
                <Check size={18} className="mr-2" />
                Mover lead
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default LeadDetails;
