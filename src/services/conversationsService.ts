
import { supabase } from '@/lib/supabase';
import { Conversation, Message } from '@/types/supabase';

class ConversationsService {
  private instanceId = '550e8400-e29b-41d4-a716-446655440000'; // ID fixo para demonstração

  async getConversations(): Promise<Conversation[]> {
    const endpoint = `/conversations?instance_id=eq.${this.instanceId}&order=entry_datetime.desc`;
    return supabase.get<Conversation[]>(endpoint);
  }

  async getConversationById(id: string): Promise<Conversation | null> {
    const endpoint = `/conversations?id=eq.${id}&instance_id=eq.${this.instanceId}`;
    const result = await supabase.get<Conversation[]>(endpoint);
    return result[0] || null;
  }

  async updateConversationStep(id: string, step: string): Promise<Conversation> {
    const endpoint = `/conversations?id=eq.${id}&instance_id=eq.${this.instanceId}`;
    const data = { step };
    const result = await supabase.patch<Conversation[]>(endpoint, data);
    return result[0];
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    const endpoint = `/messages?conversation_id=eq.${conversationId}&order=sent_at.asc`;
    return supabase.get<Message[]>(endpoint);
  }

  async sendMessage(conversationId: string, content: string, senderPhone: string = '5571999999999'): Promise<Message> {
    const endpoint = '/messages';
    const data: Omit<Message, 'id'> = {
      conversation_id: conversationId,
      sender_role: 'agent',
      sender_phone: senderPhone,
      content,
      message_type: 'text',
      sent_at: new Date().toISOString()
    };
    const result = await supabase.post<Message[]>(endpoint, data);
    return result[0];
  }

  async createConversation(phone: string, caseData: Partial<Conversation>): Promise<Conversation> {
    const endpoint = '/conversations';
    const data: Omit<Conversation, 'id'> = {
      instance_id: this.instanceId,
      phone,
      thread_id: `thread_${Date.now()}`,
      entry_datetime: new Date().toISOString(),
      case_summary: caseData.case_summary || '',
      legal_area: caseData.legal_area || 'Geral',
      step: 'em_qualificacao',
      channel: caseData.channel || 'Site',
      approved: false,
      ...caseData
    };
    const result = await supabase.post<Conversation[]>(endpoint, data);
    return result[0];
  }
}

export const conversationsService = new ConversationsService();
