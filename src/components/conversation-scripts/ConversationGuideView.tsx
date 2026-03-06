import { useState } from "react";
import {
  MessageSquare, Lightbulb, ShieldCheck, HelpCircle, ChevronDown,
  CheckCircle2, AlertTriangle, Mic, Target, Sparkles, Quote,
  ArrowRight, Zap, TrendingUp, BookOpen, GripVertical, GraduationCap,
  Clock, Phone,
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

// ── Single Talking Point Card ──
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
        ? "border-emerald-500/20 bg-emerald-500/[0.03]"
        : "border-border/40 bg-card/60",
      isEditing && "ring-1 ring-primary/10"
    )}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-3.5 sm:p-4 flex items-start gap-3 hover:bg-muted/20 transition-colors"
      >
        {isEditing && (
          <GripVertical className="w-4 h-4 text-muted-foreground/40 mt-0.5 flex-shrink-0" />
        )}
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold",
          isPositive
            ? "bg-emerald-500/15 text-emerald-400"
            : `${a.bg} ${a.text}`
        )}>
          {isPositive ? <CheckCircle2 className="w-4 h-4" /> : <span>{index}</span>}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={cn("text-sm font-semibold leading-tight", isPositive ? "text-emerald-300" : "text-foreground")}>
              {point.label}
            </p>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">{point.subSectionName}</p>
        </div>

        <ChevronDown className={cn(
          "w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform mt-0.5",
          expanded && "rotate-180"
        )} />
      </button>

      {expanded && (
        <div className="border-t border-border/20 px-3.5 sm:px-4 pb-4 space-y-3 pt-3">
          {/* Intro */}
          <div className="rounded-lg bg-muted/30 border border-border/20 p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <Mic className={cn("w-3.5 h-3.5", a.text)} />
              <span className={cn("text-[10px] font-bold uppercase tracking-wider", a.text)}>Co powiedzieć</span>
            </div>
            <EditableText
              value={point.introduction}
              onChange={(v) => updateField("introduction", v)}
              isEditing={isEditing}
              className="text-xs text-foreground/90 leading-relaxed"
              italic
            />
          </div>

          {/* What to say */}
          <div className="rounded-lg bg-muted/30 border border-border/20 p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-foreground/60" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/60">Jak wytłumaczyć</span>
            </div>
            <EditableText
              value={point.whatToSay}
              onChange={(v) => updateField("whatToSay", v)}
              isEditing={isEditing}
              className="text-xs text-foreground/80 leading-relaxed"
            />
          </div>

          {/* How to sell */}
          <div className={cn("rounded-lg border p-3", a.bgSubtle, a.border)}>
            <div className="flex items-center gap-2 mb-1.5">
              <Target className={cn("w-3.5 h-3.5", a.text)} />
              <span className={cn("text-[10px] font-bold uppercase tracking-wider", a.text)}>Jak sprzedać</span>
            </div>
            <EditableText
              value={point.howToSell}
              onChange={(v) => updateField("howToSell", v)}
              isEditing={isEditing}
              className="text-xs text-foreground/80 leading-relaxed"
            />
          </div>

          {/* Sales technique */}
          <div className="rounded-lg bg-gradient-to-br from-primary/5 to-transparent border border-primary/15 p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Technika</span>
            </div>
            <EditableText
              value={point.salesTechnique}
              onChange={(v) => updateField("salesTechnique", v)}
              isEditing={isEditing}
              className="text-xs text-foreground/80 leading-relaxed"
            />
          </div>

          {/* Possible questions - show max 2 by default */}
          {point.possibleQuestions.length > 0 && (
            <div className="rounded-lg bg-muted/15 border border-border/20 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Obiekcje klientki</span>
              </div>
              {point.possibleQuestions.slice(0, 2).map((q, qi) => (
                <div key={qi} className="rounded-md bg-muted/20 p-2 space-y-1">
                  {isEditing ? (
                    <div className="space-y-1.5">
                      <textarea
                        value={q.question}
                        onChange={(e) => {
                          const updated = [...point.possibleQuestions];
                          updated[qi] = { ...updated[qi], question: e.target.value };
                          updateField("possibleQuestions", updated);
                        }}
                        className="w-full rounded border border-amber-500/20 bg-amber-500/5 px-2 py-1 text-[11px] resize-none focus:outline-none text-foreground"
                        rows={1}
                      />
                      <textarea
                        value={q.answer}
                        onChange={(e) => {
                          const updated = [...point.possibleQuestions];
                          updated[qi] = { ...updated[qi], answer: e.target.value };
                          updateField("possibleQuestions", updated);
                        }}
                        className="w-full rounded border border-emerald-500/20 bg-emerald-500/5 px-2 py-1 text-[11px] resize-none focus:outline-none text-foreground"
                        rows={2}
                      />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start gap-1.5">
                        <Quote className="w-2.5 h-2.5 text-amber-400/60 mt-0.5 flex-shrink-0" />
                        <p className="text-[11px] font-medium text-foreground/70 italic">„{q.question}"</p>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed pl-4">
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
            <div className="rounded-md bg-muted/10 border border-border/15 p-2 flex items-center gap-2">
              <ArrowRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              {isEditing ? (
                <textarea
                  value={point.transitionToNext}
                  onChange={(e) => updateField("transitionToNext", e.target.value)}
                  className="w-full rounded border border-border/20 bg-transparent px-2 py-1 text-[11px] resize-none focus:outline-none text-muted-foreground italic"
                  rows={1}
                />
              ) : (
                <p className="text-[11px] text-muted-foreground italic">„{point.transitionToNext}"</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Section Component ──
const SectionBlock = ({
  section, sectionIndex, totalSections, isEditing, onUpdate,
}: {
  section: ConversationSection; sectionIndex: number; totalSections: number;
  isEditing: boolean; onUpdate: (updated: ConversationSection) => void;
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const a = getAccent(section.categoryId);
  const icon = CATEGORY_LARGE_ICONS[section.categoryId];
  const positiveCount = section.talkingPoints.filter(t => t.type === "positive").length;
  const issueCount = section.talkingPoints.filter(t => t.type === "issue").length;
  const estimatedMin = Math.max(2, Math.round(section.talkingPoints.length * 2.5));

  let issueIndex = 0;

  const updateTalkingPoint = (tpIndex: number, updated: ConversationTalkingPoint) => {
    const newPoints = [...section.talkingPoints];
    newPoints[tpIndex] = updated;
    onUpdate({ ...section, talkingPoints: newPoints });
  };

  return (
    <div className={cn("rounded-2xl border border-border/40 bg-card overflow-hidden", isEditing && "ring-1 ring-primary/10")}>
      {/* Category Header */}
      <button onClick={() => setCollapsed(!collapsed)} className="w-full text-left">
        <div className="relative p-4 sm:p-5 overflow-hidden">
          <div className={cn("absolute inset-0 bg-gradient-to-r opacity-[0.04]", a.gradient)} />
          <div className="relative flex items-center gap-3">
            <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center border", a.bg, a.border)}>
              <span className={a.text}>{icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-foreground">{section.categoryName}</h2>
                <span className="text-[10px] text-muted-foreground">Sekcja {sectionIndex + 1}/{totalSections}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                {positiveCount > 0 && (
                  <Badge variant="outline" className="text-[9px] py-0 h-5 border-emerald-500/30 text-emerald-400 gap-0.5">
                    <CheckCircle2 className="w-2.5 h-2.5" /> {positiveCount} OK
                  </Badge>
                )}
                {issueCount > 0 && (
                  <Badge variant="outline" className="text-[9px] py-0 h-5 border-red-500/30 text-red-400 gap-0.5">
                    <AlertTriangle className="w-2.5 h-2.5" /> {issueCount} problemy
                  </Badge>
                )}
                <Badge variant="outline" className="text-[9px] py-0 h-5 border-border/40 text-muted-foreground gap-0.5">
                  <Clock className="w-2.5 h-2.5" /> ~{estimatedMin} min
                </Badge>
                {section.includeAcademy && (
                  <Badge variant="outline" className="text-[9px] py-0 h-5 border-pink-500/30 text-pink-400 gap-0.5">
                    <GraduationCap className="w-2.5 h-2.5" /> Academy
                  </Badge>
                )}
              </div>
            </div>
            <ChevronDown className={cn(
              "w-4 h-4 text-muted-foreground transition-transform",
              !collapsed && "rotate-180"
            )} />
          </div>
        </div>
      </button>

      {!collapsed && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-3">
          {/* Opening line */}
          <div className={cn("rounded-xl border p-3", a.bgSubtle, a.border)}>
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className={cn("w-3.5 h-3.5", a.text)} />
              <span className={cn("text-[10px] font-bold uppercase tracking-wider", a.text)}>Otwierające zdanie</span>
            </div>
            <EditableText
              value={section.openingLine}
              onChange={(v) => onUpdate({ ...section, openingLine: v })}
              isEditing={isEditing}
              className="text-xs text-foreground/80 leading-relaxed"
              italic
            />
          </div>

          {/* Tip */}
          <div className="rounded-lg bg-muted/15 border border-border/20 p-2.5 flex items-start gap-2">
            <Lightbulb className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
            {isEditing ? (
              <textarea
                value={section.openingTechnique}
                onChange={(e) => onUpdate({ ...section, openingTechnique: e.target.value })}
                className="w-full rounded border border-amber-500/20 bg-amber-500/5 px-2 py-1 text-[11px] resize-y focus:outline-none text-muted-foreground"
                rows={2}
              />
            ) : (
              <p className="text-[11px] text-muted-foreground leading-relaxed">{section.openingTechnique}</p>
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

          {/* Academy hint if applicable */}
          {section.includeAcademy && (
            <div className="rounded-xl border border-pink-500/20 bg-gradient-to-br from-pink-500/5 to-purple-500/5 p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-pink-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-pink-400">Wspomnij o Aurine Academy</span>
              </div>
              <p className="text-xs text-foreground/70 leading-relaxed italic">
                „A wiesz co? Te wszystkie rzeczy, o których rozmawiamy, masz rozłożone krok po kroku w naszej aplikacji — Aurine Academy. 
                To taki prywatny kurs z materiałami video i checklistami, dostępny tylko dla naszych klientek. Możesz się uczyć w swoim tempie."
              </p>
            </div>
          )}

          {/* Closing */}
          <div className="rounded-lg bg-muted/15 border border-border/20 p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Zamknięcie sekcji</span>
            </div>
            <EditableText
              value={section.closingLine}
              onChange={(v) => onUpdate({ ...section, closingLine: v })}
              isEditing={isEditing}
              className="text-xs text-foreground/60 leading-relaxed"
              italic
            />
          </div>

          {/* Closing sell */}
          <div className="rounded-lg bg-gradient-to-br from-primary/5 to-transparent border border-primary/15 p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Sprzedaż</span>
            </div>
            <EditableText
              value={section.closingSellLine}
              onChange={(v) => onUpdate({ ...section, closingSellLine: v })}
              isEditing={isEditing}
              className="text-xs text-foreground/70 leading-relaxed"
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
  const hasAcademy = sections.some(s => s.includeAcademy);

  const [introText, setIntroText] = useState(
    `Cześć ${ownerName}! Dzwonię w sprawie audytu, który przygotowałam dla ${salonName}. Przeanalizowałam Twoje profile w social mediach i mam kilka konkretnych obserwacji — rzeczy, które robisz dobrze, i obszary z potencjałem. Masz chwilę?`
  );
  const [closingText, setClosingText] = useState(
    `${ownerName}, jak widzisz — masz fajny salon i sporo robisz dobrze. Ale widzę konkretne obszary, gdzie tracisz klientki — i to są rzeczy do naprawienia. Chcesz to zrobić sama, czy wolisz żebyśmy zajęli się tym w ramach współpracy?`
  );

  const totalIssues = sections.reduce((sum, s) => sum + s.talkingPoints.filter(t => t.type === "issue").length, 0);
  const totalPositive = sections.reduce((sum, s) => sum + s.talkingPoints.filter(t => t.type === "positive").length, 0);
  const totalPoints = sections.reduce((sum, s) => sum + s.talkingPoints.length, 0);
  const estimatedMinutes = Math.max(10, Math.round(totalPoints * 2.5));

  const handleSectionUpdate = (index: number, updated: ConversationSection) => {
    const newSections = [...sections];
    newSections[index] = updated;
    onSectionsChange?.(newSections);
  };

  return (
    <div className="space-y-4">
      {/* Edit mode banner */}
      {isEditing && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 flex items-start gap-2.5">
          <Lightbulb className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground">Tryb edycji</p>
            <p className="text-xs text-muted-foreground">Kliknij w tekst aby edytować. Rozwiń sekcje żeby zmienić szczegóły.</p>
          </div>
        </div>
      )}

      {/* ── INTRO CARD ── */}
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center flex-shrink-0">
            <Phone className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-foreground">Schemat rozmowy z {ownerName}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{salonName}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="outline" className="text-[9px] py-0 h-5 border-primary/30 text-primary gap-0.5">
                <BookOpen className="w-2.5 h-2.5" /> {sections.length} sekcji
              </Badge>
              <Badge variant="outline" className="text-[9px] py-0 h-5 border-foreground/20 text-foreground/60">
                {totalPoints} punktów
              </Badge>
              <Badge variant="outline" className="text-[9px] py-0 h-5 border-emerald-500/30 text-emerald-400 gap-0.5">
                <CheckCircle2 className="w-2.5 h-2.5" /> {totalPositive} OK
              </Badge>
              <Badge variant="outline" className="text-[9px] py-0 h-5 border-red-500/30 text-red-400 gap-0.5">
                <AlertTriangle className="w-2.5 h-2.5" /> {totalIssues} problemy
              </Badge>
              <Badge variant="outline" className="text-[9px] py-0 h-5 border-amber-500/30 text-amber-400 gap-0.5">
                <Clock className="w-2.5 h-2.5" /> ~{estimatedMinutes} min
              </Badge>
              {hasAcademy && (
                <Badge variant="outline" className="text-[9px] py-0 h-5 border-pink-500/30 text-pink-400 gap-0.5">
                  <GraduationCap className="w-2.5 h-2.5" /> Academy
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Opening script */}
        <div className="mt-3 rounded-xl bg-card/80 border border-border/30 p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <Mic className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Otwarcie rozmowy</span>
          </div>
          <EditableText
            value={introText}
            onChange={setIntroText}
            isEditing={isEditing}
            className="text-xs text-foreground/80 leading-relaxed"
            italic
          />
        </div>

        {/* Pre-call tips */}
        <div className="mt-2 rounded-lg bg-muted/20 border border-border/20 p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <Lightbulb className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Pamiętaj</span>
          </div>
          <ul className="text-[11px] text-muted-foreground space-y-1 list-none">
            <li className="flex items-start gap-1.5"><span className="text-amber-400">•</span>Zacznij od pozytywów — buduje zaufanie</li>
            <li className="flex items-start gap-1.5"><span className="text-amber-400">•</span>Nie sprzedawaj wprost — pokaż problemy</li>
            <li className="flex items-start gap-1.5"><span className="text-amber-400">•</span>Używaj imienia klientki</li>
            <li className="flex items-start gap-1.5"><span className="text-amber-400">•</span>Wybierz 2-3 najważniejsze punkty z sekcji</li>
          </ul>
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

      {/* ── ACADEMY CLOSING (if applicable) ── */}
      {hasAcademy && (
        <div className="rounded-2xl border border-pink-500/20 bg-gradient-to-br from-pink-500/5 via-purple-500/5 to-transparent p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/15 border border-pink-500/25 flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Aurine Academy — dodatkowy argument</h3>
              <p className="text-[11px] text-muted-foreground">Wspomnij przed zamknięciem rozmowy</p>
            </div>
          </div>
          <div className="rounded-xl bg-card/60 border border-pink-500/15 p-3">
            <p className="text-xs text-foreground/80 leading-relaxed italic">
              „{ownerName}, na koniec chcę Ci powiedzieć o czymś, co dajemy tylko naszym klientkom — to Aurine Academy, nasza prywatna aplikacja z kursami, 
              checklistami i materiałami video. Wszystko o czym dzisiaj rozmawiałyśmy, masz tam rozłożone krok po kroku. 
              To nie jest dodatkowy koszt — to wchodzi w zakres współpracy. Więc nawet jeśli nie wszystko zrobimy od razu, 
              Ty i tak uczysz się i rozwijasz salon."
            </p>
          </div>
        </div>
      )}

      {/* ── CLOSING CARD ── */}
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-primary uppercase tracking-wider">Zamknięcie — sprzedaż</span>
        </div>

        <div className="rounded-xl bg-card/80 border border-border/30 p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <Mic className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Co powiedzieć</span>
          </div>
          <EditableText
            value={closingText}
            onChange={setClosingText}
            isEditing={isEditing}
            className="text-xs text-foreground/80 leading-relaxed"
            italic
          />
        </div>

        <div className="rounded-lg bg-gradient-to-br from-primary/8 to-transparent border border-primary/15 p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Technika zamknięcia</span>
          </div>
          <p className="text-[11px] text-foreground/70 leading-relaxed">
            Daj wybór: „sama" vs „z nami" — obie opcje zakładają działanie. Klientka podświadomie wybiera łatwiejsze.
            Na „muszę się zastanowić" → „Jasne, powiedz co Cię zastanawia — może rozwiążę wątpliwości."
          </p>
        </div>

        <div className="rounded-lg bg-muted/15 border border-border/20 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Obiekcje końcowe</span>
          </div>
          {[
            { q: "Muszę się zastanowić", a: "Nad czym konkretnie? Może mogę pomóc podjąć decyzję." },
            { q: "Nie mam budżetu", a: "Ile klientek tracisz miesięcznie? Nawet 5 × 150 zł = 750 zł/mies. Współpraca kosztuje mniej." },
            { q: "Sama to zrobię", a: "Super! Jakby za miesiąc zabrakło czasu — odezwij się." },
          ].map((item, i) => (
            <div key={i} className="rounded-md bg-muted/20 p-2 space-y-1">
              <div className="flex items-start gap-1.5">
                <Quote className="w-2.5 h-2.5 text-amber-400/60 mt-0.5 flex-shrink-0" />
                <p className="text-[11px] font-medium text-foreground/70 italic">„{item.q}"</p>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed pl-4">
                <span className="text-emerald-400 font-medium">→</span> {item.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
