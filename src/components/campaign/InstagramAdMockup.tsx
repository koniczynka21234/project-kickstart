 import { cn } from '@/lib/utils';
 import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react';
 
 interface InstagramAdMockupProps {
   salonName: string;
   headline: string;
   primaryText: string;
   cta: string;
   imageIdea?: string;
   variant?: 'feed' | 'story' | 'reels';
   className?: string;
 }
 
 export function InstagramAdMockup({
   salonName,
   headline,
   primaryText,
   cta,
   imageIdea,
   variant = 'feed',
   className
 }: InstagramAdMockupProps) {
   const ctaButtonLabel = getCTALabel(cta);
   
   if (variant === 'reels') {
     return (
       <div className={cn("w-[280px] h-[500px] bg-gradient-to-br from-background via-muted/30 to-background rounded-3xl overflow-hidden border border-border shadow-2xl relative", className)}>
         {/* Reels header */}
         <div className="absolute top-4 left-4 right-12 z-10 flex items-center gap-2">
           <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary via-accent to-primary flex items-center justify-center text-primary-foreground font-bold text-xs ring-2 ring-primary">
             {salonName.charAt(0)}
           </div>
           <div className="flex-1 min-w-0">
             <p className="text-xs font-semibold text-foreground truncate">{salonName}</p>
             <p className="text-[10px] text-muted-foreground">Sponsorowane</p>
           </div>
           <button className="px-3 py-1 bg-primary/90 rounded-lg text-primary-foreground text-xs font-semibold">
             Obserwuj
           </button>
         </div>
         
         {/* Video placeholder */}
         <div className="absolute inset-0 flex items-center justify-center">
           <div className="w-20 h-20 rounded-full bg-muted/30 backdrop-blur-sm flex items-center justify-center">
             <div className="w-0 h-0 border-l-[24px] border-l-foreground border-y-[14px] border-y-transparent ml-1.5" />
           </div>
         </div>
         
         {/* Right side actions */}
         <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5">
           {[
             { icon: Heart, count: '1.2K' },
             { icon: MessageCircle, count: '234' },
             { icon: Send, count: '' },
             { icon: Bookmark, count: '' },
           ].map((action, i) => (
             <div key={i} className="flex flex-col items-center gap-1">
               <div className="w-10 h-10 rounded-full bg-muted/30 backdrop-blur-sm flex items-center justify-center">
                 <action.icon className="w-5 h-5 text-foreground" />
               </div>
               {action.count && <span className="text-[10px] text-foreground font-medium">{action.count}</span>}
             </div>
           ))}
         </div>
         
         {/* Bottom content */}
         <div className="absolute bottom-4 left-3 right-14">
           <p className="text-foreground text-sm font-medium mb-1">{headline}</p>
           <p className="text-foreground/80 text-xs line-clamp-2 mb-3">{primaryText.slice(0, 80)}...</p>
           <button className="w-full py-2.5 bg-primary rounded-lg text-primary-foreground font-semibold text-sm">
             {ctaButtonLabel}
           </button>
         </div>
       </div>
     );
   }
   
   // Feed variant (default)
   return (
     <div className={cn("w-full max-w-[400px] bg-card rounded-xl border border-border shadow-xl overflow-hidden", className)}>
       {/* Header */}
       <div className="p-3 flex items-center gap-3">
         <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary via-accent to-primary p-0.5">
           <div className="w-full h-full rounded-full bg-card flex items-center justify-center text-foreground font-bold text-sm">
             {salonName.charAt(0)}
           </div>
         </div>
         <div className="flex-1">
           <span className="font-semibold text-foreground text-sm">{salonName}</span>
           <span className="text-muted-foreground text-xs block">Sponsorowane</span>
         </div>
         <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
       </div>
       
       {/* Image */}
       <div className="aspect-square bg-gradient-to-br from-muted via-muted/50 to-background flex items-center justify-center relative">
         <div className="text-center p-6">
           <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary/20 flex items-center justify-center">
             <span className="text-3xl">✨</span>
           </div>
           {imageIdea && (
             <p className="text-muted-foreground text-xs italic max-w-[200px] mx-auto">
               "{imageIdea.slice(0, 80)}..."
             </p>
           )}
         </div>
       </div>
       
       {/* CTA bar */}
       <div className="px-3 py-2.5 flex items-center justify-between bg-muted/30 border-b border-border">
         <span className="text-foreground font-medium text-sm truncate flex-1">{headline}</span>
         <button className="ml-3 px-4 py-1.5 bg-primary rounded-lg text-primary-foreground font-semibold text-xs whitespace-nowrap">
           {ctaButtonLabel}
         </button>
       </div>
       
       {/* Action buttons */}
       <div className="px-3 py-2 flex items-center justify-between">
         <div className="flex items-center gap-4">
           <Heart className="w-6 h-6 text-foreground cursor-pointer hover:text-destructive transition-colors" />
           <MessageCircle className="w-6 h-6 text-foreground cursor-pointer" />
           <Send className="w-6 h-6 text-foreground cursor-pointer" />
         </div>
         <Bookmark className="w-6 h-6 text-foreground cursor-pointer" />
       </div>
       
       {/* Likes & caption */}
       <div className="px-3 pb-3">
         <p className="text-foreground font-semibold text-xs mb-1">256 polubień</p>
         <p className="text-foreground text-xs">
           <span className="font-semibold">{salonName}</span>{' '}
           <span className="text-foreground/80">{primaryText.slice(0, 100)}...</span>
         </p>
         <p className="text-muted-foreground text-xs mt-1 cursor-pointer">Zobacz wszystkie komentarze (24)</p>
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
     'get_quote': 'Wycena',
     'send_message': 'Wiadomość',
   };
   return ctaMap[cta.toLowerCase().replace(/\s+/g, '_')] || cta;
 }