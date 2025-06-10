import { supabase } from '@/lib/supabase';
import { Conversation, Message } from '@/types/supabase';
import { FaseKanban } from '@/types/lead';
import { authService } from './authService';

class ConversationsService {
  private getInstanceId(): string {
    const instanceId = authService.getInstanceId();
    if (!instanceId) {
      throw new Error('Usuário não autenticado');
    }
    return instanceId;
  }

  async getConversations(): Promise<Conversation[]> {
    const instanceId = this.getInstanceId();
    const endpoint = `/conversations?instance_id=eq.${instanceId}&order=entry_datetime.desc`;
    return supabase.get<Conversation[]>(endpoint);
  }

  async getConversationById(id: string): Promise<Conversation | null> {
    const instanceId = this.getInstanceId();
    const endpoint = `/conversations?id=eq.${id}&instance_id=eq.${instanceId}`;
    const result = await supabase.get<Conversation[]>(endpoint);
    return result[0] || null;
  }

  async updateConversationStep(id: string, step: FaseKanban): Promise<Conversation> {
    const instanceId = this.getInstanceId();
    const endpoint = `/conversations?id=eq.${id}&instance_id=eq.${instanceId}`;
    
    console.log(`Atualizando conversa ${id} para step: ${step}`);
    
    // Usar o step diretamente (seguindo a lógica do HTML)
    const data = { step: step };
    
    console.log('Dados enviados para Supabase:', data);
    
    const result = await supabase.patch<Conversation[]>(endpoint, data);
    return result[0];
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    // Primeiro verificar se a conversa pertence à instância
    const conversation = await this.getConversationById(conversationId);
    if (!conversation) {
      throw new Error('Conversa não encontrada ou não pertence à instância');
    }

    const endpoint = `/messages?conversation_id=eq.${conversationId}&order=sent_at.asc`;
    return supabase.get<Message[]>(endpoint);
  }

  async sendMessage(conversationId: string, content: string, senderPhone?: string): Promise<Message> {
    // Verificar se a conversa pertence à instância
    const conversation = await this.getConversationById(conversationId);
    if (!conversation) {
      throw new Error('Conversa não encontrada ou não pertence à instância');
    }

    const user = authService.getCurrentUser();
    const endpoint = '/messages';
    const data: Omit<Message, 'id'> = {
      conversation_id: conversationId,
      sender_role: 'agent',
      sender_phone: senderPhone || user?.phone || '5571999999999',
      content,
      message_type: 'text',
      sent_at: new Date().toISOString()
    };
    const result = await supabase.post<Message[]>(endpoint, data);
    return result[0];
  }

  async createConversation(phone: string, caseData: Partial<Conversation>): Promise<Conversation> {
    const instanceId = this.getInstanceId();
    const endpoint = '/conversations';
    const data: Omit<Conversation, 'id'> = {
      instance_id: instanceId,
      phone,
      thread_id: `thread_${Date.now()}`,
      entry_datetime: new Date().toISOString(),
      case_summary: caseData.case_summary || '',
      legal_area: caseData.legal_area || 'Geral',
      step: 'em_qualificacao',
      channel: caseData.channel || 'Site',
      approved: false,
      on_hold: false,
      user_choice: false,
      employment_status: caseData.employment_status || '',
      employment_duration_text: caseData.employment_duration_text || '',
      employment_duration_standardized: caseData.employment_duration_standardized || 0,
      location: caseData.location || '',
      legal_thesis: caseData.legal_thesis || '',
      event_id: caseData.event_id || '',
      message_id_approval: caseData.message_id_approval || '',
      message_id_choice: caseData.message_id_choice || '',
      thread_id_auxiliary: caseData.thread_id_auxiliary || '',
      attached_files: caseData.attached_files || null,
      meeting_start_time: caseData.meeting_start_time || null,
      meeting_link: caseData.meeting_link || '',
      profession: caseData.profession || '',
      attendant_phone: caseData.attendant_phone || null,
      ...caseData
    };
    const result = await supabase.post<Conversation[]>(endpoint, data);
    return result[0];
  }

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation> {
    const instanceId = this.getInstanceId();
    const endpoint = `/conversations?id=eq.${id}&instance_id=eq.${instanceId}`;
    const result = await supabase.patch<Conversation[]>(endpoint, updates);
    return result[0];
  }

  async deleteConversation(id: string): Promise<void> {
    const instanceId = this.getInstanceId();
    const endpoint = `/conversations?id=eq.${id}&instance_id=eq.${instanceId}`;
    await supabase.delete(endpoint);
  }

  async getKanbanStats(instanceId?: string): Promise<Record<string, number>> {
    const id = instanceId || this.getInstanceId();
    const conversations = await supabase.get<Conversation[]>(`/conversations?instance_id=eq.${id}`);
    
    const stats: Record<string, number> = {};
    conversations.forEach(conv => {
      stats[conv.step] = (stats[conv.step] || 0) + 1;
    });
    
    return stats;
  }
}

export const conversationsService = new ConversationsService();
