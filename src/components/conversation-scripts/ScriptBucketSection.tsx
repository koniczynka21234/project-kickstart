import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";
import { ConversationScriptRow } from "@/hooks/useConversationScriptsDB";
import { ScriptCard, BucketType } from "./ScriptCard";

interface ScriptBucketSectionProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  bucket: BucketType;
  items: ConversationScriptRow[];
  audits: any[];
  history: any[];
  creatorNames: Record<string, string>;
  localMarks: Record<string, any>;
  outcomeLabels: Record<string, string>;
  typeColors: Record<string, string>;
  emptyMessage: string;
  onNavigate: (id: string) => void;
  onQuickMark: (item: ConversationScriptRow, outcome: string) => void;
  onEdit: (item: ConversationScriptRow) => void;
}

export function ScriptBucketSection({
  title, subtitle, icon: Icon, bucket, items, audits, history,
  creatorNames, localMarks, outcomeLabels, typeColors, emptyMessage,
  onNavigate, onQuickMark, onEdit,
}: ScriptBucketSectionProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <Badge className="bg-primary/15 text-primary border-primary/30 ml-auto text-xs">
          {items.length}
        </Badge>
      </div>

      <div className="space-y-2">
        {items.length > 0 ? items.map((item) => {
          const auditDocDb = audits.find(a => a.id === item.audit_id);
          const auditDocHistory = history.find(h => h.id === item.audit_id && h.type === "audit");
          const auditDoc = auditDocDb || auditDocHistory;
          const auditData = (auditDoc?.data as any) || {};
          const owner = auditData?.ownerName;
          const city = auditData?.city;
          const includeAcademy = auditData?.includeAcademy;
          const hasAcademy = includeAcademy === true || includeAcademy === "true";
          const creatorId = auditDocDb?.created_by || auditDocDb?.createdBy || auditDocHistory?.created_by || auditDocHistory?.createdBy || item.guardian_id || item.created_by || null;
          const creatorName = creatorId ? creatorNames[creatorId] || item.guardian_name || null : (item.guardian_name || null);

          return (
            <ScriptCard
              key={item.id}
              item={item}
              bucket={bucket}
              auditDoc={auditDoc}
              owner={owner}
              city={city}
              creatorName={creatorName}
              hasAcademy={hasAcademy}
              localMark={localMarks[item.id]}
              outcomeLabels={outcomeLabels}
              typeColors={typeColors}
              onNavigate={onNavigate}
              onQuickMark={onQuickMark}
              onEdit={onEdit}
            />
          );
        }) : (
          <div className="p-6 rounded-xl border border-dashed border-border/50 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        )}
      </div>
    </section>
  );
}
