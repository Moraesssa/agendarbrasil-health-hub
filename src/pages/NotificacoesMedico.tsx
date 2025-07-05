import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

const NotificacoesMedico: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Configurações de Notificações</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Preferências de Notificação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="email-notifications" className="flex-grow">
              <span className="font-semibold">Notificações por E-mail</span>
              <p className="text-sm text-gray-500">Receba atualizações importantes na sua caixa de entrada.</p>
            </Label>
            <Switch id="email-notifications" />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="push-notifications" className="flex-grow">
              <span className="font-semibold">Notificações via Push no App</span>
              <p className="text-sm text-gray-500">Alertas em tempo real no seu dispositivo móvel.</p>
            </Label>
            <Switch id="push-notifications" />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="patient-reminders" className="flex-grow">
              <span className="font-semibold">Lembretes de Consulta para Pacientes</span>
              <p className="text-sm text-gray-500">Envie lembretes automáticos aos seus pacientes.</p>
            </Label>
            <Switch id="patient-reminders" />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="new-messages" className="flex-grow">
              <span className="font-semibold">Alertas de Novas Mensagens de Pacientes</span>
              <p className="text-sm text-gray-500">Seja notificado quando um paciente enviar uma nova mensagem.</p>
            </Label>
            <Switch id="new-messages" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificacoesMedico;