import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ArrowRight, Clock } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface PendingFinalInvoice {
  id: string;
  advance_amount: number;
  total_amount: number;
  remaining_amount: number;
  expected_date: string | null;
  created_at: string;
  client: { id: string; salon_name: string } | null;
  advance_invoice: { id: string; title: string; data: Record<string, string> } | null;
}

export function PendingFinalInvoicesAlert() {
  const navigate = useNavigate();
  const [pendingInvoices, setPendingInvoices] = useState<PendingFinalInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPendingInvoices = async () => {
      const { data, error } = await supabase
        .from("pending_final_invoices")
        .select(`
          id,
          advance_amount,
          total_amount,
          remaining_amount,
          expected_date,
          created_at,
          client:clients(id, salon_name),
          advance_invoice:documents!pending_final_invoices_advance_invoice_id_fkey(id, title, data)
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: true })
        .limit(5);

      if (!error && data) {
        setPendingInvoices(data as unknown as PendingFinalInvoice[]);
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
  }, []);

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
    // Prepare data for final invoice
    const advanceData = invoice.advance_invoice?.data || {};
    
    const finalInvoiceData = {
      type: 'invoice',
      data: {
        ...advanceData,
        invoiceType: 'final',
        advanceAmount: String(invoice.advance_amount),
        // Clear invoice number so a new one is generated
        invoiceNumber: '',
        // Keep remaining amount as the price
        pendingFinalInvoiceId: invoice.id,
      }
    };
    
    sessionStorage.setItem("loadDocument", JSON.stringify(finalInvoiceData));
    navigate("/invoice-generator");
  };

  return (
    <Card className="border-amber-500/50 bg-gradient-to-br from-amber-500/10 to-amber-600/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2 text-amber-400">
          <FileText className="h-4 w-4" />
          Faktury końcowe do wystawienia ({pendingInvoices.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Klienci z opłaconą zaliczką czekają na fakturę końcową
        </p>
        
        <div className="space-y-2">
          {pendingInvoices.map(invoice => (
            <div 
              key={invoice.id} 
              className="flex items-center justify-between p-3 bg-background/50 rounded-lg hover:bg-background/70 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-4 w-4 text-amber-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">
                    {invoice.client?.salon_name || "Nieznany klient"}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Zaliczka: {formatCurrency(invoice.advance_amount)}</span>
                    <ArrowRight className="w-3 h-3" />
                    <span className="text-amber-400 font-medium">
                      Do zapłaty: {formatCurrency(invoice.remaining_amount)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                {invoice.expected_date && (
                  <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400">
                    <Clock className="w-3 h-3 mr-1" />
                    {format(new Date(invoice.expected_date), "dd.MM")}
                  </Badge>
                )}
                <Button 
                  size="sm" 
                  variant="outline"
                  className="h-7 text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                  onClick={() => handleCreateFinalInvoice(invoice)}
                >
                  Wystaw końcową
                </Button>
              </div>
            </div>
          ))}
        </div>

        {pendingInvoices.length >= 5 && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
            onClick={() => navigate("/statistics")}
          >
            Zobacz wszystkie
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

