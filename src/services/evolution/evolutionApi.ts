
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
        throw new Error(`Evolution API error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Evolution API request error:', error);
      throw error;
    }
  }

  async connectInstance(instanceName: string): Promise<ConnectionResponse> {
    return this.request<ConnectionResponse>('/instance/connect', 'POST', {
      instanceName
    });
  }

  async generateQRCode(instanceName: string): Promise<QRCodeResponse> {
    return this.request<QRCodeResponse>('/instance/qr', 'POST', {
      instanceName
    });
  }

  async disconnectInstance(instanceName: string): Promise<ConnectionResponse> {
    return this.request<ConnectionResponse>('/instance/disconnect', 'POST', {
      instanceName
    });
  }

  async getInstanceStatus(instanceName: string): Promise<any> {
    return this.request(`/instance/status/${instanceName}`, 'GET');
  }

  async deleteInstance(instanceName: string): Promise<ConnectionResponse> {
    return this.request<ConnectionResponse>(`/instance/delete/${instanceName}`, 'DELETE');
  }
}

export const evolutionApi = new EvolutionApiService();
