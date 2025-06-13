
import { Button } from '@/components/ui/button';
import { Loader2, QrCode, RefreshCw } from 'lucide-react';

interface QRCodeDisplayProps {
  qrCode: string;
  isLoadingQR: boolean;
  qrTimer: number;
  onRefresh: () => void;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  qrCode,
  isLoadingQR,
  qrTimer,
  onRefresh
}) => {
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error('Erro ao carregar QR Code:', e);
  };

  return (
    <div className="text-center space-y-3">
      {qrCode ? (
        <div className="space-y-2">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-white">
            <img 
              src={qrCode} 
              alt="QR Code" 
              className="mx-auto w-48 h-48 object-contain"
              onError={handleImageError}
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
                onClick={onRefresh} 
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
  );
};
