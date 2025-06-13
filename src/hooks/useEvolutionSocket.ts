
import { useEffect, useRef, useState, useCallback } from 'react';
import { authService } from '@/services/authService';
import { toast } from '@/components/ui/sonner';
import { io, Socket } from 'socket.io-client';

export interface EvolutionEvent {
  event: string;
  instance: string;
  data: any;
  destination?: string;
  date_time: string;
}

export interface EvolutionSocketOptions {
  onMessage?: (event: EvolutionEvent) => void;
  onStatusChange?: (status: 'connected' | 'disconnected') => void;
  onError?: (error: any) => void;
}

export const useEvolutionSocket = (options: EvolutionSocketOptions = {}) => {
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [lastError, setLastError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const createInstance = useCallback(async (instanceName: string) => {
    try {
      console.log('Criando instância:', instanceName);
      
      const response = await fetch('https://evo.haddx.com.br/instance/create', {
        method: 'POST',
        headers: {
          'apikey': 'SUACHAVEAQUI',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          instanceName: instanceName,
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS',
          WEBHOOK_GLOBAL_ENABLED: 'true'
        })
      });

      if (!response.ok) {
        throw new Error(`Erro ao criar instância: ${response.status}`);
      }

      const result = await response.json();
      console.log('Instância criada:', result);
      return result;
    } catch (error) {
      console.error('Erro ao criar instância:', error);
      throw error;
    }
  }, []);

  const fetchInstanceStatus = useCallback(async (instanceName: string) => {
    try {
      console.log('Verificando status da instância:', instanceName);
      
      const response = await fetch(`https://evo.haddx.com.br/instance/fetchInstances?instanceName=${encodeURIComponent(instanceName)}`, {
        method: 'GET',
        headers: {
          'apikey': 'SUACHAVEAQUI'
        }
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar instância: ${response.status}`);
      }

      const result = await response.json();
      console.log('Status da instância:', result);
      return result;
    } catch (error) {
      console.error('Erro ao buscar status da instância:', error);
      throw error;
    }
  }, []);

  const configureWebhook = useCallback(async (instanceName: string) => {
    try {
      console.log('Configurando webhook para:', instanceName);
      
      const response = await fetch(`https://evo.haddx.com.br/webhook/set/${instanceName}`, {
        method: 'POST',
        headers: {
          'apikey': 'SUACHAVEAQUI',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          webhook: {
            enabled: true,
            url: 'https://autowebhook.haddx.com.br/webhook/message',
            events: [
              'MESSAGES_UPSERT',
              'SEND_MESSAGE'
            ],
            webhook_by_events: true,
            webhook_base64: true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Erro ao configurar webhook: ${response.status}`);
      }

      const result = await response.json();
      console.log('Webhook configurado:', result);
      return result;
    } catch (error) {
      console.error('Erro ao configurar webhook:', error);
      throw error;
    }
  }, []);

  const fetchQRCode = useCallback(async (instanceName: string) => {
    try {
      console.log('Buscando QR Code para:', instanceName);
      
      const response = await fetch(`https://evo.haddx.com.br/instance/connect/${instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': 'SUACHAVEAQUI'
        }
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar QR Code: ${response.status}`);
      }

      const result = await response.json();
      console.log('QR Code obtido:', { hasBase64: !!result.base64 });
      return result;
    } catch (error) {
      console.error('Erro ao buscar QR Code:', error);
      throw error;
    }
  }, []);

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
      setConnectionStatus('connecting');
      setLastError(null);
      
      console.log('Iniciando processo de conexão para:', user.instance_name);

      // 1. Criar/verificar instância
      try {
        await createInstance(user.instance_name);
      } catch (error) {
        console.log('Instância pode já existir, continuando...');
      }

      // 2. Aguardar um pouco para a instância estar pronta
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 3. Verificar status da instância
      const instanceStatus = await fetchInstanceStatus(user.instance_name);
      
      // 4. Configurar webhook se a instância não estiver conectada
      if (!instanceStatus.ownerJid) {
        await configureWebhook(user.instance_name);
      }

      setConnectionStatus('connected');
      options.onStatusChange?.('connected');
      
    } catch (error) {
      console.error('Erro no processo de conexão:', error);
      setConnectionStatus('disconnected');
      setLastError(`Erro ao conectar: ${error}`);
      options.onError?.(error);
    }
  }, [createInstance, fetchInstanceStatus, configureWebhook, options]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    setConnectionStatus('disconnected');
    options.onStatusChange?.('disconnected');
  }, [options]);

  const sendMessage = useCallback((payload: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('message', payload);
      return true;
    }
    return false;
  }, []);

  const getQRCode = useCallback(async () => {
    const user = authService.getCurrentUser();
    if (!user?.instance_name) {
      throw new Error('Instância não configurada');
    }
    
    return await fetchQRCode(user.instance_name);
  }, [fetchQRCode]);

  // Remover a conexão automática
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connectionStatus,
    lastError,
    connect,
    disconnect,
    sendMessage,
    getQRCode,
    isConnected: connectionStatus === 'connected'
  };
};
