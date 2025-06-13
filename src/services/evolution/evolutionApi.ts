
import { InstanceStatus } from '@/types/evolution';
import { EVOLUTION_CONFIG } from '@/constants/evolution';

export class EvolutionApi {
  private static readonly BASE_URL = EVOLUTION_CONFIG.BASE_URL;
  // Usar variável de ambiente ou fallback para desenvolvimento
  private static readonly API_KEY = import.meta.env.VITE_EVO_API_KEY || 'SUACHAVEAQUI';

  static async createInstance(instanceName: string): Promise<any> {
    console.log('Criando instância:', instanceName);
    
    const response = await fetch(`${this.BASE_URL}/instance/create`, {
      method: 'POST',
      headers: {
        'apikey': this.API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        instanceName: instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
        WEBHOOK_GLOBAL_ENABLED: 'true'
      })
    });

    if (!response.ok) {
      throw new Error(`Erro ao criar instância: ${response.status}`);
    }

    const result = await response.json();
    console.log('Instância criada:', result);
    return result;
  }

  static async fetchInstanceStatus(instanceName: string): Promise<InstanceStatus | null> {
    console.log('Verificando status da instância:', instanceName);
    
    const response = await fetch(`${this.BASE_URL}/instance/fetchInstances?instanceName=${encodeURIComponent(instanceName)}`, {
      method: 'GET',
      headers: {
        'apikey': this.API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar instância: ${response.status}`);
    }

    const result = await response.json();
    console.log('Status da instância:', result);
    
    if (result && result.length > 0) {
      const instance = result[0];
      return {
        instanceName: instance.instanceName || instanceName,
        ownerJid: instance.ownerJid,
        profilePictureUrl: instance.profilePictureUrl,
        profileName: instance.profileName,
        phone: instance.ownerJid ? instance.ownerJid.replace('@s.whatsapp.net', '') : undefined,
        instanceId: instance.instanceId
      };
    }
    
    return null;
  }

  static async configureWebhook(instanceName: string): Promise<any> {
    console.log('Configurando webhook para:', instanceName);
    
    const response = await fetch(`${this.BASE_URL}/webhook/set/${instanceName}`, {
      method: 'POST',
      headers: {
        'apikey': this.API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        webhook: {
          enabled: true,
          url: 'https://autowebhook.haddx.com.br/webhook/message',
          events: [
            'MESSAGES_UPSERT',
            'SEND_MESSAGE',
            'CONNECTION_UPDATE'
          ],
          webhook_by_events: true,
          webhook_base64: true
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Erro ao configurar webhook: ${response.status}`);
    }

    const result = await response.json();
    console.log('Webhook configurado:', result);
    return result;
  }

  static async fetchQRCode(instanceName: string): Promise<any> {
    console.log('🔍 Buscando QR Code para:', instanceName);
    
    const response = await fetch(`${this.BASE_URL}/instance/connect/${instanceName}`, {
      method: 'GET',
      headers: {
        'apikey': this.API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar QR Code: ${response.status}`);
    }

    const result = await response.json();
    console.log('📥 QR Code resposta RAW da API:', result);
    
    // Extrair QR code de diferentes estruturas possíveis
    let qrBase64 = '';
    
    // Tentar diferentes caminhos para o QR code
    if (result.qrcode?.base64) {
      qrBase64 = result.qrcode.base64;
      console.log('✅ QR encontrado em result.qrcode.base64');
    } else if (result.qrcode?.code) {
      qrBase64 = result.qrcode.code;
      console.log('✅ QR encontrado em result.qrcode.code');
    } else if (result.base64) {
      qrBase64 = result.base64;
      console.log('✅ QR encontrado em result.base64');
    } else if (result.code) {
      qrBase64 = result.code;
      console.log('✅ QR encontrado em result.code');
    } else if (typeof result === 'string') {
      qrBase64 = result;
      console.log('✅ QR é string direta');
    }

    console.log('🔍 QR extraído:', {
      hasQr: !!qrBase64,
      length: qrBase64?.length,
      startsWithData: qrBase64?.startsWith('data:'),
      preview: qrBase64?.substring(0, 50)
    });
    
    // Normalizar resultado
    const normalizedResult = {
      base64: qrBase64,
      pairingCode: result.qrcode?.pairingCode || result.pairingCode,
      count: result.qrcode?.count || result.count || 1
    };
    
    console.log('📤 QR Code normalizado:', {
      hasBase64: !!normalizedResult.base64,
      base64Length: normalizedResult.base64?.length,
      hasPairingCode: !!normalizedResult.pairingCode
    });
    
    return normalizedResult;
  }

  // Getter para acessar a API key externamente se necessário
  static get apiKey() {
    return this.API_KEY;
  }
}
