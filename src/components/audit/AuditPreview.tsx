import { useState, useRef, useEffect, useCallback } from "react";
import {
  FileSearch, Instagram, Film, Palette,
  TrendingUp, Check, CheckCircle2,
  ArrowRight, Star, Zap, Target, BarChart3, BookOpen,
  Sparkles, ShieldCheck, MapPin, Lightbulb, Award, Phone,
  AlertTriangle, Eye, Pen,
  Image as ImageIcon, Video, Search, MessageCircleHeart
} from "lucide-react";
import agencyLogo from "@/assets/agency-logo.png";
import {
  type AuditSlideData, type EnrichedFinding,
  generateAuditSlides, getCategoryById,
  getAllCheckedIssues,
} from "./auditFindings";
import { CATEGORY_LARGE_ICONS } from "./auditSections";

interface AuditFormData {
  ownerName: string;
  salonName: string;
  city: string;
  facebookUrl: string;
  instagramUrl: string;
  websiteUrl: string;
}

export type TextOverrides = Record<string, { label?: string; description?: string; recommendation?: string }>;

interface AuditPreviewProps {
  data: AuditFormData;
  currentSlide: number;
  enabledCategories: Record<string, boolean>;
  checkedFindings: Record<string, boolean>;
  includeAcademy?: boolean;
  textOverrides?: TextOverrides;
  isEditing?: boolean;
  onTextChange?: (findingId: string, field: 'label' | 'description' | 'recommendation', value: string) => void;
}

// ============ CATEGORY COLOR SYSTEM ============

const CATEGORY_ACCENT: Record<string, {
  gradient: string;
  orbFrom: string;
  orbTo: string;
  text: string;
  textLight: string;
  bg: string;
  bgSubtle: string;
  border: string;
  iconBg: string;
}> = {
  facebook: {
    gradient: "from-blue-500 to-blue-600",
    orbFrom: "from-blue-500/20",
    orbTo: "to-blue-400/10",
    text: "text-blue-400",
    textLight: "text-blue-300",
    bg: "bg-blue-500/15",
    bgSubtle: "bg-blue-500/5",
    border: "border-blue-500/25",
    iconBg: "bg-blue-500/20",
  },
  instagram: {
    gradient: "from-purple-500 via-pink-500 to-orange-400",
    orbFrom: "from-purple-500/20",
    orbTo: "to-pink-500/10",
    text: "text-purple-400",
    textLight: "text-purple-300",
    bg: "bg-purple-500/15",
    bgSubtle: "bg-purple-500/5",
    border: "border-purple-500/25",
    iconBg: "bg-gradient-to-br from-purple-500/20 to-pink-500/20",
  },
  content: {
    gradient: "from-teal-500 to-cyan-500",
    orbFrom: "from-teal-500/20",
    orbTo: "to-cyan-500/10",
    text: "text-teal-400",
    textLight: "text-teal-300",
    bg: "bg-teal-500/15",
    bgSubtle: "bg-teal-500/5",
    border: "border-teal-500/25",
    iconBg: "bg-teal-500/20",
  },
  stories_reels: {
    gradient: "from-pink-500 to-rose-500",
    orbFrom: "from-pink-500/20",
    orbTo: "to-rose-500/10",
    text: "text-pink-400",
    textLight: "text-pink-300",
    bg: "bg-pink-500/15",
    bgSubtle: "bg-pink-500/5",
    border: "border-pink-500/25",
    iconBg: "bg-pink-500/20",
  },
  branding: {
    gradient: "from-amber-500 to-yellow-500",
    orbFrom: "from-amber-500/20",
    orbTo: "to-yellow-500/10",
    text: "text-amber-400",
    textLight: "text-amber-300",
    bg: "bg-amber-500/15",
    bgSubtle: "bg-amber-500/5",
    border: "border-amber-500/25",
    iconBg: "bg-amber-500/20",
  },
  competition: {
    gradient: "from-teal-500 to-emerald-500",
    orbFrom: "from-teal-500/20",
    orbTo: "to-emerald-500/10",
    text: "text-teal-400",
    textLight: "text-teal-300",
    bg: "bg-teal-500/15",
    bgSubtle: "bg-teal-500/5",
    border: "border-teal-500/25",
    iconBg: "bg-teal-500/20",
  },
  paid_ads: {
    gradient: "from-orange-500 to-red-500",
    orbFrom: "from-orange-500/20",
    orbTo: "to-red-500/10",
    text: "text-orange-400",
    textLight: "text-orange-300",
    bg: "bg-orange-500/15",
    bgSubtle: "bg-orange-500/5",
    border: "border-orange-500/25",
    iconBg: "bg-orange-500/20",
  },
  google_gmb: {
    gradient: "from-green-500 to-emerald-500",
    orbFrom: "from-green-500/20",
    orbTo: "to-emerald-500/10",
    text: "text-green-400",
    textLight: "text-green-300",
    bg: "bg-green-500/15",
    bgSubtle: "bg-green-500/5",
    border: "border-green-500/25",
    iconBg: "bg-green-500/20",
  },
  website: {
    gradient: "from-indigo-500 to-violet-500",
    orbFrom: "from-indigo-500/20",
    orbTo: "to-violet-500/10",
    text: "text-indigo-400",
    textLight: "text-indigo-300",
    bg: "bg-indigo-500/15",
    bgSubtle: "bg-indigo-500/5",
    border: "border-indigo-500/25",
    iconBg: "bg-indigo-500/20",
  },
};

const getAccent = (catId?: string) => CATEGORY_ACCENT[catId || "content"] || CATEGORY_ACCENT.content;

// Helper to find subsection ID from category and subsection name
const findSubSectionId = (catId: string, subSectionName: string): string | undefined => {
  const cat = getCategoryById(catId);
  if (!cat) return undefined;
  const sub = cat.subSections.find(s => s.name === subSectionName);
  return sub?.id;
};

// ============ SHARED VISUAL COMPONENTS ============

const CategoryOrbs = ({ catId }: { catId?: string }) => {
  const a = getAccent(catId);
  return (
    <>
      <div className={`absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-gradient-to-br ${a.orbFrom} via-transparent ${a.orbTo} blur-[120px]`} />
      <div className={`absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-gradient-to-tr ${a.orbFrom} via-transparent to-transparent blur-[120px]`} />
    </>
  );
};

const TealOrbs = () => (
  <>
    <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-teal-500/20 via-cyan-500/10 to-transparent blur-[120px]" />
    <div className="absolute bottom-0 left-0 w-[450px] h-[450px] rounded-full bg-gradient-to-tr from-emerald-500/15 via-teal-500/10 to-transparent blur-[120px]" />
  </>
);

const GridPattern = () => (
  <div className="absolute inset-0 opacity-[0.03]" style={{
    backgroundImage: `linear-gradient(rgba(20,184,166,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(20,184,166,0.5) 1px, transparent 1px)`,
    backgroundSize: '60px 60px'
  }} />
);

const CategoryWatermark = ({ catId }: { catId?: string }) => {
  const icon = CATEGORY_LARGE_ICONS[catId || "content"];
  return (
    <div className="absolute top-8 right-8 opacity-[0.04] scale-[6] pointer-events-none">
      {icon}
    </div>
  );
};

