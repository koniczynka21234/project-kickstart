import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, AlertTriangle, ChevronRight, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { differenceInDays, format } from "date-fns";
import { pl } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

interface PendingClient {
  id: string;
  salon_name: string;
  created_at: string;
  assigned_to: string | null;
}

function getUrgency(created_at: string) {
  const days = differenceInDays(new Date(), new Date(created_at));
  if (days >= 3) return "overdue";
  if (days >= 1) return "urgent";
  return "upcoming";
}

const urgencyStyles = {
  overdue: "text-red-400 bg-red-500/15 border-red-500/30",
  urgent: "text-orange-400 bg-orange-500/15 border-orange-500/30",
  upcoming: "text-yellow-400 bg-yellow-500/15 border-yellow-500/30",
};

const urgencyLabels = {
  overdue: "Pilne!",
  urgent: "Wczoraj",
  upcoming: "Nowy",
};

export function PendingContractsAlert() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isSzef, loading: roleLoading } = useUserRole();
  const [clients, setClients] = useState<PendingClient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (roleLoading || !user) return;

    const fetch = async () => {
      let query = supabase
        .from('clients')
        .select('id, salon_name, created_at, assigned_to')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (!isSzef) {
        query = query.eq('assigned_to', user.id);
      }

      const { data } = await query;
      if (data) setClients(data);
      setLoading(false);
    };
    fetch();
  }, [user?.id, isSzef, roleLoading]);

  const [expanded, setExpanded] = useState(false);

  if (loading || clients.length === 0) return null;

  const visibleClients = expanded ? clients : clients.slice(0, 2);
  const hasMore = clients.length > 2;
  return (
    <Card className="border-blue-500/30 bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center animate-pulse">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Umowy do wygenerowania</h3>
              <p className="text-xs text-muted-foreground">
                {clients.length} {clients.length === 1 ? 'klient czeka' : 'klientów czeka'} na umowę
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/contract-generator")} 
            className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
          >
            Generator umów <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        <div className="space-y-2">
          {visibleClients.map((client) => {
            const urgency = getUrgency(client.created_at);
            return (
              <div
                key={client.id}
                className="flex items-center gap-3 bg-background/60 rounded-xl p-3 cursor-pointer hover:bg-background/80 transition-all hover:scale-[1.02] border border-border/30 hover:border-blue-500/30"
                onClick={() => navigate(`/clients/${client.id}`)}
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500/30 to-cyan-500/20 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm text-foreground truncate">{client.salon_name}</p>
                  <p className="text-xs text-muted-foreground">
                    od {format(new Date(client.created_at), 'd MMM', { locale: pl })}
                  </p>
                </div>
                <Badge variant="outline" className={`text-[10px] shrink-0 ${urgencyStyles[urgency]}`}>
                  {urgencyLabels[urgency]}
                </Badge>
              </div>
            );
          })}
          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <><ChevronUp className="w-3 h-3 mr-1" /> Zwiń</>
              ) : (
                <><ChevronDown className="w-3 h-3 mr-1" /> Pokaż więcej ({clients.length - 2})</>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}