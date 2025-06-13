
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
    console.error('❌ Erro ao carregar QR Code:', e);
    console.error('❌ QR Code src:', qrCode);
    console.error('❌ QR Code length:', qrCode?.length);
    console.error('❌ QR Code starts with data:', qrCode?.startsWith('data:'));
    // Removed the problematic line: target.error
  };

  const handleImageLoad = () => {
    console.log('✅ QR Code carregado com sucesso!');
    console.log('✅ QR Code src length:', qrCode?.length);
  };

  // Log detalhado sobre o estado do QR Code a cada render
  console.log('🔍 QRCodeDisplay render:', {
    hasQrCode: !!qrCode,
    qrCodeLength: qrCode?.length,
    qrCodeStart: qrCode?.substring(0, 50),
    isLoadingQR,
    shouldShowImage: !!qrCode && qrCode.trim() !== ''
  });

  const shouldShowQRCode = qrCode && qrCode.trim() !== '';

  return (
    <div className="text-center space-y-3">
      {shouldShowQRCode ? (
        <div className="space-y-2">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-white">
            <img 
              src={qrCode} 
              alt="QR Code" 
              className="mx-auto w-48 h-48 object-contain"
              onError={handleImageError}
              onLoad={handleImageLoad}
              style={{
                display: 'block',
                maxWidth: '100%',
                height: 'auto'
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

      {/* Debug info - remover em produção */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-400 mt-2">
          Debug: QR Code length: {qrCode?.length || 0} | Has QR: {shouldShowQRCode ? 'Yes' : 'No'}
        </div>
      )}
    </div>
  );
};
