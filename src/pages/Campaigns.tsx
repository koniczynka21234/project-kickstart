import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { campaignSchema } from '@/lib/validationSchemas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { 
  Plus, Search, Calendar, DollarSign, MoreVertical, Pencil, Trash2,
  Loader2, TrendingUp, BarChart3, MousePointer, ChevronRight, Building2, Megaphone, Eye
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Campaign {
  id: string;
  client_id: string;
  name: string;
  status: string;
  budget: number | null;
  start_date: string;
  end_date: string | null;
  objective: string | null;
  notes: string | null;
  created_at: string;
  clients?: {
    salon_name: string;
  };
}

interface CampaignMetrics {
  id: string;
  campaign_id: string;
  impressions: number | null;
  clicks: number | null;
  spend: number | null;
  bookings: number | null;
}

interface Client {
  id: string;
  salon_name: string;
}

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  active: { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'Aktywna' },
  paused: { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', label: 'Wstrzymana' },
  completed: { color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', label: 'Zakończona' },
  draft: { color: 'text-zinc-400', bg: 'bg-zinc-500/10 border-zinc-500/20', label: 'Szkic' },
};

export default function Campaigns() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [allMetrics, setAllMetrics] = useState<CampaignMetrics[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  
  const [formData, setFormData] = useState({
    client_id: '',
    name: '',
    status: 'draft',
    budget: '',
    start_date: '',
    end_date: '',
    objective: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    const { data: campaignsData } = await supabase
      .from('campaigns')
      .select('*, clients(salon_name)')
      .order('created_at', { ascending: false });

    setCampaigns(campaignsData || []);

    const { data: metricsData } = await supabase
      .from('campaign_metrics')
      .select('*');
    
    setAllMetrics(metricsData || []);

    const { data: clientsData } = await supabase
      .from('clients')
      .select('id, salon_name')
      .order('salon_name');
    
    setClients(clientsData || []);
    setLoading(false);
  };

  // KPIs
  const kpis = useMemo(() => {
    const totalSpend = allMetrics.reduce((sum, m) => sum + (m.spend || 0), 0);
    const totalClicks = allMetrics.reduce((sum, m) => sum + (m.clicks || 0), 0);
    const totalImpressions = allMetrics.reduce((sum, m) => sum + (m.impressions || 0), 0);
    const totalBookings = allMetrics.reduce((sum, m) => sum + (m.bookings || 0), 0);
    const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);

    const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    return {
      totalSpend,
      totalBudget,
      totalBookings,
      cpc,
      ctr,
      activeCampaigns: campaigns.filter(c => c.status === 'active').length,
      totalCampaigns: campaigns.length,
    };
  }, [allMetrics, campaigns]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationResult = campaignSchema.safeParse(formData);
    if (!validationResult.success) {
      toast.error(validationResult.error.errors[0].message);
      return;
    }

    const dataToSave = {
      client_id: formData.client_id,
      name: formData.name,
      status: formData.status,
      budget: formData.budget ? parseFloat(formData.budget) : null,
      start_date: formData.start_date,
      end_date: formData.end_date || null,
      objective: formData.objective || null,
      notes: formData.notes || null,
    };

    if (editingCampaign) {
      const { error } = await supabase
        .from('campaigns')
        .update(dataToSave)
        .eq('id', editingCampaign.id);

      if (error) {
        toast.error('Błąd aktualizacji kampanii');
      } else {
        toast.success('Kampania zaktualizowana');
        fetchData();
      }
    } else {
      const { error } = await supabase
        .from('campaigns')
        .insert({ ...dataToSave, created_by: user?.id });

      if (error) {
        toast.error('Błąd dodawania kampanii');
      } else {
        toast.success('Kampania dodana');
        fetchData();
      }
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć tę kampanię?')) return;

    const { error } = await supabase.from('campaigns').delete().eq('id', id);

    if (error) {
      toast.error('Błąd usuwania kampanii');
    } else {
      toast.success('Kampania usunięta');
      fetchData();
    }
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      client_id: campaign.client_id,
      name: campaign.name,
      status: campaign.status,
      budget: campaign.budget?.toString() || '',
      start_date: campaign.start_date,
      end_date: campaign.end_date || '',
      objective: campaign.objective || '',
      notes: campaign.notes || '',
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingCampaign(null);
    setFormData({
      client_id: '', name: '', status: 'draft', budget: '',
      start_date: '', end_date: '', objective: '', notes: '',
    });
  };

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch =
      campaign.name.toLowerCase().includes(search.toLowerCase()) ||
      campaign.clients?.salon_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    const matchesClient = clientFilter === 'all' || campaign.client_id === clientFilter;
    return matchesSearch && matchesStatus && matchesClient;
  });

  // Group campaigns by client
  const campaignsByClient = useMemo(() => {
    const grouped: Record<string, { client: Client; campaigns: Campaign[] }> = {};
    
    filteredCampaigns.forEach(campaign => {
      if (!grouped[campaign.client_id]) {
        const client = clients.find(c => c.id === campaign.client_id);
        if (client) {
          grouped[campaign.client_id] = { client, campaigns: [] };
        }
      }
      if (grouped[campaign.client_id]) {
        grouped[campaign.client_id].campaigns.push(campaign);
      }
    });
    
    return Object.values(grouped);
  }, [filteredCampaigns, clients]);

  const getCampaignKPIs = (campaignId: string) => {
    const metrics = allMetrics.filter(m => m.campaign_id === campaignId);
    const totalSpend = metrics.reduce((sum, m) => sum + (m.spend || 0), 0);
    const totalClicks = metrics.reduce((sum, m) => sum + (m.clicks || 0), 0);
    const totalBookings = metrics.reduce((sum, m) => sum + (m.bookings || 0), 0);
    
    return { spend: totalSpend, clicks: totalClicks, bookings: totalBookings };
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return '-';
    return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(value);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 animate-fade-in w-full max-w-full overflow-hidden">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                <Megaphone className="w-5 h-5 text-white" />
              </div>
              Kampanie
            </h1>
            <p className="text-muted-foreground mt-1">Zarządzaj kampaniami Facebook Ads</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/campaign-generator')}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Generator AI
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white border-0">
                  <Plus className="h-4 w-4 mr-2" />
                  Nowa kampania
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingCampaign ? 'Edytuj kampanię' : 'Nowa kampania'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label>Klient *</Label>
                      <Select value={formData.client_id} onValueChange={(v) => setFormData(p => ({ ...p, client_id: v }))}>
                        <SelectTrigger><SelectValue placeholder="Wybierz klienta" /></SelectTrigger>
                        <SelectContent>
                          {clients.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.salon_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label>Nazwa kampanii *</Label>
                      <Input value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Status</Label>
                      <Select value={formData.status} onValueChange={(v) => setFormData(p => ({ ...p, status: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Szkic</SelectItem>
                          <SelectItem value="active">Aktywna</SelectItem>
                          <SelectItem value="paused">Wstrzymana</SelectItem>
                          <SelectItem value="completed">Zakończona</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Budżet (PLN)</Label>
                      <Input type="number" value={formData.budget} onChange={(e) => setFormData(p => ({ ...p, budget: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Data startu *</Label>
                      <Input type="date" value={formData.start_date} onChange={(e) => setFormData(p => ({ ...p, start_date: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Data końca</Label>
                      <Input type="date" value={formData.end_date} onChange={(e) => setFormData(p => ({ ...p, end_date: e.target.value }))} />
                    </div>
                    <div className="col-span-2">
                      <Label>Cel kampanii</Label>
                      <Input value={formData.objective} onChange={(e) => setFormData(p => ({ ...p, objective: e.target.value }))} />
                    </div>
                    <div className="col-span-2">
                      <Label>Notatki</Label>
                      <Textarea value={formData.notes} onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))} rows={2} />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                      Anuluj
                    </Button>
                    <Button type="submit">
                      {editingCampaign ? 'Zapisz zmiany' : 'Dodaj kampanię'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="border-0 bg-gradient-to-br from-pink-500/10 to-pink-600/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
                  <Megaphone className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{kpis.totalCampaigns}</p>
                  <p className="text-xs text-muted-foreground">Kampanie</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-green-500/10 to-green-600/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-400">{kpis.activeCampaigns}</p>
                  <p className="text-xs text-muted-foreground">Aktywne</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-violet-500/10 to-violet-600/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(kpis.totalSpend)}</p>
                  <p className="text-xs text-muted-foreground">Wydano</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-amber-500/10 to-amber-600/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <MousePointer className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(kpis.cpc)}</p>
                  <p className="text-xs text-muted-foreground">CPC</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-cyan-500/10 to-cyan-600/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{kpis.ctr.toFixed(2)}%</p>
                  <p className="text-xs text-muted-foreground">CTR</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{kpis.totalBookings}</p>
                  <p className="text-xs text-muted-foreground">Rezerwacje</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Szukaj kampanii..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie</SelectItem>
              <SelectItem value="active">Aktywne</SelectItem>
              <SelectItem value="paused">Wstrzymane</SelectItem>
              <SelectItem value="completed">Zakończone</SelectItem>
              <SelectItem value="draft">Szkice</SelectItem>
            </SelectContent>
          </Select>
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Klient" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszyscy klienci</SelectItem>
              {clients.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.salon_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Campaigns grouped by client */}
        <div className="space-y-6">
          {campaignsByClient.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="py-12 text-center">
                <Megaphone className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Brak kampanii do wyświetlenia</p>
              </CardContent>
            </Card>
          ) : (
            campaignsByClient.map(({ client, campaigns: clientCampaigns }) => (
              <Card key={client.id} className="border-border/50 overflow-hidden">
                <CardHeader className="border-b border-border/50 bg-gradient-to-r from-pink-500/5 to-transparent">
                  <div className="flex items-center justify-between">
                    <CardTitle 
                      className="text-lg flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
                      onClick={() => navigate(`/clients/${client.id}`)}
                    >
                      <Building2 className="w-5 h-5 text-pink-400" />
                      {client.salon_name}
                      <Badge variant="secondary" className="ml-2">
                        {clientCampaigns.length} {clientCampaigns.length === 1 ? 'kampania' : 'kampanie'}
                      </Badge>
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/clients/${client.id}`)}>
                      <Eye className="w-4 h-4 mr-2" />
                      Profil klienta
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {clientCampaigns.map(campaign => {
                      const kpi = getCampaignKPIs(campaign.id);
                      const status = statusConfig[campaign.status] || statusConfig.draft;
                      
                      return (
                        <div 
                          key={campaign.id}
                          className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-all cursor-pointer group"
                          onClick={() => navigate(`/campaigns/${campaign.id}`)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
                              <Megaphone className="w-5 h-5 text-pink-400" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{campaign.name}</p>
                                <Badge className={`${status.bg} ${status.color} border`}>
                                  {status.label}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {format(new Date(campaign.start_date), 'd MMM yyyy', { locale: pl })}
                                </span>
                                <span className="flex items-center gap-1">
                                  <DollarSign className="w-3 h-3" />
                                  Budżet: {formatCurrency(campaign.budget)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-6">
                            <div className="hidden md:flex items-center gap-6 text-sm">
                              <div className="text-center">
                                <p className="text-muted-foreground">Wydano</p>
                                <p className="font-medium">{formatCurrency(kpi.spend)}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-muted-foreground">Kliknięcia</p>
                                <p className="font-medium">{kpi.clicks}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-muted-foreground">Rezerwacje</p>
                                <p className="font-medium text-green-400">{kpi.bookings}</p>
                              </div>
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/campaigns/${campaign.id}`); }}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Szczegóły
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(campaign); }}>
                                  <Pencil className="w-4 h-4 mr-2" />
                                  Edytuj
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={(e) => { e.stopPropagation(); handleDelete(campaign.id); }}
                                  className="text-red-400"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Usuń
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>

                            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
