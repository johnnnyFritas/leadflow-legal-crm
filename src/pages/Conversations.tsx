import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Phone, Eye, Search, MessageSquare } from 'lucide-react';
import { conversationsService } from '@/services/conversationsService';
import { Conversation, Message } from '@/types/supabase';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from '@/components/ui/sonner';
import LeadDetails from '@/components/lead/LeadDetails';
import { Lead, AreaDireito } from '@/types/lead';
import { useNavigate } from 'react-router-dom';

const Conversations = () => {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isLeadDetailsOpen, setIsLeadDetailsOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: conversations = [], isLoading: loadingConversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => conversationsService.getConversations(),
  });

  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['messages', selectedConversation?.id],
    queryFn: () => selectedConversation ? conversationsService.getMessages(selectedConversation.id) : Promise.resolve([]),
    enabled: !!selectedConversation,
  });

  // Filter conversations based on channel and search
  const filteredConversations = conversations.filter((conversation) => {
    const matchesChannel = selectedChannel === 'all' || conversation.channel === selectedChannel;
    const matchesSearch = !searchQuery || 
      conversation.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (conversation.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (conversation.case_summary?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    
    return matchesChannel && matchesSearch;
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

  const handleSendMessage = () => {
    if (!selectedConversation || !newMessage.trim()) return;

    sendMessageMutation.mutate({
      conversationId: selectedConversation.id,
      content: newMessage.trim()
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (timestamp: string) => {
    return format(parseISO(timestamp), "HH:mm", { locale: ptBR });
  };

  const getStepBadgeColor = (step: string) => {
    const colors: Record<string, string> = {
      'Introdução': 'bg-blue-100 text-blue-800',
      'Atendimento Humano': 'bg-yellow-100 text-yellow-800',
      'Em Qualificação': 'bg-orange-100 text-orange-800',
      'Qualificado': 'bg-purple-100 text-purple-800',
      'Em Análise': 'bg-indigo-100 text-indigo-800',
      'Em marcação de reunião': 'bg-teal-100 text-teal-800',
      'Reunião marcada': 'bg-pink-100 text-pink-800',
      'Não compareceu a reunião': 'bg-red-100 text-red-800',
      'Link de fechamento': 'bg-green-100 text-green-800',
      'Reunião cancelada': 'bg-gray-100 text-gray-800',
    };
    return colors[step] || 'bg-gray-100 text-gray-800';
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

  const handleOpenConversation = (conversation: Conversation) => {
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
    <div className="flex flex-col lg:flex-row h-[calc(100vh-100px)] bg-background">
      {/* Lista de conversas */}
      <div className="w-full lg:w-1/3 border-r border-border flex flex-col">
        <div className="p-3 lg:p-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Conversas</h2>
            <Button size="sm" className="rounded-full" disabled>
              +
            </Button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Buscar conversa"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Channel Filter */}
          <Select value={selectedChannel} onValueChange={setSelectedChannel}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione o canal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os canais</SelectItem>
              <SelectItem value="Canal pessoal">Canal pessoal</SelectItem>
              <SelectItem value="Quero direito">Quero direito</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-y-auto flex-1">
          {filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`p-3 lg:p-4 cursor-pointer hover:bg-accent border-b border-border ${
                selectedConversation?.id === conversation.id ? 'bg-accent' : ''
              }`}
              onClick={() => handleOpenConversation(conversation)}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white text-sm flex-shrink-0">
                  <MessageSquare size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm lg:text-base truncate">
                      {conversation.name || 'Null'}
                    </span>
                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                      {format(parseISO(conversation.entry_datetime), "HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    {conversation.phone}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {conversation.case_summary || 'Nova conversa'}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`text-xs ${getStepBadgeColor(conversation.step)}`}>
                      {conversation.step}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {conversation.legal_area}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Área de conversa */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Header da conversa */}
            <div className="p-3 lg:p-4 border-b border-border bg-card">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold truncate">{selectedConversation.name || 'Null'}</h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {selectedConversation.phone}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {selectedConversation.legal_area} • {selectedConversation.step}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0 ml-2">
                  <Button size="sm" variant="outline" onClick={() => handleViewLead(selectedConversation)}>
                    <Eye size={16} className="mr-2" />
                    <span className="hidden sm:inline">Ver detalhes</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-4">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-32">
                  <div>Carregando mensagens...</div>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_role === 'agent' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] lg:max-w-md px-3 lg:px-4 py-2 rounded-lg ${
                        message.sender_role === 'agent'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <span className="text-xs opacity-70 mt-1 block">
                        {formatMessageTime(message.sent_at)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Campo de digitação */}
            <div className="p-3 lg:p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  placeholder="Digite sua mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={sendMessageMutation.isPending}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  size="sm"
                  className="flex-shrink-0"
                >
                  <Send size={16} />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground p-4 text-center">
            Selecione uma conversa para começar
          </div>
        )}
      </div>

      {/* Lead Details Modal */}
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
