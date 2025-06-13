
import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { EvolutionSocketConfig, InstanceStatus, WebSocketMessage, MessageSenderRole } from '@/types/evolution';
import { evolutionApi } from '@/services/evolution/evolutionApi';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/sonner';

export const useEvolutionSocket = (instanceName: string, apiKey: string = 'SUACHAVEAQUI') => {
  const [isConnected, setIsConnected] = useState(false);
  const [instanceStatus, setInstanceStatus] = useState<InstanceStatus['status']>('disconnected');
  const [connectedPhone, setConnectedPhone] = useState<string>('');
  const [qrCode, setQrCode] = useState<string>('');
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const qrRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // Função para gerar instanceName limpo
  const cleanInstanceName = useCallback((name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, ''); // Remove espaços
  }, []);

  // Função para salvar mensagem no banco
  const saveMessage = useCallback(async (messageData: WebSocketMessage) => {
    try {
      await supabase.post('/messages', {
        content: messageData.body,
        sender_role: messageData.sender_role,
        sender_phone: messageData.phone,
        sent_at: messageData.timestamp || new Date().toISOString(),
        conversation_id: messageData.conversation_id,
        message_type: 'text',
        instance_id: instanceName
      });
      console.log('Mensagem salva no banco:', messageData);
    } catch (error) {
      console.error('Erro ao salvar mensagem no banco:', error);
    }
  }, [instanceName]);

  // Função para atualizar status da instância no banco
  const updateInstanceStatus = useCallback(async (status: InstanceStatus) => {
    try {
      const updateData: any = {
        is_connected: status.status === 'connected'
      };

      if (status.phone) {
        updateData.phone = status.phone;
      }
      if (status.instanceId) {
        updateData.instance_id = status.instanceId;
      }

      // Se desconectado, limpar dados
      if (status.status === 'disconnected') {
        updateData.phone = null;
        updateData.instance_id = null;
      }

      await supabase.patch(`/clients_instances?instance_name=eq.${instanceName}`, updateData);
      console.log('Status da instância atualizado no banco:', updateData);
    } catch (error) {
      console.error('Erro ao atualizar status da instância:', error);
    }
  }, [instanceName]);

  // Função para conectar ao WebSocket
  const connectSocket = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.disconnect();
    }

    const socketUrl = `wss://evo.haddx.com.br`;
    console.log('Conectando ao WebSocket:', `${socketUrl}/${instanceName}`);

    const socket = io(socketUrl, {
      transports: ['websocket'],
      path: `/${instanceName}`,
      auth: {
        token: apiKey
      },
      reconnection: false // Vamos gerenciar reconexão manualmente
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
      attemptReconnect();
    });

    // Escutar status da instância
    socket.on('instance.status', (data: any) => {
      console.log('Status da instância recebido:', data);
      
      const status: InstanceStatus = {
        instance: data.instance || instanceName,
        status: data.status,
        phone: data.phone,
        instanceId: data.instanceId
      };

      setInstanceStatus(status.status);
      if (status.phone) {
        setConnectedPhone(status.phone);
      }

      updateInstanceStatus(status);

      if (status.status === 'connected') {
        setQrCode(''); // Limpar QR quando conectar
        setIsGeneratingQR(false);
        setIsConnecting(false);
        
        // Parar refresh automático do QR
        if (qrRefreshInterval.current) {
          clearInterval(qrRefreshInterval.current);
          qrRefreshInterval.current = null;
        }
        
        toast.success(`WhatsApp conectado ao número: ${status.phone}`);
      } else if (status.status === 'disconnected') {
        setConnectedPhone('');
        setIsConnecting(false);
        toast.warning('WhatsApp desconectado');
      }
    });

    // Escutar mensagens enviadas por agentes
    socket.on('MESSAGES_UPSERT', (data: any) => {
      console.log('Mensagem do agente recebida:', data);
      
      if (data.message && data.message.body) {
        const messageData: WebSocketMessage = {
          body: data.message.body,
          sender_role: 'agent',
          timestamp: new Date().toISOString(),
          instance_id: instanceName,
          phone: data.message.from || data.phone,
          conversation_id: data.conversation_id
        };
        
        saveMessage(messageData);
      }
    });

    // Escutar mensagens enviadas pelo sistema/IA
    socket.on('SEND_MESSAGE', (data: any) => {
      console.log('Mensagem do sistema recebida:', data);
      
      if (data.body) {
        const messageData: WebSocketMessage = {
          body: data.body,
          sender_role: 'system',
          timestamp: new Date().toISOString(),
          instance_id: instanceName,
          phone: data.phone,
          conversation_id: data.conversation_id
        };
        
        saveMessage(messageData);
      }
    });

    // Escutar mensagens de clientes
    socket.on('message', (data: any) => {
      console.log('Mensagem do cliente recebida:', data);
      
      if (data.body) {
        const messageData: WebSocketMessage = {
          body: data.body,
          sender_role: 'client',
          timestamp: new Date().toISOString(),
          instance_id: instanceName,
          phone: data.from || data.phone,
          conversation_id: data.conversation_id
        };
        
        saveMessage(messageData);
      }
    });

    socket.on('message_received', (data: any) => {
      console.log('Mensagem recebida do cliente:', data);
      
      if (data.body) {
        const messageData: WebSocketMessage = {
          body: data.body,
          sender_role: 'client',
          timestamp: new Date().toISOString(),
          instance_id: instanceName,
          phone: data.from || data.phone,
          conversation_id: data.conversation_id
        };
        
        saveMessage(messageData);
      }
    });

    socket.on('connect_error', (error: any) => {
      console.error('Erro de conexão WebSocket:', error);
      setIsConnected(false);
    });

    socketRef.current = socket;
  }, [instanceName, apiKey, saveMessage, updateInstanceStatus, attemptReconnect]);

  // Função para tentativa de reconexão
  const attemptReconnect = useCallback(() => {
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
  }, [connectSocket]);

  // Função para refresh automático do QR
  const startQRRefresh = useCallback(() => {
    if (qrRefreshInterval.current) {
      clearInterval(qrRefreshInterval.current);
    }

    qrRefreshInterval.current = setInterval(() => {
      if (instanceStatus !== 'connected' && !isGeneratingQR) {
        console.log('Refreshing QR Code automaticamente...');
        generateQRCode();
      }
    }, 30000); // 30 segundos
  }, [instanceStatus, isGeneratingQR]);

  // Função para gerar QR Code
  const generateQRCode = useCallback(async () => {
    try {
      setIsGeneratingQR(true);
      setQrCode('');
      setInstanceStatus('connecting');

      console.log('Criando/conectando instância:', instanceName);
      
      // Primeiro tentar criar a instância (caso não exista)
      try {
        await evolutionApi.createInstance(instanceName);
      } catch (error) {
        // Se já existir, apenas conectar
        console.log('Instância já existe, apenas conectando...');
      }

      // Conectar a instância
      await evolutionApi.connectInstance(instanceName);

      // Gerar QR
      console.log('Gerando QR Code para:', instanceName);
      const qrResponse = await evolutionApi.generateQRCode(instanceName);
      
      if (qrResponse.qr) {
        setQrCode(`data:image/png;base64,${qrResponse.qr}`);
        toast.info('QR Code gerado! Escaneie com seu WhatsApp.');
        
        // Iniciar refresh automático
        startQRRefresh();
      }
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      toast.error('Erro ao gerar QR Code. Tente novamente.');
      setInstanceStatus('disconnected');
    } finally {
      setIsGeneratingQR(false);
    }
  }, [instanceName, startQRRefresh]);

  // Função para trocar número (desconectar)
  const changeNumber = useCallback(async () => {
    try {
      setIsConnecting(true);
      
      // Parar refresh do QR
      if (qrRefreshInterval.current) {
        clearInterval(qrRefreshInterval.current);
        qrRefreshInterval.current = null;
      }
      
      // Desconectar socket
      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      // Desconectar instância na API
      await evolutionApi.disconnectInstance(instanceName);
      
      // Limpar estados
      setInstanceStatus('disconnected');
      setConnectedPhone('');
      setQrCode('');
      setIsConnected(false);
      
      // Atualizar banco
      await updateInstanceStatus({
        instance: instanceName,
        status: 'disconnected'
      });

      toast.success('Número desconectado. Você pode gerar um novo QR Code.');
    } catch (error) {
      console.error('Erro ao trocar número:', error);
      toast.error('Erro ao desconectar. Tente novamente.');
    } finally {
      setIsConnecting(false);
    }
  }, [instanceName, updateInstanceStatus]);

  // Função para enviar mensagem
  const sendMessage = useCallback(async (phone: string, message: string, conversationId?: string) => {
    if (!socketRef.current?.connected || instanceStatus !== 'connected') {
      toast.error('WhatsApp não conectado. Conecte primeiro.');
      return false;
    }

    try {
      console.log('Enviando mensagem via WebSocket:', { phone, message });
      
      socketRef.current.emit('SEND_MESSAGE', {
        instanceId: instanceName,
        phone,
        body: message
      });

      // Salvar mensagem como enviada pelo sistema
      const messageData: WebSocketMessage = {
        body: message,
        sender_role: 'system',
        timestamp: new Date().toISOString(),
        instance_id: instanceName,
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
  }, [instanceStatus, instanceName, saveMessage]);

  // Conectar ao montar o componente
  useEffect(() => {
    if (instanceName) {
      connectSocket();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (qrRefreshInterval.current) {
        clearInterval(qrRefreshInterval.current);
      }
    };
  }, [connectSocket]);

  return {
    isConnected,
    instanceStatus,
    connectedPhone,
    qrCode,
    isGeneratingQR,
    isConnecting,
    generateQRCode,
    changeNumber,
    sendMessage,
    reconnectAttempts: reconnectAttempts.current
  };
};
