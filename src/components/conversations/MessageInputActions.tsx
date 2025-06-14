
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Image, Paperclip, Mic, MicOff } from 'lucide-react';

interface MessageInputActionsProps {
  isDisabled: boolean;
  isRecording: boolean;
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

const MessageInputActions = ({
  isDisabled,
  isRecording,
  onImageSelect,
  onFileSelect,
  onStartRecording,
  onStopRecording
}: MessageInputActionsProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
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
          onClick={isRecording ? onStopRecording : onStartRecording}
          disabled={isDisabled}
          className={`p-2 ${isRecording ? 'bg-red-100 text-red-600' : ''}`}
          title={isRecording ? "Parar gravação" : "Gravar áudio"}
        >
          {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={onFileSelect}
        accept=".pdf,.doc,.docx,.txt,.zip,.rar"
      />
      
      <input
        ref={imageInputRef}
        type="file"
        className="hidden"
        onChange={onImageSelect}
        accept="image/*"
      />
    </>
  );
};

export default MessageInputActions;
