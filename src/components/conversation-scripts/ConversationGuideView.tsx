import { useState } from "react";
import {
  MessageSquare, Lightbulb, ShieldCheck, HelpCircle, ChevronDown,
  CheckCircle2, AlertTriangle, Mic, Target, Sparkles, Quote,
  ArrowRight, Zap, TrendingUp, BookOpen, GripVertical,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_LARGE_ICONS } from "@/components/audit/auditSections";
import type { ConversationSection, ConversationTalkingPoint } from "@/lib/conversationGuide";
import { cn } from "@/lib/utils";

// Category accent colors matching audit style
const ACCENT: Record<string, { gradient: string; bg: string; border: string; text: string; bgSubtle: string }> = {
  facebook: { gradient: "from-blue-500 to-blue-600", bg: "bg-blue-500/15", border: "border-blue-500/25", text: "text-blue-400", bgSubtle: "bg-blue-500/5" },
  instagram: { gradient: "from-purple-500 to-pink-500", bg: "bg-purple-500/15", border: "border-purple-500/25", text: "text-purple-400", bgSubtle: "bg-purple-500/5" },
  content: { gradient: "from-teal-500 to-cyan-500", bg: "bg-teal-500/15", border: "border-teal-500/25", text: "text-teal-400", bgSubtle: "bg-teal-500/5" },
  stories_reels: { gradient: "from-pink-500 to-rose-500", bg: "bg-pink-500/15", border: "border-pink-500/25", text: "text-pink-400", bgSubtle: "bg-pink-500/5" },
  branding: { gradient: "from-amber-500 to-yellow-500", bg: "bg-amber-500/15", border: "border-amber-500/25", text: "text-amber-400", bgSubtle: "bg-amber-500/5" },
  competition: { gradient: "from-teal-500 to-emerald-500", bg: "bg-teal-500/15", border: "border-teal-500/25", text: "text-teal-400", bgSubtle: "bg-teal-500/5" },
  paid_ads: { gradient: "from-orange-500 to-red-500", bg: "bg-orange-500/15", border: "border-orange-500/25", text: "text-orange-400", bgSubtle: "bg-orange-500/5" },
  google_gmb: { gradient: "from-green-500 to-emerald-500", bg: "bg-green-500/15", border: "border-green-500/25", text: "text-green-400", bgSubtle: "bg-green-500/5" },
  website: { gradient: "from-indigo-500 to-violet-500", bg: "bg-indigo-500/15", border: "border-indigo-500/25", text: "text-indigo-400", bgSubtle: "bg-indigo-500/5" },
};

const getAccent = (catId: string) => ACCENT[catId] || ACCENT.content;

// ── Editable Text Block ──
const EditableText = ({
  value,
  onChange,
  isEditing,
  className,
  italic = false,
  hint,
}: {
  value: string;
  onChange: (v: string) => void;
  isEditing: boolean;
  className?: string;
  italic?: boolean;
  hint?: string;
}) => {
  if (!isEditing) {
    return <p className={cn(className, italic && "italic")}>{italic ? `„${value}"` : value}</p>;
  }
  return (
    <div className="space-y-1">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm resize-y min-h-[60px] focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground",
          className
        )}
        rows={Math.max(2, Math.ceil(value.length / 80))}
      />
      {hint && (
        <p className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
          <Lightbulb className="w-3 h-3" /> {hint}
        </p>
      )}
    </div>
  );
};

