
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { conversationsService } from '@/services/conversationsService';
import { Conversation } from '@/types/supabase';
import { toast } from '@/components/ui/sonner';
import LeadDetails from '@/components/lead/LeadDetails';
import { Lead, AreaDireito } from '@/types/lead';
import ConversationsList from '@/components/conversations/ConversationsList';
import ConversationHeader from '@/components/conversations/ConversationHeader';
import MessagesList from '@/components/conversations/MessagesList';
import MessageInput from '@/components/conversations/MessageInput';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const Conversations = () => {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isLeadDetailsOpen, setIsLeadDetailsOpen] = useState(false);
  const queryClient = useQueryClient();

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

  const handleSendMessage = () => {
    if (!selectedConversation || !newMessage.trim()) return;

    sendMessageMutation.mutate({
      conversationId: selectedConversation.id,
      content: newMessage.trim()
    });
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
  };

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

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
        <ConversationsList
          conversations={conversations}
          selectedConversation={selectedConversation}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedChannel={selectedChannel}
          onChannelChange={setSelectedChannel}
          onConversationSelect={handleConversationSelect}
        />
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
          </div>

          {/* Área de mensagens - ocupa o espaço restante */}
          <div className="flex-1 overflow-hidden">
            <MessagesList
              messages={messages}
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

export default Conversations;
