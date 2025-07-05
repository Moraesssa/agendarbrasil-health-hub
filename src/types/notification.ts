
export interface NotificationSettings {
  user_id: string
  email_notifications: boolean
  sms_notifications: boolean // Keep this for backward compatibility
  push_notifications: boolean
  created_at?: string
  updated_at?: string
}
