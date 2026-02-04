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
import { 
  ArrowLeft,
  Phone, 
  Mail, 
  MapPin, 
  Instagram,
  Facebook,
  Calendar,
  FileText,
  Loader2,
  Send,
  MessageSquare,
  CheckCircle2,
  Clock,
  Copy,
  Building2,
  Pencil,
  ExternalLink,
  Eye,
  Target,
  TrendingUp,
  GraduationCap
} from 'lucide-react';
import { LeadInteractionTimeline } from '@/components/leads/LeadInteractionTimeline';
import { DocumentMiniCard } from '@/components/document/DocumentMiniCard';
import { DocumentViewer } from '@/components/document/DocumentViewer';
import { CloudDocumentItem } from '@/hooks/useCloudDocumentHistory';

interface Lead {
  id: string;
  salon_name: string;
  owner_name: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  instagram: string | null;
  facebook_page: string | null;
  industry: string | null;
  status: string;
  priority: string | null;
  source: string | null;
  notes: string | null;
  response: string | null;
  response_date: string | null;
  cold_email_sent: boolean | null;
  cold_email_date: string | null;
  sms_follow_up_sent: boolean | null;
  sms_follow_up_date: string | null;
  email_follow_up_1_sent: boolean | null;
  email_follow_up_1_date: string | null;
  email_follow_up_2_sent: boolean | null;
  email_follow_up_2_date: string | null;
  email_template: string | null;
  email_from: string | null;
  created_at: string;
  last_contact_date: string | null;
  next_follow_up_date: string | null;
}

interface Document {
  id: string;
  type: string;
  title: string;
  subtitle: string | null;
  thumbnail: string | null;
  created_at: string;
  created_by: string | null;
  data: Record<string, unknown> | null;
  // Enriched fields
  creatorName?: string;
  creatorRole?: 'szef' | 'pracownik' | null;
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  contacted: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  qualified: 'bg-green-500/20 text-green-400 border-green-500/30',
  converted: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  lost: 'bg-red-500/20 text-red-400 border-red-500/30',
  rozmowa: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  no_response: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

const statusLabels: Record<string, string> = {
  new: 'Nowy',
  contacted: 'Kontaktowany',
  qualified: 'Zakwalifikowany',
  converted: 'Przekonwertowany',
  lost: 'Utracony',
  rozmowa: 'Rozmowa',
  no_response: 'Brak odpowiedzi',
};

const priorityColors: Record<string, string> = {
  low: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  high: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const priorityLabels: Record<string, string> = {
  low: 'Niski',
  medium: 'Średni',
  high: 'Wysoki',
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

export default function LeadProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Document preview states
  const [miniCardDocument, setMiniCardDocument] = useState<CloudDocumentItem | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<CloudDocumentItem | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

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

  const handleOpenFullscreen = () => {
    if (miniCardDocument) {
      setSelectedDocument(miniCardDocument);
      setViewerOpen(true);
      setMiniCardDocument(null);
    }
  };

  const handleCloseMiniCard = () => {
    setMiniCardDocument(null);
  };

  const handleCloseViewer = () => {
    setViewerOpen(false);
    setSelectedDocument(null);
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

  useEffect(() => {
    if (id) {
      fetchLeadData();
    }
  }, [id]);

  const fetchLeadData = async () => {
    setLoading(true);
    
    const { data: leadData, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    if (leadError) {
      toast.error('Nie znaleziono leada');
      navigate('/leads');
      return;
    }
    setLead(leadData);

    // Fetch documents for this lead with creator info
    const { data: documentsData } = await supabase
      .from('documents')
      .select('id, type, title, subtitle, thumbnail, created_at, data, created_by')
      .eq('lead_id', id)
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
      creatorName: doc.created_by ? profilesMap[doc.created_by] : undefined,
      creatorRole: doc.created_by ? rolesMap[doc.created_by] : null
    })) as Document[]);
    setLoading(false);
  };

  const copyLeadId = () => {
    if (lead) {
      navigator.clipboard.writeText(lead.id);
      toast.success('ID leada skopiowane');
    }
  };

  const getFollowUpSteps = () => {
    if (!lead) return [];
    return [
      { sent: lead.cold_email_sent, date: lead.cold_email_date, label: 'Cold Email', template: lead.email_template },
      { sent: lead.sms_follow_up_sent, date: lead.sms_follow_up_date, label: 'SMS Follow-up', template: null },
      { sent: lead.email_follow_up_1_sent, date: lead.email_follow_up_1_date, label: 'Email FU #1', template: null },
      { sent: lead.email_follow_up_2_sent, date: lead.email_follow_up_2_date, label: 'Email FU #2', template: null },
    ];
  };

