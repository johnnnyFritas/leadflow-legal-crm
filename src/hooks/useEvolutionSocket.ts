
import { useEffect, useCallback } from 'react';
import { WebSocketMessage } from '@/types/evolution';
import { evolutionApi } from '@/services/evolution/evolutionApi';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useInstanceData } from './useInstanceData';
import { useWebSocketConnection } from './useWebSocketConnection';
import { useQRCodeGeneration } from './useQRCodeGeneration';
import { useMessageProcessing } from './useMessageProcessing';

export const useEvolutionSocket = () => {
  const { user } = useAuth();
  
  const {
    instanceData,
    instanceStatus,
    connectedPhone,
    setInstanceStatus,
    fetchInstanceData,
    checkInstanceStatus,
    updateInstanceStatus
  } = useInstanceData(user?.id);

  const {
    isConnected,
    isConnecting,
    setIsConnecting,
    reconnectAttempts,
    connectSocket,
    disconnectSocket
  } = useWebSocketConnection();

  const {
    qrCode,
    isGeneratingQR,
    setQrCode,
    setIsGeneratingQR,
    generateQRCode,
    processQRCode,
    startQRRefresh,
    stopQRRefresh
  } = useQRCodeGeneration();

  const { saveMessage, processIncomingMessage } = useMessageProcessing(instanceData);

  // Wrapper functions for socket callbacks
  const handleStatusUpdate = useCallback((status: any) => {
    setInstanceStatus(status.status);
    updateInstanceStatus(status);
    
    if (status.status === 'connected') {
      setQrCode('');
      setIsGeneratingQR(false);
      setIsConnecting(false);
      stopQRRefresh();
    }
  }, [setInstanceStatus, updateInstanceStatus, setQrCode, setIsGeneratingQR, setIsConnecting, stopQRRefresh]);

  const handleQRCodeReceived = useCallback((data: any) => {
    if (instanceData?.instance_name) {
      processQRCode(data, instanceData.instance_name);
    }
  }, [processQRCode, instanceData]);

  const connectSocketWrapper = useCallback(() => {
    if (instanceData?.instance_name) {
      connectSocket(
        instanceData.instance_name,
        handleStatusUpdate,
        processIncomingMessage,
        handleQRCodeReceived
      );
    }
  }, [instanceData?.instance_name, connectSocket, handleStatusUpdate, processIncomingMessage, handleQRCodeReceived]);

  const generateQRWrapper = useCallback(async () => {
    await generateQRCode(instanceData, connectSocketWrapper);
    startQRRefresh(instanceStatus, () => generateQRCode(instanceData, connectSocketWrapper));
  }, [generateQRCode, instanceData, connectSocketWrapper, startQRRefresh, instanceStatus]);

  const changeNumber = useCallback(async () => {
    if (!instanceData?.instance_name) return;

    try {
      setIsConnecting(true);
      stopQRRefresh();
      disconnectSocket();

      await evolutionApi.disconnectInstance(instanceData.instance_name);
      
      setInstanceStatus('disconnected');
      setQrCode('');

      await updateInstanceStatus({
        instance: instanceData.instance_name,
        status: 'disconnected'
      });

      toast.success('Número desconectado. Você pode gerar um novo QR Code.');
    } catch (error) {
      console.error('Erro ao trocar número:', error);
      toast.error('Erro ao desconectar. Tente novamente.');
    } finally {
      setIsConnecting(false);
    }
  }, [instanceData, setIsConnecting, stopQRRefresh, disconnectSocket, setInstanceStatus, setQrCode, updateInstanceStatus]);

  const sendMessage = useCallback(async (phone: string, message: string, conversationId?: string) => {
    if (!instanceData?.instance_name || instanceStatus !== 'connected') {
      toast.error('WhatsApp não conectado. Conecte primeiro.');
      return false;
    }

    try {
      console.log('Enviando mensagem via API:', { phone, message });
      
      await evolutionApi.sendMessage(instanceData.instance_name, phone, message);

      const messageData: WebSocketMessage = {
        body: message,
        sender_role: 'system',
        timestamp: new Date().toISOString(),
        instance_id: instanceData.instance_name,
        phone,
        conversation_id: conversationId
      };
      
      await saveMessage(messageData);
      return true;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
      return false;
    }
  }, [instanceData, instanceStatus, saveMessage]);

  // Initialize instance data
  useEffect(() => {
    if (user?.id) {
      fetchInstanceData().then((instance) => {
        if (instance?.instance_name) {
          checkInstanceStatus(instance.instance_name);
        }
      });
    }
  }, [user?.id, fetchInstanceData, checkInstanceStatus]);

  // Connect WebSocket when instance data is available
  useEffect(() => {
    if (instanceData?.instance_name) {
      connectSocketWrapper();
    }

    return () => {
      disconnectSocket();
      stopQRRefresh();
    };
  }, [instanceData?.instance_name, connectSocketWrapper, disconnectSocket, stopQRRefresh]);

  return {
    isConnected,
    instanceStatus,
    connectedPhone,
    qrCode,
    isGeneratingQR,
    isConnecting,
    instanceName: instanceData?.instance_name || '',
    generateQRCode: generateQRWrapper,
    changeNumber,
    sendMessage,
    reconnectAttempts
  };
};
