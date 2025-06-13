
import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { useEvolutionSocket, EvolutionEvent } from '@/hooks/useEvolutionSocket';
import { conversationsService } from '@/services/conversationsService';
import { Message } from '@/types/supabase';
import { toast } from '@/components/ui/sonner';

interface EvolutionContextType {
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  isConnected: boolean;
  lastError: string | null;
  sendMessage: (conversationId: string, content: string) => Promise<boolean>;
  onNewMessage?: (message: Message) => void;
}

const EvolutionContext = createContext<EvolutionContextType | undefined>(undefined);

export const useEvolution = () => {
  const context = useContext(EvolutionContext);
  if (!context) {
    throw new Error('useEvolution deve ser usado dentro de EvolutionProvider');
  }
  return context;
};

interface EvolutionProviderProps {
  children: React.ReactNode;
  onNewMessage?: (message: Message) => void;
}

export const EvolutionProvider: React.FC<EvolutionProviderProps> = ({ 
  children, 
  onNewMessage 
}) => {
  const [lastError, setLastError] = useState<string | null>(null);

  const handleEvolutionMessage = useCallback(async (event: EvolutionEvent) => {
    console.log('Processando evento Evolution:', event);
    
    try {
      switch (event.event) {
        case 'messages.upsert':
          // Mensagem recebida do usuário
          if (event.data?.message) {
            const messageData = event.data.message;
            
            // Verificar se já existe no banco para evitar duplicatas
            const existingMessages = await conversationsService.getMessages(messageData.key?.remoteJid || '');
            const messageExists = existingMessages.some(msg => 
              msg.content === messageData.message?.conversation || 
              msg.sent_at === new Date(messageData.messageTimestamp * 1000).toISOString()
            );
            
            if (!messageExists) {
              // Criar mensagem no formato do nosso sistema
              const newMessage: Omit<Message, 'id'> = {
                conversation_id: messageData.key?.remoteJid || '',
                sender_role: 'client',
                sender_phone: messageData.key?.remoteJid?.replace('@s.whatsapp.net', '') || '',
                content: messageData.message?.conversation || '',
                message_type: 'text',
                sent_at: new Date(messageData.messageTimestamp * 1000).toISOString(),
                file_url: messageData.message?.imageMessage?.url || 
                         messageData.message?.documentMessage?.url ||
                         messageData.message?.audioMessage?.url ||
                         messageData.message?.videoMessage?.url,
                file_name: messageData.message?.documentMessage?.fileName,
                file_size: messageData.message?.documentMessage?.fileLength ||
                          messageData.message?.imageMessage?.fileLength,
                file_type: messageData.message?.documentMessage?.mimetype ||
                          messageData.message?.imageMessage?.mimetype
              };
              
              // Determinar tipo de mensagem baseado no conteúdo
              if (messageData.message?.imageMessage) {
                newMessage.message_type = 'image';
              } else if (messageData.message?.audioMessage) {
                newMessage.message_type = 'audio';
              } else if (messageData.message?.videoMessage) {
                newMessage.message_type = 'video';
              } else if (messageData.message?.documentMessage) {
                newMessage.message_type = 'file';
              }
              
              // Salvar no banco e notificar
              const savedMessage = await conversationsService.sendMessage(
                newMessage.conversation_id,
                newMessage.content,
                newMessage.sender_phone
              );
              
              onNewMessage?.(savedMessage);
              
              // Toast apenas para mensagens de texto importantes
              if (newMessage.message_type === 'text' && newMessage.content) {
                toast.info(`Nova mensagem de ${newMessage.sender_phone}`);
              }
            }
          }
          break;
          
        case 'send.message':
          // Mensagem enviada pela IA - já foi processada pelo sistema
          console.log('Mensagem enviada pela IA confirmada:', event.data);
          break;
          
        case 'CONNECTION_UPDATE':
          if (event.data?.state === 'open') {
            toast.success('WhatsApp conectado');
          } else if (event.data?.state === 'close') {
            toast.error('WhatsApp desconectado');
          }
          break;
          
        case 'QRCODE_UPDATED':
          // QR Code atualizado - pode ser usado para reconexão
          console.log('QR Code atualizado');
          break;
          
        default:
          console.log('Evento Evolution não tratado:', event.event);
      }
    } catch (error) {
      console.error('Erro ao processar evento Evolution:', error);
      setLastError('Erro ao processar mensagem do WhatsApp');
    }
  }, [onNewMessage]);

  const handleStatusChange = useCallback((status: 'connected' | 'disconnected') => {
    if (status === 'connected') {
      setLastError(null);
      toast.success('Conectado ao WhatsApp');
    } else {
      toast.error('Desconectado do WhatsApp');
    }
  }, []);

  const handleError = useCallback((error: Event) => {
    console.error('Erro no WebSocket Evolution:', error);
    setLastError('Erro de conexão com WhatsApp');
  }, []);

  const { connectionStatus, sendMessage: sendWebSocketMessage, isConnected } = useEvolutionSocket({
    onMessage: handleEvolutionMessage,
    onStatusChange: handleStatusChange,
    onError: handleError
  });

  const sendMessage = useCallback(async (conversationId: string, content: string): Promise<boolean> => {
    try {
      // Enviar via WebSocket se conectado
      if (isConnected) {
        const payload = {
          event: 'send.message',
          data: {
            number: conversationId.replace('@s.whatsapp.net', ''),
            message: content
          }
        };
        
        const sent = sendWebSocketMessage(payload);
        if (sent) {
          return true;
        }
      }
      
      // Fallback para REST se WebSocket não disponível
      await conversationsService.sendMessage(conversationId, content);
      return true;
      
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      return false;
    }
  }, [isConnected, sendWebSocketMessage]);

  const value: EvolutionContextType = {
    connectionStatus,
    isConnected,
    lastError,
    sendMessage,
    onNewMessage
  };

  return (
    <EvolutionContext.Provider value={value}>
      {children}
    </EvolutionContext.Provider>
  );
};
