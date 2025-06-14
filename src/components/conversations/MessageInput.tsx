
import React, { useState } from 'react';
import { toast } from '@/components/ui/sonner';
import { useEvolutionSocket } from '@/hooks/useEvolutionSocket';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useMessageInputHandlers } from '@/hooks/useMessageInputHandlers';
import MessageInputActions from './MessageInputActions';
import MessageInputField from './MessageInputField';
import MessageInputSend from './MessageInputSend';
import MessageInputStatus from './MessageInputStatus';

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
  const { instanceStatus } = useEvolutionSocket();
  const { isRecording: audioIsRecording } = useAudioRecorder();

  const {
    handleFileSelect,
    handleStartRecording,
    handleStopRecording
  } = useMessageInputHandlers({
    instanceStatus,
    conversationId,
    onSendFile
  });

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (instanceStatus !== 'connected') {
        toast.error('WhatsApp não conectado. Conecte primeiro para enviar mensagens.');
        return;
      }
      onSendMessage();
    }
  };

  const handleSendClick = () => {
    if (instanceStatus !== 'connected') {
      toast.error('WhatsApp não conectado. Conecte primeiro para enviar mensagens.');
      return;
    }
    onSendMessage();
  };

  const onStartRecording = async () => {
    setIsRecording(true);
    await handleStartRecording();
  };

  const onStopRecording = async () => {
    setIsRecording(false);
    await handleStopRecording();
  };

  const isDisabled = isLoading || instanceStatus !== 'connected';
  const placeholder = instanceStatus === 'connected' 
    ? "Digite sua mensagem..." 
    : "WhatsApp não conectado";

  return (
    <div className="border-t p-4 bg-card">
      <div className="flex items-end gap-2">
        <MessageInputActions
          isDisabled={isDisabled}
          isRecording={isRecording || audioIsRecording}
          onImageSelect={(e) => handleFileSelect(e, 'image')}
          onFileSelect={(e) => handleFileSelect(e, 'file')}
          onStartRecording={onStartRecording}
          onStopRecording={onStopRecording}
        />

        <MessageInputField
          value={newMessage}
          onChange={onMessageChange}
          onKeyPress={handleKeyPress}
          disabled={isDisabled}
          placeholder={placeholder}
        />

        <MessageInputSend
          onClick={handleSendClick}
          disabled={isDisabled}
          hasMessage={!!newMessage.trim()}
        />
      </div>

      <MessageInputStatus isConnected={instanceStatus === 'connected'} />
    </div>
  );
};

export default MessageInput;
