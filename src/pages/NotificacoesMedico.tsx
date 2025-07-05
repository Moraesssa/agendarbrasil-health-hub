import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  getNotificationSettings,
  updateNotificationSettings,
} from '@/services/notificationService'
import { useToast } from '@/hooks/use-toast'
import { type NotificationSettings } from '@/types/notification'

const NotificacoesMedico: React.FC = () => {
  const [settings, setSettings] = useState<Partial<NotificationSettings>>({
    email_notifications: true,
    push_notifications: true,
    sms_notifications: false,
  })
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true)
        const data = await getNotificationSettings()
        if (data) {
          setSettings(data)
        }
      } catch (error) {
        toast({
          title: 'Erro ao carregar configurações',
          description:
            'Não foi possível buscar suas configurações. Tente novamente mais tarde.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [toast])

  const handleSettingChange = async (
    key: keyof NotificationSettings,
    value: boolean,
  ) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)

    try {
      await updateNotificationSettings({ [key]: value })
      toast({
        title: 'Configuração salva!',
        description: 'Sua preferência de notificação foi atualizada.',
      })
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description:
          'Não foi possível salvar sua configuração. Tente novamente.',
        variant: 'destructive',
      })
      // Reverter a alteração na UI em caso de erro
      setSettings(settings)
    }
  }

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
              <p className="text-sm text-gray-500">
                Receba atualizações importantes na sua caixa de entrada.
              </p>
            </Label>
            <Switch
              id="email-notifications"
              checked={settings.email_notifications}
              onCheckedChange={(value) =>
                handleSettingChange('email_notifications', value)
              }
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="push-notifications" className="flex-grow">
              <span className="font-semibold">Notificações via Push no App</span>
              <p className="text-sm text-gray-500">
                Alertas em tempo real no seu dispositivo móvel.
              </p>
            </Label>
            <Switch
              id="push-notifications"
              checked={settings.push_notifications}
              onCheckedChange={(value) =>
                handleSettingChange('push_notifications', value)
              }
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="sms-notifications" className="flex-grow">
              <span className="font-semibold">Notificações por SMS</span>
              <p className="text-sm text-gray-500">
                Receba lembretes de consulta e alertas críticos por SMS.
              </p>
            </Label>
            <Switch
              id="sms-notifications"
              checked={settings.sms_notifications}
              onCheckedChange={(value) =>
                handleSettingChange('sms_notifications', value)
              }
              disabled={loading}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default NotificacoesMedico