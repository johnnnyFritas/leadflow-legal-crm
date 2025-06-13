
import { useEffect, useRef, useState, useCallback } from 'react';
import { authService } from '@/services/authService';
import { toast } from '@/components/ui/sonner';

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
  onError?: (error: Event) => void;
}

export const useEvolutionSocket = (options: EvolutionSocketOptions = {}) => {
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [lastError, setLastError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    const user = authService.getCurrentUser();
    if (!user?.instance_name) {
      console.error('Nome da instância não encontrado');
      return;
    }

    try {
      setConnectionStatus('connecting');
      const wsUrl = `wss://evolution.haddx.com.br/${user.instance_name}?authorization=Bearer%20SUACHAVEAQUI`;
      
      console.log('Conectando ao WebSocket Evolution:', wsUrl);
      
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket Evolution conectado');
        setConnectionStatus('connected');
        setLastError(null);
        reconnectAttempts.current = 0;
        options.onStatusChange?.('connected');
        
        // Configurar ping para manter conexão ativa
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000); // Ping a cada 30 segundos
      };

      ws.onclose = (event) => {
        console.log('WebSocket Evolution desconectado:', event.code, event.reason);
        setConnectionStatus('disconnected');
        options.onStatusChange?.('disconnected');
        
        // Limpar ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Tentar reconectar se não foi fechamento intencional
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          console.log(`Tentando reconectar em ${delay}ms (tentativa ${reconnectAttempts.current + 1})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          toast.error('Não foi possível conectar ao WhatsApp. Verifique sua conexão.');
        }
      };

      ws.onerror = (error) => {
        console.error('Erro no WebSocket Evolution:', error);
        setLastError('Erro de conexão com WhatsApp');
        options.onError?.(error);
      };

      ws.onmessage = (event) => {
        try {
          const data: EvolutionEvent = JSON.parse(event.data);
          console.log('Evento Evolution recebido:', data);
          options.onMessage?.(data);
        } catch (error) {
          console.error('Erro ao processar mensagem Evolution:', error);
        }
      };

      socketRef.current = ws;

    } catch (error) {
      console.error('Erro ao criar conexão WebSocket:', error);
      setConnectionStatus('disconnected');
      setLastError('Erro ao conectar com WhatsApp');
    }
  }, [options]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.close(1000, 'Desconexão intencional');
      socketRef.current = null;
    }
    
    setConnectionStatus('disconnected');
  }, []);

  const sendMessage = useCallback((payload: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    connectionStatus,
    lastError,
    connect,
    disconnect,
    sendMessage,
    isConnected: connectionStatus === 'connected'
  };
};
