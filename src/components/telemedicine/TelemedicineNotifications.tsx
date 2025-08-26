import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Bell, 
  Video, 
  Clock, 
  Phone, 
  CheckCircle,
  AlertTriangle,
  Wifi,
  WifiOff
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TelemedicineNotificationsProps {
  userId: string;
}

interface Notification {
  id: string;
  type: 'reminder' | 'tech_check' | 'connection_test' | 'pre_consultation';
  title: string;
  message: string;
  appointment_id?: string;
  scheduled_time: string;
  read: boolean;
  action_required?: boolean;
}

export const TelemedicineNotifications: React.FC<TelemedicineNotificationsProps> = ({
  userId
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'fair' | 'poor'>('good');
  const { toast } = useToast();

  useEffect(() => {
    loadNotifications();
    checkConnectionQuality();
    
    // Check for upcoming appointments every minute
    const interval = setInterval(checkUpcomingAppointments, 60000);
    
    return () => clearInterval(interval);
  }, [userId]);

  const loadNotifications = async () => {
    try {
      // TODO: Load actual notifications from database
      const actualNotifications: Notification[] = [];
      
      setNotifications(actualNotifications);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    }
  };

  const checkConnectionQuality = () => {
    // TODO: Implement actual connection quality check
    const connection = (navigator as any).connection;
    if (connection) {
      const effectiveType = connection.effectiveType;
      if (effectiveType === '4g' || effectiveType === 'wifi') {
        setConnectionQuality('good');
      } else if (effectiveType === '3g') {
        setConnectionQuality('fair');
      } else {
        setConnectionQuality('poor');
      }
    }
  };

  const checkUpcomingAppointments = async () => {
    try {
      const { data: appointments, error } = await supabase
        .from('consultas')
        .select('*')
        .eq('paciente_id', userId)
        .eq('consultation_type', 'Online')
        .gte('consultation_date', new Date().toISOString())
        .lte('consultation_date', new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()) // Next 2 hours
        .order('consultation_date', { ascending: true });

      if (error) throw error;

      // Create notifications for upcoming appointments
      appointments?.forEach(appointment => {
        const appointmentTime = new Date(appointment.consultation_date);
        const now = new Date();
        const timeDiff = appointmentTime.getTime() - now.getTime();
        const minutesUntil = Math.floor(timeDiff / (1000 * 60));

        if (minutesUntil === 30 || minutesUntil === 15 || minutesUntil === 5) {
          toast({
            title: `Consulta em ${minutesUntil} minutos`,
            description: "Sua videochamada começará em breve. Prepare-se!",
          });
        }
      });
    } catch (error) {
      console.error('Erro ao verificar consultas:', error);
    }
  };

  const testDevices = async () => {
    try {
      // Test camera and microphone
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      stream.getTracks().forEach(track => track.stop());
      
      toast({
        title: "Teste concluído",
        description: "Seus dispositivos estão funcionando corretamente!",
      });

      // Mark tech check notification as read
      setNotifications(prev => 
        prev.map(notif => 
          notif.type === 'tech_check' 
            ? { ...notif, read: true, action_required: false }
            : notif
        )
      );
    } catch (error) {
      toast({
        title: "Erro no teste",
        description: "Não foi possível acessar câmera ou microfone. Verifique as permissões.",
        variant: "destructive"
      });
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId
          ? { ...notif, read: true }
          : notif
      )
    );
  };

  const getConnectionIcon = () => {
    switch (connectionQuality) {
      case 'good':
        return <Wifi className="h-4 w-4 text-green-600" />;
      case 'fair':
        return <Wifi className="h-4 w-4 text-yellow-600" />;
      case 'poor':
        return <WifiOff className="h-4 w-4 text-red-600" />;
    }
  };

  const getConnectionColor = () => {
    switch (connectionQuality) {
      case 'good':
        return 'border-green-200 bg-green-50';
      case 'fair':
        return 'border-yellow-200 bg-yellow-50';
      case 'poor':
        return 'border-red-200 bg-red-50';
    }
  };

  const unreadNotifications = notifications.filter(n => !n.read);

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <Card className={getConnectionColor()}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getConnectionIcon()}
              <span className="font-medium">
                Conexão: {connectionQuality === 'good' ? 'Excelente' : connectionQuality === 'fair' ? 'Boa' : 'Fraca'}
              </span>
            </div>
            <Button 
              size="sm" 
              variant="outline"
              onClick={checkConnectionQuality}
            >
              Verificar
            </Button>
          </div>
          {connectionQuality === 'poor' && (
            <p className="text-sm text-red-600 mt-2">
              Sua conexão pode afetar a qualidade da videochamada. Considere usar Wi-Fi.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações
            {unreadNotifications.length > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadNotifications.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {notifications.length === 0 ? (
            <p className="text-center text-gray-500 py-4">
              Nenhuma notificação no momento
            </p>
          ) : (
            notifications.map(notification => (
              <Alert 
                key={notification.id}
                className={`${!notification.read ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {notification.type === 'reminder' && <Clock className="h-4 w-4 text-blue-600" />}
                      {notification.type === 'tech_check' && <Video className="h-4 w-4 text-purple-600" />}
                      {notification.type === 'connection_test' && <Wifi className="h-4 w-4 text-green-600" />}
                      
                      <h4 className="font-medium text-sm">{notification.title}</h4>
                      
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      )}
                    </div>
                    <AlertDescription className="text-sm">
                      {notification.message}
                    </AlertDescription>
                    
                    {notification.action_required && !notification.read && (
                      <div className="flex gap-2 mt-3">
                        {notification.type === 'tech_check' && (
                          <Button size="sm" onClick={testDevices}>
                            Testar Dispositivos
                          </Button>
                        )}
                        {notification.type === 'reminder' && (
                          <Button size="sm">
                            <Video className="h-4 w-4 mr-1" />
                            Entrar na Consulta
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {!notification.read && (
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => markAsRead(notification.id)}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </Alert>
            ))
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start"
            onClick={testDevices}
          >
            <Video className="h-4 w-4 mr-2" />
            Testar Dispositivos
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start"
            onClick={checkConnectionQuality}
          >
            <Wifi className="h-4 w-4 mr-2" />
            Verificar Conexão
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};