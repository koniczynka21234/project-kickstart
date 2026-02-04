import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { notifyGuardianAssigned } from '@/lib/notifications';
import { ClientAcademyCard } from '@/components/client/ClientAcademyCard';
import { ClientPaymentsSection } from '@/components/client/ClientPaymentsSection';
import { RenewContractDialog } from '@/components/client/RenewContractDialog';
import { DocumentMiniCard } from '@/components/document/DocumentMiniCard';
import { DocumentViewer } from '@/components/document/DocumentViewer';
import { CloudDocumentItem } from '@/hooks/useCloudDocumentHistory';
import { 
  ArrowLeft,
  Phone, 
  Mail, 
  MapPin, 
  Instagram,
  Facebook,
  Calendar,
  DollarSign,
  FileText,
  Target,
  TrendingUp,
  Loader2,
  ExternalLink,
  User,
  CheckSquare,
  Clock,
  AlertCircle,
  Copy,
  Building2,
  Pencil,
  Plus,
  Save,
  X,
  RefreshCw
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  budget: number | null;
  start_date: string;
  end_date: string | null;
  objective: string | null;
}

interface Document {
  id: string;
  type: string;
  title: string;
  subtitle: string | null;
  thumbnail: string | null;
  created_at: string;
  created_by: string | null;
  data: Record<string, any> | null;
  // Enriched fields
  creatorName?: string;
  creatorRole?: 'szef' | 'pracownik' | null;
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  created_at: string;
}

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

const campaignStatusColors: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400',
  paused: 'bg-yellow-500/20 text-yellow-400',
  completed: 'bg-blue-500/20 text-blue-400',
  draft: 'bg-muted text-muted-foreground',
};

const documentTypeLabels: Record<string, string> = {
  report: 'Raport',
  invoice: 'Faktura',
  contract: 'Umowa',
  presentation: 'Prezentacja',
};

const documentTypeColors: Record<string, string> = {
  report: 'bg-blue-500/20 text-blue-400',
  invoice: 'bg-green-500/20 text-green-400',
  contract: 'bg-purple-500/20 text-purple-400',
  presentation: 'bg-pink-500/20 text-pink-400',
};

