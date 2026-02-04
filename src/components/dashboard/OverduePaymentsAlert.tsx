import { useEffect, useState } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, DollarSign, Clock } from "lucide-react";
import { format, isToday } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface PaymentAlert {
  id: string;
  amount: number;
  due_date: string;
  status: string;
  client: { salon_name: string } | null;
}

export function OverduePaymentsAlert() {
  const { loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [overduePayments, setOverduePayments] = useState<PaymentAlert[]>([]);
  const [dueTodayPayments, setDueTodayPayments] = useState<PaymentAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalOverdue, setTotalOverdue] = useState(0);

  useEffect(() => {
    // All team members can now view payments
    if (roleLoading) return;
    
    const fetchPayments = async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch overdue payments
      const { data: overdueData, error: overdueError } = await supabase
        .from("payments")
        .select("id, amount, due_date, status, client:clients(salon_name)")
        .eq("status", "overdue")
        .order("due_date", { ascending: true })
        .limit(5);

      // Fetch payments due today (pending status)
      const { data: dueTodayData, error: dueTodayError } = await supabase
        .from("payments")
        .select("id, amount, due_date, status, client:clients(salon_name)")
        .eq("status", "pending")
        .eq("due_date", today)
        .order("due_date", { ascending: true })
        .limit(5);

      if (!overdueError && overdueData) {
        setOverduePayments(overdueData as PaymentAlert[]);
        const total = overdueData.reduce((sum, p) => sum + Number(p.amount), 0);
        setTotalOverdue(total);
      }
      
      if (!dueTodayError && dueTodayData) {
        setDueTodayPayments(dueTodayData as PaymentAlert[]);
      }
      
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
  }, [roleLoading]);

  if (loading || (overduePayments.length === 0 && dueTodayPayments.length === 0)) {
    return null;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pl-PL', { 
      style: 'currency', 
      currency: 'PLN',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-4">
      {/* Due Today Alert */}
      {dueTodayPayments.length > 0 && (
        <Card className="border-yellow-500/50 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-yellow-400">
              <Clock className="h-4 w-4" />
              Płatności na dziś ({dueTodayPayments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {dueTodayPayments.map(payment => (
                <div key={payment.id} className="flex items-center justify-between text-sm p-2 bg-background/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-3 w-3 text-yellow-400" />
                    <span className="font-medium truncate max-w-[120px]">
                      {payment.client?.salon_name || "Nieznany"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-400 font-medium">
                      {formatCurrency(payment.amount)}
                    </span>
                    <Badge variant="outline" className="text-[10px] border-yellow-500/30 text-yellow-400">
                      Dzisiaj
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overdue Alert */}
      {overduePayments.length > 0 && (
        <Card className="border-red-500/50 bg-gradient-to-br from-red-500/10 to-red-600/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-4 w-4" />
              Zaległe płatności ({overduePayments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Łącznie zaległe:</span>
              <span className="text-lg font-bold text-red-400">{formatCurrency(totalOverdue)}</span>
            </div>
            
            <div className="space-y-2">
              {overduePayments.map(payment => (
                <div key={payment.id} className="flex items-center justify-between text-sm p-2 bg-background/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-3 w-3 text-red-400" />
                    <span className="font-medium truncate max-w-[120px]">
                      {payment.client?.salon_name || "Nieznany"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-400 font-medium">
                      {formatCurrency(payment.amount)}
                    </span>
                    <Badge variant="outline" className="text-[10px] border-red-500/30 text-red-400">
                      {format(new Date(payment.due_date), "dd.MM")}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            <Button 
              variant="outline" 
              size="sm" 
              className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
              onClick={() => navigate("/statistics")}
            >
              Zobacz wszystkie
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
