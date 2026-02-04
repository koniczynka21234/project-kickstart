import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import {
  ArrowLeft, Loader2, Target, TrendingUp, DollarSign, Users, MousePointer,
  Eye, Calendar, Copy, Pencil, Plus, BarChart3, MessageSquare, ShoppingBag, Save
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface Campaign {
  id: string;
  name: string;
  client_id: string;
  status: string;
  budget: number | null;
  start_date: string;
  end_date: string | null;
  objective: string | null;
  notes: string | null;
  created_at: string;
}

interface CampaignMetric {
  id: string;
  campaign_id: string;
  period_start: string;
  period_end: string;
  impressions: number | null;
  reach: number | null;
  clicks: number | null;
  spend: number | null;
  conversions: number | null;
  bookings: number | null;
  messages: number | null;
  created_at: string;
}

interface Client {
  id: string;
  salon_name: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: 'Aktywna', color: 'bg-green-500/20 text-green-400' },
  paused: { label: 'Wstrzymana', color: 'bg-amber-500/20 text-amber-400' },
  completed: { label: 'Zakończona', color: 'bg-blue-500/20 text-blue-400' },
  draft: { label: 'Szkic', color: 'bg-zinc-500/20 text-zinc-400' },
};

export default function CampaignDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [metrics, setMetrics] = useState<CampaignMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [metricsDialogOpen, setMetricsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    status: '',
    budget: '',
    objective: '',
    notes: '',
    start_date: '',
    end_date: '',
  });
  const [newMetric, setNewMetric] = useState({
    period_start: '',
    period_end: '',
    impressions: '',
    reach: '',
    clicks: '',
    spend: '',
    conversions: '',
    bookings: '',
    messages: '',
  });

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    
    const { data: campaignData, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (campaignError || !campaignData) {
      toast.error('Nie znaleziono kampanii');
      navigate('/campaigns');
      return;
    }
    setCampaign(campaignData);
    setEditForm({
      name: campaignData.name || '',
      status: campaignData.status || 'draft',
      budget: campaignData.budget?.toString() || '',
      objective: campaignData.objective || '',
      notes: campaignData.notes || '',
      start_date: campaignData.start_date || '',
      end_date: campaignData.end_date || '',
    });

    const { data: clientData } = await supabase
      .from('clients')
      .select('id, salon_name')
      .eq('id', campaignData.client_id)
      .single();
    setClient(clientData);

    const { data: metricsData } = await supabase
      .from('campaign_metrics')
      .select('*')
      .eq('campaign_id', id)
      .order('period_start', { ascending: true });
    setMetrics(metricsData || []);

    setLoading(false);
  };

  const totals = useMemo(() => {
    return metrics.reduce((acc, m) => ({
      impressions: acc.impressions + (m.impressions || 0),
      reach: acc.reach + (m.reach || 0),
      clicks: acc.clicks + (m.clicks || 0),
      spend: acc.spend + (m.spend || 0),
      conversions: acc.conversions + (m.conversions || 0),
      bookings: acc.bookings + (m.bookings || 0),
      messages: acc.messages + (m.messages || 0),
    }), { impressions: 0, reach: 0, clicks: 0, spend: 0, conversions: 0, bookings: 0, messages: 0 });
  }, [metrics]);

  const kpis = useMemo(() => {
    const cpc = totals.clicks > 0 ? totals.spend / totals.clicks : 0;
    const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
    const cpm = totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0;
    const conversionRate = totals.clicks > 0 ? (totals.bookings / totals.clicks) * 100 : 0;
    const costPerBooking = totals.bookings > 0 ? totals.spend / totals.bookings : 0;
    return { cpc, ctr, cpm, conversionRate, costPerBooking };
  }, [totals]);

  const chartData = useMemo(() => {
    return metrics.map(m => ({
      date: format(new Date(m.period_start), 'd MMM', { locale: pl }),
      spend: m.spend || 0,
      clicks: m.clicks || 0,
      bookings: m.bookings || 0,
      reach: m.reach || 0,
    }));
  }, [metrics]);

  const handleAddMetric = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    const { error } = await supabase.from('campaign_metrics').insert({
      campaign_id: id,
      period_start: newMetric.period_start,
      period_end: newMetric.period_end,
      impressions: parseInt(newMetric.impressions) || 0,
      reach: parseInt(newMetric.reach) || 0,
      clicks: parseInt(newMetric.clicks) || 0,
      spend: parseFloat(newMetric.spend) || 0,
      conversions: parseInt(newMetric.conversions) || 0,
      bookings: parseInt(newMetric.bookings) || 0,
      messages: parseInt(newMetric.messages) || 0,
    });

    if (error) {
      toast.error('Błąd podczas dodawania metryk');
    } else {
      toast.success('Metryki dodane');
      setMetricsDialogOpen(false);
      setNewMetric({ period_start: '', period_end: '', impressions: '', reach: '', clicks: '', spend: '', conversions: '', bookings: '', messages: '' });
      fetchData();
    }
  };

  const handleEditCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    const { error } = await supabase.from('campaigns').update({
      name: editForm.name,
      status: editForm.status,
      budget: parseFloat(editForm.budget) || null,
      objective: editForm.objective || null,
      notes: editForm.notes || null,
      start_date: editForm.start_date,
      end_date: editForm.end_date || null,
    }).eq('id', id);

    if (error) {
      toast.error('Błąd podczas zapisywania');
    } else {
      toast.success('Kampania zaktualizowana');
      setEditDialogOpen(false);
      fetchData();
    }
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(value);

  const copyId = () => {
    if (campaign) {
      navigator.clipboard.writeText(campaign.id);
      toast.success('ID skopiowane');
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!campaign) return null;

  const status = statusConfig[campaign.status] || statusConfig.draft;

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 space-y-6 animate-fade-in w-full max-w-full overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Button variant="ghost" onClick={() => navigate('/campaigns')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Powrót do kampanii
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={copyId}>
              <Copy className="w-4 h-4 mr-2" />
              Kopiuj ID
            </Button>
            <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)}>
              <Pencil className="w-4 h-4 mr-2" />
              Edytuj
            </Button>
          </div>
        </div>

        {/* Main Header */}
        <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50">
          <div className="h-1.5 bg-gradient-to-r from-primary via-primary/80 to-primary/60" />
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-foreground">{campaign.name}</h1>
                  <Badge className={status.color}>{status.label}</Badge>
                </div>
                {client && (
                  <p 
                    className="text-lg text-muted-foreground mb-4 cursor-pointer hover:text-primary transition-colors"
                    onClick={() => navigate(`/clients/${client.id}`)}
                  >
                    {client.salon_name}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/80 text-sm text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    {format(new Date(campaign.start_date), 'd MMM yyyy', { locale: pl })}
                    {campaign.end_date && ` - ${format(new Date(campaign.end_date), 'd MMM yyyy', { locale: pl })}`}
                  </div>
                  {campaign.objective && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/80 text-sm text-muted-foreground">
                      <Target className="w-3.5 h-3.5 text-blue-400" />
                      {campaign.objective}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3 lg:w-72">
                <div className="p-4 rounded-xl bg-secondary/50 border border-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-muted-foreground">Budżet</span>
                  </div>
                  <p className="text-xl font-bold text-green-400">{formatCurrency(campaign.budget || 0)}</p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/50 border border-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Wydano</span>
                  </div>
                  <p className="text-xl font-bold text-primary">{formatCurrency(totals.spend)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="border-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Eye className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-muted-foreground">Zasięg</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{totals.reach.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-purple-500/10 to-purple-600/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <MousePointer className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-muted-foreground">Kliknięcia</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{totals.clicks.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-green-500/10 to-green-600/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <ShoppingBag className="w-4 h-4 text-green-400" />
                <span className="text-xs text-muted-foreground">Rezerwacje</span>
              </div>
              <p className="text-2xl font-bold text-green-400">{totals.bookings}</p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-amber-500/10 to-amber-600/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-muted-foreground">CPC</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(kpis.cpc)}</p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-pink-500/10 to-pink-600/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-pink-400" />
                <span className="text-xs text-muted-foreground">CTR</span>
              </div>
              <p className="text-2xl font-bold text-pink-400">{kpis.ctr.toFixed(2)}%</p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-cyan-500/10 to-cyan-600/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-muted-foreground">Koszt/Rez.</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(kpis.costPerBooking)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Wydatki i rezerwacje
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Area type="monotone" dataKey="spend" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.2)" name="Wydatki (PLN)" />
                    <Area type="monotone" dataKey="bookings" stroke="#22c55e" fill="rgba(34, 197, 94, 0.2)" name="Rezerwacje" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Brak danych do wyświetlenia
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Zasięg i kliknięcia
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Line type="monotone" dataKey="reach" stroke="#3b82f6" strokeWidth={2} name="Zasięg" dot={false} />
                    <Line type="monotone" dataKey="clicks" stroke="#a855f7" strokeWidth={2} name="Kliknięcia" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Brak danych do wyświetlenia
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Metrics History */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Historia metryk</CardTitle>
              <Button onClick={() => setMetricsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Dodaj metryki
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {metrics.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Okres</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Zasięg</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Kliknięcia</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Wydatki</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Rezerwacje</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Wiadomości</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.map((m) => (
                      <tr key={m.id} className="border-b border-border/50 hover:bg-secondary/30">
                        <td className="py-3 px-4">
                          {format(new Date(m.period_start), 'd MMM', { locale: pl })} - {format(new Date(m.period_end), 'd MMM', { locale: pl })}
                        </td>
                        <td className="text-right py-3 px-4">{(m.reach || 0).toLocaleString()}</td>
                        <td className="text-right py-3 px-4">{(m.clicks || 0).toLocaleString()}</td>
                        <td className="text-right py-3 px-4">{formatCurrency(m.spend || 0)}</td>
                        <td className="text-right py-3 px-4 text-green-400 font-medium">{m.bookings || 0}</td>
                        <td className="text-right py-3 px-4">{m.messages || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Brak metryk dla tej kampanii</p>
                <p className="text-sm mt-1">Dodaj pierwsze metryki, aby śledzić wydajność</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        {campaign.notes && (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Notatki</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">{campaign.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Add Metrics Dialog */}
        <Dialog open={metricsDialogOpen} onOpenChange={setMetricsDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Dodaj metryki</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddMetric} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data początkowa</Label>
                  <Input 
                    type="date" 
                    value={newMetric.period_start} 
                    onChange={(e) => setNewMetric(p => ({ ...p, period_start: e.target.value }))}
                    required 
                  />
                </div>
                <div>
                  <Label>Data końcowa</Label>
                  <Input 
                    type="date" 
                    value={newMetric.period_end} 
                    onChange={(e) => setNewMetric(p => ({ ...p, period_end: e.target.value }))}
                    required 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Wyświetlenia</Label>
                  <Input 
                    type="number" 
                    value={newMetric.impressions} 
                    onChange={(e) => setNewMetric(p => ({ ...p, impressions: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Zasięg</Label>
                  <Input 
                    type="number" 
                    value={newMetric.reach} 
                    onChange={(e) => setNewMetric(p => ({ ...p, reach: e.target.value }))}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Kliknięcia</Label>
                  <Input 
                    type="number" 
                    value={newMetric.clicks} 
                    onChange={(e) => setNewMetric(p => ({ ...p, clicks: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Wydatki (PLN)</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    value={newMetric.spend} 
                    onChange={(e) => setNewMetric(p => ({ ...p, spend: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Rezerwacje</Label>
                  <Input 
                    type="number" 
                    value={newMetric.bookings} 
                    onChange={(e) => setNewMetric(p => ({ ...p, bookings: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Wiadomości</Label>
                  <Input 
                    type="number" 
                    value={newMetric.messages} 
                    onChange={(e) => setNewMetric(p => ({ ...p, messages: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Konwersje</Label>
                  <Input 
                    type="number" 
                    value={newMetric.conversions} 
                    onChange={(e) => setNewMetric(p => ({ ...p, conversions: e.target.value }))}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setMetricsDialogOpen(false)}>Anuluj</Button>
                <Button type="submit">Dodaj</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Campaign Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edytuj kampanię</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditCampaign} className="space-y-4">
              <div>
                <Label>Nazwa kampanii</Label>
                <Input 
                  value={editForm.name} 
                  onChange={(e) => setEditForm(p => ({ ...p, name: e.target.value }))}
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground"
                    value={editForm.status}
                    onChange={(e) => setEditForm(p => ({ ...p, status: e.target.value }))}
                  >
                    <option value="draft">Szkic</option>
                    <option value="active">Aktywna</option>
                    <option value="paused">Wstrzymana</option>
                    <option value="completed">Zakończona</option>
                  </select>
                </div>
                <div>
                  <Label>Budżet (PLN)</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={editForm.budget} 
                    onChange={(e) => setEditForm(p => ({ ...p, budget: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data początkowa</Label>
                  <Input 
                    type="date" 
                    value={editForm.start_date} 
                    onChange={(e) => setEditForm(p => ({ ...p, start_date: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label>Data końcowa</Label>
                  <Input 
                    type="date" 
                    value={editForm.end_date} 
                    onChange={(e) => setEditForm(p => ({ ...p, end_date: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label>Cel kampanii</Label>
                <Input 
                  value={editForm.objective} 
                  onChange={(e) => setEditForm(p => ({ ...p, objective: e.target.value }))}
                  placeholder="np. Więcej rezerwacji"
                />
              </div>
              <div>
                <Label>Notatki</Label>
                <textarea
                  className="w-full min-h-[80px] px-3 py-2 rounded-md border border-border bg-background text-foreground resize-none"
                  value={editForm.notes}
                  onChange={(e) => setEditForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Dodatkowe informacje..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>Anuluj</Button>
                <Button type="submit">
                  <Save className="w-4 h-4 mr-2" />
                  Zapisz
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
