
import { AlertCircle, Heart, Clock, Bell, Mail, Calendar, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNotificationContext } from "@/contexts/NotificationContext";
import { useNavigate } from "react-router-dom";

export function AlertsSection() {
  const { notifications, loading, markAsRead } = useNotificationContext();
  const navigate = useNavigate();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white border-red-600';
      case 'high': return 'bg-orange-500 text-white border-orange-600';
      case 'normal': return 'bg-blue-500 text-white border-blue-600';
      case 'low': return 'bg-gray-500 text-white border-gray-600';
      default: return 'bg-blue-500 text-white border-blue-600';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'encaminhamento': return Mail;
      case 'consulta': return Calendar;
      case 'pagamento': return Heart;
      case 'sistema': return Bell;
      default: return AlertCircle;
    }
  };

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    
    if (notification.type === 'encaminhamento') {
      navigate('/encaminhamentos-medico');
    } else if (notification.type === 'consulta') {
      navigate('/agenda-medico');
    }
  };

  if (loading) {
    return (
      <Card className="shadow-lg border-0 bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 hover:shadow-xl transition-all duration-300">
        <CardHeader className="border-b border-orange-100 bg-gradient-to-r from-orange-50 to-transparent">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            Alertas Importantes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-white/80 rounded-xl border border-gray-100 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 hover:shadow-xl transition-all duration-300">
      <CardHeader className="border-b border-orange-100 bg-gradient-to-r from-orange-50 to-transparent">
        <CardTitle className="flex items-center gap-2 text-gray-800">
          <AlertCircle className="h-5 w-5 text-orange-600" />
          Alertas Importantes
          {notifications.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {notifications.filter(n => !n.read).length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm">Nenhum alerta no momento</p>
              <p className="text-xs text-gray-400 mt-1">
                Você será notificado sobre encaminhamentos e consultas importantes
              </p>
            </div>
          ) : (
            notifications.slice(0, 5).map((notification) => {
              const Icon = getIcon(notification.type);
              return (
                <Button
                  key={notification.id}
                  variant="ghost"
                  className={`w-full justify-start p-4 h-auto border transition-all duration-200 hover:scale-[1.02] ${
                    notification.read 
                      ? 'bg-white/60 border-gray-100 opacity-70' 
                      : 'bg-white/90 border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3 w-full text-left">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${
                      notification.type === 'encaminhamento' ? 'bg-blue-100' :
                      notification.type === 'consulta' ? 'bg-green-100' :
                      notification.type === 'pagamento' ? 'bg-red-100' :
                      'bg-purple-100'
                    }`}>
                      <Icon className={`h-4 w-4 ${
                        notification.type === 'encaminhamento' ? 'text-blue-600' :
                        notification.type === 'consulta' ? 'text-green-600' :
                        notification.type === 'pagamento' ? 'text-red-600' :
                        'text-purple-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {notification.title}
                        </p>
                        <Badge 
                          variant="outline" 
                          className={`text-xs px-2 py-0 ${getPriorityColor(notification.priority)}`}
                        >
                          {notification.priority === 'urgent' ? 'Urgente' :
                           notification.priority === 'high' ? 'Alta' :
                           notification.priority === 'normal' ? 'Normal' : 'Baixa'}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notification.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                    )}
                  </div>
                </Button>
              );
            })
          )}
          
          {notifications.length > 5 && (
            <div className="text-center pt-2 border-t border-gray-100">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-gray-500 hover:text-gray-700"
                onClick={() => navigate('/notificacoes')}
              >
                Ver todas as notificações ({notifications.length})
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
