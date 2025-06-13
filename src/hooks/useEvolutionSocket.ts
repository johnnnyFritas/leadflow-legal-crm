
import { useState, useRef, useCallback, useEffect } from 'react';
import { authService } from '@/services/authService';
import { ConnectionStatus, EvolutionSocketOptions } from '@/types/evolution';
import { EvolutionApi } from '@/services/evolution/evolutionApi';
import { EvolutionWebSocket } from '@/services/evolution/evolutionWebSocket';
import { useEvolutionStatus } from './useEvolutionStatus';
import { EVOLUTION_CONFIG } from '@/constants/evolution';

export const useEvolutionSocket = (options: EvolutionSocketOptions = {}) => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [lastError, setLastError] = useState<string | null>(null);
  const webSocketRef = useRef<EvolutionWebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    instanceStatus,
    setInstanceStatus,
    startStatusCheck,
    stopStatusCheck
  } = useEvolutionStatus();

  const handleStatusChange = useCallback((status: ConnectionStatus) => {
    console.log('🔄 STATUS CHANGE:', status);
    setConnectionStatus(status);
    options.onStatusChange?.(status);
  }, [options]);

  const connectWebSocket = useCallback((instanceName: string) => {
    console.log('🌐 CONECTANDO WEBSOCKET para:', instanceName);
    
    if (webSocketRef.current) {
      console.log('🔄 Desconectando WebSocket anterior');
      webSocketRef.current.disconnect();
    }

    const socketOptions: EvolutionSocketOptions = {
      onMessage: (event) => {
        console.log('📨 Mensagem WebSocket recebida:', event);
        options.onMessage?.(event);
      },
      onStatusChange: (status) => {
        console.log('🔄 WebSocket status change:', status);
        if (status === 'connected') {
          console.log('✅ WebSocket conectado com sucesso');
        }
      },
      onError: (error) => {
        console.error('❌ Erro WebSocket:', error);
        setLastError(String(error));
        options.onError?.(error);
      }
    };
    
    webSocketRef.current = new EvolutionWebSocket(socketOptions);
    webSocketRef.current.connect(instanceName);
  }, [options]);

  const handleConnected = useCallback((status: any) => {
    console.log('✅ WHATSAPP CONECTADO:', status);
    connectWebSocket(status.instanceName);
  }, [connectWebSocket]);

  const connect = useCallback(async () => {
    const user = authService.getCurrentUser();
    if (!user) {
      console.error('❌ Usuário não encontrado');
      setLastError('Usuário não autenticado');
      return;
    }

    if (!user.instance_name || user.instance_name.trim() === '') {
      console.error('❌ Nome da instância não encontrado ou vazio');
      setLastError('Nome da instância não configurado. Faça logout e login novamente.');
      return;
    }

    try {
      handleStatusChange('connecting');
      setLastError(null);
      
      console.log('🚀 INICIANDO PROCESSO DE CONEXÃO para:', user.instance_name);

      // 1. Criar/verificar instância
      try {
        console.log('📝 Criando instância...');
        await EvolutionApi.createInstance(user.instance_name);
        console.log('✅ Instância criada/verificada');
      } catch (error) {
        console.log('⚠️ Instância pode já existir, continuando...', error);
      }

      // 2. Conectar WebSocket imediatamente após criar instância
      console.log('🌐 Conectando WebSocket...');
      connectWebSocket(user.instance_name);

      // 3. Aguardar um pouco para a instância estar pronta
      console.log('⏳ Aguardando instância ficar pronta...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      // 4. Verificar status da instância
      console.log('🔍 Verificando status da instância...');
      const status = await EvolutionApi.fetchInstanceStatus(user.instance_name);
      console.log('📊 Status da instância:', status);
      setInstanceStatus(status);
      
      if (status?.ownerJid) {
        // WhatsApp já está conectado
        console.log('✅ WhatsApp já conectado:', status);
        handleStatusChange('connected');
        handleConnected(status);
      } else {
        // WhatsApp não está conectado, aguardar QR Code
        console.log('📱 WhatsApp não conectado, mudando para waiting_qr');
        handleStatusChange('waiting_qr');
        
        // 5. Configurar webhook
        try {
          console.log('🔗 Configurando webhook...');
          await EvolutionApi.configureWebhook(user.instance_name);
          console.log('✅ Webhook configurado');
        } catch (error) {
          console.error('⚠️ Erro ao configurar webhook:', error);
        }
        
        // 6. Iniciar verificação contínua do status
        console.log('🔄 Iniciando verificação contínua de status...');
        startStatusCheck(user.instance_name, connectionStatus, handleStatusChange, handleConnected);
      }
      
    } catch (error) {
      console.error('❌ Erro no processo de conexão:', error);
      handleStatusChange('disconnected');
      setLastError(`Erro ao conectar: ${error}`);
      options.onError?.(error);
    }
  }, [connectionStatus, handleStatusChange, handleConnected, options, setInstanceStatus, startStatusCheck, connectWebSocket]);

  const disconnect = useCallback(() => {
    console.log('🔌 DESCONECTANDO...');
    stopStatusCheck();

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (webSocketRef.current) {
      console.log('🌐 Desconectando WebSocket...');
      webSocketRef.current.disconnect();
      webSocketRef.current = null;
    }
    
    handleStatusChange('disconnected');
    setInstanceStatus(null);
    console.log('✅ Desconectado com sucesso');
  }, [handleStatusChange, setInstanceStatus, stopStatusCheck]);

  const sendMessage = useCallback((payload: any) => {
    if (webSocketRef.current?.isConnected) {
      console.log('📤 Enviando mensagem via WebSocket:', payload);
      return webSocketRef.current.sendMessage(payload);
    }
    console.warn('⚠️ WebSocket não conectado, não é possível enviar mensagem');
    return false;
  }, []);

  const getQRCode = useCallback(async () => {
    const user = authService.getCurrentUser();
    if (!user?.instance_name) {
      throw new Error('Instância não configurada');
    }
    
    console.log('📱 Buscando QR Code para:', user.instance_name);
    const result = await EvolutionApi.fetchQRCode(user.instance_name);
    console.log('📱 QR Code recebido:', { hasBase64: !!result?.base64 });
    return result;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Limpando recursos do hook...');
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
