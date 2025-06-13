
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, XCircle, QrCode, RefreshCw, Phone, Loader2 } from 'lucide-react';
import { useEvolutionSocket } from '@/hooks/useEvolutionSocket';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export const WhatsAppStatus = () => {
  const { user } = useAuth();
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  
  // Gerar instanceName baseado no nome da empresa
  const instanceName = user?.instance_name || 
    user?.company_name?.toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '') || 
    'default';

  const {
    isConnected,
    instanceStatus,
    connectedPhone,
    qrCode,
    isGeneratingQR,
    isConnecting,
    generateQRCode,
    changeNumber,
    sendMessage,
    reconnectAttempts
  } = useEvolutionSocket(instanceName);

  const handleGenerateQR = async () => {
    await generateQRCode();
    setIsQRModalOpen(true);
  };

  const handleChangeNumber = async () => {
    await changeNumber();
    setIsQRModalOpen(false);
  };

  const getStatusIcon = () => {
    switch (instanceStatus) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'connecting':
        return <Loader2 className="h-5 w-5 text-yellow-600 animate-spin" />;
      default:
        return <XCircle className="h-5 w-5 text-red-600" />;
    }
  };

  const getStatusColor = () => {
    switch (instanceStatus) {
      case 'connected':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'connecting':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default:
        return 'bg-red-50 text-red-700 border-red-200';
    }
  };

  const getStatusText = () => {
    switch (instanceStatus) {
      case 'connected':
        return `Conectado: ${connectedPhone}`;
      case 'connecting':
        return 'Aguardando conexão...';
      default:
        return 'WhatsApp não conectado';
    }
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Status do WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Badge */}
          <Badge variant="outline" className={`flex items-center gap-2 w-fit ${getStatusColor()}`}>
            {getStatusIcon()}
            {getStatusText()}
          </Badge>

          {/* Informações de reconexão */}
          {!isConnected && reconnectAttempts > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Tentando reconectar... (Tentativa {reconnectAttempts}/5)
              </AlertDescription>
            </Alert>
          )}

          {/* Alerta quando não conectado */}
          {instanceStatus === 'disconnected' && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                WhatsApp não está conectado. Conecte seu número para enviar e receber mensagens.
              </AlertDescription>
            </Alert>
          )}

          {/* Botões de ação */}
          <div className="flex gap-2">
            {instanceStatus === 'connected' ? (
              <Button
                variant="outline"
                onClick={handleChangeNumber}
                disabled={isConnecting}
                className="flex items-center gap-2"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Desconectando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Trocar Número
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleGenerateQR}
                disabled={isGeneratingQR}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                {isGeneratingQR ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Gerando QR...
                  </>
                ) : (
                  <>
                    <QrCode className="h-4 w-4" />
                    Gerar QR Code
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Informações técnicas */}
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Instância: <code className="bg-muted px-1 py-0.5 rounded">{instanceName}</code></p>
            <p>WebSocket: {isConnected ? '🟢 Conectado' : '🔴 Desconectado'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Modal do QR Code */}
      <Dialog open={isQRModalOpen} onOpenChange={setIsQRModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Conectar WhatsApp
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {qrCode ? (
              <div className="flex flex-col items-center space-y-4">
                <div className="bg-white p-4 rounded-lg">
                  <img 
                    src={qrCode} 
                    alt="QR Code WhatsApp" 
                    className="w-64 h-64"
                  />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    1. Abra o WhatsApp no seu celular
                  </p>
                  <p className="text-sm text-muted-foreground">
                    2. Vá em <strong>Dispositivos conectados</strong>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    3. Toque em <strong>Conectar dispositivo</strong>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    4. Escaneie este QR Code
                  </p>
                </div>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    O QR Code será atualizado automaticamente a cada 30 segundos.
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-4 py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p>Gerando QR Code...</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsQRModalOpen(false)}
                className="flex-1"
              >
                Fechar
              </Button>
              <Button
                onClick={handleGenerateQR}
                disabled={isGeneratingQR}
                className="flex-1"
              >
                {isGeneratingQR ? 'Gerando...' : 'Atualizar QR'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
