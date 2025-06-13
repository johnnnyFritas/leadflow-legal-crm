
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
    console.log('🔄 SOCKET: STATUS CHANGE:', status);
    setConnectionStatus(status);
    options.onStatusChange?.(status);
  }, [options]);

  const connectWebSocket = useCallback((instanceName: string) => {
    console.log('🌐 SOCKET: CONECTANDO WEBSOCKET para:', instanceName);
    
    if (webSocketRef.current) {
      console.log('🔄 SOCKET: Desconectando WebSocket anterior');
      webSocketRef.current.disconnect();
    }

    const socketOptions: EvolutionSocketOptions = {
      onMessage: (event) => {
        console.log('📨 SOCKET: Mensagem WebSocket recebida:', event);
        options.onMessage?.(event);
      },
      onStatusChange: (status) => {
        console.log('🔄 SOCKET: WebSocket status change:', status);
        if (status === 'connected') {
          console.log('✅ SOCKET: WebSocket conectado com sucesso');
        }
      },
      onError: (error) => {
        console.error('❌ SOCKET: Erro WebSocket:', error);
        setLastError(String(error));
        options.onError?.(error);
      }
    };
    
    webSocketRef.current = new EvolutionWebSocket(socketOptions);
    webSocketRef.current.connect(instanceName);
  }, [options]);

  const handleConnected = useCallback((status: any) => {
    console.log('✅ SOCKET: WHATSAPP CONECTADO:', status);
    connectWebSocket(status.instanceName);
  }, [connectWebSocket]);

  const connect = useCallback(async () => {
    console.log('🚀 SOCKET: INICIANDO PROCESSO DE CONEXÃO...');

    // Verificar autenticação
    const user = authService.getCurrentUser();
    if (!user) {
      console.error('❌ SOCKET: Usuário não encontrado');
      setLastError('Usuário não autenticado');
      handleStatusChange('disconnected');
      return;
    }

    if (!user.instance_name || user.instance_name.trim() === '') {
      console.error('❌ SOCKET: Nome da instância não encontrado ou vazio');
      setLastError('Nome da instância não configurado. Faça logout e login novamente.');
      handleStatusChange('disconnected');
      return;
    }

    try {
      handleStatusChange('connecting');
      setLastError(null);
      
      console.log('🚀 SOCKET: Usuário validado, iniciando conexão para:', user.instance_name);

      // 1. Criar/verificar instância
      try {
        console.log('📝 SOCKET: Criando instância...');
        await EvolutionApi.createInstance(user.instance_name);
        console.log('✅ SOCKET: Instância criada/verificada');
      } catch (error) {
        console.log('⚠️ SOCKET: Instância pode já existir, continuando...', error);
      }

      // 2. Verificar status da instância
      console.log('🔍 SOCKET: Verificando status da instância...');
      const status = await EvolutionApi.fetchInstanceStatus(user.instance_name);
      console.log('📊 SOCKET: Status da instância:', status);
      setInstanceStatus(status);
      
      if (status?.ownerJid) {
        // WhatsApp já está conectado
        console.log('✅ SOCKET: WhatsApp já conectado:', status);
        handleStatusChange('connected');
        connectWebSocket(user.instance_name);
        handleConnected(status);
      } else {
        // WhatsApp não está conectado, forçar para waiting_qr
        console.log('📱 SOCKET: WhatsApp não conectado, forçando para waiting_qr');
        handleStatusChange('waiting_qr');
        
        // 3. Conectar WebSocket
        console.log('🌐 SOCKET: Conectando WebSocket para aguardar eventos...');
        connectWebSocket(user.instance_name);
        
        // 4. Configurar webhook
        try {
          console.log('🔗 SOCKET: Configurando webhook...');
          await EvolutionApi.configureWebhook(user.instance_name);
          console.log('✅ SOCKET: Webhook configurado');
        } catch (error) {
          console.error('⚠️ SOCKET: Erro ao configurar webhook:', error);
        }
        
        // 5. Iniciar verificação contínua do status
        console.log('🔄 SOCKET: Iniciando verificação contínua de status...');
        startStatusCheck(user.instance_name, connectionStatus, handleStatusChange, handleConnected);
      }
      
    } catch (error) {
      console.error('❌ SOCKET: Erro no processo de conexão:', error);
      handleStatusChange('disconnected');
      setLastError(`Erro ao conectar: ${error}`);
      options.onError?.(error);
    }
  }, [connectionStatus, handleStatusChange, handleConnected, options, setInstanceStatus, startStatusCheck, connectWebSocket]);

  const disconnect = useCallback(() => {
    console.log('🔌 SOCKET: DESCONECTANDO...');
    stopStatusCheck();

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (webSocketRef.current) {
      console.log('🌐 SOCKET: Desconectando WebSocket...');
      webSocketRef.current.disconnect();
      webSocketRef.current = null;
    }
    
    handleStatusChange('disconnected');
    setInstanceStatus(null);
    console.log('✅ SOCKET: Desconectado com sucesso');
  }, [handleStatusChange, setInstanceStatus, stopStatusCheck]);

  const sendMessage = useCallback((payload: any) => {
    if (webSocketRef.current?.isConnected) {
      console.log('📤 SOCKET: Enviando mensagem via WebSocket:', payload);
      return webSocketRef.current.sendMessage(payload);
    }
    console.warn('⚠️ SOCKET: WebSocket não conectado, não é possível enviar mensagem');
    return false;
  }, []);

  const getQRCode = useCallback(async () => {
    const user = authService.getCurrentUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }
    
    if (!user.instance_name || user.instance_name.trim() === '') {
      throw new Error('Nome da instância não configurado');
    }
    
    console.log('📱 SOCKET: Buscando QR Code para:', user.instance_name);
    const result = await EvolutionApi.fetchQRCode(user.instance_name);
    console.log('📱 SOCKET: QR Code recebido:', { hasBase64: !!result?.base64 });
    return result;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 SOCKET: Limpando recursos do hook...');
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
