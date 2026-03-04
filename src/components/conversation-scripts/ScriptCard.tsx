import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileSearch, Phone, Calendar, User, MapPin, GraduationCap, ChevronDown } from "lucide-react";
import { DocumentThumbnail } from "@/components/document/DocumentThumbnail";
import { ConversationScriptRow } from "@/hooks/useConversationScriptsDB";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type BucketType = "today" | "future" | "overdue" | "history";

interface ScriptCardProps {
  item: ConversationScriptRow;
  bucket: BucketType;
  auditDoc: any | null;
  owner?: string;
  city?: string;
  creatorName?: string | null;
  hasAcademy: boolean;
  localMark?: { status: string; outcome?: string | null; conductor_name?: string | null; conversation_date?: string | null } | null;
  outcomeLabels: Record<string, string>;
  typeColors: Record<string, string>;
  onNavigate: (id: string) => void;
  onQuickMark: (item: ConversationScriptRow, outcome: string) => void;
  onEdit: (item: ConversationScriptRow) => void;
}

const bucketStyles: Record<BucketType, { border: string; badge: string; badgeText: string; label: string }> = {
  today: {
    border: "border-amber-500/40 hover:border-amber-500/60",
    badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    badgeText: "Na dziś",
    label: "dzisiaj",
  },
  future: {
    border: "border-sky-500/30 hover:border-sky-500/50",
    badge: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    badgeText: "Zaplanowane",
    label: "przyszłe",
  },
  overdue: {
    border: "border-red-500/40 hover:border-red-500/60",
    badge: "bg-red-500/15 text-red-400 border-red-500/30",
    badgeText: "Zaległy",
    label: "zaległy",
  },
  history: {
    border: "border-border/50 hover:border-border",
    badge: "bg-muted/50 text-muted-foreground border-border/50",
    badgeText: "Zakończony",
    label: "historia",
  },
};

export function ScriptCard({
  item, bucket, auditDoc, owner, city, creatorName, hasAcademy,
  localMark, outcomeLabels, typeColors, onNavigate, onQuickMark, onEdit,
}: ScriptCardProps) {
  const style = bucketStyles[bucket];
  const effStatus = localMark?.status || item.status;
  const isSold = effStatus === "sprzedany";
  const displayDate = item.sent_date ? new Date(item.sent_date).toLocaleDateString("pl-PL") : null;
  const conversationDateRaw = localMark?.conversation_date || item.conversation_date || item.sent_date;
  const conversationDate = conversationDateRaw ? new Date(conversationDateRaw).toLocaleDateString("pl-PL") : null;
  const conductorName = localMark?.conductor_name || item.conductor_name || creatorName || item.guardian_name;
  const outcome = localMark?.outcome || item.outcome;
  const isCompleted = effStatus === "zrealizowany" || effStatus === "sprzedany";

  return (
    <div
      className={`group flex items-stretch gap-4 p-4 rounded-2xl border bg-card transition-all duration-200 cursor-pointer ${style.border}`}
      onClick={() => onNavigate(item.id)}
    >
      {/* Thumbnail */}
      <div className="w-24 flex-shrink-0">
        <div className="rounded-xl overflow-hidden border border-border/30 aspect-[4/3] bg-muted/10">
          {auditDoc?.thumbnail ? (
            <DocumentThumbnail doc={auditDoc} typeColors={typeColors} onClick={() => onNavigate(item.id)} />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FileSearch className="w-6 h-6 text-muted-foreground/40" />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground truncate">{item.salon_name}</h3>
          <Badge variant="outline" className={`text-[10px] px-2 py-0 h-5 ${style.badge}`}>
            {style.badgeText}
          </Badge>
          {isSold && (
            <Badge className="text-[10px] px-2 py-0 h-5 bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
              Sprzedane ✓
            </Badge>
          )}
          {hasAcademy && (
            <Badge variant="outline" className="text-[10px] px-2 py-0 h-5 bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30 gap-1">
              <GraduationCap className="w-3 h-3" /> Academy
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {owner && (
            <span className="flex items-center gap-1 truncate">
              <User className="w-3 h-3 flex-shrink-0" /> {owner}
            </span>
          )}
          {city && (
            <span className="flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 flex-shrink-0" /> {city}
            </span>
          )}
          {displayDate && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 flex-shrink-0" /> Audyt: {displayDate}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
          <span>Wygenerował: {item.guardian_name || creatorName || "—"}</span>
          {conductorName && (
            <>
              <span className="text-border">•</span>
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" /> {conductorName}
              </span>
            </>
          )}
          {conversationDate && (
            <>
              <span className="text-border">•</span>
              <span>Termin rozmowy: {conversationDate}</span>
            </>
          )}
          {outcome && (
            <>
              <span className="text-border">•</span>
              <span>{outcomeLabels[outcome] || outcome}</span>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {!isCompleted && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button size="sm" variant="default" className="h-8 gap-1">
                Oznacz <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              {Object.entries(outcomeLabels).map(([key, label]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => onQuickMark(item, key)}
                >
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => { e.stopPropagation(); onEdit(item); }}
          className="h-8"
        >
          {isCompleted ? "Edytuj" : "Szczegóły"}
        </Button>
      </div>
    </div>
  );
}
