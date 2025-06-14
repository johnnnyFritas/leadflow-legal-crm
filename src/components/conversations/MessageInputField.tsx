
import React from 'react';
import { Textarea } from '@/components/ui/textarea';

interface MessageInputFieldProps {
  value: string;
  onChange: (value: string) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  disabled: boolean;
  placeholder: string;
}

const MessageInputField = ({
  value,
  onChange,
  onKeyPress,
  disabled,
  placeholder
}: MessageInputFieldProps) => {
  return (
    <div className="flex-1">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={onKeyPress}
        placeholder={placeholder}
        disabled={disabled}
        className="min-h-[40px] max-h-32 resize-none"
        rows={1}
      />
    </div>
  );
};

export default MessageInputField;
