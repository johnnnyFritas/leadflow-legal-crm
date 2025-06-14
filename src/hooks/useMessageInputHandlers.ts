
import { useCallback } from 'react';
import { toast } from '@/components/ui/sonner';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';

interface UseMessageInputHandlersProps {
  instanceStatus: string;
  conversationId: string;
  onSendFile: (file: File, fileUrl: string, messageType: string) => void;
}

export const useMessageInputHandlers = ({
  instanceStatus,
  conversationId,
  onSendFile
}: UseMessageInputHandlersProps) => {
  const { uploadToN8N } = useFileUpload();
  const { startRecording, stopRecording } = useAudioRecorder();

  const handleFileSelect = useCallback(async (
    e: React.ChangeEvent<HTMLInputElement>, 
    type: 'file' | 'image'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (instanceStatus !== 'connected') {
      toast.error('WhatsApp não conectado. Conecte primeiro para enviar arquivos.');
      return;
    }

    try {
      const result = await uploadToN8N(file, conversationId, 'agent');
      if (!result) return;
      
      let messageType = 'file';
      if (type === 'image' || file.type.startsWith('image/')) {
        messageType = 'image';
      } else if (file.type.startsWith('video/')) {
        messageType = 'video';
      } else if (file.type.startsWith('audio/')) {
        messageType = 'audio';
      }
      
      onSendFile(file, result.url, messageType);
    } catch (error) {
      console.error('Erro ao fazer upload do arquivo:', error);
      toast.error('Erro ao enviar arquivo');
    }

    e.target.value = '';
  }, [instanceStatus, conversationId, onSendFile, uploadToN8N]);

  const handleStartRecording = useCallback(async () => {
    if (instanceStatus !== 'connected') {
      toast.error('WhatsApp não conectado. Conecte primeiro para enviar áudios.');
      return;
    }
    
    try {
      await startRecording();
      toast.info('Gravação iniciada...');
    } catch (error) {
      toast.error('Erro ao iniciar gravação');
    }
  }, [instanceStatus, startRecording]);

  const handleStopRecording = useCallback(async () => {
    try {
      const audioFile = await stopRecording();
      
      if (audioFile) {
        toast.success('Gravação finalizada');
        const result = await uploadToN8N(audioFile, conversationId, 'agent');
        if (result) {
          onSendFile(audioFile, result.url, 'audio');
        }
      }
    } catch (error) {
      toast.error('Erro ao parar gravação');
    }
  }, [stopRecording, conversationId, onSendFile, uploadToN8N]);

  return {
    handleFileSelect,
    handleStartRecording,
    handleStopRecording
  };
};
