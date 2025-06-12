
import React from 'react';
import { Message } from '@/types/supabase';
import MessageBubble from '@/components/chat/MessageBubble';

interface MessagesListProps {
  messages: Message[];
  isLoading: boolean;
}

const MessagesList: React.FC<MessagesListProps> = ({ messages, isLoading }) => {
  return (
    <div className="h-full overflow-y-auto p-3 lg:p-4 space-y-4">
      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div>Carregando mensagens...</div>
        </div>
      ) : (
        messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))
      )}
    </div>
  );
};

export default MessagesList;
