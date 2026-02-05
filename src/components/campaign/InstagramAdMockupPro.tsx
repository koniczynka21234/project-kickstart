import { cn } from '@/lib/utils';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react';
import { getBeautyImage } from '@/hooks/useUnsplashImage';

interface InstagramAdMockupProProps {
  salonName: string;
  headline: string;
  primaryText: string;
  cta: string;
  imageIdea?: string;
  variant?: 'feed' | 'story' | 'reels';
  index?: number;
  className?: string;
}

export function InstagramAdMockupPro({
  salonName,
  headline,
  primaryText,
  cta,
  imageIdea,
  variant = 'feed',
  index = 0,
  className
}: InstagramAdMockupProProps) {
  const ctaButtonLabel = getCTALabel(cta);
  const imageUrl = getBeautyImage(imageIdea, index);
  
  if (variant === 'reels') {
    return (
      <div className={cn("w-[280px] h-[500px] rounded-3xl overflow-hidden border border-border shadow-2xl relative", className)}>
        {/* Full background image */}
        <img 
          src={imageUrl} 
          alt="Reels creative" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
        
        {/* Reels header */}
        <div className="absolute top-4 left-4 right-12 z-10 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary via-accent to-primary flex items-center justify-center text-primary-foreground font-bold text-xs ring-2 ring-white/50">
            {salonName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate drop-shadow">{salonName}</p>
            <p className="text-[10px] text-white/80">Sponsorowane</p>
          </div>
          <button className="px-3 py-1 bg-white/90 rounded-lg text-gray-900 text-xs font-semibold">
            Obserwuj
          </button>
        </div>
        
        {/* Play indicator */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <div className="w-0 h-0 border-l-[20px] border-l-white border-y-[12px] border-y-transparent ml-1" />
          </div>
        </div>
        
        {/* Right side actions */}
        <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5">
          {[
            { icon: Heart, count: '2.4K' },
            { icon: MessageCircle, count: '156' },
            { icon: Send, count: '' },
            { icon: Bookmark, count: '' },
          ].map((action, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
                <action.icon className="w-5 h-5 text-white" />
              </div>
              {action.count && <span className="text-[10px] text-white font-medium drop-shadow">{action.count}</span>}
            </div>
          ))}
        </div>
        
        {/* Bottom content */}
        <div className="absolute bottom-4 left-3 right-14">
          <p className="text-white text-sm font-bold mb-1 drop-shadow-lg">{headline}</p>
          <p className="text-white/90 text-xs line-clamp-2 mb-3 drop-shadow">{primaryText.slice(0, 80)}...</p>
          <button className="w-full py-2.5 bg-white rounded-lg text-gray-900 font-semibold text-sm">
            {ctaButtonLabel}
          </button>
        </div>
      </div>
    );
  }
  
  if (variant === 'story') {
    return (
      <div className={cn("w-[280px] h-[500px] rounded-3xl overflow-hidden border border-border shadow-2xl relative", className)}>
        {/* Full background image */}
        <img 
          src={imageUrl} 
          alt="Story creative" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />
        
        {/* Progress bars */}
        <div className="absolute top-3 left-3 right-3 z-20 flex gap-1">
          <div className="flex-1 h-0.5 rounded-full bg-white/90" />
          <div className="flex-1 h-0.5 rounded-full bg-white/30" />
        </div>
        
        {/* Story header */}
        <div className="absolute top-6 left-4 right-4 z-10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent p-0.5">
            <div className="w-full h-full rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white font-bold text-sm">
              {salonName.charAt(0)}
            </div>
          </div>
          <div className="flex-1">
            <span className="font-semibold text-white text-sm drop-shadow">{salonName}</span>
            <span className="text-white/70 text-xs block">Sponsorowane</span>
          </div>
          <MoreHorizontal className="w-5 h-5 text-white/80" />
        </div>
        
        {/* Story CTA */}
        <div className="absolute bottom-6 left-4 right-4 space-y-3">
          <p className="text-white font-bold text-xl text-center drop-shadow-lg">{headline}</p>
          <p className="text-white/90 text-sm text-center line-clamp-2">{primaryText.slice(0, 60)}...</p>
          <button className="w-full py-3 bg-white rounded-xl text-gray-900 font-bold text-sm flex items-center justify-center gap-2">
            {ctaButtonLabel}
            <Send className="w-4 h-4" />
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
      
      {/* Real Image */}
      <img 
        src={imageUrl}
        alt={headline}
        className="w-full aspect-square object-cover"
      />
      
      {/* CTA bar */}
      <div className="px-3 py-2.5 flex items-center justify-between bg-muted/30 border-b border-border/50">
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
        <p className="text-foreground font-semibold text-xs mb-1">847 polubień</p>
        <p className="text-foreground text-xs">
          <span className="font-semibold">{salonName}</span>{' '}
          <span className="text-foreground/80">{primaryText.slice(0, 100)}...</span>
        </p>
        <p className="text-muted-foreground text-xs mt-1 cursor-pointer">Zobacz wszystkie komentarze (42)</p>
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
    'zarezerwuj': 'Zarezerwuj',
  };
  return ctaMap[cta.toLowerCase().replace(/\s+/g, '_')] || cta;
}
