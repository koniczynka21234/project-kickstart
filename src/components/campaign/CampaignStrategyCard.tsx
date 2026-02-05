 import { cn } from '@/lib/utils';
 import { 
   Target, 
   Users, 
   DollarSign, 
   Calendar,
   TrendingUp,
   Layers,
   BarChart3,
   Zap,
   CheckCircle2
 } from 'lucide-react';
 import { Badge } from '@/components/ui/badge';
 
 interface FunnelStage {
   stage: string;
   objective: string;
   budget: string;
   duration: string;
   kpis: string[];
 }
 
 interface Strategy {
   objective: string;
   targetAudience: string;
   budget_allocation: unknown;
   timeline: string;
   funnel_stages?: FunnelStage[];
   daily_budget?: string;
   total_budget?: string;
   campaign_duration?: string;
 }
 
 interface CampaignStrategyCardProps {
   strategy: Strategy;
   clientName: string;
   className?: string;
 }
 
 export function CampaignStrategyCard({ strategy, clientName, className }: CampaignStrategyCardProps) {
   const budgetAllocation = renderBudgetAllocation(strategy.budget_allocation);
   
   return (
     <div className={cn("space-y-6", className)}>
       {/* Main strategy overview */}
       <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20 shadow-xl">
         <div className="flex items-start gap-4 mb-6">
           <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
             <Target className="w-7 h-7 text-primary-foreground" />
           </div>
           <div className="flex-1">
             <h3 className="text-xl font-bold text-foreground">Strategia dla {clientName}</h3>
             <p className="text-muted-foreground mt-1">{strategy.objective}</p>
           </div>
         </div>
         
         {/* Key metrics */}
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <MetricCard
             icon={Users}
             label="Grupa docelowa"
             value={typeof strategy.targetAudience === 'string' ? strategy.targetAudience.slice(0, 50) + '...' : 'Zdefiniowana'}
             color="amber"
           />
           <MetricCard
             icon={DollarSign}
             label="Budżet całkowity"
             value={strategy.total_budget || 'Wg planu'}
             color="success"
           />
           <MetricCard
             icon={Calendar}
             label="Czas trwania"
             value={strategy.campaign_duration || strategy.timeline || '30 dni'}
             color="primary"
           />
           <MetricCard
             icon={BarChart3}
             label="Budżet dzienny"
             value={strategy.daily_budget || 'Dynamiczny'}
             color="muted"
           />
         </div>
       </div>
       
       {/* Budget allocation */}
       <div className="p-6 rounded-2xl bg-card border border-border shadow-lg">
         <div className="flex items-center gap-3 mb-5">
           <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
             <Layers className="w-5 h-5 text-success" />
           </div>
           <div>
             <h4 className="font-semibold text-foreground">Podział budżetu</h4>
             <p className="text-muted-foreground text-xs">Alokacja środków na etapy lejka</p>
           </div>
         </div>
         
         <div className="space-y-3">
           {budgetAllocation.map((item, i) => (
             <div key={i} className="flex items-center gap-4">
               <div className="w-24 text-sm font-medium text-foreground capitalize">{item.stage}</div>
               <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                 <div 
                   className={cn(
                     "h-full rounded-full transition-all duration-500",
                     i === 0 && "bg-primary",
                     i === 1 && "bg-amber-500",
                     i === 2 && "bg-success"
                   )}
                   style={{ width: `${item.percentage}%` }}
                 />
               </div>
               <div className="w-16 text-right text-sm font-semibold text-foreground">{item.percentage}%</div>
               {item.amount && <div className="w-24 text-right text-sm text-muted-foreground">{item.amount}</div>}
             </div>
           ))}
         </div>
       </div>
       
       {/* Funnel stages */}
       {strategy.funnel_stages && strategy.funnel_stages.length > 0 && (
         <div className="p-6 rounded-2xl bg-card border border-border shadow-lg">
           <div className="flex items-center gap-3 mb-5">
             <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
               <TrendingUp className="w-5 h-5 text-primary" />
             </div>
             <div>
               <h4 className="font-semibold text-foreground">Etapy lejka</h4>
               <p className="text-muted-foreground text-xs">Szczegółowy plan kampanii</p>
             </div>
           </div>
           
           <div className="space-y-4">
             {strategy.funnel_stages.map((stage, i) => (
               <div key={i} className="p-4 rounded-xl bg-muted/30 border border-border/50">
                 <div className="flex items-center gap-3 mb-3">
                   <Badge className={cn(
                     "text-xs",
                     i === 0 && "bg-primary/20 text-primary border-primary/30",
                     i === 1 && "bg-amber-500/20 text-amber-500 border-amber-500/30",
                     i === 2 && "bg-success/20 text-success border-success/30"
                   )}>
                     {stage.stage}
                   </Badge>
                   <span className="text-foreground font-medium">{stage.objective}</span>
                 </div>
                 <div className="grid grid-cols-2 gap-4 text-sm">
                   <div>
                     <span className="text-muted-foreground">Budżet:</span>{' '}
                     <span className="text-foreground">{stage.budget}</span>
                   </div>
                   <div>
                     <span className="text-muted-foreground">Czas:</span>{' '}
                     <span className="text-foreground">{stage.duration}</span>
                   </div>
                 </div>
                 {stage.kpis && stage.kpis.length > 0 && (
                   <div className="mt-3 flex flex-wrap gap-2">
                     {stage.kpis.map((kpi, j) => (
                       <div key={j} className="flex items-center gap-1 text-xs text-muted-foreground">
                         <CheckCircle2 className="w-3 h-3 text-success" />
                         {kpi}
                       </div>
                     ))}
                   </div>
                 )}
               </div>
             ))}
           </div>
         </div>
       )}
     </div>
   );
 }
 
 function MetricCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
   const colorClasses: Record<string, string> = {
     primary: 'bg-primary/10 text-primary',
     amber: 'bg-amber-500/10 text-amber-500',
     success: 'bg-success/10 text-success',
     muted: 'bg-muted text-muted-foreground',
   };
   
   return (
     <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
       <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-2", colorClasses[color])}>
         <Icon className="w-4 h-4" />
       </div>
       <p className="text-muted-foreground text-xs mb-1">{label}</p>
       <p className="text-foreground font-semibold text-sm truncate" title={value}>{value}</p>
     </div>
   );
 }
 
 function renderBudgetAllocation(allocation: unknown): Array<{ stage: string; percentage: number; amount?: string }> {
   if (!allocation) {
     return [
       { stage: 'Awareness', percentage: 40 },
       { stage: 'Consideration', percentage: 35 },
       { stage: 'Conversion', percentage: 25 },
     ];
   }
   
   if (typeof allocation === 'string') {
     // Try to parse percentages from string
     const matches = allocation.match(/(\w+)[:\s]+(\d+)%/gi);
     if (matches && matches.length > 0) {
       return matches.map(m => {
         const parts = m.match(/(\w+)[:\s]+(\d+)%/i);
         if (parts) {
           return { stage: parts[1], percentage: parseInt(parts[2], 10) };
         }
         return { stage: 'Unknown', percentage: 33 };
       });
     }
     return [{ stage: allocation.slice(0, 30), percentage: 100 }];
   }
   
   if (typeof allocation === 'object' && allocation !== null) {
     const entries = Object.entries(allocation as Record<string, unknown>);
     return entries.map(([key, val]) => {
       const percentage = typeof val === 'number' ? val : 
                         typeof val === 'string' ? parseInt(val.replace(/[^0-9]/g, ''), 10) || 33 : 33;
       return { stage: key, percentage };
     });
   }
   
   return [
     { stage: 'Awareness', percentage: 40 },
     { stage: 'Consideration', percentage: 35 },
     { stage: 'Conversion', percentage: 25 },
   ];
 }