
import { useState, useRef } from 'react';
import { toast } from '@/components/ui/sonner';

export const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async (): Promise<void> => {
    try {
      // Solicitar permissão de microfone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Criar MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // Event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Iniciar gravação
      mediaRecorder.start(100); // Coleta dados a cada 100ms
      setIsRecording(true);
      setRecordingTime(0);

      // Timer para atualizar tempo de gravação
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      console.log('Gravação de áudio iniciada');
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      toast.error('Erro ao acessar microfone');
    }
  };

  const stopRecording = (): Promise<File | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || !isRecording) {
        resolve(null);
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        // Criar arquivo de áudio
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `audio_${Date.now()}.webm`, {
          type: 'audio/webm'
        });

        // Parar todas as tracks do stream
        const stream = mediaRecorderRef.current?.stream;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }

        // Limpar referências
        mediaRecorderRef.current = null;
        chunksRef.current = [];
        
        // Limpar timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        setIsRecording(false);
        setRecordingTime(0);

        console.log('Gravação finalizada:', audioFile);
        resolve(audioFile);
      };

      mediaRecorderRef.current.stop();
    });
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      // Parar todas as tracks do stream
      const stream = mediaRecorderRef.current.stream;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      mediaRecorderRef.current = null;
      chunksRef.current = [];
      
      // Limpar timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      setIsRecording(false);
      setRecordingTime(0);
      
      console.log('Gravação cancelada');
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    isRecording,
    recordingTime,
    startRecording,
    stopRecording,
    cancelRecording,
    formatTime
  };
};
