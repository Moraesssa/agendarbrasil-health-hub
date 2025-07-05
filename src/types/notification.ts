export interface NotificationSettings {
  user_id: string
  email_notifications: boolean
  sms_notifications: boolean
  push_notifications: boolean
  created_at?: string
  updated_at?: string
}