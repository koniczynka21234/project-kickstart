import { cn } from '@/lib/utils';
import { Heart, MessageCircle, Share2, ThumbsUp, MoreHorizontal, Globe, Send } from 'lucide-react';
import { getBeautyImage } from '@/hooks/useUnsplashImage';

interface FacebookAdMockupProProps {
  salonName: string;
  headline: string;
  primaryText: string;
  cta: string;
  description?: string;
  imageIdea?: string;
  variant?: 'feed' | 'story' | 'carousel';
  index?: number;
  className?: string;
}

export function FacebookAdMockupPro({
  salonName,
  headline,
  primaryText,
  cta,
  description,
  imageIdea,
  variant = 'feed',
  index = 0,
  className
}: FacebookAdMockupProProps) {
  const ctaButtonLabel = getCTALabel(cta);
  const imageUrl = getBeautyImage(imageIdea, index);
  
  if (variant === 'story') {
    return (
      <div className={cn(
        "w-[280px] h-[500px] rounded-3xl overflow-hidden border border-border/50 shadow-2xl relative",
        className
      )}>
        {/* Full background image */}
        <img 
          src={imageUrl} 
          alt="Ad creative" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />
        
        {/* Progress bars */}
        <div className="absolute top-3 left-3 right-3 z-20 flex gap-1">
          <div className="flex-1 h-0.5 rounded-full bg-white/80" />
          <div className="flex-1 h-0.5 rounded-full bg-white/30" />
          <div className="flex-1 h-0.5 rounded-full bg-white/30" />
        </div>
        
        {/* Story header */}
        <div className="absolute top-6 left-4 right-4 z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center ring-2 ring-white/50">
            <span className="text-primary-foreground font-bold text-sm">{salonName.charAt(0)}</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">{salonName}</p>
            <p className="text-xs text-white/80">Sponsorowane</p>
          </div>
          <MoreHorizontal className="w-5 h-5 text-white/80" />
        </div>
        
        {/* Story CTA */}
        <div className="absolute bottom-6 left-4 right-4 space-y-3">
          <p className="text-white font-bold text-xl leading-tight text-center drop-shadow-lg">{headline}</p>
          <p className="text-white/90 text-sm text-center line-clamp-2">
            {primaryText.length > 60 ? `${primaryText.slice(0, 60)}...` : primaryText}
          </p>
          <button className="w-full py-3.5 bg-white rounded-xl text-gray-900 font-bold text-sm shadow-lg flex items-center justify-center gap-2">
            <span>{ctaButtonLabel}</span>
            <Send className="w-4 h-4" />
          </button>
          <div className="flex justify-center">
            <div className="w-32 h-1 rounded-full bg-white/50" />
          </div>
        </div>
      </div>
    );
  }
  
  if (variant === 'carousel') {
    return (
      <div className={cn(
        "w-full max-w-[400px] bg-card rounded-xl border border-border/50 shadow-xl overflow-hidden",
        className
      )}>
        {/* Post header */}
        <div className="p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">{salonName.charAt(0)}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground text-sm">{salonName}</span>
              <span className="text-xs text-primary font-medium px-1.5 py-0.5 bg-primary/10 rounded">Sponsorowane</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span className="text-xs">właśnie teraz</span>
              <Globe className="w-3 h-3" />
            </div>
          </div>
        </div>
        
        {/* Post text */}
        <div className="px-3 pb-2">
          <p className="text-foreground text-sm leading-relaxed">
            {primaryText.length > 100 ? `${primaryText.slice(0, 100)}...` : primaryText}
          </p>
        </div>
        
        {/* Carousel images */}
        <div className="relative">
          <div className="flex overflow-hidden">
            <div className="flex-shrink-0 w-[70%] aspect-square">
              <img src={imageUrl} alt="Carousel 1" className="w-full h-full object-cover" />
            </div>
            <div className="flex-shrink-0 w-[30%] aspect-square opacity-60">
              <img src={getBeautyImage(imageIdea, index + 1)} alt="Carousel 2" className="w-full h-full object-cover" />
            </div>
          </div>
          {/* Carousel indicators */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-white shadow" />
            <div className="w-2 h-2 rounded-full bg-white/50" />
            <div className="w-2 h-2 rounded-full bg-white/50" />
          </div>
        </div>
        
        {/* CTA bar */}
        <div className="p-3 flex items-center gap-3 bg-muted/30 border-t border-border/50">
          <div className="flex-1 min-w-0">
            <p className="text-foreground font-semibold text-sm truncate">{headline}</p>
            {description && <p className="text-muted-foreground text-xs truncate">{description}</p>}
          </div>
          <button className="px-4 py-2 bg-primary hover:bg-primary/90 rounded-lg text-primary-foreground font-semibold text-xs whitespace-nowrap">
            {ctaButtonLabel}
          </button>
        </div>
        
        {/* Engagement */}
        <div className="px-3 py-2 flex items-center justify-between text-muted-foreground text-xs border-t border-border/30">
          <div className="flex items-center gap-1">
            <div className="flex -space-x-1">
              <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center ring-1 ring-card">
                <ThumbsUp className="w-2 h-2 text-primary-foreground" />
              </div>
              <div className="w-4 h-4 rounded-full bg-destructive flex items-center justify-center ring-1 ring-card">
                <Heart className="w-2 h-2 text-destructive-foreground" />
              </div>
            </div>
            <span>256</span>
          </div>
          <span>48 komentarzy</span>
        </div>
      </div>
    );
  }
  
  // Feed variant (default)
  return (
    <div className={cn(
      "w-full max-w-[400px] bg-card rounded-xl border border-border/50 shadow-xl overflow-hidden",
      className
    )}>
      {/* Post header */}
      <div className="p-4 flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center ring-2 ring-primary/30">
          <span className="text-primary-foreground font-bold">{salonName.charAt(0)}</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">{salonName}</span>
            <span className="text-xs text-primary font-medium px-1.5 py-0.5 bg-primary/10 rounded">Sponsorowane</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground mt-0.5">
            <span className="text-xs">właśnie teraz</span>
            <span className="text-xs">·</span>
            <Globe className="w-3 h-3" />
          </div>
        </div>
        <button className="p-2 hover:bg-muted rounded-full transition-colors">
          <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>
      
      {/* Post text */}
      <div className="px-4 pb-3">
        <p className="text-foreground leading-relaxed">
          {primaryText.length > 150 ? (
            <>
              {primaryText.slice(0, 150)}...
              <button className="text-primary text-sm font-medium ml-1 hover:underline">Zobacz więcej</button>
            </>
          ) : primaryText}
        </p>
      </div>
      
      {/* Real image */}
      <div className="relative">
        <img 
          src={imageUrl} 
          alt={headline}
          className="w-full aspect-[4/3] object-cover"
        />
        
        {/* Bottom CTA overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-base truncate drop-shadow">{headline}</p>
              {description && <p className="text-white/80 text-sm truncate">{description}</p>}
            </div>
            <button className="px-5 py-2.5 bg-white hover:bg-gray-100 rounded-lg text-gray-900 font-bold text-sm whitespace-nowrap shadow-lg transition-colors">
              {ctaButtonLabel}
            </button>
          </div>
        </div>
      </div>
      
      {/* Engagement stats */}
      <div className="px-4 py-2.5 flex items-center justify-between text-muted-foreground text-sm border-b border-border/50">
        <div className="flex items-center gap-1.5">
          <div className="flex -space-x-1.5">
            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center ring-2 ring-card">
              <ThumbsUp className="w-2.5 h-2.5 text-primary-foreground" />
            </div>
            <div className="w-5 h-5 rounded-full bg-destructive flex items-center justify-center ring-2 ring-card">
              <Heart className="w-2.5 h-2.5 text-destructive-foreground" />
            </div>
          </div>
          <span className="font-medium">324</span>
        </div>
        <span>56 komentarzy · 18 udostępnień</span>
      </div>
      
      {/* Action buttons */}
      <div className="px-2 py-1.5 flex items-center justify-around">
        {[
          { icon: ThumbsUp, label: 'Lubię to' },
          { icon: MessageCircle, label: 'Skomentuj' },
          { icon: Share2, label: 'Udostępnij' },
        ].map((action) => (
          <button 
            key={action.label} 
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <action.icon className="w-5 h-5" />
            <span className="text-sm font-medium">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function getCTALabel(cta: string): string {
  const ctaMap: Record<string, string> = {
    'learn_more': 'Dowiedz się więcej',
    'book_now': 'Zarezerwuj teraz',
    'contact_us': 'Kontakt',
    'sign_up': 'Zarejestruj się',
    'shop_now': 'Kup teraz',
    'get_quote': 'Poproś o wycenę',
    'send_message': 'Wyślij wiadomość',
    'zarezerwuj': 'Zarezerwuj',
  };
  return ctaMap[cta.toLowerCase().replace(/\s+/g, '_')] || cta;
}
