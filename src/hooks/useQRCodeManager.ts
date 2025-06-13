
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

      console.log('🔄 FETCHQR: Iniciando busca do QR Code');

      const result = await getQRCode();
      console.log('📥 FETCHQR: Resultado completo da API:', {
        result,
        type: typeof result,
        hasResult: !!result,
        keys: result ? Object.keys(result) : []
      });
      
      // Tentar extrair QR de múltiplas formas
      let qrString = '';
      
      // Primeira tentativa: propriedades diretas
      if (result?.base64) {
        qrString = result.base64;
        console.log('✅ FETCHQR: QR encontrado em result.base64');
      } 
      // Segunda tentativa: result como string direta
      else if (typeof result === 'string' && result.trim() !== '') {
        qrString = result;
        console.log('✅ FETCHQR: QR é string direta');
      }
      // Terceira tentativa: outras propriedades
      else if (result?.code) {
        qrString = result.code;
        console.log('✅ FETCHQR: QR encontrado em result.code');
      } else if (result?.qrcode) {
        qrString = result.qrcode;
        console.log('✅ FETCHQR: QR encontrado em result.qrcode');
      } else if (result?.qr) {
        qrString = result.qr;
        console.log('✅ FETCHQR: QR encontrado em result.qr');
      }
      
      console.log('🔍 FETCHQR: QR String extraída:', {
        hasQrString: !!qrString,
        length: qrString?.length,
        type: typeof qrString,
        startsWithData: qrString?.startsWith('data:'),
        preview: qrString?.substring(0, 50)
      });
      
      if (qrString && typeof qrString === 'string' && qrString.trim() !== '') {
        // Garantir que o QR code tenha o prefixo data:image correto
        let finalQrCode = qrString.startsWith('data:image') 
          ? qrString 
          : `data:image/png;base64,${qrString}`;

        console.log('🚀 FETCHQR: Definindo QR Code final:', {
          length: finalQrCode.length,
          startsWithData: finalQrCode.startsWith('data:'),
          preview: finalQrCode.substring(0, 80)
        });

        setQrCode(finalQrCode);
        setRenderKey(prev => prev + 1);
        addLog?.('success', `QR Code recebido e configurado (${finalQrCode.length} chars)`);
        setQrTimer(30);

        console.log('✅ FETCHQR: QR Code definido com sucesso no estado');
      } else {
        console.warn('⚠️ FETCHQR: QR Code não encontrado ou inválido');
        addLog?.('warning', 'QR Code não encontrado na resposta da API');
        
        // Limpar QR code anterior se não houver novo
        setQrCode('');
        setRenderKey(prev => prev + 1);
      }
    } catch (error) {
      console.error('❌ FETCHQR: Erro ao buscar QR Code:', error);
      addLog?.('error', `Erro ao buscar QR Code: ${error}`);
      setQrCode('');
      setRenderKey(prev => prev + 1);
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
