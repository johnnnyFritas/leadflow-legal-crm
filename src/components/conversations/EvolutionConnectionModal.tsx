
import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, AlertCircle, Loader2, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useEvolution } from '@/contexts/EvolutionContext';
import { authService } from '@/services/authService';
import { toast } from '@/components/ui/sonner';

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
  const { connectionStatus, isConnected, connect, disconnect } = useEvolution();
  const [qrCode, setQrCode] = useState<string>('');
  const [isLoadingQR, setIsLoadingQR] = useState(false);
  const [logs, setLogs] = useState<ConnectionLog[]>([]);
  const [qrTimer, setQrTimer] = useState(30);
  const qrIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const addLog = (type: ConnectionLog['type'], message: string) => {
    const newLog: ConnectionLog = {
      timestamp: new Date().toLocaleTimeString(),
      type,
      message
    };
    setLogs(prev => [...prev, newLog]);
  };

  const createInstance = async () => {
    const user = authService.getCurrentUser();
    if (!user?.instance_name) {
      addLog('error', 'Nome da instância não encontrado');
      return null;
    }

    try {
      addLog('info', `Criando instância: ${user.instance_name}`);
      
      const response = await fetch('https://evolution.haddx.com.br/instance/create', {
        method: 'POST',
        headers: {
          'apikey': 'SUACHAVEAQUI',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          instanceName: user.instance_name,
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS',
          WEBHOOK_GLOBAL_ENABLED: 'true'
        })
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      addLog('success', 'Instância criada com sucesso');
      return result;
    } catch (error) {
      addLog('error', `Erro ao criar instância: ${error}`);
      return null;
    }
  };

  const fetchQRCode = async () => {
    const user = authService.getCurrentUser();
    if (!user?.instance_name) return;

    try {
      setIsLoadingQR(true);
      addLog('info', 'Buscando QR Code...');

      const response = await fetch(`https://evolution.haddx.com.br/instance/connect/${user.instance_name}`, {
        method: 'GET',
        headers: {
          'apikey': 'SUACHAVEAQUI'
        }
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.base64) {
        const qrCodeDataUri = result.base64.startsWith('data:image') 
          ? result.base64 
          : `data:image/png;base64,${result.base64}`;
        
        setQrCode(qrCodeDataUri);
        addLog('success', 'QR Code atualizado');
        setQrTimer(30); // Reset timer
      } else {
        addLog('warning', 'QR Code não disponível na resposta');
      }
    } catch (error) {
      addLog('error', `Erro ao buscar QR Code: ${error}`);
    } finally {
      setIsLoadingQR(false);
    }
  };

  const startQRCodeRefresh = () => {
    // Clear existing intervals
    if (qrIntervalRef.current) clearInterval(qrIntervalRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    // Start QR code refresh every 30 seconds
    qrIntervalRef.current = setInterval(() => {
      if (!isConnected) {
        fetchQRCode();
      }
    }, 30000);

    // Start countdown timer
    timerRef.current = setInterval(() => {
      setQrTimer(prev => {
        if (prev <= 1) {
          return 30; // Reset to 30
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
    
    // First, create instance
    const instanceCreated = await createInstance();
    if (!instanceCreated) return;

    // Wait a bit for instance to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Fetch initial QR code
    await fetchQRCode();

    // Start QR code refresh cycle
    startQRCodeRefresh();

    // Connect WebSocket
    addLog('info', 'Conectando WebSocket...');
    connect();
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
            Conectado
          </Badge>
        );
      case 'connecting':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Loader2 size={12} className="mr-1 animate-spin" />
            Conectando
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopQRCodeRefresh();
    };
  }, []);

  // Stop QR refresh when connected
  useEffect(() => {
    if (isConnected) {
      stopQRCodeRefresh();
      setQrCode('');
      addLog('success', 'WhatsApp conectado com sucesso!');
      toast.success('WhatsApp conectado!');
    }
  }, [isConnected]);

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
          {/* QR Code Section */}
          {!isConnected && (
            <div className="text-center space-y-3">
              {qrCode ? (
                <div className="space-y-2">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-white">
                    <img 
                      src={qrCode} 
                      alt="QR Code" 
                      className="mx-auto w-48 h-48 object-contain"
                    />
                  </div>
                  <p className="text-sm text-gray-600">
                    Atualizando em {qrTimer}s
                  </p>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50">
                  {isLoadingQR ? (
                    <div className="flex flex-col items-center space-y-2">
                      <Loader2 className="animate-spin" size={32} />
                      <p className="text-sm text-gray-600">Carregando QR Code...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        <RefreshCw size={24} className="text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-600">Clique em "Conectar" para gerar QR Code</p>
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
              <p className="text-sm text-green-600">Você pode fechar esta janela</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {!isConnected ? (
              <Button 
                onClick={handleConnect} 
                disabled={connectionStatus === 'connecting'}
                className="flex-1"
              >
                {connectionStatus === 'connecting' ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" size={16} />
                    Conectando...
                  </>
                ) : (
                  'Conectar'
                )}
              </Button>
            ) : (
              <Button 
                onClick={handleDisconnect} 
                variant="destructive"
                className="flex-1"
              >
                Desconectar
              </Button>
            )}
            
            {qrCode && !isConnected && (
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
