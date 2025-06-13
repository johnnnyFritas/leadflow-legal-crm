
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';

interface ConnectionActionsProps {
  connectionStatus: 'disconnected' | 'connecting' | 'waiting_qr' | 'connected';
  isConnected: boolean;
  isWaitingQR: boolean;
  isLoadingQR: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onRefreshQR: () => void;
}

export const ConnectionActions: React.FC<ConnectionActionsProps> = ({
  connectionStatus,
  isConnected,
  isWaitingQR,
  isLoadingQR,
  onConnect,
  onDisconnect,
  onRefreshQR
}) => {
  return (
    <div className="flex gap-2">
      {connectionStatus === 'disconnected' ? (
        <Button onClick={onConnect} className="flex-1">
          Conectar
        </Button>
      ) : connectionStatus === 'connecting' ? (
        <Button disabled className="flex-1">
          <Loader2 className="mr-2 animate-spin" size={16} />
          Conectando...
        </Button>
      ) : isConnected ? (
        <Button 
          onClick={onDisconnect} 
          variant="destructive"
          className="flex-1"
        >
          Desconectar
        </Button>
      ) : (
        <Button 
          onClick={onDisconnect} 
          variant="outline"
          className="flex-1"
        >
          Cancelar
        </Button>
      )}
      
      {isWaitingQR && (
        <Button 
          onClick={onRefreshQR} 
          variant="outline"
          disabled={isLoadingQR}
        >
          <RefreshCw size={16} className={isLoadingQR ? 'animate-spin' : ''} />
        </Button>
      )}
    </div>
  );
};
