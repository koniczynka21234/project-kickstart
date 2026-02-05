 import { useState, useEffect } from 'react';
 import { AppLayout } from '@/components/layout/AppLayout';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Textarea } from '@/components/ui/textarea';
 import { Badge } from '@/components/ui/badge';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Progress } from '@/components/ui/progress';
 import { toast } from 'sonner';
 import { supabase } from '@/integrations/supabase/client';
 import {
   Sparkles, Loader2, Target, Users, FileText, Copy, Wand2, CheckCircle2, Lightbulb,
   Calendar, DollarSign, ArrowRight, ArrowLeft, Megaphone, Building2, Settings2,
   Check, FlaskConical, Monitor, Smartphone, TrendingUp, Heart, Snowflake, Sun, Play,
   ChevronRight, BarChart3, RefreshCw, Zap, Image as ImageIcon, MousePointerClick
 } from 'lucide-react';
 import { cn } from '@/lib/utils';
 import { FacebookAdMockup } from '@/components/campaign/FacebookAdMockup';
 import { InstagramAdMockup } from '@/components/campaign/InstagramAdMockup';
 import { AdsManagerMockup } from '@/components/campaign/AdsManagerMockup';
 import { CampaignStrategyCard } from '@/components/campaign/CampaignStrategyCard';
 import { ABTestingCard } from '@/components/campaign/ABTestingCard';
 
 // Helper to safely render unknown values
 const renderValue = (value: unknown): string => {
   if (value === null || value === undefined) return '';
   if (typeof value === 'string') return value;
   if (typeof value === 'number' || typeof value === 'boolean') return String(value);
   if (typeof value === 'object') {
     try {
       return Object.entries(value as Record<string, unknown>)
         .map(([key, val]) => `${key}: ${typeof val === 'object' ? JSON.stringify(val) : val}`)
         .join(', ');
     } catch { return JSON.stringify(value); }
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
   { id: 'leads', label: 'Generowanie leadów', icon: Users, desc: 'Pozyskaj kontakty' },
   { id: 'bookings', label: 'Rezerwacje online', icon: Calendar, desc: 'Więcej rezerwacji' },
   { id: 'awareness', label: 'Świadomość marki', icon: Megaphone, desc: 'Dotarcie' },
   { id: 'traffic', label: 'Ruch na stronie', icon: TrendingUp, desc: 'Zwiększ ruch' },
   { id: 'messages', label: 'Wiadomości', icon: FileText, desc: 'Kontakt przez Messenger' },
 ];
 
 const industries = ['Fryzjerstwo', 'Kosmetyka', 'Paznokcie', 'Spa & Wellness', 'Barber', 'Makijaż', 'Brwi i rzęsy'];
 
 const seasonOptions = [
   { value: 'walentynki', label: 'Walentynki', icon: Heart },
   { value: 'wiosna', label: 'Wiosna', icon: Sun },
   { value: 'lato', label: 'Lato', icon: Sun },
   { value: 'zima', label: 'Święta', icon: Snowflake },
   { value: 'sylwester', label: 'Sylwester', icon: Sparkles },
   { value: 'brak', label: 'Brak okazji', icon: Calendar },
 ];
 
 // Wizard steps
 const STEPS = [
   { id: 1, title: 'Klient', icon: Building2 },
   { id: 2, title: 'Cel', icon: Target },
   { id: 3, title: 'Szczegóły', icon: Settings2 },
   { id: 4, title: 'Generowanie', icon: Wand2 },
   { id: 5, title: 'Wyniki', icon: CheckCircle2 },
 ];
 
 // Result tabs with short PL names
 const RESULT_TABS = [
   { id: 'strategia', label: 'Strategia', icon: Target },
   { id: 'ustawienia', label: 'Ustawienia', icon: Settings2 },
   { id: 'kreacje', label: 'Kreacje', icon: ImageIcon },
   { id: 'copy', label: 'Copy', icon: FlaskConical },
 ];
 
 export default function CampaignGenerator() {
   const [clients, setClients] = useState<Client[]>([]);
   const [selectedClient, setSelectedClient] = useState<string>('');
   const [loading, setLoading] = useState(false);
   const [campaign, setCampaign] = useState<CampaignData | null>(null);
   const [loadingProgress, setLoadingProgress] = useState(0);
   const [currentStep, setCurrentStep] = useState(1);
   const [activeResultTab, setActiveResultTab] = useState('strategia');
   
   const [formData, setFormData] = useState({
     clientName: '', industry: '', city: '', budget: '', objective: '', targetAudience: '',
     services: '', seasonality: '', promotions: '', competitors: '', usp: '', priceRange: '',
     existingFollowers: '', previousCampaigns: '',
   });
 
   useEffect(() => {
     fetchClients();
   }, []);
 
   useEffect(() => {
     if (loading) {
       const interval = setInterval(() => {
         setLoadingProgress(prev => prev >= 95 ? prev : prev + Math.random() * 12);
       }, 400);
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
     if (!formData.clientName || !formData.industry || !formData.objective) {
       toast.error('Uzupełnij wszystkie wymagane pola');
       return;
     }
     setLoading(true);
     setCampaign(null);
     setCurrentStep(4);
 
     try {
       const { data, error } = await supabase.functions.invoke('generate-campaign', { body: formData });
       if (error) {
         toast.error(`Błąd: ${error.message}`);
         setCurrentStep(3);
         return;
       }
       if (data?.error) {
         toast.error(data.error);
         setCurrentStep(3);
         return;
       }
       if (data?.campaign) {
         setCampaign(data.campaign);
         setCurrentStep(5);
         toast.success('Kampania wygenerowana!');
       }
     } catch (err: any) {
       toast.error(err.message || 'Błąd generowania');
       setCurrentStep(3);
     } finally {
       setLoading(false);
     }
   };
 
   const copyToClipboard = (text: string) => {
     navigator.clipboard.writeText(text);
     toast.success('Skopiowano');
   };
 
   const resetGenerator = () => {
     setCampaign(null);
     setFormData({
       clientName: '', industry: '', city: '', budget: '', objective: '', targetAudience: '',
       services: '', seasonality: '', promotions: '', competitors: '', usp: '', priceRange: '',
       existingFollowers: '', previousCampaigns: '',
     });
     setSelectedClient('');
     setCurrentStep(1);
   };
 
   const nextStep = () => {
     if (currentStep === 1 && (!formData.clientName || !formData.industry)) {
       toast.error('Podaj nazwę klienta i branżę');
       return;
     }
     if (currentStep === 2 && !formData.objective) {
       toast.error('Wybierz cel kampanii');
       return;
     }
     if (currentStep === 3) {
       generateCampaign();
       return;
     }
     setCurrentStep(prev => Math.min(prev + 1, 5));
   };
 
   const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));
 
   const canProceed = () => {
     if (currentStep === 1) return !!(formData.clientName && formData.industry);
     if (currentStep === 2) return !!formData.objective;
     if (currentStep === 3) return true;
     return false;
   };
 
   return (
     <AppLayout>
       <div className="min-h-screen bg-background">
         {/* WIZARD HEADER with Stepper */}
         <div className="border-b border-border/40 bg-gradient-to-b from-card to-background sticky top-0 z-20">
           <div className="max-w-5xl mx-auto px-4 py-6">
             {/* Title */}
             <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-4">
                 <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
                   <Megaphone className="w-7 h-7 text-primary-foreground" />
                 </div>
                 <div>
                   <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                     Generator Kampanii
                     <Badge className="bg-primary/20 text-primary border-primary/30 font-medium">AI</Badge>
                   </h1>
                   <p className="text-muted-foreground text-sm mt-0.5">Profesjonalne kampanie Meta Ads w 3 krokach</p>
                 </div>
               </div>
               {currentStep === 5 && (
                 <Button onClick={resetGenerator} variant="outline" className="gap-2">
                   <RefreshCw className="w-4 h-4" /> Nowa kampania
                 </Button>
               )}
             </div>
 
             {/* Stepper */}
             <div className="flex items-center justify-between relative">
               {/* Progress line */}
               <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-border/50 rounded-full -z-10" />
               <div 
                 className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500 -z-10"
                 style={{ width: `${((Math.min(currentStep, 5) - 1) / 4) * 100}%` }}
               />
               
               {STEPS.map((step) => {
                 const Icon = step.icon;
                 const isActive = currentStep === step.id;
                 const isCompleted = currentStep > step.id;
                 const isClickable = step.id < currentStep && currentStep !== 4;
                 
                 return (
                   <button
                     key={step.id}
                     onClick={() => isClickable && setCurrentStep(step.id)}
                     disabled={!isClickable}
                     className={cn(
                       "flex flex-col items-center gap-2 transition-all duration-300",
                       isClickable && "cursor-pointer hover:scale-105",
                       !isClickable && "cursor-default"
                     )}
                   >
                     <div className={cn(
                       "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 border-2",
                       isCompleted && "bg-primary border-primary shadow-lg shadow-primary/30",
                       isActive && "bg-gradient-to-br from-primary to-accent border-primary shadow-xl shadow-primary/40 scale-110",
                       !isActive && !isCompleted && "bg-card border-border/50"
                     )}>
                       {isCompleted ? (
                         <Check className="w-6 h-6 text-primary-foreground" />
                       ) : (
                         <Icon className={cn(
                           "w-6 h-6 transition-colors",
                           isActive ? "text-primary-foreground" : "text-muted-foreground"
                         )} />
                       )}
                     </div>
                     <span className={cn(
                       "text-xs font-medium transition-colors",
                       isActive || isCompleted ? "text-foreground" : "text-muted-foreground"
                     )}>
                       {step.title}
                     </span>
                   </button>
                 );
               })}
             </div>
           </div>
         </div>
 
         {/* STEP CONTENT */}
         <div className="max-w-4xl mx-auto px-4 py-8">
           
           {/* STEP 1: Client */}
           {currentStep === 1 && (
             <div className="animate-fade-in space-y-8">
               <div className="text-center mb-8">
                 <h2 className="text-3xl font-bold text-foreground mb-2">Wybierz klienta</h2>
                 <p className="text-muted-foreground">Wybierz z bazy lub wpisz dane ręcznie</p>
               </div>
 
               <Card className="border-border/50 bg-gradient-to-br from-card via-card to-primary/5">
                 <CardContent className="p-8 space-y-6">
                   {/* Client select */}
                   <div>
                     <label className="text-sm font-medium text-foreground mb-3 block">Klient z bazy</label>
                     <Select value={selectedClient} onValueChange={handleClientSelect}>
                       <SelectTrigger className="h-14 bg-secondary/50 border-border/50 text-base">
                         <SelectValue placeholder="Wybierz klienta..." />
                       </SelectTrigger>
                       <SelectContent>
                         {clients.map(client => (
                           <SelectItem key={client.id} value={client.id}>
                             <div className="flex items-center gap-3">
                               <Building2 className="w-4 h-4 text-primary" />
                               <span className="font-medium">{client.salon_name}</span>
                               {client.city && <span className="text-muted-foreground">• {client.city}</span>}
                             </div>
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
 
                   <div className="relative py-4">
                     <div className="absolute inset-0 flex items-center">
                       <span className="w-full border-t border-border/50" />
                     </div>
                     <div className="relative flex justify-center">
                       <span className="bg-card px-4 text-muted-foreground text-sm">lub wpisz ręcznie</span>
                     </div>
                   </div>
 
                   <div className="grid gap-6 md:grid-cols-2">
                     <div>
                       <label className="text-sm font-medium text-foreground mb-2 block">Nazwa salonu *</label>
                       <Input
                         value={formData.clientName}
                         onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                         placeholder="np. Salon Urody Anna"
                         className="h-12 bg-secondary/50 border-border/50"
                       />
                     </div>
                     <div>
                       <label className="text-sm font-medium text-foreground mb-2 block">Branża *</label>
                       <Select value={formData.industry} onValueChange={(v) => setFormData(prev => ({ ...prev, industry: v }))}>
                         <SelectTrigger className="h-12 bg-secondary/50 border-border/50">
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
                       <label className="text-sm font-medium text-foreground mb-2 block">Miasto</label>
                       <Input
                         value={formData.city}
                         onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                         placeholder="np. Warszawa"
                         className="h-12 bg-secondary/50 border-border/50"
                       />
                     </div>
                     <div>
                       <label className="text-sm font-medium text-foreground mb-2 block">Budżet miesięczny (PLN)</label>
                       <Input
                         type="number"
                         value={formData.budget}
                         onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                         placeholder="np. 3000"
                         className="h-12 bg-secondary/50 border-border/50"
                       />
                     </div>
                   </div>
 
                   {selectedClient && (
                     <div className="flex items-center gap-3 p-4 rounded-xl bg-success/10 border border-success/20">
                       <CheckCircle2 className="w-5 h-5 text-success" />
                       <span className="text-success font-medium">Dane klienta załadowane z bazy</span>
                     </div>
                   )}
                 </CardContent>
               </Card>
 
               {/* Navigation */}
               <div className="flex justify-end pt-4">
                 <Button 
                   onClick={nextStep} 
                   disabled={!canProceed()} 
                   size="lg"
                   className="bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/25 gap-2 px-8"
                 >
                   Dalej <ArrowRight className="w-5 h-5" />
                 </Button>
               </div>
             </div>
           )}
 
           {/* STEP 2: Objective */}
           {currentStep === 2 && (
             <div className="animate-fade-in space-y-8">
               <div className="text-center mb-8">
                 <h2 className="text-3xl font-bold text-foreground mb-2">Wybierz cel kampanii</h2>
                 <p className="text-muted-foreground">Co chcesz osiągnąć dla {formData.clientName}?</p>
               </div>
 
               <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                 {objectives.map((obj) => {
                   const Icon = obj.icon;
                   const isSelected = formData.objective === obj.label;
                   
                   return (
                     <button
                       key={obj.id}
                       onClick={() => setFormData(prev => ({ ...prev, objective: obj.label }))}
                       className={cn(
                         "group relative p-6 rounded-2xl border-2 transition-all duration-300 text-left overflow-hidden",
                         isSelected
                           ? "border-primary bg-gradient-to-br from-primary/20 via-primary/10 to-transparent shadow-xl shadow-primary/20"
                           : "border-border/50 bg-card hover:border-primary/50 hover:shadow-lg"
                       )}
                     >
                       {isSelected && (
                         <div className="absolute top-3 right-3">
                           <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                             <Check className="w-4 h-4 text-primary-foreground" />
                           </div>
                         </div>
                       )}
                       <div className={cn(
                         "w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all",
                         isSelected 
                           ? "bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30" 
                           : "bg-muted group-hover:bg-primary/10"
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
                       <p className="text-sm text-muted-foreground">{obj.desc}</p>
                     </button>
                   );
                 })}
               </div>
 
               {/* Navigation */}
               <div className="flex justify-between pt-4">
                 <Button onClick={prevStep} variant="outline" size="lg" className="gap-2">
                   <ArrowLeft className="w-5 h-5" /> Wstecz
                 </Button>
                 <Button 
                   onClick={nextStep} 
                   disabled={!canProceed()} 
                   size="lg"
                   className="bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/25 gap-2 px-8"
                 >
                   Dalej <ArrowRight className="w-5 h-5" />
                 </Button>
               </div>
             </div>
           )}
 
           {/* STEP 3: Details */}
           {currentStep === 3 && (
             <div className="animate-fade-in space-y-8">
               <div className="text-center mb-8">
                 <h2 className="text-3xl font-bold text-foreground mb-2">Szczegóły kampanii</h2>
                 <p className="text-muted-foreground">Dodaj więcej kontekstu dla lepszych wyników</p>
               </div>
 
               <div className="grid gap-6 lg:grid-cols-2">
                 {/* Seasonality */}
                 <Card className="border-border/50">
                   <CardHeader className="pb-4">
                     <CardTitle className="text-base flex items-center gap-2">
                       <Calendar className="w-5 h-5 text-primary" />
                       Sezonowość / Okazja
                     </CardTitle>
                   </CardHeader>
                   <CardContent>
                     <div className="grid grid-cols-3 gap-2">
                       {seasonOptions.map(option => {
                         const Icon = option.icon;
                         const isSelected = formData.seasonality === option.value;
                         return (
                           <button
                             key={option.value}
                             onClick={() => setFormData(prev => ({ ...prev, seasonality: option.value }))}
                             className={cn(
                               "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                               isSelected
                                 ? "border-primary bg-primary/10"
                                 : "border-border/50 bg-secondary/30 hover:border-primary/30"
                             )}
                           >
                             <Icon className={cn("w-5 h-5", isSelected ? "text-primary" : "text-muted-foreground")} />
                             <span className={cn("text-xs font-medium", isSelected ? "text-foreground" : "text-muted-foreground")}>
                               {option.label}
                             </span>
                           </button>
                         );
                       })}
                     </div>
                   </CardContent>
                 </Card>
 
                 {/* Services */}
                 <Card className="border-border/50">
                   <CardHeader className="pb-4">
                     <CardTitle className="text-base flex items-center gap-2">
                       <Sparkles className="w-5 h-5 text-primary" />
                       Promowane usługi
                     </CardTitle>
                   </CardHeader>
                   <CardContent>
                     <Textarea
                       value={formData.services}
                       onChange={(e) => setFormData(prev => ({ ...prev, services: e.target.value }))}
                       placeholder="np. Manicure hybrydowy, pedicure, przedłużanie paznokci..."
                       className="bg-secondary/50 border-border/50 resize-none min-h-[120px]"
                     />
                   </CardContent>
                 </Card>
 
                 {/* USP */}
                 <Card className="border-border/50">
                   <CardHeader className="pb-4">
                     <CardTitle className="text-base flex items-center gap-2">
                       <Zap className="w-5 h-5 text-primary" />
                       Co wyróżnia salon? (USP)
                     </CardTitle>
                   </CardHeader>
                   <CardContent>
                     <Textarea
                       value={formData.usp}
                       onChange={(e) => setFormData(prev => ({ ...prev, usp: e.target.value }))}
                       placeholder="np. 10 lat doświadczenia, certyfikowane produkty, darmowy parking..."
                       className="bg-secondary/50 border-border/50 resize-none min-h-[120px]"
                     />
                   </CardContent>
                 </Card>
 
                 {/* Promotions */}
                 <Card className="border-border/50">
                   <CardHeader className="pb-4">
                     <CardTitle className="text-base flex items-center gap-2">
                       <DollarSign className="w-5 h-5 text-primary" />
                       Aktualne promocje
                     </CardTitle>
                   </CardHeader>
                   <CardContent>
                     <Textarea
                       value={formData.promotions}
                       onChange={(e) => setFormData(prev => ({ ...prev, promotions: e.target.value }))}
                       placeholder="np. -20% na pierwszą wizytę, pakiety dla par..."
                       className="bg-secondary/50 border-border/50 resize-none min-h-[120px]"
                     />
                   </CardContent>
                 </Card>
               </div>
 
               {/* Extra info row */}
               <Card className="border-border/50">
                 <CardHeader className="pb-4">
                   <CardTitle className="text-base flex items-center gap-2">
                     <Settings2 className="w-5 h-5 text-primary" />
                     Dodatkowe informacje
                     <Badge variant="outline" className="ml-2 text-xs">opcjonalne</Badge>
                   </CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                     <div>
                       <label className="text-xs text-muted-foreground mb-1.5 block">Przedział cenowy</label>
                       <Input
                         value={formData.priceRange}
                         onChange={(e) => setFormData(prev => ({ ...prev, priceRange: e.target.value }))}
                         placeholder="np. 80-250 PLN"
                         className="h-10 bg-secondary/50 border-border/50"
                       />
                     </div>
                     <div>
                       <label className="text-xs text-muted-foreground mb-1.5 block">Obserwatorzy</label>
                       <Input
                         value={formData.existingFollowers}
                         onChange={(e) => setFormData(prev => ({ ...prev, existingFollowers: e.target.value }))}
                         placeholder="np. 2500"
                         className="h-10 bg-secondary/50 border-border/50"
                       />
                     </div>
                     <div className="sm:col-span-2">
                       <label className="text-xs text-muted-foreground mb-1.5 block">Konkurencja</label>
                       <Input
                         value={formData.competitors}
                         onChange={(e) => setFormData(prev => ({ ...prev, competitors: e.target.value }))}
                         placeholder="np. Salon XYZ, Studio ABC"
                         className="h-10 bg-secondary/50 border-border/50"
                       />
                     </div>
                   </div>
                 </CardContent>
               </Card>
 
               {/* Navigation */}
               <div className="flex justify-between pt-4">
                 <Button onClick={prevStep} variant="outline" size="lg" className="gap-2">
                   <ArrowLeft className="w-5 h-5" /> Wstecz
                 </Button>
                 <Button 
                   onClick={nextStep}
                   size="lg"
                   className="bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/25 gap-3 px-8"
                 >
                   <Wand2 className="w-5 h-5" />
                   Generuj kampanię
                   <Sparkles className="w-4 h-4" />
                 </Button>
               </div>
             </div>
           )}
 
           {/* STEP 4: Generating (Loading) */}
           {currentStep === 4 && (
             <div className="animate-fade-in flex flex-col items-center justify-center py-20">
               <div className="relative mb-10">
                 <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-primary via-accent to-primary flex items-center justify-center shadow-2xl shadow-primary/40">
                   <Wand2 className="w-14 h-14 text-primary-foreground animate-pulse" />
                 </div>
                 <div className="absolute inset-0 rounded-3xl bg-primary/20 animate-ping" style={{ animationDuration: '2s' }} />
               </div>
               
               <h2 className="text-2xl font-bold text-foreground mb-2">AI tworzy kampanię...</h2>
               <p className="text-muted-foreground mb-8">Analizuję dane i przygotowuję strategię dla {formData.clientName}</p>
               
               <div className="w-80 mb-8">
                 <Progress value={loadingProgress} className="h-3" />
                 <p className="text-center text-sm text-muted-foreground mt-2">{Math.round(loadingProgress)}%</p>
               </div>
               
               <div className="space-y-3 text-center">
                 {['Analiza profilu klienta', 'Budowanie strategii lejka', 'Tworzenie zestawów reklam', 'Generowanie tekstów A/B'].map((text, i) => (
                   <div 
                     key={i} 
                     className={cn(
                       "flex items-center justify-center gap-3 text-sm transition-all",
                       loadingProgress > i * 25 ? "text-foreground" : "text-muted-foreground/50"
                     )}
                   >
                     {loadingProgress > (i + 1) * 25 ? (
                       <CheckCircle2 className="w-5 h-5 text-success" />
                     ) : loadingProgress > i * 25 ? (
                       <Loader2 className="w-5 h-5 animate-spin text-primary" />
                     ) : (
                       <div className="w-5 h-5 rounded-full border-2 border-muted" />
                     )}
                     {text}
                   </div>
                 ))}
               </div>
             </div>
           )}
 
           {/* STEP 5: Results */}
           {currentStep === 5 && campaign && (
             <div className="animate-fade-in space-y-6">
               {/* Success banner */}
               <div className="p-6 rounded-2xl bg-gradient-to-r from-success/20 via-success/10 to-transparent border border-success/30">
                 <div className="flex items-center gap-4">
                   <div className="w-14 h-14 rounded-2xl bg-success/20 flex items-center justify-center">
                     <CheckCircle2 className="w-7 h-7 text-success" />
                   </div>
                   <div className="flex-1">
                     <h2 className="text-xl font-bold text-foreground">Kampania wygenerowana!</h2>
                     <p className="text-muted-foreground">{formData.clientName} • {formData.objective}</p>
                   </div>
                   {campaign.strategy?.total_budget && (
                     <Badge className="bg-primary/20 text-primary border-primary/30 text-sm py-1.5 px-3">
                       <DollarSign className="w-4 h-4 mr-1" />
                       {campaign.strategy.total_budget}
                     </Badge>
                   )}
                 </div>
               </div>
 
               {/* Result Tabs */}
               <div className="flex gap-2 border-b border-border/50 pb-0">
                 {RESULT_TABS.map(tab => {
                   const Icon = tab.icon;
                   const isActive = activeResultTab === tab.id;
                   return (
                     <button
                       key={tab.id}
                       onClick={() => setActiveResultTab(tab.id)}
                       className={cn(
                         "flex items-center gap-2 px-5 py-3 font-medium text-sm transition-all border-b-2 -mb-[2px]",
                         isActive
                           ? "border-primary text-primary"
                           : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                       )}
                     >
                       <Icon className="w-4 h-4" />
                       {tab.label}
                     </button>
                   );
                 })}
               </div>
 
               {/* Tab Content */}
               <div className="min-h-[400px]">
                 
                 {/* Strategia */}
                 {activeResultTab === 'strategia' && (
                   <div className="space-y-6 animate-fade-in">
                     {campaign.strategy && (
                       <CampaignStrategyCard strategy={campaign.strategy} clientName={formData.clientName} />
                     )}
                     {campaign.recommendations && campaign.recommendations.length > 0 && (
                       <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                         <CardHeader className="pb-3">
                           <CardTitle className="flex items-center gap-2 text-base">
                             <Lightbulb className="w-5 h-5 text-primary" />
                             Rekomendacje AI
                           </CardTitle>
                         </CardHeader>
                         <CardContent>
                           <ul className="space-y-2">
                             {campaign.recommendations.map((rec, idx) => (
                               <li key={idx} className="flex items-start gap-3">
                                 <CheckCircle2 className="w-5 h-5 text-success mt-0.5 shrink-0" />
                                 <span className="text-foreground/80">{rec}</span>
                               </li>
                             ))}
                           </ul>
                         </CardContent>
                       </Card>
                     )}
                   </div>
                 )}
 
                 {/* Ustawienia (Ads Manager) */}
                 {activeResultTab === 'ustawienia' && (
                   <div className="space-y-6 animate-fade-in">
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
                       <Card className="border-border/50">
                         <CardHeader className="pb-3">
                           <CardTitle className="flex items-center gap-2 text-base">
                             <Settings2 className="w-5 h-5 text-primary" />
                             Szczegółowe ustawienia
                           </CardTitle>
                         </CardHeader>
                         <CardContent>
                           <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                             {Object.entries(campaign.adsManagerSettings).map(([key, value]) => (
                               <div key={key} className="p-4 rounded-xl bg-secondary/50 border border-border/50">
                                 <span className="text-muted-foreground text-xs capitalize block mb-1">
                                   {key.replace(/([A-Z])/g, ' $1').trim()}
                                 </span>
                                 <p className="text-foreground font-medium">{renderValue(value)}</p>
                               </div>
                             ))}
                           </div>
                         </CardContent>
                       </Card>
                     )}
                   </div>
                 )}
 
                 {/* Kreacje (Mockups) */}
                 {activeResultTab === 'kreacje' && (
                   <div className="space-y-6 animate-fade-in">
                     <div className="grid gap-6 lg:grid-cols-2">
                       {campaign.posts?.slice(0, 4).map((post, idx) => (
                         <Card key={idx} className="border-border/50 overflow-hidden">
                           <CardHeader className="pb-3 border-b border-border/30">
                             <div className="flex items-center justify-between">
                               <Badge variant="outline" className="text-xs">
                                 {post.platform || 'Facebook'} • {post.type}
                               </Badge>
                               <Button 
                                 variant="ghost" 
                                 size="sm"
                                 onClick={() => copyToClipboard(post.primaryText)}
                                 className="h-8 gap-1.5 text-xs"
                               >
                                 <Copy className="w-3 h-3" /> Kopiuj tekst
                               </Button>
                             </div>
                           </CardHeader>
                           <CardContent className="p-4">
                             {idx % 2 === 0 ? (
                               <FacebookAdMockup
                                 salonName={formData.clientName}
                                 headline={post.headline}
                                 primaryText={post.primaryText}
                                 cta={post.cta}
                                 description={post.description}
                                 imageIdea={post.imageIdea}
                                 variant={idx === 0 ? 'feed' : 'story'}
                               />
                             ) : (
                               <InstagramAdMockup
                                 salonName={formData.clientName}
                                headline={post.headline}
                                 primaryText={post.primaryText}
                                 cta={post.cta}
                                 imageIdea={post.imageIdea}
                                 variant={idx === 1 ? 'feed' : 'reels'}
                               />
                             )}
                           </CardContent>
                         </Card>
                       ))}
                     </div>
                   </div>
                 )}
 
                 {/* Copy (A/B Tests) */}
                 {activeResultTab === 'copy' && (
                   <div className="animate-fade-in">
                     {campaign.copyVariants && campaign.copyVariants.length > 0 ? (
                       <ABTestingCard variants={campaign.copyVariants} />
                     ) : (
                       <div className="text-center py-12 text-muted-foreground">
                         <FlaskConical className="w-12 h-12 mx-auto mb-4 opacity-50" />
                         <p>Brak wariantów do testów A/B</p>
                       </div>
                     )}
                   </div>
                 )}
               </div>
             </div>
           )}
         </div>
       </div>
     </AppLayout>
   );
 }