export default function ClientProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [client, setClient] = useState<Client | null>(null);
  const [assignedEmployee, setAssignedEmployee] = useState<Profile | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [totalSpent, setTotalSpent] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
  
  // Edit states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [savingAssignment, setSavingAssignment] = useState(false);
  
  // Campaign dialog
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  
  // Contract renewal dialog
  const [renewDialogOpen, setRenewDialogOpen] = useState(false);
  const [savingCampaign, setSavingCampaign] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    status: 'active',
    objective: '',
    budget: '',
    start_date: '',
    end_date: '',
  });
  
  // Document preview states
  const [miniCardDocument, setMiniCardDocument] = useState<CloudDocumentItem | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<CloudDocumentItem | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  
  
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
    contract_end_date: '',
    contract_duration_months: '1',
    monthly_budget: '',
    notes: '',
    assigned_to: '',
    industry: '',
  });
  
  const [savingStatus, setSavingStatus] = useState(false);

  useEffect(() => {
    if (id) {
      fetchClientData();
      fetchEmployees();
    }
  }, [id]);

  const fetchEmployees = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .order('full_name');
    setEmployees(data || []);
    
    // Get current user's profile for notification
    if (user) {
      const currentProfile = data?.find(p => p.id === user.id);
      setCurrentUserProfile(currentProfile || null);
    }
  };

  const fetchClientData = async () => {
    setLoading(true);
    
    // Fetch client
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (clientError) {
      toast.error('Nie znaleziono klienta');
      navigate('/clients');
      return;
    }
    setClient(clientData);

    // Fetch assigned employee if exists
    if (clientData.assigned_to) {
      const { data: employeeData } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('id', clientData.assigned_to)
        .single();
      
      setAssignedEmployee(employeeData);
    }

    // Fetch campaigns for this client
    const { data: campaignsData } = await supabase
      .from('campaigns')
      .select('*')
      .eq('client_id', id)
      .order('start_date', { ascending: false });
    
    setCampaigns(campaignsData || []);

    // Fetch campaign metrics to calculate total spent
    if (campaignsData && campaignsData.length > 0) {
      const campaignIds = campaignsData.map(c => c.id);
      const { data: metricsData } = await supabase
        .from('campaign_metrics')
        .select('spend')
        .in('campaign_id', campaignIds);
      
      const spent = (metricsData || []).reduce((sum, m) => sum + (Number(m.spend) || 0), 0);
      setTotalSpent(spent);
    } else {
      setTotalSpent(0);
    }

    // Fetch documents for this client with creator info
    const { data: documentsData } = await supabase
      .from('documents')
      .select('id, type, title, subtitle, thumbnail, created_at, data, created_by')
      .eq('client_id', id)
      .order('created_at', { ascending: false });
    
    // Fetch creator profiles and roles
    const creatorIds = [...new Set((documentsData || []).map(d => d.created_by).filter(Boolean))] as string[];
    let profilesMap: Record<string, string> = {};
    let rolesMap: Record<string, 'szef' | 'pracownik'> = {};
    
    if (creatorIds.length > 0) {
      const [profilesRes, rolesRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name').in('id', creatorIds),
        supabase.from('user_roles').select('user_id, role').in('user_id', creatorIds)
      ]);
      
      profilesMap = (profilesRes.data || []).reduce((acc, p) => {
        acc[p.id] = p.full_name || 'Nieznany';
        return acc;
      }, {} as Record<string, string>);
      
      rolesMap = (rolesRes.data || []).reduce((acc, r) => {
        acc[r.user_id] = r.role as 'szef' | 'pracownik';
        return acc;
      }, {} as Record<string, 'szef' | 'pracownik'>);
    }
    
    setDocuments((documentsData || []).map(doc => ({
      ...doc,
      data: (typeof doc.data === 'object' && doc.data !== null ? doc.data : {}) as Record<string, any>,
      creatorName: doc.created_by ? profilesMap[doc.created_by] : undefined,
      creatorRole: doc.created_by ? rolesMap[doc.created_by] : null
    })));

    // Fetch tasks for this client
    const { data: tasksData } = await supabase
      .from('tasks')
      .select('id, title, status, priority, due_date, created_at')
      .eq('client_id', id)
      .order('created_at', { ascending: false });
    
    setTasks(tasksData || []);
    
    setLoading(false);
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return '-';
    return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(value);
  };

  const handleAssignEmployee = async (employeeId: string | null) => {
    if (!id || !client) return;
    setSavingAssignment(true);
    
    const { error } = await supabase
      .from('clients')
      .update({ assigned_to: employeeId })
      .eq('id', id);
    
    if (error) {
      toast.error('Błąd podczas przypisywania opiekuna');
    } else {
      toast.success('Opiekun został przypisany');
      
      // Send notification to the assigned employee
      if (employeeId && user) {
        const assignerName = currentUserProfile?.full_name || currentUserProfile?.email || 'Użytkownik';
        await notifyGuardianAssigned(
          client.id,
          client.salon_name,
          employeeId,
          assignerName,
          user.id
        );
      }
      
      fetchClientData();
    }
    setSavingAssignment(false);
  };

  const handleSaveNotes = async () => {
    if (!id) return;
    setSavingNotes(true);
    
    const { error } = await supabase
      .from('clients')
      .update({ notes: notesValue || null })
      .eq('id', id);
    
    if (error) {
      toast.error('Błąd podczas zapisywania notatek');
    } else {
      toast.success('Notatki zapisane');
      setClient(prev => prev ? { ...prev, notes: notesValue || null } : null);
      setEditingNotes(false);
    }
    setSavingNotes(false);
  };

  const openEditDialog = () => {
    if (!client) return;
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
      contract_end_date: client.contract_end_date || '',
      contract_duration_months: client.contract_duration_months?.toString() || '1',
      monthly_budget: client.monthly_budget?.toString() || '',
      notes: client.notes || '',
      assigned_to: client.assigned_to || '',
      industry: client.industry || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
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
      contract_end_date: formData.contract_end_date || null,
      contract_duration_months: formData.contract_duration_months ? parseInt(formData.contract_duration_months) : 1,
      monthly_budget: formData.monthly_budget ? parseFloat(formData.monthly_budget) : null,
      notes: formData.notes || null,
      assigned_to: formData.assigned_to || null,
      industry: formData.industry || null,
    };
    
    const { error } = await supabase
      .from('clients')
      .update(submitData)
      .eq('id', id);
    
    if (error) {
      toast.error('Błąd aktualizacji klienta');
    } else {
      toast.success('Klient zaktualizowany');
      setIsEditDialogOpen(false);
      fetchClientData();
    }
  };

  const handleQuickStatusChange = async (newStatus: string) => {
    if (!id || !client) return;
    setSavingStatus(true);
    
    const { error } = await supabase
      .from('clients')
      .update({ status: newStatus })
      .eq('id', id);
    
    if (error) {
      toast.error('Błąd podczas zmiany statusu');
    } else {
      toast.success(`Status zmieniony na: ${statusLabels[newStatus]}`);
      setClient(prev => prev ? { ...prev, status: newStatus } : null);
    }
    setSavingStatus(false);
  };

  // Calculate contract status
  const getContractStatus = () => {
    if (!client || !client.contract_start_date) return null;
    
    const startDate = new Date(client.contract_start_date);
    const endDate = client.contract_end_date 
      ? new Date(client.contract_end_date)
      : new Date(startDate.getTime() + (client.contract_duration_months || 1) * 30 * 24 * 60 * 60 * 1000);
    
    const now = new Date();
    const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      startDate,
      endDate,
      daysRemaining,
      isExpired: daysRemaining < 0,
      isExpiringSoon: daysRemaining >= 0 && daysRemaining <= 7,
    };
  };

  const handleAddCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user) return;

    setSavingCampaign(true);
    try {
      const { error } = await supabase.from('campaigns').insert({
        client_id: id,
        name: campaignForm.name,
        status: campaignForm.status,
        objective: campaignForm.objective || null,
        budget: campaignForm.budget ? parseFloat(campaignForm.budget) : null,
        start_date: campaignForm.start_date,
        end_date: campaignForm.end_date || null,
        created_by: user.id,
      });

      if (error) throw error;
      
      toast.success('Kampania dodana');
      setCampaignDialogOpen(false);
      setCampaignForm({ name: '', status: 'active', objective: '', budget: '', start_date: '', end_date: '' });
      fetchClientData();
    } catch (error) {
      toast.error('Błąd podczas dodawania kampanii');
    } finally {
      setSavingCampaign(false);
    }
  };


  const industryOptions = [
    'Fryzjerstwo', 'Kosmetyka', 'Paznokcie', 'Spa & Wellness', 
    'Barber', 'Makijaż', 'Brwi i rzęsy', 'Inne'
  ];

  const statusLabelsEdit: Record<string, string> = {
    active: 'Aktywny', paused: 'Wstrzymany', churned: 'Zakończony'
  };

  // Convert Document to CloudDocumentItem for preview components
  const convertToCloudDocument = (doc: Document): CloudDocumentItem => ({
    id: doc.id,
    type: doc.type as CloudDocumentItem['type'],
    title: doc.title,
    subtitle: doc.subtitle || null,
    thumbnail: doc.thumbnail || null,
    createdAt: doc.created_at,
    createdBy: doc.created_by,
    creatorName: doc.creatorName,
    creatorRole: doc.creatorRole,
    data: Object.fromEntries(
      Object.entries(doc.data || {}).map(([k, v]) => [k, String(v)])
    ),
  });

  const handleDocumentClick = (doc: Document) => {
    setMiniCardDocument(convertToCloudDocument(doc));
  };

  const handleCloseMiniCard = () => {
    setMiniCardDocument(null);
  };

  const handleOpenFullscreen = () => {
    if (miniCardDocument) {
      setSelectedDocument(miniCardDocument);
      setViewerOpen(true);
      setMiniCardDocument(null);
    }
  };

  // View linked invoice (advance <-> final)
  const handleViewLinkedInvoice = async (linkedDocumentId: string) => {
    const { data } = await supabase
      .from('documents')
      .select('*')
      .eq('id', linkedDocumentId)
      .maybeSingle();
    
    if (data) {
      setMiniCardDocument({
        id: data.id,
        type: data.type as any,
        title: data.title,
        subtitle: data.subtitle,
        data: data.data as Record<string, string>,
        thumbnail: data.thumbnail,
        createdAt: data.created_at,
        createdBy: data.created_by,
        clientId: data.client_id
      });
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!client) return null;

  const contractStatus = getContractStatus();
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const pendingTasks = tasks.filter(t => t.status !== 'completed').length;
  const totalCampaignBudget = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
  const displayBudget = client.monthly_budget ?? (totalCampaignBudget > 0 ? totalCampaignBudget : null);
  const budgetLabel = 'Budżet kampanii';
  const budgetTooltip = client.monthly_budget 
    ? 'Miesięczny budżet reklamowy klientki'
    : `Suma budżetów z ${campaigns.length} kampanii`;

  const copyClientId = () => {
    navigator.clipboard.writeText(client.id);
    toast.success('ID klienta skopiowane');
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 space-y-6 animate-fade-in w-full max-w-full overflow-hidden">
        {/* Header with Back & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/clients')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Powrót do klientów
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={copyClientId}>
              <Copy className="w-4 h-4 mr-2" />
              Kopiuj ID
            </Button>
            <Button variant="outline" size="sm" onClick={openEditDialog}>
              <Pencil className="w-4 h-4 mr-2" />
              Edytuj
            </Button>
          </div>
        </div>

        {/* Alert banner for expiring/expired contracts - only show when 3 days or less remaining */}
        {client.status !== 'churned' && contractStatus && contractStatus.daysRemaining <= 3 && (
          <div className={`rounded-xl border p-4 flex items-center justify-between gap-4 ${
            contractStatus.daysRemaining <= 0
              ? 'bg-red-500/10 border-red-500/30' 
              : 'bg-amber-500/10 border-amber-500/30'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${contractStatus.daysRemaining <= 0 ? 'bg-red-500/20' : 'bg-amber-500/20'}`}>
                <AlertCircle className={`w-5 h-5 ${contractStatus.daysRemaining <= 0 ? 'text-red-400' : 'text-amber-400'}`} />
              </div>
              <div>
                <p className={`font-semibold ${contractStatus.daysRemaining <= 0 ? 'text-red-400' : 'text-amber-400'}`}>
                  {contractStatus.daysRemaining < 0 
                    ? `Umowa wygasła ${Math.abs(contractStatus.daysRemaining)} dni temu!`
                    : contractStatus.daysRemaining === 0
                      ? 'Umowa wygasa dzisiaj!'
                      : `Umowa wygasa za ${contractStatus.daysRemaining} dni`
                  }
                </p>
                <p className="text-sm text-muted-foreground">
                  {contractStatus.daysRemaining <= 0 
                    ? 'Klient wymaga pilnego kontaktu w sprawie przedłużenia współpracy.'
                    : 'Skontaktuj się z klientem w sprawie przedłużenia umowy.'
                  }
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setRenewDialogOpen(true)}
              className={contractStatus.daysRemaining <= 0
                ? 'border-red-500/50 text-red-400 hover:bg-red-500/10' 
                : 'border-amber-500/50 text-amber-400 hover:bg-amber-500/10'
              }
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Przedłuż umowę
            </Button>
          </div>
        )}

        {/* Main Header Card */}
        <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br from-card to-background ${
          client.status !== 'churned' && contractStatus && contractStatus.daysRemaining <= 3
            ? contractStatus.daysRemaining <= 0 
              ? 'border-red-500/50' 
              : 'border-amber-500/50'
            : 'border-border/50'
        }`}>
          <div className={`h-2 ${
            client.status !== 'churned' && contractStatus && contractStatus.daysRemaining <= 3
              ? contractStatus.daysRemaining <= 0 
                ? 'bg-gradient-to-r from-red-500 via-red-400 to-red-500' 
                : 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500'
              : 'bg-gradient-to-r from-primary via-accent to-primary'
          }`} />
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-foreground">{client.salon_name}</h1>
                  <Badge className={`${statusColors[client.status]} border`}>
                    {statusLabels[client.status]}
                  </Badge>
                </div>
                {client.owner_name && (
                  <p className="text-lg text-muted-foreground mb-4">{client.owner_name}</p>
                )}
                
                {/* Quick Info Pills */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {client.city && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-sm text-foreground/80">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                      {client.city}
                    </div>
                  )}
                  {client.industry && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-sm text-foreground/80">
                      <Building2 className="w-3.5 h-3.5 text-blue-400" />
                      {client.industry}
                    </div>
                  )}
                  {client.contract_start_date && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-sm text-foreground/80">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                      od {format(new Date(client.contract_start_date), 'd MMM yyyy', { locale: pl })}
                    </div>
                  )}
                </div>
                
                {/* Client ID */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>ID:</span>
                  <code className="px-2 py-0.5 rounded bg-secondary font-mono">{client.id}</code>
                </div>
              </div>
              
              {/* Key Metrics - Inline chips */}
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {/* Kwota współpracy - primary highlight */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/15 border border-primary/40">
                  <DollarSign className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-primary">
                    {client.contract_amount ? formatCurrency(client.contract_amount) : '—'}
                  </span>
                  <span className="text-xs text-primary/70">/mies</span>
                </div>
                
                {/* Budżet kampanii */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary border border-border/50 cursor-help">
                        <Target className="w-4 h-4 text-emerald-400" />
                        <span className="text-muted-foreground">Budżet:</span>
                        <span className="font-semibold text-emerald-400">{formatCurrency(displayBudget)}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>{budgetTooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* Wydano */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary border border-border/50">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <span className="text-muted-foreground">Wydano:</span>
                  <span className="font-semibold text-purple-400">{formatCurrency(totalSpent)}</span>
                </div>

                {/* Kampanie */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary border border-border/50">
                  <Target className="w-4 h-4 text-blue-400" />
                  <span className="font-semibold text-blue-400">{activeCampaigns}</span>
                  <span className="text-muted-foreground">kampanii</span>
                </div>

                {/* Zadania */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary border border-border/50">
                  <CheckSquare className="w-4 h-4 text-orange-400" />
                  <span className="font-semibold text-orange-400">{pendingTasks}</span>
                  <span className="text-muted-foreground">zadań</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact & Details Grid */}
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Contract Period & Status Card */}
          <Card className="border-border/50 bg-card/80">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Okres współpracy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quick Status Change */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Status współpracy</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <Button
                      key={value}
                      size="sm"
                      variant={client.status === value ? "default" : "outline"}
                      className={client.status === value ? statusColors[value] : ""}
                      onClick={() => handleQuickStatusChange(value)}
                      disabled={savingStatus || client.status === value}
                    >
                      {savingStatus && client.status !== value ? (
                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                      ) : null}
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Contract Period Info */}
              {contractStatus ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-secondary/30">
                    <p className="text-xs text-muted-foreground mb-1">Początek umowy</p>
                    <p className="font-medium">{format(contractStatus.startDate, 'd MMMM yyyy', { locale: pl })}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${
                    contractStatus.isExpired 
                      ? 'bg-red-500/10 border border-red-500/30' 
                      : contractStatus.isExpiringSoon 
                        ? 'bg-amber-500/10 border border-amber-500/30 animate-pulse'
                        : 'bg-secondary/30'
                  }`}>
                    <p className="text-xs text-muted-foreground mb-1">Koniec umowy</p>
                    <p className={`font-medium ${
                      contractStatus.isExpired 
                        ? 'text-red-400' 
                        : contractStatus.isExpiringSoon 
                          ? 'text-amber-400'
                          : ''
                    }`}>{format(contractStatus.endDate, 'd MMMM yyyy', { locale: pl })}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${
                    contractStatus.isExpired 
                      ? 'bg-red-500/10 border border-red-500/30' 
                      : contractStatus.isExpiringSoon 
                        ? 'bg-yellow-500/10 border border-yellow-500/30'
                        : 'bg-green-500/10 border border-green-500/30'
                  }`}>
                    <p className="text-xs text-muted-foreground mb-1">Status umowy</p>
                    {contractStatus.isExpired ? (
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400" />
                        <p className="font-medium text-red-400">Umowa wygasła {Math.abs(contractStatus.daysRemaining)} dni temu</p>
                      </div>
                    ) : contractStatus.isExpiringSoon ? (
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-400" />
                        <p className="font-medium text-yellow-400">Wygasa za {contractStatus.daysRemaining} dni</p>
                      </div>
                    ) : (
                      <p className="font-medium text-green-400">Aktywna ({contractStatus.daysRemaining} dni pozostało)</p>
                    )}
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/30">
                    <p className="text-xs text-muted-foreground mb-1">Długość umowy</p>
                    <p className="font-medium">{client.contract_duration_months || 1} {(client.contract_duration_months || 1) === 1 ? 'miesiąc' : 'miesiące'}</p>
                  </div>
                  
                  
                  {/* Renew Contract Button */}
                  <Button 
                    onClick={() => setRenewDialogOpen(true)} 
                    variant="outline" 
                    className="w-full mt-2"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Przedłuż umowę
                  </Button>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-secondary/20 border border-dashed border-border text-center">
                  <Calendar className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">Brak danych o umowie</p>
                  <Button size="sm" variant="ghost" className="mt-2" onClick={openEditDialog}>
                    <Plus className="w-4 h-4 mr-1" />
                    Ustaw daty
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payments Section */}
          <ClientPaymentsSection 
            clientId={id!} 
            clientName={client?.salon_name}
            contractAmount={client?.contract_amount ?? null}
          />

          {/* Contact Info */}
          <Card className="border-border/50 bg-card/80">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary" />
                Dane kontaktowe
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {client.phone && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Telefon</p>
                    <p className="font-medium">{client.phone}</p>
                  </div>
                </div>
              )}
              {client.email && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium">{client.email}</p>
                  </div>
                </div>
              )}
              {client.instagram && (
                <a 
                  href={`https://instagram.com/${client.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center">
                    <Instagram className="w-5 h-5 text-pink-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Instagram</p>
                    <p className="font-medium">{client.instagram}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </a>
              )}
              {client.facebook_page && (
                <a 
                  href={client.facebook_page.startsWith('http') ? client.facebook_page : `https://facebook.com/${client.facebook_page}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-600/10 flex items-center justify-center">
                    <Facebook className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Facebook</p>
                    <p className="font-medium text-blue-400">Otwórz stronę</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </a>
              )}
              {client.business_manager_url && (
                <a 
                  href={client.business_manager_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                    <Target className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Business Manager</p>
                    <p className="font-medium text-indigo-400">Otwórz panel</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </a>
              )}
              {!client.phone && !client.email && !client.instagram && !client.facebook_page && !client.business_manager_url && (
                <p className="text-muted-foreground text-sm text-center py-4">Brak danych kontaktowych</p>
              )}
            </CardContent>
          </Card>

          {/* Assigned Employee & Notes */}
          <Card className="border-border/50 bg-card/80">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Opiekun i notatki
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Employee Assignment */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Przypisany opiekun</p>
                <Select
                  value={client.assigned_to || "none"}
                  onValueChange={(v) => handleAssignEmployee(v === "none" ? null : v)}
                  disabled={savingAssignment}
                >
                  <SelectTrigger className="w-full">
                    {savingAssignment ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <SelectValue placeholder="Wybierz opiekuna" />
                    )}
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
                {assignedEmployee && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      {(assignedEmployee.full_name || assignedEmployee.email || '?')[0].toUpperCase()}
                    </div>
                    <p className="font-medium">{assignedEmployee.full_name || assignedEmployee.email}</p>
                  </div>
                )}
              </div>
              
              {/* Notes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Notatki</p>
                  {!editingNotes && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-6 px-2"
                      onClick={() => {
                        setNotesValue(client.notes || '');
                        setEditingNotes(true);
                      }}
                    >
                      <Pencil className="w-3 h-3 mr-1" />
                      Edytuj
                    </Button>
                  )}
                </div>
                {editingNotes ? (
                  <div className="space-y-2">
                    <Textarea
                      value={notesValue}
                      onChange={(e) => setNotesValue(e.target.value)}
                      placeholder="Dodaj notatki o kliencie..."
                      rows={4}
                      className="resize-none"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingNotes(false)}
                        disabled={savingNotes}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Anuluj
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveNotes}
                        disabled={savingNotes}
                      >
                        {savingNotes ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-1" />
                        ) : (
                          <Save className="w-4 h-4 mr-1" />
                        )}
                        Zapisz
                      </Button>
                    </div>
                  </div>
                ) : client.notes ? (
                  <div className="p-3 rounded-lg bg-secondary/30">
                    <p className="text-sm whitespace-pre-wrap">{client.notes}</p>
                  </div>
                ) : (
                  <div 
                    className="p-3 rounded-lg bg-secondary/20 border border-dashed border-border text-center cursor-pointer hover:bg-secondary/30 transition-colors"
                    onClick={() => {
                      setNotesValue('');
                      setEditingNotes(true);
                    }}
                  >
                    <p className="text-sm text-muted-foreground">Kliknij aby dodać notatki</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Aurine Academy Card */}
          <ClientAcademyCard clientId={id!} />
        </div>

        {/* Campaigns Section */}
        <Card className="border-border/50 bg-card/80">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5" />
                Kampanie ({campaigns.length})
              </CardTitle>
              <Button 
                size="sm" 
                onClick={() => {
                  setCampaignForm({ 
                    name: '', 
                    status: 'active', 
                    objective: '', 
                    budget: '', 
                    start_date: format(new Date(), 'yyyy-MM-dd'), 
                    end_date: '' 
                  });
                  setCampaignDialogOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-1" />
                Dodaj kampanię
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {campaigns.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                Brak kampanii dla tego klienta
              </p>
            ) : (
              <div className="space-y-3">
                {campaigns.map((campaign) => (
                  <div 
                    key={campaign.id} 
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/campaigns/${campaign.id}`)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{campaign.name}</h4>
                        <Badge className={campaignStatusColors[campaign.status] || 'bg-zinc-500/20 text-zinc-400'}>
                          {campaign.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{format(new Date(campaign.start_date), 'd MMM yyyy', { locale: pl })}</span>
                        {campaign.end_date && (
                          <span>→ {format(new Date(campaign.end_date), 'd MMM yyyy', { locale: pl })}</span>
                        )}
                        {campaign.objective && <span>• {campaign.objective}</span>}
                      </div>
                    </div>
                    {campaign.budget && (
                      <div className="text-right">
                        <p className="font-semibold text-primary">{formatCurrency(campaign.budget)}</p>
                        <p className="text-xs text-muted-foreground">budżet</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documents Section */}
        <Card className="border-border/50 bg-card/80">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Dokumenty ({documents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                Brak dokumentów dla tego klienta
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {documents.map((doc) => (
                  <div 
                    key={doc.id} 
                    className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer"
                    onClick={() => handleDocumentClick(doc)}
                  >
                    {doc.thumbnail ? (
                      <img 
                        src={doc.thumbnail} 
                        alt={doc.title}
                        className="w-12 h-12 rounded object-cover"
                      />
                    ) : (
                      <div className={`w-12 h-12 rounded flex items-center justify-center ${documentTypeColors[doc.type] || 'bg-muted'}`}>
                        <FileText className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">{doc.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge className={`text-[10px] ${documentTypeColors[doc.type] || 'bg-muted text-muted-foreground'}`}>
                          {documentTypeLabels[doc.type] || doc.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(doc.created_at), 'd MMM', { locale: pl })}
                        </span>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tasks Section */}
        <Card className="border-border/50 bg-card/80">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckSquare className="w-5 h-5" />
              Zadania ({tasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                Brak zadań dla tego klienta
              </p>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => {
                  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';
                  return (
                    <div 
                      key={task.id} 
                      className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer"
                      onClick={() => navigate('/tasks')}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        task.status === 'completed' ? 'bg-green-500/20' :
                        task.status === 'in_progress' ? 'bg-blue-500/20' :
                        'bg-muted'
                      }`}>
                        {task.status === 'completed' ? (
                          <CheckSquare className="w-5 h-5 text-green-400" />
                        ) : (
                          <Clock className="w-5 h-5 text-blue-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-sm">{task.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge className={`text-[10px] ${
                            task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                            task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {task.priority === 'high' ? 'Wysoki' : task.priority === 'medium' ? 'Średni' : 'Niski'}
                          </Badge>
                          {task.due_date && (
                            <span className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-red-400' : 'text-muted-foreground'}`}>
                              {isOverdue && <AlertCircle className="w-3 h-3" />}
                              {format(new Date(task.due_date), 'd MMM', { locale: pl })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edytuj klienta</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Nazwa salonu *</Label>
                <Input
                  value={formData.salon_name}
                  onChange={(e) => setFormData({ ...formData, salon_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Właściciel</Label>
                <Input
                  value={formData.owner_name}
                  onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Miasto</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div>
                <Label>Telefon</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label>Instagram</Label>
                <Input
                  value={formData.instagram}
                  onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                  placeholder="@nazwasalonu"
                />
              </div>
              <div>
                <Label>Facebook</Label>
                <Input
                  value={formData.facebook_page}
                  onChange={(e) => setFormData({ ...formData, facebook_page: e.target.value })}
                  placeholder="Link do strony FB"
                />
              </div>
              <div className="col-span-2">
                <Label>Business Manager</Label>
                <Input
                  value={formData.business_manager_url}
                  onChange={(e) => setFormData({ ...formData, business_manager_url: e.target.value })}
                  placeholder="Link do Business Manager"
                />
              </div>
              <div className="col-span-2 p-3 rounded-lg bg-secondary/30 space-y-3">
                <p className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Okres umowy
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Data rozpoczęcia</Label>
                    <Input
                      type="date"
                      value={formData.contract_start_date}
                      onChange={(e) => setFormData({ ...formData, contract_start_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Data zakończenia</Label>
                    <Input
                      type="date"
                      value={formData.contract_end_date}
                      onChange={(e) => setFormData({ ...formData, contract_end_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Długość umowy (miesiące)</Label>
                    <Select 
                      value={formData.contract_duration_months} 
                      onValueChange={(v) => setFormData({ ...formData, contract_duration_months: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 miesiąc</SelectItem>
                        <SelectItem value="3">3 miesiące</SelectItem>
                        <SelectItem value="6">6 miesięcy</SelectItem>
                        <SelectItem value="12">12 miesięcy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Budżet miesięczny (PLN)</Label>
                    <Input
                      type="number"
                      value={formData.monthly_budget}
                      onChange={(e) => setFormData({ ...formData, monthly_budget: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabelsEdit).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Branża</Label>
                <Select value={formData.industry || "none"} onValueChange={(v) => setFormData({ ...formData, industry: v === "none" ? "" : v })}>
                  <SelectTrigger>
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
                  <SelectTrigger>
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
                  rows={3}
                />
              </div>
            </div>
            <Button type="submit" className="w-full">
              Zapisz zmiany
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Campaign Dialog */}
      <Dialog open={campaignDialogOpen} onOpenChange={setCampaignDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Dodaj nową kampanię</DialogTitle>
            <DialogDescription>
              Utwórz nową kampanię dla {client?.salon_name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddCampaign} className="space-y-4">
            <div className="space-y-2">
              <Label>Nazwa kampanii</Label>
              <Input
                value={campaignForm.name}
                onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                placeholder="np. Kampania wiosenna"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={campaignForm.status} onValueChange={(v) => setCampaignForm({ ...campaignForm, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Szkic</SelectItem>
                    <SelectItem value="active">Aktywna</SelectItem>
                    <SelectItem value="paused">Wstrzymana</SelectItem>
                    <SelectItem value="completed">Zakończona</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cel kampanii</Label>
                <Select value={campaignForm.objective || "none"} onValueChange={(v) => setCampaignForm({ ...campaignForm, objective: v === "none" ? "" : v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz cel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Brak</SelectItem>
                    <SelectItem value="Rezerwacje">Rezerwacje</SelectItem>
                    <SelectItem value="Wiadomości">Wiadomości</SelectItem>
                    <SelectItem value="Zasięg">Zasięg</SelectItem>
                    <SelectItem value="Ruch">Ruch</SelectItem>
                    <SelectItem value="Świadomość">Świadomość</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Budżet (PLN)</Label>
              <Input
                type="number"
                value={campaignForm.budget}
                onChange={(e) => setCampaignForm({ ...campaignForm, budget: e.target.value })}
                placeholder="np. 1500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data rozpoczęcia</Label>
                <Input
                  type="date"
                  value={campaignForm.start_date}
                  onChange={(e) => setCampaignForm({ ...campaignForm, start_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Data zakończenia</Label>
                <Input
                  type="date"
                  value={campaignForm.end_date}
                  onChange={(e) => setCampaignForm({ ...campaignForm, end_date: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCampaignDialogOpen(false)}>
                Anuluj
              </Button>
              <Button type="submit" disabled={savingCampaign}>
                {savingCampaign ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Zapisywanie...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Dodaj kampanię
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Contract Renewal Dialog */}
      <RenewContractDialog
        open={renewDialogOpen}
        onOpenChange={setRenewDialogOpen}
        clientId={client.id}
        clientName={client.salon_name}
        currentEndDate={contractStatus?.endDate || null}
        onSuccess={fetchClientData}
      />

      {/* Document Mini Card Preview - Centered Modal */}
      {miniCardDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={handleCloseMiniCard}>
          <div onClick={(e) => e.stopPropagation()}>
            <DocumentMiniCard
              document={miniCardDocument}
              onClose={handleCloseMiniCard}
              onViewFullscreen={handleOpenFullscreen}
              onViewLinkedInvoice={handleViewLinkedInvoice}
            />
          </div>
        </div>
      )}

      {/* Document Fullscreen Viewer */}
      {selectedDocument && (
        <DocumentViewer
          document={selectedDocument}
          open={viewerOpen}
          onClose={() => setViewerOpen(false)}
        />
      )}

    </AppLayout>
  );
}
