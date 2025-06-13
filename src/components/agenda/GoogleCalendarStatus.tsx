
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Calendar, ExternalLink, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { calendarService } from '@/services/calendarService';
import { toast } from '@/components/ui/sonner';

export const GoogleCalendarStatus = () => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      setIsLoading(true);
      const instance = await calendarService.getClientInstance();
      
      if (instance) {
        const hasAllTokens = !!(
          instance.google_calendar_id &&
          instance.google_access_token &&
          instance.google_refresh_token
        );
        setIsConnected(hasAllTokens);
        
        console.log('Status da conexão Google Calendar:', {
          hasCalendarId: !!instance.google_calendar_id,
          hasAccessToken: !!instance.google_access_token,
          hasRefreshToken: !!instance.google_refresh_token,
          isConnected: hasAllTokens
        });
      } else {
        setIsConnected(false);
      }
    } catch (error) {
      console.error('Erro ao verificar status da conexão:', error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = () => {
    if (!user?.instance_name) {
      toast.error('Erro: Nome da instância não encontrado');
      return;
    }

    setIsConnecting(true);
    
    try {
      const webhookUrl = `https://autowebhook.haddx.com.br/webhook/ggconect?instance_name=${encodeURIComponent(user.instance_name)}`;
      console.log('Redirecionando para:', webhookUrl);
      
      // Abrir em nova aba para não perder o estado atual
      window.open(webhookUrl, '_blank');
      
      // Verificar status após alguns segundos
      setTimeout(() => {
        checkConnectionStatus();
        setIsConnecting(false);
      }, 5000);
      
      toast.info('Redirecionando para conectar com Google Calendar...');
    } catch (error) {
      console.error('Erro ao conectar:', error);
      toast.error('Erro ao conectar com Google Calendar');
      setIsConnecting(false);
    }
  };

  const handleChangeAccount = () => {
    handleConnect(); // Mesmo fluxo para trocar conta
  };

  if (isLoading) {
    return (
      <Card className="w-auto">
        <CardContent className="p-3 flex items-center gap-2">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm text-muted-foreground">Verificando...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-auto">
      <CardContent className="p-3">
        {isConnected ? (
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle size={14} className="mr-1" />
              Conectado ao Google Calendar
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleChangeAccount}
              disabled={isConnecting}
              className="text-xs"
            >
              {isConnecting ? (
                <>
                  <Loader2 size={14} className="mr-1 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <ExternalLink size={14} className="mr-1" />
                  Trocar Conta
                </>
              )}
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            size="sm"
          >
            {isConnecting ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Conectando...
              </>
            ) : (
              <>
                <Calendar size={16} className="mr-2" />
                Conectar Google Calendar
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
