import { useState, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Download,
  GraduationCap,
  Building2,
  TrendingUp,
  Camera,
  Percent,
  Quote,
  Flower2,
  Heart,
  Sparkle,
  Star,
  Target,
  CheckCircle,
  Clock,
  Zap,
  Award,
  BarChart3,
  Instagram,
  Eye,
  DollarSign,
  Sparkles,
  Users,
  Gift,
  Facebook,
  Scissors,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toPng } from "html-to-image";
import agencyLogo from "@/assets/agency-logo.png";

const CATEGORIES = [
  { value: "edukacyjne", label: "Edukacyjne", icon: GraduationCap },
  { value: "o-agencji", label: "O agencji", icon: Building2 },
  { value: "case-studies", label: "Case studies", icon: TrendingUp },
  { value: "behind-the-scenes", label: "Behind the scenes", icon: Camera },
  { value: "promocje", label: "Promocje", icon: Percent },
  { value: "cytaty", label: "Cytaty", icon: Quote },
] as const;

// Types
interface PostBase {
  id: string;
  category: string;
}

interface StandardPost extends PostBase {
  type: "standard";
  badge: string;
  headline: string;
  subheadline: string;
  points: { icon: typeof CheckCircle; text: string }[];
  accentColor: "pink" | "emerald" | "blue" | "amber" | "purple";
  cta?: string;
}

interface StatPost extends PostBase {
  type: "stat";
  badge: string;
  statValue: string;
  statLabel: string;
  description: string;
  points: string[];
  accentColor: "pink" | "emerald" | "blue" | "amber";
}

interface QuotePost extends PostBase {
  type: "quote";
  quote: string;
  author: string;
  role: string;
  accentColor: "pink" | "purple" | "emerald";
}

type SocialPost = StandardPost | StatPost | QuotePost;

