import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  Users, 
  Target, 
  FileText, 
  DollarSign, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  Activity,
  Receipt,
  Eye,
  ExternalLink,
  ArrowRight,
  FileWarning
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from "date-fns";
import { pl } from "date-fns/locale";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPie, Pie, Cell, Legend } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface OverviewStats {
  totalRevenue: number;
  monthlyRevenue: number;
  pendingPayments: number;
  overduePayments: number;
  totalClients: number;
  activeClients: number;
  totalLeads: number;
  convertedLeads: number;
  totalCampaigns: number;
  activeCampaigns: number;
  totalDocuments: number;
  totalTasks: number;
  completedTasks: number;
}

interface PaymentWithClient {
  id: string;
  amount: number;
  due_date: string;
  status: string;
  paid_date: string | null;
  client: { salon_name: string; id: string } | null;
  document_id: string | null;
}

interface PendingFinalInvoice {
  id: string;
  advance_amount: number;
  total_amount: number;
  remaining_amount: number;
  expected_date: string | null;
  status: string;
  client: { id: string; salon_name: string } | null;
  advance_invoice: { id: string; title: string } | null;
  created_at: string;
}

interface InvoiceDocument {
  id: string;
  title: string;
  subtitle: string | null;
  created_at: string;
  client: { salon_name: string; id: string } | null;
  data: {
    invoiceNumber?: string;
    totalGross?: number;
    issueDate?: string;
    dueDate?: string;
    invoiceType?: 'advance' | 'final' | 'full';
    paymentDue?: string;
    amount?: string;
  };
}

const invoiceTypeLabels: Record<string, string> = {
  advance: "Zaliczkowa",
  final: "Końcowa",
  full: "Całościowa",
};

