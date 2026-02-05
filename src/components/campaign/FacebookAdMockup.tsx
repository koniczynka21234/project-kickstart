import { cn } from '@/lib/utils';
import { Heart, MessageCircle, Share2, ThumbsUp, MoreHorizontal, Globe, Bookmark, Send } from 'lucide-react';

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
      <div className={cn(
        "w-[280px] h-[500px] rounded-3xl overflow-hidden border border-border/50 shadow-2xl relative",
        "bg-gradient-to-br from-card via-muted to-card",
        className
      )}>
        {/* Progress bars */}
        <div className="absolute top-3 left-3 right-3 z-20 flex gap-1">
          <div className="flex-1 h-0.5 rounded-full bg-primary/80" />
          <div className="flex-1 h-0.5 rounded-full bg-muted-foreground/30" />
          <div className="flex-1 h-0.5 rounded-full bg-muted-foreground/30" />
        </div>
        
        {/* Story header */}
        <div className="absolute top-6 left-4 right-4 z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center ring-2 ring-primary/50">
            <span className="text-primary-foreground font-bold text-sm">{salonName.charAt(0)}</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">{salonName}</p>
            <p className="text-xs text-primary">Sponsorowane</p>
          </div>
          <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
        </div>
        
        {/* Story content area */}
        <div className="absolute inset-0 flex items-center justify-center p-8 pt-24">
          <div className="text-center">
            <div className="w-28 h-28 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 flex items-center justify-center shadow-lg shadow-primary/10">
              <span className="text-4xl">✨</span>
            </div>
            <p className="text-foreground font-bold text-xl leading-tight mb-3">{headline}</p>
            <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed">
              {primaryText.length > 80 ? `${primaryText.slice(0, 80)}...` : primaryText}
            </p>
          </div>
        </div>
        
        {/* Story CTA */}
        <div className="absolute bottom-6 left-4 right-4 space-y-3">
          <button className="w-full py-3.5 bg-gradient-to-r from-primary to-accent rounded-xl text-primary-foreground font-bold text-sm shadow-lg shadow-primary/30 flex items-center justify-center gap-2">
            <span>{ctaButtonLabel}</span>
            <Send className="w-4 h-4" />
          </button>
          <div className="flex justify-center">
            <div className="w-32 h-1 rounded-full bg-muted-foreground/50" />
          </div>
        </div>
      </div>
    );
  }
  
  // Feed variant (default) - More realistic Facebook design
  return (
    <div className={cn(
      "w-full max-w-[400px] bg-card rounded-xl border border-border/50 shadow-xl overflow-hidden",
      "hover:shadow-2xl transition-shadow duration-300",
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
      
      {/* Image placeholder with gradient overlay */}
      <div className="aspect-[4/3] bg-gradient-to-br from-muted via-card to-muted/50 flex items-center justify-center relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-accent/20 rounded-full blur-3xl" />
        </div>
        
        <div className="text-center p-6 relative z-10">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/30 border border-primary/20 flex items-center justify-center shadow-lg">
            <span className="text-3xl">📸</span>
          </div>
          {imageIdea && (
            <p className="text-muted-foreground text-sm italic max-w-[250px] mx-auto bg-card/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-border/50">
              "{imageIdea.length > 70 ? `${imageIdea.slice(0, 70)}...` : imageIdea}"
            </p>
          )}
        </div>
        
        {/* Bottom CTA overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-card via-card/95 to-transparent">
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-foreground font-bold text-base truncate">{headline}</p>
              {description && <p className="text-muted-foreground text-sm truncate">{description}</p>}
            </div>
            <button className="px-5 py-2.5 bg-primary hover:bg-primary/90 rounded-lg text-primary-foreground font-bold text-sm whitespace-nowrap shadow-lg shadow-primary/25 transition-colors">
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
          <span className="font-medium">128</span>
        </div>
        <span>24 komentarze · 12 udostępnień</span>
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
  };
  return ctaMap[cta.toLowerCase().replace(/\s+/g, '_')] || cta;
}