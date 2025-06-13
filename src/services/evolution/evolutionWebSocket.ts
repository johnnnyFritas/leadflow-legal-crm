
import { io, Socket } from 'socket.io-client';
import { EvolutionEvent, EvolutionSocketOptions } from '@/types/evolution';

export class EvolutionWebSocket {
  private socket: Socket | null = null;
  private options: EvolutionSocketOptions;

  constructor(options: EvolutionSocketOptions = {}) {
    this.options = options;
  }

  connect(instanceName: string): void {
    try {
      console.log('Conectando WebSocket para:', instanceName);
      
      if (this.socket) {
        this.socket.disconnect();
      }

      this.socket = io(`wss://evo.haddx.com.br`, {
        query: { instanceName },
        transports: ['websocket']
      });

      this.socket.on('connect', () => {
        console.log('WebSocket conectado');
      });

      this.socket.on('disconnect', () => {
        console.log('WebSocket desconectado');
      });

      this.socket.on('message', (data: EvolutionEvent) => {
        console.log('Mensagem recebida via WebSocket:', data);
        this.options.onMessage?.(data);
      });

      this.socket.on('connection.update', (data: any) => {
        console.log('Status de conexão atualizado:', data);
        if (data.connection === 'close') {
          this.options.onStatusChange?.('waiting_qr');
        }
      });

    } catch (error) {
      console.error('Erro ao conectar WebSocket:', error);
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  sendMessage(payload: any): boolean {
    if (this.socket?.connected) {
      this.socket.emit('message', payload);
      return true;
    }
    return false;
  }

  get isConnected(): boolean {
    return this.socket?.connected || false;
  }
}