const invoiceTypeColors: Record<string, string> = {
  advance: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  final: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  full: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

interface MonthlyData {
  month: string;
  revenue: number;
  clients: number;
  leads: number;
}

const COLORS = ['#ec4899', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4'];

export default function Statistics() {
  const navigate = useNavigate();
  const { isSzef, loading: roleLoading } = useUserRole();
  const { user } = useAuth();
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [overduePayments, setOverduePayments] = useState<PaymentWithClient[]>([]);
  const [allPayments, setAllPayments] = useState<PaymentWithClient[]>([]);
  const [invoices, setInvoices] = useState<InvoiceDocument[]>([]);
  const [pendingFinalInvoices, setPendingFinalInvoices] = useState<PendingFinalInvoice[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [leadsByStatus, setLeadsByStatus] = useState<{ name: string; value: number }[]>([]);
  const [clientsByIndustry, setClientsByIndustry] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load data for all team members (role check done separately for sensitive data)
    if (!roleLoading) {
      fetchAllStats();
    }
  }, [roleLoading]);

  const fetchAllStats = async () => {
    setLoading(true);
    await Promise.all([
      fetchOverviewStats(),
      fetchOverduePayments(),
      fetchAllPayments(),
      fetchInvoices(),
      fetchPendingFinalInvoices(),
      fetchMonthlyData(),
      fetchLeadsByStatus(),
      fetchClientsByIndustry()
    ]);
    setLoading(false);
  };

  const fetchOverviewStats = async () => {
    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);

    const [
      paymentsRes,
      clientsRes,
      leadsRes,
      campaignsRes,
      documentsRes,
      tasksRes
    ] = await Promise.all([
      supabase.from("payments").select("amount, status, paid_date"),
      supabase.from("clients").select("status"),
      supabase.from("leads").select("status"),
      supabase.from("campaigns").select("status"),
      supabase.from("documents").select("id"),
      supabase.from("tasks").select("status")
    ]);

    const payments = paymentsRes.data || [];
    const clients = clientsRes.data || [];
    const leads = leadsRes.data || [];
    const campaigns = campaignsRes.data || [];
    const documents = documentsRes.data || [];
    const tasks = tasksRes.data || [];

    const paidPayments = payments.filter(p => p.status === 'paid');
    const totalRevenue = paidPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    
    const monthlyPaidPayments = paidPayments.filter(p => {
      if (!p.paid_date) return false;
      const paidDate = new Date(p.paid_date);
      return paidDate >= monthStart && paidDate <= monthEnd;
    });
    const monthlyRevenue = monthlyPaidPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    const pendingPayments = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + Number(p.amount), 0);
    const overduePayments = payments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + Number(p.amount), 0);

    setStats({
      totalRevenue,
      monthlyRevenue,
      pendingPayments,
      overduePayments,
      totalClients: clients.length,
      activeClients: clients.filter(c => c.status === 'active').length,
      totalLeads: leads.length,
      convertedLeads: leads.filter(l => l.status === 'converted').length,
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter(c => c.status === 'active').length,
      totalDocuments: documents.length,
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'done').length
    });
  };

  const fetchOverduePayments = async () => {
    const { data } = await supabase
      .from("payments")
      .select("id, amount, due_date, paid_date, status, document_id, client:clients(id, salon_name)")
      .eq("status", "overdue")
      .order("due_date", { ascending: true })
      .limit(10);
    
    setOverduePayments((data || []) as PaymentWithClient[]);
  };

  const fetchAllPayments = async () => {
    const { data } = await supabase
      .from("payments")
      .select("id, amount, due_date, paid_date, status, document_id, client:clients(id, salon_name)")
      .order("created_at", { ascending: false })
      .limit(100);
    
    setAllPayments((data || []) as PaymentWithClient[]);
  };

  const fetchInvoices = async () => {
    const { data } = await supabase
      .from("documents")
      .select("id, title, subtitle, created_at, data, client:clients(id, salon_name)")
      .eq("type", "invoice")
      .order("created_at", { ascending: false })
      .limit(100);
    
    setInvoices((data || []).map(doc => ({
      ...doc,
      data: doc.data as InvoiceDocument['data']
    })) as InvoiceDocument[]);
  };

  const fetchPendingFinalInvoices = async () => {
    const { data } = await supabase
      .from("pending_final_invoices")
      .select(`
        id,
        advance_amount,
        total_amount,
        remaining_amount,
        expected_date,
        status,
        created_at,
        client:clients(id, salon_name),
        advance_invoice:documents!pending_final_invoices_advance_invoice_id_fkey(id, title)
      `)
      .eq("status", "pending")
      .order("expected_date", { ascending: true, nullsFirst: false });
    
    setPendingFinalInvoices((data || []) as unknown as PendingFinalInvoice[]);
  };

  const fetchMonthlyData = async () => {
    const months: MonthlyData[] = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      
      const [paymentsRes, clientsRes, leadsRes] = await Promise.all([
        supabase
          .from("payments")
          .select("amount")
          .eq("status", "paid")
          .gte("paid_date", start.toISOString())
          .lte("paid_date", end.toISOString()),
        supabase
          .from("clients")
          .select("id")
          .gte("created_at", start.toISOString())
          .lte("created_at", end.toISOString()),
        supabase
          .from("leads")
          .select("id")
          .gte("created_at", start.toISOString())
          .lte("created_at", end.toISOString())
      ]);
      
      months.push({
        month: format(date, "MMM", { locale: pl }),
        revenue: (paymentsRes.data || []).reduce((sum, p) => sum + Number(p.amount), 0),
        clients: (clientsRes.data || []).length,
        leads: (leadsRes.data || []).length
      });
    }
    
    setMonthlyData(months);
  };

  const fetchLeadsByStatus = async () => {
    const { data } = await supabase.from("leads").select("status");
    
    const statusCounts: Record<string, number> = {};
    (data || []).forEach(lead => {
      const status = lead.status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    const statusLabels: Record<string, string> = {
      new: "Nowe",
      contacted: "Skontaktowano",
      interested: "Zainteresowani",
      negotiation: "Negocjacje",
      converted: "Przekonwertowani",
      lost: "Utraceni"
    };
    
    setLeadsByStatus(
      Object.entries(statusCounts).map(([status, count]) => ({
        name: statusLabels[status] || status,
        value: count
      }))
    );
  };

  const fetchClientsByIndustry = async () => {
    const { data } = await supabase.from("clients").select("industry");
    
    const industryCounts: Record<string, number> = {};
    (data || []).forEach(client => {
      const industry = client.industry || 'Inne';
      industryCounts[industry] = (industryCounts[industry] || 0) + 1;
    });
    
    setClientsByIndustry(
      Object.entries(industryCounts)
        .map(([industry, count]) => ({ name: industry, value: count }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6)
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pl-PL', { 
      style: 'currency', 
      currency: 'PLN',
      maximumFractionDigits: 0
    }).format(value);
  };

  if (roleLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  // All team members can access Statistics, but sensitive revenue data is hidden for non-szef

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-medium text-foreground">
                {entry.dataKey === 'revenue' ? formatCurrency(entry.value) : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            Statystyki Agencji
          </h1>
          <p className="text-muted-foreground mt-1">
            Szczegółowy przegląd wyników i finansów
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className={`grid w-full lg:w-auto lg:inline-grid ${isSzef ? 'grid-cols-5' : 'grid-cols-4'}`}>
            <TabsTrigger value="overview">Przegląd</TabsTrigger>
            <TabsTrigger value="invoices" className="flex items-center gap-1.5">
              <Receipt className="h-4 w-4" />
              Faktury
            </TabsTrigger>
            {isSzef && <TabsTrigger value="finances">Finanse</TabsTrigger>}
            <TabsTrigger value="sales">Sprzedaż</TabsTrigger>
            <TabsTrigger value="operations">Operacje</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Quick stats - Revenue cards only for szef */}
            <div className={`grid gap-4 ${isSzef ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-3'}`}>
              {isSzef && (
                <Card className="border-pink-500/30 bg-gradient-to-br from-pink-500/10 to-pink-600/5">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-4 w-4 text-pink-400" />
                      <span className="text-xs text-muted-foreground">Przychód (całkowity)</span>
                    </div>
                    {loading ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      <p className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {isSzef && (
                <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-emerald-400" />
                      <span className="text-xs text-muted-foreground">Przychód (miesiąc)</span>
                    </div>
                    {loading ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      <p className="text-2xl font-bold">{formatCurrency(stats?.monthlyRevenue || 0)}</p>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card className="border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-blue-600/5">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-blue-400" />
                    <span className="text-xs text-muted-foreground">Aktywni klienci</span>
                  </div>
                  {loading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <p className="text-2xl font-bold">{stats?.activeClients || 0}</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/5">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-purple-400" />
                    <span className="text-xs text-muted-foreground">Konwersja leadów</span>
                  </div>
                  {loading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <p className="text-2xl font-bold">
                      {stats?.totalLeads ? Math.round((stats.convertedLeads / stats.totalLeads) * 100) : 0}%
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-cyan-600/5">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-cyan-400" />
                    <span className="text-xs text-muted-foreground">Ukończone zadania</span>
                  </div>
                  {loading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <p className="text-2xl font-bold">{stats?.completedTasks || 0}</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Charts row */}
            <div className={`grid gap-6 ${isSzef ? 'lg:grid-cols-2' : 'lg:grid-cols-2'}`}>
              {/* Revenue chart - only for szef */}
              {isSzef && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Activity className="h-5 w-5 text-primary" />
                      Przychód miesięczny
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <Skeleton className="h-[250px] w-full" />
                    ) : (
                      <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={monthlyData}>
                            <defs>
                              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="month" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `${v/1000}k`} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                              type="monotone"
                              dataKey="revenue"
                              name="Przychód"
                              stroke="#ec4899"
                              strokeWidth={2}
                              fill="url(#colorRevenue)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-primary" />
                    Leady wg statusu
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-[250px] w-full" />
                  ) : (
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPie>
                          <Pie
                            data={leadsByStatus}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {leadsByStatus.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </RechartsPie>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Clients by industry chart - visible for all */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Klienci wg branży
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-[250px] w-full" />
                  ) : (
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={clientsByIndustry} layout="vertical">
                          <XAxis type="number" axisLine={false} tickLine={false} />
                          <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={100} />
                          <Tooltip />
                          <Bar dataKey="value" name="Klienci" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Overdue payments alert - visible for all team members */}
            {overduePayments.length > 0 && (
              <Card className="border-red-500/50 bg-red-500/5">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-red-400">
                    <AlertTriangle className="h-5 w-5" />
                    Zaległe płatności ({overduePayments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Klient</TableHead>
                        <TableHead>Kwota</TableHead>
                        <TableHead>Termin płatności</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {overduePayments.map(payment => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">
                            {payment.client?.salon_name || "Nieznany"}
                          </TableCell>
                          <TableCell>{formatCurrency(payment.amount)}</TableCell>
                          <TableCell className="text-red-400">
                            {format(new Date(payment.due_date), "dd.MM.yyyy")}
                          </TableCell>
                          <TableCell>
                            <Badge variant="destructive">Zaległe</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="invoices" className="space-y-6">
            {/* Invoices summary cards */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Receipt className="h-4 w-4 text-blue-400" />
                    <span className="text-sm text-muted-foreground">Wszystkie faktury</span>
                  </div>
                  {loading ? <Skeleton className="h-8 w-16" /> : (
                    <p className="text-2xl font-bold">{invoices.length}</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm text-muted-foreground">Opłacone</span>
                  </div>
                  {loading ? <Skeleton className="h-8 w-16" /> : (
                    <p className="text-2xl font-bold text-emerald-400">
                      {allPayments.filter(p => p.status === 'paid').length}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-orange-400" />
                    <span className="text-sm text-muted-foreground">Oczekujące</span>
                  </div>
                  {loading ? <Skeleton className="h-8 w-16" /> : (
                    <p className="text-2xl font-bold text-orange-400">
                      {allPayments.filter(p => p.status === 'pending').length}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <span className="text-sm text-muted-foreground">Zaległe</span>
                  </div>
                  {loading ? <Skeleton className="h-8 w-16" /> : (
                    <p className="text-2xl font-bold text-red-400">
                      {allPayments.filter(p => p.status === 'overdue').length}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Pending Final Invoices - only for szef */}
            {isSzef && pendingFinalInvoices.length > 0 && (
              <Card className="border-amber-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-400">
                    <FileWarning className="h-5 w-5" />
                    Oczekujące faktury końcowe ({pendingFinalInvoices.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Klient</TableHead>
                        <TableHead>Zaliczka</TableHead>
                        <TableHead>Wartość umowy</TableHead>
                        <TableHead>Do wystawienia</TableHead>
                        <TableHead>Oczekiwany termin</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Akcje</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingFinalInvoices.map(invoice => {
                        const isOverdue = invoice.expected_date && new Date(invoice.expected_date) < new Date();
                        const isApproaching = invoice.expected_date && 
                          new Date(invoice.expected_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && 
                          !isOverdue;
                        
                        return (
                          <TableRow key={invoice.id}>
                            <TableCell className="font-medium">
                              {invoice.client?.salon_name || "—"}
                            </TableCell>
                            <TableCell>{formatCurrency(invoice.advance_amount)}</TableCell>
                            <TableCell>{formatCurrency(invoice.total_amount)}</TableCell>
                            <TableCell className="font-semibold text-amber-400">
                              {formatCurrency(invoice.remaining_amount)}
                            </TableCell>
                            <TableCell className={isOverdue ? 'text-red-400' : isApproaching ? 'text-amber-400' : ''}>
                              {invoice.expected_date 
                                ? format(new Date(invoice.expected_date), "dd.MM.yyyy")
                                : "Nie określono"}
                            </TableCell>
                            <TableCell>
                              {isOverdue ? (
                                <Badge variant="destructive">Po terminie</Badge>
                              ) : isApproaching ? (
                                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                                  Zbliża się
                                </Badge>
                              ) : (
                                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                  Oczekuje
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                                  onClick={() => {
                                    const finalInvoiceData = {
                                      type: 'invoice',
                                      data: {
                                        invoiceType: 'final',
                                        advanceAmount: String(invoice.advance_amount),
                                        invoiceNumber: '',
                                        pendingFinalInvoiceId: invoice.id,
                                      }
                                    };
                                    sessionStorage.setItem("loadDocument", JSON.stringify(finalInvoiceData));
                                    navigate("/invoice-generator");
                                  }}
                                >
                                  Wystaw końcową
                                </Button>
                                {invoice.client?.id && (
                                  <a 
                                    href={`/clients/${invoice.client.id}`}
                                    className="p-1.5 rounded-md hover:bg-muted transition-colors"
                                    title="Przejdź do klienta"
                                  >
                                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                  </a>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Invoices table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-primary" />
                  Lista faktur
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : invoices.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Brak faktur w systemie</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nr faktury</TableHead>
                          <TableHead>Typ</TableHead>
                          <TableHead>Klient</TableHead>
                          <TableHead>Data wystawienia</TableHead>
                          <TableHead>Termin płatności</TableHead>
                          <TableHead className="text-right">Kwota</TableHead>
                          <TableHead>Status płatności</TableHead>
                          <TableHead className="text-right">Akcje</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoices.map(invoice => {
                          const payment = allPayments.find(p => p.document_id === invoice.id);
                          const paymentStatus = payment?.status || 'pending';
                          const invoiceType = invoice.data?.invoiceType || 'full';
                          const dueDate = invoice.data?.dueDate || invoice.data?.paymentDue;
                          
                          // Find related final invoice for advance invoices
                          const relatedFinalInvoice = invoiceType === 'advance' && invoice.client?.id
                            ? invoices.find(inv => 
                                inv.id !== invoice.id && 
                                inv.client?.id === invoice.client?.id &&
                                inv.data?.invoiceType === 'final' &&
                                new Date(inv.created_at) > new Date(invoice.created_at)
                              )
                            : null;
                          
                          return (
                            <TableRow key={invoice.id}>
                              <TableCell className="font-medium">
                                {invoice.data?.invoiceNumber || invoice.title}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  <Badge className={invoiceTypeColors[invoiceType] || invoiceTypeColors.full}>
                                    {invoiceTypeLabels[invoiceType] || "Całościowa"}
                                  </Badge>
                                  {invoiceType === 'advance' && (
                                    <span className="text-xs text-muted-foreground">
                                      {relatedFinalInvoice 
                                        ? `Końcowa: ${format(new Date(relatedFinalInvoice.created_at), "dd.MM.yyyy")}`
                                        : "Oczekuje na końcową"
                                      }
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {invoice.client?.salon_name || "—"}
                              </TableCell>
                              <TableCell>
                                {invoice.data?.issueDate 
                                  ? format(new Date(invoice.data.issueDate), "dd.MM.yyyy")
                                  : format(new Date(invoice.created_at), "dd.MM.yyyy")}
                              </TableCell>
                              <TableCell>
                                {dueDate 
                                  ? format(new Date(dueDate), "dd.MM.yyyy")
                                  : "—"}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {invoice.data?.totalGross 
                                  ? formatCurrency(invoice.data.totalGross)
                                  : invoice.data?.amount
                                    ? formatCurrency(Number(invoice.data.amount))
                                    : "—"}
                              </TableCell>
                              <TableCell>
                                {paymentStatus === 'paid' && (
                                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                    Opłacona
                                  </Badge>
                                )}
                                {paymentStatus === 'pending' && (
                                  <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                                    Oczekuje
                                  </Badge>
                                )}
                                {paymentStatus === 'overdue' && (
                                  <Badge variant="destructive">
                                    Zaległa
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <a 
                                    href={`/history?document=${invoice.id}`}
                                    className="p-1.5 rounded-md hover:bg-muted transition-colors"
                                    title="Zobacz fakturę"
                                  >
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                  </a>
                                  {invoice.client?.id && (
                                    <a 
                                      href={`/clients/${invoice.client.id}`}
                                      className="p-1.5 rounded-md hover:bg-muted transition-colors"
                                      title="Przejdź do klienta"
                                    >
                                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                    </a>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payments table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Historia płatności
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : allPayments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Brak płatności w systemie</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Klient</TableHead>
                          <TableHead>Kwota</TableHead>
                          <TableHead>Termin płatności</TableHead>
                          <TableHead>Data zapłaty</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allPayments.map(payment => (
                          <TableRow key={payment.id}>
                            <TableCell className="font-medium">
                              {payment.client?.salon_name || "—"}
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(payment.amount)}
                            </TableCell>
                            <TableCell>
                              {format(new Date(payment.due_date), "dd.MM.yyyy")}
                            </TableCell>
                            <TableCell>
                              {payment.paid_date 
                                ? format(new Date(payment.paid_date), "dd.MM.yyyy")
                                : "—"}
                            </TableCell>
                            <TableCell>
                              {payment.status === 'paid' && (
                                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                  Opłacona
                                </Badge>
                              )}
                              {payment.status === 'pending' && (
                                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                                  Oczekuje
                                </Badge>
                              )}
                              {payment.status === 'overdue' && (
                                <Badge variant="destructive">
                                  Zaległa
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="finances" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm text-muted-foreground">Całkowity przychód</span>
                  </div>
                  {loading ? <Skeleton className="h-10 w-32" /> : (
                    <p className="text-3xl font-bold text-emerald-400">
                      {formatCurrency(stats?.totalRevenue || 0)}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-orange-400" />
                    <span className="text-sm text-muted-foreground">Oczekujące</span>
                  </div>
                  {loading ? <Skeleton className="h-10 w-32" /> : (
                    <p className="text-3xl font-bold text-orange-400">
                      {formatCurrency(stats?.pendingPayments || 0)}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <span className="text-sm text-muted-foreground">Zaległe</span>
                  </div>
                  {loading ? <Skeleton className="h-10 w-32" /> : (
                    <p className="text-3xl font-bold text-red-400">
                      {formatCurrency(stats?.overduePayments || 0)}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Trend przychodów (6 miesięcy)</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData}>
                        <XAxis dataKey="month" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `${v/1000}k`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="revenue" name="Przychód" fill="#ec4899" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sales" className="space-y-6">
            <div className="grid md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-pink-400" />
                    <span className="text-sm text-muted-foreground">Leady (ogółem)</span>
                  </div>
                  {loading ? <Skeleton className="h-8 w-16" /> : (
                    <p className="text-2xl font-bold">{stats?.totalLeads || 0}</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm text-muted-foreground">Przekonwertowane</span>
                  </div>
                  {loading ? <Skeleton className="h-8 w-16" /> : (
                    <p className="text-2xl font-bold text-emerald-400">{stats?.convertedLeads || 0}</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-blue-400" />
                    <span className="text-sm text-muted-foreground">Klienci (ogółem)</span>
                  </div>
                  {loading ? <Skeleton className="h-8 w-16" /> : (
                    <p className="text-2xl font-bold">{stats?.totalClients || 0}</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm text-muted-foreground">Aktywni klienci</span>
                  </div>
                  {loading ? <Skeleton className="h-8 w-16" /> : (
                    <p className="text-2xl font-bold text-emerald-400">{stats?.activeClients || 0}</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Nowi klienci i leady (6 miesięcy)</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-[250px] w-full" />
                  ) : (
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyData}>
                          <XAxis dataKey="month" axisLine={false} tickLine={false} />
                          <YAxis axisLine={false} tickLine={false} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="leads" name="Leady" fill="#ec4899" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="clients" name="Klienci" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Klienci wg branży</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-[250px] w-full" />
                  ) : (
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPie>
                          <Pie
                            data={clientsByIndustry}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {clientsByIndustry.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </RechartsPie>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Conversion rate */}
            {stats && stats.totalLeads > 0 && (
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Współczynnik konwersji</p>
                      <p className="text-3xl font-bold text-primary">
                        {((stats.convertedLeads / stats.totalLeads) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {stats.convertedLeads} z {stats.totalLeads} leadów
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="operations" className="space-y-6">
            <div className="grid md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-blue-400" />
                    <span className="text-sm text-muted-foreground">Dokumenty</span>
                  </div>
                  {loading ? <Skeleton className="h-8 w-16" /> : (
                    <p className="text-2xl font-bold">{stats?.totalDocuments || 0}</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-purple-400" />
                    <span className="text-sm text-muted-foreground">Kampanie</span>
                  </div>
                  {loading ? <Skeleton className="h-8 w-16" /> : (
                    <p className="text-2xl font-bold">{stats?.totalCampaigns || 0}</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm text-muted-foreground">Aktywne kampanie</span>
                  </div>
                  {loading ? <Skeleton className="h-8 w-16" /> : (
                    <p className="text-2xl font-bold text-emerald-400">{stats?.activeCampaigns || 0}</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-orange-400" />
                    <span className="text-sm text-muted-foreground">Ukończone zadania</span>
                  </div>
                  {loading ? <Skeleton className="h-8 w-16" /> : (
                    <p className="text-2xl font-bold">
                      {stats?.completedTasks || 0} / {stats?.totalTasks || 0}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Task completion rate */}
            {stats && stats.totalTasks > 0 && (
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Procent ukończonych zadań</p>
                      <p className="text-3xl font-bold text-emerald-400">
                        {((stats.completedTasks / stats.totalTasks) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {stats.completedTasks} ukończonych z {stats.totalTasks}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
