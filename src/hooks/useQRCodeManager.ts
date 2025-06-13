
import { useState, useRef, useCallback } from 'react';
import { EVOLUTION_CONFIG } from '@/constants/evolution';

interface ConnectionLog {
  timestamp: string;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

export const useQRCodeManager = (
  getQRCode?: () => Promise<any>,
  isConnected?: boolean,
  isWaitingQR?: boolean,
  addLog?: (type: ConnectionLog['type'], message: string) => void
) => {
  const [qrCode, setQrCode] = useState<string>('');
  const [isLoadingQR, setIsLoadingQR] = useState(false);
  const [qrTimer, setQrTimer] = useState(30);
  const [renderKey, setRenderKey] = useState(0);
  const qrIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchQRCode = useCallback(async () => {
    if (!getQRCode) {
      addLog?.('error', 'Função getQRCode não disponível');
      return;
    }

    if (isConnected) {
      addLog?.('info', 'WhatsApp já está conectado');
      return;
    }

    try {
      setIsLoadingQR(true);
      addLog?.('info', 'Buscando QR Code...');

      console.log('🔄 FETCHQR: Iniciando busca');

      const result = await getQRCode();
      console.log('📥 FETCHQR: Resultado da API:', {
        type: typeof result,
        hasResult: !!result,
        keys: result ? Object.keys(result) : []
      });
      
      const qrString = result?.base64 || result?.code || result?.qrcode || result?.qr || result;
      
      console.log('🔍 FETCHQR: QR String extraída:', {
        hasQrString: !!qrString,
        length: qrString?.length,
        type: typeof qrString,
        preview: qrString?.substring(0, 50)
      });
      
      if (qrString && typeof qrString === 'string' && qrString.trim() !== '') {
        let finalQrCode = qrString.startsWith('data:image') 
          ? qrString 
          : `data:image/png;base64,${qrString}`;

        console.log('🚀 FETCHQR: Definindo QR Code final:', {
          length: finalQrCode.length,
          preview: finalQrCode.substring(0, 50)
        });

        setQrCode(finalQrCode);
        setRenderKey(prev => prev + 1);
        addLog?.('success', `QR Code recebido (${finalQrCode.length} chars)`);
        setQrTimer(30);

        console.log('✅ FETCHQR: QR Code definido com sucesso');
      } else {
        console.log('🧪 FETCHQR: Usando QR de teste');
        const testQR = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
        setQrCode(testQR);
        setRenderKey(prev => prev + 1);
        addLog?.('warning', 'Usando QR Code de teste - API não retornou QR válido');
      }
    } catch (error) {
      console.error('❌ FETCHQR: Erro:', error);
      addLog?.('error', `Erro ao buscar QR Code: ${error}`);
    } finally {
      setIsLoadingQR(false);
    }
  }, [getQRCode, isConnected, addLog]);

  const startQRCodeRefresh = useCallback(() => {
    if (qrIntervalRef.current) clearInterval(qrIntervalRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    if (!isWaitingQR) return;

    qrIntervalRef.current = setInterval(() => {
      if (isWaitingQR && !isConnected) {
        fetchQRCode();
      }
    }, EVOLUTION_CONFIG.QR_REFRESH_INTERVAL);

    timerRef.current = setInterval(() => {
      setQrTimer(prev => prev <= 1 ? 30 : prev - 1);
    }, 1000);
  }, [isWaitingQR, isConnected, fetchQRCode]);

  const stopQRCodeRefresh = useCallback(() => {
    if (qrIntervalRef.current) {
      clearInterval(qrIntervalRef.current);
      qrIntervalRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const clearQRCode = useCallback(() => {
    setQrCode('');
    setRenderKey(prev => prev + 1);
  }, []);

  return {
    qrCode,
    isLoadingQR,
    qrTimer,
    renderKey,
    fetchQRCode,
    startQRCodeRefresh,
    stopQRCodeRefresh,
    clearQRCode
  };
};
