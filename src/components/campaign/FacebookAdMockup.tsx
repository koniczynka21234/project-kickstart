 import { cn } from '@/lib/utils';
 import { Heart, MessageCircle, Share2, ThumbsUp, MoreHorizontal, Globe } from 'lucide-react';
 
 interface FacebookAdMockupProps {
   salonName: string;
   headline: string;
   primaryText: string;
   cta: string;
   description?: string;
   imageIdea?: string;
   variant?: 'feed' | 'story' | 'reels';
   className?: string;
 }
 
 export function FacebookAdMockup({
   salonName,
   headline,
   primaryText,
   cta,
   description,
   imageIdea,
   variant = 'feed',
   className
 }: FacebookAdMockupProps) {
   const ctaButtonLabel = getCTALabel(cta);
   
   if (variant === 'story') {
     return (
       <div className={cn("w-[280px] h-[500px] bg-gradient-to-br from-muted to-background rounded-3xl overflow-hidden border border-border shadow-2xl relative", className)}>
         {/* Story header */}
         <div className="absolute top-4 left-4 right-4 z-10 flex items-center gap-3">
           <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-sm">
             {salonName.charAt(0)}
           </div>
           <div className="flex-1">
             <p className="text-sm font-semibold text-foreground">{salonName}</p>
             <p className="text-xs text-muted-foreground">Sponsorowane</p>
           </div>
           <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
         </div>
         
         {/* Story content area */}
         <div className="absolute inset-0 flex items-center justify-center p-8 pt-20">
           <div className="text-center">
             <div className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-primary/20 flex items-center justify-center">
               <span className="text-3xl">💅</span>
             </div>
             <p className="text-foreground font-medium text-lg leading-tight mb-2">{headline}</p>
             <p className="text-muted-foreground text-sm line-clamp-3">{primaryText.slice(0, 80)}...</p>
           </div>
         </div>
         
         {/* Story CTA */}
         <div className="absolute bottom-6 left-4 right-4">
           <button className="w-full py-3 bg-gradient-to-r from-primary to-accent rounded-full text-primary-foreground font-semibold text-sm shadow-lg">
             {ctaButtonLabel}
           </button>
         </div>
       </div>
     );
   }
   
   // Feed variant (default)
   return (
     <div className={cn("w-full max-w-[400px] bg-card rounded-xl border border-border shadow-xl overflow-hidden", className)}>
       {/* Post header */}
       <div className="p-3 flex items-center gap-3">
         <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-sm">
           {salonName.charAt(0)}
         </div>
         <div className="flex-1">
           <div className="flex items-center gap-1">
             <span className="font-semibold text-foreground text-sm">{salonName}</span>
             <span className="text-muted-foreground text-xs">•</span>
             <span className="text-xs text-muted-foreground">Sponsorowane</span>
           </div>
           <div className="flex items-center gap-1 text-muted-foreground">
             <Globe className="w-3 h-3" />
             <span className="text-xs">Publiczny</span>
           </div>
         </div>
         <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
       </div>
       
       {/* Post text */}
       <div className="px-3 pb-3">
         <p className="text-foreground text-sm leading-relaxed">
           {primaryText.length > 150 ? `${primaryText.slice(0, 150)}...` : primaryText}
           {primaryText.length > 150 && <span className="text-primary text-xs ml-1 cursor-pointer">Zobacz więcej</span>}
         </p>
       </div>
       
       {/* Image placeholder */}
       <div className="aspect-square bg-gradient-to-br from-muted via-muted/50 to-background flex items-center justify-center relative">
         <div className="text-center p-6">
           <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-primary/20 flex items-center justify-center">
             <span className="text-2xl">📸</span>
           </div>
           {imageIdea && (
             <p className="text-muted-foreground text-xs italic max-w-[200px] mx-auto">
               "{imageIdea.slice(0, 60)}..."
             </p>
           )}
         </div>
         
         {/* Overlay CTA */}
         <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background/90 to-transparent">
           <div className="flex items-center justify-between">
             <div className="flex-1 min-w-0">
               <p className="text-foreground font-semibold text-sm truncate">{headline}</p>
               {description && <p className="text-muted-foreground text-xs truncate">{description}</p>}
             </div>
             <button className="ml-3 px-4 py-2 bg-primary rounded-lg text-primary-foreground font-semibold text-xs whitespace-nowrap">
               {ctaButtonLabel}
             </button>
           </div>
         </div>
       </div>
       
       {/* Engagement stats */}
       <div className="px-3 py-2 flex items-center justify-between text-muted-foreground text-xs border-b border-border">
         <div className="flex items-center gap-1">
           <div className="flex -space-x-1">
             <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
               <ThumbsUp className="w-2.5 h-2.5 text-primary-foreground" />
             </div>
             <div className="w-4 h-4 rounded-full bg-destructive flex items-center justify-center">
               <Heart className="w-2.5 h-2.5 text-destructive-foreground" />
             </div>
           </div>
           <span className="ml-1">128</span>
         </div>
         <span>24 komentarze • 12 udostępnień</span>
       </div>
       
       {/* Action buttons */}
       <div className="px-2 py-1 flex items-center justify-around">
         {[
           { icon: ThumbsUp, label: 'Lubię to' },
           { icon: MessageCircle, label: 'Skomentuj' },
           { icon: Share2, label: 'Udostępnij' },
         ].map((action) => (
           <button key={action.label} className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
             <action.icon className="w-4 h-4" />
             <span className="text-xs font-medium">{action.label}</span>
           </button>
         ))}
       </div>
     </div>
   );
 }
 
 function getCTALabel(cta: string): string {
   const ctaMap: Record<string, string> = {
     'learn_more': 'Dowiedz się więcej',
     'book_now': 'Zarezerwuj',
     'contact_us': 'Kontakt',
     'sign_up': 'Zarejestruj się',
     'shop_now': 'Kup teraz',
     'get_quote': 'Poproś o wycenę',
     'send_message': 'Wyślij wiadomość',
   };
   return ctaMap[cta.toLowerCase().replace(/\s+/g, '_')] || cta;
 }