const POSTS: SocialPost[] = [
  // EDUKACYJNE
  {
    id: "edu-1",
    category: "edukacyjne",
    type: "standard",
    badge: "💡 Edukacja",
    headline: "Post ≠ Reklama",
    subheadline: "Dlaczego organiczne zasięgi już nie działają",
    points: [
      { icon: Eye, text: "Tylko 5-10% obserwujących widzi Twoje posty" },
      { icon: TrendingUp, text: "Algorytm preferuje płatne treści" },
      { icon: Target, text: "Reklamy docierają do tysięcy nowych osób" },
    ],
    accentColor: "emerald",
  },
  {
    id: "edu-2",
    category: "edukacyjne",
    type: "stat",
    badge: "📊 Liczby",
    statValue: "15-30 zł",
    statLabel: "średni koszt pozyskania klientki",
    description: "Prawdziwe dane z kampanii dla salonów beauty",
    points: ["Usługa za 200 zł = zwrot x7", "Remarketing obniża koszty o 40%"],
    accentColor: "pink",
  },
  {
    id: "edu-3",
    category: "edukacyjne",
    type: "standard",
    badge: "⚠️ Unikaj błędów",
    headline: "3 błędy w reklamach",
    subheadline: "Których możesz uniknąć z naszą pomocą",
    points: [
      { icon: Target, text: "Brak precyzyjnego targetowania" },
      { icon: Sparkles, text: "Słabe kreacje bez CTA" },
      { icon: Users, text: "Zero remarketingu do ciepłych odbiorców" },
    ],
    accentColor: "pink",
  },
  // O AGENCJI
  {
    id: "agency-1",
    category: "o-agencji",
    type: "standard",
    badge: "✨ O nas",
    headline: "Aurine",
    subheadline: "Agencja stworzona dla branży beauty",
    points: [
      { icon: Flower2, text: "Specjalizujemy się wyłącznie w salonach" },
      { icon: Heart, text: "Znamy Twoje wyzwania i klientki" },
      { icon: Zap, text: "Reklamy, które naprawdę działają" },
    ],
    accentColor: "pink",
  },
  {
    id: "agency-2",
    category: "o-agencji",
    type: "standard",
    badge: "🎯 Wyróżniki",
    headline: "Dlaczego my?",
    subheadline: "To nas wyróżnia od innych agencji",
    points: [
      { icon: Star, text: "Tylko branża beauty – zero kompromisów" },
      { icon: BarChart3, text: "Przejrzyste miesięczne raporty" },
      { icon: CheckCircle, text: "Brak długoterminowych umów" },
    ],
    accentColor: "purple",
  },
  {
    id: "agency-3",
    category: "o-agencji",
    type: "standard",
    badge: "🤝 Współpraca",
    headline: "Bez ryzyka",
    subheadline: "Elastyczne warunki dla Twojego salonu",
    points: [
      { icon: CheckCircle, text: "Współpracujemy tak długo, jak jesteś zadowolona" },
      { icon: ArrowRight, text: "Rezygnacja w dowolnym momencie" },
      { icon: Gift, text: "Pierwszy tydzień na próbę" },
    ],
    accentColor: "emerald",
  },
  // CASE STUDIES
  {
    id: "case-1",
    category: "case-studies",
    type: "stat",
    badge: "📈 Case study",
    statValue: "+156%",
    statLabel: "wzrost rezerwacji",
    description: "Salon kosmetyczny, 3 miesiące współpracy",
    points: ["Budżet: 2000 zł/mies.", "142 nowe klientki"],
    accentColor: "emerald",
  },
  {
    id: "case-2",
    category: "case-studies",
    type: "stat",
    badge: "🎯 Wyniki",
    statValue: "47",
    statLabel: "nowych klientek w miesiąc",
    description: "Studio stylizacji rzęs, pierwszy miesiąc",
    points: ["Koszt pozyskania: 22 zł/os.", "ROAS: 6.8x"],
    accentColor: "pink",
  },
  {
    id: "case-3",
    category: "case-studies",
    type: "stat",
    badge: "💰 ROI",
    statValue: "8.2x",
    statLabel: "zwrot z inwestycji",
    description: "Salon fryzjerski premium",
    points: ["Średni koszyk: 350 zł", "89 rezerwacji miesięcznie"],
    accentColor: "amber",
  },
  // BEHIND THE SCENES
  {
    id: "bts-1",
    category: "behind-the-scenes",
    type: "standard",
    badge: "🎨 Proces",
    headline: "Jak tworzymy kreacje?",
    subheadline: "Zakulisowy proces w Aurine",
    points: [
      { icon: Eye, text: "Analiza Twojej konkurencji" },
      { icon: Users, text: "Badanie grupy docelowej" },
      { icon: Sparkles, text: "Grafiki, które konwertują" },
    ],
    accentColor: "blue",
  },
  {
    id: "bts-2",
    category: "behind-the-scenes",
    type: "standard",
    badge: "📊 Monitoring",
    headline: "Codziennie monitorujemy",
    subheadline: "Twoje kampanie pod lupą",
    points: [
      { icon: BarChart3, text: "Optymalizacja budżetu w czasie rzeczywistym" },
      { icon: Zap, text: "Testy A/B kreacji" },
      { icon: Clock, text: "Natychmiastowa reakcja na spadki" },
    ],
    accentColor: "purple",
  },
  {
    id: "bts-3",
    category: "behind-the-scenes",
    type: "standard",
    badge: "📋 Raporty",
    headline: "Raport co miesiąc",
    subheadline: "Pełna przejrzystość wydatków",
    points: [
      { icon: DollarSign, text: "Ile wydane, ile klientek, jaki koszt" },
      { icon: TrendingUp, text: "Porównanie z poprzednim miesiącem" },
      { icon: Target, text: "Rekomendacje na kolejny okres" },
    ],
    accentColor: "emerald",
  },
  // PROMOCJE
  {
    id: "promo-1",
    category: "promocje",
    type: "standard",
    badge: "🎁 Darmowo",
    headline: "Darmowy audyt",
    subheadline: "Sprawdź potencjał swojego salonu",
    points: [
      { icon: Eye, text: "Analiza Twojego profilu i konkurencji" },
      { icon: Target, text: "Konkretne rekomendacje" },
      { icon: CheckCircle, text: "Bez zobowiązań" },
    ],
    accentColor: "pink",
    cta: "Umów się na audyt →",
  },
  {
    id: "promo-2",
    category: "promocje",
    type: "standard",
    badge: "⏰ Limitowane",
    headline: "Tydzień próbny",
    subheadline: "Dla pierwszych 2 salonów w mieście",
    points: [
      { icon: Zap, text: "Pełna kampania za darmo" },
      { icon: BarChart3, text: "Prawdziwe wyniki po 7 dniach" },
      { icon: CheckCircle, text: "Decyzja należy do Ciebie" },
    ],
    accentColor: "amber",
    cta: "Sprawdź dostępność →",
  },
  {
    id: "promo-3",
    category: "promocje",
    type: "standard",
    badge: "🔥 Rabat",
    headline: "-20% na start",
    subheadline: "Rabat na pierwszy miesiąc współpracy",
    points: [
      { icon: Gift, text: "Oferta dla nowych klientek" },
      { icon: Star, text: "Pełny pakiet usług" },
      { icon: Clock, text: "Limitowana liczba miejsc" },
    ],
    accentColor: "pink",
    cta: "Skorzystaj z rabatu →",
  },
  // CYTATY
  {
    id: "quote-1",
    category: "cytaty",
    type: "quote",
    quote: "Klientki same do nas trafiają. Wreszcie mam czas na to, co kocham – zabiegi.",
    author: "Magda",
    role: "salon kosmetyczny, Poznań",
    accentColor: "pink",
  },
  {
    id: "quote-2",
    category: "cytaty",
    type: "quote",
    quote: "Reklamy zwracają się już w pierwszym tygodniu. To była najlepsza decyzja.",
    author: "Karolina Ł.",
    role: "studio urody, Toruń",
    accentColor: "purple",
  },
  {
    id: "quote-3",
    category: "cytaty",
    type: "quote",
    quote: "Przestałam szukać klientek – teraz one szukają mnie.",
    author: "Anna",
    role: "studio stylizacji rzęs",
    accentColor: "emerald",
  },
];

