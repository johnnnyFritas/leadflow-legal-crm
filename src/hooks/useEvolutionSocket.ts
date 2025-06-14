
import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { InstanceStatus, WebSocketMessage, MessageSenderRole } from '@/types/evolution';
import { evolutionApi } from '@/services/evolution/evolutionApi';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';

export const useEvolutionSocket = () => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [instanceStatus, setInstanceStatus] = useState<InstanceStatus['status']>('disconnected');
  const [connectedPhone, setConnectedPhone] = useState<string>('');
  const [qrCode, setQrCode] = useState<string>('');
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [instanceData, setInstanceData] = useState<any>(null);
  
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

  // Buscar dados da instância do banco
  const fetchInstanceData = useCallback(async () => {
    if (!user?.id) return null;

    try {
      const response = await supabase.get<any[]>(`/clients_instances?user_id=eq.${user.id}`);
      let instance = response[0];

      if (!instance) {
        // Criar nova instância se não existir
        const instanceName = user.instance_name || 
          (user.company_name ? cleanInstanceName(user.company_name) : 'default');
        
        const newInstance = {
          user_id: user.id,
          instance_name: instanceName,
          is_connected: false,
          phone: null,
          instance_id: null
        };

        const created = await supabase.post<any>('/clients_instances', newInstance);
        instance = Array.isArray(created) ? created[0] : created;
      } else if (!instance.instance_name && user.company_name) {
        // Atualizar instance_name se estiver vazio
        const instanceName = cleanInstanceName(user.company_name);
        await supabase.patch(`/clients_instances?id=eq.${instance.id}`, {
          instance_name: instanceName
        });
        instance.instance_name = instanceName;
      }

      setInstanceData(instance);
      return instance;
    } catch (error) {
      console.error('Erro ao buscar dados da instância:', error);
      return null;
    }
  }, [user, cleanInstanceName]);

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
        instance_id: instanceData?.instance_name
      });
      console.log('Mensagem salva no banco:', messageData);
    } catch (error) {
      console.error('Erro ao salvar mensagem no banco:', error);
    }
  }, [instanceData]);

  // Função para atualizar status da instância no banco
  const updateInstanceStatus = useCallback(async (status: InstanceStatus) => {
    if (!instanceData?.id) return;

    try {
      const updateData: any = {
        is_connected: status.status === 'connected'
      };

      if (status.phone) {
        updateData.phone = status.phone;
        setConnectedPhone(status.phone);
      }
      if (status.instanceId) {
        updateData.instance_id = status.instanceId;
      }

      // Se desconectado, limpar dados
      if (status.status === 'disconnected') {
        updateData.phone = null;
        updateData.instance_id = null;
        setConnectedPhone('');
      }

      await supabase.patch(`/clients_instances?id=eq.${instanceData.id}`, updateData);
      
      // Atualizar estado local
      setInstanceData(prev => ({ ...prev, ...updateData }));
      
      console.log('Status da instância atualizado no banco:', updateData);
    } catch (error) {
      console.error('Erro ao atualizar status da instância:', error);
    }
  }, [instanceData]);

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
  }, []);

  // Função para conectar ao WebSocket
  const connectSocket = useCallback(() => {
    if (!instanceData?.instance_name) return;

    if (socketRef.current?.connected) {
      socketRef.current.disconnect();
    }

    const socketUrl = `wss://evo.haddx.com.br`;
    console.log('Conectando ao WebSocket:', `${socketUrl}/${instanceData.instance_name}`);

    const socket = io(socketUrl, {
      transports: ['websocket'],
      path: `/${instanceData.instance_name}`,
      auth: {
        apikey: 'SUACHAVEAQUI'
      },
      reconnection: false // Vamos gerenciar reconexão manualmente
    });

    socket.on('connect', () => {
      console.log('WebSocket conectado para instância:', instanceData.instance_name);
      setIsConnected(true);
      reconnectAttempts.current = 0;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    });

    socket.on('disconnect', () => {
      console.log('WebSocket desconectado para instância:', instanceData.instance_name);
      setIsConnected(false);
      attemptReconnect();
    });

    // Escutar status da instância
    socket.on('connection.update', (data: any) => {
      console.log('Status da instância recebido:', data);
      
      const status: InstanceStatus = {
        instance: data.instance || instanceData.instance_name,
        status: data.state === 'open' ? 'connected' : 'disconnected',
        phone: data.phone,
        instanceId: data.instanceId
      };

      setInstanceStatus(status.status);
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
        setIsConnecting(false);
        toast.warning('WhatsApp desconectado');
      }
    });

    // Escutar mensagens enviadas por agentes
    socket.on('messages.upsert', (data: any) => {
      console.log('Mensagem do agente recebida:', data);
      
      if (data.messages) {
        data.messages.forEach((msg: any) => {
          if (msg.message?.conversation && !msg.key.fromMe) {
            const messageData: WebSocketMessage = {
              body: msg.message.conversation,
              sender_role: 'client',
              timestamp: new Date().toISOString(),
              instance_id: instanceData.instance_name,
              phone: msg.key.remoteJid.replace('@s.whatsapp.net', ''),
              conversation_id: msg.key.remoteJid
            };
            
            saveMessage(messageData);
          }
        });
      }
    });

    // Escutar QR Code
    socket.on('qrcode.updated', (data: any) => {
      console.log('QR Code recebido:', data);
      if (data.qrcode) {
        setQrCode(`data:image/png;base64,${data.qrcode}`);
        setIsGeneratingQR(false);
      }
    });

    socket.on('connect_error', (error: any) => {
      console.error('Erro de conexão WebSocket:', error);
      setIsConnected(false);
    });

    socketRef.current = socket;
  }, [instanceData, saveMessage, updateInstanceStatus, attemptReconnect]);

  // Função para refresh automático do QR
  const startQRRefresh = useCallback(() => {
    if (qrRefreshInterval.current) {
      clearInterval(qrRefreshInterval.current);
    }

    qrRefreshInterval.current = setInterval(() => {
      if (instanceStatus !== 'connected' && !isGeneratingQR && instanceData?.instance_name) {
        console.log('Refreshing QR Code automaticamente...');
        generateQRCode();
      }
    }, 30000); // 30 segundos
  }, [instanceStatus, isGeneratingQR, instanceData]);

  // Função para gerar QR Code
  const generateQRCode = useCallback(async () => {
    if (!instanceData?.instance_name) {
      toast.error('Dados da instância não encontrados');
      return;
    }

    try {
      setIsGeneratingQR(true);
      setQrCode('');
      setInstanceStatus('connecting');

      console.log('Criando/conectando instância:', instanceData.instance_name);
      
      // Primeiro tentar criar a instância (caso não exista)
      try {
        await evolutionApi.createInstance(instanceData.instance_name);
      } catch (error) {
        // Se já existir, apenas conectar
        console.log('Instância já existe, apenas conectando...');
      }

      // Conectar a instância
      await evolutionApi.connectInstance(instanceData.instance_name);

      // Conectar WebSocket para receber QR
      if (!socketRef.current?.connected) {
        connectSocket();
      }

      // Gerar QR via API
      try {
        const qrResponse = await evolutionApi.generateQRCode(instanceData.instance_name);
        if (qrResponse.qr) {
          setQrCode(`data:image/png;base64,${qrResponse.qr}`);
        }
      } catch (error) {
        console.log('QR será recebido via WebSocket...');
      }

      toast.info('QR Code sendo gerado! Escaneie com seu WhatsApp.');
      
      // Iniciar refresh automático
      startQRRefresh();
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      toast.error('Erro ao gerar QR Code. Tente novamente.');
      setInstanceStatus('disconnected');
    } finally {
      setIsGeneratingQR(false);
    }
  }, [instanceData, connectSocket, startQRRefresh]);

  // Função para trocar número (desconectar)
  const changeNumber = useCallback(async () => {
    if (!instanceData?.instance_name) return;

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
      await evolutionApi.disconnectInstance(instanceData.instance_name);
      
      // Limpar estados
      setInstanceStatus('disconnected');
      setConnectedPhone('');
      setQrCode('');
      setIsConnected(false);
      
      // Atualizar banco
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
  }, [instanceData, updateInstanceStatus]);

  // Função para enviar mensagem
  const sendMessage = useCallback(async (phone: string, message: string, conversationId?: string) => {
    if (!instanceData?.instance_name || instanceStatus !== 'connected') {
      toast.error('WhatsApp não conectado. Conecte primeiro.');
      return false;
    }

    try {
      console.log('Enviando mensagem via API:', { phone, message });
      
      // Enviar via API REST
      await evolutionApi.sendMessage(instanceData.instance_name, phone, message);

      // Salvar mensagem como enviada pelo sistema
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

  // Inicializar dados da instância
  useEffect(() => {
    if (user?.id) {
      fetchInstanceData();
    }
  }, [user?.id, fetchInstanceData]);

  // Conectar WebSocket quando instanceData estiver disponível
  useEffect(() => {
    if (instanceData?.instance_name) {
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
  }, [instanceData?.instance_name, connectSocket]);

  return {
    isConnected,
    instanceStatus,
    connectedPhone,
    qrCode,
    isGeneratingQR,
    isConnecting,
    instanceName: instanceData?.instance_name || '',
    generateQRCode,
    changeNumber,
    sendMessage,
    reconnectAttempts: reconnectAttempts.current
  };
};
