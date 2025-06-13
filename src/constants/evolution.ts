export const WS_EVENTS = {
  MESSAGES_UPSERT: 'MESSAGES_UPSERT',
  SEND_MESSAGE: 'SEND_MESSAGE', 
  CONNECTION_UPDATE: 'CONNECTION_UPDATE',
  // Eventos do Socket.IO
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  RECONNECT: 'reconnect',
  RECONNECT_ATTEMPT: 'reconnect_attempt',
  RECONNECT_ERROR: 'reconnect_error'
} as const;

export const EVOLUTION_CONFIG = {
  // Usar HTTPS para handshake correto do Socket.IO
  BASE_URL: 'https://evo.haddx.com.br',
  WS_PATH: '/socket.io',
  RECONNECTION_ATTEMPTS: 5,
  RECONNECTION_DELAY: 2000, // 2 segundos
  RECONNECTION_DELAY_MAX: 16000, // máximo 16 segundos
  STATUS_CHECK_INTERVAL: 3000,
  QR_REFRESH_INTERVAL: 30000
} as const;
