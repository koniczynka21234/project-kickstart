 import { useState, useEffect } from 'react';
 import { AppLayout } from '@/components/layout/AppLayout';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Textarea } from '@/components/ui/textarea';
 import { Badge } from '@/components/ui/badge';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
   Layers,
   Eye,
   MousePointerClick,
   BarChart3,
   RefreshCw,
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
   'Fryzjerstwo', 'Kosmetyka', 'Paznokcie', 'Spa & Wellness', 'Barber', 'Makijaż', 'Brwi i rzęsy',
 ];
 
 const seasonOptions = [
   { value: 'walentynki', label: 'Walentynki', icon: Heart },
   { value: 'wiosna', label: 'Wiosna', icon: Sun },
   { value: 'lato', label: 'Lato', icon: Sun },
   { value: 'zima', label: 'Święta', icon: Snowflake },
   { value: 'sylwester', label: 'Sylwester', icon: Sparkles },
   { value: 'brak', label: 'Brak okazji', icon: Calendar },
 ];
 
 export default function CampaignGenerator() {
   const [clients, setClients] = useState<Client[]>([]);
   const [selectedClient, setSelectedClient] = useState<string>('');
   const [loading, setLoading] = useState(false);
   const [campaign, setCampaign] = useState<CampaignData | null>(null);
   const [loadingProgress, setLoadingProgress] = useState(0);
   const [activeResultTab, setActiveResultTab] = useState('strategy');
   
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
     if (!formData.objective) {
       toast.error('Wybierz cel kampanii');
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
 
   const resetGenerator = () => {
     setCampaign(null);
     setFormData({
       clientName: '', industry: '', city: '', budget: '', objective: '', targetAudience: '',
       services: '', seasonality: '', promotions: '', competitors: '', usp: '', priceRange: '',
       existingFollowers: '', previousCampaigns: '',
     });
     setSelectedClient('');
   };
 
   const canGenerate = formData.clientName && formData.industry && formData.objective;
 
   // Result tabs configuration
   const resultTabs = [
     { id: 'strategy', label: 'Strategia', icon: Target, color: 'text-primary' },
     { id: 'adsmanager', label: 'Ads Manager', icon: Monitor, color: 'text-blue-400' },
     { id: 'mockups', label: 'Mockupy', icon: Smartphone, color: 'text-purple-400' },
     { id: 'copy', label: 'A/B Testy', icon: FlaskConical, color: 'text-amber-400' },
     { id: 'posts', label: 'Posty', icon: FileText, color: 'text-emerald-400' },
   ];
 
   return (
     <AppLayout>
       <div className="min-h-screen bg-background">
         {/* Compact Header */}
         <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
           <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                 <Megaphone className="w-5 h-5 text-primary-foreground" />
               </div>
               <div>
                 <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
                   Generator Kampanii
                   <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">AI</Badge>
                 </h1>
                 <p className="text-xs text-muted-foreground">Profesjonalne kampanie Meta Ads</p>
               </div>
             </div>
             
             {campaign && (
               <Button onClick={resetGenerator} variant="outline" size="sm" className="gap-2">
                 <RefreshCw className="w-4 h-4" />
                 Nowa kampania
               </Button>
             )}
           </div>
         </div>
 
         {/* Main Two-Column Layout */}
         <div className="grid lg:grid-cols-12 gap-6 p-4 sm:p-6">
           
           {/* LEFT SIDEBAR - Configuration Panel */}
           <div className="lg:col-span-4 xl:col-span-3 space-y-4">
             
             {/* Client Selection Card */}
             <Card className="border-border/50">
               <CardHeader className="pb-3">
                 <CardTitle className="flex items-center gap-2 text-sm">
                   <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
                     <Building2 className="w-4 h-4 text-primary" />
                   </div>
                   Klient
                 </CardTitle>
               </CardHeader>
               <CardContent className="space-y-3">
                 <Select value={selectedClient} onValueChange={handleClientSelect}>
                   <SelectTrigger className="h-10 bg-secondary/50 border-border/50">
                     <SelectValue placeholder="Wybierz z bazy..." />
                   </SelectTrigger>
                   <SelectContent>
                     {clients.map(client => (
                       <SelectItem key={client.id} value={client.id}>
                         <div className="flex items-center gap-2">
                           <span className="font-medium">{client.salon_name}</span>
                           {client.city && <span className="text-muted-foreground text-xs">• {client.city}</span>}
                         </div>
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
                 
                 <div className="relative">
                   <div className="absolute inset-0 flex items-center">
                     <span className="w-full border-t border-border/50" />
                   </div>
                   <div className="relative flex justify-center text-xs">
                     <span className="bg-card px-2 text-muted-foreground">lub ręcznie</span>
                   </div>
                 </div>
                 
                 <Input
                   value={formData.clientName}
                   onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                   placeholder="Nazwa salonu"
                   className="h-10 bg-secondary/50 border-border/50"
                 />
                 
                 <div className="grid grid-cols-2 gap-2">
                   <Select value={formData.industry} onValueChange={(v) => setFormData(prev => ({ ...prev, industry: v }))}>
                     <SelectTrigger className="h-9 bg-secondary/50 border-border/50 text-xs">
                       <SelectValue placeholder="Branża" />
                     </SelectTrigger>
                     <SelectContent>
                       {industries.map(ind => (
                         <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                   <Input
                     value={formData.city}
                     onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                     placeholder="Miasto"
                     className="h-9 bg-secondary/50 border-border/50 text-sm"
                   />
                 </div>
                 
                 <div className="relative">
                   <Input
                     type="number"
                     value={formData.budget}
                     onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                     placeholder="Budżet"
                     className="h-9 bg-secondary/50 border-border/50 pr-12 text-sm"
                   />
                   <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">PLN</span>
                 </div>
                 
                 {selectedClient && (
                   <div className="flex items-center gap-2 p-2 rounded-lg bg-success/10 border border-success/20">
                     <CheckCircle2 className="w-4 h-4 text-success" />
                     <span className="text-success text-xs font-medium">Dane załadowane</span>
                   </div>
                 )}
               </CardContent>
             </Card>
 
             {/* Objective Card */}
             <Card className="border-border/50">
               <CardHeader className="pb-3">
                 <CardTitle className="flex items-center gap-2 text-sm">
                   <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
                     <Target className="w-4 h-4 text-amber-400" />
                   </div>
                   Cel kampanii
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="grid grid-cols-1 gap-2">
                   {objectives.map((obj) => {
                     const Icon = obj.icon;
                     const isSelected = formData.objective === obj.label;
                     
                     return (
                       <button
                         key={obj.id}
                         onClick={() => setFormData(prev => ({ ...prev, objective: obj.label }))}
                         className={cn(
                           "flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                           isSelected
                             ? "border-primary bg-primary/10"
                             : "border-border/50 bg-secondary/30 hover:border-primary/30 hover:bg-secondary/50"
                         )}
                       >
                         <div className={cn(
                           "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                           isSelected ? "bg-primary" : "bg-muted"
                         )}>
                           <Icon className={cn("w-4 h-4", isSelected ? "text-primary-foreground" : "text-muted-foreground")} />
                         </div>
                         <div className="min-w-0">
                           <p className={cn("font-medium text-sm truncate", isSelected ? "text-foreground" : "text-foreground/80")}>
                             {obj.label}
                           </p>
                           <p className="text-xs text-muted-foreground truncate">{obj.description}</p>
                         </div>
                         {isSelected && <Check className="w-4 h-4 text-primary shrink-0 ml-auto" />}
                       </button>
                     );
                   })}
                 </div>
               </CardContent>
             </Card>
 
             {/* Season/Occasion Card */}
             <Card className="border-border/50">
               <CardHeader className="pb-3">
                 <CardTitle className="flex items-center gap-2 text-sm">
                   <div className="w-7 h-7 rounded-lg bg-purple-500/15 flex items-center justify-center">
                     <Calendar className="w-4 h-4 text-purple-400" />
                   </div>
                   Sezonowość
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
                           "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all",
                           isSelected
                             ? "border-primary bg-primary/10"
                             : "border-border/50 bg-secondary/30 hover:border-primary/30"
                         )}
                       >
                         <Icon className={cn("w-4 h-4", isSelected ? "text-primary" : "text-muted-foreground")} />
                         <span className={cn("text-xs font-medium", isSelected ? "text-foreground" : "text-muted-foreground")}>
                           {option.label}
                         </span>
                       </button>
                     );
                   })}
                 </div>
               </CardContent>
             </Card>
 
             {/* Additional Details Card */}
             <Card className="border-border/50">
               <CardHeader className="pb-3">
                 <CardTitle className="flex items-center gap-2 text-sm">
                   <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                     <Settings2 className="w-4 h-4 text-emerald-400" />
                   </div>
                   Dodatkowe info
                   <Badge variant="outline" className="ml-auto text-[10px]">opcjonalne</Badge>
                 </CardTitle>
               </CardHeader>
               <CardContent className="space-y-3">
                 <Textarea
                   value={formData.services}
                   onChange={(e) => setFormData(prev => ({ ...prev, services: e.target.value }))}
                   placeholder="Promowane usługi (np. manicure, pedicure...)"
                   className="bg-secondary/50 border-border/50 resize-none min-h-[60px] text-sm"
                 />
                 <Textarea
                   value={formData.promotions}
                   onChange={(e) => setFormData(prev => ({ ...prev, promotions: e.target.value }))}
                   placeholder="Aktualne promocje"
                   className="bg-secondary/50 border-border/50 resize-none min-h-[60px] text-sm"
                 />
                 <Textarea
                   value={formData.usp}
                   onChange={(e) => setFormData(prev => ({ ...prev, usp: e.target.value }))}
                   placeholder="Co wyróżnia salon? (USP)"
                   className="bg-secondary/50 border-border/50 resize-none min-h-[60px] text-sm"
                 />
                 <div className="grid grid-cols-2 gap-2">
                   <Input
                     value={formData.priceRange}
                     onChange={(e) => setFormData(prev => ({ ...prev, priceRange: e.target.value }))}
                     placeholder="Ceny (80-250 PLN)"
                     className="h-9 bg-secondary/50 border-border/50 text-sm"
                   />
                   <Input
                     value={formData.existingFollowers}
                     onChange={(e) => setFormData(prev => ({ ...prev, existingFollowers: e.target.value }))}
                     placeholder="Followers"
                     className="h-9 bg-secondary/50 border-border/50 text-sm"
                   />
                 </div>
               </CardContent>
             </Card>
 
             {/* Generate Button */}
             <Button
               onClick={generateCampaign}
               disabled={!canGenerate || loading}
               className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/25 font-semibold"
             >
               {loading ? (
                 <>
                   <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                   Generuję... {Math.round(loadingProgress)}%
                 </>
               ) : (
                 <>
                   <Wand2 className="w-5 h-5 mr-2" />
                   Generuj kampanię AI
                   <Sparkles className="w-4 h-4 ml-2" />
                 </>
               )}
             </Button>
           </div>
 
           {/* RIGHT SIDE - Results / Preview Area */}
           <div className="lg:col-span-8 xl:col-span-9">
             
             {/* Empty State - Before Generation */}
             {!campaign && !loading && (
               <Card className="border-border/50 border-dashed h-full min-h-[600px] flex flex-col items-center justify-center">
                 <div className="text-center max-w-md">
                   <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-6">
                     <Megaphone className="w-10 h-10 text-primary/60" />
                   </div>
                   <h3 className="text-xl font-bold text-foreground mb-2">Gotowy na kampanię?</h3>
                   <p className="text-muted-foreground mb-6">
                     Wypełnij dane klienta i cel kampanii po lewej stronie, a AI wygeneruje profesjonalną strategię z mockupami i gotowymi tekstami.
                   </p>
                   <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                     {[
                       { icon: Target, label: 'Strategia lejka' },
                       { icon: Monitor, label: 'Ustawienia Ads' },
                       { icon: Smartphone, label: 'Mockupy reklam' },
                       { icon: FlaskConical, label: 'Testy A/B' },
                     ].map((item, i) => (
                       <div key={i} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-secondary/50 border border-border/50">
                         <item.icon className="w-5 h-5 text-muted-foreground" />
                         <span className="text-xs text-muted-foreground text-center">{item.label}</span>
                       </div>
                     ))}
                   </div>
                 </div>
               </Card>
             )}
 
             {/* Loading State */}
             {loading && (
               <Card className="border-border/50 h-full min-h-[600px] flex flex-col items-center justify-center">
                 <div className="text-center">
                   <div className="relative mb-8">
                     <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary via-accent to-primary flex items-center justify-center shadow-2xl shadow-primary/40">
                       <Wand2 className="w-12 h-12 text-primary-foreground animate-pulse" />
                     </div>
                     <div className="absolute inset-0 rounded-2xl bg-primary/20 animate-ping" style={{ animationDuration: '2s' }} />
                   </div>
                   
                   <h3 className="text-xl font-bold text-foreground mb-2">AI tworzy kampanię...</h3>
                   <p className="text-muted-foreground text-sm mb-6">
                     Analizuję dane i przygotowuję strategię dla {formData.clientName}
                   </p>
                   
                   {/* Progress bar */}
                   <div className="w-64 mx-auto mb-6">
                     <div className="h-2 bg-muted rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                         style={{ width: `${loadingProgress}%` }}
                       />
                     </div>
                   </div>
                   
                   <div className="space-y-2">
                     {[
                       'Analiza profilu klienta',
                       'Budowanie strategii lejka',
                       'Tworzenie zestawów reklam',
                       'Generowanie tekstów A/B',
                     ].map((text, i) => (
                       <div 
                         key={i} 
                         className={cn(
                           "flex items-center justify-center gap-2 text-sm",
                           loadingProgress > i * 25 ? "text-foreground" : "text-muted-foreground"
                         )}
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
               </Card>
             )}
 
             {/* Results Display */}
             {campaign && !loading && (
               <div className="space-y-4">
                 {/* Success Header */}
                 <Card className="border-success/30 bg-gradient-to-r from-success/10 via-success/5 to-transparent">
                   <CardContent className="py-4">
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                           <CheckCircle2 className="w-5 h-5 text-success" />
                         </div>
                         <div>
                           <h3 className="font-semibold text-foreground">Kampania wygenerowana!</h3>
                           <p className="text-sm text-muted-foreground">{formData.clientName} • {formData.objective}</p>
                         </div>
                       </div>
                       <div className="flex gap-2">
                         {campaign.strategy?.total_budget && (
                           <Badge className="bg-primary/20 text-primary border-primary/30">
                             <DollarSign className="w-3 h-3 mr-1" />
                             {campaign.strategy.total_budget}
                           </Badge>
                         )}
                       </div>
                     </div>
                   </CardContent>
                 </Card>
 
                 {/* Tab Navigation */}
                 <div className="flex gap-2 overflow-x-auto pb-2">
                   {resultTabs.map(tab => {
                     const Icon = tab.icon;
                     const isActive = activeResultTab === tab.id;
                     
                     return (
                       <button
                         key={tab.id}
                         onClick={() => setActiveResultTab(tab.id)}
                         className={cn(
                           "flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all whitespace-nowrap",
                           isActive
                             ? "border-primary bg-primary/10 text-foreground"
                             : "border-border/50 bg-card hover:border-primary/30 text-muted-foreground hover:text-foreground"
                         )}
                       >
                         <Icon className={cn("w-4 h-4", isActive && tab.color)} />
                         <span className="text-sm font-medium">{tab.label}</span>
                       </button>
                     );
                   })}
                 </div>
 
                 {/* Tab Content */}
                 <div className="min-h-[500px]">
                   
                   {/* Strategy Tab */}
                   {activeResultTab === 'strategy' && (
                     <div className="space-y-4">
                       {campaign.strategy && (
                         <CampaignStrategyCard strategy={campaign.strategy} clientName={formData.clientName} />
                       )}
                       
                       {campaign.recommendations && campaign.recommendations.length > 0 && (
                         <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                           <CardHeader className="pb-3">
                             <CardTitle className="flex items-center gap-2 text-sm">
                               <Lightbulb className="w-4 h-4 text-primary" />
                               Rekomendacje AI
                             </CardTitle>
                           </CardHeader>
                           <CardContent>
                             <ul className="space-y-2">
                               {campaign.recommendations.map((rec, idx) => (
                                 <li key={idx} className="flex items-start gap-2 text-sm">
                                   <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                                   <span className="text-foreground/80">{rec}</span>
                                 </li>
                               ))}
                             </ul>
                           </CardContent>
                         </Card>
                       )}
                     </div>
                   )}
 
                   {/* Ads Manager Tab */}
                   {activeResultTab === 'adsmanager' && (
                     <div className="space-y-4">
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
                             <CardTitle className="flex items-center gap-2 text-sm">
                               <Settings2 className="w-4 h-4 text-blue-400" />
                               Szczegółowe ustawienia Ads Managera
                             </CardTitle>
                           </CardHeader>
                           <CardContent>
                             <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                               {Object.entries(campaign.adsManagerSettings).map(([key, value]) => (
                                 <div key={key} className="p-3 rounded-xl bg-secondary/50 border border-border/50">
                                   <span className="text-muted-foreground text-xs capitalize block mb-1">
                                     {key.replace(/([A-Z])/g, ' $1').trim()}
                                   </span>
                                   <p className="text-foreground font-medium text-sm">{renderValue(value)}</p>
                                 </div>
                               ))}
                             </div>
                           </CardContent>
                         </Card>
                       )}
                     </div>
                   )}
 
                   {/* Mockups Tab */}
                   {activeResultTab === 'mockups' && (
                     <div className="space-y-6">
                       <Card className="border-border/50">
                         <CardHeader className="pb-3">
                           <CardTitle className="flex items-center gap-2 text-sm">
                             <Smartphone className="w-4 h-4 text-purple-400" />
                             Podgląd reklam w feedzie
                           </CardTitle>
                         </CardHeader>
                         <CardContent>
                           <div className="grid gap-6 lg:grid-cols-2">
                             {campaign.posts?.slice(0, 2).map((post, idx) => (
                               <div key={idx} className="space-y-3">
                                 <Badge variant="outline" className="text-xs">{post.type}</Badge>
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
                             ))}
                           </div>
                         </CardContent>
                       </Card>
 
                       <Card className="border-border/50">
                         <CardHeader className="pb-3">
                           <CardTitle className="flex items-center gap-2 text-sm">
                             <Play className="w-4 h-4 text-purple-400" />
                             Stories / Reels
                           </CardTitle>
                         </CardHeader>
                         <CardContent>
                           <div className="flex gap-6 justify-center flex-wrap">
                             {campaign.posts?.slice(0, 2).map((post, idx) => (
                               <div key={idx} className="space-y-2">
                                 <Badge variant="outline" className="text-xs">
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
                         </CardContent>
                       </Card>
                     </div>
                   )}
 
                   {/* A/B Testing Tab */}
                   {activeResultTab === 'copy' && (
                     <div>
                       {campaign.copyVariants && <ABTestingCard variants={campaign.copyVariants} />}
                     </div>
                   )}
 
                   {/* Posts Tab */}
                   {activeResultTab === 'posts' && (
                     <div className="grid gap-4 lg:grid-cols-2">
                       {campaign.posts?.map((post, idx) => (
                         <Card key={idx} className="border-border/50">
                           <CardHeader className="pb-3">
                             <div className="flex items-center justify-between">
                               <CardTitle className="flex items-center gap-2 text-sm">
                                 <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center text-primary font-bold text-sm">
                                   {idx + 1}
                                 </div>
                                 Post {idx + 1}
                               </CardTitle>
                               <div className="flex gap-2">
                                 <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">{post.type}</Badge>
                                 <Button
                                   variant="ghost"
                                   size="sm"
                                   onClick={() => copyToClipboard(`${post.headline}\n\n${post.primaryText}\n\nCTA: ${post.cta}`)}
                                   className="h-7 px-2"
                                 >
                                   <Copy className="w-3 h-3" />
                                 </Button>
                               </div>
                             </div>
                           </CardHeader>
                           <CardContent className="space-y-3">
                             <div className="p-3 rounded-lg bg-secondary/50">
                               <span className="text-muted-foreground text-xs block mb-1">Nagłówek</span>
                               <p className="text-foreground font-semibold text-sm">{post.headline}</p>
                             </div>
                             <div className="p-3 rounded-lg bg-secondary/50">
                               <span className="text-muted-foreground text-xs block mb-1">Tekst główny</span>
                               <p className="text-foreground text-sm whitespace-pre-line">{post.primaryText}</p>
                             </div>
                             <div className="flex gap-2">
                               <div className="flex-1 p-3 rounded-lg bg-primary/10 border border-primary/20">
                                 <span className="text-muted-foreground text-xs block mb-1">CTA</span>
                                 <p className="text-primary font-semibold text-sm">{post.cta}</p>
                               </div>
                             </div>
                             {post.imageIdea && (
                               <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                 <span className="text-amber-400 text-xs flex items-center gap-1 mb-1">
                                   <ImageIcon className="w-3 h-3" />
                                   Pomysł na grafikę
                                 </span>
                                 <p className="text-foreground/80 text-sm">{post.imageIdea}</p>
                               </div>
                             )}
                           </CardContent>
                         </Card>
                       ))}
                     </div>
                   )}
                 </div>
 
                 {/* Raw content fallback */}
                 {campaign.rawContent && !campaign.strategy && (
                   <Card className="border-border/50 mt-4">
                     <CardHeader className="pb-3">
                       <div className="flex items-center justify-between">
                         <CardTitle className="text-sm">Wygenerowana treść</CardTitle>
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => copyToClipboard(campaign.rawContent || '')}
                           className="h-7"
                         >
                           <Copy className="w-3 h-3 mr-1" />
                           Kopiuj
                         </Button>
                       </div>
                     </CardHeader>
                     <CardContent>
                       <pre className="text-foreground/80 text-sm whitespace-pre-wrap font-sans leading-relaxed">
                         {campaign.rawContent}
                       </pre>
                     </CardContent>
                   </Card>
                 )}
               </div>
             )}
           </div>
         </div>
       </div>
     </AppLayout>
   );
 }