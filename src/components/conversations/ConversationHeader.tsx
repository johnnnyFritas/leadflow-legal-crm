
import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { Conversation } from '@/types/supabase';

interface ConversationHeaderProps {
  conversation: Conversation;
  onViewLead: (conversation: Conversation) => void;
}

const ConversationHeader: React.FC<ConversationHeaderProps> = ({
  conversation,
  onViewLead
}) => {
  return (
    <div className="p-3 lg:p-4 border-b border-border bg-card">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="font-bold truncate">{conversation.name || 'Nome não informado'}</h3>
          <p className="text-sm text-muted-foreground truncate">
            {conversation.phone}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {conversation.legal_area} • {conversation.step}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0 ml-2">
          <Button size="sm" variant="outline" onClick={() => onViewLead(conversation)}>
            <Eye size={16} className="mr-2" />
            <span className="hidden sm:inline">Ver detalhes</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConversationHeader;
