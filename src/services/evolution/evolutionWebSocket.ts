
import { io, Socket } from 'socket.io-client';
import { EvolutionEvent, EvolutionSocketOptions } from '@/types/evolution';
import { WS_EVENTS, EVOLUTION_CONFIG } from '@/constants/evolution';

export class EvolutionWebSocket {
  private socket: Socket | null = null;
  private options: EvolutionSocketOptions;
  private reconnectAttempts = 0;
  private instanceName: string = '';

  constructor(options: EvolutionSocketOptions = {}) {
    this.options = options;
  }

  connect(instanceName: string): void {
    this.instanceName = instanceName;
    
    try {
      console.log('🌐 Iniciando conexão WebSocket para:', instanceName);
      
      if (this.socket) {
        console.log('🔄 Fechando socket anterior...');
        this.socket.disconnect();
      }

      // Construir URL do WebSocket
      const socketUrl = EVOLUTION_CONFIG.BASE_URL;
      console.log('🔗 URL WebSocket:', socketUrl);

      const socketConfig = {
        path: EVOLUTION_CONFIG.WS_PATH,
        query: { 
          instanceName
          // Remover apikey da query por enquanto para testar
        },
        transports: ['websocket', 'polling'], // Adicionar polling como fallback
        reconnection: true,
        reconnectionAttempts: EVOLUTION_CONFIG.RECONNECTION_ATTEMPTS,
        reconnectionDelay: EVOLUTION_CONFIG.RECONNECTION_DELAY,
        reconnectionDelayMax: EVOLUTION_CONFIG.RECONNECTION_DELAY_MAX,
        timeout: 20000, // Aumentar timeout
        forceNew: true,
        autoConnect: true
      };

      console.log('⚙️ Configuração do socket:', socketConfig);

      this.socket = io(socketUrl, socketConfig);

      // Eventos de conexão do Socket.IO
      this.socket.on(WS_EVENTS.CONNECT, () => {
        console.log('✅ WebSocket conectado com sucesso!');
        this.reconnectAttempts = 0;
        this.options.onStatusChange?.('connected');
      });

      this.socket.on(WS_EVENTS.DISCONNECT, (reason) => {
        console.log('🔌 WebSocket desconectado:', reason);
        this.options.onStatusChange?.('disconnected');
      });

      this.socket.on(WS_EVENTS.CONNECT_ERROR, (error) => {
        console.error('❌ Erro de conexão WebSocket:', error);
        console.error('❌ Detalhes do erro:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        this.options.onError?.(error);
      });

      this.socket.on(WS_EVENTS.RECONNECT, (attemptNumber) => {
        console.log('🔄 WebSocket reconectado após', attemptNumber, 'tentativas');
        this.reconnectAttempts = 0;
      });

      this.socket.on(WS_EVENTS.RECONNECT_ATTEMPT, (attemptNumber) => {
        console.log('🔄 Tentativa de reconexão WebSocket:', attemptNumber);
        this.reconnectAttempts = attemptNumber;
      });

      this.socket.on(WS_EVENTS.RECONNECT_ERROR, (error) => {
        console.error('❌ Erro na reconexão WebSocket:', error);
      });

      // Eventos específicos da Evolution API
      this.socket.on(WS_EVENTS.MESSAGES_UPSERT, (data: EvolutionEvent) => {
        console.log('📨 Mensagem recebida via WebSocket:', data);
        this.options.onMessage?.(data);
      });

      this.socket.on(WS_EVENTS.CONNECTION_UPDATE, (data: any) => {
        console.log('🔄 Status de conexão WhatsApp atualizado:', data);
        if (data.connection === 'close') {
          console.log('📱 WhatsApp desconectado, mudando para waiting_qr');
          this.options.onStatusChange?.('waiting_qr');
        } else if (data.connection === 'open') {
          console.log('📱 WhatsApp conectado!');
          this.options.onStatusChange?.('connected');
        }
      });

      // Evento genérico para capturar todos os eventos
      this.socket.onAny((eventName, ...args) => {
        console.log('🎯 Evento WebSocket recebido:', eventName, args);
      });

      // Tentar conectar explicitamente
      this.socket.connect();
      console.log('🔌 Tentando conectar socket explicitamente...');

    } catch (error) {
      console.error('❌ Erro ao conectar WebSocket:', error);
      this.options.onError?.(error);
    }
  }

  disconnect(): void {
    console.log('🔌 Desconectando WebSocket...');
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.reconnectAttempts = 0;
    console.log('✅ WebSocket desconectado');
  }

  sendMessage(payload: any): boolean {
    if (this.socket?.connected) {
      console.log('📤 Enviando mensagem via WebSocket:', payload);
      this.socket.emit(WS_EVENTS.SEND_MESSAGE, payload);
      return true;
    }
    console.warn('⚠️ WebSocket não conectado, não é possível enviar mensagem');
    return false;
  }

  get isConnected(): boolean {
    const connected = this.socket?.connected || false;
    console.log('🔍 Status WebSocket:', connected ? 'conectado' : 'desconectado');
    return connected;
  }

  get connectionAttempts(): number {
    return this.reconnectAttempts;
  }
}
