 import { cn } from '@/lib/utils';
 import { 
   ChevronDown, 
   ChevronRight, 
   MoreHorizontal, 
   Play, 
   Pause,
   Settings2,
   Eye,
   MousePointerClick,
   DollarSign,
   TrendingUp,
   Users,
   Calendar,
   Target,
   Globe
 } from 'lucide-react';
 import { Badge } from '@/components/ui/badge';
 
 interface AdSet {
   name: string;
   audience: string;
   placement: string;
   dailyBudget?: string;
   status?: 'active' | 'paused' | 'draft';
   estimatedReach?: string;
 }
 
 interface Campaign {
   name: string;
   objective: string;
   status?: 'active' | 'paused' | 'draft';
   budget: string;
   schedule?: string;
   adSets: AdSet[];
 }
 
 interface AdsManagerMockupProps {
   campaign: Campaign;
   className?: string;
 }
 
 export function AdsManagerMockup({ campaign, className }: AdsManagerMockupProps) {
   const status = campaign.status || 'draft';
   
   return (
     <div className={cn("bg-card rounded-xl border border-border shadow-2xl overflow-hidden", className)}>
       {/* Top bar */}
       <div className="px-4 py-3 bg-muted/30 border-b border-border flex items-center justify-between">
         <div className="flex items-center gap-3">
           <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
             <Target className="w-4 h-4 text-primary" />
           </div>
           <div>
             <h3 className="font-semibold text-foreground text-sm">Meta Ads Manager</h3>
             <p className="text-muted-foreground text-xs">Podgląd struktury kampanii</p>
           </div>
         </div>
         <div className="flex items-center gap-2">
           <Badge variant="outline" className={cn(
             "text-xs",
             status === 'active' && "border-success text-success",
             status === 'paused' && "border-amber-500 text-amber-500",
             status === 'draft' && "border-muted-foreground text-muted-foreground"
           )}>
             {status === 'active' ? 'Aktywna' : status === 'paused' ? 'Wstrzymana' : 'Wersja robocza'}
           </Badge>
         </div>
       </div>
       
       {/* Campaign level */}
       <div className="border-b border-border">
         <div className="px-4 py-3 flex items-center gap-3 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer">
           <ChevronDown className="w-4 h-4 text-muted-foreground" />
           <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
             <Target className="w-4 h-4 text-primary" />
           </div>
           <div className="flex-1 min-w-0">
             <p className="font-semibold text-foreground text-sm truncate">{campaign.name}</p>
             <p className="text-muted-foreground text-xs">{campaign.objective}</p>
           </div>
           <div className="flex items-center gap-4 text-xs">
             <div className="flex items-center gap-1.5 text-muted-foreground">
               <DollarSign className="w-3.5 h-3.5" />
               <span>{campaign.budget}</span>
             </div>
             {campaign.schedule && (
               <div className="flex items-center gap-1.5 text-muted-foreground">
                 <Calendar className="w-3.5 h-3.5" />
                 <span>{campaign.schedule}</span>
               </div>
             )}
           </div>
           <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
         </div>
         
         {/* Ad Sets */}
         <div className="pl-8">
           {campaign.adSets.map((adSet, index) => (
             <div key={index} className="border-t border-border/50">
               <div className="px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors cursor-pointer">
                 <ChevronRight className="w-4 h-4 text-muted-foreground" />
                 <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center">
                   <Users className="w-3.5 h-3.5 text-amber-500" />
                 </div>
                 <div className="flex-1 min-w-0">
                   <p className="font-medium text-foreground text-sm truncate">{adSet.name}</p>
                   <p className="text-muted-foreground text-xs truncate">{renderValue(adSet.audience)}</p>
                 </div>
                 <div className="flex items-center gap-3 text-xs">
                   {adSet.dailyBudget && (
                     <span className="text-muted-foreground">{adSet.dailyBudget}/dzień</span>
                   )}
                   {adSet.estimatedReach && (
                     <div className="flex items-center gap-1 text-success">
                       <TrendingUp className="w-3 h-3" />
                       <span>{adSet.estimatedReach}</span>
                     </div>
                   )}
                   <Badge variant="outline" className="text-[10px] border-muted-foreground/30 text-muted-foreground">
                     {renderValue(adSet.placement)}
                   </Badge>
                 </div>
               </div>
             </div>
           ))}
         </div>
       </div>
       
       {/* Stats preview */}
       <div className="px-4 py-4 grid grid-cols-4 gap-4">
         {[
           { label: 'Zasięg', value: '15K-45K', icon: Eye, color: 'text-primary' },
           { label: 'Kliknięcia', value: '~450', icon: MousePointerClick, color: 'text-amber-500' },
           { label: 'CTR', value: '~1.2%', icon: TrendingUp, color: 'text-success' },
           { label: 'Koszt/klik', value: '~2.50 PLN', icon: DollarSign, color: 'text-muted-foreground' },
         ].map((stat, i) => (
           <div key={i} className="text-center">
             <stat.icon className={cn("w-4 h-4 mx-auto mb-1", stat.color)} />
             <p className="text-foreground font-semibold text-sm">{stat.value}</p>
             <p className="text-muted-foreground text-xs">{stat.label}</p>
           </div>
         ))}
       </div>
       
       {/* Footer */}
       <div className="px-4 py-2 bg-muted/20 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
         <span>Szacowane dane • Wyniki mogą się różnić</span>
         <div className="flex items-center gap-1">
           <Globe className="w-3 h-3" />
           <span>Facebook & Instagram</span>
         </div>
       </div>
     </div>
   );
 }
 
 // Helper function to safely render values that might be objects
 function renderValue(value: unknown): string {
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
 }