
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from '@/components/ui/sonner';

// Configurações do Cloudinary (em produção, essas deveriam vir de variáveis de ambiente)
const CLOUDINARY_CLOUD_NAME = 'dntp7nxsr';
const CLOUDINARY_API_KEY = '951776241316294';
const CLOUDINARY_UPLOAD_PRESET = 'unsigned_preset'; // Substitua pelo seu preset

interface UploadResult {
  secure_url: string;
  public_id: string;
  resource_type: string;
  format: string;
  bytes: number;
}

export const useFileUpload = () => {
  const [isUploading, setIsUploading] = useState(false);

  const validateFile = (file: File): boolean => {
    // Validar tamanho (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('Arquivo muito grande. Máximo de 10MB.');
      return false;
    }

    // Validar tipos permitidos
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'audio/mp3',
      'audio/wav',
      'audio/webm',
      'audio/ogg',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não suportado.');
      return false;
    }

    return true;
  };

  const getResourceType = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    return 'raw'; // Para áudio, documentos, etc.
  };

  const uploadToCloudinary = async (file: File, conversationId: string): Promise<UploadResult | null> => {
    try {
      setIsUploading(true);

      // Validar arquivo
      if (!validateFile(file)) {
        return null;
      }

      // Gerar nome único
      const timestamp = Date.now();
      const uniqueId = uuidv4();
      const fileName = `${conversationId}/${uniqueId}/${timestamp}_${file.name}`;

      // Determinar resource_type baseado no tipo MIME
      const resourceType = getResourceType(file.type);

      // Preparar FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('public_id', fileName);

      // URL do Cloudinary
      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;

      console.log('Uploading to Cloudinary:', { fileName, resourceType, fileSize: file.size });

      // Fazer upload
      const response = await fetch(cloudinaryUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Cloudinary upload error:', errorText);
        throw new Error(`Erro no upload: ${response.status}`);
      }

      const result: UploadResult = await response.json();
      console.log('Upload successful:', result);

      return result;
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao fazer upload do arquivo');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadToCloudinary,
    isUploading,
    validateFile
  };
};
