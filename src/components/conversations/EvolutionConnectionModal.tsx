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
  const [renderKey, setRenderKey] = useState(0); // Force re-render
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

      console.log('🔄 INICIANDO BUSCA DO QR CODE');

      const result = await getQRCode();
      console.log('📥 RESULTADO BRUTO DA API:', result);
      
      // Extrair QR Code de qualquer campo possível
      const qrString = result?.base64 || result?.code || result?.qrcode || result?.qr || result;
      
      console.log('🔍 QR STRING EXTRAÍDA:', {
        hasQrString: !!qrString,
        qrStringLength: qrString?.length,
        qrStringType: typeof qrString,
        qrStringStart: qrString?.substring(0, 100)
      });
      
      if (qrString && typeof qrString === 'string' && qrString.trim() !== '') {
        let finalQrCode = '';

        // Preparar data URI
        if (qrString.startsWith('data:image')) {
          finalQrCode = qrString;
          console.log('✅ QR Code já é data URI');
        } else {
          finalQrCode = `data:image/png;base64,${qrString}`;
          console.log('✅ QR Code convertido para data URI');
        }

        console.log('🚀 DEFININDO QR CODE NO ESTADO:', {
          finalLength: finalQrCode.length,
          finalPreview: finalQrCode.substring(0, 50)
        });

        // FORÇAR atualização do estado
        setQrCode(finalQrCode);
        setRenderKey(prev => prev + 1); // Force re-render
        addLog('success', `QR Code recebido (${finalQrCode.length} chars)`);
        setQrTimer(30);

        // Verificar estado após 100ms
        setTimeout(() => {
          console.log('🔍 VERIFICAÇÃO PÓS-SET:', {
            qrCodeLength: finalQrCode.length,
            renderKey
          });
        }, 100);

      } else {
        console.error('❌ QR Code inválido ou vazio:', {
          qrString,
          type: typeof qrString,
          result
        });
        addLog('error', 'QR Code não encontrado na resposta da API');
        
        // TESTE: Usar QR Code hardcoded para debug
        const testQR = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
        console.log('🧪 USANDO QR CODE DE TESTE');
        setQrCode(testQR);
        setRenderKey(prev => prev + 1);
        addLog('warning', 'Usando QR Code de teste');
      }
    } catch (error) {
      console.error('❌ ERRO NA BUSCA DO QR CODE:', error);
      addLog('error', `Erro ao buscar QR Code: ${error}`);
    } finally {
      setIsLoadingQR(false);
    }
  };

  // Log sempre que qrCode mudar
  useEffect(() => {
    console.log('🔄 ESTADO QR CODE MUDOU:', {
      hasQrCode: !!qrCode,
      qrCodeLength: qrCode?.length,
      qrCodePreview: qrCode?.substring(0, 50),
      renderKey,
      isWaitingQR,
      connectionStatus
    });
  }, [qrCode, renderKey, isWaitingQR, connectionStatus]);

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
          {/* QR Code Section - SEMPRE mostrar quando waiting_qr */}
          {isWaitingQR && (
            <QRCodeDisplay 
              key={renderKey} // Force re-render
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

          {/* Debug info - SEMPRE mostrar em dev */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-400 mt-2 space-y-1">
              <div>QR Code length: {qrCode?.length || 0}</div>
              <div>Has QR: {!!qrCode ? 'Yes' : 'No'}</div>
              <div>Render Key: {renderKey}</div>
              <div>Is Waiting QR: {isWaitingQR ? 'Yes' : 'No'}</div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
