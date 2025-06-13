
import { io, Socket } from 'socket.io-client';
import { EvolutionEvent, EvolutionSocketOptions } from '@/types/evolution';
import { WS_EVENTS, EVOLUTION_CONFIG } from '@/constants/evolution';

export class EvolutionWebSocket {
  private socket: Socket | null = null;
  private options: EvolutionSocketOptions;
  private reconnectAttempts = 0;

  constructor(options: EvolutionSocketOptions = {}) {
    this.options = options;
  }

  connect(instanceName: string): void {
    try {
      console.log('Conectando WebSocket para:', instanceName);
      
      if (this.socket) {
        this.socket.disconnect();
      }

      // Usar HTTPS para handshake correto
      this.socket = io(EVOLUTION_CONFIG.BASE_URL, {
        path: EVOLUTION_CONFIG.WS_PATH,
        query: { 
          instanceName,
          // Incluir apikey se disponível
          ...(process.env.VITE_EVO_API_KEY && { apikey: process.env.VITE_EVO_API_KEY })
        },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: EVOLUTION_CONFIG.RECONNECTION_ATTEMPTS,
        reconnectionDelay: EVOLUTION_CONFIG.RECONNECTION_DELAY,
        reconnectionDelayMax: EVOLUTION_CONFIG.RECONNECTION_DELAY_MAX
      });

      // Eventos de conexão
      this.socket.on(WS_EVENTS.CONNECT, () => {
        console.log('WebSocket conectado');
        this.reconnectAttempts = 0;
        this.options.onStatusChange?.('connected');
      });

      this.socket.on(WS_EVENTS.DISCONNECT, (reason) => {
        console.log('WebSocket desconectado:', reason);
        this.options.onStatusChange?.('disconnected');
      });

      this.socket.on(WS_EVENTS.CONNECT_ERROR, (error) => {
        console.error('Erro de conexão WebSocket:', error);
        this.options.onError?.(error);
      });

      this.socket.on(WS_EVENTS.RECONNECT, (attemptNumber) => {
        console.log('WebSocket reconectado após', attemptNumber, 'tentativas');
      });

      this.socket.on(WS_EVENTS.RECONNECT_ATTEMPT, (attemptNumber) => {
        console.log('Tentativa de reconexão WebSocket:', attemptNumber);
        this.reconnectAttempts = attemptNumber;
      });

      // Eventos Evolution API - usar nomes corretos
      this.socket.on(WS_EVENTS.MESSAGES_UPSERT, (data: EvolutionEvent) => {
        console.log('Mensagem recebida via WebSocket:', data);
        this.options.onMessage?.(data);
      });

      this.socket.on(WS_EVENTS.CONNECTION_UPDATE, (data: any) => {
        console.log('Status de conexão atualizado:', data);
        if (data.connection === 'close') {
          this.options.onStatusChange?.('waiting_qr');
        } else if (data.connection === 'open') {
          this.options.onStatusChange?.('connected');
        }
      });

    } catch (error) {
      console.error('Erro ao conectar WebSocket:', error);
      this.options.onError?.(error);
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.reconnectAttempts = 0;
  }

  sendMessage(payload: any): boolean {
    if (this.socket?.connected) {
      // Usar nome correto do evento
      this.socket.emit(WS_EVENTS.SEND_MESSAGE, payload);
      return true;
    }
    console.warn('WebSocket não conectado, não é possível enviar mensagem');
    return false;
  }

  get isConnected(): boolean {
    return this.socket?.connected || false;
  }

  get connectionAttempts(): number {
    return this.reconnectAttempts;
  }
}
