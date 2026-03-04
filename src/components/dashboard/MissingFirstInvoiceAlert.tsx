import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, AlertTriangle, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { differenceInDays, format } from "date-fns";
import { pl } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

interface ClientMissingInvoice {
  id: string;
  salon_name: string;
  contract_amount: number | null;
  created_at: string;
  assigned_to: string | null;
}

function getClientUrgency(created_at: string) {
  const daysSinceCreation = differenceInDays(new Date(), new Date(created_at));
  if (daysSinceCreation >= 2) return "overdue";
  if (daysSinceCreation >= 1) return "urgent";
  return "upcoming";
}

export function MissingFirstInvoiceAlert() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isSzef, loading: roleLoading } = useUserRole();
  const [clients, setClients] = useState<ClientMissingInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (roleLoading || !user) return;

    const fetchClientsWithoutInvoices = async () => {
      let query = supabase
        .from("clients")
        .select("id, salon_name, contract_amount, created_at, assigned_to")
        .eq("status", "active")
        .not("contract_amount", "is", null)
        .order("created_at", { ascending: true });

      // Pracownik widzi tylko swoich klientów
      if (!isSzef) {
        query = query.eq("assigned_to", user.id);
      }

      const { data: allClients, error: clientsError } = await query;

      if (clientsError || !allClients || allClients.length === 0) {
        setLoading(false);
        return;
      }

      const clientIds = allClients.map(c => c.id);
      const [docsRes, paymentsRes] = await Promise.all([
        supabase.from("documents").select("client_id").eq("type", "invoice").in("client_id", clientIds),
        supabase.from("payments").select("client_id").in("client_id", clientIds),
      ]);

      const clientsWithInvoices = new Set((docsRes.data || []).map(d => d.client_id));
      const clientsWithPayments = new Set((paymentsRes.data || []).map(p => p.client_id));

      const missing = allClients.filter(
        c => !clientsWithInvoices.has(c.id) && !clientsWithPayments.has(c.id)
      );

      setClients(missing);
      setLoading(false);
    };

    fetchClientsWithoutInvoices();
  }, [user?.id, isSzef, roleLoading]);

  const [expanded, setExpanded] = useState(false);
  if (loading || clients.length === 0) return null;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN", maximumFractionDigits: 0 }).format(value);

  const handleCreateInvoice = (client: ClientMissingInvoice) => {
    const invoiceData = {
      type: "invoice",
      data: {
        clientId: client.id,
        clientName: client.salon_name,
        invoiceType: "advance",
        totalContractAmount: client.contract_amount ? String(client.contract_amount) : "",
        services: client.contract_amount
          ? [{ id: crypto.randomUUID(), description: "Obsługa marketingowa – zaliczka", quantity: 1, price: String(Math.round(client.contract_amount / 2)) }]
          : undefined,
      },
    };
    sessionStorage.setItem("loadDocument", JSON.stringify(invoiceData));
    navigate("/invoice-generator");
  };

  const hasOverdue = clients.some(c => getClientUrgency(c.created_at) === "overdue");
  const hasUrgent = clients.some(c => getClientUrgency(c.created_at) === "urgent");
  const borderColor = hasOverdue ? "border-red-500/50" : hasUrgent ? "border-orange-500/50" : "border-yellow-500/50";
  const bgGradient = hasOverdue
    ? "bg-gradient-to-br from-red-500/10 to-red-600/5"
    : hasUrgent
      ? "bg-gradient-to-br from-orange-500/10 to-orange-600/5"
      : "bg-gradient-to-br from-yellow-500/10 to-yellow-600/5";
  const titleColor = hasOverdue ? "text-red-400" : hasUrgent ? "text-orange-400" : "text-yellow-400";
  const TitleIcon = hasOverdue ? AlertTriangle : FileText;

  return (
    <Card className={`${borderColor} ${bgGradient} ${hasOverdue ? 'animate-[pulse_3s_ease-in-out_infinite]' : ''}`}>
      <CardHeader className="pb-2">
        <CardTitle className={`text-base flex items-center gap-2 ${titleColor}`}>
          <TitleIcon className="h-4 w-4" />
          Brak pierwszej faktury ({clients.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Nowi klienci bez wystawionej faktury startowej
        </p>
        <div className="space-y-2">
          {(expanded ? clients : clients.slice(0, 2)).map(client => {
            const urgency = getClientUrgency(client.created_at);
            const isOverdue = urgency === "overdue";
            const isUrgent = urgency === "urgent";
            const accentColor = isOverdue ? "text-red-400" : isUrgent ? "text-orange-400" : "text-yellow-400";
            const iconBg = isOverdue ? "bg-red-500/20" : isUrgent ? "bg-orange-500/20" : "bg-yellow-500/20";
            const badgeBorder = isOverdue ? "border-red-500/30 text-red-400" : isUrgent ? "border-orange-500/30 text-orange-400" : "border-yellow-500/30 text-yellow-400";
            const btnClass = isOverdue ? "border-red-500/30 text-red-400 hover:bg-red-500/10" : isUrgent ? "border-orange-500/30 text-orange-400 hover:bg-orange-500/10" : "border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10";

            const daysSince = differenceInDays(new Date(), new Date(client.created_at));
            const dateLabel = daysSince === 0 ? "Dzisiaj" : `${daysSince} dni temu`;

            return (
              <div
                key={client.id}
                className="flex items-center justify-between p-3 bg-background/50 rounded-lg hover:bg-background/70 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
                    {isOverdue ? <AlertTriangle className={`h-4 w-4 ${accentColor}`} /> : <FileText className={`h-4 w-4 ${accentColor}`} />}
                  </div>
                  <div className="min-w-0">
                    <p
                      className="font-medium text-sm truncate cursor-pointer hover:text-primary transition-colors"
                      onClick={() => navigate(`/clients/${client.id}`)}
                    >
                      {client.salon_name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{client.contract_amount ? formatCurrency(client.contract_amount) : "—"} / mies.</span>
                      <span>•</span>
                      <span className={accentColor}>Klient od: {format(new Date(client.created_at), "d MMM", { locale: pl })}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant="outline" className={`text-[10px] hidden sm:flex ${badgeBorder}`}>
                    <Clock className="w-3 h-3 mr-1" />
                    {dateLabel}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    className={`h-7 text-xs ${btnClass}`}
                    onClick={() => handleCreateInvoice(client)}
                  >
                    Wystaw
                  </Button>
                </div>
              </div>
            );
          })}
          {clients.length > 2 && (
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