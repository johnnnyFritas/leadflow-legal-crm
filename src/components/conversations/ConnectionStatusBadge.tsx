
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Loader2, QrCode, Wifi, WifiOff } from 'lucide-react';

interface ConnectionStatusBadgeProps {
  connectionStatus: 'disconnected' | 'connecting' | 'waiting_qr' | 'connected';
}

export const ConnectionStatusBadge: React.FC<ConnectionStatusBadgeProps> = ({ 
  connectionStatus 
}) => {
  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          icon: Wifi,
          text: 'Conectado ao WhatsApp',
          className: 'bg-green-100 text-green-800 border-green-200'
        };
      case 'connecting':
        return {
          icon: Loader2,
          text: 'Conectando',
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          iconClassName: 'animate-spin'
        };
      case 'waiting_qr':
        return {
          icon: QrCode,
          text: 'Aguardando QR Code',
          className: 'bg-blue-100 text-blue-800 border-blue-200'
        };
      default:
        return {
          icon: WifiOff,
          text: 'Desconectado',
          className: 'bg-red-100 text-red-800 border-red-200'
        };
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  return (
    <Badge className={config.className}>
      <IconComponent size={12} className={`mr-1 ${config.iconClassName || ''}`} />
      {config.text}
    </Badge>
  );
};
