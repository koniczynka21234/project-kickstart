import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  AlertTriangle, Clock, ChevronRight, X, Bell, 
  MessageSquare, CheckCircle, UserPlus, FileText, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface ImportantNotification {
  id: string;
  title: string;
  content: string | null;
  type: string;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
  is_read: boolean;
}

const notificationConfig: Record<string, { icon: typeof AlertTriangle; color: string; bgColor: string }> = {
  contract_expired: {
    icon: AlertTriangle,
    color: "text-red-400",
    bgColor: "bg-red-500/15",
  },
  contract_expiring: {
    icon: Clock,
    color: "text-amber-400",
    bgColor: "bg-amber-500/15",
  },
  payment_due: {
    icon: FileText,
    color: "text-amber-400",
    bgColor: "bg-amber-500/15",
  },
  invoice_due: {
    icon: FileText,
    color: "text-amber-400",
    bgColor: "bg-amber-500/15",
  },
  invoice_required: {
    icon: FileText,
    color: "text-pink-400",
    bgColor: "bg-pink-500/15",
  },
  task_assigned: {
    icon: CheckCircle,
    color: "text-blue-400",
    bgColor: "bg-blue-500/15",
  },
  client_assigned: {
    icon: UserPlus,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/15",
  },
  new_client: {
    icon: UserPlus,
    color: "text-pink-400",
    bgColor: "bg-pink-500/15",
  },
  document_shared: {
    icon: FileText,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/15",
  },
  task_completed: {
    icon: CheckCircle,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/15",
  },
  mention: {
    icon: MessageSquare,
    color: "text-purple-400",
    bgColor: "bg-purple-500/15",
  },
  new_lead: {
    icon: UserPlus,
    color: "text-pink-400",
    bgColor: "bg-pink-500/15",
  },
  document: {
    icon: FileText,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/15",
  },
  calendar: {
    icon: Calendar,
    color: "text-orange-400",
    bgColor: "bg-orange-500/15",
  },
  default: {
    icon: Bell,
    color: "text-blue-400",
    bgColor: "bg-blue-500/15",
  },
};

export function ImportantNotifications() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<ImportantNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user?.id) return;
    
    // Najważniejsze powiadomienia
    const importantTypes = [
      'contract_expired',
      'contract_expiring', 
      'payment_due',
      'invoice_due',
      'invoice_required',
      'task_overdue',
      'task_assigned',
      'mention',
      'client_assigned',
      'document_shared',
      'new_client'
    ];
    
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_read', false)
      .in('type', importantTypes)
      .order('created_at', { ascending: false })
      .limit(5);

    if (!error && data) {
      setNotifications(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, [user?.id]);

  // Realtime subscription for notifications
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('important-notifications-updates')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const markAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleClick = (notification: ImportantNotification) => {
    if (notification.reference_type === 'client' && notification.reference_id) {
      navigate(`/clients/${notification.reference_id}`);
    } else if (notification.reference_type === 'task' && notification.reference_id) {
      navigate(`/tasks`);
    } else if (notification.reference_type === 'lead' && notification.reference_id) {
      navigate(`/leads/${notification.reference_id}`);
    } else {
      navigate('/notifications');
    }
  };

  if (loading || notifications.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Powiadomienia</h3>
              <p className="text-xs text-muted-foreground">{notifications.length} nieprzeczytanych</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/notifications")} 
            className="text-primary hover:text-primary/80 hover:bg-primary/10"
          >
            Wszystkie <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        
        <div className="space-y-2">
          {notifications.map((notification) => {
            const config = notificationConfig[notification.type] || notificationConfig.default;
            const Icon = config.icon;
            
            return (
              <div
                key={notification.id}
                className={cn(
                  "flex items-center gap-3 bg-background/60 rounded-xl p-3 cursor-pointer",
                  "hover:bg-background/80 transition-all hover:scale-[1.01]",
                  "border border-border/30 hover:border-primary/30"
                )}
                onClick={() => handleClick(notification)}
              >
                <div className={cn("w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0", config.bgColor)}>
                  <Icon className={cn("w-4 h-4", config.color)} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm text-foreground truncate">{notification.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{notification.content}</p>
                  <span className="text-[10px] text-muted-foreground/70">
                    {formatDistanceToNow(new Date(notification.created_at), { locale: pl, addSuffix: true })}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={(e) => markAsRead(notification.id, e)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
