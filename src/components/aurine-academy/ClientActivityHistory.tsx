import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, LogIn, Eye, FileText, BookOpen, Bell, Smartphone } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";

interface ClientActivityHistoryProps {
  clientId: string;
}

interface ActivityEvent {
  id: string;
  event_type: string;
  event_data: Record<string, unknown> | null;
  user_email: string | null;
  created_at: string;
}

const EVENT_CONFIG: Record<string, { label: string; icon: typeof Activity; color: string }> = {
  login: { label: "Logowanie", icon: LogIn, color: "text-green-500" },
  logout: { label: "Wylogowanie", icon: LogIn, color: "text-muted-foreground" },
  view_campaign: { label: "Przeglądanie kampanii", icon: Eye, color: "text-blue-500" },
  view_document: { label: "Przeglądanie dokumentu", icon: FileText, color: "text-amber-500" },
  view_content: { label: "Przeglądanie treści", icon: BookOpen, color: "text-purple-500" },
  view_guardian: { label: "Przeglądanie opiekuna", icon: Eye, color: "text-cyan-500" },
  notification_opened: { label: "Otwarcie powiadomienia", icon: Bell, color: "text-pink-500" },
  app_opened: { label: "Otwarcie aplikacji", icon: Smartphone, color: "text-primary" },
};

export function ClientActivityHistory({ clientId }: ClientActivityHistoryProps) {
  const { data: activities, isLoading } = useQuery({
    queryKey: ["client-activity", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_app_activity")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as ActivityEvent[];
    },
  });

  const getEventConfig = (eventType: string) => {
    return EVENT_CONFIG[eventType] || { 
      label: eventType, 
      icon: Activity, 
      color: "text-muted-foreground" 
    };
  };

  const getEventDetails = (event: ActivityEvent) => {
    const data = event.event_data as Record<string, unknown> | null;
    if (!data) return null;

    if (data.campaign_name) return `Kampania: ${data.campaign_name}`;
    if (data.document_title) return `Dokument: ${data.document_title}`;
    if (data.content_title) return `Treść: ${data.content_title}`;
    if (data.notification_title) return `Powiadomienie: ${data.notification_title}`;
    
    return null;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-lg">Historia aktywności</CardTitle>
            <CardDescription>
              Ostatnie działania klientki w aplikacji
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Ładowanie...
          </div>
        ) : !activities?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            <Smartphone className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Brak zarejestrowanej aktywności</p>
            <p className="text-sm">Historia pojawi się gdy klientka zacznie korzystać z aplikacji</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-1">
              {activities.map((event) => {
                const config = getEventConfig(event.event_type);
                const details = getEventDetails(event);
                const Icon = config.icon;

                return (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className={`mt-0.5 ${config.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{config.label}</span>
                        {event.user_email && (
                          <Badge variant="outline" className="text-xs font-normal">
                            {event.user_email}
                          </Badge>
                        )}
                      </div>
                      {details && (
                        <p className="text-sm text-muted-foreground truncate">
                          {details}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(event.created_at), { 
                          addSuffix: true, 
                          locale: pl 
                        })}
                        {" • "}
                        {format(new Date(event.created_at), "d MMM yyyy, HH:mm", { locale: pl })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
