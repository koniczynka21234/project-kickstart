import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, AtSign, UserPlus, CheckCircle, Check, MessageSquare, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import { cn } from "@/lib/utils";

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

const notificationTypes = [
  { value: "all", label: "Wszystkie", icon: Bell },
  { value: "mention", label: "Wzmianki", icon: AtSign },
  { value: "task_assigned", label: "Przypisania", icon: UserPlus },
  { value: "task_completed", label: "Ukończone", icon: CheckCircle },
  { value: "client_assigned", label: "Klienci", icon: UserPlus },
  { value: "final_invoice_due", label: "Faktury", icon: Bell },
];

export default function Notifications() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  const fetchNotifications = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setNotifications(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel("notifications-page")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => fetchNotifications()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    
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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "mention":
        return <AtSign className="w-4 h-4 text-pink-400" />;
      case "task_assigned":
        return <UserPlus className="w-4 h-4 text-blue-400" />;
      case "task_completed":
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case "client_assigned":
        return <UserPlus className="w-4 h-4 text-amber-400" />;
      case "final_invoice_due":
      case "invoice_due":
        return <Bell className="w-4 h-4 text-amber-400" />;
      case "payment_due":
        return <Bell className="w-4 h-4 text-amber-400" />;
      case "contract_expiring":
      case "contract_expired":
        return <Bell className="w-4 h-4 text-red-400" />;
      default:
        return <Bell className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const filteredNotifications = activeTab === "all" 
    ? notifications 
    : notifications.filter(n => n.type === activeTab);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <AppLayout>
      <div className="container mx-auto py-6 sm:py-8 px-3 sm:px-4 w-full max-w-full overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Powiadomienia</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {unreadCount > 0 ? `${unreadCount} nieprzeczytanych` : "Wszystko przeczytane"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              <Check className="w-4 h-4 mr-2" />
              Oznacz wszystkie jako przeczytane
            </Button>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            {notificationTypes.map((type) => {
              const count = type.value === "all" 
                ? notifications.length 
                : notifications.filter(n => n.type === type.value).length;
              return (
                <TabsTrigger key={type.value} value={type.value} className="gap-2">
                  <type.icon className="w-4 h-4" />
                  {type.label}
                  {count > 0 && (
                    <span className="ml-1 text-xs bg-secondary rounded-full px-2 py-0.5">
                      {count}
                    </span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value={activeTab}>
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                Ładowanie...
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-muted-foreground">Brak powiadomień</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "p-4 rounded-lg border transition-all cursor-pointer hover:bg-secondary/50",
                      !notification.is_read 
                        ? "bg-pink-500/5 border-pink-500/30" 
                        : "bg-card border-border"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={cn(
                            "text-sm",
                            !notification.is_read ? "font-semibold text-foreground" : "text-muted-foreground"
                          )}>
                            {notification.title}
                          </p>
                          {notification.reference_type && (
                            <ExternalLink className="w-3 h-3 text-muted-foreground/50" />
                          )}
                        </div>
                        {notification.content && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {notification.content}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground/70 mt-2">
                          {formatDistanceToNow(new Date(notification.created_at), { 
                            locale: pl, 
                            addSuffix: true 
                          })}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-pink-500 rounded-full flex-shrink-0 mt-2" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