const accentStyles = {
  pink: {
    gradient: "from-pink-500/20 to-rose-500/10",
    solidGradient: "from-pink-500 to-rose-500",
    border: "border-pink-500/30",
    text: "text-pink-400",
    bg: "bg-pink-500/15",
    glow: "shadow-pink-500/30",
  },
  emerald: {
    gradient: "from-emerald-500/20 to-teal-500/10",
    solidGradient: "from-emerald-500 to-teal-500",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    bg: "bg-emerald-500/15",
    glow: "shadow-emerald-500/30",
  },
  blue: {
    gradient: "from-blue-500/20 to-indigo-500/10",
    solidGradient: "from-blue-500 to-indigo-500",
    border: "border-blue-500/30",
    text: "text-blue-400",
    bg: "bg-blue-500/15",
    glow: "shadow-blue-500/30",
  },
  amber: {
    gradient: "from-amber-500/20 to-orange-500/10",
    solidGradient: "from-amber-500 to-orange-500",
    border: "border-amber-500/30",
    text: "text-amber-400",
    bg: "bg-amber-500/15",
    glow: "shadow-amber-500/30",
  },
  purple: {
    gradient: "from-purple-500/20 to-fuchsia-500/10",
    solidGradient: "from-purple-500 to-fuchsia-500",
    border: "border-purple-500/30",
    text: "text-purple-400",
    bg: "bg-purple-500/15",
    glow: "shadow-purple-500/30",
  },
};

// Header component for posts
const PostHeader = () => (
  <div className="flex items-center gap-4">
    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500/25 to-rose-500/15 border border-pink-500/30 flex items-center justify-center shadow-lg shadow-pink-500/10">
      <img src={agencyLogo} alt="Aurine" className="w-9 h-9 object-contain" />
    </div>
    <div>
      <p className="text-pink-400 font-bold text-xl tracking-wide">AURINE</p>
      <p className="text-zinc-500 text-sm">Marketing dla branży beauty</p>
    </div>
  </div>
);

// Footer component for posts
const PostFooter = ({ accentColor }: { accentColor: keyof typeof accentStyles }) => {
  const styles = accentStyles[accentColor];
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Facebook className="w-5 h-5 text-zinc-600" />
          <Instagram className="w-5 h-5 text-zinc-600" />
        </div>
        <span className="text-zinc-600 text-sm">aurine.pl</span>
      </div>
      <div className={cn("h-1.5 w-24 rounded-full bg-gradient-to-r", styles.solidGradient, "opacity-60")} />
    </div>
  );
};

