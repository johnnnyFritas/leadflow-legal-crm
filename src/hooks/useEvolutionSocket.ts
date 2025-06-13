
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
  onStatusChange?: (status: 'disconnected' | 'connecting' | 'waiting_qr' | 'connected') => void;
  onError?: (error: any) => void;
}

export interface InstanceStatus {
  instanceName: string;
  ownerJid?: string;
  profilePictureUrl?: string;
  profileName?: string;
  phone?: string;
  instanceId?: string;
}

export const useEvolutionSocket = (options: EvolutionSocketOptions = {}) => {
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'waiting_qr' | 'connected'>('disconnected');
  const [lastError, setLastError] = useState<string | null>(null);
  const [instanceStatus, setInstanceStatus] = useState<InstanceStatus | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const statusCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const fetchInstanceStatus = useCallback(async (instanceName: string): Promise<InstanceStatus | null> => {
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
      
      if (result && result.length > 0) {
        const instance = result[0];
        return {
          instanceName: instance.instanceName || instanceName,
          ownerJid: instance.ownerJid,
          profilePictureUrl: instance.profilePictureUrl,
          profileName: instance.profileName,
          phone: instance.ownerJid ? instance.ownerJid.replace('@s.whatsapp.net', '') : undefined,
          instanceId: instance.instanceId
        };
      }
      
      return null;
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
              'SEND_MESSAGE',
              'CONNECTION_UPDATE'
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

  const saveInstanceDataToSupabase = useCallback(async (status: InstanceStatus) => {
    try {
      console.log('Salvando dados da instância no Supabase:', status);
      
      if (status.instanceId && status.phone) {
        await authService.updateInstanceData(status.instanceId, status.phone);
        console.log('Dados salvos no Supabase com sucesso');
      }
    } catch (error) {
      console.error('Erro ao salvar dados no Supabase:', error);
    }
  }, []);

  const connectWebSocket = useCallback((instanceName: string) => {
    try {
      console.log('Conectando WebSocket para:', instanceName);
      
      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      socketRef.current = io(`wss://evo.haddx.com.br`, {
        query: { instanceName },
        transports: ['websocket']
      });

      socketRef.current.on('connect', () => {
        console.log('WebSocket conectado');
      });

      socketRef.current.on('disconnect', () => {
        console.log('WebSocket desconectado');
      });

      socketRef.current.on('message', (data: EvolutionEvent) => {
        console.log('Mensagem recebida via WebSocket:', data);
        options.onMessage?.(data);
      });

      socketRef.current.on('connection.update', (data: any) => {
        console.log('Status de conexão atualizado:', data);
        if (data.connection === 'close') {
          setConnectionStatus('waiting_qr');
          options.onStatusChange?.('waiting_qr');
        }
      });

    } catch (error) {
      console.error('Erro ao conectar WebSocket:', error);
    }
  }, [options]);

  const startStatusCheck = useCallback((instanceName: string) => {
    if (statusCheckIntervalRef.current) {
      clearInterval(statusCheckIntervalRef.current);
    }

    statusCheckIntervalRef.current = setInterval(async () => {
      try {
        const status = await fetchInstanceStatus(instanceName);
        setInstanceStatus(status);
        
        if (status?.ownerJid) {
          // WhatsApp está conectado
          if (connectionStatus !== 'connected') {
            console.log('WhatsApp conectado detectado:', status);
            setConnectionStatus('connected');
            options.onStatusChange?.('connected');
            
            // Salvar dados no Supabase
            await saveInstanceDataToSupabase(status);
            
            // Conectar WebSocket
            connectWebSocket(instanceName);
            
            // Parar verificação contínua
            if (statusCheckIntervalRef.current) {
              clearInterval(statusCheckIntervalRef.current);
              statusCheckIntervalRef.current = null;
            }
          }
        } else {
          // WhatsApp não está conectado
          if (connectionStatus === 'connected') {
            setConnectionStatus('waiting_qr');
            options.onStatusChange?.('waiting_qr');
          }
        }
      } catch (error) {
        console.error('Erro na verificação de status:', error);
      }
    }, 3000); // Verificar a cada 3 segundos
  }, [connectionStatus, fetchInstanceStatus, saveInstanceDataToSupabase, connectWebSocket, options]);

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
      options.onStatusChange?.('connecting');
      
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
      const status = await fetchInstanceStatus(user.instance_name);
      setInstanceStatus(status);
      
      if (status?.ownerJid) {
        // WhatsApp já está conectado
        console.log('WhatsApp já conectado:', status);
        setConnectionStatus('connected');
        options.onStatusChange?.('connected');
        
        // Salvar dados no Supabase
        await saveInstanceDataToSupabase(status);
        
        // Conectar WebSocket
        connectWebSocket(user.instance_name);
      } else {
        // WhatsApp não está conectado, aguardar QR Code
        console.log('WhatsApp não conectado, aguardando QR Code');
        setConnectionStatus('waiting_qr');
        options.onStatusChange?.('waiting_qr');
        
        // 4. Configurar webhook
        await configureWebhook(user.instance_name);
        
        // 5. Iniciar verificação contínua do status
        startStatusCheck(user.instance_name);
      }
      
    } catch (error) {
      console.error('Erro no processo de conexão:', error);
      setConnectionStatus('disconnected');
      setLastError(`Erro ao conectar: ${error}`);
      options.onError?.(error);
      options.onStatusChange?.('disconnected');
    }
  }, [createInstance, fetchInstanceStatus, configureWebhook, saveInstanceDataToSupabase, connectWebSocket, startStatusCheck, options]);

  const disconnect = useCallback(() => {
    if (statusCheckIntervalRef.current) {
      clearInterval(statusCheckIntervalRef.current);
      statusCheckIntervalRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    setConnectionStatus('disconnected');
    setInstanceStatus(null);
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
    
    // Só buscar QR Code se não estiver conectado
    if (instanceStatus?.ownerJid) {
      throw new Error('WhatsApp já está conectado');
    }
    
    return await fetchQRCode(user.instance_name);
  }, [fetchQRCode, instanceStatus]);

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
