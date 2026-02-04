import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { clientSchema } from '@/lib/validationSchemas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOnboardingTasks } from '@/hooks/useOnboardingTasks';
import { 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  Instagram,
  MoreVertical,
  Pencil,
  Trash2,
  Building2,
  Loader2,
  Calendar,
  DollarSign,
  LayoutGrid,
  List,
  Copy,
  ExternalLink,
  AlertCircle,
  FileText,
  CreditCard,
  Clock
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';

interface Client {
  id: string;
  salon_name: string;
  owner_name: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  instagram: string | null;
  facebook_page: string | null;
  business_manager_url: string | null;
  status: string;
  contract_start_date: string | null;
  contract_end_date: string | null;
  contract_duration_months: number | null;
  monthly_budget: number | null;
  contract_amount: number | null;
  notes: string | null;
  created_at: string;
  assigned_to: string | null;
  industry: string | null;
}

// Alert types for client cards
interface ClientAlert {
  type: 'contract_expired' | 'contract_expiring' | 'missing_invoice' | 'payment_due' | 'final_invoice_due';
  priority: number; // Lower = higher priority
  label: string;
  color: 'red' | 'amber' | 'pink';
}

const industryOptions = [
  'Fryzjerstwo',
  'Kosmetyka',
  'Paznokcie',
  'Spa & Wellness',
  'Barber',
  'Makijaż',
  'Brwi i rzęsy',
  'Inne',
];

const statusColors: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  paused: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  churned: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const statusLabels: Record<string, string> = {
  active: 'Aktywny',
  paused: 'Wstrzymany',
  churned: 'Zakończony',
};

export default function Clients() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { createOnboardingTasks } = useOnboardingTasks();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [employees, setEmployees] = useState<{ id: string; email: string; full_name: string | null }[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [createOnboarding, setCreateOnboarding] = useState(true);
  const [clientInvoices, setClientInvoices] = useState<Set<string>>(new Set());
  const [clientPaymentsDue, setClientPaymentsDue] = useState<Set<string>>(new Set());
  const [clientFinalInvoicesDue, setClientFinalInvoicesDue] = useState<Set<string>>(new Set());

  const copyClientId = (e: React.MouseEvent, clientId: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(clientId);
    toast.success('ID klienta skopiowane');
  };
  const [formData, setFormData] = useState({
    salon_name: '',
    owner_name: '',
    city: '',
    phone: '',
    email: '',
    instagram: '',
    facebook_page: '',
    business_manager_url: '',
    status: 'active',
    contract_start_date: '',
    monthly_budget: '',
    notes: '',
    assigned_to: '',
    industry: '',
  });

  useEffect(() => {
    fetchClients();
    fetchEmployees();
    fetchClientAlertData();
  }, []);

  const fetchEmployees = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .order('full_name');
    
    setEmployees(data || []);
  };

  const fetchClientAlertData = async () => {
    const today = new Date().toISOString().split('T')[0];
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const threeDaysDate = threeDaysFromNow.toISOString().split('T')[0];

    // Fetch invoices, upcoming payments, and pending final invoices in parallel
    const [invoicesResult, paymentsResult, finalInvoicesResult] = await Promise.all([
      supabase.from('documents').select('client_id').eq('type', 'invoice'),
      supabase.from('payments').select('client_id').eq('status', 'pending').lte('due_date', threeDaysDate).gte('due_date', today),
      supabase.from('pending_final_invoices').select('client_id').eq('status', 'pending').lte('expected_date', threeDaysDate)
    ]);

    // Build sets for quick lookup
    const invoiceSet = new Set<string>();
    invoicesResult.data?.forEach(doc => {
      if (doc.client_id) invoiceSet.add(doc.client_id);
    });
    setClientInvoices(invoiceSet);

    const paymentSet = new Set<string>();
    paymentsResult.data?.forEach(payment => {
      if (payment.client_id) paymentSet.add(payment.client_id);
    });
    setClientPaymentsDue(paymentSet);

    const finalInvoiceSet = new Set<string>();
    finalInvoicesResult.data?.forEach(item => {
      if (item.client_id) finalInvoiceSet.add(item.client_id);
    });
    setClientFinalInvoicesDue(finalInvoiceSet);
  };

  const fetchClients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Błąd ładowania klientów');
      console.error(error);
    } else {
      setClients(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data with Zod
    const validationResult = clientSchema.safeParse(formData);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    const submitData = {
      salon_name: formData.salon_name,
      owner_name: formData.owner_name || null,
      city: formData.city || null,
      phone: formData.phone || null,
      email: formData.email || null,
      instagram: formData.instagram || null,
      facebook_page: formData.facebook_page || null,
      business_manager_url: formData.business_manager_url || null,
      status: formData.status,
      contract_start_date: formData.contract_start_date || null,
      monthly_budget: formData.monthly_budget ? parseFloat(formData.monthly_budget) : null,
      notes: formData.notes || null,
      assigned_to: formData.assigned_to || null,
      industry: formData.industry || null,
    };

    if (editingClient) {
      const { error } = await supabase
        .from('clients')
        .update(submitData)
        .eq('id', editingClient.id);

      if (error) {
        toast.error('Błąd aktualizacji klienta');
      } else {
        toast.success('Klient zaktualizowany');
        fetchClients();
      }
    } else {
      const { data, error } = await supabase
        .from('clients')
        .insert({ ...submitData, created_by: user?.id })
        .select()
        .single();

      if (error) {
        toast.error('Błąd dodawania klienta');
      } else {
        toast.success('Klient dodany');
        
        // Create onboarding tasks if checkbox is checked
        if (createOnboarding && data && user?.id) {
          await createOnboardingTasks(
            data.id,
            formData.salon_name,
            formData.assigned_to || null,
            user.id
          );
        }
        
        fetchClients();
      }
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć tego klienta?')) return;

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Błąd usuwania klienta');
    } else {
      toast.success('Klient usunięty');
      fetchClients();
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      salon_name: client.salon_name,
      owner_name: client.owner_name || '',
      city: client.city || '',
      phone: client.phone || '',
      email: client.email || '',
      instagram: client.instagram || '',
      facebook_page: client.facebook_page || '',
      business_manager_url: client.business_manager_url || '',
      status: client.status,
      contract_start_date: client.contract_start_date || '',
      monthly_budget: client.monthly_budget?.toString() || '',
      notes: client.notes || '',
      assigned_to: client.assigned_to || '',
      industry: client.industry || '',
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingClient(null);
    setCreateOnboarding(true);
    setFormData({
      salon_name: '',
      owner_name: '',
      city: '',
      phone: '',
      email: '',
      instagram: '',
      facebook_page: '',
      business_manager_url: '',
      status: 'active',
      contract_start_date: '',
      monthly_budget: '',
      notes: '',
      assigned_to: '',
      industry: '',
    });
  };

  // Helper: check if contract is expiring within 3 days (warning) or last day/expired (critical)
  const getContractExpiryStatus = (client: Client) => {
    if (!client.contract_start_date) return null;
    if (client.status === 'churned') return null; // Ignore churned clients
    
    const startDate = new Date(client.contract_start_date);
    const endDate = client.contract_end_date 
      ? new Date(client.contract_end_date)
      : new Date(startDate.getTime() + (client.contract_duration_months || 1) * 30 * 24 * 60 * 60 * 1000);
    
    const now = new Date();
    const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    // Only highlight if 3 days or less remaining
    if (daysRemaining <= 0) return { status: 'expired', days: Math.abs(daysRemaining) };
    if (daysRemaining <= 3) return { status: 'expiring', days: daysRemaining };
    return null;
  };

  // Get all alerts for a client (sorted by priority)
  const getClientAlerts = (client: Client): ClientAlert[] => {
    if (client.status === 'churned') return [];
    
    const alerts: ClientAlert[] = [];
    
    // Contract expiry alerts
    const expiryStatus = getContractExpiryStatus(client);
    if (expiryStatus) {
      if (expiryStatus.status === 'expired') {
        alerts.push({
          type: 'contract_expired',
          priority: 1,
          label: `Umowa wygasła ${expiryStatus.days} dni temu`,
          color: 'red'
        });
      } else {
        alerts.push({
          type: 'contract_expiring',
          priority: 2,
          label: `Umowa wygasa za ${expiryStatus.days} dni`,
          color: 'amber'
        });
      }
    }
    
    // Missing invoice alert (only for clients with contract_amount)
    if (client.contract_amount && client.contract_amount > 0 && !clientInvoices.has(client.id)) {
      alerts.push({
        type: 'missing_invoice',
        priority: 3,
        label: 'Brak faktury',
        color: 'pink'
      });
    }
    
    // Upcoming payment alert
    if (clientPaymentsDue.has(client.id)) {
      alerts.push({
        type: 'payment_due',
        priority: 4,
        label: 'Zbliża się płatność',
        color: 'amber'
      });
    }

    // Pending final invoice alert
    if (clientFinalInvoicesDue.has(client.id)) {
      alerts.push({
        type: 'final_invoice_due',
        priority: 3,
        label: 'Faktura końcowa do wystawienia',
        color: 'amber'
      });
    }
    
    return alerts.sort((a, b) => a.priority - b.priority);
  };

  // Get the most critical alert for styling the card
  const getPrimaryAlert = (client: Client): ClientAlert | null => {
    const alerts = getClientAlerts(client);
    return alerts.length > 0 ? alerts[0] : null;
  };

  // Count clients with expiring contracts (for the new filter tab)
  const expiringContractsCount = clients.filter(c => {
    const expiry = getContractExpiryStatus(c);
    return expiry && (expiry.status === 'expiring' || expiry.status === 'expired');
  }).length;

  const filteredClients = clients.filter((client) => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      client.salon_name.toLowerCase().includes(searchLower) ||
      client.owner_name?.toLowerCase().includes(searchLower) ||
      client.city?.toLowerCase().includes(searchLower) ||
      client.industry?.toLowerCase().includes(searchLower) ||
      client.id.toLowerCase().includes(searchLower) ||
      client.email?.toLowerCase().includes(searchLower) ||
      client.phone?.toLowerCase().includes(searchLower);
    
    // Handle special "expiring" filter
    if (statusFilter === 'expiring') {
      const expiry = getContractExpiryStatus(client);
      const matchesExpiring = expiry && (expiry.status === 'expiring' || expiry.status === 'expired');
      const matchesIndustry = industryFilter === 'all' || client.industry === industryFilter;
      return matchesSearch && matchesExpiring && matchesIndustry;
    }
    
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    const matchesIndustry = industryFilter === 'all' || client.industry === industryFilter;
    return matchesSearch && matchesStatus && matchesIndustry;
  });

  const formatCurrency = (value: number | null) => {
    if (value === null) return '-';
    return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(value);
  };

  return (
    <AppLayout>
      <div className="p-3 sm:p-4 lg:p-6 space-y-4 lg:space-y-6 animate-fade-in w-full max-w-full overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Klienci</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">Zarządzaj aktywnymi klientami</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 w-full sm:w-auto" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Dodaj klienta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingClient ? 'Edytuj klienta' : 'Nowy klient'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Nazwa salonu *</Label>
                    <Input
                      value={formData.salon_name}
                      onChange={(e) => setFormData({ ...formData, salon_name: e.target.value })}
                      className="form-input-elegant"
                    />
                  </div>
                  <div>
                    <Label>Właściciel</Label>
                    <Input
                      value={formData.owner_name}
                      onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                      className="form-input-elegant"
                    />
                  </div>
                  <div>
                    <Label>Miasto</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="form-input-elegant"
                    />
                  </div>
                  <div>
                    <Label>Telefon</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="form-input-elegant"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="form-input-elegant"
                    />
                  </div>
                  <div>
                    <Label>Instagram</Label>
                    <Input
                      value={formData.instagram}
                      onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                      placeholder="@nazwasalonu"
                      className="form-input-elegant"
                    />
                  </div>
                  <div>
                    <Label>Facebook</Label>
                    <Input
                      value={formData.facebook_page}
                      onChange={(e) => setFormData({ ...formData, facebook_page: e.target.value })}
                      placeholder="Link do strony FB"
                      className="form-input-elegant"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Business Manager</Label>
                    <Input
                      value={formData.business_manager_url}
                      onChange={(e) => setFormData({ ...formData, business_manager_url: e.target.value })}
                      placeholder="Link do Business Manager"
                      className="form-input-elegant"
                    />
                  </div>
                  <div>
                    <Label>Data rozpoczęcia</Label>
                    <Input
                      type="date"
                      value={formData.contract_start_date}
                      onChange={(e) => setFormData({ ...formData, contract_start_date: e.target.value })}
                      className="form-input-elegant"
                    />
                  </div>
                  <div>
                    <Label>Budżet miesięczny (PLN)</Label>
                    <Input
                      type="number"
                      value={formData.monthly_budget}
                      onChange={(e) => setFormData({ ...formData, monthly_budget: e.target.value })}
                      className="form-input-elegant"
                    />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                      <SelectTrigger className="form-input-elegant">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Branża</Label>
                    <Select value={formData.industry || "none"} onValueChange={(v) => setFormData({ ...formData, industry: v === "none" ? "" : v })}>
                      <SelectTrigger className="form-input-elegant">
                        <SelectValue placeholder="Wybierz branżę" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Brak</SelectItem>
                        {industryOptions.map((ind) => (
                          <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Opiekun klienta</Label>
                    <Select value={formData.assigned_to || "none"} onValueChange={(v) => setFormData({ ...formData, assigned_to: v === "none" ? "" : v })}>
                      <SelectTrigger className="form-input-elegant">
                        <SelectValue placeholder="Wybierz opiekuna" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Brak opiekuna</SelectItem>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.full_name || emp.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label>Notatki</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="form-input-elegant"
                      rows={3}
                    />
                  </div>
                  {!editingClient && (
                    <div className="col-span-2 flex items-center space-x-2 pt-2 border-t border-border/50">
                      <Checkbox
                        id="createOnboarding"
                        checked={createOnboarding}
                        onCheckedChange={(checked) => setCreateOnboarding(checked as boolean)}
                      />
                      <Label htmlFor="createOnboarding" className="text-sm cursor-pointer">
                        Utwórz zadania onboardingowe (10 zadań)
                      </Label>
                    </div>
                  )}
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                  {editingClient ? 'Zapisz zmiany' : 'Dodaj klienta'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-2 p-1 bg-secondary/50 rounded-xl border border-border/50 w-fit">
          {[
            { value: 'active', label: 'Aktywni', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
            { value: 'expiring', label: 'Wygasające', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
            { value: 'paused', label: 'Wstrzymani', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
            { value: 'churned', label: 'Zakończeni', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
            { value: 'all', label: 'Wszyscy', color: 'bg-muted text-muted-foreground' },
          ].map((tab) => {
            let count: number;
            if (tab.value === 'all') {
              count = clients.length;
            } else if (tab.value === 'expiring') {
              count = expiringContractsCount;
            } else {
              count = clients.filter(c => c.status === tab.value).length;
            }
            return (
              <Button
                key={tab.value}
                variant={statusFilter === tab.value ? "default" : "ghost"}
                size="sm"
                className={`h-8 px-3 ${statusFilter === tab.value ? tab.color + ' border' : ''}`}
                onClick={() => setStatusFilter(tab.value)}
              >
                {tab.label}
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                  {count}
                </Badge>
              </Button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Szukaj po nazwie, ID, email, telefonie..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 form-input-elegant"
            />
          </div>
          <Select value={industryFilter} onValueChange={setIndustryFilter}>
            <SelectTrigger className="w-[180px] form-input-elegant">
              <SelectValue placeholder="Branża" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie branże</SelectItem>
              {industryOptions.map((ind) => (
                <SelectItem key={ind} value={ind}>{ind}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* View Toggle */}
          <div className="flex items-center gap-1 p-1 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Clients */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Brak klientów</p>
            <p className="text-sm text-muted-foreground/70">Dodaj pierwszego klienta klikając przycisk powyżej</p>
          </div>
        ) : viewMode === 'list' ? (
          /* List View */
          <div className="bg-card border border-border/60 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground uppercase">
                  <th className="text-left p-4 font-medium">Klient</th>
                  <th className="text-left p-4 font-medium hidden md:table-cell">Kontakt</th>
                  <th className="text-left p-4 font-medium hidden lg:table-cell">Lokalizacja</th>
                  <th className="text-left p-4 font-medium hidden sm:table-cell">Budżet</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-right p-4 font-medium">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => {
                  const assignedEmployee = employees.find(e => e.id === client.assigned_to);
                  const alerts = getClientAlerts(client);
                  const primaryAlert = alerts.length > 0 ? alerts[0] : null;
                  
                  const getRowBgClass = () => {
                    if (!primaryAlert) return '';
                    if (primaryAlert.color === 'red') return 'bg-red-500/10 hover:bg-red-500/15';
                    if (primaryAlert.color === 'amber') return 'bg-amber-500/10 hover:bg-amber-500/15';
                    if (primaryAlert.color === 'pink') return 'bg-pink-500/10 hover:bg-pink-500/15';
                    return '';
                  };

                  return (
                    <tr 
                      key={client.id}
                      className={`border-b border-border/50 hover:bg-secondary/50 transition-colors cursor-pointer group ${getRowBgClass()}`}
                      onClick={() => navigate(`/clients/${client.id}`)}
                    >
                      <td className="p-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-foreground group-hover:text-pink-400 transition-colors">{client.salon_name}</span>
                            {alerts.map((alert, idx) => (
                              <span 
                                key={idx}
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                  alert.color === 'red' ? 'bg-red-500/20 text-red-400' :
                                  alert.color === 'amber' ? 'bg-amber-500/20 text-amber-400' :
                                  'bg-pink-500/20 text-pink-400'
                                }`}
                              >
                                {alert.type === 'missing_invoice' ? <FileText className="w-2.5 h-2.5" /> :
                                 alert.type === 'payment_due' ? <CreditCard className="w-2.5 h-2.5" /> :
                                 alert.type === 'final_invoice_due' ? <Clock className="w-2.5 h-2.5" /> :
                                 <AlertCircle className="w-2.5 h-2.5" />}
                                {alert.label}
                              </span>
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">{client.owner_name}</span>
                          <button
                            onClick={(e) => copyClientId(e, client.id)}
                            className="text-[10px] text-muted-foreground hover:text-pink-400 flex items-center gap-1 mt-1 w-fit"
                          >
                            <Copy className="w-2.5 h-2.5" />
                            {client.id.slice(0, 8)}...
                          </button>
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <div className="flex flex-col gap-1 text-sm text-foreground/80">
                          {client.phone && <span>{client.phone}</span>}
                          {client.email && <span className="text-xs text-muted-foreground truncate max-w-[200px]">{client.email}</span>}
                        </div>
                      </td>
                      <td className="p-4 hidden lg:table-cell">
                        <div className="flex flex-col gap-1">
                          {client.city && <span className="text-sm text-foreground/80">{client.city}</span>}
                          {client.industry && <span className="text-xs text-muted-foreground">{client.industry}</span>}
                        </div>
                      </td>
                      <td className="p-4 hidden sm:table-cell">
                        <span className="text-sm font-medium text-green-400">{formatCurrency(client.monthly_budget)}</span>
                      </td>
                      <td className="p-4">
                        <Badge className={`${statusColors[client.status]} border text-xs`}>
                          {statusLabels[client.status]}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => { e.stopPropagation(); navigate(`/clients/${client.id}`); }}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(client); }}>
                                <Pencil className="w-4 h-4 mr-2" />
                                Edytuj
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={(e) => { e.stopPropagation(); handleDelete(client.id); }}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Usuń
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Grid View */
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredClients.map((client) => {
              const assignedEmployee = employees.find(e => e.id === client.assigned_to);
              const alerts = getClientAlerts(client);
              const primaryAlert = alerts.length > 0 ? alerts[0] : null;
              
              const getCardClasses = () => {
                if (!primaryAlert) return '';
                if (primaryAlert.color === 'red') return 'ring-2 ring-red-500/50 border-red-500/30';
                if (primaryAlert.color === 'amber') return 'ring-2 ring-amber-500/50 border-amber-500/30';
                if (primaryAlert.color === 'pink') return 'ring-2 ring-pink-500/50 border-pink-500/30';
                return '';
              };

              const getGradientClass = () => {
                if (!primaryAlert) return 'bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600';
                if (primaryAlert.color === 'red') return 'bg-gradient-to-r from-red-500 via-red-400 to-red-500';
                if (primaryAlert.color === 'amber') return 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 animate-pulse';
                if (primaryAlert.color === 'pink') return 'bg-gradient-to-r from-pink-500 via-pink-400 to-pink-500';
                return 'bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600';
              };

              const getCornerColor = () => {
                if (!primaryAlert) return '';
                if (primaryAlert.color === 'red') return 'border-t-red-500';
                if (primaryAlert.color === 'amber') return 'border-t-amber-500';
                if (primaryAlert.color === 'pink') return 'border-t-pink-500';
                return '';
              };

              return (
                <Card 
                  key={client.id} 
                  className={`group border-border/60 bg-card hover:bg-secondary/50 transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-pink-500/5 hover:border-pink-500/30 overflow-hidden relative ${getCardClasses()}`}
                  onClick={() => navigate(`/clients/${client.id}`)}
                >
                  {/* Requires interaction indicator */}
                  {primaryAlert && (
                    <div className={`absolute top-0 right-0 w-0 h-0 border-t-[40px] border-l-[40px] border-l-transparent ${getCornerColor()}`}>
                      {primaryAlert.type === 'missing_invoice' ? (
                        <FileText className="absolute -top-[34px] right-1 w-4 h-4 text-white" />
                      ) : primaryAlert.type === 'payment_due' ? (
                        <CreditCard className="absolute -top-[34px] right-1 w-4 h-4 text-white" />
                      ) : primaryAlert.type === 'final_invoice_due' ? (
                        <Clock className="absolute -top-[34px] right-1 w-4 h-4 text-white" />
                      ) : (
                        <AlertCircle className="absolute -top-[34px] right-1 w-4 h-4 text-white" />
                      )}
                    </div>
                  )}
                  
                  {/* Header with gradient accent */}
                  <div className={`h-1.5 ${getGradientClass()}`} />
                  
                  <CardHeader className="pb-3 pt-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-lg font-bold text-foreground truncate group-hover:text-pink-400 transition-colors">
                            {client.salon_name}
                          </CardTitle>
                        </div>
                        {client.owner_name && (
                          <p className="text-sm text-muted-foreground truncate flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-pink-500/50" />
                            {client.owner_name}
                          </p>
                        )}
                        {/* All alerts */}
                        {alerts.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {alerts.map((alert, idx) => (
                              <div 
                                key={idx}
                                className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${
                                  alert.color === 'red' ? 'bg-red-500/20 text-red-400' :
                                  alert.color === 'amber' ? 'bg-amber-500/20 text-amber-400' :
                                  'bg-pink-500/20 text-pink-400'
                                }`}
                              >
                                {alert.type === 'missing_invoice' ? <FileText className="w-3 h-3" /> :
                                 alert.type === 'payment_due' ? <CreditCard className="w-3 h-3" /> :
                                 alert.type === 'final_invoice_due' ? <Clock className="w-3 h-3" /> :
                                 <AlertCircle className="w-3 h-3" />}
                                {alert.label}
                              </div>
                            ))}
                          </div>
                        )}
                        {/* Client ID */}
                        <button
                          onClick={(e) => copyClientId(e, client.id)}
                          className="text-[10px] text-muted-foreground hover:text-pink-400 flex items-center gap-1 mt-1"
                        >
                          <Copy className="w-2.5 h-2.5" />
                          ID: {client.id.slice(0, 8)}...
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${statusColors[client.status]} border text-xs font-medium`}>
                          {statusLabels[client.status]}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-card border-border">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(client); }}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edytuj
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => { e.stopPropagation(); handleDelete(client.id); }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Usuń
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4 pb-4">
                    {/* Location & Industry */}
                    <div className="flex flex-wrap items-center gap-2">
                      {client.city && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary text-xs text-foreground/80">
                          <MapPin className="w-3 h-3 text-pink-400" />
                          {client.city}
                        </div>
                      )}
                      {client.industry && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary text-xs text-foreground/80">
                          <Building2 className="w-3 h-3 text-blue-400" />
                          {client.industry}
                        </div>
                      )}
                    </div>
                    
                    {/* Contact Info */}
                    <div className="grid gap-2">
                      {client.phone && (
                        <div className="flex items-center gap-2.5 text-sm">
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <Phone className="w-3.5 h-3.5 text-emerald-400" />
                          </div>
                          <span className="text-foreground/80 font-medium">{client.phone}</span>
                        </div>
                      )}
                      {client.email && (
                        <div className="flex items-center gap-2.5 text-sm">
                          <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <Mail className="w-3.5 h-3.5 text-blue-400" />
                          </div>
                          <span className="text-foreground/80 truncate">{client.email}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Social Links */}
                    {(client.instagram || client.facebook_page) && (
                      <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                        {client.instagram && (
                          <a
                            href={`https://instagram.com/${client.instagram.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-pink-500/10 to-purple-500/10 text-pink-400 text-xs hover:from-pink-500/20 hover:to-purple-500/20 transition-colors"
                          >
                            <Instagram className="w-3.5 h-3.5" />
                            {client.instagram}
                          </a>
                        )}
                      </div>
                    )}
                    
                    {/* Footer with Budget & Date */}
                    <div className="flex items-center justify-between pt-3 mt-2 border-t border-border/50">
                      <div className="flex items-center gap-4">
                        {client.monthly_budget ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-md bg-green-500/10 flex items-center justify-center">
                              <DollarSign className="w-3.5 h-3.5 text-green-400" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-green-400">{formatCurrency(client.monthly_budget)}</span>
                              <span className="text-[10px] text-muted-foreground">miesięcznie</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">Brak budżetu</span>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {client.contract_start_date && (
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            od {new Date(client.contract_start_date).toLocaleDateString('pl-PL')}
                          </div>
                        )}
                        {assignedEmployee && (
                          <div className="text-[10px] text-pink-400/70">
                            {assignedEmployee.full_name || assignedEmployee.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