const Footer = ({ slideNumber, totalSlides }: { slideNumber: number; totalSlides: number }) => (
  <div className="flex flex-col items-center gap-4 mt-auto pt-5">
    {/* Slide dots indicator */}
    <div className="flex items-center gap-1.5">
      {[...Array(totalSlides)].map((_, i) => (
        <div key={i} className={`h-2 rounded-full transition-all ${i === slideNumber - 1 ? 'w-8 bg-gradient-to-r from-teal-500 to-cyan-400' : 'w-2 bg-zinc-700/50'}`} />
      ))}
    </div>
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2.5">
        <img src={agencyLogo} alt="Aurine" className="w-7 h-7 object-contain opacity-60" />
        <span className="text-zinc-500 text-sm">aurine.pl</span>
      </div>
      <span className="text-zinc-500 text-sm font-medium">{slideNumber} / {totalSlides}</span>
    </div>
  </div>
);

const SlideShell = ({ children, slideNumber, totalSlides, catId }: { children: React.ReactNode; slideNumber: number; totalSlides: number; catId?: string }) => (
  <div className="w-full h-full bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex flex-col p-14 relative overflow-hidden">
    <CategoryOrbs catId={catId} />
    <GridPattern />
    <CategoryWatermark catId={catId} />
    <div className="relative z-10 flex flex-col h-full">
      {children}
      <Footer slideNumber={slideNumber} totalSlides={totalSlides} />
    </div>
  </div>
);

