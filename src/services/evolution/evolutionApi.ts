
import { EvolutionMessage, QRCodeResponse, ConnectionResponse } from '@/types/evolution';

class EvolutionApiService {
  private baseUrl = 'https://evo.haddx.com.br';
  private apiKey = 'SUACHAVEAQUI';

  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'DELETE' = 'GET',
    body?: any
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'apikey': this.apiKey,
      'Content-Type': 'application/json',
    };

    try {
      console.log(`Evolution API: ${method} ${url}`, body ? { body } : '');
      
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Evolution API error! status: ${response.status}, response: ${errorText}`);
        throw new Error(`Evolution API error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Evolution API request error:', error);
      throw error;
    }
  }

  // Criar instância
  async createInstance(instanceName: string): Promise<ConnectionResponse> {
    return this.request<ConnectionResponse>(`/instance/create`, 'POST', {
      instanceName,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS'
    });
  }

  // Conectar instância (necessário antes de gerar QR)
  async connectInstance(instanceName: string): Promise<ConnectionResponse> {
    return this.request<ConnectionResponse>(`/instance/connect/${instanceName}`, 'POST');
  }

  // Gerar QR Code
  async generateQRCode(instanceName: string): Promise<QRCodeResponse> {
    return this.request<QRCodeResponse>(`/instance/qrcode/${instanceName}`, 'GET');
  }

  // Desconectar instância
  async disconnectInstance(instanceName: string): Promise<ConnectionResponse> {
    return this.request<ConnectionResponse>(`/instance/logout/${instanceName}`, 'DELETE');
  }

  // Obter status da instância
  async getInstanceStatus(instanceName: string): Promise<any> {
    return this.request(`/instance/connectionState/${instanceName}`, 'GET');
  }

  // Deletar instância
  async deleteInstance(instanceName: string): Promise<ConnectionResponse> {
    return this.request<ConnectionResponse>(`/instance/delete/${instanceName}`, 'DELETE');
  }

  // Enviar mensagem via API REST (alternativa ao WebSocket)
  async sendMessage(instanceName: string, phone: string, message: string): Promise<any> {
    return this.request(`/message/sendText/${instanceName}`, 'POST', {
      number: phone,
      text: message
    });
  }
}

export const evolutionApi = new EvolutionApiService();
