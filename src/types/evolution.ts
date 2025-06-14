
export interface EvolutionSocketConfig {
  instanceName: string;
  apiKey: string;
  baseUrl: string;
}

export interface EvolutionMessage {
  instanceId: string;
  phone: string;
  body: string;
  timestamp?: string;
  messageId?: string;
  sender?: {
    name?: string;
    phone: string;
  };
}

export interface InstanceStatus {
  instance: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'open';
  phone?: string;
  instanceId?: string;
}

export interface QRCodeResponse {
  qr: string;
  instanceName: string;
}

export interface ConnectionResponse {
  instance: string;
  status: string;
  message: string;
}

export type MessageSenderRole = 'agent' | 'system' | 'client';

export interface WebSocketMessage {
  body: string;
  sender_role: MessageSenderRole;
  timestamp: string;
  instance_id: string;
  phone: string;
  conversation_id?: string;
}
