import { useState } from "react";
import {
  MessageSquare, Lightbulb, ShieldCheck, HelpCircle, ChevronDown,
  CheckCircle2, AlertTriangle, Mic, Target, Sparkles, Quote,
  ArrowRight, Zap, TrendingUp, BookOpen, GripVertical,
  GraduationCap, Phone, Clock, Users, Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_LARGE_ICONS } from "@/components/audit/auditSections";
import type { ConversationSection, ConversationTalkingPoint } from "@/lib/conversationGuide";
import { cn } from "@/lib/utils";

// Category accent colors matching audit style
const ACCENT: Record<string, { gradient: string; bg: string; border: string; text: string; bgSubtle: string; ring: string }> = {
  facebook: { gradient: "from-blue-500 to-blue-600", bg: "bg-blue-500/15", border: "border-blue-500/25", text: "text-blue-400", bgSubtle: "bg-blue-500/5", ring: "ring-blue-500/20" },
  instagram: { gradient: "from-purple-500 to-pink-500", bg: "bg-purple-500/15", border: "border-purple-500/25", text: "text-purple-400", bgSubtle: "bg-purple-500/5", ring: "ring-purple-500/20" },
  content: { gradient: "from-teal-500 to-cyan-500", bg: "bg-teal-500/15", border: "border-teal-500/25", text: "text-teal-400", bgSubtle: "bg-teal-500/5", ring: "ring-teal-500/20" },
  stories_reels: { gradient: "from-pink-500 to-rose-500", bg: "bg-pink-500/15", border: "border-pink-500/25", text: "text-pink-400", bgSubtle: "bg-pink-500/5", ring: "ring-pink-500/20" },
  branding: { gradient: "from-amber-500 to-yellow-500", bg: "bg-amber-500/15", border: "border-amber-500/25", text: "text-amber-400", bgSubtle: "bg-amber-500/5", ring: "ring-amber-500/20" },
  competition: { gradient: "from-teal-500 to-emerald-500", bg: "bg-teal-500/15", border: "border-teal-500/25", text: "text-teal-400", bgSubtle: "bg-teal-500/5", ring: "ring-teal-500/20" },
  paid_ads: { gradient: "from-orange-500 to-red-500", bg: "bg-orange-500/15", border: "border-orange-500/25", text: "text-orange-400", bgSubtle: "bg-orange-500/5", ring: "ring-orange-500/20" },
  google_gmb: { gradient: "from-green-500 to-emerald-500", bg: "bg-green-500/15", border: "border-green-500/25", text: "text-green-400", bgSubtle: "bg-green-500/5", ring: "ring-green-500/20" },
  website: { gradient: "from-indigo-500 to-violet-500", bg: "bg-indigo-500/15", border: "border-indigo-500/25", text: "text-indigo-400", bgSubtle: "bg-indigo-500/5", ring: "ring-indigo-500/20" },
  academy: { gradient: "from-fuchsia-500 to-purple-500", bg: "bg-fuchsia-500/15", border: "border-fuchsia-500/25", text: "text-fuchsia-400", bgSubtle: "bg-fuchsia-500/5", ring: "ring-fuchsia-500/20" },
};

const getAccent = (catId: string) => ACCENT[catId] || ACCENT.content;

