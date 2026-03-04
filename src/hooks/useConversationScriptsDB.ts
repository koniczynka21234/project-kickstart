import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type ScriptStatus = "przyszly" | "dzisiaj" | "zrealizowany" | "sprzedany";

export interface ConversationScriptRow {
  id: string;
  audit_id: string;
  salon_name: string;
  sent_date: string | null;
  status: ScriptStatus;
  created_at: string;
  created_by: string;
  guardian_id?: string | null;
  guardian_name?: string | null;
  outcome?: string | null;
  notes?: string | null;
  conversation_date?: string | null;
  conductor_id?: string | null;
  conductor_name?: string | null;
}

type ConversationMarkPatch = Partial<
  Pick<ConversationScriptRow, "status" | "outcome" | "notes" | "conversation_date" | "conductor_id" | "conductor_name" | "guardian_id" | "guardian_name">
>;

const LOCAL_SCRIPTS_KEY = "conversation_scripts";
const LOCAL_MARKS_KEY = "conversation_scripts_marks";

const readJsonStorage = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeJsonStorage = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore localStorage errors
  }
};

const withLocalMarks = (
  rows: ConversationScriptRow[],
  marks: Record<string, ConversationMarkPatch>
): ConversationScriptRow[] => {
  return rows.map((row) => {
    const mark = marks[row.id];
    if (!mark) return row;
    return {
      ...row,
      ...mark,
      status: (mark.status || row.status) as ScriptStatus,
    };
  });
};

const mergeRowsById = (remoteRows: ConversationScriptRow[], localRows: ConversationScriptRow[]) => {
  const map = new Map<string, ConversationScriptRow>();
  for (const row of remoteRows) map.set(row.id, row);
  for (const row of localRows) {
    if (!map.has(row.id)) map.set(row.id, row);
  }
  return Array.from(map.values());
};

const sortByCreatedAtDesc = (rows: ConversationScriptRow[]) => {
  return [...rows].sort((a, b) => {
    const aTs = new Date(a.created_at || 0).getTime();
    const bTs = new Date(b.created_at || 0).getTime();
    return bTs - aTs;
  });
};

export const useConversationScriptsDB = () => {
  const { user } = useAuth();
  const [scripts, setScripts] = useState<ConversationScriptRow[]>([]);
  const [loading, setLoading] = useState(true);

  const saveLocalMarkDetails = useCallback((id: string, patch: ConversationMarkPatch) => {
    const currentMarks = readJsonStorage<Record<string, ConversationMarkPatch>>(LOCAL_MARKS_KEY, {});
    const nextMarks = {
      ...currentMarks,
      [id]: {
        ...(currentMarks[id] || {}),
        ...patch,
      },
    };
    writeJsonStorage(LOCAL_MARKS_KEY, nextMarks);

    const cachedRows = readJsonStorage<ConversationScriptRow[]>(LOCAL_SCRIPTS_KEY, []);
    const stateRow = scripts.find((s) => s.id === id);
    const rowExistsInCache = cachedRows.some((r) => r.id === id);

    const nextCached = rowExistsInCache
      ? cachedRows.map((r) => (r.id === id ? ({ ...r, ...patch } as ConversationScriptRow) : r))
      : stateRow
      ? [{ ...stateRow, ...patch } as ConversationScriptRow, ...cachedRows]
      : cachedRows;

    if (nextCached.length > 0) {
      writeJsonStorage(LOCAL_SCRIPTS_KEY, nextCached);
    }

    setScripts((prev) => prev.map((row) => (row.id === id ? ({ ...row, ...patch } as ConversationScriptRow) : row)));
  }, [scripts]);

  const fetchScripts = useCallback(async () => {
    let dbRows: ConversationScriptRow[] = [];

    const remote = await (supabase as any)
      .from("conversation_scripts")
      .select("*")
      .order("created_at", { ascending: false });

    if (!remote.error) {
      dbRows = (remote.data || []) as ConversationScriptRow[];
    }

    const localRows = readJsonStorage<ConversationScriptRow[]>(LOCAL_SCRIPTS_KEY, []);
    const localMarks = readJsonStorage<Record<string, ConversationMarkPatch>>(LOCAL_MARKS_KEY, {});

    const mergedRows = mergeRowsById(dbRows, localRows);
    const rowsWithMarks = withLocalMarks(mergedRows, localMarks);
    const finalRows = sortByCreatedAtDesc(rowsWithMarks);

    setScripts(finalRows);
    if (finalRows.length > 0) {
      writeJsonStorage(LOCAL_SCRIPTS_KEY, finalRows);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchScripts();
  }, [fetchScripts]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("conversation-scripts-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversation_scripts" }, () => {
        fetchScripts();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchScripts]);

  const updateStatus = useCallback(async (id: string, status: ScriptStatus) => {
    if (id.startsWith("local-")) {
      const localRows = readJsonStorage<ConversationScriptRow[]>(LOCAL_SCRIPTS_KEY, []);
      const updated = localRows.map((r) => (r.id === id ? { ...r, status } : r));
      writeJsonStorage(LOCAL_SCRIPTS_KEY, updated);
      saveLocalMarkDetails(id, { status });
      fetchScripts();
      return true;
    }

    const { data, error } = await (supabase as any)
      .from("conversation_scripts")
      .update({ status })
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error || !data?.id) return false;

    saveLocalMarkDetails(id, { status });
    fetchScripts();
    return true;
  }, [fetchScripts, saveLocalMarkDetails]);

  const updateGuardian = useCallback(async (id: string, guardianId: string | null, guardianName: string | null) => {
    await (supabase as any).from("conversation_scripts").update({ guardian_id: guardianId, guardian_name: guardianName }).eq("id", id);
    saveLocalMarkDetails(id, { guardian_id: guardianId, guardian_name: guardianName });
    fetchScripts();
  }, [fetchScripts, saveLocalMarkDetails]);

  return { scripts, loading, updateStatus, updateGuardian, saveLocalMarkDetails, refetch: fetchScripts };
};
