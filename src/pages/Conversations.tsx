import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { conversationsService } from '@/services/conversationsService';
import { Conversation, Message } from '@/types/supabase';
import { toast } from '@/components/ui/sonner';
import LeadDetails from '@/components/lead/LeadDetails';
import { Lead, AreaDireito } from '@/types/lead';
import ConversationsList from '@/components/conversations/ConversationsList';
import ConversationHeader from '@/components/conversations/ConversationHeader';
import MessagesList from '@/components/conversations/MessagesList';
import MessageInput from '@/components/conversations/MessageInput';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { EvolutionProvider, useEvolution } from '@/contexts/EvolutionContext';
import { EvolutionStatus } from '@/components/conversations/EvolutionStatus';

const ConversationsContent = () => {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isLeadDetailsOpen, setIsLeadDetailsOpen] = useState(false);
  const [realtimeMessages, setRealtimeMessages] = useState<Message[]>([]);
  const queryClient = useQueryClient();
  const { sendMessage: sendEvolutionMessage } = useEvolution();

  const { data: conversations = [], isLoading: loadingConversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => conversationsService.getConversations(),
  });

  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['messages', selectedConversation?.id],
    queryFn: () => selectedConversation ? conversationsService.getMessages(selectedConversation.id) : Promise.resolve([]),
    enabled: !!selectedConversation,
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ conversationId, content }: { conversationId: string, content: string }) =>
      conversationsService.sendMessage(conversationId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation?.id] });
      setNewMessage('');
      toast.success('Mensagem enviada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao enviar mensagem');
    }
  });

  const sendFileMutation = useMutation({
    mutationFn: ({ 
      conversationId, 
      file, 
      fileUrl, 
      messageType 
    }: { 
      conversationId: string, 
      file: File, 
      fileUrl: string, 
      messageType: 'image' | 'video' | 'audio' | 'file' 
    }) =>
      conversationsService.sendFileMessage(conversationId, file, fileUrl, messageType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation?.id] });
      toast.success('Arquivo enviado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao enviar arquivo:', error);
      toast.error('Erro ao enviar arquivo');
    }
  });

  // Handler para novas mensagens em tempo real
  const handleNewMessage = (message: Message) => {
    // Atualizar mensagens em tempo real apenas para a conversa ativa
    if (selectedConversation?.id === message.conversation_id) {
      setRealtimeMessages(prev => {
        // Evitar duplicatas
        const exists = prev.some(msg => 
          msg.content === message.content && 
          Math.abs(new Date(msg.sent_at).getTime() - new Date(message.sent_at).getTime()) < 1000
        );
        if (!exists) {
          return [...prev, message];
        }
        return prev;
      });
    }
    
    // Invalidar queries para atualizar a lista de conversas
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
    if (selectedConversation?.id === message.conversation_id) {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation.id] });
    }
  };

  const handleSendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return;

    try {
      // Tentar enviar via Evolution WebSocket primeiro
      const sentViaEvolution = await sendEvolutionMessage(selectedConversation.id, newMessage.trim());
      
      if (!sentViaEvolution) {
        // Fallback para REST se WebSocket falhou
        sendMessageMutation.mutate({
          conversationId: selectedConversation.id,
          content: newMessage.trim()
        });
      } else {
        // Limpar input e invalidar queries se enviado via WebSocket
        setNewMessage('');
        queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation?.id] });
        toast.success('Mensagem enviada via WhatsApp!');
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      // Fallback para REST em caso de erro
      sendMessageMutation.mutate({
        conversationId: selectedConversation.id,
        content: newMessage.trim()
      });
    }
  };

  const handleSendFile = (file: File, fileUrl: string, messageType: string) => {
    if (!selectedConversation) return;

    console.log('Enviando arquivo:', { file, fileUrl, messageType });

    sendFileMutation.mutate({
      conversationId: selectedConversation.id,
      file,
      fileUrl,
      messageType: messageType as 'image' | 'video' | 'audio' | 'file'
    });
  };

  const handleViewLead = (conversation: Conversation) => {
    const mapToAreaDireito = (legalArea: string): AreaDireito => {
      const mapping: Record<string, AreaDireito> = {
        'Trabalhista': 'trabalhista',
        'Previdenciário': 'previdenciario',
        'Civil': 'civil',
        'Tributário': 'tributario',
        'Penal': 'penal',
        'Família': 'familia',
        'Consumidor': 'consumidor',
        'Empresarial': 'empresarial'
      };
      return mapping[legalArea] || 'outro';
    };

    const lead: Lead = {
      id: conversation.id,
      id_visual: conversation.id.substring(0, 8).toUpperCase(),
      nome: conversation.name || 'Nome não informado',
      telefone: conversation.phone,
      email: '',
      estado: conversation.location || '',
      profissao: conversation.profession || '',
      canal_entrada: conversation.channel || '',
      data_entrada: conversation.entry_datetime,
      area_direito: mapToAreaDireito(conversation.legal_area || ''),
      fase_atual: conversation.step as any,
      resumo_caso: conversation.case_summary || '',
      tese_juridica: conversation.legal_thesis || '',
      mensagem_inicial: '',
      created_at: conversation.entry_datetime,
      updated_at: conversation.entry_datetime,
      ConclusãoCaso: conversation.ConclusãoCaso
    };
    
    setSelectedLead(lead);
    setIsLeadDetailsOpen(true);
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
    setRealtimeMessages([]); // Limpar mensagens em tempo real
  };

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setRealtimeMessages([]); // Limpar mensagens anteriores
  };

  // Combinar mensagens do banco com mensagens em tempo real
  const allMessages = [...messages, ...realtimeMessages];

  if (loadingConversations) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando conversas...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background w-full">
      {/* Lista de conversas - só aparece quando nenhuma conversa está selecionada */}
      {!selectedConversation && (
        <div className="w-full h-full flex flex-col">
          {/* Status do Evolution no topo */}
          <div className="flex justify-center p-3 border-b border-border">
            <EvolutionStatus />
          </div>
          
          <ConversationsList
            conversations={conversations}
            selectedConversation={selectedConversation}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedChannel={selectedChannel}
            onChannelChange={setSelectedChannel}
            onConversationSelect={handleConversationSelect}
          />
        </div>
      )}

      {/* Conversa ativa - só aparece quando uma conversa está selecionada */}
      {selectedConversation && (
        <div className="w-full h-full flex flex-col">
          {/* Header da conversa com botão de voltar */}
          <div className="flex items-center border-b border-border bg-card flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToList}
              className="mr-2 ml-2"
            >
              <ArrowLeft size={20} />
            </Button>
            <div className="flex-1">
              <ConversationHeader
                conversation={selectedConversation}
                onViewLead={handleViewLead}
              />
            </div>
            {/* Status do Evolution no header da conversa */}
            <div className="mr-3">
              <EvolutionStatus />
            </div>
          </div>

          {/* Área de mensagens - ocupa o espaço restante */}
          <div className="flex-1 overflow-hidden">
            <MessagesList
              messages={allMessages}
              isLoading={loadingMessages}
            />
          </div>

          {/* Input fixo no final */}
          <div className="flex-shrink-0">
            <MessageInput
              newMessage={newMessage}
              onMessageChange={setNewMessage}
              onSendMessage={handleSendMessage}
              onSendFile={handleSendFile}
              conversationId={selectedConversation.id}
              isLoading={sendMessageMutation.isPending || sendFileMutation.isPending}
            />
          </div>
        </div>
      )}

      <LeadDetails 
        lead={selectedLead} 
        open={isLeadDetailsOpen} 
        onOpenChange={setIsLeadDetailsOpen}
        onOpenConversation={(lead) => {
          const conversation = conversations.find(c => c.id === lead.id);
          if (conversation) {
            setSelectedConversation(conversation);
            setIsLeadDetailsOpen(false);
          }
        }}
      />
    </div>
  );
};

const Conversations = () => {
  return (
    <EvolutionProvider onNewMessage={(message) => console.log('Nova mensagem:', message)}>
      <ConversationsContent />
    </EvolutionProvider>
  );
};

export default Conversations;