// ── Editable Text Block ──
const EditableText = ({
  value, onChange, isEditing, className, italic = false, hint,
}: {
  value: string; onChange: (v: string) => void; isEditing: boolean;
  className?: string; italic?: boolean; hint?: string;
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

// ── Single Talking Point ──
const TalkingPointCard = ({
  point, catId, index, isLast, isEditing, onUpdate,
}: {
  point: ConversationTalkingPoint; catId: string; index: number;
  isLast: boolean; isEditing: boolean;
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
      "rounded-xl border overflow-hidden transition-all duration-200",
      isPositive
        ? "border-emerald-500/20 bg-emerald-500/[0.02]"
        : "border-border/40 bg-card/30",
    )}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-muted/10 transition-colors"
      >
        {isEditing && <GripVertical className="w-3.5 h-3.5 text-muted-foreground/30 flex-shrink-0" />}
        <div className={cn(
          "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold",
          isPositive ? "bg-emerald-500/15 text-emerald-400" : `${a.bg} ${a.text}`
        )}>
          {isPositive ? <CheckCircle2 className="w-4 h-4" /> : <span>{index}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={cn("text-sm font-medium", isPositive ? "text-emerald-300" : "text-foreground")}>
              {point.label}
            </p>
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-border/40 text-muted-foreground/70">
              {point.subSectionName}
            </Badge>
          </div>
        </div>
        <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground/50 transition-transform", expanded && "rotate-180")} />
      </button>

      {expanded && (
        <div className="border-t border-border/20 px-4 pb-4 space-y-3 pt-3">
          {/* What to say */}
          <div className="rounded-lg bg-muted/20 border border-border/20 p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Mic className={cn("w-3.5 h-3.5", a.text)} />
              <span className={cn("text-[10px] font-bold uppercase tracking-wider", a.text)}>Co powiedzieć</span>
            </div>
            <EditableText
              value={point.introduction}
              onChange={(v) => updateField("introduction", v)}
              isEditing={isEditing}
              className="text-xs text-foreground/80 leading-relaxed"
              italic
            />
          </div>

          {/* How to explain */}
          <div className="rounded-lg bg-muted/15 border border-border/20 p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-foreground/50" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">Jak wytłumaczyć</span>
            </div>
            <EditableText
              value={point.whatToSay}
              onChange={(v) => updateField("whatToSay", v)}
              isEditing={isEditing}
              className="text-xs text-foreground/70 leading-relaxed"
            />
          </div>

          {/* Sales angle */}
          <div className={cn("rounded-lg border p-3", a.bgSubtle, a.border)}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Target className={cn("w-3.5 h-3.5", a.text)} />
              <span className={cn("text-[10px] font-bold uppercase tracking-wider", a.text)}>Jak sprzedać</span>
            </div>
            <EditableText
              value={point.howToSell}
              onChange={(v) => updateField("howToSell", v)}
              isEditing={isEditing}
              className="text-xs text-foreground/70 leading-relaxed"
            />
          </div>

          {/* Technique pill */}
          <div className="rounded-lg bg-gradient-to-r from-primary/5 to-transparent border border-primary/15 p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Technika</span>
            </div>
            <EditableText
              value={point.salesTechnique}
              onChange={(v) => updateField("salesTechnique", v)}
              isEditing={isEditing}
              className="text-xs text-foreground/70 leading-relaxed"
            />
          </div>

          {/* Q&A */}
          {point.possibleQuestions.length > 0 && (
            <div className="rounded-lg bg-muted/10 border border-border/20 p-3 space-y-2">
              <div className="flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Obiekcje</span>
              </div>
              {point.possibleQuestions.map((q, qi) => (
                <div key={qi} className="rounded-md bg-muted/15 p-2 space-y-1">
                  {isEditing ? (
                    <div className="space-y-1.5">
                      <textarea value={q.question} onChange={(e) => { const u = [...point.possibleQuestions]; u[qi] = { ...u[qi], question: e.target.value }; updateField("possibleQuestions", u); }}
                        className="w-full rounded border border-amber-500/20 bg-amber-500/5 px-2 py-1 text-[11px] resize-y min-h-[24px] focus:outline-none text-foreground" rows={1} />
                      <textarea value={q.answer} onChange={(e) => { const u = [...point.possibleQuestions]; u[qi] = { ...u[qi], answer: e.target.value }; updateField("possibleQuestions", u); }}
                        className="w-full rounded border border-emerald-500/20 bg-emerald-500/5 px-2 py-1 text-[11px] resize-y min-h-[24px] focus:outline-none text-foreground" rows={1} />
                    </div>
                  ) : (
                    <>
                      <p className="text-[11px] font-medium text-foreground/60 italic flex items-start gap-1.5">
                        <Quote className="w-2.5 h-2.5 text-amber-400/50 mt-0.5 flex-shrink-0" /> „{q.question}"
                      </p>
                      <p className="text-[11px] text-muted-foreground pl-4">
                        <span className="text-emerald-400 font-medium">→</span> {q.answer}
                      </p>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Transition */}
          {!isLast && (
            <div className="flex items-center gap-2 pt-1">
              <ArrowRight className="w-3 h-3 text-muted-foreground/40 flex-shrink-0" />
              {isEditing ? (
                <textarea value={point.transitionToNext} onChange={(e) => updateField("transitionToNext", e.target.value)}
                  className="w-full rounded border border-border/20 bg-muted/10 px-2 py-1 text-[11px] resize-none focus:outline-none text-muted-foreground italic" rows={1} />
              ) : (
                <p className="text-[11px] text-muted-foreground/60 italic">„{point.transitionToNext}"</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Section Card (one per audit category) ──
const SectionBlock = ({
  section, sectionIndex, totalSections, isEditing, onUpdate,
}: {
  section: ConversationSection; sectionIndex: number; totalSections: number;
  isEditing: boolean; onUpdate: (updated: ConversationSection) => void;
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const a = getAccent(section.categoryId);
  const icon = section.categoryId === "academy"
    ? <GraduationCap className="w-7 h-7" />
    : CATEGORY_LARGE_ICONS[section.categoryId];
  const positiveCount = section.talkingPoints.filter(t => t.type === "positive").length;
  const issueCount = section.talkingPoints.filter(t => t.type === "issue").length;
  const estMinutes = Math.max(3, Math.round(section.talkingPoints.length * 2.5));

  let issueIndex = 0;

  const updateTalkingPoint = (tpIndex: number, updated: ConversationTalkingPoint) => {
    const newPoints = [...section.talkingPoints];
    newPoints[tpIndex] = updated;
    onUpdate({ ...section, talkingPoints: newPoints });
  };

  return (
    <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
      {/* Header with gradient accent bar */}
      <button onClick={() => setCollapsed(!collapsed)} className="w-full text-left">
        <div className="relative">
          {/* Top accent bar */}
          <div className={cn("h-1 w-full bg-gradient-to-r", a.gradient)} />
          <div className="p-5 flex items-center gap-4">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center border", a.bg, a.border)}>
              <span className={a.text}>{icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  Sekcja {sectionIndex + 1}/{totalSections}
                </span>
              </div>
              <h2 className="text-base font-bold text-foreground">{section.categoryName}</h2>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant="outline" className="text-[10px] h-5 gap-1 border-border/40 text-muted-foreground">
                  <Clock className="w-3 h-3" /> ~{estMinutes} min
                </Badge>
                {positiveCount > 0 && (
                  <Badge variant="outline" className="text-[10px] h-5 gap-1 border-emerald-500/25 text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" /> {positiveCount}
                  </Badge>
                )}
                {issueCount > 0 && (
                  <Badge variant="outline" className="text-[10px] h-5 gap-1 border-red-500/25 text-red-400">
                    <AlertTriangle className="w-3 h-3" /> {issueCount}
                  </Badge>
                )}
              </div>
            </div>
            <ChevronDown className={cn("w-5 h-5 text-muted-foreground/50 transition-transform", !collapsed && "rotate-180")} />
          </div>
        </div>
      </button>

      {!collapsed && (
        <div className="px-5 pb-5 space-y-3">
          {/* Opening line */}
          <div className={cn("rounded-xl border p-4", a.bgSubtle, a.border)}>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className={cn("w-4 h-4", a.text)} />
              <span className={cn("text-[10px] font-bold uppercase tracking-wider", a.text)}>Otwierające zdanie</span>
            </div>
            <EditableText
              value={section.openingLine}
              onChange={(v) => onUpdate({ ...section, openingLine: v })}
              isEditing={isEditing}
              className="text-sm text-foreground/80 leading-relaxed"
              italic
              hint="Personalizuj — dodaj szczegół z profilu klientki."
            />
          </div>

          {/* Technique tip */}
          <div className="rounded-lg bg-muted/15 border border-border/20 p-3 flex items-start gap-2">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
            {isEditing ? (
              <textarea value={section.openingTechnique} onChange={(e) => onUpdate({ ...section, openingTechnique: e.target.value })}
                className="w-full rounded border border-amber-500/20 bg-amber-500/5 px-2 py-1 text-xs resize-y min-h-[24px] focus:outline-none text-muted-foreground" rows={2} />
            ) : (
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="text-amber-400 font-medium">Wskazówka:</span> {section.openingTechnique}
              </p>
            )}
          </div>

          {/* Talking points */}
          <div className="space-y-2">
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

          {/* Closing */}
          <div className="rounded-lg bg-muted/15 border border-border/20 p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground/60" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Zamknięcie sekcji</span>
            </div>
            <EditableText
              value={section.closingLine}
              onChange={(v) => onUpdate({ ...section, closingLine: v })}
              isEditing={isEditing}
              className="text-xs text-foreground/60 leading-relaxed"
              italic
            />
          </div>

          {/* Sell closing */}
          <div className="rounded-lg bg-gradient-to-r from-primary/5 to-transparent border border-primary/15 p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Sprzedaż</span>
            </div>
            <EditableText
              value={section.closingSellLine}
              onChange={(v) => onUpdate({ ...section, closingSellLine: v })}
              isEditing={isEditing}
              className="text-xs text-foreground/60 leading-relaxed"
              italic
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
  sections, salonName, ownerName, isEditing = false, onSectionsChange,
}: ConversationGuideViewProps) => {
  const [introText, setIntroText] = useState(
    `Cześć ${ownerName}! Dzwonię w sprawie audytu, który przygotowałam dla ${salonName}. Przeanalizowałam Twoje profile i mam kilka konkretnych obserwacji. Czy masz teraz chwilę, żebyśmy to przeszły razem?`
  );
  const [closingText, setClosingText] = useState(
    `${ownerName}, jak widzisz — masz naprawdę fajny salon i sporo rzeczy robisz dobrze. Ale widzę też konkretne obszary, gdzie tracisz klientki. Pytanie, czy chcesz to zrobić sama, czy wolisz, żebyśmy zajęli się tym za Ciebie?`
  );

  const totalIssues = sections.reduce((sum, s) => sum + s.talkingPoints.filter(t => t.type === "issue").length, 0);
  const totalPositive = sections.reduce((sum, s) => sum + s.talkingPoints.filter(t => t.type === "positive").length, 0);
  const totalPoints = sections.reduce((sum, s) => sum + s.talkingPoints.length, 0);
  const estimatedMinutes = Math.max(10, Math.round(totalPoints * 2.5));
  const hasAcademy = sections.some(s => s.categoryId === "academy");

  const handleSectionUpdate = (index: number, updated: ConversationSection) => {
    const newSections = [...sections];
    newSections[index] = updated;
    onSectionsChange?.(newSections);
  };

  return (
    <div className="space-y-4">
      {/* Edit mode banner */}
      {isEditing && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            <span className="text-foreground font-medium">Tryb edycji.</span> Kliknij tekst aby zmienić. Rozwiń punkty aby edytować szczegóły.
          </p>
        </div>
      )}

      {/* ── HEADER CARD ── */}
      <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
        {/* Gradient top */}
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-pink-500 to-fuchsia-500" />
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
              <Phone className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-foreground">Schemat rozmowy</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {salonName} — {ownerName}
              </p>

              {/* Stats row */}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 rounded-lg px-2.5 py-1 border border-border/30">
                  <BookOpen className="w-3 h-3" /> {sections.length} sekcji
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 rounded-lg px-2.5 py-1 border border-border/30">
                  <Clock className="w-3 h-3" /> ~{estimatedMinutes} min
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 rounded-lg px-2.5 py-1 border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" /> {totalPositive} OK
                </div>
                <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 rounded-lg px-2.5 py-1 border border-red-500/20">
                  <AlertTriangle className="w-3 h-3" /> {totalIssues} do omówienia
                </div>
                {hasAcademy && (
                  <div className="flex items-center gap-1.5 text-xs text-fuchsia-400 bg-fuchsia-500/10 rounded-lg px-2.5 py-1 border border-fuchsia-500/20">
                    <GraduationCap className="w-3 h-3" /> Academy
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section overview - mini nav */}
          <div className="mt-4 flex items-center gap-1.5 flex-wrap">
            {sections.map((s, i) => {
              const ac = getAccent(s.categoryId);
              return (
                <div key={s.categoryId} className={cn(
                  "flex items-center gap-1 text-[10px] font-medium rounded-md px-2 py-0.5 border",
                  ac.bg, ac.border, ac.text
                )}>
                  <span>{i + 1}.</span> {s.categoryName}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── OPENING SCRIPT ── */}
      <div className="rounded-2xl border border-border/40 bg-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Mic className="w-4 h-4 text-primary" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Otwarcie rozmowy</span>
            <p className="text-[10px] text-muted-foreground">Pierwsze 30 sekund decyduje o tonie całej rozmowy</p>
          </div>
        </div>
        <div className="rounded-xl bg-muted/20 border border-border/20 p-4">
          <EditableText
            value={introText}
            onChange={setIntroText}
            isEditing={isEditing}
            className="text-sm text-foreground/80 leading-relaxed"
            italic
            hint="Personalizuj — dodaj szczegół o salonie lub ostatnim poście klientki."
          />
        </div>

        {/* Quick tips */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { icon: <Star className="w-3 h-3 text-amber-400" />, text: "Zacznij od pozytywów — buduje otwartość" },
            { icon: <Users className="w-3 h-3 text-blue-400" />, text: "Używaj imienia — personalizacja buduje relację" },
            { icon: <Target className="w-3 h-3 text-emerald-400" />, text: "Nie sprzedawaj wprost — pokaż problemy" },
            { icon: <Clock className="w-3 h-3 text-purple-400" />, text: "Rób pauzy po ważnych zdaniach" },
          ].map((tip, i) => (
            <div key={i} className="flex items-center gap-2 text-[11px] text-muted-foreground/80 bg-muted/10 rounded-lg px-3 py-2 border border-border/15">
              {tip.icon} {tip.text}
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTIONS ── */}
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

      {/* ── CLOSING CARD ── */}
      <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-emerald-500 to-teal-500" />
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Target className="w-4 h-4 text-primary" />
            </div>
            <div>
              <span className="text-sm font-bold text-foreground">Zamknięcie rozmowy</span>
              <p className="text-[10px] text-muted-foreground">Naturalne przejście do oferty współpracy</p>
            </div>
          </div>

          <div className="rounded-xl bg-muted/20 border border-border/20 p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Mic className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Co powiedzieć</span>
            </div>
            <EditableText
              value={closingText}
              onChange={setClosingText}
              isEditing={isEditing}
              className="text-sm text-foreground/80 leading-relaxed"
              italic
            />
          </div>

          <div className="rounded-xl bg-gradient-to-r from-primary/5 to-transparent border border-primary/15 p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Technika zamknięcia</span>
            </div>
            <p className="text-xs text-foreground/70 leading-relaxed">
              Daj wybór: „sama" vs „z nami" — obie opcje zakładają działanie. Klientka podświadomie wybiera łatwiejszą.
              Jeśli mówi „muszę się zastanowić" → „Jasne, powiedz mi co Cię najbardziej zastanawia?"
            </p>
          </div>

          {/* Common objections */}
          <div className="rounded-xl bg-muted/10 border border-border/20 p-4 space-y-2">
            <div className="flex items-center gap-1.5 mb-1">
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Typowe obiekcje</span>
            </div>
            {[
              { q: "Muszę się zastanowić", a: "Jasne — nad czym konkretnie się zastanawiasz? Może mogę pomóc." },
              { q: "Nie mam budżetu", a: "Ile klientek tracisz miesięcznie? Nawet 5 × 150 zł = 750 zł. Współpraca kosztuje mniej." },
              { q: "Sama to zrobię", a: "Super! A gdybyś za miesiąc zobaczyła, że brakuje czasu — odezwij się." },
              { q: "Muszę porozmawiać z mężem", a: "Oczywiście. Mogę przygotować podsumowanie z konkretnymi liczbami." },
            ].map((item, i) => (
              <div key={i} className="rounded-md bg-muted/15 p-2.5 space-y-1">
                <p className="text-[11px] font-medium text-foreground/60 italic flex items-start gap-1.5">
                  <Quote className="w-2.5 h-2.5 text-amber-400/50 mt-0.5 flex-shrink-0" /> „{item.q}"
                </p>
                <p className="text-[11px] text-muted-foreground pl-4">
                  <span className="text-emerald-400 font-medium">→</span> {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
