
import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useEvolution } from '@/contexts/EvolutionContext';
import { toast } from '@/components/ui/sonner';
import { QRCodeDisplay } from './QRCodeDisplay';
import { ConnectionStatusBadge } from './ConnectionStatusBadge';
import { ConnectionLogs } from './ConnectionLogs';
import { ConnectionActions } from './ConnectionActions';
import { ConnectedStatus } from './ConnectedStatus';
import { DebugInfo } from './DebugInfo';
import { useConnectionLogs } from '@/hooks/useConnectionLogs';
import { useQRCodeManager } from '@/hooks/useQRCodeManager';

interface EvolutionConnectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EvolutionConnectionModal: React.FC<EvolutionConnectionModalProps> = ({
  open,
  onOpenChange
}) => {
  const { 
    connectionStatus, 
    isConnected, 
    isWaitingQR,
    instanceStatus,
    connect, 
    disconnect, 
    getQRCode 
  } = useEvolution();
  
  const { logs, addLog } = useConnectionLogs();
  
  const {
    qrCode,
    isLoadingQR,
    qrTimer,
    renderKey,
    fetchQRCode,
    startQRCodeRefresh,
    stopQRCodeRefresh,
    clearQRCode
  } = useQRCodeManager(getQRCode, isConnected, isWaitingQR, addLog);

  const handleConnect = async () => {
    addLog('info', 'Iniciando processo de conexão...');
    await connect();
  };

  const handleDisconnect = () => {
    addLog('info', 'Desconectando...');
    stopQRCodeRefresh();
    clearQRCode();
    disconnect();
    addLog('success', 'Desconectado');
  };

  // Effects for status changes
  useEffect(() => {
    console.log('🔄 MODAL: Status mudou para:', connectionStatus);
    
    if (connectionStatus === 'waiting_qr') {
      addLog('info', 'Aguardando scan do QR Code...');
      setTimeout(() => {
        fetchQRCode();
        startQRCodeRefresh();
      }, 2000);
    } else if (connectionStatus === 'connected') {
      stopQRCodeRefresh();
      clearQRCode();
      addLog('success', 'WhatsApp conectado com sucesso!');
      if (instanceStatus?.phone) {
        addLog('info', `Número conectado: ${instanceStatus.phone}`);
      }
      toast.success('WhatsApp conectado!');
    } else if (connectionStatus === 'connecting') {
      addLog('info', 'Configurando instância...');
    } else if (connectionStatus === 'disconnected') {
      stopQRCodeRefresh();
      clearQRCode();
    }
  }, [connectionStatus, instanceStatus, addLog, fetchQRCode, startQRCodeRefresh, stopQRCodeRefresh, clearQRCode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopQRCodeRefresh();
    };
  }, [stopQRCodeRefresh]);

  // Log qrCode changes
  useEffect(() => {
    console.log('🔄 MODAL: QR Code mudou:', {
      hasQrCode: !!qrCode,
      length: qrCode?.length,
      renderKey,
      connectionStatus
    });
  }, [qrCode, renderKey, connectionStatus]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Conexão WhatsApp
            <ConnectionStatusBadge connectionStatus={connectionStatus} />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* QR Code Section */}
          {isWaitingQR && (
            <QRCodeDisplay 
              key={renderKey}
              qrCode={qrCode}
              isLoadingQR={isLoadingQR}
              qrTimer={qrTimer}
              onRefresh={fetchQRCode}
            />
          )}

          {/* Connection Status for Connected State */}
          {isConnected && (
            <ConnectedStatus instanceStatus={instanceStatus} />
          )}

          {/* Action Buttons */}
          <ConnectionActions 
            connectionStatus={connectionStatus}
            isConnected={isConnected}
            isWaitingQR={isWaitingQR}
            isLoadingQR={isLoadingQR}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onRefreshQR={fetchQRCode}
          />

          <Separator />

          {/* Logs Section */}
          <ConnectionLogs logs={logs} />

          {/* Debug info */}
          <DebugInfo 
            qrCode={qrCode}
            renderKey={renderKey}
            isWaitingQR={isWaitingQR}
            connectionStatus={connectionStatus}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
