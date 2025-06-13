
import { useState, useRef, useCallback, useEffect } from 'react';
import { authService } from '@/services/authService';
import { ConnectionStatus, EvolutionSocketOptions } from '@/types/evolution';
import { EvolutionApi } from '@/services/evolution/evolutionApi';
import { EvolutionWebSocket } from '@/services/evolution/evolutionWebSocket';
import { useEvolutionStatus } from './useEvolutionStatus';

export const useEvolutionSocket = (options: EvolutionSocketOptions = {}) => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [lastError, setLastError] = useState<string | null>(null);
  const webSocketRef = useRef<EvolutionWebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    instanceStatus,
    setInstanceStatus,
    startStatusCheck,
    stopStatusCheck
  } = useEvolutionStatus();

  const handleStatusChange = useCallback((status: ConnectionStatus) => {
    setConnectionStatus(status);
    options.onStatusChange?.(status);
  }, [options]);

  const handleConnected = useCallback((status: any) => {
    // Conectar WebSocket
    if (!webSocketRef.current) {
      webSocketRef.current = new EvolutionWebSocket(options);
    }
    webSocketRef.current.connect(status.instanceName);
  }, [options]);

  const connect = useCallback(async () => {
    const user = authService.getCurrentUser();
    if (!user) {
      console.error('Usuário não encontrado');
      setLastError('Usuário não autenticado');
      return;
    }

    if (!user.instance_name || user.instance_name.trim() === '') {
      console.error('Nome da instância não encontrado ou vazio');
      setLastError('Nome da instância não configurado. Faça logout e login novamente.');
      return;
    }

    try {
      handleStatusChange('connecting');
      setLastError(null);
      
      console.log('Iniciando processo de conexão para:', user.instance_name);

      // 1. Criar/verificar instância
      try {
        await EvolutionApi.createInstance(user.instance_name);
      } catch (error) {
        console.log('Instância pode já existir, continuando...');
      }

      // 2. Aguardar um pouco para a instância estar pronta
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 3. Verificar status da instância
      const status = await EvolutionApi.fetchInstanceStatus(user.instance_name);
      setInstanceStatus(status);
      
      if (status?.ownerJid) {
        // WhatsApp já está conectado
        console.log('WhatsApp já conectado:', status);
        handleStatusChange('connected');
        handleConnected(status);
      } else {
        // WhatsApp não está conectado, aguardar QR Code
        console.log('WhatsApp não conectado, aguardando QR Code');
        handleStatusChange('waiting_qr');
        
        // 4. Configurar webhook
        await EvolutionApi.configureWebhook(user.instance_name);
        
        // 5. Iniciar verificação contínua do status
        startStatusCheck(user.instance_name, connectionStatus, handleStatusChange, handleConnected);
      }
      
    } catch (error) {
      console.error('Erro no processo de conexão:', error);
      handleStatusChange('disconnected');
      setLastError(`Erro ao conectar: ${error}`);
      options.onError?.(error);
    }
  }, [connectionStatus, handleStatusChange, handleConnected, options, setInstanceStatus, startStatusCheck]);

  const disconnect = useCallback(() => {
    stopStatusCheck();

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (webSocketRef.current) {
      webSocketRef.current.disconnect();
      webSocketRef.current = null;
    }
    
    handleStatusChange('disconnected');
    setInstanceStatus(null);
  }, [handleStatusChange, setInstanceStatus, stopStatusCheck]);

  const sendMessage = useCallback((payload: any) => {
    if (webSocketRef.current?.isConnected) {
      return webSocketRef.current.sendMessage(payload);
    }
    return false;
  }, []);

  const getQRCode = useCallback(async () => {
    const user = authService.getCurrentUser();
    if (!user?.instance_name) {
      throw new Error('Instância não configurada');
    }
    
    // Só buscar QR Code se não estiver conectado
    if (instanceStatus?.ownerJid) {
      throw new Error('WhatsApp já está conectado');
    }
    
    return await EvolutionApi.fetchQRCode(user.instance_name);
  }, [instanceStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connectionStatus,
    lastError,
    instanceStatus,
    connect,
    disconnect,
    sendMessage,
    getQRCode,
    isConnected: connectionStatus === 'connected',
    isWaitingQR: connectionStatus === 'waiting_qr'
  };
};

// Re-export types for backward compatibility
export type { EvolutionEvent, EvolutionSocketOptions, InstanceStatus } from '@/types/evolution';
