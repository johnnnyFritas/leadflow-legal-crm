import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, AlertCircle, Loader2, RefreshCw, Wifi, WifiOff, QrCode } from 'lucide-react';
import { useEvolution } from '@/contexts/EvolutionContext';
import { toast } from '@/components/ui/sonner';
import { EVOLUTION_CONFIG } from '@/constants/evolution';

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

    // Não buscar QR Code se já estiver conectado
    if (isConnected) {
      addLog('info', 'WhatsApp já está conectado');
      return;
    }

    try {
      setIsLoadingQR(true);
      addLog('info', 'Buscando QR Code...');

      const result = await getQRCode();
      console.log('Resultado do QR Code:', result);
      
      // Extrair o QR code com múltiplos fallbacks
      const qrString = result?.base64 || result?.code || result?.qrcode;
      
      if (qrString && qrString.trim() !== '') {
        // Verificar se já é uma data URI completa ou se precisa do prefixo
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

    // Só iniciar refresh se estiver aguardando QR
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

  const getLogIcon = (type: ConnectionLog['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={12} className="text-green-600" />;
      case 'error':
        return <AlertCircle size={12} className="text-red-600" />;
      case 'warning':
        return <AlertCircle size={12} className="text-yellow-600" />;
      default:
        return <div className="w-3 h-3 rounded-full bg-blue-600" />;
    }
  };

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <Wifi size={12} className="mr-1" />
            Conectado ao WhatsApp
          </Badge>
        );
      case 'connecting':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Loader2 size={12} className="mr-1 animate-spin" />
            Conectando
          </Badge>
        );
      case 'waiting_qr':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <QrCode size={12} className="mr-1" />
            Aguardando QR Code
          </Badge>
        );
      default:
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <WifiOff size={12} className="mr-1" />
            Desconectado
          </Badge>
        );
    }
  };

  // Effects for status changes
  useEffect(() => {
    if (connectionStatus === 'waiting_qr') {
      addLog('info', 'Aguardando scan do QR Code...');
      // Aguardar um pouco antes de buscar o QR Code para dar tempo da instância ser criada
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
            {getStatusBadge()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* QR Code Section - only show when waiting for QR */}
          {isWaitingQR && (
            <div className="text-center space-y-3">
              {qrCode ? (
                <div className="space-y-2">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-white">
                    <img 
                      src={qrCode} 
                      alt="QR Code" 
                      className="mx-auto w-48 h-48 object-contain"
                      onError={(e) => {
                        console.error('Erro ao carregar QR Code:', e);
                        addLog('error', 'Erro ao exibir QR Code');
                      }}
                    />
                  </div>
                  <p className="text-sm text-gray-600">
                    Atualizando em {qrTimer}s
                  </p>
                  <p className="text-xs text-gray-500">
                    Escaneie o QR Code com seu WhatsApp
                  </p>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50">
                  {isLoadingQR ? (
                    <div className="flex flex-col items-center space-y-2">
                      <Loader2 className="animate-spin" size={32} />
                      <p className="text-sm text-gray-600">Gerando QR Code...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-2">
                      <QrCode size={32} className="text-gray-400" />
                      <p className="text-sm text-gray-600">Aguardando QR Code</p>
                      <Button 
                        onClick={fetchQRCode} 
                        variant="outline" 
                        size="sm"
                        className="mt-2"
                      >
                        <RefreshCw size={16} className="mr-2" />
                        Tentar Novamente
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Connection Status for Connected State */}
          {isConnected && (
            <div className="text-center p-8 bg-green-50 rounded-lg">
              <CheckCircle size={48} className="mx-auto text-green-600 mb-2" />
              <p className="font-medium text-green-800">WhatsApp Conectado!</p>
              {instanceStatus?.phone && (
                <p className="text-sm text-green-600">
                  Número: {instanceStatus.phone}
                </p>
              )}
              <p className="text-xs text-green-600 mt-1">Você pode fechar esta janela</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {connectionStatus === 'disconnected' ? (
              <Button 
                onClick={handleConnect} 
                className="flex-1"
              >
                Conectar
              </Button>
            ) : connectionStatus === 'connecting' ? (
              <Button disabled className="flex-1">
                <Loader2 className="mr-2 animate-spin" size={16} />
                Conectando...
              </Button>
            ) : isConnected ? (
              <Button 
                onClick={handleDisconnect} 
                variant="destructive"
                className="flex-1"
              >
                Desconectar
              </Button>
            ) : (
              <Button 
                onClick={handleDisconnect} 
                variant="outline"
                className="flex-1"
              >
                Cancelar
              </Button>
            )}
            
            {isWaitingQR && (
              <Button 
                onClick={fetchQRCode} 
                variant="outline"
                disabled={isLoadingQR}
              >
                <RefreshCw size={16} className={isLoadingQR ? 'animate-spin' : ''} />
              </Button>
            )}
          </div>

          <Separator />

          {/* Logs Section */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Logs de Conexão</h4>
            <ScrollArea className="h-32 border rounded-md p-2 bg-gray-50">
              {logs.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">
                  Nenhum log ainda
                </p>
              ) : (
                <div className="space-y-1">
                  {logs.map((log, index) => (
                    <div key={index} className="flex items-start gap-2 text-xs">
                      {getLogIcon(log.type)}
                      <span className="text-gray-500">{log.timestamp}</span>
                      <span className="flex-1">{log.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
