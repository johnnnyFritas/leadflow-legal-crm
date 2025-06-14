
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip, Image, FileText, Mic, MicOff } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { toast } from '@/components/ui/sonner';
import { useEvolutionSocket } from '@/hooks/useEvolutionSocket';

interface MessageInputProps {
  newMessage: string;
  onMessageChange: (message: string) => void;
  onSendMessage: () => void;
  onSendFile: (file: File, fileUrl: string, messageType: string) => void;
  conversationId: string;
  isLoading: boolean;
}

const MessageInput = ({
  newMessage,
  onMessageChange,
  onSendMessage,
  onSendFile,
  conversationId,
  isLoading
}: MessageInputProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  const { uploadToN8N } = useFileUpload();
  const { startRecording, stopRecording } = useAudioRecorder();
  const { instanceStatus } = useEvolutionSocket();

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (instanceStatus !== 'connected') { // CORRIGIDO: verificar connected ao invés de open
        toast.error('WhatsApp não conectado. Conecte primeiro para enviar mensagens.');
        return;
      }
      onSendMessage();
    }
  };

  const handleSendClick = () => {
    if (instanceStatus !== 'connected') { // CORRIGIDO: verificar connected ao invés de open
      toast.error('WhatsApp não conectado. Conecte primeiro para enviar mensagens.');
      return;
    }
    onSendMessage();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'file' | 'image') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (instanceStatus !== 'connected') { // CORRIGIDO: verificar connected ao invés de open
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

    // Limpar input
    e.target.value = '';
  };

  const handleStartRecording = async () => {
    if (instanceStatus !== 'connected') { // CORRIGIDO: verificar connected ao invés de open
      toast.error('WhatsApp não conectado. Conecte primeiro para enviar áudios.');
      return;
    }
    
    try {
      await startRecording();
      setIsRecording(true);
      toast.info('Gravação iniciada...');
    } catch (error) {
      toast.error('Erro ao iniciar gravação');
    }
  };

  const handleStopRecording = async () => {
    try {
      const audioFile = await stopRecording();
      setIsRecording(false);
      
      if (audioFile) {
        toast.success('Gravação finalizada');
        // Enviar arquivo de áudio automaticamente
        const result = await uploadToN8N(audioFile, conversationId, 'agent');
        if (result) {
          onSendFile(audioFile, result.url, 'audio');
        }
      }
    } catch (error) {
      toast.error('Erro ao parar gravação');
    }
  };

  const isDisabled = isLoading || instanceStatus !== 'connected'; // CORRIGIDO: verificar connected ao invés de open

  return (
    <div className="border-t p-4 bg-card">
      <div className="flex items-end gap-2">
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => imageInputRef.current?.click()}
            disabled={isDisabled}
            className="p-2"
            title="Enviar imagem"
          >
            <Image size={16} />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isDisabled}
            className="p-2"
            title="Enviar arquivo"
          >
            <Paperclip size={16} />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            disabled={isLoading}
            className={`p-2 ${isRecording ? 'bg-red-100 text-red-600' : ''}`}
            title={isRecording ? "Parar gravação" : "Gravar áudio"}
          >
            {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
          </Button>
        </div>

        <div className="flex-1">
          <Textarea
            value={newMessage}
            onChange={(e) => onMessageChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={instanceStatus === 'connected' ? "Digite sua mensagem..." : "WhatsApp não conectado"} // CORRIGIDO: verificar connected
            disabled={isDisabled}
            className="min-h-[40px] max-h-32 resize-none"
            rows={1}
          />
        </div>

        <Button
          onClick={handleSendClick}
          disabled={isDisabled || !newMessage.trim()}
          size="sm"
          className="bg-green-600 hover:bg-green-700"
        >
          <Send size={16} />
        </Button>
      </div>

      {instanceStatus !== 'connected' && ( // CORRIGIDO: verificar connected ao invés de open
        <p className="text-xs text-red-500 mt-2">
          WhatsApp não está conectado. Conecte primeiro para enviar mensagens.
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => handleFileSelect(e, 'file')}
        accept=".pdf,.doc,.docx,.txt,.zip,.rar"
      />
      
      <input
        ref={imageInputRef}
        type="file"
        className="hidden"
        onChange={(e) => handleFileSelect(e, 'image')}
        accept="image/*"
      />
    </div>
  );
};

export default MessageInput;