// ── Single Talking Point Card ──
const TalkingPointCard = ({
  point,
  catId,
  index,
  isLast,
  isEditing,
  onUpdate,
}: {
  point: ConversationTalkingPoint;
  catId: string;
  index: number;
  isLast: boolean;
  isEditing: boolean;
  onUpdate: (updated: ConversationTalkingPoint) => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const a = getAccent(catId);
  const isPositive = point.type === "positive";

  const updateField = (field: keyof ConversationTalkingPoint, value: any) => {
    onUpdate({ ...point, [field]: value });
  };

  return (
    <div className={cn(
      "rounded-2xl border overflow-hidden transition-all duration-200",
      isPositive
        ? "border-emerald-500/20 bg-emerald-500/[0.03]"
        : "border-border/50 bg-card/50",
      isEditing && "ring-1 ring-primary/10"
    )}>
      {/* Header - always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 sm:p-5 flex items-start gap-3 sm:gap-4 hover:bg-muted/20 transition-colors"
      >
        {isEditing && (
          <GripVertical className="w-4 h-4 text-muted-foreground/40 mt-1 flex-shrink-0" />
        )}
        <div className={cn(
          "w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold",
          isPositive
            ? "bg-emerald-500/15 text-emerald-400"
            : `${a.bg} ${a.text}`
        )}>
          {isPositive ? <CheckCircle2 className="w-5 h-5" /> : <span>{index}</span>}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={cn("text-sm font-semibold", isPositive ? "text-emerald-300" : "text-foreground")}>
              {point.label}
            </p>
            <Badge variant="outline" className={cn(
              "text-[10px] px-2 py-0",
              isPositive ? "border-emerald-500/30 text-emerald-400" : "border-border/50 text-muted-foreground"
            )}>
              {point.subSectionName}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{point.introduction}</p>
        </div>

        <ChevronDown className={cn(
          "w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform mt-1",
          expanded && "rotate-180"
        )} />
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-border/30 px-4 sm:px-5 pb-5 space-y-4 pt-4">
          {/* Intro */}
          <div className="rounded-xl bg-muted/30 border border-border/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Mic className={cn("w-4 h-4", a.text)} />
              <span className={cn("text-xs font-bold uppercase tracking-wider", a.text)}>Wprowadzenie — co powiedzieć</span>
            </div>
            <EditableText
              value={point.introduction}
              onChange={(v) => updateField("introduction", v)}
              isEditing={isEditing}
              className="text-sm text-foreground/90 leading-relaxed"
              italic
              hint="Dostosuj do swojego stylu mówienia. Użyj imienia klientki."
            />
          </div>

          {/* What to say */}
          <div className="rounded-xl bg-muted/30 border border-border/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-foreground/70" />
              <span className="text-xs font-bold uppercase tracking-wider text-foreground/70">Jak to wytłumaczyć klientce</span>
            </div>
            <EditableText
              value={point.whatToSay}
              onChange={(v) => updateField("whatToSay", v)}
              isEditing={isEditing}
              className="text-sm text-foreground/80 leading-relaxed"
              hint="Uprość język jeśli klientka nie zna się na marketingu. Używaj analogii."
            />
          </div>

          {/* How to sell */}
          <div className={cn("rounded-xl border p-4", a.bgSubtle, a.border)}>
            <div className="flex items-center gap-2 mb-2">
              <Target className={cn("w-4 h-4", a.text)} />
              <span className={cn("text-xs font-bold uppercase tracking-wider", a.text)}>Jak podświadomie sprzedać</span>
            </div>
            <EditableText
              value={point.howToSell}
              onChange={(v) => updateField("howToSell", v)}
              isEditing={isEditing}
              className="text-sm text-foreground/80 leading-relaxed"
              hint="Dodaj konkretne liczby i przykłady z Twojego doświadczenia."
            />
          </div>

          {/* Sales technique */}
          <div className="rounded-xl bg-gradient-to-br from-primary/5 to-transparent border border-primary/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Technika sprzedażowa</span>
            </div>
            <EditableText
              value={point.salesTechnique}
              onChange={(v) => updateField("salesTechnique", v)}
              isEditing={isEditing}
              className="text-sm text-foreground/80 leading-relaxed"
              hint="Wybierz technikę, która pasuje do Twojego stylu. Możesz zmienić na własną."
            />
          </div>

          {/* Possible questions */}
          {point.possibleQuestions.length > 0 && (
            <div className="rounded-xl bg-muted/20 border border-border/30 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Możliwe pytania i obiekcje klientki</span>
              </div>
              {point.possibleQuestions.map((q, qi) => (
                <div key={qi} className="space-y-1.5 rounded-lg bg-muted/20 p-3">
                  {isEditing ? (
                    <div className="space-y-2">
                      <div>
                        <label className="text-[10px] text-amber-400/60 font-medium">Pytanie:</label>
                        <textarea
                          value={q.question}
                          onChange={(e) => {
                            const updated = [...point.possibleQuestions];
                            updated[qi] = { ...updated[qi], question: e.target.value };
                            updateField("possibleQuestions", updated);
                          }}
                          className="w-full rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-1.5 text-xs resize-y min-h-[30px] focus:outline-none focus:ring-1 focus:ring-amber-500/20 text-foreground"
                          rows={1}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-emerald-400/60 font-medium">Odpowiedź:</label>
                        <textarea
                          value={q.answer}
                          onChange={(e) => {
                            const updated = [...point.possibleQuestions];
                            updated[qi] = { ...updated[qi], answer: e.target.value };
                            updateField("possibleQuestions", updated);
                          }}
                          className="w-full rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-xs resize-y min-h-[40px] focus:outline-none focus:ring-1 focus:ring-emerald-500/20 text-foreground"
                          rows={2}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start gap-2">
                        <Quote className="w-3 h-3 text-amber-400/60 mt-1 flex-shrink-0" />
                        <p className="text-xs font-medium text-foreground/70 italic">„{q.question}"</p>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed pl-5">
                        <span className="text-emerald-400 font-medium">→ Twoja odpowiedź:</span> {q.answer}
                      </p>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Transition to next point */}
          {!isLast && (
            <div className="rounded-xl bg-muted/10 border border-border/20 p-3 flex items-center gap-2">
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              {isEditing ? (
                <textarea
                  value={point.transitionToNext}
                  onChange={(e) => updateField("transitionToNext", e.target.value)}
                  className="w-full rounded border border-border/30 bg-muted/10 px-2 py-1 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-primary/20 text-muted-foreground italic"
                  rows={1}
                />
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  Przejście: „{point.transitionToNext}"
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Section Component (one per audit category) ──
const SectionBlock = ({
  section,
  sectionIndex,
  totalSections,
  isEditing,
  onUpdate,
}: {
  section: ConversationSection;
  sectionIndex: number;
  totalSections: number;
  isEditing: boolean;
  onUpdate: (updated: ConversationSection) => void;
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const a = getAccent(section.categoryId);
  const icon = CATEGORY_LARGE_ICONS[section.categoryId];
  const positiveCount = section.talkingPoints.filter(t => t.type === "positive").length;
  const issueCount = section.talkingPoints.filter(t => t.type === "issue").length;

  let issueIndex = 0;

  const updateTalkingPoint = (tpIndex: number, updated: ConversationTalkingPoint) => {
    const newPoints = [...section.talkingPoints];
    newPoints[tpIndex] = updated;
    onUpdate({ ...section, talkingPoints: newPoints });
  };

  return (
    <div className={cn("rounded-2xl border border-border/50 bg-card overflow-hidden", isEditing && "ring-1 ring-primary/10")}>
      {/* Category Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full text-left"
      >
        <div className={cn("relative p-5 sm:p-6 overflow-hidden")}>
          <div className={cn("absolute inset-0 bg-gradient-to-r opacity-[0.06]", a.gradient)} />
          <div className="relative flex items-center gap-4">
            <div className={cn("w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center border", a.bg, a.border)}>
              <span className={a.text}>{icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h2 className="text-lg sm:text-xl font-bold text-foreground">{section.categoryName}</h2>
                <div className={cn("h-1 w-12 sm:w-16 rounded-full bg-gradient-to-r opacity-60", a.gradient)} />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Sekcja {sectionIndex + 1} z {totalSections}</p>
              <div className="flex items-center gap-2 mt-2">
                {positiveCount > 0 && (
                  <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400 gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {positiveCount} OK
                  </Badge>
                )}
                {issueCount > 0 && (
                  <Badge variant="outline" className="text-[10px] border-red-500/30 text-red-400 gap-1">
                    <AlertTriangle className="w-3 h-3" /> {issueCount} do omówienia
                  </Badge>
                )}
                <Badge variant="outline" className="text-[10px] border-border/50 text-muted-foreground gap-1">
                  {section.talkingPoints.length} punktów
                </Badge>
              </div>
            </div>
            <ChevronDown className={cn(
              "w-5 h-5 text-muted-foreground transition-transform",
              !collapsed && "rotate-180"
            )} />
          </div>
        </div>
      </button>

      {!collapsed && (
        <div className="px-4 sm:px-6 pb-5 sm:pb-6 space-y-4">
          {/* Opening line */}
          <div className={cn("rounded-xl border p-4", a.bgSubtle, a.border)}>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className={cn("w-4 h-4", a.text)} />
              <span className={cn("text-xs font-bold uppercase tracking-wider", a.text)}>Otwierające zdanie</span>
            </div>
            <EditableText
              value={section.openingLine}
              onChange={(v) => onUpdate({ ...section, openingLine: v })}
              isEditing={isEditing}
              className="text-sm text-foreground/80 leading-relaxed"
              italic
              hint="Personalizuj otwierające zdanie — dodaj szczegół z profilu klientki."
            />
          </div>

          {/* Opening technique tip */}
          <div className="rounded-xl bg-muted/20 border border-border/30 p-3">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
              {isEditing ? (
                <textarea
                  value={section.openingTechnique}
                  onChange={(e) => onUpdate({ ...section, openingTechnique: e.target.value })}
                  className="w-full rounded border border-amber-500/20 bg-amber-500/5 px-2 py-1 text-xs resize-y min-h-[30px] focus:outline-none focus:ring-1 focus:ring-amber-500/20 text-muted-foreground"
                  rows={2}
                />
              ) : (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <span className="text-amber-400 font-medium">Wskazówka:</span> {section.openingTechnique}
                </p>
              )}
            </div>
          </div>

          {/* Talking points */}
          <div className="space-y-3">
            {section.talkingPoints.map((point, i) => {
              if (point.type === "issue") issueIndex++;
              return (
                <TalkingPointCard
                  key={point.findingId}
                  point={point}
                  catId={section.categoryId}
                  index={point.type === "issue" ? issueIndex : 0}
                  isLast={i === section.talkingPoints.length - 1}
                  isEditing={isEditing}
                  onUpdate={(updated) => updateTalkingPoint(i, updated)}
                />
              );
            })}
          </div>

          {/* Closing line */}
          <div className="rounded-xl bg-muted/20 border border-border/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Zamknięcie sekcji</span>
            </div>
            <EditableText
              value={section.closingLine}
              onChange={(v) => onUpdate({ ...section, closingLine: v })}
              isEditing={isEditing}
              className="text-sm text-foreground/60 leading-relaxed"
              italic
              hint="Podsumuj sekcję jednym zdaniem i pokaż korzyść."
            />
          </div>

          {/* Closing sell line */}
          <div className="rounded-xl bg-gradient-to-br from-primary/5 to-transparent border border-primary/15 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Podświadoma sprzedaż — zamknięcie sekcji</span>
            </div>
            <EditableText
              value={section.closingSellLine}
              onChange={(v) => onUpdate({ ...section, closingSellLine: v })}
              isEditing={isEditing}
              className="text-sm text-foreground/70 leading-relaxed"
              italic
              hint="Wpleć ofertę naturalnie — nie sprzedawaj wprost."
            />
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main Guide View ──
interface ConversationGuideViewProps {
  sections: ConversationSection[];
  salonName: string;
  ownerName: string;
  isEditing?: boolean;
  onSectionsChange?: (sections: ConversationSection[]) => void;
}

export const ConversationGuideView = ({
  sections,
  salonName,
  ownerName,
  isEditing = false,
  onSectionsChange,
}: ConversationGuideViewProps) => {
  const [introText, setIntroText] = useState(
    `Cześć ${ownerName}! Dzwonię w sprawie audytu, który Ci przygotowałam dla ${salonName}. Przeanalizowałam dokładnie Twoje profile w social mediach i mam kilka konkretnych obserwacji — zarówno rzeczy, które robisz naprawdę dobrze, jak i obszary, gdzie widzę spory potencjał. Czy masz teraz chwilę, żebyśmy to przeszły razem?`
  );
  const [closingText, setClosingText] = useState(
    `${ownerName}, jak widzisz — masz naprawdę fajny salon i sporo rzeczy robisz dobrze. Ale widzę też konkretne obszary, gdzie tracisz klientki — i to są rzeczy, które da się naprawić. Pytanie, czy chcesz to zrobić sama, czy wolisz, żebyśmy zajęli się tym za Ciebie w ramach współpracy?`
  );

  const totalIssues = sections.reduce((sum, s) => sum + s.talkingPoints.filter(t => t.type === "issue").length, 0);
  const totalPositive = sections.reduce((sum, s) => sum + s.talkingPoints.filter(t => t.type === "positive").length, 0);
  const totalPoints = sections.reduce((sum, s) => sum + s.talkingPoints.length, 0);
  const estimatedMinutes = Math.max(15, Math.round(totalPoints * 2.5));

  const handleSectionUpdate = (index: number, updated: ConversationSection) => {
    const newSections = [...sections];
    newSections[index] = updated;
    onSectionsChange?.(newSections);
  };

  return (
    <div className="space-y-5">
      {/* Edit mode banner */}
      {isEditing && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground">Tryb edycji</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Kliknij w dowolny tekst, aby go zmienić. Rozwiń sekcje i punkty, żeby edytować szczegóły. 
              Podpowiedzi pod polami pomogą Ci dostosować schemat do konkretnej klientki.
            </p>
          </div>
        </div>
      )}

      {/* Guide intro card */}
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center flex-shrink-0">
            <Mic className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-foreground">Schemat rozmowy z {ownerName}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Poniżej znajdziesz szczegółowy schemat rozmowy dla <span className="text-foreground font-medium">{salonName}</span>.
              Każda sekcja zawiera gotowe zdania, techniki sprzedażowe, odpowiedzi na obiekcje i wskazówki.
            </p>
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <Badge variant="outline" className="text-xs gap-1 border-primary/30 text-primary">
                <BookOpen className="w-3 h-3" /> {sections.length} sekcji
              </Badge>
              <Badge variant="outline" className="text-xs gap-1 border-foreground/20 text-foreground/60">
                {totalPoints} punktów
              </Badge>
              <Badge variant="outline" className="text-xs gap-1 border-emerald-500/30 text-emerald-400">
                <CheckCircle2 className="w-3 h-3" /> {totalPositive} pozytywnych
              </Badge>
              <Badge variant="outline" className="text-xs gap-1 border-red-500/30 text-red-400">
                <AlertTriangle className="w-3 h-3" /> {totalIssues} do omówienia
              </Badge>
              <Badge variant="outline" className="text-xs gap-1 border-amber-500/30 text-amber-400">
                ~{estimatedMinutes} min rozmowy
              </Badge>
            </div>
          </div>
        </div>

        {/* Call opening script */}
        <div className="mt-4 rounded-xl bg-card/80 border border-border/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Otwarcie rozmowy</span>
          </div>
          <EditableText
            value={introText}
            onChange={setIntroText}
            isEditing={isEditing}
            className="text-sm text-foreground/80 leading-relaxed"
            italic
            hint="Personalizuj powitanie — dodaj szczegół o salonie lub ostatnim poście klientki."
          />
        </div>

        {/* Pre-call tips */}
        <div className="mt-3 rounded-xl bg-muted/30 border border-border/30 p-4 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Przed rozmową — pamiętaj</span>
          </div>
          <ul className="text-xs text-muted-foreground space-y-1.5 list-none">
            <li className="flex items-start gap-2"><span className="text-amber-400">•</span>Zacznij ZAWSZE od pozytywów — buduje zaufanie i otwartość na krytykę</li>
            <li className="flex items-start gap-2"><span className="text-amber-400">•</span>Nie sprzedawaj wprost — pokaż problemy, klientka sama zapyta o rozwiązanie</li>
            <li className="flex items-start gap-2"><span className="text-amber-400">•</span>Używaj imienia klientki — personalizacja buduje relację</li>
            <li className="flex items-start gap-2"><span className="text-amber-400">•</span>Rób pauzy po ważnych zdaniach — daj klientce czas na przemyślenie</li>
            <li className="flex items-start gap-2"><span className="text-amber-400">•</span>Nie omawiaj WSZYSTKIEGO — wybierz 2-3 najważniejsze punkty z każdej sekcji</li>
          </ul>
        </div>
      </div>

      {/* Sections */}
      {sections.map((section, i) => (
        <SectionBlock
          key={section.categoryId}
          section={section}
          sectionIndex={i}
          totalSections={sections.length}
          isEditing={isEditing}
          onUpdate={(updated) => handleSectionUpdate(i, updated)}
        />
      ))}

      {/* Closing card */}
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Target className="w-5 h-5 text-primary" />
          <span className="text-sm font-bold text-primary uppercase tracking-wider">Zamknięcie rozmowy — sprzedaż</span>
        </div>

        <div className="rounded-xl bg-card/80 border border-border/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Mic className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Co powiedzieć</span>
          </div>
          <EditableText
            value={closingText}
            onChange={setClosingText}
            isEditing={isEditing}
            className="text-sm text-foreground/80 leading-relaxed"
            italic
            hint="Dostosuj zamknięcie do wyników rozmowy. Jeśli klientka była entuzjastyczna, bądź bardziej bezpośrednia."
          />
        </div>

        <div className="rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Technika zamknięcia</span>
          </div>
          <p className="text-xs text-foreground/70 leading-relaxed">
            Nie pytaj „czy chcesz współpracę?" — daj wybór między dwoma opcjami: „sama" vs „z nami".
            Obie opcje zakładają działanie. Klientka podświadomie wybiera łatwiejszą opcję — współpracę.
            Jeśli mówi „muszę się zastanowić" → „Jasne, rozumiem. Powiedz mi tylko, co Cię najbardziej zastanawia — może mogę rozwiać wątpliwości?"
          </p>
        </div>

        <div className="rounded-xl bg-muted/20 border border-border/30 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Typowe obiekcje na końcu</span>
          </div>
          {[
            { q: "Muszę się zastanowić", a: "Jasne — a powiedz mi, nad czym konkretnie się zastanawiasz? Może mogę pomóc podjąć decyzję." },
            { q: "Nie mam na to budżetu", a: "Rozumiem. Ale pomyśl — ile klientek tracisz miesięcznie przez te rzeczy? Nawet 5 klientek × 150 zł = 750 zł/mies. Współpraca kosztuje mniej." },
            { q: "Sama to zrobię", a: "Super! Jeśli potrzebujesz pomocy, jestem dostępna. A gdybyś za miesiąc zobaczyła, że brakuje czasu — odezwij się, pomożemy." },
            { q: "Muszę porozmawiać z mężem/partnerem", a: "Oczywiście. Mogę przygotować krótkie podsumowanie, które możesz mu pokazać — z konkretnymi liczbami i efektami." },
          ].map((item, i) => (
            <div key={i} className="rounded-lg bg-muted/20 p-3 space-y-1.5">
              <div className="flex items-start gap-2">
                <Quote className="w-3 h-3 text-amber-400/60 mt-1 flex-shrink-0" />
                <p className="text-xs font-medium text-foreground/70 italic">„{item.q}"</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed pl-5">
                <span className="text-emerald-400 font-medium">→ Twoja odpowiedź:</span> {item.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
