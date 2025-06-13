
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

export type ConnectionStatus = 'disconnected' | 'connecting' | 'waiting_qr' | 'connected';
