
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Loader2, MessageSquare, Settings, QrCode } from 'lucide-react';
import { useEvolution } from '@/contexts/EvolutionContext';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { EvolutionConnectionModal } from './EvolutionConnectionModal';

export const EvolutionStatus = () => {
  const { connectionStatus, isConnected, isWaitingQR, lastError, instanceStatus } = useEvolution();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          icon: CheckCircle,
          text: 'WhatsApp Conectado',
          className: 'bg-green-50 text-green-700 border-green-200',
          iconColor: 'text-green-600'
        };
      case 'connecting':
        return {
          icon: Loader2,
          text: 'Conectando...',
          className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
          iconColor: 'text-yellow-600 animate-spin'
        };
      case 'waiting_qr':
        return {
          icon: QrCode,
          text: 'Aguardando QR Code',
          className: 'bg-blue-50 text-blue-700 border-blue-200',
          iconColor: 'text-blue-600'
        };
      case 'disconnected':
      default:
        return {
          icon: AlertCircle,
          text: 'WhatsApp Desconectado',
          className: 'bg-red-50 text-red-700 border-red-200',
          iconColor: 'text-red-600'
        };
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  return (
    <>
      <Card className="w-auto">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={config.className}>
              <div className="flex items-center gap-2">
                <MessageSquare size={14} className="flex-shrink-0" />
                <IconComponent size={14} className={`flex-shrink-0 ${config.iconColor}`} />
                <span className="text-xs font-medium">{config.text}</span>
                {isConnected && instanceStatus?.phone && (
                  <span className="text-xs opacity-75">
                    ({instanceStatus.phone})
                  </span>
                )}
              </div>
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="p-1 h-auto"
            >
              <Settings size={14} />
            </Button>
          </div>
          {lastError && (
            <p className="text-xs text-red-600 mt-1 max-w-48 truncate" title={lastError}>
              {lastError}
            </p>
          )}
        </CardContent>
      </Card>

      <EvolutionConnectionModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen}
      />
    </>
  );
};
