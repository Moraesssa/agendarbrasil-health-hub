
import React, { createContext, useContext, ReactNode } from 'react';
import { FamilyNotification } from '@/types/medical';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';

interface NotificationContextType {
  notifications: FamilyNotification[];
  loading: boolean;
  unreadCount: number;
  markAsRead: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { notifications, loading, markAsRead } = useRealtimeNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;

  const value = {
    notifications,
    loading,
    unreadCount,
    markAsRead,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
