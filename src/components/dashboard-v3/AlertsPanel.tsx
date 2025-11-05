import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, DollarSign, Clock, FileText, Bell } from 'lucide-react';
import { useDashboardAlerts } from '@/hooks/dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';

/**
 * AlertsPanel Component
 * 
 * Displays important alerts and notifications
 */
export const AlertsPanel: React.FC = () => {
  const { data: alerts, isLoading, error } = useDashboardAlerts();
  const navigate = useNavigate();

  if (error) {
    return (
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-gray-800">Alertas e Notificações</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-red-600 text-sm">Erro ao carregar alertas</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-gray-800">Alertas e Notificações</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="flex items-center gap-2 text-gray-800">
          <Bell className="h-5 w-5 text-orange-600" />
          Alertas e Notificações
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {!alerts || alerts.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">Nenhum alerta no momento</p>
            <p className="text-gray-400 text-xs mt-1">Tudo está em ordem! 🎉</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <AlertItem key={alert.id} alert={alert} onAction={() => navigate(alert.actionUrl)} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface AlertItemProps {
  alert: {
    id: string;
    type: 'payment' | 'confirmation' | 'document' | 'message';
    priority: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    count?: number;
  };
  onAction: () => void;
}

const AlertItem: React.FC<AlertItemProps> = ({ alert, onAction }) => {
  const getAlertIcon = () => {
    switch (alert.type) {
      case 'payment':
        return <DollarSign className="h-5 w-5" />;
      case 'confirmation':
        return <Clock className="h-5 w-5" />;
      case 'document':
        return <FileText className="h-5 w-5" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  const getAlertColor = () => {
    switch (alert.priority) {
      case 'high':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-700';
    }
  };

  const getBadgeVariant = () => {
    switch (alert.priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <div className={`p-4 rounded-lg border transition-all hover:shadow-md ${getAlertColor()}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{getAlertIcon()}</div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-semibold text-sm">{alert.title}</h4>
            {alert.count && (
              <Badge variant={getBadgeVariant()} className="text-xs">
                {alert.count}
              </Badge>
            )}
          </div>
          <p className="text-xs opacity-90 mb-3">{alert.description}</p>
          <Button
            size="sm"
            variant="ghost"
            className="text-xs h-7 px-3"
            onClick={onAction}
          >
            Ver Detalhes →
          </Button>
        </div>
      </div>
    </div>
  );
};
