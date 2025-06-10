
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, Phone, Calendar } from 'lucide-react';
import { conversationsService } from '@/services/conversationsService';
import { Conversation, Message } from '@/types/supabase';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from '@/components/ui/sonner';

const Conversations = () => {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
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
      'em_qualificacao': 'bg-blue-100 text-blue-800',
      'aguardando_documentos': 'bg-yellow-100 text-yellow-800',
      'analise_juridica': 'bg-purple-100 text-purple-800',
      'aprovado': 'bg-green-100 text-green-800',
      'rejeitado': 'bg-red-100 text-red-800',
    };
    return colors[step] || 'bg-gray-100 text-gray-800';
  };

  if (loadingConversations) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando conversas...</div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-100px)] bg-background">
      {/* Lista de conversas */}
      <div className="w-1/3 border-r border-border">
        <div className="p-4 border-b border-border">
          <h2 className="text-xl font-bold">Conversas</h2>
          <div className="flex gap-2 mt-2">
            <Button size="sm" variant="outline">Todos</Button>
            <Button size="sm" variant="outline">Leads</Button>
            <Button size="sm" variant="outline">Clientes</Button>
          </div>
        </div>

        <div className="overflow-y-auto">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`p-4 cursor-pointer hover:bg-accent border-b border-border ${
                selectedConversation?.id === conversation.id ? 'bg-accent' : ''
              }`}
              onClick={() => setSelectedConversation(conversation)}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm">
                  <Phone size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{conversation.phone}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(parseISO(conversation.entry_datetime), "HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {conversation.case_summary || 'Nova conversa'}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={`text-xs ${getStepBadgeColor(conversation.step)}`}>
                      {conversation.step.replace('_', ' ')}
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
            <div className="p-4 border-b border-border bg-card">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{selectedConversation.phone}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedConversation.legal_area} • {selectedConversation.step.replace('_', ' ')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Phone size={16} className="mr-2" />
                    Ligar
                  </Button>
                  <Button size="sm" variant="outline">
                    <Calendar size={16} className="mr-2" />
                    Agendar
                  </Button>
                </div>
              </div>
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
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
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  placeholder="Digite sua mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={sendMessageMutation.isPending}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                >
                  <Send size={16} />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Selecione uma conversa para começar
          </div>
        )}
      </div>
    </div>
  );
};

export default Conversations;
