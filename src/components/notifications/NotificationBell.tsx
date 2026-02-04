import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, AtSign, UserPlus, CheckCircle, ClipboardList, Users, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useNotificationSound } from "@/hooks/useNotificationSound";

interface Notification {
  id: string;
  type: string;
  title: string;
  content: string | null;
  is_read: boolean;
  created_at: string;
  reference_type: string | null;
  reference_id: string | null;
}

const notificationTypeConfig: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  mention: { icon: AtSign, color: 'text-pink-400', bg: 'bg-pink-500/10' },
  task_assigned: { icon: ClipboardList, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  task_completed: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  client_assigned: { icon: Users, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  chat: { icon: MessageSquare, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  default: { icon: Bell, color: 'text-muted-foreground', bg: 'bg-muted/10' },
};

export function NotificationBell() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const { playSound } = useNotificationSound();
  const prevUnreadCountRef = useRef(0);

  const getNotificationConfig = (type: string) => {
    return notificationTypeConfig[type] || notificationTypeConfig.default;
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    setOpen(false);
    
    if (notification.reference_type && notification.reference_id) {
      switch (notification.reference_type) {
        case "task":
          navigate("/tasks");
          break;
        case "client":
          navigate(`/clients/${notification.reference_id}`);
          break;
        case "lead":
          navigate(`/leads/${notification.reference_id}`);
          break;
        case "announcement":
          navigate("/");
          break;
        case "task_comment":
          navigate("/tasks");
          break;
        case "chat":
          navigate("/team");
          break;
        default:
          break;
      }
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error && data) {
      const newUnreadCount = data.filter(n => !n.is_read).length;
      
      if (newUnreadCount > prevUnreadCountRef.current && prevUnreadCountRef.current !== 0) {
        playSound();
      }
      
      prevUnreadCountRef.current = newUnreadCount;
      setNotifications(data);
      setUnreadCount(newUnreadCount);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();

      const channel = supabase
        .channel("notifications")
        .on(
          "postgres_changes",
          { 
            event: "*", 
            schema: "public", 
            table: "notifications",
            filter: `user_id=eq.${user.id}`
          },
          () => fetchNotifications()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const markAsRead = async (id: string) => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);
    fetchNotifications();
  };

  const markAllAsRead = async () => {
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    fetchNotifications();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-pink-500/10">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-pink-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0 bg-background border-border shadow-2xl" align="end">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-pink-400" />
            <h4 className="font-semibold text-foreground">Powiadomienia</h4>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-pink-500/20 text-pink-400 rounded">
                {unreadCount} nowe
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-muted-foreground hover:text-foreground h-7"
              onClick={markAllAsRead}
            >
              <Check className="w-3 h-3 mr-1" />
              Oznacz wszystkie
            </Button>
          )}
        </div>
        
        {/* Notifications list */}
        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-3">
                <Bell className="w-6 h-6 text-zinc-600" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Brak powiadomień</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Tutaj pojawią się Twoje powiadomienia</p>
            </div>
          ) : (
            <div>
              {notifications.map((notification, index) => {
                const config = getNotificationConfig(notification.type);
                const Icon = config.icon;
                
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 transition-all cursor-pointer border-l-2",
                      !notification.is_read 
                        ? "bg-pink-500/5 border-pink-500 hover:bg-pink-500/10" 
                        : "border-transparent hover:bg-zinc-800/50",
                      index !== notifications.length - 1 && "border-b border-zinc-800/50"
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex gap-3">
                      {/* Icon */}
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", config.bg)}>
                        <Icon className={cn("w-4 h-4", config.color)} />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn(
                            "text-sm leading-tight",
                            !notification.is_read ? "font-semibold text-foreground" : "text-muted-foreground"
                          )}>
                            {notification.title}
                          </p>
                          {!notification.is_read && (
                            <span className="w-2 h-2 bg-pink-500 rounded-full shrink-0 mt-1" />
                          )}
                        </div>
                        
                        {notification.content && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {notification.content}
                          </p>
                        )}
                        
                        <p className="text-[10px] text-muted-foreground/60">
                          {formatDistanceToNow(new Date(notification.created_at), { 
                            locale: pl, 
                            addSuffix: true 
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="p-2 border-t border-zinc-800">
          <Button 
            variant="ghost" 
            className="w-full text-xs text-muted-foreground hover:text-foreground hover:bg-zinc-800"
            onClick={() => {
              setOpen(false);
              navigate("/notifications");
            }}
          >
            Zobacz wszystkie powiadomienia
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}