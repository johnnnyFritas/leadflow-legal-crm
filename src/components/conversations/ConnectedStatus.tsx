
import { CheckCircle } from 'lucide-react';

interface ConnectedStatusProps {
  instanceStatus: {
    phone?: string;
  } | null;
}

export const ConnectedStatus: React.FC<ConnectedStatusProps> = ({ 
  instanceStatus 
}) => {
  return (
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
  );
};
