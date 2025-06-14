
import React from 'react';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

interface MessageInputSendProps {
  onClick: () => void;
  disabled: boolean;
  hasMessage: boolean;
}

const MessageInputSend = ({
  onClick,
  disabled,
  hasMessage
}: MessageInputSendProps) => {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || !hasMessage}
      size="sm"
      className="bg-green-600 hover:bg-green-700"
    >
      <Send size={16} />
    </Button>
  );
};

export default MessageInputSend;
