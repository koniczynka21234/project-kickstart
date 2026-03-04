import { useEffect, useMemo, useState, useCallback } from "react";
import { CloudDocumentItem } from "@/hooks/useCloudDocumentHistory";

export type ScriptStatus = "przyszly" | "dzisiaj" | "zrealizowany" | "sprzedany";

export interface ConversationScriptItem {
  id: string;
  audit: CloudDocumentItem;
  salonName: string;
  sentDate: string | null;
  status: ScriptStatus;
}

const storageKey = "conversationScriptsStatus";

const getDefaultStatus = (sentDate: string | null): ScriptStatus => {
  if (!sentDate) return "zrealizowany";
  const d = new Date(sentDate);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return "dzisiaj";
  if (d.getTime() > now.getTime()) return "przyszly";
  return "zrealizowany";
};

export const useConversationScripts = (audits: CloudDocumentItem[]) => {
  const [statusMap, setStatusMap] = useState<Record<string, ScriptStatus>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setStatusMap(JSON.parse(raw));
    } catch {}
  }, []);

  const scripts: ConversationScriptItem[] = useMemo(() => {
    return audits.map(a => {
      const sent = (a.data as any)?.sentDate || null;
      const salon = (a.data as any)?.salonName || a.title || "";
      const status = statusMap[a.id] || getDefaultStatus(sent);
      return {
        id: a.id,
        audit: a,
        salonName: salon,
        sentDate: sent,
        status,
      };
    });
  }, [audits, statusMap]);

  const updateStatus = useCallback((id: string, status: ScriptStatus) => {
    setStatusMap(prev => {
      const next = { ...prev, [id]: status };
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  return { scripts, updateStatus };
};
