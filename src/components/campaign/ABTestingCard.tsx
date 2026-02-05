 import { cn } from '@/lib/utils';
 import { 
   FlaskConical, 
   Copy, 
   CheckCircle2,
   Sparkles,
   TrendingUp,
   MessageSquare
 } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { toast } from 'sonner';
 
 interface CopyVariant {
   style: string;
   text: string;
   hook?: string;
   benefit?: string;
   cta?: string;
 }
 
 interface ABTestingCardProps {
   variants: CopyVariant[];
   className?: string;
 }
 
 const styleConfig: Record<string, { label: string; icon: any; color: string; description: string }> = {
   emotional: { 
     label: 'Emocjonalny', 
     icon: Sparkles, 
     color: 'bg-primary/20 text-primary border-primary/30',
     description: 'Apeluje do emocji i marzeń odbiorcy'
   },
   benefit: { 
     label: 'Korzyści', 
     icon: TrendingUp, 
     color: 'bg-success/20 text-success border-success/30',
     description: 'Skupia się na konkretnych korzyściach'
   },
   urgency: { 
     label: 'Pilność', 
     icon: FlaskConical, 
     color: 'bg-destructive/20 text-destructive border-destructive/30',
     description: 'Tworzy poczucie pilności i FOMO'
   },
   social_proof: { 
     label: 'Dowód społeczny', 
     icon: MessageSquare, 
     color: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
     description: 'Wykorzystuje opinie i rekomendacje'
   },
 };
 
 export function ABTestingCard({ variants, className }: ABTestingCardProps) {
   const copyToClipboard = (text: string) => {
     navigator.clipboard.writeText(text);
     toast.success('Skopiowano do schowka');
   };
   
   return (
     <div className={cn("space-y-6", className)}>
       <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20 shadow-xl">
         <div className="flex items-start gap-4 mb-4">
           <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
             <FlaskConical className="w-6 h-6 text-primary-foreground" />
           </div>
           <div>
             <h3 className="text-lg font-bold text-foreground">Warianty do testów A/B</h3>
             <p className="text-muted-foreground text-sm">
               Przetestuj różne style komunikacji i wybierz najskuteczniejszy
             </p>
           </div>
         </div>
         
         <div className="flex flex-wrap gap-2">
           {variants.map((_, i) => (
             <Badge key={i} className="bg-muted text-muted-foreground border-border">
               Wariant {String.fromCharCode(65 + i)}
             </Badge>
           ))}
         </div>
       </div>
       
       <div className="grid gap-4 md:grid-cols-2">
         {variants.map((variant, index) => {
           const config = styleConfig[variant.style] || styleConfig.benefit;
           const Icon = config.icon;
           
           return (
             <div 
               key={index} 
               className="p-5 rounded-2xl bg-card border border-border shadow-lg hover:shadow-xl transition-shadow"
             >
               <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-foreground font-bold">
                     {String.fromCharCode(65 + index)}
                   </div>
                   <Badge className={config.color}>
                     <Icon className="w-3 h-3 mr-1" />
                     {config.label}
                   </Badge>
                 </div>
                 <Button
                   variant="ghost"
                   size="sm"
                   onClick={() => copyToClipboard(variant.text)}
                   className="text-muted-foreground hover:text-primary"
                 >
                   <Copy className="w-4 h-4" />
                 </Button>
               </div>
               
               <p className="text-xs text-muted-foreground mb-3">{config.description}</p>
               
               <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                 <p className="text-foreground text-sm leading-relaxed whitespace-pre-line">
                   {variant.text}
                 </p>
               </div>
               
               {(variant.hook || variant.benefit || variant.cta) && (
                 <div className="mt-4 space-y-2">
                   {variant.hook && (
                     <div className="flex items-start gap-2 text-xs">
                       <CheckCircle2 className="w-3.5 h-3.5 text-success mt-0.5 shrink-0" />
                       <div>
                         <span className="text-muted-foreground">Hook:</span>{' '}
                         <span className="text-foreground">{variant.hook}</span>
                       </div>
                     </div>
                   )}
                   {variant.benefit && (
                     <div className="flex items-start gap-2 text-xs">
                       <CheckCircle2 className="w-3.5 h-3.5 text-success mt-0.5 shrink-0" />
                       <div>
                         <span className="text-muted-foreground">Korzyść:</span>{' '}
                         <span className="text-foreground">{variant.benefit}</span>
                       </div>
                     </div>
                   )}
                   {variant.cta && (
                     <div className="flex items-start gap-2 text-xs">
                       <CheckCircle2 className="w-3.5 h-3.5 text-success mt-0.5 shrink-0" />
                       <div>
                         <span className="text-muted-foreground">CTA:</span>{' '}
                         <span className="text-foreground">{variant.cta}</span>
                       </div>
                     </div>
                   )}
                 </div>
               )}
             </div>
           );
         })}
       </div>
     </div>
   );
 }