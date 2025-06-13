
import React, { createContext, useContext, ReactNode } from 'react';
import { useEvolutionSocket, EvolutionSocketOptions, InstanceStatus } from '@/hooks/useEvolutionSocket';

interface EvolutionContextType {
  connectionStatus: 'disconnected' | 'connecting' | 'waiting_qr' | 'connected';
  lastError: string | null;
  instanceStatus: InstanceStatus | null;
  isConnected: boolean;
  isWaitingQR: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendMessage: (payload: any) => boolean;
  getQRCode?: () => Promise<any>;
}

const EvolutionContext = createContext<EvolutionContextType | undefined>(undefined);

interface EvolutionProviderProps {
  children: ReactNode;
  options?: EvolutionSocketOptions;
}

export const EvolutionProvider: React.FC<EvolutionProviderProps> = ({ 
  children, 
  options = {} 
}) => {
  const { 
    connectionStatus, 
    lastError,
    instanceStatus,
    connect, 
    disconnect, 
    sendMessage, 
    getQRCode,
    isConnected,
    isWaitingQR
  } = useEvolutionSocket(options);

  return (
    <EvolutionContext.Provider value={{
      connectionStatus,
      lastError,
      instanceStatus,
      isConnected,
      isWaitingQR,
      connect,
      disconnect,
      sendMessage,
      getQRCode
    }}>
      {children}
    </EvolutionContext.Provider>
  );
};

export const useEvolution = () => {
  const context = useContext(EvolutionContext);
  if (context === undefined) {
    throw new Error('useEvolution must be used within an EvolutionProvider');
  }
  return context;
};
