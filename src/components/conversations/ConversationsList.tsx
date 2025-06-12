
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { MessageSquare } from 'lucide-react';
import { Conversation } from '@/types/supabase';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ConversationFilters from './ConversationFilters';

interface ConversationsListProps {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedChannel: string;
  onChannelChange: (channel: string) => void;
  onConversationSelect: (conversation: Conversation) => void;
}

const ConversationsList: React.FC<ConversationsListProps> = ({
  conversations,
  selectedConversation,
  searchQuery,
  onSearchChange,
  selectedChannel,
  onChannelChange,
  onConversationSelect
}) => {
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

  // Filter conversations based on channel and search
  const filteredConversations = conversations.filter((conversation) => {
    const matchesChannel = selectedChannel === 'all' || conversation.channel === selectedChannel;
    const matchesSearch = !searchQuery || 
      conversation.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (conversation.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (conversation.case_summary?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    
    return matchesChannel && matchesSearch;
  });

  return (
    <div className="w-full border-r border-border flex flex-col h-full">
      <ConversationFilters
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        selectedChannel={selectedChannel}
        onChannelChange={onChannelChange}
      />

      <div className="overflow-y-auto flex-1">
        {filteredConversations.map((conversation) => (
          <div
            key={conversation.id}
            className={`p-3 lg:p-4 cursor-pointer hover:bg-accent border-b border-border ${
              selectedConversation?.id === conversation.id ? 'bg-accent' : ''
            }`}
            onClick={() => onConversationSelect(conversation)}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white text-sm flex-shrink-0">
                <MessageSquare size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm lg:text-base truncate">
                    {conversation.name || 'Nome não informado'}
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
  );
};

export default ConversationsList;
