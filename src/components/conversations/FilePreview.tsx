
import React from 'react';
import { Button } from '@/components/ui/button';
import { Send, X, Volume2, FileText, Image, Video } from 'lucide-react';

interface FilePreviewProps {
  file: File;
  fileType: 'image' | 'video' | 'audio' | 'file';
  previewUrl: string;
  onSend: () => void;
  onCancel: () => void;
  isUploading: boolean;
}

const FilePreview: React.FC<FilePreviewProps> = ({
  file,
  fileType,
  previewUrl,
  onSend,
  onCancel,
  isUploading
}) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderPreview = () => {
    switch (fileType) {
      case 'image':
        return (
          <div className="max-w-xs">
            <img 
              src={previewUrl} 
              alt="Pré-visualização" 
              className="max-h-64 rounded-lg object-cover w-full"
            />
          </div>
        );
      
      case 'video':
        return (
          <div className="max-w-xs">
            <video 
              src={previewUrl} 
              controls 
              className="max-h-64 rounded-lg w-full"
              preload="metadata"
            />
          </div>
        );
      
      case 'audio':
        return (
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg max-w-xs">
            <div className="flex items-center gap-3 mb-3">
              <Volume2 size={24} className="text-blue-600" />
              <div>
                <p className="font-medium text-sm">{file.name}</p>
                <p className="text-xs text-gray-600">{formatFileSize(file.size)}</p>
              </div>
            </div>
            <audio src={previewUrl} controls className="w-full" />
          </div>
        );
      
      case 'file':
        return (
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg max-w-xs">
            <div className="flex items-center gap-3">
              <FileText size={24} className="text-gray-600" />
              <div>
                <p className="font-medium text-sm truncate">{file.name}</p>
                <p className="text-xs text-gray-600">{formatFileSize(file.size)}</p>
                <p className="text-xs text-gray-500 uppercase">{file.type || 'documento'}</p>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const getIcon = () => {
    switch (fileType) {
      case 'image': return <Image size={16} />;
      case 'video': return <Video size={16} />;
      case 'audio': return <Volume2 size={16} />;
      case 'file': return <FileText size={16} />;
      default: return <FileText size={16} />;
    }
  };

  return (
    <div className="border-t border-border bg-background p-4">
      <div className="flex flex-col gap-3">
        {/* Cabeçalho */}
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          {getIcon()}
          <span>Pré-visualização do arquivo</span>
        </div>

        {/* Preview do arquivo */}
        <div className="flex justify-center">
          {renderPreview()}
        </div>

        {/* Botões de ação */}
        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isUploading}
          >
            <X size={16} className="mr-1" />
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={onSend}
            disabled={isUploading}
          >
            <Send size={16} className="mr-1" />
            {isUploading ? 'Enviando...' : 'Enviar'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FilePreview;
