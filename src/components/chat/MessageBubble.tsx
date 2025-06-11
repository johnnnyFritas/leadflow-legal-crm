
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

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
              className="max-w-xs max-h-64 rounded-lg cursor-pointer hover:opacity-90 transition-opacity object-cover"
              onClick={() => window.open(message.file_url, '_blank')}
              loading="lazy"
            />
            {message.file_name && (
              <p className="text-xs opacity-70 mt-1">{message.file_name}</p>
            )}
            {message.file_size && (
              <p className="text-xs opacity-50">{formatFileSize(message.file_size)}</p>
            )}
          </div>
        );
      
      case 'audio':
        return (
          <div className="mb-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg max-w-xs">
            <div className="flex items-center gap-3 mb-2">
              <Volume2 size={20} className="flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {message.file_name || 'Áudio'}
                </p>
                {message.file_size && (
                  <p className="text-xs opacity-70">{formatFileSize(message.file_size)}</p>
                )}
              </div>
            </div>
            <audio controls className="w-full">
              <source src={message.file_url} type="audio/webm" />
              <source src={message.file_url} type="audio/mp3" />
              Seu navegador não suporta áudio.
            </audio>
          </div>
        );
      
      case 'video':
        return (
          <div className="mb-2">
            <video 
              controls 
              className="max-w-xs max-h-64 rounded-lg"
              preload="metadata"
            >
              <source src={message.file_url} type="video/mp4" />
              <source src={message.file_url} type="video/webm" />
              Seu navegador não suporta vídeo.
            </video>
            {message.file_name && (
              <p className="text-xs opacity-70 mt-1">{message.file_name}</p>
            )}
            {message.file_size && (
              <p className="text-xs opacity-50">{formatFileSize(message.file_size)}</p>
            )}
          </div>
        );
      
      case 'document':
      case 'file':
        return (
          <div className="mb-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg max-w-xs">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {message.file_name || 'Documento'}
                </p>
                {message.file_size && (
                  <p className="text-xs opacity-70">{formatFileSize(message.file_size)}</p>
                )}
                {message.file_type && (
                  <p className="text-xs opacity-50 uppercase">{message.file_type}</p>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(message.file_url, '_blank')}
                title="Download"
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
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        )}
        
        <span className="text-xs opacity-70 mt-1 block">
          {formatMessageTime(message.sent_at)}
        </span>
      </div>
    </div>
  );
};

export default MessageBubble;
