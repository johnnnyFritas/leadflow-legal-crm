
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { ConnectionLog } from '@/hooks/useConnectionLogs';

interface ConnectionLogsProps {
  logs: ConnectionLog[];
}

export const ConnectionLogs: React.FC<ConnectionLogsProps> = ({ logs }) => {
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

  return (
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
  );
};