const CategoryHeader = ({ catId, title, subtitle }: { catId: string; title: string; subtitle: string }) => {
  const a = getAccent(catId);
  const icon = CATEGORY_LARGE_ICONS[catId];
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 rounded-2xl ${a.iconBg} border ${a.border} flex items-center justify-center`}>
          <span className={a.text}>{icon}</span>
        </div>
        <div>
          <h2 className="text-3xl font-bold text-white">{title}</h2>
          <p className="text-zinc-500 text-sm mt-0.5">{subtitle}</p>
        </div>
      </div>
      {/* Category accent line */}
      <div className={`h-1 w-24 rounded-full bg-gradient-to-r ${a.gradient} opacity-60`} />
    </div>
  );
};

// ============ ACADEMY HINTS (subtle promotion) ============

const ACADEMY_HINTS: Record<string, { text: string; feature: string }> = {
  fb_posts: {
    text: "W aplikacji Aurine Academy klientka ma dostęp do generatora strategii AI, który tworzy gotowe opisy postów — z hookiem, storytellingiem i CTA. Wystarczy skopiować i opublikować. Do tego kalendarz postów planuje treści na cały miesiąc.",
    feature: "Generator opisów AI + Kalendarz",
  },
  fb_photos: {
    text: "Generator grafik w Aurine Academy pozwala klientce wkleić swoje zdjęcia z zabiegów, a system automatycznie tworzy profesjonalne grafiki w 10+ szablonach — before/after, karuzele, posty z opisem. Bez Canvy, bez grafika.",
    feature: "Generator grafik z własnych zdjęć",
  },
  fb_profile: {
    text: "Klientka otrzymuje w aplikacji kurs krok po kroku jak uzupełnić profil Facebook — od zdjęcia w tle, przez opis, po przycisk CTA. Plus gotowe teksty do skopiowania i uzupełnienia swoimi danymi.",
    feature: "Kurs uzupełniania profilu + gotowe teksty",
  },
  fb_engagement: {
    text: "W Aurine Academy są gotowe szablony odpowiedzi na komentarze i wiadomości — klientka wybiera sytuację (pytanie o cenę, reklamacja, prośba o termin) i ma gotową odpowiedź do personalizacji.",
    feature: "Szablony odpowiedzi na wiadomości",
  },
  ig_profile: {
    text: "Aplikacja zawiera generator bio na Instagram z AI — klientka podaje specjalizację i miasto, a system tworzy profesjonalne bio z emoji i CTA. Plus kurs optymalizacji profilu z przykładami najlepszych salonów.",
    feature: "Generator bio AI + Kurs profilu IG",
  },
  ig_feed: {
    text: "Generator grafik tworzy spójne wizualnie posty na feed — klientka wybiera szablon w kolorach swojego salonu, wkleja zdjęcia efektów pracy i dostaje gotową grafikę do publikacji.",
    feature: "Generator spójnych grafik na feed",
  },
  ig_stories: {
    text: "W aplikacji są gotowe scenariusze stories na każdy dzień tygodnia — poniedziałek: kulisy, wtorek: efekt pracy, środa: porada. Plus interaktywne szablony z ankietami i quizami do zaangażowania obserwujących.",
    feature: "Scenariusze stories + szablony interakcji",
  },
  content_copy: {
    text: "Generator strategii AI analizuje branżę klientki i tworzy spersonalizowany plan treści na 30 dni — z konkretnymi tematami, opisami i hashtagami. Klientka dodaje je jednym kliknięciem do kalendarza postów.",
    feature: "Plan treści AI na 30 dni + Kalendarz",
  },
  content_photos: {
    text: "Generator before/after w aplikacji — klientka wkleja 2 zdjęcia (przed i po zabiegu), wybiera szablon i dostaje profesjonalną grafikę porównawczą gotową do publikacji. 10+ szablonów do wyboru.",
    feature: "Generator grafik before/after",
  },
  content_hashtags: {
    text: "AI w Aurine Academy dobiera hashtagi do każdego posta automatycznie — analizuje treść, branżę i lokalizację. Klientka dostaje zestaw 20-30 hashtagów podzielonych na kategorie: lokalne, branżowe, popularne.",
    feature: "Inteligentne hashtagi AI",
  },
  content_frequency: {
    text: "Kalendarz postów w aplikacji pokazuje klientce dokładnie co, kiedy i jak publikować — z przypomnieniami push. Plan na cały miesiąc z różnorodnymi formatami: edukacja, efekty, kulisy, angażowanie.",
    feature: "Kalendarz postów z przypomnieniami",
  },
  sr_reels: {
    text: "Aurine Academy zawiera bibliotekę gotowych scenariuszy Reels — klientka wybiera typ (metamorfoza, porada, dzień z życia salonu), dostaje dokładny skrypt: co powiedzieć, jak sfilmować, jaka muzyka.",
    feature: "Gotowe scenariusze Reels + instrukcje",
  },
  sr_interaction: {
    text: "Gotowe szablony interaktywnych stories do skopiowania — ankiety, quizy, pytania, slidery. Każdy szablon ma instrukcję jak go użyć i przykład z branży beauty.",
    feature: "Szablony interaktywnych stories",
  },
  brand_visual: {
    text: "Generator grafik w Aurine Academy ma szablony brandingowe dopasowane do kolorów salonu — klientka ustawia swoje kolory raz i wszystkie generowane materiały są wizualnie spójne.",
    feature: "Szablony grafik w kolorach salonu",
  },
  brand_tone: {
    text: "Kurs komunikacji marki w aplikacji uczy klientkę jak budować spójny ton komunikacji — od postów, przez stories, po odpowiedzi na wiadomości. Z przykładami i ćwiczeniami.",
    feature: "Kurs komunikacji + ton marki",
  },
  ads_campaigns: {
    text: "Klientka widzi w aplikacji status swoich kampanii reklamowych na żywo — czy kampania jest aktywna, ile wydano budżetu, jakie są wyniki. Plus bezpośredni kontakt z opiekunem kampanii.",
    feature: "Podgląd kampanii na żywo + kontakt",
  },
  ads_strategy: {
    text: "W aplikacji klientka ma podgląd całej strategii reklamowej — cele, grupy docelowe, budżety. Może zgłaszać uwagi i zadawać pytania bezpośrednio do opiekuna bez czekania na maile.",
    feature: "Strategia + bezpośredni kontakt",
  },
  gmb_profile: {
    text: "W Aurine Academy są materiały krok po kroku jak uzupełnić wizytówkę Google — zdjęcia, opis usług, kategorie, godziny otwarcia. Plus gotowe opisy usług do skopiowania i personalizacji.",
    feature: "Kurs Google + gotowe opisy usług",
  },
  gmb_reviews: {
    text: "Gotowe szablony wiadomości SMS i WhatsApp z prośbą o opinię Google — klientka salonu dostaje link bezpośrednio do formularza opinii. Plus szablony odpowiedzi na pozytywne i negatywne opinie.",
    feature: "Szablony próśb o opinie + odpowiedzi",
  },
  web_ux: {
    text: "Kurs w aplikacji pokazuje klientce co powinna mieć na stronie www salonu — rezerwacja online, cennik, galeria efektów, opinie. Z checklistą i przykładami dobrze zrobionych stron.",
    feature: "Kurs strony www + checklista",
  },
  web_seo: {
    text: "Materiały SEO w Aurine Academy uczą klientkę jak być widoczną w Google — od wizytówki, przez wpisy blogowe, po słowa kluczowe. Gotowe wskazówki dopasowane do branży beauty.",
    feature: "Poradnik SEO dla salonów beauty",
  },
};

const getAcademyHint = (subSectionId: string) => ACADEMY_HINTS[subSectionId];

// ============ TEXT PERSONALIZATION ============

/**
 * Replaces generic "Salon" / "salon" references in audit texts with the actual salon name.
 * Handles patterns like:
 * - "Salon nie prowadzi" → "Beauty Studio nie prowadzi"
 * - "salon tylko promuje" → "Beauty Studio tylko promuje"  
 * - "profil salonu" → stays as is (grammatical reference)
 * - "wnetrza salonu" → "wnetrza Beauty Studio"
 */
const personalizeAuditText = (text: string, salonName?: string): string => {
  if (!salonName || !text) return text;

  // Patterns where "Salon" is used as the subject (start of sentence or after punctuation)
  let result = text
    // "Salon nie..." "Salon tylko..." "Salon prowadzil..." "Salon odpowiada..." — Salon as subject at start
    .replace(/\bSalon (nie |tylko |prowadzi|odpowiada|ma |uzywa|publikuje|stosuje|korzysta|posiada|oferuje|wyglada|moze|bedzie|jest |zostal|nie ma|nie uzywa|nie prowadzi|nie publikuje|nie stosuje|nie korzysta|nie posiada|nie oferuje)/gi, (match, rest) => {
      const isUpperCase = match.charAt(0) === 'S';
      return `${salonName} ${rest}`;
    })
    // "salon X" patterns — "salonu" (genitive) stays contextual but replace "wnetrza salonu" → "wnetrza [name]"
    .replace(/salonu(?=\s|\.|\,|\!)/g, salonName)
    // "w salonie" → "w [name]"
    .replace(/w salonie/g, `w ${salonName}`)
    // "do salonu" → "do [name]"  
    .replace(/do salonu/g, `do ${salonName}`)
    // "Twojego salonu" → specific name
    .replace(/Twojego salonu/g, salonName)
    // "Twoj salon" → name
    .replace(/Twoj salon/g, salonName)
    // "Twój salon" → name
    .replace(/Twój salon/g, salonName);

  return result;
};

// ============ INLINE EDITABLE TEXT ============

const EditableText = ({ value, onChange, className, tag = "p", isEditing = false }: {
  value: string;
  onChange?: (val: string) => void;
  className?: string;
  tag?: "p" | "span";
  isEditing?: boolean;
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setDraft(value); }, [value]);

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      ref.current.style.height = 'auto';
      ref.current.style.height = ref.current.scrollHeight + 'px';
    }
  }, [editing]);

  const commit = useCallback(() => {
    setEditing(false);
    if (draft.trim() !== value && onChange) onChange(draft.trim());
  }, [draft, value, onChange]);

  // Not in editing mode or no onChange - just render text
  if (!isEditing || !onChange) {
    const Tag = tag;
    return <Tag className={className}>{value}</Tag>;
  }

  if (editing) {
    return (
      <textarea
        ref={ref}
        value={draft}
        onChange={e => {
          setDraft(e.target.value);
          e.target.style.height = 'auto';
          e.target.style.height = e.target.scrollHeight + 'px';
        }}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
        className={`${className} bg-white/5 rounded px-1.5 py-0.5 outline-none ring-1 ring-primary/30 resize-none w-full`}
        style={{ minHeight: '1.5em' }}
      />
    );
  }

  const Tag = tag;
  return (
    <Tag
      className={`${className} cursor-pointer hover:bg-white/5 rounded px-1 -mx-1 transition-colors group/edit relative ring-1 ring-dashed ring-white/10 hover:ring-primary/30`}
      onClick={() => setEditing(true)}
      title="Kliknij aby edytować"
    >
      {value}
      <Pen className="w-3 h-3 text-primary opacity-60 group-hover/edit:opacity-100 transition-opacity inline-block ml-1.5 -mt-0.5" />
    </Tag>
  );
};

// ============ FINDING CARD (redesigned) ============

const FindingCard = ({ finding, catId, showAcademyHint, textOverrides, onTextChange, isEditing = false }: {
  finding: EnrichedFinding;
  catId?: string;
  showAcademyHint?: { text: string; feature: string };
  textOverrides?: TextOverrides;
  onTextChange?: (findingId: string, field: 'label' | 'description' | 'recommendation', value: string) => void;
  isEditing?: boolean;
}) => {
  const isPositive = finding.type === "positive";
  const a = getAccent(catId);
  const overrides = textOverrides?.[finding.id];
  const label = overrides?.label || finding.label;
  const description = overrides?.description || finding.description;
  const recommendation = overrides?.recommendation || finding.recommendation;

  const handleChange = onTextChange ? (field: 'label' | 'description' | 'recommendation') => (val: string) => onTextChange(finding.id, field, val) : undefined;

  if (isPositive) {
    return (
      <div className="flex items-start gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-500/[0.08] to-emerald-400/[0.03] border border-emerald-500/20 backdrop-blur-sm">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/5">
          <CheckCircle2 className="w-5.5 h-5.5 text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-1.5">
            <EditableText value={label} onChange={handleChange?.('label')} className="text-emerald-200 text-[15px] font-bold" isEditing={isEditing} />
            <span className="text-[8px] uppercase tracking-[0.15em] text-emerald-400 font-bold px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/20">DOBRZE</span>
          </div>
          <EditableText value={description} onChange={handleChange?.('description')} className="text-zinc-400 text-[13px] leading-relaxed" isEditing={isEditing} />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-zinc-800/40 to-zinc-800/20 border border-zinc-700/30 backdrop-blur-sm overflow-hidden shadow-lg shadow-black/10">
      {/* Issue header strip */}
      <div className="px-5 py-2 bg-red-500/[0.06] border-b border-red-500/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
          <span className="text-[9px] uppercase tracking-[0.15em] text-red-400/90 font-bold">Wymaga poprawy</span>
        </div>
        <span className="text-[10px] text-zinc-600 font-medium">{finding.subSectionName}</span>
      </div>

      {/* Main finding content */}
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-500/5">
            <AlertTriangle className="w-5.5 h-5.5 text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <EditableText value={label} onChange={handleChange?.('label')} className="text-white text-[15px] font-bold mb-2" isEditing={isEditing} />
            <EditableText value={description} onChange={handleChange?.('description')} className="text-zinc-400 text-[13px] leading-[1.7]" isEditing={isEditing} />
          </div>
        </div>

        {/* Recommendation */}
        {recommendation && (
          <div className={`mt-4 p-4 rounded-xl bg-gradient-to-r ${a?.bgSubtle ? `from-zinc-800/60 to-zinc-800/30` : 'from-zinc-800/60 to-zinc-800/30'} border ${a?.border || 'border-teal-500/20'}`}>
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-lg ${a?.iconBg || 'bg-teal-500/15'} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <Lightbulb className={`w-4.5 h-4.5 ${a?.text || 'text-teal-400'}`} />
              </div>
              <div className="flex-1">
                <span className={`text-[10px] uppercase tracking-[0.15em] font-bold ${a?.text || 'text-teal-400'}`}>Nasza rekomendacja</span>
                <EditableText value={recommendation} onChange={handleChange?.('recommendation')} className="text-zinc-300 text-[13px] leading-[1.7] mt-1.5" isEditing={isEditing} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Academy hint - expanded with full description */}
      {showAcademyHint && (
        <div className="px-5 py-3.5 bg-gradient-to-r from-fuchsia-500/[0.05] via-cyan-500/[0.04] to-teal-500/[0.05] border-t border-teal-500/15">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fuchsia-500/20 to-cyan-500/15 border border-fuchsia-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <BookOpen className="w-4 h-4 text-fuchsia-300" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase tracking-[0.12em] font-bold text-fuchsia-300/90">Aurine Academy</span>
                <span className="text-[8px] text-cyan-400/60 font-medium px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/15">{showAcademyHint.feature}</span>
              </div>
              <p className="text-zinc-400 text-[12px] leading-relaxed">{showAcademyHint.text}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============ CATEGORY-SPECIFIC MOCKUPS ============

const FacebookMockup = ({ salonName, city }: { salonName: string; city?: string }) => (
  <div className="rounded-xl bg-zinc-800/60 border border-zinc-700/50 overflow-hidden">
    <div className="px-4 py-2.5 bg-zinc-800/80 border-b border-zinc-700/50 flex items-center gap-2">
      <div className="flex gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
      </div>
      <span className="text-zinc-500 text-xs font-medium ml-2">facebook.com/{(salonName || "salon").toLowerCase().replace(/\s+/g, '')}</span>
    </div>
    <div className="p-5 space-y-3">
      <div className="h-16 rounded-lg bg-gradient-to-r from-blue-500/20 to-blue-400/10 border border-blue-500/20 flex items-end p-3">
        <div className="w-12 h-12 rounded-full bg-zinc-700 border-[3px] border-zinc-900 -mb-5 flex items-center justify-center">
          <span className="text-base font-bold text-zinc-300">{(salonName || "S").charAt(0)}</span>
        </div>
      </div>
      <div className="pt-3 space-y-1.5">
        <p className="text-zinc-200 text-sm font-semibold">{salonName || "Nazwa salonu"}</p>
        <p className="text-zinc-500 text-[10px]">Salon fryzjerski{city ? ` · ${city}` : ""}</p>
        <div className="flex gap-2 mt-2">
          <div className="h-6 px-3 rounded-md bg-blue-500/20 border border-blue-500/30 flex items-center">
            <span className="text-[9px] text-blue-300 font-medium">Wyślij wiadomość</span>
          </div>
          <div className="h-6 px-2 rounded-md bg-zinc-700/40 border border-zinc-600/30 flex items-center">
            <Phone className="w-2.5 h-2.5 text-zinc-400" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

const InstagramMockup = ({ salonName }: { salonName: string }) => (
  <div className="rounded-xl bg-zinc-800/60 border border-zinc-700/50 overflow-hidden">
    <div className="px-4 py-2.5 bg-zinc-800/80 border-b border-zinc-700/50 flex items-center gap-2">
      <Instagram className="w-3.5 h-3.5 text-zinc-400" />
      <span className="text-zinc-500 text-xs font-medium">Instagram</span>
    </div>
    <div className="p-5 space-y-3">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 border-2 border-purple-500/20 flex items-center justify-center">
          <span className="text-lg font-bold text-purple-300">{(salonName || "S").charAt(0)}</span>
        </div>
        <div className="flex-1">
          <p className="text-zinc-200 text-xs font-semibold">{(salonName || "salon").toLowerCase().replace(/\s+/g, '_')}</p>
          <div className="flex gap-4 mt-1.5">
            <div className="text-center"><p className="text-zinc-200 text-[10px] font-bold">127</p><p className="text-zinc-600 text-[8px]">postów</p></div>
            <div className="text-center"><p className="text-zinc-200 text-[10px] font-bold">1,2k</p><p className="text-zinc-600 text-[8px]">obserwujących</p></div>
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-2">
        {["Cennik", "Efekty", "Opinie"].map((h, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-zinc-700/60 border border-zinc-600/40" />
            <span className="text-[8px] text-zinc-500">{h}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const ContentMockup = () => (
  <div className="rounded-xl bg-zinc-800/60 border border-zinc-700/50 overflow-hidden">
    <div className="px-4 py-2.5 bg-zinc-800/80 border-b border-zinc-700/50">
      <span className="text-zinc-500 text-xs font-medium">Przykład posta</span>
    </div>
    <div className="p-4 space-y-3">
      <div className="h-24 rounded-lg bg-gradient-to-br from-teal-500/10 to-cyan-500/5 border border-teal-500/10 flex items-center justify-center">
        <ImageIcon className="w-8 h-8 text-teal-500/30" />
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-zinc-700" />
          <div className="h-2 w-20 rounded bg-zinc-700" />
        </div>
        <div className="space-y-1.5">
          <div className="h-2 w-full rounded bg-zinc-800" />
          <div className="h-2 w-4/5 rounded bg-zinc-800" />
          <div className="h-2 w-3/5 rounded bg-zinc-800" />
        </div>
        <div className="flex items-center gap-1 pt-1">
          <div className="h-5 px-3 rounded bg-teal-500/15 border border-teal-500/20 flex items-center">
            <span className="text-[8px] text-teal-400 font-medium">Umów wizytę →</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ReelsMockup = () => (
  <div className="rounded-xl bg-zinc-800/60 border border-zinc-700/50 overflow-hidden">
    <div className="px-4 py-2.5 bg-zinc-800/80 border-b border-zinc-700/50 flex items-center gap-2">
      <Film className="w-3.5 h-3.5 text-zinc-400" />
      <span className="text-zinc-500 text-xs font-medium">Reels / Stories</span>
    </div>
    <div className="p-4">
      <div className="w-full aspect-[9/14] max-h-[160px] rounded-lg bg-gradient-to-b from-pink-500/10 via-zinc-800/40 to-pink-500/5 border border-pink-500/10 flex flex-col items-center justify-center relative">
        <div className="w-10 h-10 rounded-full bg-pink-500/15 flex items-center justify-center mb-2">
          <Video className="w-5 h-5 text-pink-400/50" />
        </div>
        <span className="text-[9px] text-zinc-500">Metamorfoza</span>
        <div className="absolute bottom-2 left-2 right-2 flex gap-1">
          <div className="flex-1 h-0.5 rounded bg-white/40" />
          <div className="flex-1 h-0.5 rounded bg-white/15" />
        </div>
      </div>
    </div>
  </div>
);

const GoogleMockup = ({ salonName, city }: { salonName: string; city?: string }) => (
  <div className="rounded-xl bg-zinc-800/60 border border-zinc-700/50 overflow-hidden">
    <div className="px-4 py-2.5 bg-zinc-800/80 border-b border-zinc-700/50 flex items-center gap-2">
      <Search className="w-3.5 h-3.5 text-zinc-400" />
      <span className="text-zinc-500 text-xs font-medium">Google Maps</span>
    </div>
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-green-500/15 border border-green-500/20 flex items-center justify-center">
          <MapPin className="w-5 h-5 text-green-400/70" />
        </div>
        <div>
          <p className="text-zinc-200 text-xs font-semibold">{salonName || "Nazwa salonu"}</p>
          <p className="text-zinc-500 text-[9px]">{city || "Twoje miasto"}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        {[1,2,3,4,5].map(i => (
          <Star key={i} className={`w-3 h-3 ${i <= 4 ? 'text-amber-400 fill-amber-400' : 'text-zinc-600'}`} />
        ))}
        <span className="text-zinc-500 text-[9px] ml-1">4.2 (23 opinie)</span>
      </div>
      <div className="flex gap-2">
        <div className="h-5 px-2 rounded bg-green-500/10 border border-green-500/20 flex items-center">
          <span className="text-[8px] text-green-400 font-medium">Otwarte</span>
        </div>
        <div className="h-5 px-2 rounded bg-zinc-700/40 border border-zinc-600/30 flex items-center">
          <span className="text-[8px] text-zinc-400">Trasę</span>
        </div>
      </div>
    </div>
  </div>
);

const BrandingMockup = ({ salonName }: { salonName: string }) => (
  <div className="rounded-xl bg-zinc-800/60 border border-zinc-700/50 overflow-hidden">
    <div className="px-4 py-2.5 bg-zinc-800/80 border-b border-zinc-700/50 flex items-center gap-2">
      <Palette className="w-3.5 h-3.5 text-zinc-400" />
      <span className="text-zinc-500 text-xs font-medium">Identyfikacja wizualna</span>
    </div>
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border border-amber-500/20 flex items-center justify-center">
          <span className="text-lg font-bold text-amber-300">{(salonName || "S").charAt(0)}</span>
        </div>
        <div>
          <p className="text-zinc-200 text-xs font-semibold">{salonName || "Nazwa salonu"}</p>
          <p className="text-zinc-600 text-[8px]">Brand identity</p>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {["bg-amber-400/60", "bg-amber-600/60", "bg-zinc-300/60", "bg-zinc-700/60"].map((c, i) => (
          <div key={i} className={`h-6 rounded ${c}`} />
        ))}
      </div>
      <div className="space-y-1.5">
        <div className="h-3 w-3/4 rounded bg-zinc-700/50" />
        <div className="h-2 w-full rounded bg-zinc-800/50" />
        <div className="h-2 w-5/6 rounded bg-zinc-800/50" />
      </div>
    </div>
  </div>
);

const CompetitionMockup = () => (
  <div className="rounded-xl bg-zinc-800/60 border border-zinc-700/50 overflow-hidden">
    <div className="px-4 py-2.5 bg-zinc-800/80 border-b border-zinc-700/50 flex items-center gap-2">
      <TrendingUp className="w-3.5 h-3.5 text-zinc-400" />
      <span className="text-zinc-500 text-xs font-medium">Analiza konkurencji</span>
    </div>
    <div className="p-4 space-y-3">
      {[
        { name: "Konkurent A", score: 78, color: "bg-teal-500/50" },
        { name: "Konkurent B", score: 65, color: "bg-teal-500/35" },
        { name: "Twój salon", score: 45, color: "bg-amber-500/50" },
      ].map((item, i) => (
        <div key={i} className="space-y-1">
          <div className="flex justify-between">
            <span className={`text-[10px] ${i === 2 ? "text-amber-300 font-semibold" : "text-zinc-400"}`}>{item.name}</span>
            <span className="text-[10px] text-zinc-500">{item.score}%</span>
          </div>
          <div className="h-2 rounded-full bg-zinc-800">
            <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.score}%` }} />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const PaidAdsMockup = ({ salonName }: { salonName: string }) => (
  <div className="rounded-xl bg-zinc-800/60 border border-zinc-700/50 overflow-hidden">
    <div className="px-4 py-2.5 bg-zinc-800/80 border-b border-zinc-700/50 flex items-center gap-2">
      <Target className="w-3.5 h-3.5 text-zinc-400" />
      <span className="text-zinc-500 text-xs font-medium">Meta Ads Manager</span>
    </div>
    <div className="p-4 space-y-3">
      <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/15">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-orange-300 font-semibold">Kampania — {salonName || "Salon"}</span>
          <span className="text-[8px] text-zinc-500 px-1.5 py-0.5 rounded bg-zinc-700/40">Aktywna</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[{ label: "Zasięg", val: "2,4k" }, { label: "Kliknięcia", val: "89" }, { label: "CPC", val: "0,42 zł" }].map((m, i) => (
            <div key={i} className="text-center">
              <p className="text-zinc-200 text-[11px] font-bold">{m.val}</p>
              <p className="text-zinc-600 text-[7px]">{m.label}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1 h-12 rounded-lg bg-gradient-to-br from-orange-500/10 to-red-500/5 border border-orange-500/10 flex items-center justify-center">
          <ImageIcon className="w-4 h-4 text-orange-500/30" />
        </div>
        <div className="flex-1 h-12 rounded-lg bg-gradient-to-br from-orange-500/10 to-red-500/5 border border-orange-500/10 flex items-center justify-center">
          <ImageIcon className="w-4 h-4 text-orange-500/30" />
        </div>
      </div>
    </div>
  </div>
);

const WebsiteMockup = ({ salonName }: { salonName: string }) => (
  <div className="rounded-xl bg-zinc-800/60 border border-zinc-700/50 overflow-hidden">
    <div className="px-4 py-2.5 bg-zinc-800/80 border-b border-zinc-700/50 flex items-center gap-2">
      <div className="flex gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
      </div>
      <span className="text-zinc-500 text-xs font-medium ml-2">{(salonName || "salon").toLowerCase().replace(/\s+/g, '')}.pl</span>
    </div>
    <div className="p-4 space-y-3">
      <div className="h-16 rounded-lg bg-gradient-to-r from-indigo-500/10 to-violet-500/5 border border-indigo-500/10 flex items-center justify-center">
        <span className="text-indigo-300/40 text-sm font-medium">Hero Section</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {["Usługi", "Cennik", "Kontakt"].map((t, i) => (
          <div key={i} className="h-5 rounded bg-zinc-700/30 border border-zinc-700/20 flex items-center justify-center">
            <span className="text-[7px] text-zinc-500">{t}</span>
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        <div className="h-2 w-full rounded bg-zinc-800/60" />
        <div className="h-2 w-4/5 rounded bg-zinc-800/60" />
      </div>
    </div>
  </div>
);

const getCategoryMockup = (catId: string, data: AuditFormData) => {
  switch (catId) {
    case 'facebook': return <FacebookMockup salonName={data.salonName} city={data.city} />;
    case 'instagram': return <InstagramMockup salonName={data.salonName} />;
    case 'content': return <ContentMockup />;
    case 'stories_reels': return <ReelsMockup />;
    case 'branding': return <BrandingMockup salonName={data.salonName} />;
    case 'competition': return <CompetitionMockup />;
    case 'paid_ads': return <PaidAdsMockup salonName={data.salonName} />;
    case 'google_gmb': return <GoogleMockup salonName={data.salonName} city={data.city} />;
    case 'website': return <WebsiteMockup salonName={data.salonName} />;
    default: return null;
  }
};

// ============ INTRO SLIDE ============

const IntroSlide = ({ data, slideNumber, totalSlides }: { data: AuditFormData; slideNumber: number; totalSlides: number }) => (
  <div className="w-full h-full bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex flex-col relative overflow-hidden">
    <TealOrbs />
    <GridPattern />
    <div className="absolute top-[10%] right-[8%] w-[350px] h-[350px] rounded-full border border-teal-500/10" />
    <div className="absolute top-[12%] right-[9%] w-[300px] h-[300px] rounded-full border border-teal-500/5" />
    <div className="relative z-10 flex flex-col h-full p-14">
      <div className="flex items-center justify-between mb-auto">
        <div className="flex items-center gap-3">
          <img src={agencyLogo} alt="Aurine" className="w-12 h-12 object-contain" />
          <div>
            <p className="text-zinc-300 text-base font-semibold tracking-wide">Aurine Agency</p>
            <p className="text-zinc-600 text-sm">Social Media & Marketing</p>
          </div>
        </div>
        <div className="px-5 py-2.5 rounded-full bg-teal-500/10 border border-teal-500/20">
          <span className="text-teal-300 text-sm font-medium">Bezpłatny audyt</span>
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-center max-w-[900px]">
        <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-teal-500/10 border border-teal-500/20 mb-8 w-fit">
          <FileSearch className="w-5 h-5 text-teal-400" />
          <span className="text-teal-300 text-base font-medium">Analiza Social Media i obecności online</span>
        </div>
        <h1 className="text-6xl font-bold text-white mb-2 leading-[1.1]">Audyt profilu</h1>
        <h1 className="text-6xl font-bold leading-[1.1] mb-4">
          <span className="bg-gradient-to-r from-teal-400 via-cyan-300 to-teal-400 bg-clip-text text-transparent">
            {data.salonName || "Twojego salonu"}
          </span>
        </h1>
        {data.city && (
          <div className="flex items-center gap-2 mb-6">
            <MapPin className="w-5 h-5 text-zinc-500" />
            <p className="text-xl text-zinc-400">{data.city}</p>
          </div>
        )}
        <p className="text-lg text-zinc-500 max-w-[650px] leading-relaxed mb-10">
          Szczegółowa analiza obecności online Twojego salonu wraz z konkretnymi wskazówkami,
          które pomogą przyciągnąć więcej klientek i zbudować silną markę.
        </p>
        {data.ownerName && (
          <div className="flex items-center gap-4 p-5 rounded-2xl bg-zinc-800/50 border border-zinc-700/40 w-fit backdrop-blur-sm">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/30 flex items-center justify-center">
              <span className="text-2xl font-bold text-teal-300">{data.ownerName.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <p className="text-zinc-500 text-sm">Przygotowane specjalnie dla</p>
              <p className="text-white text-xl font-semibold">{data.ownerName}</p>
            </div>
          </div>
        )}
      </div>
      <Footer slideNumber={slideNumber} totalSlides={totalSlides} />
    </div>
  </div>
);

// ============ CATEGORY OVERVIEW SLIDE ============

const CategoryOverviewSlide = ({ data, slideNumber, totalSlides, slide }: {
  data: AuditFormData; slideNumber: number; totalSlides: number; slide: AuditSlideData;
}) => {
  const cat = getCategoryById(slide.categoryId!);
  if (!cat) return null;
  const a = getAccent(cat.id);
  const positives = slide.positiveCount || 0;
  const issues = slide.issueCount || 0;
  const total = positives + issues;
  const mockup = getCategoryMockup(cat.id, data);

  return (
    <SlideShell slideNumber={slideNumber} totalSlides={totalSlides} catId={cat.id}>
      <CategoryHeader catId={cat.id} title={cat.name} subtitle={`Analiza dla ${data.salonName || "salonu"}`} />

      <div className="grid grid-cols-5 gap-8 flex-1 min-h-0">
        <div className="col-span-3 space-y-5 overflow-hidden">
          <p className="text-zinc-300 text-base leading-relaxed">{cat.description}</p>

          {total > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-center">
                <p className="text-4xl font-bold text-emerald-400">{positives}</p>
                <p className="text-zinc-400 text-sm mt-1">Co działa dobrze</p>
              </div>
              <div className="p-5 rounded-xl bg-red-500/5 border border-red-500/20 text-center">
                <p className="text-4xl font-bold text-red-400">{issues}</p>
                <p className="text-zinc-400 text-sm mt-1">Do poprawy</p>
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-xl bg-zinc-800/40 border border-zinc-700/40">
              <p className="text-zinc-400 text-sm">Zaznacz elementy w panelu bocznym, aby wygenerować szczegółową analizę tej sekcji.</p>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Analizowane obszary:</p>
            {cat.subSections.map(sub => (
              <div key={sub.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/30 border border-zinc-700/20">
                <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${a.gradient}`} />
                <span className="text-zinc-300 text-sm">{sub.name}</span>
                <span className="text-zinc-600 text-xs ml-auto">{sub.findings.length} elementów</span>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-2 space-y-4 flex flex-col">
          {mockup}
          <div className={`p-5 rounded-xl ${a.bgSubtle} border ${a.border}`}>
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl ${a.iconBg} flex items-center justify-center ${a.text} flex-shrink-0 mt-0.5`}>
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <p className={`${a.textLight} text-base font-semibold mb-1`}>Co sprawdzamy?</p>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Na kolejnych slajdach znajdziesz szczegółową analizę każdego obszaru z konkretnymi rekomendacjami.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SlideShell>
  );
};

// ============ FINDINGS SLIDE (redesigned) ============

const FindingsSlide = ({ slideNumber, totalSlides, slide, includeAcademy = true, textOverrides, onTextChange, isEditing = false }: {
  slideNumber: number; totalSlides: number; slide: AuditSlideData; includeAcademy?: boolean; textOverrides?: TextOverrides; onTextChange?: (findingId: string, field: 'label' | 'description' | 'recommendation', value: string) => void; isEditing?: boolean;
}) => {
  const catId = slide.categoryId!;
  const a = getAccent(catId);
  const icon = CATEGORY_LARGE_ICONS[catId];
  const findings = slide.findings || [];
  const positives = findings.filter(f => f.type === "positive");
  const issues = findings.filter(f => f.type === "issue");

  return (
    <SlideShell slideNumber={slideNumber} totalSlides={totalSlides} catId={catId}>
      {/* Category-branded header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl ${a.iconBg} border ${a.border} flex items-center justify-center`}>
            <span className={a.text}>{icon}</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{slide.categoryName}</h2>
            <p className="text-zinc-500 text-sm">Szczegółowa analiza</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {positives.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-300 text-xs font-semibold">{positives.length} OK</span>
            </div>
          )}
          {issues.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span className="text-red-300 text-xs font-semibold">{issues.length} do poprawy</span>
            </div>
          )}
        </div>
      </div>

      {/* Accent line under header */}
      <div className={`h-0.5 w-full rounded-full bg-gradient-to-r ${a.gradient} opacity-20 mb-5`} />

      {/* Finding cards */}
      <div className="flex-1 space-y-3 overflow-hidden">
        {findings.map((f) => {
          // Show Academy hint on every issue finding that has a matching hint
          const fSubId = f.type === "issue" ? findSubSectionId(catId, f.subSectionName) : undefined;
          const hint = includeAcademy && fSubId ? getAcademyHint(fSubId) : undefined;
          return <FindingCard key={f.id} finding={f} catId={catId} showAcademyHint={hint} textOverrides={textOverrides} onTextChange={onTextChange} isEditing={isEditing} />;
        })}
      </div>

      {/* All positive celebration */}
      {issues.length === 0 && positives.length > 0 && positives.length === findings.length && (
        <div className="mt-4 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-center flex items-center justify-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          <p className="text-emerald-300 font-semibold">Wszystkie elementy w tej sekcji są na dobrym poziomie!</p>
        </div>
      )}
    </SlideShell>
  );
};

// ============ COMPETITION SLIDE ============

const CompetitionSlide = ({ data, slideNumber, totalSlides }: { data: AuditFormData; slideNumber: number; totalSlides: number }) => (
  <SlideShell slideNumber={slideNumber} totalSlides={totalSlides} catId="competition">
    <CategoryHeader catId="competition" title="Analiza konkurencji" subtitle={`Sytuacja rynkowa ${data.city ? "w " + data.city : "w Twojej okolicy"}`} />
    <div className="grid grid-cols-5 gap-8 flex-1 min-h-0">
      <div className="col-span-3 space-y-5 overflow-hidden">
        <p className="text-zinc-300 text-base leading-relaxed">
          {data.city ? `W ${data.city} i okolicach` : "W Twojej okolicy"} działa wiele salonów beauty.
          Większość nie inwestuje w profesjonalny marketing — to ogromna szansa dla {data.salonName || "Twojego salonu"}.
        </p>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Nie mają aktywnych SM", pct: "~60%", color: "text-emerald-400", border: "border-emerald-500/20", bg: "bg-emerald-500/5" },
            { label: "Publikują nieregularnie", pct: "~25%", color: "text-amber-400", border: "border-amber-500/20", bg: "bg-amber-500/5" },
            { label: "Prowadzą profesjonalnie", pct: "~15%", color: "text-red-400", border: "border-red-500/20", bg: "bg-red-500/5" },
          ].map((item, i) => (
            <div key={i} className={`p-5 rounded-xl ${item.bg} border ${item.border} text-center`}>
              <p className={`text-4xl font-bold ${item.color}`}>{item.pct}</p>
              <p className="text-zinc-400 text-sm mt-2">{item.label}</p>
            </div>
          ))}
        </div>
        <div className="p-5 rounded-xl bg-teal-500/5 border border-teal-500/20">
          <p className="text-zinc-300 text-base">
            <span className="text-teal-300 font-semibold">Co to oznacza?</span>{" "}
            Salon z profesjonalnym profilem, regularnymi postami i dobrymi opiniami automatycznie staje się pierwszym wyborem.
          </p>
        </div>
      </div>
      <div className="col-span-2 space-y-4 flex flex-col">
        <div className="p-5 rounded-xl bg-zinc-800/40 border border-zinc-700/40 flex-1">
          <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-4">Jak się wyróżnić?</p>
          <div className="space-y-3">
            {[
              { icon: <Pen className="w-4 h-4" />, tip: "Regularne, profesjonalne posty" },
              { icon: <Film className="w-4 h-4" />, tip: "Angażujące stories i reelsy" },
              { icon: <MessageCircleHeart className="w-4 h-4" />, tip: "Szybka odpowiedź na wiadomości" },
              { icon: <Star className="w-4 h-4" />, tip: "Dobre opinie na Google" },
              { icon: <Palette className="w-4 h-4" />, tip: "Spójna identyfikacja wizualna" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-500/15 flex items-center justify-center text-teal-400 flex-shrink-0">{item.icon}</div>
                <span className="text-zinc-300 text-sm leading-relaxed">{item.tip}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-teal-500/5 border border-teal-500/20">
          <div className="flex items-start gap-3">
            <Award className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-teal-300 text-sm font-semibold mb-1">Twoja przewaga</p>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Dzięki profesjonalnemu podejściu, {data.salonName || "Twój salon"} może stać się liderem{data.city ? " w " + data.city : ""}. To kwestia konsekwencji.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </SlideShell>
);

// ============ RECOMMENDATIONS SLIDE ============

const RecommendationsSlide = ({ data, slideNumber, totalSlides, checkedFindings }: {
  data: AuditFormData; slideNumber: number; totalSlides: number; checkedFindings: Record<string, boolean>;
}) => {
  const allIssues = getAllCheckedIssues(checkedFindings);
  const quickWins = allIssues.filter(f => f.recommendation && f.recommendation.length < 120).slice(0, 5);
  const priorities = allIssues.filter(f => f.recommendation && f.recommendation.length >= 120).slice(0, 5);

  return (
    <SlideShell slideNumber={slideNumber} totalSlides={totalSlides}>
      <CategoryHeader catId="content" title="Rekomendacje" subtitle={`Plan działania dla ${data.salonName || "Twojego salonu"}`} />

      <div className="grid grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-emerald-300 font-semibold text-lg">Szybkie wygrane</h3>
          </div>
          <p className="text-zinc-500 text-xs">Zmiany do wdrożenia w 1-2 dni:</p>
          <div className="space-y-2.5">
            {(quickWins.length > 0 ? quickWins : [
              { label: "Uzupełnij wizytówkę Google" },
              { label: 'Dodaj CTA "Zarezerwuj" na FB' },
              { label: "Zaktualizuj bio na IG" },
              { label: "Dodaj link do rezerwacji" },
            ]).map((tip, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span className="text-zinc-300 text-sm">{tip.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/15 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
              <Target className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="text-amber-300 font-semibold text-lg">Priorytety</h3>
          </div>
          <p className="text-zinc-500 text-xs">Do wdrożenia w 2-4 tygodnie:</p>
          <div className="space-y-2.5">
            {(priorities.length > 0 ? priorities : [
              { label: "Publikuj regularnie (3-4x/tydz.)" },
              { label: "Stwórz spójną identyfikację" },
              { label: "Wdrażaj reelsy — min. 2/tydzień" },
              { label: "Uruchom zbieranie opinii" },
            ]).map((tip, i) => (
              <div key={i} className="flex items-start gap-2">
                <ArrowRight className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <span className="text-zinc-300 text-sm">{tip.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-teal-500/5 border border-teal-500/15 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-500/15 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-teal-400" />
            </div>
            <h3 className="text-teal-300 font-semibold text-lg">Rozwój</h3>
          </div>
          <p className="text-zinc-500 text-xs">Budowanie marki długoterminowo:</p>
          <div className="space-y-2.5">
            {["Uruchom kampanie Meta Ads", "Buduj bazę stałych klientek", "Automatyzuj follow-up", "Rozwijaj markę osobistą", "Testuj nowe formaty treści"]
              .map((tip, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Star className="w-4 h-4 text-teal-400 mt-0.5 flex-shrink-0" />
                  <span className="text-zinc-300 text-sm">{tip}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="mt-5 p-4 rounded-xl bg-gradient-to-r from-teal-500/10 to-cyan-500/5 border border-teal-500/20 flex items-center gap-4">
        <Sparkles className="w-6 h-6 text-teal-400 flex-shrink-0" />
        <p className="text-zinc-300 text-sm">
          <span className="text-teal-300 font-semibold">Aurine Academy</span> — gotowe szablony, kursy wideo i materiały marketingowe stworzone specjalnie dla salonów beauty.
        </p>
      </div>
    </SlideShell>
  );
};

// ============ SUMMARY SLIDE ============

const SummarySlide = ({ data, slideNumber, totalSlides, includeAcademy = true }: { data: AuditFormData; slideNumber: number; totalSlides: number; includeAcademy?: boolean }) => (
  <SlideShell slideNumber={slideNumber} totalSlides={totalSlides}>
    <div className="flex-1 flex flex-col justify-center items-center text-center">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/30 flex items-center justify-center mb-8">
        <BarChart3 className="w-10 h-10 text-teal-400" />
      </div>
      <h2 className="text-5xl font-bold text-white mb-4">Dziękujemy za poświęcony czas!</h2>
      <p className="text-xl text-zinc-400 max-w-2xl mb-10">
        Mamy nadzieję, że ten audyt pomoże{" "}
        <span className="text-teal-300 font-medium">{data.salonName || "Twojemu salonowi"}</span>
        {" "}rozwijać się online i przyciągać nowe klientki.
      </p>
      <div className={`grid ${includeAcademy ? 'grid-cols-2' : 'grid-cols-1'} gap-5 max-w-2xl w-full mb-10`}>
        <div className="p-5 rounded-2xl bg-gradient-to-br from-teal-500/10 to-teal-600/5 border border-teal-500/20 text-left flex flex-col">
          <div className="w-10 h-10 rounded-xl bg-teal-500/15 flex items-center justify-center mb-4">
            <ShieldCheck className="w-5 h-5 text-teal-400" />
          </div>
          <p className="text-teal-300 font-semibold text-base mb-2">Kampanie & Strategia</p>
          <p className="text-zinc-400 text-sm leading-relaxed flex-1">
            Profesjonalne prowadzenie kampanii Meta Ads, strategia Social Media i kompleksowa obsługa marketingowa dopasowana do branży beauty.
          </p>
          <div className="mt-4 pt-3 border-t border-teal-500/10">
            <p className="text-zinc-500 text-xs">✓ Meta Ads · ✓ Strategia SM · ✓ Kreacje</p>
          </div>
        </div>
        {includeAcademy && (
          <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/20 text-left flex flex-col">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 flex items-center justify-center mb-4">
              <BookOpen className="w-5 h-5 text-cyan-400" />
            </div>
            <p className="text-cyan-300 font-semibold text-base mb-2">Aurine Academy</p>
            <p className="text-zinc-400 text-sm leading-relaxed flex-1">
              Autorska aplikacja mobilna w pakiecie — kursy marketingu, narzędzia AI, gotowe szablony treści, generator grafik i kalendarz postów.
            </p>
            <div className="mt-4 pt-3 border-t border-cyan-500/10">
              <p className="text-zinc-500 text-xs">✓ Kursy · ✓ Generator AI · ✓ Szablony</p>
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-4">
        <img src={agencyLogo} alt="Aurine" className="w-12 h-12 object-contain" />
        <div className="text-left">
          <p className="text-zinc-200 text-lg font-semibold">Aurine Agency</p>
          <p className="text-zinc-500 text-base">aurine.pl • Social Media & Marketing</p>
        </div>
      </div>
    </div>
  </SlideShell>
);

// ============ MAIN COMPONENT ============

export const AuditPreview = ({ data, currentSlide, enabledCategories, checkedFindings, includeAcademy = true, textOverrides, isEditing = false, onTextChange }: AuditPreviewProps) => {
  const slides = generateAuditSlides(enabledCategories, checkedFindings);
  const totalSlides = slides.length;
  const current = slides[currentSlide - 1];

  if (!current) return (
    <div className="w-full h-full bg-zinc-950 flex items-center justify-center">
      <p className="text-zinc-500 text-lg">Brak slajdów — włącz sekcje w panelu</p>
    </div>
  );

  switch (current.type) {
    case 'intro':
      return <IntroSlide data={data} slideNumber={currentSlide} totalSlides={totalSlides} />;
    case 'category-overview':
      return <CategoryOverviewSlide data={data} slideNumber={currentSlide} totalSlides={totalSlides} slide={current} />;
    case 'findings':
      return <FindingsSlide slideNumber={currentSlide} totalSlides={totalSlides} slide={current} includeAcademy={includeAcademy} textOverrides={textOverrides} onTextChange={onTextChange} isEditing={isEditing} />;
    case 'competition':
      return <CompetitionSlide data={data} slideNumber={currentSlide} totalSlides={totalSlides} />;
    case 'recommendations':
      return <RecommendationsSlide data={data} slideNumber={currentSlide} totalSlides={totalSlides} checkedFindings={checkedFindings} />;
    case 'summary':
      return <SummarySlide data={data} slideNumber={currentSlide} totalSlides={totalSlides} includeAcademy={includeAcademy} />;
    default:
      return null;
  }
};

export type { AuditFormData };
