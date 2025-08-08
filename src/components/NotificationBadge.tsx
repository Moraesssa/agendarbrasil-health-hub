
import { useMemo } from "react";
import { Bell, CalendarCheck, AlertTriangle, Info, CheckCircle, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNotificationContext } from "@/contexts/NotificationContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NotificationBadgeProps {
  className?: string;
  onClick?: () => void;
}

export const NotificationBadge = ({ className, onClick }: NotificationBadgeProps) => {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotificationContext();
  const navigate = useNavigate();

  const firstItems = useMemo(() => notifications.slice(0, 8), [notifications]);

  const getIcon = (type?: string) => {
    switch (type) {
      case 'urgent':
      case 'alert':
        return <AlertTriangle className="h-4 w-4" />;
      case 'reminder':
      case 'upcoming':
        return <CalendarCheck className="h-4 w-4" />;
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const handleOpenItem = (n: any) => {
    markAsRead(n.id);
    if (n.actionUrl) {
      navigate(n.actionUrl);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          aria-label="Abrir notificações"
          variant="ghost"
          size="icon"
          className={cn(
            "relative h-12 w-12 md:h-10 md:w-10 rounded-full shadow-sm bg-background/80 supports-[backdrop-filter]:bg-background/60 backdrop-blur touch-manipulation",
            className
          )}
          onClick={onClick}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1.5 -right-1.5 md:-top-2 md:-right-2 h-5 w-5 p-0 flex items-center justify-center text-xs font-bold min-w-[20px]"
              aria-label={`${unreadCount} notificações não lidas`}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        sideOffset={8}
        className="z-[60] w-[min(92vw,24rem)] xs:w-[min(88vw,24rem)] md:w-96 p-0 bg-popover text-popover-foreground border shadow-lg"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="font-medium">Notificações</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-1">{unreadCount}</Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Marcar todas como lidas
            </Button>
          )}
        </div>

        {loading ? (
          <div className="p-4 space-y-3">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Sem notificações no momento
          </div>
        ) : (
          <ScrollArea className="max-h-[min(70vh,20rem)] md:max-h-80">
            <ul className="divide-y">
              {firstItems.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => handleOpenItem(n)}
                    className={`w-full text-left px-4 py-3 hover:bg-accent hover:text-accent-foreground transition flex gap-3 items-start ${n.read ? 'opacity-80' : ''}`}
                  >
                    <div className="mt-0.5">{getIcon(n.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">{n.title}</p>
                        <span className="ml-3 text-xs text-muted-foreground shrink-0">
                          {new Date(n.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{n.message}</p>
                      {n.actionUrl && (
                        <div className="mt-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenItem(n);
                            }}
                            className="inline-flex items-center gap-1"
                          >
                            Abrir
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
            {notifications.length > firstItems.length && (
              <div className="px-4 py-2 text-xs text-muted-foreground">
                Mostrando {firstItems.length} de {notifications.length}
              </div>
            )}
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
};
