
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
import { 
  Lead,
  getScoreLabel, 
  formatTimeElapsed, 
  getAreaLabel
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

const CopyButton = ({ text }: { text: string }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    toast.success('Conteúdo copiado para a área de transferência');
  };

  return (
    <Button 
      variant="ghost"
      size="icon"
      className="h-5 w-5 copy-button"
      onClick={handleCopy}
    >
      <Copy size={14} />
    </Button>
  );
};

const DetailItem = ({ label, value }: { label: string; value: string | React.ReactNode }) => (
  <div className="mb-3">
    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
      {label}
    </div>
    <div className="flex items-center gap-1">
      <div className="text-sm">{value}</div>
      {typeof value === 'string' && <CopyButton text={value} />}
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

  const handleMoveNext = () => {
    toast.success(`Lead ${lead.nome} movido para a próxima fase`);
    onOpenChange(false);
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
            <DetailItem label="Tempo total desde entrada" value={timeElapsed} />
          </div>
          
          <DetailItem label="Tempo na fase atual" value={timeInPhase} />
          
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
            
            <Button 
              variant="secondary" 
              className="w-full"
              onClick={handleMoveNext}
            >
              <Check size={18} className="mr-2" />
              Mover para próxima fase
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default LeadDetails;