  const completedSteps = getFollowUpSteps().filter(s => s.sent).length;
  const totalSteps = 4;

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!lead) return null;

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 space-y-6 animate-fade-in w-full max-w-full overflow-hidden">
        {/* Header with Back & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/leads')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Powrót do leadów
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={copyLeadId}>
              <Copy className="w-4 h-4 mr-2" />
              Kopiuj ID
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate(`/leads`)}>
              <Pencil className="w-4 h-4 mr-2" />
              Edytuj
            </Button>
          </div>
        </div>

        {/* Main Header Card */}
        <Card className="relative overflow-hidden border-border/60 shadow-md">
          <div className="h-1.5 bg-gradient-to-r from-primary via-pink-500 to-primary" />
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{lead.salon_name}</h1>
                  <Badge className={`${statusColors[lead.status] || statusColors.new} border`}>
                    {statusLabels[lead.status] || lead.status}
                  </Badge>
                  {lead.priority && (
                    <Badge className={`${priorityColors[lead.priority]} border`}>
                      {priorityLabels[lead.priority]}
                    </Badge>
                  )}
                </div>
                {lead.owner_name && (
                  <p className="text-lg text-muted-foreground mb-4">{lead.owner_name}</p>
                )}
                
                {/* Quick Info Pills */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {lead.city && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-sm text-foreground">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                      {lead.city}
                    </div>
                  )}
                  {lead.industry && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-sm text-foreground">
                      <Building2 className="w-3.5 h-3.5 text-blue-400" />
                      {lead.industry}
                    </div>
                  )}
                  {lead.source && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-sm text-foreground">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                      {lead.source}
                    </div>
                  )}
                  {lead.created_at && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-sm text-foreground">
                      <Calendar className="w-3.5 h-3.5 text-purple-400" />
                      {format(new Date(lead.created_at), 'd MMM yyyy', { locale: pl })}
                    </div>
                  )}
                </div>
                
                {/* Lead ID */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>ID:</span>
                  <code className="px-2 py-0.5 rounded bg-secondary font-mono text-foreground/70">{lead.id}</code>
                </div>
              </div>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 lg:w-72">
                <div className="p-4 rounded-xl bg-secondary/50 border border-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Follow-up</span>
                  </div>
                  <p className="text-xl font-bold text-primary">{completedSteps}/{totalSteps}</p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/50 border border-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span className="text-xs text-muted-foreground">Dokumenty</span>
                  </div>
                  <p className="text-xl font-bold text-blue-400">{documents.length}</p>
                </div>
                {lead.next_follow_up_date && (
                  <div className="col-span-2 p-4 rounded-xl bg-secondary/50 border border-border/50">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-orange-400" />
                      <span className="text-xs text-muted-foreground">Następny follow-up</span>
                    </div>
                    <p className="text-lg font-bold text-orange-400">
                      {format(new Date(lead.next_follow_up_date), 'd MMMM yyyy', { locale: pl })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact & Details Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Contact Info */}
          <Card className="border-border/50 bg-card/80">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary" />
                Dane kontaktowe
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {lead.phone && (
                <a 
                  href={`tel:${lead.phone}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Telefon</p>
                    <p className="font-medium text-foreground">{lead.phone}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              )}
              
              {lead.email && (
                <a 
                  href={`mailto:${lead.email}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium text-foreground truncate">{lead.email}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              )}
              
              {lead.instagram && (
                <a 
                  href={lead.instagram.startsWith('http') ? lead.instagram : `https://instagram.com/${lead.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center">
                    <Instagram className="w-5 h-5 text-pink-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Instagram</p>
                    <p className="font-medium text-foreground truncate">{lead.instagram}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              )}
              
              {lead.facebook_page && (
                <a 
                  href={lead.facebook_page.startsWith('http') ? lead.facebook_page : `https://facebook.com/${lead.facebook_page}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center">
                    <Facebook className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Facebook</p>
                    <p className="font-medium text-foreground">Zobacz stronę</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              )}

              {!lead.phone && !lead.email && !lead.instagram && !lead.facebook_page && (
                <p className="text-muted-foreground text-sm text-center py-4">Brak danych kontaktowych</p>
              )}
            </CardContent>
          </Card>

          {/* Follow-up Sequence & Notes */}
          <div className="space-y-6">
            {/* Follow-up Sequence */}
            <Card className="border-border/50 bg-card/80">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Sekwencja follow-up
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getFollowUpSteps().map((step, i) => (
                    <div 
                      key={i} 
                      className={`flex items-center gap-3 p-3 rounded-lg transition-colors border ${
                        step.sent 
                          ? 'bg-green-500/10 border-green-500/30' 
                          : 'bg-secondary/50 border-transparent'
                      }`}
                    >
                      {step.sent ? (
                        <div className="w-8 h-8 rounded-full bg-green-500/30 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full border-2 border-zinc-600 bg-zinc-800/50 flex items-center justify-center">
                          <span className="text-xs text-zinc-500">{i + 1}</span>
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${step.sent ? 'text-green-400' : 'text-muted-foreground'}`}>
                            {step.label}
                          </span>
                          {step.template && (
                            <Badge variant="secondary" className="text-[10px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0">
                              {step.template}
                            </Badge>
                          )}
                        </div>
                        {step.sent && (
                          <p className="text-[10px] text-green-400/70">Wysłano</p>
                        )}
                      </div>
                      {step.date ? (
                        <span className={`text-sm ${step.sent ? 'text-green-400/80' : 'text-muted-foreground'}`}>
                          {format(new Date(step.date), 'd MMM yyyy', { locale: pl })}
                        </span>
                      ) : step.sent ? (
                        <span className="text-xs text-green-400/60">brak daty</span>
                      ) : null}
                    </div>
                  ))}
                </div>

                {/* Summary for converted/lost leads */}
                {(lead.status === 'converted' || lead.status === 'lost') && (
                  <div className={`mt-4 p-3 rounded-lg text-center text-sm ${
                    lead.status === 'converted' 
                      ? 'bg-green-500/10 text-green-400 border border-green-500/30' 
                      : 'bg-red-500/10 text-red-400 border border-red-500/30'
                  }`}>
                    {lead.status === 'converted' 
                      ? `Skonwertowany po ${completedSteps} ${completedSteps === 1 ? 'kroku' : completedSteps < 5 ? 'krokach' : 'krokach'}` 
                      : `Utracony po ${completedSteps} ${completedSteps === 1 ? 'kroku' : completedSteps < 5 ? 'krokach' : 'krokach'}`
                    }
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Email Details */}
            {(lead.email_template || lead.email_from) && (
              <Card className="border-border/50 bg-card/80">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Send className="w-5 h-5 text-primary" />
                    Szczegóły email
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {lead.email_template && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/30">
                      <FileText className="w-5 h-5 text-zinc-400" />
                      <div>
                        <p className="text-xs text-zinc-500">Szablon</p>
                        <p className="font-medium text-foreground">{lead.email_template}</p>
                      </div>
                    </div>
                  )}
                  {lead.email_from && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/30">
                      <Mail className="w-5 h-5 text-zinc-400" />
                      <div>
                        <p className="text-xs text-zinc-500">Wysłano z</p>
                        <p className="font-medium text-foreground">{lead.email_from}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Notes & Response Section */}
        {(lead.notes || lead.response) && (
          <div className="grid lg:grid-cols-2 gap-6">
            {lead.notes && (
              <Card className="border-border/50 bg-card/80">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Notatki
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">{lead.notes}</p>
                </CardContent>
              </Card>
            )}

            {lead.response && (
              <Card className="border-border/50 bg-card/80">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    Odpowiedź
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">{lead.response}</p>
                  {lead.response_date && (
                    <p className="text-xs text-zinc-500 mt-3">
                      {format(new Date(lead.response_date), 'd MMMM yyyy', { locale: pl })}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Documents Section */}
        <Card className="border-border/50 bg-card/80">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Dokumenty ({documents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {documents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc) => (
                  <div 
                    key={doc.id}
                    onClick={() => handleDocumentClick(doc)}
                    className="group relative overflow-hidden rounded-xl border border-border/50 bg-zinc-800/30 hover:bg-zinc-800/50 transition-all cursor-pointer"
                  >
                    {doc.thumbnail ? (
                      <div className="aspect-video relative overflow-hidden">
                        <img 
                          src={doc.thumbnail} 
                          alt={doc.title}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      </div>
                    ) : (
                      <div className="aspect-video bg-zinc-800 flex items-center justify-center">
                        <FileText className="w-12 h-12 text-zinc-600" />
                      </div>
                    )}
                    <div className="p-3">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge className={`${documentTypeColors[doc.type]} text-xs`}>
                          {documentTypeLabels[doc.type] || doc.type}
                        </Badge>
                        {/* Show Academy badge for presentations */}
                        {doc.type === 'presentation' && doc.data && (
                          <Badge 
                            className={`text-xs ${
                              (doc.data as Record<string, unknown>).includeAcademy === 'true' 
                                ? 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30' 
                                : 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
                            } border`}
                          >
                            <GraduationCap className="w-3 h-3 mr-1" />
                            {(doc.data as Record<string, unknown>).includeAcademy === 'true' ? 'z Academy' : 'bez Academy'}
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-medium text-foreground truncate">{doc.title}</h4>
                      {doc.subtitle && (
                        <p className="text-xs text-muted-foreground truncate">{doc.subtitle}</p>
                      )}
                      <p className="text-xs text-zinc-500 mt-2">
                        {format(new Date(doc.created_at), 'd MMM yyyy', { locale: pl })}
                      </p>
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
                        <Eye className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto text-zinc-600 mb-3" />
                <p className="text-muted-foreground">Brak dokumentów dla tego leada</p>
                <p className="text-xs text-zinc-500 mt-1">
                  Dokumenty przypisane do leada pojawią się tutaj
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact History Timeline */}
        <LeadInteractionTimeline leadId={lead.id} />
      </div>

      {/* Document Mini Card Preview */}
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
      <DocumentViewer
        document={selectedDocument}
        open={viewerOpen}
        onClose={handleCloseViewer}
      />
    </AppLayout>
  );
}