 import { useState, useEffect } from 'react';
 import { AppLayout } from '@/components/layout/AppLayout';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Textarea } from '@/components/ui/textarea';
 import { Badge } from '@/components/ui/badge';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
   FlaskConical,
   Monitor,
   Smartphone,
   TrendingUp,
   Gift,
   Award,
   Snowflake,
   Sun,
   Heart,
 } from 'lucide-react';
 import { cn } from '@/lib/utils';
 import { FacebookAdMockup } from '@/components/campaign/FacebookAdMockup';
 import { InstagramAdMockup } from '@/components/campaign/InstagramAdMockup';
 import { AdsManagerMockup } from '@/components/campaign/AdsManagerMockup';
 import { CampaignStrategyCard } from '@/components/campaign/CampaignStrategyCard';
 import { ABTestingCard } from '@/components/campaign/ABTestingCard';
 
 // Helper function to safely render values that might be objects
 const renderValue = (value: unknown): string => {
   if (value === null || value === undefined) return '';
   if (typeof value === 'string') return value;
   if (typeof value === 'number' || typeof value === 'boolean') return String(value);
   if (typeof value === 'object') {
     try {
       return Object.entries(value as Record<string, unknown>)
         .map(([key, val]) => `${key}: ${typeof val === 'object' ? JSON.stringify(val) : val}`)
         .join(', ');
     } catch {
       return JSON.stringify(value);
     }
   }
   return String(value);
 };
 
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
     budget_allocation: unknown;
     timeline: string;
     daily_budget?: string;
     total_budget?: string;
     campaign_duration?: string;
     funnel_stages?: Array<{
       stage: string;
       objective: string;
       budget: string;
       duration: string;
       kpis: string[];
     }>;
   };
   adSets?: Array<{
     name: string;
     audience: string;
     placement: string;
     dailyBudget?: string;
     bidStrategy?: string;
     estimatedReach?: string;
   }>;
   posts?: Array<{
     type: string;
     platform?: string;
     headline: string;
     primaryText: string;
     description: string;
     cta: string;
     imageIdea: string;
     hook?: string;
     targetEmotion?: string;
   }>;
   copyVariants?: Array<{
     style: string;
     text: string;
     hook?: string;
     benefit?: string;
     cta?: string;
   }>;
   recommendations?: string[];
   adsManagerSettings?: {
     campaignObjective?: string;
     optimizationGoal?: string;
     attributionWindow?: string;
     scheduling?: string;
     placements?: string;
   };
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
 
 const STEPS = [
   { id: 1, name: 'Klient', icon: Building2, description: 'Dane salonu i kontekst' },
   { id: 2, name: 'Strategia', icon: Target, description: 'Cel, grupa docelowa, USP' },
   { id: 3, name: 'Szczegóły', icon: Settings2, description: 'Sezonowość, promocje, konkurencja' },
   { id: 4, name: 'Generuj', icon: Wand2, description: 'AI tworzy kampanię' },
   { id: 5, name: 'Wyniki', icon: Sparkles, description: 'Pełna strategia i mockupy' },
 ];
 
 const seasonOptions = [
   { value: 'walentynki', label: 'Walentynki', icon: Heart },
   { value: 'wiosna', label: 'Wiosna/Wielkanoc', icon: Sun },
   { value: 'lato', label: 'Lato/Wakacje', icon: Sun },
   { value: 'jesien', label: 'Jesień/Back to school', icon: TrendingUp },
   { value: 'zima', label: 'Zima/Święta', icon: Snowflake },
   { value: 'sylwester', label: 'Sylwester/Karnawał', icon: Sparkles },
   { value: 'dzien_kobiet', label: 'Dzień Kobiet', icon: Gift },
   { value: 'brak', label: 'Brak konkretnej okazji', icon: Calendar },
 ];
 
 export default function CampaignGenerator() {
   const [clients, setClients] = useState<Client[]>([]);
   const [selectedClient, setSelectedClient] = useState<string>('');
   const [loading, setLoading] = useState(false);
   const [campaign, setCampaign] = useState<CampaignData | null>(null);
   const [currentStep, setCurrentStep] = useState(1);
   
   const [formData, setFormData] = useState({
     clientName: '',
     industry: '',
     city: '',
     budget: '',
     objective: '',
     targetAudience: '',
     services: '',
     seasonality: '',
     promotions: '',
     competitors: '',
     usp: '',
     priceRange: '',
     existingFollowers: '',
     previousCampaigns: '',
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
     setCurrentStep(4);
 
     try {
       const { data, error } = await supabase.functions.invoke('generate-campaign', {
         body: formData,
       });
 
       if (error) {
         const status = (error as any)?.context?.status;
         console.error('generate-campaign invoke error:', { status, error });
         toast.error(`Błąd generowania (${status ?? 'unknown'}): ${error.message}`);
         setCurrentStep(3);
         return;
       }
 
       if (data?.error) {
         console.error('generate-campaign edge error:', data);
         const details = typeof data.details === 'string' ? data.details : '';
         toast.error(details ? `${data.error}: ${details}` : data.error);
         setCurrentStep(3);
         return;
       }
 
       if (data?.campaign) {
         setCampaign(data.campaign);
         setCurrentStep(5);
         toast.success('Kampania wygenerowana przez AI!');
       } else {
         toast.error('Brak danych kampanii w odpowiedzi');
         setCurrentStep(3);
       }
     } catch (err: any) {
       console.error('Error generating campaign:', err);
       toast.error(err.message || 'Błąd generowania kampanii');
       setCurrentStep(3);
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
       setCurrentStep(3);
     } else if (currentStep === 3) {
       generateCampaign();
     }
   };
 
   const goToPrevStep = () => {
     if (currentStep > 1 && currentStep !== 4) {
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
       seasonality: '',
       promotions: '',
       competitors: '',
       usp: '',
       priceRange: '',
       existingFollowers: '',
       previousCampaigns: '',
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
                     <Zap className="w-3 h-3 text-primary-foreground" />
                   </div>
                 </div>
                 <div>
                   <h1 className="text-2xl font-bold text-foreground">Generator Kampanii AI</h1>
                   <p className="text-muted-foreground text-sm">Profesjonalne kampanie Meta Ads z mockupami</p>
                 </div>
               </div>
               
               {currentStep === 5 && (
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
             <div className="flex items-center justify-between max-w-4xl mx-auto">
               {STEPS.map((step, index) => {
                 const isActive = currentStep === step.id;
                 const isCompleted = currentStep > step.id;
                 const isPending = currentStep < step.id;
                 
                 return (
                   <div key={step.id} className="flex items-center">
                     <div className="flex flex-col items-center">
                       <div 
                         className={cn(
                           "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                           isActive && "bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/30 scale-110",
                           isCompleted && "bg-primary/20 text-primary",
                           isPending && "bg-muted/50 text-muted-foreground"
                         )}
                       >
                         {isCompleted ? (
                           <Check className="w-4 h-4" />
                         ) : (
                           <step.icon className={cn(
                             "w-4 h-4",
                             isActive && "text-primary-foreground"
                           )} />
                         )}
                       </div>
                       <span className={cn(
                         "text-xs font-medium mt-2 transition-colors hidden sm:block",
                         isActive && "text-primary",
                         isCompleted && "text-primary/70",
                         isPending && "text-muted-foreground"
                       )}>
                         {step.name}
                       </span>
                     </div>
                     
                     {index < STEPS.length - 1 && (
                       <div className={cn(
                         "w-8 sm:w-16 h-0.5 mx-1 sm:mx-2 rounded-full transition-colors",
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
                     Krok 1 z 4
                   </div>
                   <h2 className="text-2xl font-bold text-foreground">Wybierz klienta</h2>
                   <p className="text-muted-foreground mt-2">Wprowadź dane salonu lub wybierz z listy</p>
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
                         <p className="text-xs text-muted-foreground">Dane uzupełnione automatycznie</p>
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
 
                   {/* Manual input */}
                   <div className="p-6 rounded-2xl bg-gradient-to-br from-card to-card/80 border border-border/50 shadow-lg">
                     <div className="flex items-center gap-3 mb-4">
                       <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                         <FileText className="w-5 h-5 text-amber-500" />
                       </div>
                       <div>
                         <h3 className="font-semibold text-foreground">Wprowadź ręcznie</h3>
                         <p className="text-xs text-muted-foreground">Dla nowych klientów</p>
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
 
                 <div className="mt-8 flex justify-center">
                   <Button
                     onClick={goToNextStep}
                     disabled={!canProceedStep1}
                     className="h-12 px-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25"
                   >
                     Dalej: Strategia
                     <ArrowRight className="w-4 h-4 ml-2" />
                   </Button>
                 </div>
               </div>
             )}
 
             {/* Step 2: Strategy */}
             {currentStep === 2 && (
               <div className="animate-fade-in">
                 <div className="text-center mb-8">
                   <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                     <Target className="w-4 h-4" />
                     Krok 2 z 4
                   </div>
                   <h2 className="text-2xl font-bold text-foreground">Strategia kampanii</h2>
                   <p className="text-muted-foreground mt-2">Określ cel, grupę docelową i unikalne wartości</p>
                 </div>
 
                 {/* Client summary */}
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
                         <p className="text-xs text-muted-foreground">Co chcesz osiągnąć?</p>
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
                         <p className="text-xs text-muted-foreground">AI dopasuje jeśli nie podasz</p>
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
                       <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                         <Sparkles className="w-5 h-5 text-success" />
                       </div>
                       <div>
                         <h3 className="font-semibold text-foreground">Promowane usługi</h3>
                         <p className="text-xs text-muted-foreground">Jakie usługi promować?</p>
                       </div>
                     </div>
                     <Textarea
                       value={formData.services}
                       onChange={(e) => setFormData(prev => ({ ...prev, services: e.target.value }))}
                       placeholder="np. Manicure hybrydowy, pedicure, stylizacja paznokci..."
                       className="bg-background/50 border-border/50 resize-none focus:border-primary"
                       rows={2}
                     />
                   </div>
 
                   {/* USP */}
                   <div className="p-6 rounded-2xl bg-gradient-to-br from-card to-card/80 border border-border/50 shadow-lg">
                     <div className="flex items-center gap-3 mb-4">
                       <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                         <Award className="w-5 h-5 text-primary" />
                       </div>
                       <div>
                         <h3 className="font-semibold text-foreground">Unikalna wartość (USP)</h3>
                         <p className="text-xs text-muted-foreground">Co wyróżnia ten salon?</p>
                       </div>
                     </div>
                     <Textarea
                       value={formData.usp}
                       onChange={(e) => setFormData(prev => ({ ...prev, usp: e.target.value }))}
                       placeholder="np. Jedyny salon z certyfikatem X, 10 lat doświadczenia..."
                       className="bg-background/50 border-border/50 resize-none focus:border-primary"
                       rows={2}
                     />
                   </div>
                 </div>
 
                 <div className="mt-8 flex justify-center gap-4">
                   <Button variant="outline" onClick={goToPrevStep} className="h-12 px-6 border-border">
                     <ArrowLeft className="w-4 h-4 mr-2" />
                     Wstecz
                   </Button>
                   <Button
                     onClick={goToNextStep}
                     disabled={!canProceedStep2}
                     className="h-12 px-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25"
                   >
                     Dalej: Szczegóły
                     <ArrowRight className="w-4 h-4 ml-2" />
                   </Button>
                 </div>
               </div>
             )}
 
             {/* Step 3: Details */}
             {currentStep === 3 && (
               <div className="animate-fade-in">
                 <div className="text-center mb-8">
                   <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                     <Settings2 className="w-4 h-4" />
                     Krok 3 z 4
                   </div>
                   <h2 className="text-2xl font-bold text-foreground">Szczegóły kampanii</h2>
                   <p className="text-muted-foreground mt-2">Dodatkowe informacje dla personalizacji</p>
                 </div>
 
                 {/* Client summary */}
                 <div className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-4">
                   <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                     <Building2 className="w-6 h-6 text-primary" />
                   </div>
                   <div className="flex-1">
                     <h4 className="font-semibold text-foreground">{formData.clientName}</h4>
                     <p className="text-sm text-muted-foreground">
                       {formData.industry} {formData.city && `• ${formData.city}`}
                     </p>
                   </div>
                   <Badge className="bg-primary/10 text-primary border-primary/30">{formData.objective}</Badge>
                 </div>
 
                 <div className="space-y-6">
                   {/* Seasonality */}
                   <div className="p-6 rounded-2xl bg-gradient-to-br from-card to-card/80 border border-border/50 shadow-lg">
                     <div className="flex items-center gap-3 mb-4">
                       <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                         <Calendar className="w-5 h-5 text-amber-500" />
                       </div>
                       <div>
                         <h3 className="font-semibold text-foreground">Sezonowość / Okazja</h3>
                         <p className="text-xs text-muted-foreground">Kampania związana z okazją?</p>
                       </div>
                     </div>
                     <div className="grid gap-2 sm:grid-cols-4">
                       {seasonOptions.map(option => (
                         <button
                           key={option.value}
                           onClick={() => setFormData(prev => ({ ...prev, seasonality: option.value }))}
                           className={cn(
                             "p-3 rounded-xl border-2 text-left transition-all duration-200 flex items-center gap-2",
                             formData.seasonality === option.value
                               ? "border-primary bg-primary/10 text-foreground shadow-md shadow-primary/10"
                               : "border-border/50 hover:border-primary/30 text-muted-foreground hover:text-foreground"
                           )}
                         >
                           <option.icon className="w-4 h-4" />
                           <span className="text-sm font-medium">{option.label}</span>
                         </button>
                       ))}
                     </div>
                   </div>
 
                   {/* Promotions */}
                   <div className="p-6 rounded-2xl bg-gradient-to-br from-card to-card/80 border border-border/50 shadow-lg">
                     <div className="flex items-center gap-3 mb-4">
                       <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                         <Gift className="w-5 h-5 text-success" />
                       </div>
                       <div>
                         <h3 className="font-semibold text-foreground">Aktualne promocje</h3>
                         <p className="text-xs text-muted-foreground">Promocje do uwzględnienia</p>
                       </div>
                     </div>
                     <Textarea
                       value={formData.promotions}
                       onChange={(e) => setFormData(prev => ({ ...prev, promotions: e.target.value }))}
                       placeholder="np. -20% na pierwszą wizytę, pakiet 5 zabiegów w cenie 4..."
                       className="bg-background/50 border-border/50 resize-none focus:border-primary"
                       rows={2}
                     />
                   </div>
 
                   {/* Competitors */}
                   <div className="p-6 rounded-2xl bg-gradient-to-br from-card to-card/80 border border-border/50 shadow-lg">
                     <div className="flex items-center gap-3 mb-4">
                       <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                         <TrendingUp className="w-5 h-5 text-destructive" />
                       </div>
                       <div>
                         <h3 className="font-semibold text-foreground">Główni konkurenci</h3>
                         <p className="text-xs text-muted-foreground">Pomaga wyróżnić kampanię</p>
                       </div>
                     </div>
                     <Textarea
                       value={formData.competitors}
                       onChange={(e) => setFormData(prev => ({ ...prev, competitors: e.target.value }))}
                       placeholder="np. Salon XYZ (niższe ceny), Studio ABC (większy zasięg)..."
                       className="bg-background/50 border-border/50 resize-none focus:border-primary"
                       rows={2}
                     />
                   </div>
 
                   {/* Price range & followers */}
                   <div className="grid gap-4 sm:grid-cols-2">
                     <div className="p-6 rounded-2xl bg-gradient-to-br from-card to-card/80 border border-border/50 shadow-lg">
                       <Label className="text-muted-foreground text-xs mb-2 block">Przedział cenowy usług</Label>
                       <Input
                         value={formData.priceRange}
                         onChange={(e) => setFormData(prev => ({ ...prev, priceRange: e.target.value }))}
                         placeholder="np. 80-250 PLN"
                         className="bg-background/50 border-border/50"
                       />
                     </div>
                     <div className="p-6 rounded-2xl bg-gradient-to-br from-card to-card/80 border border-border/50 shadow-lg">
                       <Label className="text-muted-foreground text-xs mb-2 block">Obserwatorzy FB/IG</Label>
                       <Input
                         value={formData.existingFollowers}
                         onChange={(e) => setFormData(prev => ({ ...prev, existingFollowers: e.target.value }))}
                         placeholder="np. 2500 FB, 3200 IG"
                         className="bg-background/50 border-border/50"
                       />
                     </div>
                   </div>
                 </div>
 
                 <div className="mt-8 flex justify-center gap-4">
                   <Button variant="outline" onClick={goToPrevStep} className="h-12 px-6 border-border">
                     <ArrowLeft className="w-4 h-4 mr-2" />
                     Wstecz
                   </Button>
                   <Button
                     onClick={goToNextStep}
                     className="h-12 px-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25"
                   >
                     <Wand2 className="w-4 h-4 mr-2" />
                     Generuj kampanię AI
                   </Button>
                 </div>
               </div>
             )}
 
             {/* Step 4: Generating */}
             {currentStep === 4 && loading && (
               <div className="animate-fade-in flex flex-col items-center justify-center py-20">
                 <div className="relative">
                   <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-2xl shadow-primary/40">
                     <Loader2 className="w-12 h-12 text-primary-foreground animate-spin" />
                   </div>
                   <div className="absolute inset-0 rounded-2xl bg-primary/30 animate-ping" />
                 </div>
                 <h3 className="text-xl font-bold text-foreground mt-8">AI generuje kampanię...</h3>
                 <p className="text-muted-foreground mt-2">To może zająć do 30 sekund</p>
                 
                 <div className="mt-8 flex flex-col items-center gap-3">
                   {[
                     'Analiza danych klienta...',
                     'Budowanie strategii lejka...',
                     'Tworzenie zestawów reklam...',
                     'Generowanie tekstów i wariantów A/B...',
                     'Przygotowanie mockupów...',
                   ].map((text, i) => (
                     <div key={i} className="flex items-center gap-2 text-muted-foreground text-sm animate-pulse" style={{ animationDelay: `${i * 200}ms` }}>
                       <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                       {text}
                     </div>
                   ))}
                 </div>
               </div>
             )}
 
             {/* Step 5: Results */}
             {currentStep === 5 && campaign && (
               <div className="animate-fade-in">
                 <div className="text-center mb-8">
                   <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 text-success text-sm font-medium mb-4">
                     <CheckCircle2 className="w-4 h-4" />
                     Kampania gotowa!
                   </div>
                   <h2 className="text-2xl font-bold text-foreground">Kampania dla {formData.clientName}</h2>
                   <p className="text-muted-foreground mt-2">Przeglądaj materiały i kopiuj do Ads Manager</p>
                 </div>
 
                 <Tabs defaultValue="strategy" className="w-full">
                   <TabsList className="w-full justify-start mb-6 bg-muted/30 p-1 rounded-xl flex-wrap">
                     <TabsTrigger value="strategy" className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                       <Target className="w-4 h-4" />
                       <span className="hidden sm:inline">Strategia</span>
                     </TabsTrigger>
                     <TabsTrigger value="adsmanager" className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                       <Monitor className="w-4 h-4" />
                       <span className="hidden sm:inline">Ads Manager</span>
                     </TabsTrigger>
                     <TabsTrigger value="mockups" className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                       <Smartphone className="w-4 h-4" />
                       <span className="hidden sm:inline">Mockupy</span>
                     </TabsTrigger>
                     <TabsTrigger value="copy" className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                       <FlaskConical className="w-4 h-4" />
                       <span className="hidden sm:inline">A/B Testy</span>
                     </TabsTrigger>
                     <TabsTrigger value="posts" className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                       <FileText className="w-4 h-4" />
                       <span className="hidden sm:inline">Posty</span>
                     </TabsTrigger>
                   </TabsList>
 
                   <ScrollArea className="h-[calc(100vh-480px)]">
                     {/* Strategy Tab */}
                     <TabsContent value="strategy" className="mt-0">
                       {campaign.strategy && (
                         <CampaignStrategyCard 
                           strategy={campaign.strategy} 
                           clientName={formData.clientName}
                         />
                       )}
                       
                       {campaign.recommendations && campaign.recommendations.length > 0 && (
                         <div className="mt-6 p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                           <div className="flex items-center gap-2 text-primary font-semibold mb-4">
                             <Lightbulb className="w-5 h-5" />
                             Rekomendacje AI
                           </div>
                           <ul className="space-y-3">
                             {campaign.recommendations.map((rec, idx) => (
                               <li key={idx} className="flex items-start gap-3">
                                 <CheckCircle2 className="w-4 h-4 text-success mt-1 shrink-0" />
                                 <span className="text-foreground/80 text-sm">{rec}</span>
                               </li>
                             ))}
                           </ul>
                         </div>
                       )}
                     </TabsContent>
 
                     {/* Ads Manager Tab */}
                     <TabsContent value="adsmanager" className="mt-0">
                       {campaign.adSets && (
                         <AdsManagerMockup
                           campaign={{
                             name: `Kampania - ${formData.clientName}`,
                             objective: formData.objective,
                             status: 'draft',
                             budget: `${formData.budget} PLN/mies.`,
                             schedule: campaign.strategy?.campaign_duration || '30 dni',
                             adSets: campaign.adSets.map(adSet => ({
                               ...adSet,
                               status: 'draft' as const,
                             })),
                           }}
                         />
                       )}
                       
                       {campaign.adsManagerSettings && (
                         <div className="mt-6 p-6 rounded-2xl bg-card border border-border shadow-lg">
                           <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                             <Settings2 className="w-5 h-5 text-primary" />
                             Ustawienia do Ads Managera
                           </h4>
                           <div className="grid gap-3 sm:grid-cols-2">
                             {Object.entries(campaign.adsManagerSettings).map(([key, value]) => (
                               <div key={key} className="p-3 rounded-xl bg-muted/30 border border-border/50">
                                 <span className="text-muted-foreground text-xs capitalize">
                                   {key.replace(/([A-Z])/g, ' $1').trim()}
                                 </span>
                                 <p className="text-foreground text-sm mt-1">{renderValue(value)}</p>
                               </div>
                             ))}
                           </div>
                         </div>
                       )}
                     </TabsContent>
 
                     {/* Mockups Tab */}
                     <TabsContent value="mockups" className="mt-0">
                       <div className="space-y-8">
                         <div>
                           <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                             <Smartphone className="w-5 h-5 text-primary" />
                             Podgląd reklam w feedzie
                           </h4>
                           <div className="grid gap-6 lg:grid-cols-2">
                             {campaign.posts?.slice(0, 2).map((post, idx) => (
                               <div key={idx} className="space-y-4">
                                 <Badge className="bg-muted text-muted-foreground">Post {idx + 1}: {post.type}</Badge>
                                 <div className="flex gap-4 justify-center flex-wrap">
                                   <FacebookAdMockup
                                     salonName={formData.clientName}
                                     headline={post.headline}
                                     primaryText={post.primaryText}
                                     cta={post.cta}
                                     description={post.description}
                                     imageIdea={post.imageIdea}
                                     variant="feed"
                                   />
                                 </div>
                               </div>
                             ))}
                           </div>
                         </div>
 
                         <div>
                           <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                             <ImageIcon className="w-5 h-5 text-primary" />
                             Podgląd Stories / Reels
                           </h4>
                           <div className="flex gap-6 justify-center flex-wrap">
                             {campaign.posts?.slice(0, 2).map((post, idx) => (
                               <div key={idx} className="space-y-2">
                                 <Badge className="bg-muted text-muted-foreground text-xs">
                                   {idx === 0 ? 'FB Story' : 'IG Reels'}
                                 </Badge>
                                 {idx === 0 ? (
                                   <FacebookAdMockup
                                     salonName={formData.clientName}
                                     headline={post.headline}
                                     primaryText={post.primaryText}
                                     cta={post.cta}
                                     variant="story"
                                   />
                                 ) : (
                                   <InstagramAdMockup
                                     salonName={formData.clientName}
                                     headline={post.headline}
                                     primaryText={post.primaryText}
                                     cta={post.cta}
                                     variant="reels"
                                   />
                                 )}
                               </div>
                             ))}
                           </div>
                         </div>
                       </div>
                     </TabsContent>
 
                     {/* A/B Testing Tab */}
                     <TabsContent value="copy" className="mt-0">
                       {campaign.copyVariants && (
                         <ABTestingCard variants={campaign.copyVariants} />
                       )}
                     </TabsContent>
 
                     {/* Posts Tab */}
                     <TabsContent value="posts" className="mt-0">
                       <div className="space-y-4">
                         {campaign.posts?.map((post, idx) => (
                           <div key={idx} className="p-5 rounded-2xl bg-gradient-to-br from-card to-card/80 border border-border/50 shadow-lg">
                             <div className="flex items-center justify-between mb-4">
                               <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-foreground font-bold">
                                   {idx + 1}
                                 </div>
                                 <div>
                                   <h3 className="font-semibold text-foreground">Post {idx + 1}</h3>
                                   {post.hook && <p className="text-xs text-muted-foreground">Hook: {post.hook}</p>}
                                 </div>
                               </div>
                               <div className="flex gap-2">
                                 <Badge className="bg-primary/10 text-primary border-primary/30">{post.type}</Badge>
                                 {post.platform && <Badge className="bg-muted text-muted-foreground">{post.platform}</Badge>}
                               </div>
                             </div>
                             <div className="space-y-4">
                               <div className="grid gap-4 sm:grid-cols-2">
                                 <div className="p-3 rounded-xl bg-muted/30">
                                   <span className="text-muted-foreground text-xs">Nagłówek</span>
                                   <p className="text-foreground font-medium mt-1">{post.headline}</p>
                                 </div>
                                 <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
                                   <span className="text-muted-foreground text-xs">CTA</span>
                                   <p className="text-primary font-medium mt-1">{post.cta}</p>
                                 </div>
                               </div>
                               <div className="p-3 rounded-xl bg-muted/30">
                                 <span className="text-muted-foreground text-xs">Tekst główny</span>
                                 <p className="text-foreground/80 text-sm mt-1 whitespace-pre-line">{post.primaryText}</p>
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
                               <div className="flex justify-end pt-2">
                                 <Button
                                   variant="outline"
                                   size="sm"
                                   onClick={() => copyToClipboard(`${post.headline}\n\n${post.primaryText}\n\nCTA: ${post.cta}`)}
                                   className="border-primary/30 text-primary hover:bg-primary/10"
                                 >
                                   <Copy className="w-3.5 h-3.5 mr-1.5" />
                                   Kopiuj post
                                 </Button>
                               </div>
                             </div>
                           </div>
                         ))}
                       </div>
                     </TabsContent>
                   </ScrollArea>
                 </Tabs>
                 
                 {/* Raw content fallback */}
                 {campaign.rawContent && !campaign.strategy && (
                   <div className="p-6 rounded-2xl bg-gradient-to-br from-card to-card/80 border border-border/50 shadow-lg mt-6">
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
               </div>
             )}
 
           </div>
         </div>
       </div>
     </AppLayout>
   );
 }