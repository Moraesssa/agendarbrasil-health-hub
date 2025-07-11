
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNotificationContext } from "@/contexts/NotificationContext";

interface NotificationBadgeProps {
  className?: string;
  onClick?: () => void;
}

export const NotificationBadge = ({ className, onClick }: NotificationBadgeProps) => {
  const { unreadCount } = useNotificationContext();

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`relative ${className}`}
      onClick={onClick}
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs font-bold min-w-[20px]"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </Button>
  );
};
