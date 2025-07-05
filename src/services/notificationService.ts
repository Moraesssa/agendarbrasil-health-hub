
import { supabase } from '@/integrations/supabase/client'
import { type NotificationSettings } from '../types/notification'

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
    .eq('profile_id', user.id) // Changed from user_id to profile_id
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116: "The result contains 0 rows" - não é um erro, apenas não há configurações salvas.
    console.error('Erro ao buscar configurações de notificação:', error)
    throw error
  }

  // Transform the data to match NotificationSettings interface
  if (data) {
    return {
      user_id: data.user_id || data.profile_id,
      email_notifications: data.email_notifications,
      sms_notifications: false, // Default value since sms_notifications doesn't exist in schema
      push_notifications: data.push_notifications,
      created_at: data.created_at,
      updated_at: data.updated_at,
    }
  }

  return null
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
    profile_id: user.id, // Use profile_id instead of user_id
    email_notifications: settings.email_notifications,
    push_notifications: settings.push_notifications,
    // Remove sms_notifications since it doesn't exist in the schema
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('notification_settings')
    .upsert(updates, { onConflict: 'profile_id' })
    .select()
    .single()

  if (error) {
    console.error('Erro ao atualizar configurações de notificação:', error)
    throw error
  }

  // Transform the response to match NotificationSettings interface
  return {
    user_id: data.user_id || data.profile_id,
    email_notifications: data.email_notifications,
    sms_notifications: false, // Default value
    push_notifications: data.push_notifications,
    created_at: data.created_at,
    updated_at: data.updated_at,
  }
}
