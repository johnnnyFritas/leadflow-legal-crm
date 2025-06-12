
import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Paperclip, Mic, Camera, Square, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import FilePreview from './FilePreview';

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
  
  // Estados para pré-visualização
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingFileType, setPendingFileType] = useState<'image' | 'video' | 'audio' | 'file' | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null);
  const [isUploadingPreview, setIsUploadingPreview] = useState(false);
  
  const { uploadToN8N, isUploading, getMessageType } = useFileUpload();
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

  // Função para detectar tipo de arquivo baseado no MIME type
  const detectFileType = (file: File): 'image' | 'video' | 'audio' | 'file' => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    return 'file';
  };

  // Função para preparar arquivo para pré-visualização
  const prepareFilePreview = (file: File) => {
    const fileType = detectFileType(file);
    const previewUrl = URL.createObjectURL(file);
    
    setPendingFile(file);
    setPendingFileType(fileType);
    setPendingPreviewUrl(previewUrl);
  };

  // Função para cancelar pré-visualização
  const cancelFilePreview = () => {
    if (pendingPreviewUrl) {
      URL.revokeObjectURL(pendingPreviewUrl);
    }
    setPendingFile(null);
    setPendingFileType(null);
    setPendingPreviewUrl(null);
  };

  // Função para confirmar envio do arquivo
  const confirmFileSend = async () => {
    if (!pendingFile) return;

    setIsUploadingPreview(true);
    
    try {
      // Obter senderId (usuário atual)
      const senderId = 'current-user-id'; // TODO: pegar do contexto de auth
      
      // Upload para n8n webhook
      const uploadResult = await uploadToN8N(pendingFile, conversationId, senderId);
      
      if (uploadResult) {
        console.log('Upload via n8n concluído:', uploadResult);
        
        // Determinar tipo de mensagem baseado no MIME type
        const messageType = getMessageType(pendingFile.type);

        // Enviar mensagem com arquivo usando a URL retornada pelo n8n
        onSendFile(pendingFile, uploadResult.url, messageType);
        
        // Limpar pré-visualização
        cancelFilePreview();
        
        toast.success('Arquivo enviado com sucesso!');
      }
    } catch (error) {
      console.error('Erro no upload via n8n:', error);
      toast.error('Erro ao enviar arquivo');
    } finally {
      setIsUploadingPreview(false);
    }
  };

  // Handler para anexos gerais (documentos, etc)
  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  // Handler para fotos/imagens com câmera
  const handleImageUpload = () => {
    imageInputRef.current?.click();
  };

  // Handler para quando arquivo é selecionado
  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      prepareFilePreview(file);
    }
    // Limpar input para permitir seleção do mesmo arquivo novamente
    event.target.value = '';
  };

  // Handler para gravação de áudio
  const handleAudioRecord = async () => {
    if (isRecording) {
      // Parar gravação e preparar arquivo de áudio para pré-visualização
      const audioFile = await stopRecording();
      if (audioFile) {
        prepareFilePreview(audioFile);
      }
    } else {
      // Iniciar gravação de áudio
      await startRecording();
    }
  };

  // Handler para cancelar gravação
  const handleCancelRecording = () => {
    cancelRecording();
    toast.info('Gravação cancelada');
  };

  // Se há arquivo pendente, mostrar pré-visualização
  if (pendingFile && pendingFileType && pendingPreviewUrl) {
    return (
      <FilePreview
        file={pendingFile}
        fileType={pendingFileType}
        previewUrl={pendingPreviewUrl}
        onSend={confirmFileSend}
        onCancel={cancelFilePreview}
        isUploading={isUploadingPreview}
      />
    );
  }

  return (
    <div className="p-3 lg:p-4 border-t border-border">
      {/* Inputs ocultos para captura de arquivos */}
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

      {/* Indicador de gravação de áudio */}
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

      {/* Botões de ação para mídia */}
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

      {/* Input de mensagem de texto */}
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
