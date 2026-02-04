import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DollarSign, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  FileText,
  CreditCard,
  Check,
  X,
  Trash2,
  Loader2,
  ArrowRight,
  Plus
} from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Payment {
  id: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: string;
  payment_method: string | null;
  notes: string | null;
  document: {
    id: string;
    title: string;
    type: string;
    data: {
      invoiceType?: string;
    } | null;
  } | null;
}

interface PendingFinalInvoice {
  id: string;
  advance_amount: number;
  total_amount: number;
  remaining_amount: number;
  expected_date: string | null;
  status: string;
  advance_invoice: { id: string; title: string } | null;
}

interface ClientPaymentsSectionProps {
  clientId: string;
  clientName?: string;
  contractAmount?: number | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  paid: { 
    label: 'Opłacone', 
    color: 'bg-green-500/20 text-green-400 border-green-500/30',
    icon: CheckCircle2
  },
  pending: { 
    label: 'Oczekujące', 
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    icon: Clock
  },
  overdue: { 
    label: 'Zaległe', 
    color: 'bg-red-500/20 text-red-400 border-red-500/30',
    icon: AlertTriangle
  },
  cancelled: { 
    label: 'Anulowane', 
    color: 'bg-muted text-muted-foreground border-border',
    icon: DollarSign
  },
};

