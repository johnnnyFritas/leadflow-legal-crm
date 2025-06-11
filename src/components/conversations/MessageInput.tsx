
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Paperclip, Mic, Camera } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface MessageInputProps {
  newMessage: string;
  onMessageChange: (message: string) => void;
  onSendMessage: () => void;
  isLoading: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
  newMessage,
  onMessageChange,
  onSendMessage,
  isLoading
}) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  const handleFileUpload = () => {
    toast.info('Upload de arquivos será implementado em breve');
  };

  const handleAudioRecord = () => {
    toast.info('Gravação de áudio será implementada em breve');
  };

  const handleVideoRecord = () => {
    toast.info('Gravação de vídeo será implementada em breve');
  };

  return (
    <div className="p-3 lg:p-4 border-t border-border">
      <div className="flex gap-2 mb-2">
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleFileUpload}
          className="flex-shrink-0"
        >
          <Paperclip size={16} />
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleAudioRecord}
          className="flex-shrink-0"
        >
          <Mic size={16} />
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleVideoRecord}
          className="flex-shrink-0"
        >
          <Camera size={16} />
        </Button>
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Digite sua mensagem..."
          value={newMessage}
          onChange={(e) => onMessageChange(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
          className="flex-1"
        />
        <Button 
          onClick={onSendMessage}
          disabled={!newMessage.trim() || isLoading}
          size="sm"
          className="flex-shrink-0"
        >
          <Send size={16} />
        </Button>
      </div>
    </div>
  );
};

export default MessageInput;
