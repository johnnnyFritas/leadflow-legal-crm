
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Paperclip, Mic, Camera, Square, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';

interface MessageInputProps {
  newMessage: string;
  onMessageChange: (message: string) => void;
  onSendMessage: () => void;
  onSendFile: (file: File, fileUrl: string, fileType: string) => void;
  conversationId: string;
  isLoading: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
  newMessage,
  onMessageChange,
  onSendMessage,
  onSendFile,
  conversationId,
  isLoading
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { uploadToCloudinary, isUploading } = useFileUpload();
  const { 
    isRecording, 
    recordingTime, 
    startRecording, 
    stopRecording, 
    cancelRecording, 
    formatTime 
  } = useAudioRecorder();

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  // Função para processar upload de arquivo
  const handleUploadFile = async (file: File) => {
    console.log('Iniciando upload de arquivo:', file);
    
    try {
      // Upload para Cloudinary
      const uploadResult = await uploadToCloudinary(file, conversationId);
      
      if (uploadResult) {
        console.log('Upload concluído:', uploadResult);
        
        // Determinar tipo de mensagem baseado no MIME type
        let messageType = 'file';
        if (file.type.startsWith('image/')) messageType = 'image';
        else if (file.type.startsWith('video/')) messageType = 'video';
        else if (file.type.startsWith('audio/')) messageType = 'audio';
        else messageType = 'document';

        // Enviar mensagem com arquivo
        onSendFile(file, uploadResult.secure_url, messageType);
        
        toast.success('Arquivo enviado com sucesso!');
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error('Erro ao enviar arquivo');
    }
  };

  // Handler para anexos gerais
  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  // Handler para fotos/imagens
  const handleImageUpload = () => {
    imageInputRef.current?.click();
  };

  // Handler para quando arquivo é selecionado
  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleUploadFile(file);
    }
    // Limpar input
    event.target.value = '';
  };

  // Handler para gravação de áudio
  const handleAudioRecord = async () => {
    if (isRecording) {
      // Parar gravação
      const audioFile = await stopRecording();
      if (audioFile) {
        await handleUploadFile(audioFile);
      }
    } else {
      // Iniciar gravação
      await startRecording();
    }
  };

  // Handler para cancelar gravação
  const handleCancelRecording = () => {
    cancelRecording();
    toast.info('Gravação cancelada');
  };

  return (
    <div className="p-3 lg:p-4 border-t border-border">
      {/* Inputs ocultos para upload */}
      <input
        ref={fileInputRef}
        type="file"
        hidden
        accept=".pdf,.doc,.docx,.txt,.mp4,.webm"
        onChange={handleFileSelected}
      />
      <input
        ref={imageInputRef}
        type="file"
        hidden
        accept="image/*"
        capture="environment"
        onChange={handleFileSelected}
      />

      {/* Indicador de gravação */}
      {isRecording && (
        <div className="flex items-center justify-between mb-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-red-700 dark:text-red-300">
              Gravando áudio: {formatTime(recordingTime)}
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancelRecording}
            className="text-red-600 hover:bg-red-50"
          >
            Cancelar
          </Button>
        </div>
      )}

      {/* Botões de ação */}
      <div className="flex gap-2 mb-2">
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleFileUpload}
          disabled={isUploading || isRecording}
          className="flex-shrink-0"
          title="Anexar arquivo"
        >
          {isUploading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Paperclip size={16} />
          )}
        </Button>
        
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleImageUpload}
          disabled={isUploading || isRecording}
          className="flex-shrink-0"
          title="Enviar foto"
        >
          <Camera size={16} />
        </Button>
        
        <Button 
          size="sm" 
          variant={isRecording ? "destructive" : "outline"}
          onClick={handleAudioRecord}
          disabled={isUploading}
          className="flex-shrink-0"
          title={isRecording ? "Parar gravação" : "Gravar áudio"}
        >
          {isRecording ? <Square size={16} /> : <Mic size={16} />}
        </Button>
      </div>

      {/* Input de mensagem */}
      <div className="flex gap-2">
        <Input
          placeholder="Digite sua mensagem..."
          value={newMessage}
          onChange={(e) => onMessageChange(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading || isUploading || isRecording}
          className="flex-1"
        />
        <Button 
          onClick={onSendMessage}
          disabled={(!newMessage.trim() && !isRecording) || isLoading || isUploading}
          size="sm"
          className="flex-shrink-0"
        >
          {isLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={16} />
          )}
        </Button>
      </div>
    </div>
  );
};

export default MessageInput;
