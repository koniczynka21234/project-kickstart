import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import { 
  FileText, MessageSquare, CheckCircle, UserPlus, 
  FileSignature, Receipt, Presentation, Target 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ActivityItem {
  id: string;
  type: "document" | "task" | "message" | "lead" | "client";
  title: string;
  description: string;
  timestamp: string;
  user?: {
    name: string;
    email: string;
  };
  metadata?: {
    docType?: string;
  };
}

const typeIcons: Record<string, React.ElementType> = {
  document: FileText,
  task: CheckCircle,
  message: MessageSquare,
  lead: Target,
  client: UserPlus,
  report: FileText,
  invoice: Receipt,
  contract: FileSignature,
  presentation: Presentation,
};

const typeColors: Record<string, string> = {
  document: "text-pink-400 bg-pink-500/10",
  task: "text-orange-400 bg-orange-500/10",
  message: "text-blue-400 bg-blue-500/10",
  lead: "text-purple-400 bg-purple-500/10",
  client: "text-emerald-400 bg-emerald-500/10",
  report: "text-pink-400 bg-pink-500/10",
  invoice: "text-emerald-400 bg-emerald-500/10",
  contract: "text-blue-400 bg-blue-500/10",
  presentation: "text-purple-400 bg-purple-500/10",
};

export function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      // Fetch recent documents, tasks, messages in parallel
      const [docsRes, tasksRes, messagesRes] = await Promise.all([
        supabase
          .from("documents")
          .select("id, title, type, created_at, created_by")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("tasks")
          .select("id, title, status, created_at, created_by, completed_at")
          .order("updated_at", { ascending: false })
          .limit(5),
        supabase
          .from("team_messages")
          .select("id, content, created_at, user_id")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      // Get user profiles for the activities
      const userIds = new Set<string>();
      docsRes.data?.forEach(d => d.created_by && userIds.add(d.created_by));
      tasksRes.data?.forEach(t => t.created_by && userIds.add(t.created_by));
      messagesRes.data?.forEach(m => m.user_id && userIds.add(m.user_id));

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", Array.from(userIds));

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const items: ActivityItem[] = [];

      // Documents
      docsRes.data?.forEach(doc => {
        const profile = profileMap.get(doc.created_by || "");
        items.push({
          id: `doc-${doc.id}`,
          type: "document",
          title: `Nowy ${doc.type === "report" ? "raport" : doc.type === "invoice" ? "faktura" : doc.type === "contract" ? "umowa" : "prezentacja"}`,
          description: doc.title,
          timestamp: doc.created_at,
          user: profile ? { name: profile.full_name || profile.email || "", email: profile.email || "" } : undefined,
          metadata: { docType: doc.type },
        });
      });

      // Tasks
      tasksRes.data?.forEach(task => {
        const profile = profileMap.get(task.created_by || "");
        const isCompleted = task.status === "done";
        items.push({
          id: `task-${task.id}`,
          type: "task",
          title: isCompleted ? "Zadanie ukończone" : "Nowe zadanie",
          description: task.title,
          timestamp: isCompleted ? task.completed_at || task.created_at : task.created_at,
          user: profile ? { name: profile.full_name || profile.email || "", email: profile.email || "" } : undefined,
        });
      });

      // Messages
      messagesRes.data?.forEach(msg => {
        const profile = profileMap.get(msg.user_id || "");
        items.push({
          id: `msg-${msg.id}`,
          type: "message",
          title: "Wiadomość w czacie",
          description: msg.content.length > 60 ? msg.content.slice(0, 60) + "..." : msg.content,
          timestamp: msg.created_at,
          user: profile ? { name: profile.full_name || profile.email || "", email: profile.email || "" } : undefined,
        });
      });

      // Sort by timestamp
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivities(items.slice(0, 10));
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-muted rounded w-1/2" />
              <div className="h-2 bg-muted rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        Brak aktywności do wyświetlenia
      </div>
    );
  }

  return (
    <ScrollArea className="h-[320px] pr-4">
      <div className="space-y-4">
        {activities.map((activity, index) => {
          const Icon = activity.metadata?.docType 
            ? typeIcons[activity.metadata.docType] || typeIcons[activity.type]
            : typeIcons[activity.type];
          const colorClass = activity.metadata?.docType 
            ? typeColors[activity.metadata.docType] || typeColors[activity.type]
            : typeColors[activity.type];

          return (
            <div
              key={activity.id}
              className={cn(
                "flex gap-3 group",
                index !== activities.length - 1 && "pb-4 border-b border-border/30"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                colorClass
              )}>
                <Icon className="w-4 h-4" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-foreground">
                    {activity.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.timestamp), { 
                      addSuffix: true, 
                      locale: pl 
                    })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {activity.description}
                </p>
                {activity.user && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Avatar className="w-4 h-4">
                      <AvatarFallback className="text-[8px] bg-muted">
                        {activity.user.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground/70">
                      {activity.user.name.split("@")[0]}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
