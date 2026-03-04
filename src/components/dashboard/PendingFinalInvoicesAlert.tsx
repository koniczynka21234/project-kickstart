import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ArrowRight, Clock, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { format, differenceInDays, isPast, isToday } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { notifyFinalInvoiceDue } from "@/lib/notifications";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

interface PendingFinalInvoice {
  id: string;
  advance_amount: number;
  total_amount: number;
  remaining_amount: number;
  expected_date: string | null;
  created_at: string;
  client: { id: string; salon_name: string; assigned_to: string | null } | null;
  advance_invoice: { id: string; title: string; data: Record<string, string> } | null;
}

type UrgencyLevel = "overdue" | "urgent" | "upcoming";

function getUrgency(expected_date: string | null): UrgencyLevel {
  if (!expected_date) return "upcoming";
  const date = new Date(expected_date);
  if (isPast(date) && !isToday(date)) return "overdue";
  const daysLeft = differenceInDays(date, new Date());
  if (daysLeft <= 3) return "urgent";
  return "upcoming";
}

export function PendingFinalInvoicesAlert() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isSzef, loading: roleLoading } = useUserRole();
  const [pendingInvoices, setPendingInvoices] = useState<PendingFinalInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (roleLoading || !user) return;

    const fetchPendingInvoices = async () => {
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      const sevenDaysStr = sevenDaysFromNow.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from("pending_final_invoices")
        .select(`
          id,
          advance_amount,
          total_amount,
          remaining_amount,
          expected_date,
          created_at,
          client:clients(id, salon_name, assigned_to),
          advance_invoice:documents!pending_final_invoices_advance_invoice_id_fkey(id, title, data)
        `)
        .eq("status", "pending")
        .lte("expected_date", sevenDaysStr)
        .order("expected_date", { ascending: true })
        .limit(5);

      if (!error && data) {
        let invoices = data as unknown as PendingFinalInvoice[];
        
        // Filter by guardian if not szef
        if (!isSzef) {
          invoices = invoices.filter(inv => inv.client?.assigned_to === user.id);
        }

        setPendingInvoices(invoices);

        // Send bell notifications for urgent invoices (≤3 days or overdue), once per day
        const today = new Date().toISOString().split('T')[0];
        const storageKey = `notified_final_invoices_${today}`;
        const alreadyNotified = new Set<string>(
          JSON.parse(localStorage.getItem(storageKey) || '[]')
        );

        for (const inv of invoices) {
          if (!inv.expected_date || alreadyNotified.has(inv.id)) continue;
          const daysLeft = differenceInDays(new Date(inv.expected_date), new Date());
          if (daysLeft <= 3) {
            // Only notify the guardian + szef users
            const recipientIds: string[] = [];
            if (inv.client?.assigned_to) {
              recipientIds.push(inv.client.assigned_to);
            }
            // Get szef users
            const { data: szefRoles } = await supabase
              .from("user_roles")
              .select("user_id")
              .eq("role", "szef");
            
            const szefIds = (szefRoles || []).map(r => r.user_id);
            for (const sid of szefIds) {
              if (!recipientIds.includes(sid)) recipientIds.push(sid);
            }
            
            if (recipientIds.length > 0) {
              await notifyFinalInvoiceDue(
                inv.client?.id || "",
                inv.client?.salon_name || "Nieznany klient",
                inv.remaining_amount,
                inv.expected_date,
                daysLeft,
                recipientIds
              );
            }
            alreadyNotified.add(inv.id);
          }
        }
        localStorage.setItem(storageKey, JSON.stringify([...alreadyNotified]));
      }
      setLoading(false);
    };

    fetchPendingInvoices();

    const channel = supabase
      .channel('pending-final-invoices-dashboard')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'pending_final_invoices'
      }, fetchPendingInvoices)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, isSzef, roleLoading]);

  const [expanded, setExpanded] = useState(false);

  if (loading || pendingInvoices.length === 0) {
    return null;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pl-PL', { 
      style: 'currency', 
      currency: 'PLN',
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleCreateFinalInvoice = (invoice: PendingFinalInvoice) => {
    const advanceData = invoice.advance_invoice?.data || {};
    
    const finalInvoiceData = {
      type: 'invoice',
      data: {
        ...advanceData,
        invoiceType: 'final',
        advanceAmount: String(invoice.advance_amount),
        invoiceNumber: '',
        pendingFinalInvoiceId: invoice.id,
      }
    };
    
    sessionStorage.setItem("loadDocument", JSON.stringify(finalInvoiceData));
    navigate("/invoice-generator");
  };

  const hasOverdue = pendingInvoices.some(inv => getUrgency(inv.expected_date) === "overdue");
  const hasUrgent = pendingInvoices.some(inv => getUrgency(inv.expected_date) === "urgent");
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
          Faktury końcowe do wystawienia ({pendingInvoices.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Klienci z opłaconą zaliczką czekają na fakturę końcową
        </p>
        
        <div className="space-y-2">
          {(expanded ? pendingInvoices : pendingInvoices.slice(0, 2)).map(invoice => {
            const urgency = getUrgency(invoice.expected_date);
            const isOverdue = urgency === "overdue";
            const isUrgent = urgency === "urgent";
            const accentColor = isOverdue ? "text-red-400" : isUrgent ? "text-orange-400" : "text-yellow-400";
            const iconBg = isOverdue ? "bg-red-500/20" : isUrgent ? "bg-orange-500/20" : "bg-yellow-500/20";
            const badgeBorder = isOverdue ? "border-red-500/30 text-red-400" : isUrgent ? "border-orange-500/30 text-orange-400" : "border-yellow-500/30 text-yellow-400";
            const btnBorder = isOverdue ? "border-red-500/30 text-red-400 hover:bg-red-500/10" : isUrgent ? "border-orange-500/30 text-orange-400 hover:bg-orange-500/10" : "border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10";

            const daysLeft = invoice.expected_date 
              ? differenceInDays(new Date(invoice.expected_date), new Date()) 
              : null;
            
            let dateLabel = "";
            if (invoice.expected_date) {
              if (isOverdue) {
                dateLabel = `Zaległe ${Math.abs(daysLeft!)} dni`;
              } else if (isToday(new Date(invoice.expected_date))) {
                dateLabel = "Dzisiaj!";
              } else {
                dateLabel = format(new Date(invoice.expected_date), "dd.MM");
              }
            }

            return (
              <div 
                key={invoice.id} 
                className="flex items-center justify-between p-3 bg-background/50 rounded-lg hover:bg-background/70 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
                    {isOverdue ? <AlertTriangle className={`h-4 w-4 ${accentColor}`} /> : <FileText className={`h-4 w-4 ${accentColor}`} />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">
                      {invoice.client?.salon_name || "Nieznany klient"}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Zaliczka: {formatCurrency(invoice.advance_amount)}</span>
                      <ArrowRight className="w-3 h-3" />
                      <span className={`${accentColor} font-medium`}>
                        Do zapłaty: {formatCurrency(invoice.remaining_amount)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  {dateLabel && (
                    <Badge variant="outline" className={`text-[10px] ${badgeBorder}`}>
                      <Clock className="w-3 h-3 mr-1" />
                      {dateLabel}
                    </Badge>
                  )}
                  <Button 
                    size="sm" 
                    variant="outline"
                    className={`h-7 text-xs ${btnBorder}`}
                    onClick={() => handleCreateFinalInvoice(invoice)}
                  >
                    Wystaw końcową
                  </Button>
                </div>
              </div>
            );
          })}
          {pendingInvoices.length > 2 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <><ChevronUp className="w-3 h-3 mr-1" /> Zwiń</>
              ) : (
                <><ChevronDown className="w-3 h-3 mr-1" /> Pokaż więcej ({pendingInvoices.length - 2})</>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}