
import { useState, useCallback, useRef } from 'react';
import { toast } from '@/components/ui/sonner';
import { evolutionApi } from '@/services/evolution/evolutionApi';

export const useQRCodeGeneration = () => {
  const [qrCode, setQrCode] = useState<string>('');
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const qrRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  const startQRRefresh = useCallback((instanceStatus: string, generateQRCode: () => void) => {
    if (qrRefreshInterval.current) {
      clearInterval(qrRefreshInterval.current);
    }

    qrRefreshInterval.current = setInterval(() => {
      if (instanceStatus !== 'connected' && !isGeneratingQR) {
        console.log('Refreshing QR Code automaticamente...');
        generateQRCode();
      }
    }, 30000);
  }, [isGeneratingQR]);

  const generateQRCode = useCallback(async (instanceData: any, connectSocket: () => void) => {
    if (!instanceData?.instance_name) {
      toast.error('Dados da instância não encontrados');
      return;
    }

    try {
      setIsGeneratingQR(true);
      setQrCode('');

      console.log('Reiniciando instância:', instanceData.instance_name);
      
      try {
        await evolutionApi.restartInstance(instanceData.instance_name);
        console.log('Instância reiniciada com sucesso');
      } catch (error) {
        console.log('Erro ao reiniciar instância, tentando criar nova:', error);
        await evolutionApi.createInstance(instanceData.instance_name);
      }

      connectSocket();

      try {
        const qrResponse = await evolutionApi.generateQRCode(instanceData.instance_name);
        if (qrResponse.qr) {
          setQrCode(`data:image/png;base64,${qrResponse.qr}`);
        }
      } catch (error) {
        console.log('QR será recebido via WebSocket...');
      }

      toast.info('QR Code sendo gerado! Escaneie com seu WhatsApp.');
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      toast.error('Erro ao gerar QR Code. Tente novamente.');
    } finally {
      setIsGeneratingQR(false);
    }
  }, []);

  const processQRCode = useCallback((data: any, instanceName: string) => {
    console.log('QR Code recebido:', data);
    
    if (data.instance !== instanceName) {
      console.log('QR Code ignorado - instância diferente:', data.instance, 'vs', instanceName);
      return;
    }
    
    const eventData = data.data || data;
    
    if (eventData.qrcode) {
      if (eventData.qrcode.base64) {
        setQrCode(eventData.qrcode.base64);
      } else if (typeof eventData.qrcode === 'string') {
        setQrCode(`data:image/png;base64,${eventData.qrcode}`);
      } else if (eventData.qrcode.code) {
        setQrCode(`data:image/png;base64,${eventData.qrcode.code}`);
      }
      
      setIsGeneratingQR(false);
      console.log('QR Code processado para instância:', instanceName);
    }
  }, []);

  const stopQRRefresh = useCallback(() => {
    if (qrRefreshInterval.current) {
      clearInterval(qrRefreshInterval.current);
      qrRefreshInterval.current = null;
    }
  }, []);

  return {
    qrCode,
    isGeneratingQR,
    setQrCode,
    setIsGeneratingQR,
    generateQRCode,
    processQRCode,
    startQRRefresh,
    stopQRRefresh
  };
};
