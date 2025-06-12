
import React from 'react';
import { Message } from '@/types/supabase';
import { Bot, Download } from 'lucide-react';
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

  // Renderizar conteúdo de mídia baseado no message_type
  const renderMediaContent = () => {
    if (!message.file_url) return null;

    switch (message.message_type) {
      case 'image':
        return (
          <div className="mb-2">
            <img 
              src={message.file_url} 
              alt="imagem enviada"
              className="max-w-xs max-h-64 rounded-lg cursor-pointer hover:opacity-90 transition-opacity object-cover"
              onClick={() => window.open(message.file_url, '_blank')}
              loading="lazy"
            />
            {message.file_size && (
              <p className="text-xs opacity-50 mt-1">{formatFileSize(message.file_size)}</p>
            )}
          </div>
        );
      
      case 'audio':
        return (
          <div className="mb-2">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 max-w-xs">
              <audio controls className="w-full">
                <source src={message.file_url} type="audio/webm" />
                <source src={message.file_url} type="audio/mp3" />
                Seu navegador não suporta áudio.
              </audio>
            </div>
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
            {message.file_size && (
              <p className="text-xs opacity-50 mt-1">{formatFileSize(message.file_size)}</p>
            )}
          </div>
        );
      
      case 'file':
        return (
          <div className="mb-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg max-w-xs">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <a 
                  href={message.file_url} 
                  download={message.file_name}
                  className="font-medium text-sm truncate text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {message.file_name || 'Documento'}
                </a>
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

  // Determinar se a mensagem deve aparecer à direita
  // Mensagens do sistema (IA) e do agente vão para a direita
  const isRightSide = message.sender_role === 'agent' || message.sender_role === 'system';

  return (
    <div
      className={`flex ${isRightSide ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[85%] lg:max-w-md px-3 lg:px-4 py-2 rounded-lg ${
          isRightSide
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
        }`}
      >
        {/* Indicador de mensagem do sistema com novo rótulo */}
        {message.sender_role === 'system' && (
          <div className="flex items-center gap-2 mb-1">
            <Bot size={14} />
            <span className="text-xs font-medium opacity-80">Quero Direito AI</span>
          </div>
        )}
        
        {/* Conteúdo de mídia (imagem, áudio, vídeo, arquivo) */}
        {renderMediaContent()}
        
        {/* Conteúdo de texto */}
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
