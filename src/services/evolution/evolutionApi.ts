
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
    console.log('Buscando QR Code para:', instanceName);
    
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
    console.log('QR Code obtido:', { hasBase64: !!result.base64 });
    return result;
  }

  // Getter para acessar a API key externamente se necessário
  static get API_KEY() {
    return this.API_KEY;
  }
}
