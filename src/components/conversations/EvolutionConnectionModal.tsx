
import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useEvolution } from '@/contexts/EvolutionContext';
import { toast } from '@/components/ui/sonner';
import { EVOLUTION_CONFIG } from '@/constants/evolution';
import { QRCodeDisplay } from './QRCodeDisplay';
import { ConnectionStatusBadge } from './ConnectionStatusBadge';
import { ConnectionLogs } from './ConnectionLogs';
import { ConnectionActions } from './ConnectionActions';
import { ConnectedStatus } from './ConnectedStatus';

interface ConnectionLog {
  timestamp: string;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

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
  
  const [qrCode, setQrCode] = useState<string>('');
  const [isLoadingQR, setIsLoadingQR] = useState(false);
  const [logs, setLogs] = useState<ConnectionLog[]>([]);
  const [qrTimer, setQrTimer] = useState(30);
  const qrIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addLog = (type: ConnectionLog['type'], message: string) => {
    const newLog: ConnectionLog = {
      timestamp: new Date().toLocaleTimeString(),
      type,
      message
    };
    setLogs(prev => [...prev, newLog]);
  };

  const fetchQRCode = async () => {
    if (!getQRCode) {
      addLog('error', 'Função getQRCode não disponível');
      return;
    }

    if (isConnected) {
      addLog('info', 'WhatsApp já está conectado');
      return;
    }

    try {
      setIsLoadingQR(true);
      addLog('info', 'Buscando QR Code...');

      const result = await getQRCode();
      console.log('Resultado do QR Code:', result);
      
      const qrString = result?.base64 || result?.code || result?.qrcode;
      
      if (qrString && qrString.trim() !== '') {
        const qrCodeDataUri = qrString.startsWith('data:image') 
          ? qrString 
          : `data:image/png;base64,${qrString}`;
        
        setQrCode(qrCodeDataUri);
        addLog('success', 'QR Code atualizado com sucesso');
        setQrTimer(30);
        console.log('QR Code definido com sucesso');
      } else {
        console.error('QR Code vazio ou não encontrado na resposta:', result);
        addLog('error', 'QR Code não disponível na resposta da API');
      }
    } catch (error) {
      console.error('Erro ao buscar QR Code:', error);
      addLog('error', `Erro ao buscar QR Code: ${error}`);
    } finally {
      setIsLoadingQR(false);
    }
  };

  const startQRCodeRefresh = () => {
    if (qrIntervalRef.current) clearInterval(qrIntervalRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    if (!isWaitingQR) return;

    qrIntervalRef.current = setInterval(() => {
      if (isWaitingQR && !isConnected) {
        fetchQRCode();
      }
    }, EVOLUTION_CONFIG.QR_REFRESH_INTERVAL);

    timerRef.current = setInterval(() => {
      setQrTimer(prev => {
        if (prev <= 1) {
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopQRCodeRefresh = () => {
    if (qrIntervalRef.current) {
      clearInterval(qrIntervalRef.current);
      qrIntervalRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleConnect = async () => {
    addLog('info', 'Iniciando processo de conexão...');
    await connect();
  };

  const handleDisconnect = () => {
    addLog('info', 'Desconectando...');
    stopQRCodeRefresh();
    setQrCode('');
    disconnect();
    addLog('success', 'Desconectado');
  };

  // Effects for status changes
  useEffect(() => {
    if (connectionStatus === 'waiting_qr') {
      addLog('info', 'Aguardando scan do QR Code...');
      setTimeout(() => {
        fetchQRCode();
        startQRCodeRefresh();
      }, 2000);
    } else if (connectionStatus === 'connected') {
      stopQRCodeRefresh();
      setQrCode('');
      addLog('success', 'WhatsApp conectado com sucesso!');
      if (instanceStatus?.phone) {
        addLog('info', `Número conectado: ${instanceStatus.phone}`);
      }
      toast.success('WhatsApp conectado!');
    } else if (connectionStatus === 'connecting') {
      addLog('info', 'Configurando instância...');
    } else if (connectionStatus === 'disconnected') {
      stopQRCodeRefresh();
      setQrCode('');
    }
  }, [connectionStatus, instanceStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopQRCodeRefresh();
    };
  }, []);

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
          {/* QR Code Section - only show when waiting for QR */}
          {isWaitingQR && (
            <QRCodeDisplay 
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
        </div>
      </DialogContent>
    </Dialog>
  );
};
