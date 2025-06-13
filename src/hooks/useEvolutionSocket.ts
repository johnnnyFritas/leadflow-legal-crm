
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

  const activateWebSocket = useCallback(async (instanceName: string) => {
    try {
      console.log('Ativando WebSocket para instância:', instanceName);
      
      const response = await fetch(`https://evolution.haddx.com.br/websocket/${instanceName}`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer SUACHAVEAQUI',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          enabled: true,
          events: [
            'APPLICATION_STARTUP',
            'QRCODE_UPDATED', 
            'CONNECTION_UPDATE',
            'MESSAGES_SET',
            'MESSAGES_UPSERT',
            'MESSAGES_UPDATE',
            'SEND_MESSAGE'
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Erro ao ativar WebSocket: ${response.status}`);
      }

      const result = await response.json();
      console.log('WebSocket ativado na instância:', result);
      return true;
    } catch (error) {
      console.error('Erro ao ativar WebSocket:', error);
      setLastError('Erro ao ativar WebSocket na instância');
      return false;
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
      
      // Primeiro ativar o WebSocket na instância
      const activated = await activateWebSocket(user.instance_name);
      if (!activated) {
        setConnectionStatus('disconnected');
        return;
      }

      // Aguardar um pouco para a ativação ser processada
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Usar Socket.IO em modo tradicional (por instância)
      const socketUrl = `https://evolution.haddx.com.br/${user.instance_name}`;
      
      console.log('Conectando ao Socket.IO Evolution:', socketUrl);
      
      const socket = io(socketUrl, {
        transports: ['websocket'],
        auth: {
          authorization: 'Bearer SUACHAVEAQUI'
        },
        query: {
          authorization: 'Bearer SUACHAVEAQUI'
        }
      });

      socket.on('connect', () => {
        console.log('Socket.IO Evolution conectado');
        setConnectionStatus('connected');
        setLastError(null);
        reconnectAttempts.current = 0;
        options.onStatusChange?.('connected');
      });

      socket.on('disconnect', (reason) => {
        console.log('Socket.IO Evolution desconectado:', reason);
        setConnectionStatus('disconnected');
        options.onStatusChange?.('disconnected');

        // Tentar reconectar se não foi desconexão intencional
        if (reason !== 'io client disconnect' && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          console.log(`Tentando reconectar em ${delay}ms (tentativa ${reconnectAttempts.current + 1})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          toast.error('Não foi possível conectar ao WhatsApp. Verifique sua conexão.');
        }
      });

      socket.on('connect_error', (error) => {
        console.error('Erro na conexão Socket.IO Evolution:', error);
        setLastError('Erro de conexão com WhatsApp');
        options.onError?.(error);
      });

      // Escutar todos os eventos Evolution
      socket.onAny((eventName: string, data: any) => {
        console.log('Evento Evolution recebido:', { event: eventName, data });
        
        const evolutionEvent: EvolutionEvent = {
          event: eventName,
          instance: user.instance_name,
          data: data,
          date_time: new Date().toISOString()
        };
        
        options.onMessage?.(evolutionEvent);
      });

      socketRef.current = socket;

    } catch (error) {
      console.error('Erro ao criar conexão Socket.IO:', error);
      setConnectionStatus('disconnected');
      setLastError('Erro ao conectar com WhatsApp');
    }
  }, [options, activateWebSocket]);

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
  }, []);

  const sendMessage = useCallback((payload: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('message', payload);
      return true;
    }
    return false;
  }, []);

  // Remover a conexão automática - agora será manual
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
    isConnected: connectionStatus === 'connected'
  };
};
