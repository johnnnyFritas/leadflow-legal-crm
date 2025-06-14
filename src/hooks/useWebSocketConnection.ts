
import { useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { InstanceStatus } from '@/types/evolution';
import { toast } from '@/components/ui/sonner';

export const useWebSocketConnection = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const attemptReconnect = useCallback((connectSocket: () => void) => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.log('Máximo de tentativas de reconexão atingido');
      toast.error('Falha na conexão. Verifique sua internet e tente novamente.');
      return;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectAttempts.current += 1;
    console.log(`Tentativa de reconexão ${reconnectAttempts.current}/${maxReconnectAttempts} em 5 segundos...`);

    reconnectTimeoutRef.current = setTimeout(() => {
      connectSocket();
    }, 5000);
  }, []);

  const connectSocket = useCallback((
    instanceName: string,
    onStatusUpdate: (status: InstanceStatus) => void,
    onMessageReceived: (data: any) => void,
    onQRCodeReceived: (data: any) => void
  ) => {
    if (!instanceName) return;

    if (socketRef.current?.connected) {
      socketRef.current.disconnect();
    }

    const socketUrl = `https://evo.haddx.com.br`;
    console.log('Conectando ao WebSocket:', `${socketUrl} para instância ${instanceName}`);

    const socket = io(socketUrl, {
      transports: ['websocket'],
      query: {
        apikey: 'SUACHAVEAQUI',
        instance: instanceName
      },
      reconnection: false
    });

    socket.on('connect', () => {
      console.log('WebSocket conectado para instância:', instanceName);
      setIsConnected(true);
      reconnectAttempts.current = 0;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    });

    socket.on('disconnect', () => {
      console.log('WebSocket desconectado para instância:', instanceName);
      setIsConnected(false);
      attemptReconnect(() => connectSocket(instanceName, onStatusUpdate, onMessageReceived, onQRCodeReceived));
    });

    socket.on('connection.update', (data: any) => {
      console.log('Status da instância recebido:', data);
      
      if (data.instance !== instanceName) {
        console.log('Evento ignorado - instância diferente:', data.instance, 'vs', instanceName);
        return;
      }
      
      const eventData = data.data || data;
      
      const status: InstanceStatus = {
        instance: eventData.instance || data.instance,
        status: eventData.state === 'open' ? 'connected' : 'disconnected',
        phone: eventData.phone,
        instanceId: eventData.instanceId
      };

      console.log('Atualizando status para instância:', status.instance, 'status:', status.status);
      onStatusUpdate(status);

      if (status.status === 'connected') {
        setIsConnecting(false);
        toast.success(`WhatsApp conectado ao número: ${status.phone}`);
      } else if (status.status === 'disconnected') {
        setIsConnecting(false);
        toast.warning('WhatsApp desconectado');
      }
    });

    socket.on('messages.upsert', onMessageReceived);
    socket.on('qrcode.updated', onQRCodeReceived);

    socket.on('connect_error', (error: any) => {
      console.error('Erro de conexão WebSocket:', error);
      setIsConnected(false);
    });

    socketRef.current = socket;
  }, [attemptReconnect]);

  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
  }, []);

  return {
    isConnected,
    isConnecting,
    setIsConnecting,
    reconnectAttempts: reconnectAttempts.current,
    connectSocket,
    disconnectSocket
  };
};