export function ClientPaymentsSection({ clientId, clientName, contractAmount }: ClientPaymentsSectionProps) {
  const navigate = useNavigate();
  const { isSzef } = useUserRole();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pendingFinalInvoices, setPendingFinalInvoices] = useState<PendingFinalInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingPaymentId, setUpdatingPaymentId] = useState<string | null>(null);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    overdue: 0,
    pendingFinalTotal: 0,
  });

  useEffect(() => {
    fetchPayments();
    fetchPendingFinalInvoices();

    const paymentsChannel = supabase
      .channel(`client-payments-${clientId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'payments',
        filter: `client_id=eq.${clientId}`
      }, fetchPayments)
      .subscribe();

    const pendingChannel = supabase
      .channel(`client-pending-invoices-${clientId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'pending_final_invoices',
        filter: `client_id=eq.${clientId}`
      }, fetchPendingFinalInvoices)
      .subscribe();

    return () => {
      supabase.removeChannel(paymentsChannel);
      supabase.removeChannel(pendingChannel);
    };
  }, [clientId]);

  const fetchPayments = async () => {
    const { data, error } = await supabase
      .from("payments")
      .select(`
        id, 
        amount, 
        due_date, 
        paid_date, 
        status, 
        payment_method, 
        notes,
        document:documents(id, title, type, data)
      `)
      .eq("client_id", clientId)
      .order("due_date", { ascending: false });

    if (!error && data) {
      setPayments(data as Payment[]);
      
      // Calculate stats - will be updated with pending final invoices
      const totalAmount = data.reduce((sum, p) => sum + Number(p.amount), 0);
      const paidAmount = data.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0);
      const pendingAmount = data.filter(p => p.status === 'pending').reduce((sum, p) => sum + Number(p.amount), 0);
      const overdueAmount = data.filter(p => p.status === 'overdue').reduce((sum, p) => sum + Number(p.amount), 0);
      
      setStats(prev => ({
        ...prev,
        total: totalAmount + prev.pendingFinalTotal,
        paid: paidAmount,
        pending: pendingAmount,
        overdue: overdueAmount,
      }));
    }
    setLoading(false);
  };

  const fetchPendingFinalInvoices = async () => {
    const { data, error } = await supabase
      .from("pending_final_invoices")
      .select(`
        id,
        advance_amount,
        total_amount,
        remaining_amount,
        expected_date,
        status,
        advance_invoice:documents!pending_final_invoices_advance_invoice_id_fkey(id, title)
      `)
      .eq("client_id", clientId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPendingFinalInvoices(data as unknown as PendingFinalInvoice[]);
      
      // Add pending final amounts to stats
      const pendingFinalTotal = data.reduce((sum, p) => sum + Number(p.remaining_amount), 0);
      setStats(prev => ({
        ...prev,
        pendingFinalTotal,
        total: prev.paid + prev.pending + prev.overdue + pendingFinalTotal,
      }));
    }
  };

  const handleCreateFinalInvoice = (invoice: PendingFinalInvoice) => {
    const finalInvoiceData = {
      type: 'invoice',
      data: {
        clientId: clientId,
        clientName: clientName || '',
        invoiceType: 'final',
        advanceAmount: String(invoice.advance_amount),
        totalContractAmount: String(invoice.total_amount),
        invoiceNumber: '',
        pendingFinalInvoiceId: invoice.id,
        // Pre-populate service with remaining amount (total - advance = final)
        services: [{ 
          id: crypto.randomUUID(), 
          description: 'Obsługa marketingowa – dopłata końcowa', 
          quantity: 1, 
          price: String(invoice.remaining_amount) 
        }],
      }
    };
    
    sessionStorage.setItem("loadDocument", JSON.stringify(finalInvoiceData));
    navigate("/invoice-generator");
  };

  const handleCreateNewInvoice = () => {
    // Pre-populate invoice generator with client data
    const invoiceData = {
      type: 'invoice',
      data: {
        clientId: clientId,
        clientName: clientName || '',
        invoiceType: 'full',
      }
    };
    
    sessionStorage.setItem("loadDocument", JSON.stringify(invoiceData));
    navigate("/invoice-generator");
  };

  const handleCreateFirstInvoice = () => {
    const invoiceData = {
      type: 'invoice',
      data: {
        clientId: clientId,
        clientName: clientName || '',
        invoiceNumber: '',
        invoiceType: 'advance',
        // Store the contract amount for tracking
        totalContractAmount: contractAmount ? String(contractAmount) : '',
        // Prefill service with 50% of contract (advance payment)
        services: contractAmount
          ? [{ id: crypto.randomUUID(), description: 'Obsługa marketingowa – zaliczka', quantity: 1, price: String(Math.round(contractAmount / 2)) }]
          : undefined,
      }
    };

    sessionStorage.setItem("loadDocument", JSON.stringify(invoiceData));
    navigate("/invoice-generator");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pl-PL', { 
      style: 'currency', 
      currency: 'PLN',
      maximumFractionDigits: 0
    }).format(value);
  };

  const updatePaymentStatus = async (paymentId: string, newStatus: 'paid' | 'pending') => {
    if (!isSzef) return;
    
    setUpdatingPaymentId(paymentId);
    try {
      const updateData: { status: string; paid_date?: string | null } = {
        status: newStatus,
      };
      
      if (newStatus === 'paid') {
        updateData.paid_date = new Date().toISOString().split('T')[0];
      } else {
        updateData.paid_date = null;
      }
      
      const { error } = await supabase
        .from('payments')
        .update(updateData)
        .eq('id', paymentId);
      
      if (error) throw error;
      
      toast.success(newStatus === 'paid' ? 'Płatność oznaczona jako opłacona' : 'Status płatności zmieniony');
      fetchPayments();
    } catch (err) {
      console.error('Error updating payment:', err);
      toast.error('Nie udało się zaktualizować statusu płatności');
    } finally {
      setUpdatingPaymentId(null);
    }
  };

  const deletePayment = async (paymentId: string) => {
    if (!isSzef) return;
    
    setDeletingPaymentId(paymentId);
    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', paymentId);
      
      if (error) throw error;
      
      toast.success('Płatność została usunięta');
      fetchPayments();
    } catch (err) {
      console.error('Error deleting payment:', err);
      toast.error('Nie udało się usunąć płatności');
    } finally {
      setDeletingPaymentId(null);
    }
  };

  if (loading) {
    return (
      <Card className="border-border/50 bg-card/80">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Płatności
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-16 bg-secondary/30 rounded-lg" />
            <div className="h-16 bg-secondary/30 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const overduePayments = payments.filter(p => p.status === 'overdue');
  const hasOverdue = overduePayments.length > 0;

  return (
    <Card className={`border-border/50 bg-card/80 ${hasOverdue ? 'border-red-500/30' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className={`w-5 h-5 ${hasOverdue ? 'text-red-400' : 'text-primary'}`} />
            Płatności ({payments.length})
            {hasOverdue && (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {overduePayments.length} zaległe
              </Badge>
            )}
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs border-primary/30 text-primary hover:bg-primary/10"
            onClick={handleCreateNewInvoice}
          >
            <Plus className="w-3 h-3 mr-1" />
            Wystaw fakturę
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* First invoice reminder after lead conversion */}
        {payments.length === 0 && pendingFinalInvoices.length === 0 && contractAmount && (
          <div className="p-3 rounded-lg bg-secondary/30 border border-primary/20 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">Brak pierwszej faktury</p>
              <p className="text-xs text-muted-foreground">
                Wystaw fakturę startową (kwota współpracy: {formatCurrency(contractAmount)} / miesiąc).
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs border-primary/30 text-primary hover:bg-primary/10 shrink-0"
              onClick={handleCreateFirstInvoice}
            >
              <FileText className="w-3 h-3 mr-1" />
              Wystaw teraz
            </Button>
          </div>
        )}
        {/* Stats Summary - Clean horizontal layout */}
        {(payments.length > 0 || pendingFinalInvoices.length > 0) && (
          <div className="flex flex-wrap gap-3 text-sm">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Wartość umów:</span>
              <span className="font-semibold">{formatCurrency(stats.total)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-green-400">Opłacone:</span>
              <span className="font-semibold text-green-400">{formatCurrency(stats.paid)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-yellow-400">Oczekujące:</span>
              <span className="font-semibold text-yellow-400">{formatCurrency(stats.pending)}</span>
            </div>
            {stats.overdue > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-red-400">Zaległe:</span>
                <span className="font-semibold text-red-400">{formatCurrency(stats.overdue)}</span>
              </div>
            )}
            {stats.pendingFinalTotal > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-amber-400">Do wystawienia:</span>
                <span className="font-semibold text-amber-400">{formatCurrency(stats.pendingFinalTotal)}</span>
              </div>
            )}
          </div>
        )}

        {/* Pending Final Invoices Section */}
        {pendingFinalInvoices.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <FileText className="w-4 h-4" />
              Faktury końcowe do wystawienia ({pendingFinalInvoices.length})
            </div>
            {pendingFinalInvoices.map(invoice => {
              const isApproachingDate = invoice.expected_date && 
                new Date(invoice.expected_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
              const isOverdue = invoice.expected_date && 
                new Date(invoice.expected_date) < new Date();
              
              return (
                <div 
                  key={invoice.id}
                  className={`flex items-center justify-between gap-2 p-2.5 rounded-lg transition-colors ${
                    isOverdue 
                      ? 'bg-red-500/10 border border-red-500/30' 
                      : isApproachingDate 
                        ? 'bg-amber-500/10 border border-amber-500/30'
                        : 'bg-secondary/30'
                  }`}
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <div className="flex items-center gap-2 text-xs flex-wrap">
                      <span className="text-muted-foreground">Zaliczka:</span>
                      <span className="font-medium">{formatCurrency(invoice.advance_amount)}</span>
                      <ArrowRight className="w-3 h-3 text-muted-foreground" />
                      <span className={`font-medium ${isOverdue ? 'text-red-400' : isApproachingDate ? 'text-amber-400' : 'text-primary'}`}>
                        Pozostało: {formatCurrency(invoice.remaining_amount)}
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Umowa: {formatCurrency(invoice.total_amount)}
                      {invoice.expected_date && (
                        <span className={`ml-2 ${isOverdue ? 'text-red-400' : isApproachingDate ? 'text-amber-400' : ''}`}>
                          • Termin: {format(new Date(invoice.expected_date), 'd MMM yyyy', { locale: pl })}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className={`h-6 text-xs shrink-0 ${
                      isOverdue 
                        ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' 
                        : isApproachingDate 
                          ? 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10'
                          : 'border-primary/30 text-primary hover:bg-primary/10'
                    }`}
                    onClick={() => handleCreateFinalInvoice(invoice)}
                  >
                    Wystaw
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* Payments List */}
        {payments.length === 0 ? (
          <div className="py-8 text-center">
            <DollarSign className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Brak zarejestrowanych płatności</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[350px] overflow-y-auto">
            {payments.map((payment) => {
              const config = statusConfig[payment.status] || statusConfig.pending;
              const StatusIcon = config.icon;
              
              // Get invoice type from document data
              const invoiceType = payment.document?.data?.invoiceType;
              const invoiceTypeLabel = invoiceType === 'advance' ? 'Zaliczka' :
                invoiceType === 'final' ? 'Końcowa' : 
                invoiceType === 'full' ? 'Pełna' : null;

              return (
                <div 
                  key={payment.id} 
                  className={`flex items-center justify-between gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors ${
                    payment.status === 'overdue' ? 'border border-red-500/30' : ''
                  }`}
                >
                  {/* Left: Icon + Amount + Status */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      payment.status === 'paid' ? 'bg-green-500/20' :
                      payment.status === 'overdue' ? 'bg-red-500/20' :
                      'bg-yellow-500/20'
                    }`}>
                      <StatusIcon className={`w-4 h-4 ${
                        payment.status === 'paid' ? 'text-green-400' :
                        payment.status === 'overdue' ? 'text-red-400' :
                        'text-yellow-400'
                      }`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold">{formatCurrency(payment.amount)}</span>
                        <Badge className={`text-[10px] px-1.5 py-0 ${config.color}`}>
                          {config.label}
                        </Badge>
                        {invoiceTypeLabel && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">
                            {invoiceTypeLabel}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Termin: {format(new Date(payment.due_date), 'd MMM yyyy', { locale: pl })}
                        {payment.paid_date && (
                          <span className="text-green-400 ml-2">
                            • Opłacono {format(new Date(payment.paid_date), 'd MMM', { locale: pl })}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {isSzef && payment.status !== 'paid' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-green-400 hover:text-green-300 hover:bg-green-500/10"
                        onClick={() => updatePaymentStatus(payment.id, 'paid')}
                        disabled={updatingPaymentId === payment.id}
                        title="Oznacz jako opłacone"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                    {isSzef && payment.status === 'paid' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-yellow-400 hover:bg-yellow-500/10"
                        onClick={() => updatePaymentStatus(payment.id, 'pending')}
                        disabled={updatingPaymentId === payment.id}
                        title="Cofnij opłacenie"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                    {payment.document && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => navigate(`/history?document=${payment.document!.id}`)}
                        title="Zobacz fakturę"
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                    )}
                    {isSzef && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            disabled={deletingPaymentId === payment.id}
                            title="Usuń płatność"
                          >
                            {deletingPaymentId === payment.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Usunąć płatność?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Czy na pewno chcesz usunąć płatność na kwotę {formatCurrency(payment.amount)}? 
                              Ta operacja jest nieodwracalna.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Anuluj</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deletePayment(payment.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Usuń
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Link to Statistics */}
        {payments.length > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => navigate('/statistics')}
          >
            Zobacz wszystkie statystyki płatności
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
