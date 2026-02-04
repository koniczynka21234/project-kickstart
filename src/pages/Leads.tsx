import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { leadSchema } from '@/lib/validationSchemas';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAppSettings } from '@/hooks/useAppSettings';
import { useOnboardingTasks } from '@/hooks/useOnboardingTasks';
import { createNotification, notifyGuardianAssigned } from '@/lib/notifications';
import { format, addDays, differenceInDays } from 'date-fns';
import { pl } from 'date-fns/locale';
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
  UserPlus,
  Loader2,
  Send,
  Clock,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  UserCheck,
  Smartphone,
  FileText,
  LayoutGrid,
  List,
  Building2,
  Columns3
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LeadsKanban } from '@/components/leads/LeadsKanban';
import { LeadsListView } from '@/components/leads/LeadsListView';
import { ConvertLeadDialog } from '@/components/leads/ConvertLeadDialog';

interface Lead {
  id: string;
  salon_name: string;
  owner_name: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  instagram: string | null;
  facebook_page: string | null;
  source: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  cold_email_sent: boolean | null;
  cold_email_date: string | null;
  follow_up_count: number | null;
  last_follow_up_date: string | null;
  next_follow_up_date: string | null;
  last_contact_date: string | null;
  response: string | null;
  response_date: string | null;
  priority: string | null;
  email_template: string | null;
  email_from: string | null;
  industry: string | null;
  // New fields for sequence tracking
  sms_follow_up_sent: boolean | null;
  sms_follow_up_date: string | null;
  email_follow_up_1_sent: boolean | null;
  email_follow_up_1_date: string | null;
  email_follow_up_2_sent: boolean | null;
  email_follow_up_2_date: string | null;
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  contacted: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  follow_up: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  rozmowa: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  no_response: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
  converted: 'bg-green-500/20 text-green-400 border-green-500/30',
  lost: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const statusLabels: Record<string, string> = {
  new: 'Nowy',
  contacted: 'Skontaktowano',
  follow_up: 'Follow-up',
  rozmowa: 'Rozmowa',
  no_response: 'Brak odpowiedzi',
  converted: 'Skonwertowany',
  lost: 'Utracony',
};

const priorityColors: Record<string, string> = {
  low: 'bg-zinc-500/20 text-zinc-400',
  medium: 'bg-blue-500/20 text-blue-400',
  high: 'bg-pink-500/20 text-pink-400',
};

const priorityLabels: Record<string, string> = {
  low: 'Niski',
  medium: 'Średni',
  high: 'Wysoki',
};

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

// Sequence: Cold Mail (Day 0) → SMS (Day 2) → Email 1 (Day 6) → Email 2 (Day 10)
// Helper to check if a date is due (today or past) - timezone-safe
const isDateDue = (dueDate: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDateNormalized = new Date(dueDate);
  dueDateNormalized.setHours(0, 0, 0, 0);
  return dueDateNormalized <= today;
};

const getNextFollowUpInfo = (lead: Lead): { type: string; dueDate: Date | null; isDue: boolean } | null => {
  if (!lead.cold_email_sent || !lead.cold_email_date) return null;
  if ((lead.response || lead.response_date) || lead.status === 'converted' || lead.status === 'lost') return null;
  
  // Parse date as local to avoid timezone issues
  const coldEmailDate = new Date(lead.cold_email_date + 'T00:00:00');
  
  // Check SMS (Day 2)
  if (!lead.sms_follow_up_sent) {
    const smsDue = addDays(coldEmailDate, 2);
    return { type: 'sms', dueDate: smsDue, isDue: isDateDue(smsDue) };
  }
  
  // Check Email Follow-up 1 (Day 6 = 4 days after SMS)
  if (!lead.email_follow_up_1_sent) {
    const email1Due = addDays(coldEmailDate, 6);
    return { type: 'email1', dueDate: email1Due, isDue: isDateDue(email1Due) };
  }
  
  // Check Email Follow-up 2 (Day 10 = 4 days after Email 1)
  if (!lead.email_follow_up_2_sent) {
    const email2Due = addDays(coldEmailDate, 10);
    return { type: 'email2', dueDate: email2Due, isDue: isDateDue(email2Due) };
  }
  
  return null; // All follow-ups done
};

export default function Leads() {
  const { user } = useAuth();
  const { settings } = useAppSettings();
  const { createOnboardingTasks } = useOnboardingTasks();
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'kanban' | 'list'>(settings.defaultLeadView === 'kanban' ? 'kanban' : 'cards');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [tabFilter, setTabFilter] = useState<'due' | 'all'>('due');
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [isBulkActionOpen, setIsBulkActionOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [leadToConvert, setLeadToConvert] = useState<Lead | null>(null);
  const [formData, setFormData] = useState({
    salon_name: '',
    owner_name: '',
    city: '',
    phone: '',
    email: '',
    instagram: '',
    facebook_page: '',
    source: '',
    status: 'new',
    notes: '',
    cold_email_sent: false,
    cold_email_date: '',
    priority: 'medium',
    response: '',
    response_date: '',
    email_template: '',
    email_from: '',
    industry: '',
    sms_follow_up_sent: false,
    sms_follow_up_date: '',
    email_follow_up_1_sent: false,
    email_follow_up_1_date: '',
    email_follow_up_2_sent: false,
    email_follow_up_2_date: '',
  });

  // Update viewMode when settings change
  useEffect(() => {
    setViewMode(settings.defaultLeadView === 'kanban' ? 'kanban' : 'cards');
  }, [settings.defaultLeadView]);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Błąd ładowania leadów');
      console.error(error);
    } else {
      setLeads((data as Lead[]) || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data with Zod
    const validationResult = leadSchema.safeParse(formData);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    if (!user?.id) {
      toast.error('Musisz być zalogowany, aby dodać leada');
      return;
    }

    const dataToSave = {
      salon_name: formData.salon_name,
      owner_name: formData.owner_name || null,
      city: formData.city || null,
      phone: formData.phone || null,
      email: formData.email || null,
      instagram: formData.instagram || null,
      facebook_page: formData.facebook_page || null,
      source: formData.source || null,
      status: formData.status,
      notes: formData.notes || null,
      cold_email_sent: formData.cold_email_sent,
      cold_email_date: formData.cold_email_date || null,
      priority: formData.priority,
      response: formData.response || null,
      response_date: formData.response_date || null,
      email_template: formData.email_template || null,
      email_from: formData.email_from || null,
      industry: formData.industry || null,
      sms_follow_up_sent: formData.sms_follow_up_sent,
      sms_follow_up_date: formData.sms_follow_up_date || null,
      email_follow_up_1_sent: formData.email_follow_up_1_sent,
      email_follow_up_1_date: formData.email_follow_up_1_date || null,
      email_follow_up_2_sent: formData.email_follow_up_2_sent,
      email_follow_up_2_date: formData.email_follow_up_2_date || null,
    };

    console.log('Submitting lead:', { ...dataToSave, created_by: user.id });

    if (editingLead) {
      const { error } = await supabase
        .from('leads')
        .update(dataToSave)
        .eq('id', editingLead.id);

      if (error) {
        toast.error('Błąd aktualizacji leada');
      } else {
        toast.success('Lead zaktualizowany');
        fetchLeads();
      }
    } else {
      const { error } = await supabase
        .from('leads')
        .insert({ ...dataToSave, created_by: user.id });

      if (error) {
        console.error('Błąd dodawania leada:', error);
        toast.error(`Błąd dodawania leada: ${error.message}`);
      } else {
        toast.success('Lead dodany');
        fetchLeads();
      }
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć tego leada?')) return;

    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Błąd usuwania leada');
    } else {
      toast.success('Lead usunięty');
      fetchLeads();
    }
  };

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      salon_name: lead.salon_name,
      owner_name: lead.owner_name || '',
      city: lead.city || '',
      phone: lead.phone || '',
      email: lead.email || '',
      instagram: lead.instagram || '',
      facebook_page: lead.facebook_page || '',
      source: lead.source || '',
      status: lead.status,
      notes: lead.notes || '',
      cold_email_sent: lead.cold_email_sent || false,
      cold_email_date: lead.cold_email_date || '',
      priority: lead.priority || 'medium',
      response: lead.response || '',
      response_date: lead.response_date || '',
      email_template: lead.email_template || '',
      email_from: lead.email_from || '',
      industry: lead.industry || '',
      sms_follow_up_sent: lead.sms_follow_up_sent || false,
      sms_follow_up_date: lead.sms_follow_up_date || '',
      email_follow_up_1_sent: lead.email_follow_up_1_sent || false,
      email_follow_up_1_date: lead.email_follow_up_1_date || '',
      email_follow_up_2_sent: lead.email_follow_up_2_sent || false,
      email_follow_up_2_date: lead.email_follow_up_2_date || '',
    });
    setIsDialogOpen(true);
  };

  const handleMarkColdEmailSent = async (lead: Lead) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const coldEmailDate = lead.cold_email_date || today;
    const { error } = await supabase
      .from('leads')
      .update({ 
        cold_email_sent: true, 
        cold_email_date: coldEmailDate,
        last_contact_date: today,
        status: 'contacted'
      })
      .eq('id', lead.id);

    if (error) {
      toast.error('Błąd aktualizacji');
    } else {
      toast.success('Cold mail oznaczony jako wysłany');
      fetchLeads();
    }
  };

  const handleMarkSmsFollowUpSent = async (lead: Lead) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const smsDate = lead.sms_follow_up_date || today;
    const { error } = await supabase
      .from('leads')
      .update({ 
        sms_follow_up_sent: true, 
        sms_follow_up_date: smsDate,
        last_contact_date: today,
        follow_up_count: (lead.follow_up_count || 0) + 1,
        status: 'follow_up'
      })
      .eq('id', lead.id);

    if (error) {
      toast.error('Błąd aktualizacji');
    } else {
      toast.success('SMS follow-up oznaczony');
      fetchLeads();
    }
  };

  const handleMarkEmailFollowUp1Sent = async (lead: Lead) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const email1Date = lead.email_follow_up_1_date || today;
    const { error } = await supabase
      .from('leads')
      .update({ 
        email_follow_up_1_sent: true, 
        email_follow_up_1_date: email1Date,
        last_contact_date: today,
        follow_up_count: (lead.follow_up_count || 0) + 1,
        status: 'follow_up'
      })
      .eq('id', lead.id);

    if (error) {
      toast.error('Błąd aktualizacji');
    } else {
      toast.success('Email follow-up #1 oznaczony');
      fetchLeads();
    }
  };

  const handleMarkEmailFollowUp2Sent = async (lead: Lead) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const email2Date = lead.email_follow_up_2_date || today;
    const { error } = await supabase
      .from('leads')
      .update({ 
        email_follow_up_2_sent: true, 
        email_follow_up_2_date: email2Date,
        last_contact_date: today,
        follow_up_count: (lead.follow_up_count || 0) + 1,
        status: 'no_response'
      })
      .eq('id', lead.id);

    if (error) {
      toast.error('Błąd aktualizacji');
    } else {
      toast.success('Email follow-up #2 oznaczony');
      fetchLeads();
    }
  };

  // Open convert dialog
  const handleConvertToClient = (lead: Lead) => {
    setLeadToConvert(lead);
    setConvertDialogOpen(true);
  };

  // Actually perform the conversion with assigned guardian
  const performConversion = async (lead: Lead, assignedTo: string, contractDurationMonths?: number, startDate?: string, endDate?: string, contractAmount?: number, monthlyBudget?: number) => {
    // VALIDATION 1: Check if lead is already converted (fresh check from DB)
    const { data: freshLead, error: leadCheckError } = await supabase
      .from('leads')
      .select('id, status')
      .eq('id', lead.id)
      .single();

    if (leadCheckError || !freshLead) {
      toast.error('Nie znaleziono leada');
      return;
    }

    if (freshLead.status === 'converted') {
      toast.error('Ten lead został już skonwertowany na klienta!');
      fetchLeads(); // Refresh to show current state
      return;
    }

    // VALIDATION 2: Check if client already exists for this lead
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id, salon_name')
      .eq('lead_id', lead.id)
      .maybeSingle();

    if (existingClient) {
      toast.error(`Klient "${existingClient.salon_name}" już istnieje dla tego leada!`);
      fetchLeads();
      return;
    }

    const contractStartDate = startDate || new Date().toISOString().split('T')[0];
    const contractEndDate = endDate || (contractDurationMonths 
      ? new Date(new Date().setMonth(new Date().getMonth() + contractDurationMonths)).toISOString().split('T')[0]
      : null);

    const { data: newClient, error: insertError } = await supabase
      .from('clients')
      .insert({
        salon_name: lead.salon_name,
        owner_name: lead.owner_name,
        city: lead.city,
        phone: lead.phone,
        email: lead.email,
        instagram: lead.instagram,
        facebook_page: lead.facebook_page,
        notes: lead.notes,
        lead_id: lead.id,
        created_by: user?.id,
        assigned_to: assignedTo,
        status: 'active',
        contract_start_date: contractStartDate,
        contract_end_date: contractEndDate,
        contract_duration_months: contractDurationMonths || null,
        monthly_budget: monthlyBudget || null,
        contract_amount: contractAmount || null
      })
      .select('id')
      .single();

    if (insertError) {
      toast.error('Błąd tworzenia klienta');
      console.error(insertError);
      return;
    }

    const { error: updateError } = await supabase
      .from('leads')
      .update({ status: 'converted' })
      .eq('id', lead.id);

    if (updateError) {
      toast.error('Błąd aktualizacji statusu leada');
      return;
    }

    // Create onboarding tasks for the new client
    if (newClient?.id && user?.id) {
      await createOnboardingTasks(newClient.id, lead.salon_name, assignedTo, user.id);
      
      // Get current user's name for notifications
      const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      
      const currentUserName = currentUserProfile?.full_name || 'Ktoś';
      
      // Notify guardian about client assignment
      await notifyGuardianAssigned(
        newClient.id,
        lead.salon_name,
        assignedTo,
        currentUserName,
        user.id
      );
      
      // Create notification about invoice requirement with contract amount
      const invoiceContent = contractAmount 
        ? `Wystawić fakturę dla nowego klienta "${lead.salon_name}" na kwotę ${contractAmount} PLN`
        : `Wystawić fakturę dla nowego klienta "${lead.salon_name}"`;
      
      await createNotification({
        userId: assignedTo,
        title: 'Wymagana faktura',
        content: invoiceContent,
        type: 'invoice_required',
        referenceType: 'client',
        referenceId: newClient.id,
        createdBy: user.id,
      });
      
      // Navigate to new client profile
      navigate(`/clients/${newClient.id}`);
    }

    toast.success(`"${lead.salon_name}" przekonwertowany na klienta!`);
  };

  const resetForm = () => {
    setEditingLead(null);
    setFormData({
      salon_name: '',
      owner_name: '',
      city: '',
      phone: '',
      email: '',
      instagram: '',
      facebook_page: '',
      source: '',
      status: 'new',
      notes: '',
      cold_email_sent: false,
      cold_email_date: '',
      priority: 'medium',
      response: '',
      response_date: '',
      email_template: '',
      email_from: '',
      industry: '',
      sms_follow_up_sent: false,
      sms_follow_up_date: '',
      email_follow_up_1_sent: false,
      email_follow_up_1_date: '',
      email_follow_up_2_sent: false,
      email_follow_up_2_date: '',
    });
  };

  // Helper to check if a follow-up step is due (today or past) - with timezone-safe comparison
  const isStepDue = (baseDate: string | null, daysToAdd: number): boolean => {
    if (!baseDate) return false;
    // Parse as local date to avoid timezone issues
    const baseDateParsed = new Date(baseDate + 'T00:00:00');
    const dueDate = addDays(baseDateParsed, daysToAdd);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate <= today;
  };

  // Helper to check if date is exactly today
  const isDateToday = (dateStr: string | null): boolean => {
    if (!dateStr) return false;
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };

  // Helper: check if date is today or in the past (action due)
  const isDateDueOrToday = (dateStr: string | null): boolean => {
    if (!dateStr) return false;
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date <= today;
  };

  // Helper: get SMS due date from cold email date
  const getSmsDueDate = (coldEmailDate: string): Date => {
    return addDays(new Date(coldEmailDate + 'T00:00:00'), 2);
  };

  // Helper: get Email FU1 due date from cold email date  
  const getEmailFu1DueDate = (coldEmailDate: string): Date => {
    return addDays(new Date(coldEmailDate + 'T00:00:00'), 6);
  };

  // Helper: get Email FU2 due date from cold email date
  const getEmailFu2DueDate = (coldEmailDate: string): Date => {
    return addDays(new Date(coldEmailDate + 'T00:00:00'), 10);
  };

  // Filter leads based on tab and filters
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.salon_name.toLowerCase().includes(search.toLowerCase()) ||
      lead.owner_name?.toLowerCase().includes(search.toLowerCase()) ||
      lead.city?.toLowerCase().includes(search.toLowerCase()) ||
      lead.industry?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || lead.priority === priorityFilter;
    const matchesIndustry = industryFilter === 'all' || lead.industry === industryFilter;
    
    // Exclude converted/lost from follow-up tabs
    const isActiveForFollowUp = lead.status !== 'converted' && lead.status !== 'lost' && !lead.response;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Tab filters
    let matchesTab = true;
    if (activeTab === 'pending_cold_email') {
      if (tabFilter === 'all') {
        // Wszystkie wysłane cold maile
        matchesTab = lead.cold_email_sent === true;
      } else {
        // Domyślnie: dzisiejsze i zaległe do wysłania
        // Nie pokazuj zamkniętych leadów (skonwertowany/utracony) ani tych z odpowiedzią
        if (!isActiveForFollowUp) {
          matchesTab = false;
        } else {
        const hasNoColdEmailDate = !lead.cold_email_date;
        const coldEmailDue = isDateDueOrToday(lead.cold_email_date);
        matchesTab = !lead.cold_email_sent && (hasNoColdEmailDate || coldEmailDue);
        }
      }
    } else if (activeTab === 'pending_sms') {
      if (tabFilter === 'all') {
        // Wszystkie wysłane SMS-y
        matchesTab = lead.sms_follow_up_sent === true;
      } else {
        // Domyślnie: dzisiejsze i zaległe do wysłania
        if (!lead.cold_email_sent || !lead.cold_email_date || lead.sms_follow_up_sent || !isActiveForFollowUp) {
          matchesTab = false;
        } else {
          const smsDueDate = getSmsDueDate(lead.cold_email_date);
          smsDueDate.setHours(0, 0, 0, 0);
          matchesTab = smsDueDate <= today;
        }
      }
    } else if (activeTab === 'pending_email') {
      // Połączone Email FU #1 i #2
      if (tabFilter === 'all') {
        // Wszystkie wysłane email follow-upy
        matchesTab = lead.email_follow_up_1_sent === true || lead.email_follow_up_2_sent === true;
      } else {
        // Domyślnie: dzisiejsze i zaległe do wysłania
        if (!lead.cold_email_sent || !lead.cold_email_date || !lead.sms_follow_up_sent || !isActiveForFollowUp) {
          matchesTab = false;
        } else {
          const email1Due = !lead.email_follow_up_1_sent && (() => {
            const dueDate = getEmailFu1DueDate(lead.cold_email_date!);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate <= today;
          })();
          const email2Due = lead.email_follow_up_1_sent && !lead.email_follow_up_2_sent && (() => {
            const dueDate = getEmailFu2DueDate(lead.cold_email_date!);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate <= today;
          })();
          matchesTab = email1Due || email2Due;
        }
      }
    } else if (activeTab === 'responded') {
      matchesTab = !!lead.response || !!lead.response_date;
    }
    // activeTab === 'all' -> matchesTab stays true, shows all leads
    
    return matchesSearch && matchesStatus && matchesPriority && matchesIndustry && matchesTab;
  });

  // Stats - count leads where action is DUE (today or past)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const stats = {
    total: leads.length,
    pendingColdEmail: leads.filter(l => {
      if (l.cold_email_sent) return false;
      if ((l.response || l.response_date) || l.status === 'converted' || l.status === 'lost') return false;
      // Bez daty lub data na dziś/przeszłość
      return !l.cold_email_date || isDateDueOrToday(l.cold_email_date);
    }).length,
    pendingSms: leads.filter(l => {
      if (!l.cold_email_sent || !l.cold_email_date || l.sms_follow_up_sent) return false;
      if ((l.response || l.response_date) || l.status === 'converted' || l.status === 'lost') return false;
      const smsDueDate = getSmsDueDate(l.cold_email_date);
      smsDueDate.setHours(0, 0, 0, 0);
      return smsDueDate <= today;
    }).length,
    pendingEmail: leads.filter(l => {
      if (!l.cold_email_sent || !l.cold_email_date || !l.sms_follow_up_sent) return false;
      if ((l.response || l.response_date) || l.status === 'converted' || l.status === 'lost') return false;
      const email1Due = !l.email_follow_up_1_sent && (() => {
        const dueDate = getEmailFu1DueDate(l.cold_email_date!);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate <= today;
      })();
      const email2Due = l.email_follow_up_1_sent && !l.email_follow_up_2_sent && (() => {
        const dueDate = getEmailFu2DueDate(l.cold_email_date!);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate <= today;
      })();
      return email1Due || email2Due;
    }).length,
    responded: leads.filter(l => !!l.response || !!l.response_date).length,
  };

  const getSequenceStatus = (lead: Lead) => {
    const steps = [
      { done: lead.cold_email_sent, label: 'CM', date: lead.cold_email_date },
      { done: lead.sms_follow_up_sent, label: 'SMS', date: lead.sms_follow_up_date },
      { done: lead.email_follow_up_1_sent, label: 'FU1', date: lead.email_follow_up_1_date },
      { done: lead.email_follow_up_2_sent, label: 'FU2', date: lead.email_follow_up_2_date },
    ];
    return steps;
  };

  const handleSelectLead = (leadId: string) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId);
    } else {
      newSelected.add(leadId);
    }
    setSelectedLeads(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedLeads.size === filteredLeads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(filteredLeads.map(l => l.id)));
    }
  };

  const handleBulkMarkColdEmailSent = async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const updates = Array.from(selectedLeads).map(id => {
      const lead = leads.find(l => l.id === id);
      return supabase
        .from('leads')
        .update({ 
          cold_email_sent: true, 
          cold_email_date: lead?.cold_email_date || today,
          last_contact_date: today,
          status: 'contacted'
        })
        .eq('id', id);
    });

    await Promise.all(updates);
    toast.success(`Oznaczono ${selectedLeads.size} leadów jako wysłane`);
    setSelectedLeads(new Set());
    fetchLeads();
  };

  const handleBulkChangeStatus = async (newStatus: string) => {
    const updates = Array.from(selectedLeads).map(id =>
      supabase
        .from('leads')
        .update({ status: newStatus })
        .eq('id', id)
    );

    await Promise.all(updates);
    toast.success(`Zmieniono status dla ${selectedLeads.size} leadów`);
    setSelectedLeads(new Set());
    fetchLeads();
  };

  return (
    <AppLayout>
      <div className="mobile-page py-4 space-y-4 lg:space-y-6 animate-fade-in w-full max-w-full overflow-x-hidden box-border">
        {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Leady</h1>
              <p className="text-muted-foreground text-xs sm:text-sm hidden sm:block">Sekwencja: Cold Mail → SMS (2 dni) → Email #1 (4 dni) → Email #2 (4 dni)</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center border border-zinc-700 rounded-lg overflow-hidden z-10">
                <Button
                  size="sm"
                  variant={viewMode === 'cards' ? 'default' : 'outline'}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setViewMode('cards'); }}
                  className={`rounded-none border-0 h-9 w-9 sm:h-9 sm:w-auto sm:px-3 ${viewMode === 'cards' ? 'bg-primary text-primary-foreground' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
                  title="Kafelki"
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'kanban' ? 'default' : 'outline'}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setViewMode('kanban'); }}
                  className={`rounded-none border-0 h-9 w-9 sm:h-9 sm:w-auto sm:px-3 ${viewMode === 'kanban' ? 'bg-primary text-primary-foreground' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
                  title="Kanban"
                >
                  <Columns3 className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setViewMode('list'); }}
                  className={`rounded-none border-0 h-9 w-9 sm:h-9 sm:w-auto sm:px-3 ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
                  title="Lista"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90 flex-1 sm:flex-none" size="sm">
                    <Plus className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Dodaj lead</span>
                  </Button>
                </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingLead ? 'Edytuj lead' : 'Nowy lead'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Dane podstawowe</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 sm:col-span-1">
                      <Label>Nazwa salonu *</Label>
                      <Input
                        value={formData.salon_name}
                        onChange={(e) => setFormData({ ...formData, salon_name: e.target.value })}
                        className="form-input-elegant"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
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
                      <Label>Facebook</Label>
                      <Input
                        value={formData.facebook_page}
                        onChange={(e) => setFormData({ ...formData, facebook_page: e.target.value })}
                        placeholder="Link do strony FB"
                        className="form-input-elegant"
                      />
                    </div>
                  </div>
                </div>

                {/* Status & Priority */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Status i priorytet</h3>
                  <div className="grid grid-cols-3 gap-4">
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
                      <Label>Priorytet</Label>
                      <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                        <SelectTrigger className="form-input-elegant">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(priorityLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Branża</Label>
                      <Select value={formData.industry} onValueChange={(v) => setFormData({ ...formData, industry: v })}>
                        <SelectTrigger className="form-input-elegant">
                          <SelectValue placeholder="Wybierz branżę" />
                        </SelectTrigger>
                        <SelectContent>
                          {industryOptions.map((ind) => (
                            <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Źródło</Label>
                      <Select value={formData.source} onValueChange={(v) => setFormData({ ...formData, source: v })}>
                        <SelectTrigger className="form-input-elegant">
                          <SelectValue placeholder="Wybierz źródło" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Instagram">Instagram</SelectItem>
                          <SelectItem value="Facebook">Facebook</SelectItem>
                          <SelectItem value="Cold mail">Cold mail</SelectItem>
                          <SelectItem value="Cold call">Cold call</SelectItem>
                          <SelectItem value="Polecenie">Polecenie</SelectItem>
                          <SelectItem value="Google">Google</SelectItem>
                          <SelectItem value="Strona www">Strona www</SelectItem>
                          <SelectItem value="Inne">Inne</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Email template & sender */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Ustawienia wysyłki</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Szablon wiadomości</Label>
                      <Select value={formData.email_template} onValueChange={(v) => setFormData({ ...formData, email_template: v })}>
                        <SelectTrigger className="form-input-elegant">
                          <SelectValue placeholder="Wybierz szablon" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="szablon1">Szablon 1</SelectItem>
                          <SelectItem value="szablon2">Szablon 2</SelectItem>
                          <SelectItem value="szablon3">Szablon 3</SelectItem>
                          <SelectItem value="szablon4">Szablon 4</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Email nadawcy</Label>
                      <Select value={formData.email_from} onValueChange={(v) => setFormData({ ...formData, email_from: v })}>
                        <SelectTrigger className="form-input-elegant">
                          <SelectValue placeholder="Wybierz email" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kontakt@aurine.pl">kontakt@aurine.pl</SelectItem>
                          <SelectItem value="biuro@aurine.pl">biuro@aurine.pl</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Sequence Tracking */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Sekwencja follow-upów</h3>
                  {/* Cold email */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 flex items-center space-x-2">
                      <Checkbox
                        id="cold_email_sent"
                        checked={formData.cold_email_sent}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, cold_email_sent: checked as boolean })
                        }
                      />
                      <Label htmlFor="cold_email_sent" className="cursor-pointer">
                        Cold email wysłany (Dzień 0)
                      </Label>
                    </div>
                    <div>
                      <Label>Data cold maila (planowana / wysłania)</Label>
                      <Input
                        type="date"
                        value={formData.cold_email_date}
                        onChange={(e) => {
                          const newDate = e.target.value;
                          if (newDate) {
                            // Auto-calculate other dates based on sequence
                            const coldDate = new Date(newDate + 'T00:00:00');
                            const smsDate = format(addDays(coldDate, 2), 'yyyy-MM-dd');
                            const email1Date = format(addDays(coldDate, 6), 'yyyy-MM-dd');
                            const email2Date = format(addDays(coldDate, 10), 'yyyy-MM-dd');
                            setFormData({ 
                              ...formData, 
                              cold_email_date: newDate,
                              sms_follow_up_date: smsDate,
                              email_follow_up_1_date: email1Date,
                              email_follow_up_2_date: email2Date
                            });
                          } else {
                            setFormData({ ...formData, cold_email_date: newDate });
                          }
                        }}
                        className="form-input-elegant"
                      />
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        Pozostałe daty automatycznie się wyliczą
                      </p>
                    </div>
                  </div>

                  {/* SMS follow-up */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 flex items-center space-x-2">
                      <Checkbox
                        id="sms_follow_up_sent"
                        checked={formData.sms_follow_up_sent}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, sms_follow_up_sent: checked as boolean })
                        }
                      />
                      <Label htmlFor="sms_follow_up_sent" className="cursor-pointer">
                        SMS follow-up wysłany (Dzień 2)
                      </Label>
                    </div>
                    <div>
                      <Label>Data SMS (planowana / wysłania)</Label>
                      <Input
                        type="date"
                        value={formData.sms_follow_up_date}
                        onChange={(e) => setFormData({ ...formData, sms_follow_up_date: e.target.value })}
                        className="form-input-elegant"
                      />
                    </div>
                  </div>

                  {/* Email follow-up #1 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 flex items-center space-x-2">
                      <Checkbox
                        id="email_follow_up_1_sent"
                        checked={formData.email_follow_up_1_sent}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, email_follow_up_1_sent: checked as boolean })
                        }
                      />
                      <Label htmlFor="email_follow_up_1_sent" className="cursor-pointer">
                        Email follow-up #1 wysłany (Dzień 6)
                      </Label>
                    </div>
                    <div>
                      <Label>Data email #1 (planowana / wysłania)</Label>
                      <Input
                        type="date"
                        value={formData.email_follow_up_1_date}
                        onChange={(e) =>
                          setFormData({ ...formData, email_follow_up_1_date: e.target.value })
                        }
                        className="form-input-elegant"
                      />
                    </div>
                  </div>

                  {/* Email follow-up #2 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 flex items-center space-x-2">
                      <Checkbox
                        id="email_follow_up_2_sent"
                        checked={formData.email_follow_up_2_sent}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, email_follow_up_2_sent: checked as boolean })
                        }
                      />
                      <Label htmlFor="email_follow_up_2_sent" className="cursor-pointer">
                        Email follow-up #2 wysłany (Dzień 10)
                      </Label>
                    </div>
                    <div>
                      <Label>Data email #2 (planowana / wysłania)</Label>
                      <Input
                        type="date"
                        value={formData.email_follow_up_2_date}
                        onChange={(e) =>
                          setFormData({ ...formData, email_follow_up_2_date: e.target.value })
                        }
                        className="form-input-elegant"
                      />
                    </div>
                  </div>
                </div>

                {/* Response */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Odpowiedź</h3>
                  <p className="text-xs text-muted-foreground/70 italic">
                    Uwaga: Zaznaczenie odpowiedzi wyłączy automatyczne follow-upy. Możesz ręcznie zaznaczyć, które follow-upy mają być dalej aktywne.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label>Treść odpowiedzi</Label>
                      <Textarea
                        value={formData.response}
                        onChange={(e) => setFormData({ ...formData, response: e.target.value })}
                        className="form-input-elegant"
                        rows={2}
                        placeholder="Odpowiedź od leada..."
                      />
                    </div>
                    <div>
                      <Label>Data odpowiedzi</Label>
                      <Input
                        type="date"
                        value={formData.response_date}
                        onChange={(e) => setFormData({ ...formData, response_date: e.target.value })}
                        className="form-input-elegant"
                      />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <Label>Notatki</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="form-input-elegant"
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                  {editingLead ? 'Zapisz zmiany' : 'Dodaj lead'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Cold Mail Alert Banner - similar to Auto Follow-ups */}
        {stats.pendingColdEmail > 0 && (
          <Card className="border-0 bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-transparent border-l-4 border-l-amber-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <Send className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      Cold maile do wysłania dziś
                      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                        {stats.pendingColdEmail}
                      </Badge>
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Leady oczekujące na cold mail - kliknij zakładkę "Do wysłania: Cold" aby zobaczyć listę
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => { setActiveTab('pending_cold_email'); setTabFilter('due'); }}
                  className="bg-amber-500 hover:bg-amber-600 text-black"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Zobacz listę
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="border-border/50 bg-card/80">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <UserPlus className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Wszystkie</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/80 cursor-pointer hover:bg-card/90 transition-colors" onClick={() => { setActiveTab('pending_cold_email'); setTabFilter('due'); }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Send className="w-4 h-4 text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-400">{stats.pendingColdEmail}</p>
                  <p className="text-xs text-muted-foreground">Cold mail dziś</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/80 cursor-pointer hover:bg-card/90 transition-colors" onClick={() => { setActiveTab('pending_sms'); setTabFilter('due'); }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10">
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pendingSms}</p>
                  <p className="text-xs text-muted-foreground">SMS dziś</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/80 cursor-pointer hover:bg-card/90 transition-colors" onClick={() => { setActiveTab('pending_email'); setTabFilter('due'); }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Mail className="w-4 h-4 text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pendingEmail}</p>
                  <p className="text-xs text-muted-foreground">Email FU dziś</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/80 cursor-pointer hover:bg-card/90 transition-colors" onClick={() => setActiveTab('responded')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-400">{stats.responded}</p>
                  <p className="text-xs text-muted-foreground">Odpowiedzi</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            {[
              { id: 'all', label: 'Wszystkie', count: stats.total },
              { id: 'pending_cold_email', label: 'Do wysłania: Cold', count: stats.pendingColdEmail },
              { id: 'pending_sms', label: 'Do wysłania: SMS', count: stats.pendingSms },
              { id: 'pending_email', label: 'Do wysłania: Email', count: stats.pendingEmail },
              { id: 'responded', label: 'Odpowiedzi', count: stats.responded },
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'ghost'}
                onClick={() => {
                  setActiveTab(tab.id);
                  setTabFilter('due');
                }}
                className="text-sm"
              >
                {tab.label} {tab.count > 0 && <Badge className="ml-2">{tab.count}</Badge>}
              </Button>
            ))}
          </div>

          {/* Tab Filter (visible only for specific tabs) */}
          {activeTab !== 'all' && activeTab !== 'responded' && (
            <Select value={tabFilter} onValueChange={(v: 'due' | 'all') => setTabFilter(v)}>
              <SelectTrigger className="w-[200px] form-input-elegant">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="due">Dzisiejsze / zaległe</SelectItem>
                <SelectItem value="all">Wszystkie wysłane</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedLeads.size > 0 && (
          <Card className="border-border/50 bg-card/80 p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">
                  Wybrano: {selectedLeads.size} {selectedLeads.size === 1 ? 'lead' : 'leadów'}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedLeads(new Set())}
                >
                  Anuluj
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleBulkMarkColdEmailSent}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Oznacz cold mail jako wysłane
                </Button>
                <Select onValueChange={handleBulkChangeStatus}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Zmień status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedLeads.size === filteredLeads.length && filteredLeads.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm text-muted-foreground">Zaznacz wszystkie</span>
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Szukaj po nazwie, właścicielu lub mieście..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 form-input-elegant"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] form-input-elegant">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie</SelectItem>
              {Object.entries(statusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[150px] form-input-elegant">
              <SelectValue placeholder="Priorytet" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie</SelectItem>
              {Object.entries(priorityLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={industryFilter} onValueChange={setIndustryFilter}>
            <SelectTrigger className="w-[150px] form-input-elegant">
              <SelectValue placeholder="Branża" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie</SelectItem>
              {industryOptions.map((ind) => (
                <SelectItem key={ind} value={ind}>{ind}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Leads View */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-12">
            <UserPlus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Brak leadów</p>
            <p className="text-sm text-muted-foreground/70">Dodaj pierwszego leada klikając przycisk powyżej</p>
          </div>
        ) : viewMode === 'kanban' ? (
          <LeadsKanban
            leads={filteredLeads}
            onLeadClick={(id) => navigate(`/leads/${id}`)}
            onRefresh={fetchLeads}
          />
        ) : viewMode === 'list' ? (
          <LeadsListView
            leads={filteredLeads}
            selectedLeads={selectedLeads}
            onSelectLead={handleSelectLead}
            onLeadClick={(id) => navigate(`/leads/${id}`)}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onConvert={handleConvertToClient}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredLeads.map((lead) => {
              const nextFollowUp = getNextFollowUpInfo(lead);
              const sequenceSteps = getSequenceStatus(lead);
              
              return (
                <Card key={lead.id} className="border-border/50 bg-card/80 hover:bg-card transition-colors overflow-hidden">
                  <CardContent className="p-0">
                    {/* Header */}
                    <div className="p-4 border-b border-border/30">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={selectedLeads.has(lead.id)}
                            onCheckedChange={() => handleSelectLead(lead.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div 
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => navigate(`/leads/${lead.id}`)}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold truncate">{lead.salon_name}</h3>
                              {lead.priority && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${priorityColors[lead.priority]}`}>
                                  {priorityLabels[lead.priority]}
                                </span>
                              )}
                            </div>
                            {lead.owner_name && (
                              <p className="text-sm text-muted-foreground truncate">{lead.owner_name}</p>
                            )}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(lead)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edytuj
                            </DropdownMenuItem>
                            {lead.status !== 'converted' && (
                              <DropdownMenuItem 
                                onClick={() => handleConvertToClient(lead)}
                                className="text-green-400"
                              >
                                <UserCheck className="w-4 h-4 mr-2" />
                                Konwertuj na klienta
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDelete(lead.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Usuń
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={`${statusColors[lead.status]}`}>
                          {statusLabels[lead.status]}
                        </Badge>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div 
                      className="p-4 space-y-2 text-sm border-b border-border/30 cursor-pointer"
                      onClick={() => navigate(`/leads/${lead.id}`)}
                    >
                      {lead.city && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span>{lead.city}</span>
                        </div>
                      )}
                      {lead.industry && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Building2 className="w-3.5 h-3.5 shrink-0" />
                          <span>{lead.industry}</span>
                        </div>
                      )}
                      {lead.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="w-3.5 h-3.5 shrink-0" />
                          <span>{lead.phone}</span>
                        </div>
                      )}
                      {lead.email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{lead.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Sequence Progress - hide for converted/lost leads */}
                    {lead.status !== 'converted' && lead.status !== 'lost' ? (
                      <div className="p-4 space-y-3 bg-secondary/20">
                        {/* Sent Status Summary */}
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          {lead.cold_email_sent ? (
                            <span className="flex items-center gap-1 text-green-400">
                              <CheckCircle2 className="w-3 h-3" />
                              CM wysłany
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-yellow-400">
                              <AlertCircle className="w-3 h-3" />
                              CM do wysłania
                            </span>
                          )}
                          {lead.response ? (
                            <span className="flex items-center gap-1 text-green-400 bg-green-500/10 px-2 py-0.5 rounded">
                              <MessageSquare className="w-3 h-3" />
                              Jest odpowiedź
                            </span>
                          ) : lead.cold_email_sent ? (
                            <span className="flex items-center gap-1 text-zinc-400">
                              <Clock className="w-3 h-3" />
                              Brak odpowiedzi
                            </span>
                          ) : null}
                        </div>

                        {/* Sequence Steps - shows scheduled dates */}
                        <div className="flex items-center justify-between gap-1">
                          {sequenceSteps.map((step, idx) => {
                            // Calculate scheduled due date for each step
                            let scheduledDate: Date | null = null;
                            if (lead.cold_email_date) {
                              const baseDate = new Date(lead.cold_email_date + 'T00:00:00');
                              if (idx === 0) scheduledDate = baseDate;
                              else if (idx === 1) scheduledDate = addDays(baseDate, 2);
                              else if (idx === 2) scheduledDate = addDays(baseDate, 6);
                              else if (idx === 3) scheduledDate = addDays(baseDate, 10);
                            }
                            
                            const isDueToday = scheduledDate && isDateToday(scheduledDate.toISOString().split('T')[0]);
                            const isDuePast = scheduledDate && !step.done && scheduledDate < new Date();
                            
                            return (
                              <div 
                                key={idx}
                                className={`flex-1 text-center py-1 px-1 rounded text-[10px] font-medium ${
                                  step.done 
                                    ? 'bg-green-500/20 text-green-400' 
                                    : isDuePast
                                      ? 'bg-red-500/20 text-red-400 animate-pulse'
                                      : isDueToday
                                        ? 'bg-yellow-500/20 text-yellow-400'
                                        : 'bg-zinc-500/10 text-zinc-500'
                                }`}
                              >
                                {step.label}
                                {step.done && step.date ? (
                                  <div className="text-[8px] opacity-70">
                                    {format(new Date(step.date), 'd.MM', { locale: pl })}
                                  </div>
                                ) : scheduledDate ? (
                                  <div className={`text-[8px] ${isDueToday || isDuePast ? 'opacity-100' : 'opacity-50'}`}>
                                    {format(scheduledDate, 'd.MM', { locale: pl })}
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>

                        {/* Next Action */}
                        {nextFollowUp && !lead.response && (
                          <div className="flex items-center justify-between pt-2 border-t border-border/30">
                            <div className="flex items-center gap-2">
                              {nextFollowUp.type === 'sms' ? (
                                <Smartphone className={`w-4 h-4 ${nextFollowUp.isDue ? 'text-cyan-400' : 'text-muted-foreground'}`} />
                              ) : (
                                <Mail className={`w-4 h-4 ${nextFollowUp.isDue ? 'text-orange-400' : 'text-muted-foreground'}`} />
                              )}
                              <span className="text-xs text-muted-foreground">
                                {nextFollowUp.type === 'sms' && 'SMS'}
                                {nextFollowUp.type === 'email1' && 'Email #1'}
                                {nextFollowUp.type === 'email2' && 'Email #2'}
                                {nextFollowUp.dueDate && (
                                  <span className={nextFollowUp.isDue ? 'text-pink-400 ml-1 font-medium' : ''}>
                                    {nextFollowUp.isDue ? '(teraz!)' : format(nextFollowUp.dueDate, 'd MMM', { locale: pl })}
                                  </span>
                                )}
                              </span>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className={`h-6 px-2 text-xs ${
                                nextFollowUp.type === 'sms' 
                                  ? 'text-cyan-400 hover:text-cyan-300' 
                                  : 'text-orange-400 hover:text-orange-300'
                              }`}
                              onClick={() => {
                                if (nextFollowUp.type === 'sms') handleMarkSmsFollowUpSent(lead);
                                else if (nextFollowUp.type === 'email1') handleMarkEmailFollowUp1Sent(lead);
                                else if (nextFollowUp.type === 'email2') handleMarkEmailFollowUp2Sent(lead);
                              }}
                            >
                              Oznacz
                            </Button>
                          </div>
                        )}

                        {/* Cold Email Action */}
                        {!lead.cold_email_sent && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Send className="w-4 h-4 text-yellow-400" />
                              <span className="text-xs text-muted-foreground">Cold mail</span>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 px-2 text-xs text-yellow-400 hover:text-yellow-300"
                              onClick={() => handleMarkColdEmailSent(lead)}
                            >
                              Wyślij
                            </Button>
                          </div>
                        )}

                        {/* Response Details */}
                        {lead.response && (
                          <div className="pt-2 border-t border-border/30 space-y-1">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-400" />
                              <span className="text-xs text-green-400 font-medium">Odpowiedź otrzymana</span>
                              {lead.response_date && (
                                <span className="text-[10px] text-muted-foreground">
                                  ({format(new Date(lead.response_date), 'd.MM.yyyy', { locale: pl })})
                                </span>
                              )}
                            </div>
                            {lead.response && (
                              <p className="text-xs text-muted-foreground pl-6 line-clamp-2">
                                {lead.response}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 bg-secondary/10 text-center">
                        <span className={`text-xs ${lead.status === 'converted' ? 'text-green-400' : 'text-red-400'}`}>
                          {lead.status === 'converted' ? 'Skonwertowany na klienta' : 'Lead utracony'}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Convert Lead Dialog */}
      <ConvertLeadDialog
        lead={leadToConvert}
        open={convertDialogOpen}
        onClose={() => {
          setConvertDialogOpen(false);
          setLeadToConvert(null);
        }}
        onConvert={performConversion}
      />
    </AppLayout>
  );
}
