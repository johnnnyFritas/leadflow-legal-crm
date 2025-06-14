
import React from 'react';

interface MessageInputStatusProps {
  isConnected: boolean;
}

const MessageInputStatus = ({ isConnected }: MessageInputStatusProps) => {
  if (isConnected) return null;

  return (
    <p className="text-xs text-red-500 mt-2">
      WhatsApp não está conectado. Conecte primeiro para enviar mensagens.
    </p>
  );
};

export default MessageInputStatus;
