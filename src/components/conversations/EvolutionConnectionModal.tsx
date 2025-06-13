
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

  // Validação mais permissiva para base64
  const isValidBase64Image = (str: string): boolean => {
    if (!str) return false;
    
    // Se já é uma data URI, apenas verificar se tem conteúdo após base64,
    if (str.startsWith('data:image')) {
      return str.includes('base64,') && str.split('base64,')[1]?.length > 50;
    }
    
    // Para base64 puro, verificação mais permissiva
    try {
      const cleanStr = str.replace(/\s/g, '');
      // Apenas verificar se tem caracteres base64 válidos e tamanho mínimo
      return /^[A-Za-z0-9+/=]*$/.test(cleanStr) && cleanStr.length > 50;
    } catch {
      return false;
    }
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
      console.log('🔍 Resultado completo do QR Code:', result);
      
      // Tentar múltiplos campos possíveis
      const qrString = result?.base64 || result?.code || result?.qrcode || result?.qr;
      
      console.log('🔍 QR String extraída:', {
        hasQrString: !!qrString,
        qrStringLength: qrString?.length,
        qrStringStart: qrString?.substring(0, 50),
        qrStringType: typeof qrString
      });
      
      if (qrString && qrString.trim() !== '') {
        let qrCodeDataUri = '';
        let shouldRender = false;

        // Tentar criar data URI independente da validação
        if (qrString.startsWith('data:image')) {
          qrCodeDataUri = qrString;
          shouldRender = true;
          console.log('✅ QR Code já é data URI');
        } else {
          qrCodeDataUri = `data:image/png;base64,${qrString}`;
          shouldRender = true;
          console.log('✅ QR Code convertido para data URI');
        }

        // Log da validação mas não bloquear renderização
        const isValid = isValidBase64Image(qrString);
        console.log('🔍 Validação base64:', {
          isValid,
          qrCodeLength: qrCodeDataUri.length,
          startsWithData: qrCodeDataUri.startsWith('data:image'),
          hasBase64: qrCodeDataUri.includes('base64,')
        });

        if (!isValid) {
          console.warn('⚠️ QR Code pode não ser válido, mas tentando renderizar mesmo assim');
          addLog('warning', 'QR Code pode não ser válido, tentando renderizar');
        }

        // SEMPRE tentar definir o QR Code se temos uma string
        if (shouldRender) {
          console.log('🚀 Definindo QR Code no estado:', {
            length: qrCodeDataUri.length,
            preview: qrCodeDataUri.substring(0, 100)
          });
          
          setQrCode(qrCodeDataUri);
          addLog('success', 'QR Code atualizado com sucesso');
          setQrTimer(30);
          
          // Log do estado após definir
          setTimeout(() => {
            console.log('🔍 Estado do QR Code após setQrCode:', {
              qrCodeSet: !!qrCodeDataUri,
              stateLength: qrCodeDataUri.length
            });
          }, 100);
        }
      } else {
        console.error('❌ QR Code vazio ou não encontrado na resposta:', result);
        addLog('error', 'QR Code não disponível na resposta da API');
      }
    } catch (error) {
      console.error('❌ Erro ao buscar QR Code:', error);
      addLog('error', `Erro ao buscar QR Code: ${error}`);
    } finally {
      setIsLoadingQR(false);
    }
  };

  // Log do estado do qrCode sempre que mudar
  useEffect(() => {
    console.log('🔍 Estado qrCode mudou:', {
      hasQrCode: !!qrCode,
      qrCodeLength: qrCode?.length,
      qrCodePreview: qrCode?.substring(0, 50),
      isWaitingQR,
      connectionStatus
    });
  }, [qrCode, isWaitingQR, connectionStatus]);

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
          {/* QR Code Section - sempre mostrar quando waiting_qr, independente se tem qrCode */}
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
