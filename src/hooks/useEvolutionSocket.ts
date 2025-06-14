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

  // Buscar dados da instância do banco - CORRIGIDO
  const fetchInstanceData = useCallback(async () => {
    if (!user?.id) return null;

    try {
      console.log('Buscando instância com ID:', user.id);
      
      // Buscar instância pelo ID correto (não user_id)
      const response = await supabase.get<any[]>(`/clients_instances?id=eq.${user.id}`);
      
      if (!response || response.length === 0) {
        console.error('Instância não encontrada para o ID:', user.id);
        toast.error('Dados da instância não encontrados');
        return null;
      }

      let instance = response[0];
      console.log('Instância encontrada:', instance);

      // Gerar instance_name se não existir
      if (!instance.instance_name && instance.company_name) {
        const instanceName = cleanInstanceName(instance.company_name);
        console.log('Gerando instance_name:', instanceName);
        
        try {
          await supabase.patch(`/clients_instances?id=eq.${instance.id}`, {
            instance_name: instanceName
          });
          instance.instance_name = instanceName;
          console.log('Instance_name atualizado com sucesso');
        } catch (error) {
          console.error('Erro ao atualizar instance_name:', error);
          // Usar o nome gerado localmente mesmo se falhar ao salvar
          instance.instance_name = instanceName;
        }
      }

      setInstanceData(instance);
      
      // Verificar status atual da instância na API
      if (instance.instance_name) {
        checkInstanceStatus(instance.instance_name);
      }
      
      return instance;
    } catch (error) {
      console.error('Erro ao buscar dados da instância:', error);
      toast.error('Erro ao carregar dados da instância');
      return null;
    }
  }, [user?.id, cleanInstanceName]);

  // Verificar status atual da instância
  const checkInstanceStatus = useCallback(async (instanceName: string) => {
    try {
      console.log('Verificando status da instância:', instanceName);
      const status = await evolutionApi.getInstanceStatus(instanceName);
      console.log('Status atual da instância:', status);
      
      if (status && status.instance) {
        const mappedStatus: InstanceStatus = {
          instance: status.instance.instanceName,
          status: status.instance.state === 'open' ? 'open' : 'disconnected',
          phone: status.instance.profilePictureUrl ? status.instance.profileName : undefined,
          instanceId: status.instance.instanceId
        };
        
        console.log('Status mapeado:', mappedStatus);
        setInstanceStatus(mappedStatus.status);
        
        if (mappedStatus.phone) {
          setConnectedPhone(mappedStatus.phone);
        }
        
        // Atualizar no banco
        updateInstanceStatus(mappedStatus);
      }
    } catch (error) {
      console.log('Erro ao verificar status da instância, continuando...', error);
    }
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
        is_connected: status.status === 'connected' || status.status === 'open'
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

  // Função para conectar ao WebSocket - CORRIGIDA para instância específica
  const connectSocket = useCallback(() => {
    if (!instanceData?.instance_name) return;

    if (socketRef.current?.connected) {
      socketRef.current.disconnect();
    }

    // URL específica da instância
    const socketUrl = `https://evo.haddx.com.br`;
    console.log('Conectando ao WebSocket:', `${socketUrl} para instância ${instanceData.instance_name}`);

    const socket = io(socketUrl, {
      transports: ['websocket'],
      query: {
        apikey: 'SUACHAVEAQUI',
        instance: instanceData.instance_name // Adicionar instância na query
      },
      reconnection: false
    });

    socket.on('connect', () => {
      console.log('WebSocket conectado para instância:', instanceData.instance_name);
      setIsConnected(true);
      reconnectAttempts.current = 0;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      // Verificar status atual após conectar
      checkInstanceStatus(instanceData.instance_name);
    });

    socket.on('disconnect', () => {
      console.log('WebSocket desconectado para instância:', instanceData.instance_name);
      setIsConnected(false);
      attemptReconnect();
    });

    // Escutar status da instância - FILTRADO por instância
    socket.on('connection.update', (data: any) => {
      console.log('Status da instância recebido:', data);
      
      // Verificar se o evento é da nossa instância
      if (data.instance !== instanceData.instance_name) {
        console.log('Evento ignorado - instância diferente:', data.instance, 'vs', instanceData.instance_name);
        return;
      }
      
      const eventData = data.data || data;
      
      const status: InstanceStatus = {
        instance: eventData.instance || data.instance,
        status: eventData.state === 'open' ? 'open' : 'disconnected',
        phone: eventData.phone,
        instanceId: eventData.instanceId
      };

      console.log('Atualizando status para instância:', status.instance, 'status:', status.status);
      setInstanceStatus(status.status);
      updateInstanceStatus(status);

      if (status.status === 'open') {
        setQrCode('');
        setIsGeneratingQR(false);
        setIsConnecting(false);
        
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

    // Escutar mensagens - FILTRADO por instância e CORRIGIDO processamento
    socket.on('messages.upsert', (data: any) => {
      console.log('Mensagem recebida:', data);
      
      // Verificar se a mensagem é da nossa instância
      if (data.instance !== instanceData.instance_name) {
        console.log('Mensagem ignorada - instância diferente:', data.instance, 'vs', instanceData.instance_name);
        return;
      }
      
      const eventData = data.data || data;
      console.log('Dados da mensagem:', eventData);
      
      // Processar mensagem recebida (não enviada pelo bot)
      if (eventData.key && !eventData.key.fromMe && eventData.message) {
        let messageText = '';
        
        // Extrair texto da mensagem baseado no tipo
        if (eventData.message.conversation) {
          messageText = eventData.message.conversation;
        } else if (eventData.message.extendedTextMessage?.text) {
          messageText = eventData.message.extendedTextMessage.text;
        } else {
          console.log('Tipo de mensagem não suportado:', eventData.message);
          return;
        }
        
        const messageData: WebSocketMessage = {
          body: messageText,
          sender_role: 'client',
          timestamp: new Date().toISOString(),
          instance_id: instanceData.instance_name,
          phone: eventData.key.remoteJid.replace('@s.whatsapp.net', ''),
          conversation_id: eventData.key.remoteJid
        };
        
        console.log('Salvando mensagem da instância:', instanceData.instance_name, messageData);
        saveMessage(messageData);
      }
    });

    // Escutar QR Code - FILTRADO por instância
    socket.on('qrcode.updated', (data: any) => {
      console.log('QR Code recebido:', data);
      
      // Verificar se o QR é da nossa instância
      if (data.instance !== instanceData.instance_name) {
        console.log('QR Code ignorado - instância diferente:', data.instance, 'vs', instanceData.instance_name);
        return;
      }
      
      const eventData = data.data || data;
      
      if (eventData.qrcode) {
        if (eventData.qrcode.base64) {
          setQrCode(eventData.qrcode.base64);
        }
        else if (typeof eventData.qrcode === 'string') {
          setQrCode(`data:image/png;base64,${eventData.qrcode}`);
        }
        else if (eventData.qrcode.code) {
          setQrCode(`data:image/png;base64,${eventData.qrcode.code}`);
        }
        
        setIsGeneratingQR(false);
        console.log('QR Code processado para instância:', instanceData.instance_name);
      }
    });

    socket.on('connect_error', (error: any) => {
      console.error('Erro de conexão WebSocket:', error);
      setIsConnected(false);
    });

    socketRef.current = socket;
  }, [instanceData, saveMessage, updateInstanceStatus, attemptReconnect, checkInstanceStatus]);

  // Função para refresh automático do QR
  const startQRRefresh = useCallback(() => {
    if (qrRefreshInterval.current) {
      clearInterval(qrRefreshInterval.current);
    }

    qrRefreshInterval.current = setInterval(() => {
      if (instanceStatus !== 'open' && !isGeneratingQR && instanceData?.instance_name) {
        console.log('Refreshing QR Code automaticamente...');
        generateQRCode();
      }
    }, 30000); // 30 segundos
  }, [instanceStatus, isGeneratingQR, instanceData]);

  // Função para gerar QR Code - SIMPLIFICADA
  const generateQRCode = useCallback(async () => {
    if (!instanceData?.instance_name) {
      toast.error('Dados da instância não encontrados');
      return;
    }

    try {
      setIsGeneratingQR(true);
      setQrCode('');
      setInstanceStatus('connecting');

      console.log('Reiniciando instância:', instanceData.instance_name);
      
      // Como a instância já existe, apenas reiniciar
      try {
        await evolutionApi.restartInstance(instanceData.instance_name);
        console.log('Instância reiniciada com sucesso');
      } catch (error) {
        console.log('Erro ao reiniciar instância, tentando criar nova:', error);
        // Se falhar ao reiniciar, tentar criar (pode ser que não exista)
        await evolutionApi.createInstance(instanceData.instance_name);
      }

      // Conectar WebSocket para receber QR
      if (!socketRef.current?.connected) {
        connectSocket();
      }

      // Tentar obter QR via API (opcional, pois virá via WebSocket)
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
    if (!instanceData?.instance_name || instanceStatus !== 'open') {
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