// Standard Post Layout
function StandardPostCard({ post }: { post: StandardPost }) {
  const styles = accentStyles[post.accentColor];

  return (
    <div className="w-[1080px] h-[1080px] bg-gradient-to-br from-zinc-950 via-black to-zinc-950 relative overflow-hidden p-14 flex flex-col">
      {/* Background glows */}
      <div className={cn("absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-[120px] opacity-50 bg-gradient-to-bl", styles.gradient)} />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-pink-500/10 via-fuchsia-500/5 to-transparent rounded-full blur-[100px]" />

      {/* Floating decorative elements */}
      <div className="absolute top-20 right-20 w-16 h-16 rounded-xl bg-gradient-to-br from-pink-500/15 to-rose-500/10 border border-pink-500/20 flex items-center justify-center">
        <Flower2 className="w-8 h-8 text-pink-400/60" />
      </div>
      <div className="absolute bottom-28 right-28 w-14 h-14 rounded-lg bg-gradient-to-br from-fuchsia-500/15 to-purple-500/10 border border-fuchsia-500/20 flex items-center justify-center">
        <Heart className="w-7 h-7 text-fuchsia-400/60" />
      </div>
      <div className="absolute bottom-20 left-1/2 w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500/15 to-orange-500/10 border border-amber-500/20 flex items-center justify-center">
        <Star className="w-6 h-6 text-amber-400/60" />
      </div>

      {/* Header */}
      <PostHeader />

      {/* Main content */}
      <div className="flex-1 flex flex-col justify-center py-10">
        {/* Badge */}
        <div className={cn("inline-flex items-center gap-2 px-5 py-2.5 rounded-full border mb-8 w-fit", styles.bg, styles.border)}>
          <span className={cn("text-lg font-medium", styles.text)}>{post.badge}</span>
        </div>

        {/* Headline */}
        <h2 
          className="text-[80px] font-black text-white leading-[0.95] mb-4"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {post.headline}
        </h2>

        {/* Subheadline */}
        <p className={cn("text-3xl font-medium mb-14", styles.text)}>
          {post.subheadline}
        </p>

        {/* Points */}
        <div className="space-y-5">
          {post.points.map((point, i) => (
            <div key={i} className="flex items-center gap-5">
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center border", styles.bg, styles.border)}>
                <point.icon className={cn("w-6 h-6", styles.text)} />
              </div>
              <p className="text-zinc-200 text-2xl font-medium">{point.text}</p>
            </div>
          ))}
        </div>

        {/* CTA if exists */}
        {post.cta && (
          <div className={cn("mt-12 inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r shadow-xl w-fit", styles.solidGradient, styles.glow)}>
            <span className="text-white text-2xl font-bold">{post.cta}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <PostFooter accentColor={post.accentColor} />
    </div>
  );
}

// Stat Post Layout
function StatPostCard({ post }: { post: StatPost }) {
  const styles = accentStyles[post.accentColor];

  return (
    <div className="w-[1080px] h-[1080px] bg-gradient-to-br from-zinc-950 via-black to-zinc-950 relative overflow-hidden p-14 flex flex-col">
      {/* Background glows */}
      <div className={cn("absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[150px] opacity-40 bg-gradient-to-br", styles.gradient)} />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-pink-500/15 to-transparent rounded-full blur-[100px]" />

      {/* Floating elements */}
      <div className="absolute top-24 right-24 w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-500/15 to-rose-500/10 border border-pink-500/20 flex items-center justify-center">
        <TrendingUp className="w-10 h-10 text-pink-400/60" />
      </div>
      <div className="absolute bottom-32 right-20 w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500/15 to-orange-500/10 border border-amber-500/20 flex items-center justify-center">
        <BarChart3 className="w-8 h-8 text-amber-400/60" />
      </div>

      {/* Header */}
      <PostHeader />

      {/* Main content */}
      <div className="flex-1 flex flex-col justify-center py-10">
        {/* Badge */}
        <div className={cn("inline-flex items-center gap-2 px-5 py-2.5 rounded-full border mb-8 w-fit", styles.bg, styles.border)}>
          <span className={cn("text-lg font-medium", styles.text)}>{post.badge}</span>
        </div>

        {/* Big stat */}
        <p 
          className={cn("text-[140px] font-black leading-none mb-2", styles.text)}
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {post.statValue}
        </p>
        <p className="text-zinc-400 text-3xl mb-6">{post.statLabel}</p>

        {/* Description */}
        <p className="text-zinc-300 text-2xl mb-10">{post.description}</p>

        {/* Points */}
        <div className="space-y-4">
          {post.points.map((point, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center border", styles.bg, styles.border)}>
                <CheckCircle className={cn("w-5 h-5", styles.text)} />
              </div>
              <p className="text-zinc-200 text-xl">{point}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <PostFooter accentColor={post.accentColor} />
    </div>
  );
}

// Quote Post Layout
function QuotePostCard({ post }: { post: QuotePost }) {
  const styles = accentStyles[post.accentColor];

  return (
    <div className="w-[1080px] h-[1080px] bg-gradient-to-br from-zinc-950 via-black to-zinc-950 relative overflow-hidden p-14 flex flex-col">
      {/* Background glows */}
      <div className={cn("absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-[150px] opacity-40 bg-gradient-to-bl", styles.gradient)} />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-fuchsia-500/10 to-transparent rounded-full blur-[100px]" />

      {/* Large quote mark */}
      <div className="absolute top-28 right-20 opacity-10">
        <Quote className={cn("w-48 h-48", styles.text)} />
      </div>

      {/* Floating elements */}
      <div className="absolute bottom-28 right-28 w-14 h-14 rounded-xl bg-gradient-to-br from-pink-500/15 to-rose-500/10 border border-pink-500/20 flex items-center justify-center">
        <Star className="w-7 h-7 text-pink-400/60" />
      </div>
      <div className="absolute top-1/2 right-16 w-12 h-12 rounded-lg bg-gradient-to-br from-fuchsia-500/15 to-purple-500/10 border border-fuchsia-500/20 flex items-center justify-center">
        <Heart className="w-6 h-6 text-fuchsia-400/60" />
      </div>

      {/* Header */}
      <PostHeader />

      {/* Main content */}
      <div className="flex-1 flex flex-col justify-center py-10 max-w-[900px]">
        {/* Quote icon */}
        <div className={cn("w-20 h-20 rounded-2xl flex items-center justify-center border mb-10", styles.bg, styles.border)}>
          <Quote className={cn("w-10 h-10", styles.text)} />
        </div>

        {/* Quote text */}
        <p 
          className="text-[52px] text-white font-medium leading-tight mb-12"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          „{post.quote}"
        </p>

        {/* Author */}
        <div className="flex items-center gap-4">
          <div className={cn("w-14 h-14 rounded-full bg-gradient-to-br flex items-center justify-center", styles.solidGradient)}>
            <span className="text-white text-2xl font-bold">{post.author[0]}</span>
          </div>
          <div>
            <p className={cn("text-2xl font-bold", styles.text)}>{post.author}</p>
            <p className="text-zinc-500 text-lg">{post.role}</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <PostFooter accentColor={post.accentColor} />
    </div>
  );
}

// Main PostCard wrapper
function PostCard({ post }: { post: SocialPost }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 1,
        cacheBust: true,
        width: 1080,
        height: 1080,
      });
      const link = document.createElement("a");
      link.download = `aurine-${post.id}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Pobrano!");
    } catch {
      toast.error("Błąd pobierania");
    }
  };

  return (
    <div className="group relative">
      {/* Card for export */}
      <div
        ref={cardRef}
        style={{ width: 1080, height: 1080 }}
        className="origin-top-left scale-[0.28] sm:scale-[0.3] md:scale-[0.32]"
      >
        {post.type === "standard" && <StandardPostCard post={post} />}
        {post.type === "stat" && <StatPostCard post={post} />}
        {post.type === "quote" && <QuotePostCard post={post} />}
      </div>

      {/* Hover overlay */}
      <div 
        className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl flex items-center justify-center"
        style={{ 
          width: 'calc(1080px * 0.28)', 
          height: 'calc(1080px * 0.28)',
        }}
      >
        <Button
          variant="secondary"
          className="gap-2 bg-white/10 hover:bg-white/20 border border-white/20"
          onClick={handleDownload}
        >
          <Download className="w-4 h-4" />
          Pobierz PNG
        </Button>
      </div>
    </div>
  );
}

export default function SocialMediaLibrary() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredPosts = selectedCategory === "all"
    ? POSTS
    : POSTS.filter((p) => p.category === selectedCategory);

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Social Media</h1>
          <p className="text-sm text-muted-foreground">
            18 gotowych postów w stylu Aurine • Kliknij aby pobrać PNG (1080×1080)
          </p>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("all")}
            className="gap-2"
          >
            Wszystkie
          </Button>
          {CATEGORIES.map((cat) => (
            <Button
              key={cat.value}
              variant={selectedCategory === cat.value ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat.value)}
              className="gap-2"
            >
              <cat.icon className="w-4 h-4" />
              {cat.label}
            </Button>
          ))}
        </div>

        {/* Posts grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
