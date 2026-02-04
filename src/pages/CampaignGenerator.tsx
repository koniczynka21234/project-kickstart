import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  Sparkles,
  Loader2,
  Target,
  Users,
  FileText,
  Copy,
  Image as ImageIcon,
  Wand2,
  CheckCircle2,
  Lightbulb,
  Calendar,
  DollarSign,
  ArrowRight,
  ArrowLeft,
  Megaphone,
  Building2,
  Settings2,
  Zap,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Client {
  id: string;
  salon_name: string;
  city: string | null;
  industry: string | null;
  monthly_budget: number | null;
}

interface CampaignData {
  strategy?: {
    objective: string;
    targetAudience: string;
    budget_allocation: string;
    timeline: string;
  };
  adSets?: Array<{
    name: string;
    audience: string;
    placement: string;
  }>;
  posts?: Array<{
    type: string;
    headline: string;
    primaryText: string;
    description: string;
    cta: string;
    imageIdea: string;
  }>;
  copyVariants?: Array<{
    style: string;
    text: string;
  }>;
  recommendations?: string[];
  rawContent?: string;
}

const objectives = [
  'Generowanie leadów',
  'Rezerwacje online',
  'Świadomość marki',
  'Ruch na stronie',
  'Wiadomości',
];

const industries = [
  'Fryzjerstwo',
  'Kosmetyka',
  'Paznokcie',
  'Spa & Wellness',
  'Barber',
  'Makijaż',
  'Brwi i rzęsy',
];

const styleLabels: Record<string, string> = {
  emotional: 'Emocjonalny',
  benefit: 'Korzyści',
  urgency: 'Pilność',
  social_proof: 'Dowód społeczny',
};

const STEPS = [
  { id: 1, name: 'Klient', icon: Building2, description: 'Wybierz lub wprowadź dane klienta' },
  { id: 2, name: 'Ustawienia', icon: Settings2, description: 'Skonfiguruj cel i parametry kampanii' },
  { id: 3, name: 'Generuj', icon: Wand2, description: 'AI tworzy spersonalizowaną kampanię' },
  { id: 4, name: 'Wyniki', icon: Sparkles, description: 'Przeglądaj i kopiuj materiały' },
];

