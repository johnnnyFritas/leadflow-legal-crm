
import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { WebSocketMessage } from '@/types/evolution';

export const useMessageProcessing = (instanceData: any) => {
  const saveMessage = useCallback(async (messageData: WebSocketMessage) => {
    try {
      console.log('Tentando salvar mensagem:', messageData);
      
      const response = await supabase.post('/messages', {
        content: messageData.body,
        sender_role: messageData.sender_role,
        sender_phone: messageData.phone,
        sent_at: messageData.timestamp || new Date().toISOString(),
        conversation_id: messageData.conversation_id,
        message_type: 'text',
        instance_id: instanceData?.instance_name
      });
      
      console.log('Mensagem salva no banco com sucesso:', response);
      
      if (messageData.conversation_id) {
        try {
          await supabase.patch(`/conversations?id=eq.${messageData.conversation_id}`, {
            updated_at: new Date().toISOString()
          });
          console.log('Conversation atualizada com timestamp da nova mensagem');
        } catch (error) {
          console.log('Erro ao atualizar conversation (não crítico):', error);
        }
      }
    } catch (error) {
      console.error('Erro ao salvar mensagem no banco:', error);
    }
  }, [instanceData]);

  const processIncomingMessage = useCallback((data: any) => {
    console.log('Evento mensagem completo recebido:', data);
    
    if (data.instance !== instanceData?.instance_name) {
      console.log('Mensagem ignorada - instância diferente:', data.instance, 'vs', instanceData?.instance_name);
      return;
    }
    
    const messageData = data.data;
    console.log('Dados da mensagem processando:', messageData);
    
    if (messageData.key && !messageData.key.fromMe && messageData.message) {
      let messageText = '';
      
      if (messageData.message.conversation) {
        messageText = messageData.message.conversation;
      } else if (messageData.message.extendedTextMessage?.text) {
        messageText = messageData.message.extendedTextMessage.text;
      } else {
        console.log('Tipo de mensagem não suportado para salvamento:', messageData.message);
        return;
      }
      
      const senderPhone = messageData.key.remoteJid.replace('@s.whatsapp.net', '');
      const conversationId = messageData.key.remoteJid;
      
      const processedMessage: WebSocketMessage = {
        body: messageText,
        sender_role: 'client',
        timestamp: new Date().toISOString(),
        instance_id: instanceData?.instance_name,
        phone: senderPhone,
        conversation_id: conversationId
      };
      
      console.log('Salvando mensagem processada da instância:', instanceData?.instance_name, processedMessage);
      saveMessage(processedMessage);
    } else {
      console.log('Mensagem ignorada - enviada pelo bot ou tipo não suportado');
    }
  }, [instanceData, saveMessage]);

  return {
    saveMessage,
    processIncomingMessage
  };
};
