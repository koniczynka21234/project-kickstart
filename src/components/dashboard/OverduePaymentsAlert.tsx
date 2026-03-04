import { useEffect, useState } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, DollarSign, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface PaymentAlert {
  id: string;
  amount: number;
  due_date: string;
  status: string;
  client_id: string;
  client: { salon_name: string; assigned_to: string | null } | null;
}

type Urgency = "overdue" | "today" | "urgent" | "upcoming";

function getPaymentUrgency(payment: PaymentAlert): Urgency {
  if (payment.status === "overdue") return "overdue";
  const daysLeft = differenceInDays(new Date(payment.due_date), new Date());
  if (daysLeft <= 0) return "today";
  if (daysLeft <= 3) return "urgent";
  return "upcoming";
}

const urgencyConfig: Record<Urgency, { color: string; iconBg: string; badgeBorder: string; label: (d: string) => string }> = {
  overdue: {
    color: "text-red-400",
    iconBg: "bg-red-500/20",
    badgeBorder: "border-red-500/30 text-red-400",
    label: (d) => format(new Date(d), "dd.MM"),
  },
  today: {
    color: "text-orange-400",
    iconBg: "bg-orange-500/20",
    badgeBorder: "border-orange-500/30 text-orange-400",
    label: () => "Dzisiaj",
  },
  urgent: {
    color: "text-yellow-400",
    iconBg: "bg-yellow-500/20",
    badgeBorder: "border-yellow-500/30 text-yellow-400",
    label: (d) => {
      const days = differenceInDays(new Date(d), new Date());
      return `za ${days} dni`;
    },
  },
  upcoming: {
    color: "text-yellow-400",
    iconBg: "bg-yellow-500/20",
    badgeBorder: "border-yellow-500/30 text-yellow-400",
    label: (d) => format(new Date(d), "dd.MM"),
  },
};

export function OverduePaymentsAlert() {
  const { loading: roleLoading, isSzef } = useUserRole();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<PaymentAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (roleLoading || !user) return;
    
    const fetchPayments = async () => {
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      const threeDaysStr = threeDaysFromNow.toISOString().split('T')[0];

      // Fetch overdue payments
      const { data: overdueData } = await supabase
        .from("payments")
        .select("id, amount, due_date, status, client_id, client:clients(salon_name, assigned_to)")
        .eq("status", "overdue")
        .order("due_date", { ascending: true })
        .limit(10);

      // Fetch pending payments due within 3 days (including today)
      const { data: upcomingData } = await supabase
        .from("payments")
        .select("id, amount, due_date, status, client_id, client:clients(salon_name, assigned_to)")
        .eq("status", "pending")
        .lte("due_date", threeDaysStr)
        .order("due_date", { ascending: true })
        .limit(10);

      let all = [
        ...((overdueData || []) as PaymentAlert[]),
        ...((upcomingData || []) as PaymentAlert[]),
      ];

      // Filter by guardian if not szef
      if (!isSzef) {
        all = all.filter(p => p.client?.assigned_to === user.id);
      }

      // Deduplicate by id
      const unique = Array.from(new Map(all.map(p => [p.id, p])).values());
      // Sort: overdue first, then by date
      unique.sort((a, b) => {
        const ua = getPaymentUrgency(a);
        const ub = getPaymentUrgency(b);
        const order: Record<Urgency, number> = { overdue: 0, today: 1, urgent: 2, upcoming: 3 };
        if (order[ua] !== order[ub]) return order[ua] - order[ub];
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      });

      setPayments(unique.slice(0, 8));
      setLoading(false);
    };

    fetchPayments();

    const channel = supabase
      .channel('payments-dashboard-alerts')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'payments'
      }, fetchPayments)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roleLoading, user?.id, isSzef]);

  const [expanded, setExpanded] = useState(false);

  if (loading || payments.length === 0) {
    return null;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pl-PL', { 
      style: 'currency', 
      currency: 'PLN',
      maximumFractionDigits: 0
    }).format(value);
  };

  const hasOverdue = payments.some(p => p.status === "overdue");
  const overdueTotal = payments
    .filter(p => p.status === "overdue")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const hasToday = payments.some(p => getPaymentUrgency(p) === "today");
  
  const borderColor = hasOverdue ? "border-red-500/50" : hasToday ? "border-orange-500/50" : "border-yellow-500/50";
  const bgGradient = hasOverdue
    ? "bg-gradient-to-br from-red-500/10 to-red-600/5"
    : hasToday
      ? "bg-gradient-to-br from-orange-500/10 to-orange-600/5"
      : "bg-gradient-to-br from-yellow-500/10 to-yellow-600/5";
  const titleColor = hasOverdue ? "text-red-400" : hasToday ? "text-orange-400" : "text-yellow-400";
  const TitleIcon = hasOverdue ? AlertTriangle : Clock;

  return (
    <Card className={`${borderColor} ${bgGradient} ${hasOverdue ? 'animate-[pulse_3s_ease-in-out_infinite]' : ''}`}>
      <CardHeader className="pb-2">
        <CardTitle className={`text-base flex items-center gap-2 ${titleColor}`}>
          <TitleIcon className="h-4 w-4" />
          Płatności wymagające uwagi ({payments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {hasOverdue && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Łącznie zaległe:</span>
            <span className="text-sm font-bold text-red-400">{formatCurrency(overdueTotal)}</span>
          </div>
        )}
        
        <div className="space-y-2">
          {(expanded ? payments : payments.slice(0, 2)).map(payment => {
            const urgency = getPaymentUrgency(payment);
            const config = urgencyConfig[urgency];
            const IconComp = urgency === "overdue" ? AlertTriangle : DollarSign;

            return (
              <div key={payment.id} className="flex items-center justify-between p-3 bg-background/50 rounded-lg hover:bg-background/70 transition-colors">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-9 h-9 rounded-lg ${config.iconBg} flex items-center justify-center flex-shrink-0`}>
                    <IconComp className={`h-4 w-4 ${config.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">
                      {payment.client?.salon_name || "Nieznany"}
                    </p>
                    <p className={`text-xs ${config.color} font-medium`}>
                      {formatCurrency(payment.amount)}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className={`text-[10px] ${config.badgeBorder}`}>
                  <Clock className="w-3 h-3 mr-1" />
                  {config.label(payment.due_date)}
                </Badge>
              </div>
            );
          })}
          {payments.length > 2 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <><ChevronUp className="w-3 h-3 mr-1" /> Zwiń</>
              ) : (
                <><ChevronDown className="w-3 h-3 mr-1" /> Pokaż więcej ({payments.length - 2})</>
              )}
            </Button>
          )}
        </div>

        <Button 
          variant="outline" 
          size="sm" 
          className={`w-full ${hasOverdue ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' : hasToday ? 'border-orange-500/30 text-orange-400 hover:bg-orange-500/10' : 'border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10'}`}
          onClick={() => navigate("/statistics?tab=invoices")}
        >
          Zobacz wszystkie
        </Button>
      </CardContent>
    </Card>
  );
}