export default function CampaignGenerator() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [activeResultTab, setActiveResultTab] = useState<'strategy' | 'adsets' | 'posts' | 'copy'>('strategy');
  
  const [formData, setFormData] = useState({
    clientName: '',
    industry: '',
    city: '',
    budget: '',
    objective: '',
    targetAudience: '',
    services: '',
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    const { data } = await supabase
      .from('clients')
      .select('id, salon_name, city, industry, monthly_budget')
      .order('salon_name');
    setClients(data || []);
  };

  const handleClientSelect = (clientId: string) => {
    setSelectedClient(clientId);
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setFormData(prev => ({
        ...prev,
        clientName: client.salon_name,
        city: client.city || '',
        industry: client.industry || '',
        budget: client.monthly_budget?.toString() || '',
      }));
    }
  };

  const generateCampaign = async () => {
    if (!formData.clientName || !formData.industry) {
      toast.error('Wypełnij nazwę klienta i branżę');
      return;
    }

    setLoading(true);
    setCampaign(null);
    setCurrentStep(3);

    try {
      const { data, error } = await supabase.functions.invoke('generate-campaign', {
        body: formData,
      });

      if (error) throw error;

      if (data?.campaign) {
        setCampaign(data.campaign);
        setCurrentStep(4);
        toast.success('Kampania wygenerowana!');
      }
    } catch (err: any) {
      console.error('Error generating campaign:', err);
      toast.error(err.message || 'Błąd generowania kampanii');
      setCurrentStep(2);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Skopiowano do schowka');
  };

  const canProceedStep1 = formData.clientName && formData.industry;
  const canProceedStep2 = formData.objective;

  const goToNextStep = () => {
    if (currentStep === 1 && canProceedStep1) {
      setCurrentStep(2);
    } else if (currentStep === 2 && canProceedStep2) {
      generateCampaign();
    }
  };

  const goToPrevStep = () => {
    if (currentStep > 1 && currentStep !== 3) {
      setCurrentStep(currentStep - 1);
    }
  };

  const resetWizard = () => {
    setCurrentStep(1);
    setCampaign(null);
    setFormData({
      clientName: '',
      industry: '',
      city: '',
      budget: '',
      objective: '',
      targetAudience: '',
      services: '',
    });
    setSelectedClient('');
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border/50 bg-gradient-to-r from-primary/5 via-background to-primary/5">
          <div className="px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-xl shadow-primary/30">
                    <Megaphone className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    <Zap className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Generator Kampanii AI</h1>
                  <p className="text-muted-foreground text-sm">Twórz spersonalizowane strategie reklamowe w 3 krokach</p>
                </div>
              </div>
              
              {currentStep === 4 && (
                <Button
                  variant="outline"
                  onClick={resetWizard}
                  className="border-primary/30 text-primary hover:bg-primary/10"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Nowa kampania
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="border-b border-border/30 bg-card/30 backdrop-blur-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between max-w-3xl mx-auto">
              {STEPS.map((step, index) => {
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                const isPending = currentStep < step.id;
                
                return (
                  <div key={step.id} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div 
                        className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
                          isActive && "bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/30 scale-110",
                          isCompleted && "bg-primary/20 text-primary",
                          isPending && "bg-muted/50 text-muted-foreground"
                        )}
                      >
                        {isCompleted ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <step.icon className={cn(
                            "w-5 h-5",
                            isActive && "text-primary-foreground"
                          )} />
                        )}
                      </div>
                      <span className={cn(
                        "text-xs font-medium mt-2 transition-colors",
                        isActive && "text-primary",
                        isCompleted && "text-primary/70",
                        isPending && "text-muted-foreground"
                      )}>
                        {step.name}
                      </span>
                    </div>
                    
                    {index < STEPS.length - 1 && (
                      <div className={cn(
                        "w-16 sm:w-24 h-0.5 mx-2 rounded-full transition-colors",
                        isCompleted ? "bg-primary/50" : "bg-border"
                      )} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 px-6 py-8">
          <div className="max-w-4xl mx-auto">
            
            {/* Step 1: Client Data */}
            {currentStep === 1 && (
              <div className="animate-fade-in">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                    <Building2 className="w-4 h-4" />
                    Krok 1 z 3
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Wybierz klienta</h2>
                  <p className="text-muted-foreground mt-2">Wprowadź dane salonu lub wybierz z listy istniejących klientów</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {/* Select existing client */}
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-card to-card/80 border border-border/50 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">Z listy klientów</h3>
                        <p className="text-xs text-muted-foreground">Dane zostaną uzupełnione automatycznie</p>
                      </div>
                    </div>
                    <Select value={selectedClient} onValueChange={handleClientSelect}>
                      <SelectTrigger className="bg-background/50 border-border/50 hover:border-primary/50 transition-colors">
                        <SelectValue placeholder="Wybierz klienta..." />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map(client => (
                          <SelectItem key={client.id} value={client.id}>
                            <div className="flex items-center gap-2">
                              <span>{client.salon_name}</span>
                              {client.city && <span className="text-muted-foreground text-xs">• {client.city}</span>}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Or manual input */}
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-card to-card/80 border border-border/50 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">Wprowadź ręcznie</h3>
                        <p className="text-xs text-muted-foreground">Dla nowych lub zewnętrznych klientów</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-muted-foreground text-xs">Nazwa salonu *</Label>
                        <Input
                          value={formData.clientName}
                          onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                          placeholder="np. Beauty Studio"
                          className="mt-1 bg-background/50 border-border/50 focus:border-primary"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional client info */}
                <div className="mt-6 p-6 rounded-2xl bg-gradient-to-br from-card to-card/80 border border-border/50 shadow-lg">
                  <h3 className="font-semibold text-foreground mb-4">Szczegóły klienta</h3>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <Label className="text-muted-foreground text-xs">Branża *</Label>
                      <Select 
                        value={formData.industry} 
                        onValueChange={(v) => setFormData(prev => ({ ...prev, industry: v }))}
                      >
                        <SelectTrigger className="mt-1 bg-background/50 border-border/50 hover:border-primary/50">
                          <SelectValue placeholder="Wybierz branżę" />
                        </SelectTrigger>
                        <SelectContent>
                          {industries.map(ind => (
                            <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Miasto</Label>
                      <Input
                        value={formData.city}
                        onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="np. Warszawa"
                        className="mt-1 bg-background/50 border-border/50"
                      />
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Budżet miesięczny</Label>
                      <div className="relative mt-1">
                        <Input
                          type="number"
                          value={formData.budget}
                          onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                          placeholder="2000"
                          className="bg-background/50 border-border/50 pr-12"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">PLN</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Next button */}
                <div className="mt-8 flex justify-center">
                  <Button
                    onClick={goToNextStep}
                    disabled={!canProceedStep1}
                    className="h-12 px-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 transition-all hover:shadow-primary/40"
                  >
                    Dalej: Ustawienia kampanii
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Campaign Settings */}
            {currentStep === 2 && (
              <div className="animate-fade-in">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                    <Settings2 className="w-4 h-4" />
                    Krok 2 z 3
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Skonfiguruj kampanię</h2>
                  <p className="text-muted-foreground mt-2">Określ cel, grupę docelową i usługi do promocji</p>
                </div>

                {/* Client summary card */}
                <div className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{formData.clientName}</h4>
                    <p className="text-sm text-muted-foreground">
                      {formData.industry} {formData.city && `• ${formData.city}`} {formData.budget && `• ${formData.budget} PLN/mies.`}
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Campaign objective */}
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-card to-card/80 border border-border/50 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Target className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">Cel kampanii *</h3>
                        <p className="text-xs text-muted-foreground">Co chcesz osiągnąć tą kampanią?</p>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {objectives.map(obj => (
                        <button
                          key={obj}
                          onClick={() => setFormData(prev => ({ ...prev, objective: obj }))}
                          className={cn(
                            "p-4 rounded-xl border-2 text-left transition-all duration-200",
                            formData.objective === obj
                              ? "border-primary bg-primary/10 text-foreground shadow-md shadow-primary/10"
                              : "border-border/50 hover:border-primary/30 text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <span className="font-medium">{obj}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Target audience */}
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-card to-card/80 border border-border/50 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">Grupa docelowa</h3>
                        <p className="text-xs text-muted-foreground">Opcjonalnie - AI dopasuje jeśli nie podasz</p>
                      </div>
                    </div>
                    <Textarea
                      value={formData.targetAudience}
                      onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
                      placeholder="np. Kobiety 25-45 lat, zainteresowane pielęgnacją, mieszkające w mieście..."
                      className="bg-background/50 border-border/50 resize-none focus:border-primary"
                      rows={3}
                    />
                  </div>

                  {/* Services */}
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-card to-card/80 border border-border/50 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">Promowane usługi</h3>
                        <p className="text-xs text-muted-foreground">Jakie usługi chcesz promować w kampanii?</p>
                      </div>
                    </div>
                    <Textarea
                      value={formData.services}
                      onChange={(e) => setFormData(prev => ({ ...prev, services: e.target.value }))}
                      placeholder="np. Manicure hybrydowy, pedicure, stylizacja paznokci, przedłużanie..."
                      className="bg-background/50 border-border/50 resize-none focus:border-primary"
                      rows={2}
                    />
                  </div>
                </div>

                {/* Navigation buttons */}
                <div className="mt-8 flex justify-center gap-4">
                  <Button
                    variant="outline"
                    onClick={goToPrevStep}
                    className="h-12 px-6 border-border"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Wstecz
                  </Button>
                  <Button
                    onClick={goToNextStep}
                    disabled={!canProceedStep2}
                    className="h-12 px-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 transition-all hover:shadow-primary/40"
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generuj kampanię AI
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Generating */}
            {currentStep === 3 && loading && (
              <div className="animate-fade-in flex flex-col items-center justify-center py-20">
                <div className="relative">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-2xl shadow-primary/40">
                    <Loader2 className="w-12 h-12 text-primary-foreground animate-spin" />
                  </div>
                  <div className="absolute inset-0 rounded-2xl bg-primary/30 animate-ping" />
                </div>
                <h3 className="text-xl font-bold text-foreground mt-8">AI generuje kampanię...</h3>
                <p className="text-muted-foreground mt-2">Analizujemy dane i tworzymy spersonalizowane materiały</p>
                
                <div className="mt-8 flex flex-col items-center gap-3">
                  {[
                    'Analiza branży i konkurencji...',
                    'Dobór grupy docelowej...',
                    'Tworzenie strategii...',
                    'Generowanie tekstów reklamowych...',
                  ].map((text, i) => (
                    <div key={i} className="flex items-center gap-2 text-muted-foreground text-sm animate-pulse" style={{ animationDelay: `${i * 200}ms` }}>
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {text}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Results */}
            {currentStep === 4 && campaign && (
              <div className="animate-fade-in">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-500 text-sm font-medium mb-4">
                    <CheckCircle2 className="w-4 h-4" />
                    Kampania gotowa!
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Twoja kampania dla {formData.clientName}</h2>
                  <p className="text-muted-foreground mt-2">Przeglądaj materiały i kopiuj do Meta Ads Manager</p>
                </div>

                {/* Result tabs */}
                <div className="flex justify-center gap-2 mb-6">
                  {[
                    { id: 'strategy', label: 'Strategia', icon: Target },
                    { id: 'adsets', label: 'Zestawy', icon: Users },
                    { id: 'posts', label: 'Posty', icon: ImageIcon },
                    { id: 'copy', label: 'Teksty', icon: FileText },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveResultTab(tab.id as any)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all",
                        activeResultTab === tab.id
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                          : "bg-card/50 text-muted-foreground hover:text-foreground hover:bg-card"
                      )}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                <ScrollArea className="h-[calc(100vh-450px)]">
                  {/* Strategy Tab */}
                  {activeResultTab === 'strategy' && (
                    <div className="space-y-4">
                      {campaign.strategy && (
                        <div className="grid gap-4 sm:grid-cols-2">
                          {[
                            { label: 'Cel kampanii', value: campaign.strategy.objective, icon: Target, color: 'primary' },
                            { label: 'Grupa docelowa', value: campaign.strategy.targetAudience, icon: Users, color: 'amber' },
                            { label: 'Podział budżetu', value: campaign.strategy.budget_allocation, icon: DollarSign, color: 'emerald' },
                            { label: 'Harmonogram', value: campaign.strategy.timeline, icon: Calendar, color: 'blue' },
                          ].map((item, i) => (
                            <div key={i} className="p-5 rounded-2xl bg-gradient-to-br from-card to-card/80 border border-border/50 shadow-lg">
                              <div className="flex items-center gap-2 text-primary text-sm font-medium mb-3">
                                <item.icon className="w-4 h-4" />
                                {item.label}
                              </div>
                              <p className="text-foreground">{item.value}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {campaign.recommendations && campaign.recommendations.length > 0 && (
                        <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                          <div className="flex items-center gap-2 text-primary font-semibold mb-4">
                            <Lightbulb className="w-5 h-5" />
                            Rekomendacje AI
                          </div>
                          <ul className="space-y-3">
                            {campaign.recommendations.map((rec, idx) => (
                              <li key={idx} className="flex items-start gap-3">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-1 shrink-0" />
                                <span className="text-foreground/80 text-sm">{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Ad Sets Tab */}
                  {activeResultTab === 'adsets' && (
                    <div className="space-y-4">
                      {campaign.adSets?.map((adSet, idx) => (
                        <div key={idx} className="p-5 rounded-2xl bg-gradient-to-br from-card to-card/80 border border-border/50 shadow-lg">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                              <Users className="w-5 h-5 text-primary" />
                            </div>
                            <h3 className="font-semibold text-foreground">{adSet.name}</h3>
                          </div>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="p-3 rounded-xl bg-background/50">
                              <span className="text-muted-foreground text-xs">Odbiorcy</span>
                              <p className="text-foreground text-sm mt-1">{adSet.audience}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-background/50">
                              <span className="text-muted-foreground text-xs">Umiejscowienie</span>
                              <p className="text-foreground text-sm mt-1">{adSet.placement}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Posts Tab */}
                  {activeResultTab === 'posts' && (
                    <div className="space-y-4">
                      {campaign.posts?.map((post, idx) => (
                        <div key={idx} className="p-5 rounded-2xl bg-gradient-to-br from-card to-card/80 border border-border/50 shadow-lg">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <ImageIcon className="w-5 h-5 text-primary" />
                              </div>
                              <h3 className="font-semibold text-foreground">Post {idx + 1}</h3>
                            </div>
                            <Badge className="bg-primary/10 text-primary border-primary/30">{post.type}</Badge>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <span className="text-muted-foreground text-xs">Nagłówek</span>
                              <p className="text-foreground font-medium mt-1">{post.headline}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-xs">Tekst główny</span>
                              <p className="text-foreground/80 text-sm mt-1">{post.primaryText}</p>
                            </div>
                            <div className="flex gap-3 pt-2">
                              <div className="flex-1 p-3 rounded-xl bg-primary/5 border border-primary/20">
                                <span className="text-muted-foreground text-xs">CTA</span>
                                <p className="text-primary font-medium mt-1">{post.cta}</p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(`${post.headline}\n\n${post.primaryText}`)}
                                className="border-primary/30 text-primary hover:bg-primary/10"
                              >
                                <Copy className="w-3.5 h-3.5 mr-1.5" />
                                Kopiuj
                              </Button>
                            </div>
                            {post.imageIdea && (
                              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                <span className="text-amber-500 text-xs flex items-center gap-1.5">
                                  <ImageIcon className="w-3 h-3" />
                                  Pomysł na grafikę
                                </span>
                                <p className="text-foreground/70 text-sm mt-1">{post.imageIdea}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Copy Variants Tab */}
                  {activeResultTab === 'copy' && (
                    <div className="space-y-4">
                      {campaign.copyVariants?.map((variant, idx) => (
                        <div key={idx} className="p-5 rounded-2xl bg-gradient-to-br from-card to-card/80 border border-border/50 shadow-lg">
                          <div className="flex items-center justify-between mb-3">
                            <Badge className="bg-primary/10 text-primary border-primary/30">
                              {styleLabels[variant.style] || variant.style}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(variant.text)}
                              className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                            >
                              <Copy className="w-3.5 h-3.5 mr-1.5" />
                              Kopiuj
                            </Button>
                          </div>
                          <p className="text-foreground/90 leading-relaxed">{variant.text}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Raw content fallback */}
                  {campaign.rawContent && !campaign.strategy && (
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-card to-card/80 border border-border/50 shadow-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-foreground">Wygenerowana treść</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(campaign.rawContent || '')}
                          className="border-primary/30 text-primary hover:bg-primary/10"
                        >
                          <Copy className="w-3.5 h-3.5 mr-1.5" />
                          Kopiuj całość
                        </Button>
                      </div>
                      <pre className="text-foreground/80 text-sm whitespace-pre-wrap font-sans leading-relaxed">
                        {campaign.rawContent}
                      </pre>
                    </div>
                  )}
                </ScrollArea>
              </div>
            )}

          </div>
        </div>
      </div>
    </AppLayout>
  );
}
