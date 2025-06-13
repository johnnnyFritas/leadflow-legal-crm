
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Loader2, MessageSquare } from 'lucide-react';
import { useEvolution } from '@/contexts/EvolutionContext';

export const EvolutionStatus = () => {
  const { connectionStatus, isConnected, lastError } = useEvolution();

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
    <Card className="w-auto">
      <CardContent className="p-3">
        <Badge variant="outline" className={config.className}>
          <div className="flex items-center gap-2">
            <MessageSquare size={14} className="flex-shrink-0" />
            <IconComponent size={14} className={`flex-shrink-0 ${config.iconColor}`} />
            <span className="text-xs font-medium">{config.text}</span>
          </div>
        </Badge>
        {lastError && (
          <p className="text-xs text-red-600 mt-1 max-w-48 truncate" title={lastError}>
            {lastError}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
