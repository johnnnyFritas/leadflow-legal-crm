
import React, { createContext, useContext, ReactNode } from 'react';
import { useEvolutionSocket, EvolutionSocketOptions } from '@/hooks/useEvolutionSocket';

interface EvolutionContextType {
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  lastError: string | null;
  isConnected: boolean;
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
    connect, 
    disconnect, 
    sendMessage, 
    getQRCode,
    isConnected 
  } = useEvolutionSocket(options);

  return (
    <EvolutionContext.Provider value={{
      connectionStatus,
      lastError,
      isConnected,
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
