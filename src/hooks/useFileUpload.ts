
import { useState } from 'react';
import { toast } from '@/components/ui/sonner';

// Configuração do webhook n8n
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://your-n8n-webhook-url.com/webhook/upload';

interface UploadResult {
  url: string;
}

export const useFileUpload = () => {
  const [isUploading, setIsUploading] = useState(false);

  const validateFile = (file: File): boolean => {
    // Validar tamanho (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('Arquivo muito grande. Máximo de 10MB.');
      return false;
    }

    // Validar tipos permitidos
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'audio/mp3',
      'audio/wav',
      'audio/webm',
      'audio/ogg',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não suportado.');
      return false;
    }

    return true;
  };

  const getMessageType = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'file'; // Para documentos, etc.
  };

  const uploadToN8N = async (file: File, conversationId: string, senderId: string): Promise<UploadResult | null> => {
    try {
      setIsUploading(true);

      // Validar arquivo antes do upload
      if (!validateFile(file)) {
        return null;
      }

      console.log('Enviando arquivo para webhook n8n:', { fileName: file.name, fileSize: file.size });

      // Preparar FormData para envio multipart
      const formData = new FormData();
      formData.append('file', file);
      formData.append('conversationId', conversationId);
      formData.append('senderId', senderId);
      formData.append('fileName', file.name);
      formData.append('fileSize', file.size.toString());
      formData.append('mimeType', file.type);

      // Enviar para webhook n8n
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro no webhook n8n:', errorText);
        throw new Error(`Erro no upload: ${response.status}`);
      }

      const result: UploadResult = await response.json();
      console.log('Upload via n8n bem-sucedido:', result);

      return result;
    } catch (error) {
      console.error('Erro ao fazer upload via n8n:', error);
      toast.error('Erro ao fazer upload do arquivo');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadToN8N,
    isUploading,
    validateFile,
    getMessageType
  };
};
