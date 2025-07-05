import { supabase } from '@/integrations/supabase/client'
import { type NotificationSettings } from '@/types/notification'

/**
 * Busca as configurações de notificação do usuário logado.
 * @returns As configurações de notificação do usuário.
 */
export const getNotificationSettings = async (): Promise<NotificationSettings | null> => {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Usuário não autenticado.')
  }

  const { data, error } = await supabase
    .from('notification_settings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116: "The result contains 0 rows" - não é um erro, apenas não há configurações salvas.
    console.error('Erro ao buscar configurações de notificação:', error)
    throw error
  }

  return data
}

/**
 * Atualiza ou cria as configurações de notificação do usuário.
 * @param settings - As novas configurações de notificação.
 * @returns As configurações de notificação atualizadas.
 */
export const updateNotificationSettings = async (
  settings: Partial<NotificationSettings>,
): Promise<NotificationSettings> => {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Usuário não autenticado.')
  }

  const updates = {
    ...settings,
    user_id: user.id,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('notification_settings')
    .upsert(updates, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) {
    console.error('Erro ao atualizar configurações de notificação:', error)
    throw error
  }

  return data
}