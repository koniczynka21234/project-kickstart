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
   Play,
   ChevronRight,
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
   { id: 'leads', label: 'Generowanie leadów', icon: Users, description: 'Pozyskaj kontakty potencjalnych klientów' },
   { id: 'bookings', label: 'Rezerwacje online', icon: Calendar, description: 'Zwiększ liczbę rezerwacji przez internet' },
   { id: 'awareness', label: 'Świadomość marki', icon: Megaphone, description: 'Dotrzyj do nowych odbiorców' },
   { id: 'traffic', label: 'Ruch na stronie', icon: TrendingUp, description: 'Przyciągnij więcej odwiedzających' },
   { id: 'messages', label: 'Wiadomości', icon: FileText, description: 'Zachęć do kontaktu przez Messenger' },
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
   { id: 1, name: 'Klient', icon: Building2 },
   { id: 2, name: 'Cel', icon: Target },
   { id: 3, name: 'Szczegóły', icon: Settings2 },
   { id: 4, name: 'Wyniki', icon: Sparkles },
 ];
 
 const seasonOptions = [
   { value: 'walentynki', label: 'Walentynki', icon: Heart, color: 'from-pink-500 to-rose-500' },
   { value: 'wiosna', label: 'Wiosna', icon: Sun, color: 'from-green-500 to-emerald-500' },
   { value: 'lato', label: 'Lato', icon: Sun, color: 'from-yellow-500 to-orange-500' },
   { value: 'zima', label: 'Święta', icon: Snowflake, color: 'from-blue-500 to-cyan-500' },
   { value: 'sylwester', label: 'Sylwester', icon: Sparkles, color: 'from-purple-500 to-violet-500' },
   { value: 'brak', label: 'Brak okazji', icon: Calendar, color: 'from-gray-500 to-gray-600' },
 ];
 
 export default function CampaignGenerator() {
   const [clients, setClients] = useState<Client[]>([]);
   const [selectedClient, setSelectedClient] = useState<string>('');
   const [loading, setLoading] = useState(false);
   const [campaign, setCampaign] = useState<CampaignData | null>(null);
   const [currentStep, setCurrentStep] = useState(1);
   const [loadingProgress, setLoadingProgress] = useState(0);
   
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
 
   useEffect(() => {
     if (loading) {
       const interval = setInterval(() => {
         setLoadingProgress(prev => {
           if (prev >= 95) return prev;
           return prev + Math.random() * 15;
         });
       }, 500);
       return () => clearInterval(interval);
     } else {
       setLoadingProgress(0);
     }
   }, [loading]);
 
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
 
     try {
       const { data, error } = await supabase.functions.invoke('generate-campaign', {
         body: formData,
       });
 
       if (error) {
         const status = (error as any)?.context?.status;
         toast.error(`Błąd generowania (${status ?? 'unknown'}): ${error.message}`);
         return;
       }
 
       if (data?.error) {
         const details = typeof data.details === 'string' ? data.details : '';
         toast.error(details ? `${data.error}: ${details}` : data.error);
         return;
       }
 
       if (data?.campaign) {
         setCampaign(data.campaign);
         setCurrentStep(4);
         toast.success('Kampania wygenerowana!');
       } else {
         toast.error('Brak danych kampanii w odpowiedzi');
       }
     } catch (err: any) {
       toast.error(err.message || 'Błąd generowania kampanii');
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
     if (currentStep === 1 && canProceedStep1) setCurrentStep(2);
     else if (currentStep === 2 && canProceedStep2) setCurrentStep(3);
     else if (currentStep === 3) generateCampaign();
   };
 
   const goToPrevStep = () => {
     if (currentStep > 1 && currentStep < 4) setCurrentStep(currentStep - 1);
   };
 
   const resetWizard = () => {
     setCurrentStep(1);
     setCampaign(null);
     setFormData({
       clientName: '', industry: '', city: '', budget: '', objective: '', targetAudience: '',
       services: '', seasonality: '', promotions: '', competitors: '', usp: '', priceRange: '',
       existingFollowers: '', previousCampaigns: '',
     });
     setSelectedClient('');
   };
 
   // RENDERING
   return (
     <AppLayout>
       <div className="min-h-screen bg-background">
         {/* Premium Hero Header */}
         <div className="relative overflow-hidden border-b border-border/30">
           <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5" />
           <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
           
           <div className="relative px-6 py-8">
             <div className="flex items-center justify-between max-w-6xl mx-auto">
               <div className="flex items-center gap-5">
                 <div className="relative group">
                   <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                   <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                     <Megaphone className="w-8 h-8 text-primary-foreground" />
                   </div>
                 </div>
                 <div>
                   <h1 className="text-3xl font-bold text-foreground tracking-tight">
                     Generator Kampanii
                     <span className="ml-2 text-sm font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">AI</span>
                   </h1>
                   <p className="text-muted-foreground mt-1">Profesjonalne kampanie Meta Ads w kilka minut</p>
                 </div>
               </div>
               
               {currentStep === 4 && (
                 <Button onClick={resetWizard} variant="outline" className="border-primary/30 hover:bg-primary/10">
                   <ArrowLeft className="w-4 h-4 mr-2" />
                   Nowa kampania
                 </Button>
               )}
             </div>
           </div>
         </div>
 
         {/* Premium Step Indicator */}
         <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/30">
           <div className="px-6 py-4">
             <div className="flex items-center justify-center gap-2 max-w-xl mx-auto">
               {STEPS.map((step, index) => {
                 const isActive = currentStep === step.id || (currentStep === 4 && loading && step.id === 3);
                 const isCompleted = currentStep > step.id || (currentStep === 4 && !loading && step.id < 4);
                 const isPending = currentStep < step.id;
                 const Icon = step.icon;
                 
                 return (
                   <div key={step.id} className="flex items-center">
                     <div className="flex flex-col items-center">
                       <div className={cn(
                         "relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500",
                         isActive && "bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/40 scale-110",
                         isCompleted && "bg-primary/20",
                         isPending && "bg-muted/50"
                       )}>
                         {isCompleted ? (
                           <Check className="w-5 h-5 text-primary" />
                         ) : (
                           <Icon className={cn(
                             "w-5 h-5 transition-colors",
                             isActive && "text-primary-foreground",
                             !isActive && "text-muted-foreground"
                           )} />
                         )}
                         {isActive && (
                           <div className="absolute inset-0 rounded-xl bg-primary/30 animate-ping" style={{ animationDuration: '2s' }} />
                         )}
                       </div>
                       <span className={cn(
                         "text-xs font-medium mt-2 transition-all",
                         isActive && "text-primary",
                         isCompleted && "text-primary/70",
                         isPending && "text-muted-foreground"
                       )}>
                         {step.name}
                       </span>
                     </div>
                     
                     {index < STEPS.length - 1 && (
                       <div className={cn(
                         "w-12 h-1 mx-2 rounded-full transition-all duration-500",
                         isCompleted ? "bg-gradient-to-r from-primary to-primary/50" : "bg-muted"
                       )} />
                     )}
                   </div>
                 );
               })}
             </div>
           </div>
         </div>
 
         {/* Main Content Area */}
         <div className="px-6 py-8">
           <div className="max-w-5xl mx-auto">
             
             {/* ============ STEP 1: Client Selection ============ */}
             {currentStep === 1 && (
               <div className="animate-fade-in space-y-8">
                 <div className="text-center">
                   <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Krok 1 z 3</Badge>
                   <h2 className="text-2xl font-bold text-foreground">Wybierz lub dodaj klienta</h2>
                   <p className="text-muted-foreground mt-2">Dane zostaną wykorzystane do personalizacji kampanii</p>
                 </div>
 
                 <div className="grid gap-6 lg:grid-cols-2">
                   {/* Existing Clients Card */}
                   <div className="group relative rounded-2xl bg-card border border-border/50 p-6 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5">
                     <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                     <div className="relative">
                       <div className="flex items-center gap-4 mb-6">
                         <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                           <Users className="w-7 h-7 text-primary" />
                         </div>
                         <div>
                           <h3 className="font-semibold text-foreground text-lg">Z bazy klientów</h3>
                           <p className="text-sm text-muted-foreground">Automatyczne uzupełnienie danych</p>
                         </div>
                       </div>
                       
                       <Select value={selectedClient} onValueChange={handleClientSelect}>
                         <SelectTrigger className="h-14 text-base bg-muted/30 border-border/50 hover:border-primary/50 focus:border-primary transition-all">
                           <SelectValue placeholder="Wybierz klienta z listy..." />
                         </SelectTrigger>
                         <SelectContent>
                           {clients.map(client => (
                             <SelectItem key={client.id} value={client.id} className="py-3">
                               <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                                   {client.salon_name.charAt(0)}
                                 </div>
                                 <div>
                                   <span className="font-medium">{client.salon_name}</span>
                                   {client.city && <span className="text-muted-foreground text-sm ml-2">• {client.city}</span>}
                                 </div>
                               </div>
                             </SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                       
                       {selectedClient && (
                         <div className="mt-4 p-4 rounded-xl bg-success/10 border border-success/20 flex items-center gap-3">
                           <CheckCircle2 className="w-5 h-5 text-success" />
                           <span className="text-success text-sm font-medium">Dane klienta załadowane</span>
                         </div>
                       )}
                     </div>
                   </div>
 
                   {/* Manual Entry Card */}
                   <div className="group relative rounded-2xl bg-card border border-border/50 p-6 hover:border-amber-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/5">
                     <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                     <div className="relative">
                       <div className="flex items-center gap-4 mb-6">
                         <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/10 flex items-center justify-center">
                           <FileText className="w-7 h-7 text-amber-500" />
                         </div>
                         <div>
                           <h3 className="font-semibold text-foreground text-lg">Nowy klient</h3>
                           <p className="text-sm text-muted-foreground">Wprowadź dane ręcznie</p>
                         </div>
                       </div>
                       
                       <div className="space-y-4">
                         <div>
                           <Label className="text-muted-foreground text-sm mb-2 block">Nazwa salonu *</Label>
                           <Input
                             value={formData.clientName}
                             onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                             placeholder="np. Beauty Studio Warszawa"
                             className="h-14 text-base bg-muted/30 border-border/50 focus:border-amber-500"
                           />
                         </div>
                       </div>
                     </div>
                   </div>
                 </div>
 
                 {/* Client Details Section */}
                 <div className="rounded-2xl bg-card border border-border/50 p-6">
                   <h3 className="font-semibold text-foreground text-lg mb-6 flex items-center gap-2">
                     <Settings2 className="w-5 h-5 text-primary" />
                     Szczegóły klienta
                   </h3>
                   
                   <div className="grid gap-6 sm:grid-cols-3">
                     <div>
                       <Label className="text-muted-foreground text-sm mb-2 block">Branża *</Label>
                       <Select value={formData.industry} onValueChange={(v) => setFormData(prev => ({ ...prev, industry: v }))}>
                         <SelectTrigger className="h-12 bg-muted/30 border-border/50 hover:border-primary/50">
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
                       <Label className="text-muted-foreground text-sm mb-2 block">Miasto</Label>
                       <Input
                         value={formData.city}
                         onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                         placeholder="np. Warszawa"
                         className="h-12 bg-muted/30 border-border/50"
                       />
                     </div>
                     
                     <div>
                       <Label className="text-muted-foreground text-sm mb-2 block">Budżet miesięczny</Label>
                       <div className="relative">
                         <Input
                           type="number"
                           value={formData.budget}
                           onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                           placeholder="2000"
                           className="h-12 bg-muted/30 border-border/50 pr-14"
                         />
                         <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">PLN</span>
                       </div>
                     </div>
                   </div>
                 </div>
 
                 {/* Navigation */}
                 <div className="flex justify-center pt-4">
                   <Button
                     onClick={goToNextStep}
                     disabled={!canProceedStep1}
                     size="lg"
                     className="h-14 px-10 bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/25 text-base font-semibold"
                   >
                     Dalej: Wybierz cel
                     <ArrowRight className="w-5 h-5 ml-2" />
                   </Button>
                 </div>
               </div>
             )}
 
             {/* ============ STEP 2: Campaign Objective ============ */}
             {currentStep === 2 && (
               <div className="animate-fade-in space-y-8">
                 <div className="text-center">
                   <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Krok 2 z 3</Badge>
                   <h2 className="text-2xl font-bold text-foreground">Jaki jest cel kampanii?</h2>
                   <p className="text-muted-foreground mt-2">Wybierz główny cel, który chcesz osiągnąć</p>
                 </div>
 
                 {/* Client Summary */}
                 <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border/50">
                   <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                     {formData.clientName.charAt(0)}
                   </div>
                   <div>
                     <h4 className="font-semibold text-foreground">{formData.clientName}</h4>
                     <p className="text-sm text-muted-foreground">{formData.industry} {formData.city && `• ${formData.city}`}</p>
                   </div>
                   {formData.budget && (
                     <Badge className="ml-auto bg-success/10 text-success border-success/20">
                       {formData.budget} PLN/mies.
                     </Badge>
                   )}
                 </div>
 
                 {/* Objectives Grid */}
                 <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                   {objectives.map((obj) => {
                     const Icon = obj.icon;
                     const isSelected = formData.objective === obj.label;
                     
                     return (
                       <button
                         key={obj.id}
                         onClick={() => setFormData(prev => ({ ...prev, objective: obj.label }))}
                         className={cn(
                           "relative group p-6 rounded-2xl border-2 text-left transition-all duration-300",
                           isSelected
                             ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                             : "border-border/50 bg-card hover:border-primary/30 hover:bg-primary/5"
                         )}
                       >
                         <div className={cn(
                           "w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-all",
                           isSelected
                             ? "bg-gradient-to-br from-primary to-accent"
                             : "bg-muted group-hover:bg-primary/20"
                         )}>
                           <Icon className={cn(
                             "w-7 h-7 transition-colors",
                             isSelected ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"
                           )} />
                         </div>
                         <h3 className={cn(
                           "font-semibold text-lg mb-1 transition-colors",
                           isSelected ? "text-foreground" : "text-foreground/80"
                         )}>
                           {obj.label}
                         </h3>
                         <p className="text-sm text-muted-foreground">{obj.description}</p>
                         
                         {isSelected && (
                           <div className="absolute top-4 right-4">
                             <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                               <Check className="w-4 h-4 text-primary-foreground" />
                             </div>
                           </div>
                         )}
                       </button>
                     );
                   })}
                 </div>
 
                 {/* Additional Details */}
                 <div className="grid gap-6 lg:grid-cols-2">
                   <div className="rounded-2xl bg-card border border-border/50 p-6">
                     <div className="flex items-center gap-3 mb-4">
                       <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                         <Users className="w-5 h-5 text-amber-500" />
                       </div>
                       <div>
                         <h4 className="font-semibold text-foreground">Grupa docelowa</h4>
                         <p className="text-xs text-muted-foreground">Opcjonalne - AI dopasuje automatycznie</p>
                       </div>
                     </div>
                     <Textarea
                       value={formData.targetAudience}
                       onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
                       placeholder="np. Kobiety 25-45 lat, zainteresowane pielęgnacją, mieszkające w mieście..."
                       className="bg-muted/30 border-border/50 resize-none min-h-[100px]"
                     />
                   </div>
 
                   <div className="rounded-2xl bg-card border border-border/50 p-6">
                     <div className="flex items-center gap-3 mb-4">
                       <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                         <Sparkles className="w-5 h-5 text-success" />
                       </div>
                       <div>
                         <h4 className="font-semibold text-foreground">Promowane usługi</h4>
                         <p className="text-xs text-muted-foreground">Jakie usługi chcesz promować?</p>
                       </div>
                     </div>
                     <Textarea
                       value={formData.services}
                       onChange={(e) => setFormData(prev => ({ ...prev, services: e.target.value }))}
                       placeholder="np. Manicure hybrydowy, pedicure, stylizacja paznokci..."
                       className="bg-muted/30 border-border/50 resize-none min-h-[100px]"
                     />
                   </div>
                 </div>
 
                 {/* Navigation */}
                 <div className="flex justify-center gap-4 pt-4">
                   <Button onClick={goToPrevStep} variant="outline" size="lg" className="h-14 px-8">
                     <ArrowLeft className="w-5 h-5 mr-2" />
                     Wstecz
                   </Button>
                   <Button
                     onClick={goToNextStep}
                     disabled={!canProceedStep2}
                     size="lg"
                     className="h-14 px-10 bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/25 text-base font-semibold"
                   >
                     Dalej: Szczegóły
                     <ArrowRight className="w-5 h-5 ml-2" />
                   </Button>
                 </div>
               </div>
             )}
 
             {/* ============ STEP 3: Details ============ */}
             {currentStep === 3 && !loading && (
               <div className="animate-fade-in space-y-8">
                 <div className="text-center">
                   <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Krok 3 z 3</Badge>
                   <h2 className="text-2xl font-bold text-foreground">Ostatnie szczegóły</h2>
                   <p className="text-muted-foreground mt-2">Dodatkowe informacje dla lepszej personalizacji</p>
                 </div>
 
                 {/* Summary Card */}
                 <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                   <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                     {formData.clientName.charAt(0)}
                   </div>
                   <div className="flex-1">
                     <h4 className="font-semibold text-foreground">{formData.clientName}</h4>
                     <p className="text-sm text-muted-foreground">{formData.industry}</p>
                   </div>
                   <Badge className="bg-primary/20 text-primary border-primary/30">{formData.objective}</Badge>
                 </div>
 
                 {/* Season Selection */}
                 <div className="rounded-2xl bg-card border border-border/50 p-6">
                   <div className="flex items-center gap-3 mb-6">
                     <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                       <Calendar className="w-5 h-5 text-amber-500" />
                     </div>
                     <div>
                       <h4 className="font-semibold text-foreground">Sezonowość / Okazja</h4>
                       <p className="text-xs text-muted-foreground">Czy kampania jest związana z konkretną okazją?</p>
                     </div>
                   </div>
                   
                   <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
                     {seasonOptions.map(option => {
                       const Icon = option.icon;
                       const isSelected = formData.seasonality === option.value;
                       
                       return (
                         <button
                           key={option.value}
                           onClick={() => setFormData(prev => ({ ...prev, seasonality: option.value }))}
                           className={cn(
                             "relative p-4 rounded-xl border-2 transition-all duration-200",
                             isSelected
                               ? "border-primary bg-primary/10"
                               : "border-border/50 hover:border-primary/30 bg-muted/30"
                           )}
                         >
                            <div className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2 transition-all",
                              isSelected ? "bg-primary" : "bg-muted"
                            )}>
                              <Icon className={cn("w-5 h-5", isSelected ? "text-primary-foreground" : "text-muted-foreground")} />
                            </div>
                           <span className={cn(
                             "text-sm font-medium block text-center",
                             isSelected ? "text-foreground" : "text-muted-foreground"
                           )}>
                             {option.label}
                           </span>
                         </button>
                       );
                     })}
                   </div>
                 </div>
 
                 {/* Additional Details Grid */}
                 <div className="grid gap-6 lg:grid-cols-2">
                   <div className="rounded-2xl bg-card border border-border/50 p-6">
                     <div className="flex items-center gap-3 mb-4">
                       <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                         <Gift className="w-5 h-5 text-success" />
                       </div>
                       <div>
                         <h4 className="font-semibold text-foreground">Aktualne promocje</h4>
                         <p className="text-xs text-muted-foreground">Promocje do uwzględnienia w kampanii</p>
                       </div>
                     </div>
                     <Textarea
                       value={formData.promotions}
                       onChange={(e) => setFormData(prev => ({ ...prev, promotions: e.target.value }))}
                       placeholder="np. -20% na pierwszą wizytę, pakiet 5 zabiegów w cenie 4..."
                       className="bg-muted/30 border-border/50 resize-none min-h-[100px]"
                     />
                   </div>
 
                   <div className="rounded-2xl bg-card border border-border/50 p-6">
                     <div className="flex items-center gap-3 mb-4">
                       <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                         <Award className="w-5 h-5 text-primary" />
                       </div>
                       <div>
                         <h4 className="font-semibold text-foreground">Unikalna wartość (USP)</h4>
                         <p className="text-xs text-muted-foreground">Co wyróżnia ten salon?</p>
                       </div>
                     </div>
                     <Textarea
                       value={formData.usp}
                       onChange={(e) => setFormData(prev => ({ ...prev, usp: e.target.value }))}
                       placeholder="np. Jedyny salon z certyfikatem X, 10 lat doświadczenia..."
                       className="bg-muted/30 border-border/50 resize-none min-h-[100px]"
                     />
                   </div>
                 </div>
 
                 {/* Quick Stats */}
                 <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                   <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                     <Label className="text-muted-foreground text-xs">Przedział cenowy</Label>
                     <Input
                       value={formData.priceRange}
                       onChange={(e) => setFormData(prev => ({ ...prev, priceRange: e.target.value }))}
                       placeholder="80-250 PLN"
                       className="mt-2 bg-transparent border-0 p-0 h-auto text-foreground font-semibold focus-visible:ring-0"
                     />
                   </div>
                   <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                     <Label className="text-muted-foreground text-xs">Obserwatorzy FB/IG</Label>
                     <Input
                       value={formData.existingFollowers}
                       onChange={(e) => setFormData(prev => ({ ...prev, existingFollowers: e.target.value }))}
                       placeholder="2500 FB, 3200 IG"
                       className="mt-2 bg-transparent border-0 p-0 h-auto text-foreground font-semibold focus-visible:ring-0"
                     />
                   </div>
                   <div className="p-4 rounded-xl bg-muted/30 border border-border/50 col-span-2">
                     <Label className="text-muted-foreground text-xs">Główni konkurenci</Label>
                     <Input
                       value={formData.competitors}
                       onChange={(e) => setFormData(prev => ({ ...prev, competitors: e.target.value }))}
                       placeholder="np. Salon XYZ, Studio ABC..."
                       className="mt-2 bg-transparent border-0 p-0 h-auto text-foreground font-semibold focus-visible:ring-0"
                     />
                   </div>
                 </div>
 
                 {/* Navigation */}
                 <div className="flex justify-center gap-4 pt-4">
                   <Button onClick={goToPrevStep} variant="outline" size="lg" className="h-14 px-8">
                     <ArrowLeft className="w-5 h-5 mr-2" />
                     Wstecz
                   </Button>
                   <Button
                     onClick={goToNextStep}
                     size="lg"
                     className="h-14 px-10 bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/25 text-base font-semibold group"
                   >
                     <Wand2 className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                     Generuj kampanię AI
                     <Sparkles className="w-4 h-4 ml-2 animate-pulse" />
                   </Button>
                 </div>
               </div>
             )}
 
             {/* ============ LOADING STATE ============ */}
             {loading && (
               <div className="animate-fade-in flex flex-col items-center justify-center py-20">
                 <div className="relative">
                   <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-primary via-accent to-primary flex items-center justify-center shadow-2xl shadow-primary/40">
                     <Wand2 className="w-16 h-16 text-primary-foreground animate-pulse" />
                   </div>
                   <div className="absolute inset-0 rounded-3xl bg-primary/20 animate-ping" style={{ animationDuration: '2s' }} />
                   
                   {/* Orbiting elements */}
                   <div className="absolute -inset-8">
                     <div className="w-6 h-6 rounded-full bg-primary absolute top-0 left-1/2 -translate-x-1/2 animate-bounce" style={{ animationDelay: '0s' }} />
                     <div className="w-4 h-4 rounded-full bg-accent absolute bottom-0 left-0 animate-bounce" style={{ animationDelay: '0.2s' }} />
                     <div className="w-5 h-5 rounded-full bg-primary absolute bottom-0 right-0 animate-bounce" style={{ animationDelay: '0.4s' }} />
                   </div>
                 </div>
                 
                 <h3 className="text-2xl font-bold text-foreground mt-10">AI tworzy kampanię...</h3>
                 <p className="text-muted-foreground mt-2">Analizuję dane i przygotowuję strategię</p>
                 
                 {/* Progress bar */}
                 <div className="w-80 mt-8">
                   <div className="h-2 bg-muted rounded-full overflow-hidden">
                     <div 
                       className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                       style={{ width: `${loadingProgress}%` }}
                     />
                   </div>
                   <p className="text-center text-muted-foreground text-sm mt-2">{Math.round(loadingProgress)}%</p>
                 </div>
                 
                 <div className="mt-8 space-y-3">
                   {[
                     'Analiza profilu klienta',
                     'Budowanie strategii lejka',
                     'Tworzenie zestawów reklam',
                     'Generowanie tekstów A/B',
                   ].map((text, i) => (
                     <div 
                       key={i} 
                       className={cn(
                         "flex items-center gap-3 text-sm transition-all duration-500",
                         loadingProgress > i * 25 ? "text-foreground" : "text-muted-foreground"
                       )}
                       style={{ animationDelay: `${i * 150}ms` }}
                     >
                       {loadingProgress > (i + 1) * 25 ? (
                         <CheckCircle2 className="w-4 h-4 text-success" />
                       ) : (
                         <Loader2 className={cn(
                           "w-4 h-4",
                           loadingProgress > i * 25 && loadingProgress <= (i + 1) * 25 && "animate-spin text-primary"
                         )} />
                       )}
                       {text}
                     </div>
                   ))}
                 </div>
               </div>
             )}
 
             {/* ============ STEP 4: Results ============ */}
             {currentStep === 4 && campaign && !loading && (
               <div className="animate-fade-in">
                 {/* Success Header */}
                 <div className="text-center mb-8">
                   <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-success/10 text-success border border-success/20 mb-4">
                     <CheckCircle2 className="w-5 h-5" />
                     <span className="font-semibold">Kampania wygenerowana!</span>
                   </div>
                   <h2 className="text-3xl font-bold text-foreground">Kampania dla {formData.clientName}</h2>
                   <p className="text-muted-foreground mt-2">Przeglądaj strategię, mockupy i materiały do wdrożenia</p>
                 </div>
 
                 {/* Results Tabs */}
                 <Tabs defaultValue="strategy" className="w-full">
                   <TabsList className="w-full justify-start mb-8 bg-muted/30 p-1.5 rounded-xl gap-1 flex-wrap h-auto">
                     {[
                       { value: 'strategy', icon: Target, label: 'Strategia' },
                       { value: 'adsmanager', icon: Monitor, label: 'Ads Manager' },
                       { value: 'mockups', icon: Smartphone, label: 'Mockupy' },
                       { value: 'copy', icon: FlaskConical, label: 'A/B Testy' },
                       { value: 'posts', icon: FileText, label: 'Posty' },
                     ].map(tab => (
                       <TabsTrigger 
                         key={tab.value}
                         value={tab.value}
                         className="gap-2 rounded-lg px-4 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 transition-all"
                       >
                         <tab.icon className="w-4 h-4" />
                         <span className="hidden sm:inline">{tab.label}</span>
                       </TabsTrigger>
                     ))}
                   </TabsList>
 
                   <div className="min-h-[500px]">
                     {/* Strategy Tab */}
                     <TabsContent value="strategy" className="mt-0">
                       {campaign.strategy && (
                         <CampaignStrategyCard strategy={campaign.strategy} clientName={formData.clientName} />
                       )}
                       
                       {campaign.recommendations && campaign.recommendations.length > 0 && (
                         <div className="mt-6 p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/5 border border-primary/20">
                           <div className="flex items-center gap-3 mb-4">
                             <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                               <Lightbulb className="w-5 h-5 text-primary" />
                             </div>
                             <h4 className="font-semibold text-foreground">Rekomendacje AI</h4>
                           </div>
                           <ul className="space-y-3">
                             {campaign.recommendations.map((rec, idx) => (
                               <li key={idx} className="flex items-start gap-3">
                                 <CheckCircle2 className="w-4 h-4 text-success mt-1 shrink-0" />
                                 <span className="text-foreground/80">{rec}</span>
                               </li>
                             ))}
                           </ul>
                         </div>
                       )}
                     </TabsContent>
 
                     {/* Ads Manager Tab */}
                     <TabsContent value="adsmanager" className="mt-0 space-y-6">
                       {campaign.adSets && (
                         <AdsManagerMockup
                           campaign={{
                             name: `Kampania - ${formData.clientName}`,
                             objective: formData.objective,
                             status: 'draft',
                             budget: `${formData.budget} PLN/mies.`,
                             schedule: campaign.strategy?.campaign_duration || '30 dni',
                             adSets: campaign.adSets.map(adSet => ({ ...adSet, status: 'draft' as const })),
                           }}
                         />
                       )}
                       
                       {campaign.adsManagerSettings && (
                         <div className="p-6 rounded-2xl bg-card border border-border shadow-lg">
                           <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                             <Settings2 className="w-5 h-5 text-primary" />
                             Szczegółowe ustawienia
                           </h4>
                           <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                             {Object.entries(campaign.adsManagerSettings).map(([key, value]) => (
                               <div key={key} className="p-4 rounded-xl bg-muted/30 border border-border/50">
                                 <span className="text-muted-foreground text-xs capitalize block mb-1">
                                   {key.replace(/([A-Z])/g, ' $1').trim()}
                                 </span>
                                 <p className="text-foreground font-medium">{renderValue(value)}</p>
                               </div>
                             ))}
                           </div>
                         </div>
                       )}
                     </TabsContent>
 
                     {/* Mockups Tab */}
                     <TabsContent value="mockups" className="mt-0 space-y-10">
                       <div>
                         <h4 className="font-semibold text-foreground mb-6 flex items-center gap-2 text-lg">
                           <Smartphone className="w-5 h-5 text-primary" />
                           Podgląd reklam w feedzie
                         </h4>
                         <div className="grid gap-8 lg:grid-cols-2">
                           {campaign.posts?.slice(0, 2).map((post, idx) => (
                             <div key={idx} className="space-y-4">
                               <Badge className="bg-muted text-muted-foreground">Post {idx + 1}: {post.type}</Badge>
                               <div className="flex justify-center">
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
                         <h4 className="font-semibold text-foreground mb-6 flex items-center gap-2 text-lg">
                           <ImageIcon className="w-5 h-5 text-primary" />
                           Podgląd Stories / Reels
                         </h4>
                         <div className="flex gap-8 justify-center flex-wrap">
                           {campaign.posts?.slice(0, 2).map((post, idx) => (
                             <div key={idx} className="space-y-3">
                               <Badge className="bg-muted text-muted-foreground text-xs">
                                 {idx === 0 ? 'Facebook Story' : 'Instagram Reels'}
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
                     </TabsContent>
 
                     {/* A/B Testing Tab */}
                     <TabsContent value="copy" className="mt-0">
                       {campaign.copyVariants && <ABTestingCard variants={campaign.copyVariants} />}
                     </TabsContent>
 
                     {/* Posts Tab */}
                     <TabsContent value="posts" className="mt-0">
                       <div className="space-y-4">
                         {campaign.posts?.map((post, idx) => (
                           <div key={idx} className="p-6 rounded-2xl bg-card border border-border shadow-lg hover:shadow-xl transition-shadow">
                             <div className="flex items-center justify-between mb-5">
                               <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-foreground font-bold text-lg">
                                   {idx + 1}
                                 </div>
                                 <div>
                                   <h3 className="font-semibold text-foreground text-lg">Post {idx + 1}</h3>
                                   {post.hook && <p className="text-sm text-muted-foreground">Hook: {post.hook}</p>}
                                 </div>
                               </div>
                               <div className="flex gap-2">
                                 <Badge className="bg-primary/10 text-primary border-primary/30">{post.type}</Badge>
                                 {post.platform && <Badge className="bg-muted text-muted-foreground">{post.platform}</Badge>}
                               </div>
                             </div>
                             
                             <div className="space-y-4">
                               <div className="grid gap-4 sm:grid-cols-2">
                                 <div className="p-4 rounded-xl bg-muted/30">
                                   <span className="text-muted-foreground text-xs block mb-1">Nagłówek</span>
                                   <p className="text-foreground font-semibold">{post.headline}</p>
                                 </div>
                                 <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                                   <span className="text-muted-foreground text-xs block mb-1">Call to Action</span>
                                   <p className="text-primary font-semibold">{post.cta}</p>
                                 </div>
                               </div>
                               
                               <div className="p-4 rounded-xl bg-muted/30">
                                 <span className="text-muted-foreground text-xs block mb-2">Tekst główny</span>
                                 <p className="text-foreground whitespace-pre-line">{post.primaryText}</p>
                               </div>
                               
                               {post.imageIdea && (
                                 <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                   <span className="text-amber-500 text-xs flex items-center gap-1.5 mb-2">
                                     <ImageIcon className="w-3.5 h-3.5" />
                                     Pomysł na grafikę
                                   </span>
                                   <p className="text-foreground/80">{post.imageIdea}</p>
                                 </div>
                               )}
                               
                               <div className="flex justify-end pt-2">
                                 <Button
                                   variant="outline"
                                   size="sm"
                                   onClick={() => copyToClipboard(`${post.headline}\n\n${post.primaryText}\n\nCTA: ${post.cta}`)}
                                   className="border-primary/30 text-primary hover:bg-primary/10"
                                 >
                                   <Copy className="w-4 h-4 mr-2" />
                                   Kopiuj post
                                 </Button>
                               </div>
                             </div>
                           </div>
                         ))}
                       </div>
                     </TabsContent>
                   </div>
                 </Tabs>
                 
                 {/* Raw content fallback */}
                 {campaign.rawContent && !campaign.strategy && (
                   <div className="p-6 rounded-2xl bg-card border border-border shadow-lg mt-8">
                     <div className="flex items-center justify-between mb-4">
                       <h3 className="font-semibold text-foreground">Wygenerowana treść</h3>
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => copyToClipboard(campaign.rawContent || '')}
                         className="border-primary/30 text-primary hover:bg-primary/10"
                       >
                         <Copy className="w-4 h-4 mr-2" />
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