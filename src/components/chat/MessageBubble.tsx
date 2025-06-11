
import React from 'react';
import { Message } from '@/types/supabase';
import { Bot, Download, Play, Pause, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const formatMessageTime = (timestamp: string) => {
    return format(parseISO(timestamp), "HH:mm", { locale: ptBR });
  };

  const renderFileContent = () => {
    if (!message.file_url) return null;

    switch (message.message_type) {
      case 'image':
        return (
          <div className="mb-2">
            <img 
              src={message.file_url} 
              alt={message.file_name || 'Imagem'}
              className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(message.file_url, '_blank')}
            />
            {message.file_name && (
              <p className="text-xs opacity-70 mt-1">{message.file_name}</p>
            )}
          </div>
        );
      
      case 'audio':
        return (
          <div className="mb-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              <Volume2 size={20} />
              <div className="flex-1">
                <audio controls className="w-full">
                  <source src={message.file_url} type="audio/mpeg" />
                  Seu navegador não suporta áudio.
                </audio>
              </div>
            </div>
            {message.file_name && (
              <p className="text-xs opacity-70 mt-1">{message.file_name}</p>
            )}
          </div>
        );
      
      case 'video':
        return (
          <div className="mb-2">
            <video 
              controls 
              className="max-w-xs rounded-lg"
              preload="metadata"
            >
              <source src={message.file_url} type="video/mp4" />
              Seu navegador não suporta vídeo.
            </video>
            {message.file_name && (
              <p className="text-xs opacity-70 mt-1">{message.file_name}</p>
            )}
          </div>
        );
      
      case 'document':
      case 'file':
        return (
          <div className="mb-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="font-medium text-sm">{message.file_name}</p>
                {message.file_size && (
                  <p className="text-xs opacity-70">
                    {(message.file_size / 1024 / 1024).toFixed(2)} MB
                  </p>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(message.file_url, '_blank')}
              >
                <Download size={16} />
              </Button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div
      className={`flex ${message.sender_role === 'agent' ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[85%] lg:max-w-md px-3 lg:px-4 py-2 rounded-lg ${
          message.sender_role === 'agent'
            ? 'bg-primary text-primary-foreground'
            : message.sender_role === 'system'
            ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
            : 'bg-muted'
        }`}
      >
        {/* System message indicator */}
        {message.sender_role === 'system' && (
          <div className="flex items-center gap-2 mb-1">
            <Bot size={14} />
            <span className="text-xs font-medium opacity-80">Sistema IA</span>
          </div>
        )}
        
        {/* File content */}
        {renderFileContent()}
        
        {/* Text content */}
        {message.content && (
          <p className="text-sm">{message.content}</p>
        )}
        
        <span className="text-xs opacity-70 mt-1 block">
          {formatMessageTime(message.sent_at)}
        </span>
      </div>
    </div>
  );
};

export default MessageBubble;
