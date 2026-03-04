import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Mic, ClipboardCheck, History, Clock, AlertTriangle, Search, Loader2, Bell, TrendingUp, Phone, CalendarClock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useCloudDocumentHistory } from "@/hooks/useCloudDocumentHistory";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { markConversationOutcome } from "@/services/conversationScripts";
import { toast } from "sonner";
import { useConversationScriptsDB, ScriptStatus, ConversationScriptRow } from "@/hooks/useConversationScriptsDB";
import { ScriptBucketSection } from "@/components/conversation-scripts/ScriptBucketSection";
import { MarkDialog } from "@/components/conversation-scripts/MarkDialog";

const outcomeLabels: Record<string, string> = {
  podjeto_wspolprace: "Podjęto współpracę",
  zastanowienie: "Do zastanowienia",
  umowiony_followup: "Umówiony follow-up",
  prosba_o_oferte: "Prośba o ofertę",
  brak_kontaktu: "Brak kontaktu",
  odrzucone: "Odrzucone",
  brak_zainteresowania: "Brak zainteresowania",
};

const typeColors: Record<string, string> = {
  report: "bg-pink-500/10 text-pink-400 border-pink-500/30",
  invoice: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  contract: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  presentation: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  welcomepack: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  audit: "bg-orange-500/10 text-orange-400 border-orange-500/30",
};

type TabKey = "dzisiaj" | "przyszly" | "zalegle" | "historia";

const tabs: { key: TabKey; label: string; icon: any }[] = [
  { key: "dzisiaj", label: "Na dziś", icon: ClipboardCheck },
  { key: "przyszly", label: "Przyszłe", icon: Clock },
  { key: "zalegle", label: "Zaległe", icon: AlertTriangle },
  { key: "historia", label: "Historia", icon: History },
];

export default function ConversationScripts() {
  const navigate = useNavigate();
  const { history } = useCloudDocumentHistory();
  const { teamMembers } = useTeamMembers();
  const { scripts, loading, updateStatus, saveLocalMarkDetails, refetch } = useConversationScriptsDB();

  const [audits, setAudits] = useState<any[]>([]);
  const [auditsLoading, setAuditsLoading] = useState(false);
  const [creatorNames, setCreatorNames] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("dzisiaj");

  // Mark dialog state
  const [markItem, setMarkItem] = useState<ConversationScriptRow | null>(null);
  const [markStatus, setMarkStatus] = useState<ScriptStatus | null>(null);
  const [markNotes, setMarkNotes] = useState("");
  const [markDate, setMarkDate] = useState("");
  const [markSentDate, setMarkSentDate] = useState("");
  const [markUserId, setMarkUserId] = useState<string | null>(null);
  const [markOutcome, setMarkOutcome] = useState<string>("");
  const [localMarks, setLocalMarks] = useState<Record<string, {
    status: ScriptStatus;
    outcome?: string | null;
    conversation_date?: string | null;
    conductor_name?: string | null;
    conductor_id?: string | null;
    notes?: string | null;
  }>>({});

  // Fetch audit documents
  useEffect(() => {
    if (!scripts.length) {
      setAudits([]);
      setAuditsLoading(false);
      return;
    }
    const ids = Array.from(new Set(scripts.map(s => s.audit_id).filter(Boolean)));
    if (!ids.length) {
      setAudits([]);
      setAuditsLoading(false);
      return;
    }
    setAuditsLoading(true);
    (async () => {
      try {
        const { data } = await supabase
          .from('documents')
          .select('id, type, title, subtitle, data, thumbnail, created_by')
          .in('id', ids)
          .eq('type', 'audit');
        const docs = data || [];
        setAudits(docs);
        const creatorIds = Array.from(
          new Set(
            [
              ...docs.map((d) => d.created_by),
              ...scripts.map((s) => s.guardian_id),
              ...scripts.map((s) => s.created_by),
            ].filter(Boolean)
          )
        );
        if (creatorIds.length) {
          const { data: profs } = await supabase.from('profiles').select('id, full_name').in('id', creatorIds);
          const map: Record<string, string> = {};
          for (const p of profs || []) map[p.id] = p.full_name || 'Nieznany';
          setCreatorNames(map);
        } else {
          setCreatorNames({});
        }
      } finally {
        setAuditsLoading(false);
      }
    })();
  }, [scripts]);

  // Date helpers
  const getSentDate = (d?: string | null) => {
    if (!d) return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d);
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? null : dt;
  };

  const today = new Date();
  const isSameDay = (d: Date | null) => d ? d.toDateString() === today.toDateString() : false;
  const isFuture = (d: Date | null) => d ? (!isSameDay(d) && d.getTime() > today.getTime()) : false;
  const isPast = (d: Date | null) => d ? (!isSameDay(d) && d.getTime() < today.getTime()) : false;

  const classifyBucket = useCallback((s: ConversationScriptRow): "today" | "future" | "overdue" | "history" => {
    const effStatus = localMarks[s.id]?.status || s.status;
    if (effStatus === "zrealizowany" || effStatus === "sprzedany") return "history";
    
    const sd = getSentDate(s.sent_date);
    if (isSameDay(sd)) return "today";
    if (isFuture(sd)) return "future";
    if (isPast(sd)) return "overdue";
    const created = new Date(s.created_at);
    if (!isNaN(created.getTime()) && isPast(created)) return "overdue";
    return "today";
  }, [localMarks]);

  // Filter & bucket
  const filtered = scripts.filter((s) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const name = (s.salon_name || "").toLowerCase();
    const sd = getSentDate(s.sent_date);
    const dateStr = sd ? sd.toLocaleDateString("pl-PL") : "";
    return name.includes(q) || dateStr.includes(q);
  });

  const buckets = { today: [] as ConversationScriptRow[], future: [] as ConversationScriptRow[], overdue: [] as ConversationScriptRow[], history: [] as ConversationScriptRow[] };
  for (const s of filtered) {
    buckets[classifyBucket(s)].push(s);
  }

  const bucketCounts = {
    dzisiaj: buckets.today.length,
    przyszly: buckets.future.length,
    zalegle: buckets.overdue.length,
    historia: buckets.history.length,
  };

  // Auto-switch to overdue tab if there are overdue items and no today items
  useEffect(() => {
    if (!loading && !auditsLoading && buckets.overdue.length > 0 && buckets.today.length === 0 && activeTab === "dzisiaj") {
      setActiveTab("zalegle");
    }
  }, [loading, auditsLoading]);

  // Mark handlers
  const formatDateInput = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  const openMark = (item: ConversationScriptRow) => {
    setMarkItem(item);
    const lm = localMarks[item.id];
    const storedStatus = (lm?.status || item.status) as ScriptStatus;
    const selectableStatus =
      storedStatus === "zrealizowany" || storedStatus === "sprzedany"
        ? storedStatus
        : null;

    setMarkStatus(selectableStatus);
    setMarkOutcome(lm?.outcome || item.outcome || "");
    setMarkNotes(lm?.notes || item.notes || "");
    setMarkUserId(lm?.conductor_id || item.conductor_id || null);

    const convDate = lm?.conversation_date || item.conversation_date || item.sent_date;
    if (convDate) {
      const d = new Date(convDate);
      setMarkDate(!isNaN(d.getTime()) ? formatDateInput(d) : formatDateInput(new Date()));
    } else {
      setMarkDate(formatDateInput(new Date()));
    }

    const sentDate = item.sent_date;
    if (sentDate) {
      const d = new Date(sentDate);
      setMarkSentDate(!isNaN(d.getTime()) ? formatDateInput(d) : "");
    } else {
      setMarkSentDate("");
    }
  };

  const saveMark = async () => {
    if (!markItem) return;

    const effectiveOutcome = markOutcome || markItem.outcome || null;

    // Auto-derive status from outcome if user didn't explicitly pick a status
    let effectiveStatus = (markStatus ?? markItem.status) as ScriptStatus;
    if (effectiveOutcome && !markStatus) {
      // If an outcome is selected, auto-move to terminal status
      if (effectiveOutcome === "podjeto_wspolprace") {
        effectiveStatus = "sprzedany";
      } else if (["brak_kontaktu", "odrzucone", "brak_zainteresowania"].includes(effectiveOutcome)) {
        effectiveStatus = "zrealizowany";
      }
    }

    if ((effectiveStatus === "zrealizowany" || effectiveStatus === "sprzedany") && !effectiveOutcome) {
      toast.error("Wybierz wynik rozmowy");
      return;
    }

    const itemId = markItem.id;
    const previousLocalMark = localMarks[itemId];
    const revertOptimistic = () => {
      setLocalMarks((prev) => {
        if (previousLocalMark) {
          return { ...prev, [itemId]: previousLocalMark };
        }
        const { [itemId]: _removed, ...rest } = prev;
        return rest;
      });
    };

    const resolvedConductorId = markUserId ?? null;
    const conductorName = resolvedConductorId
      ? (teamMembers.find((t) => t.id === resolvedConductorId)?.name || creatorNames[resolvedConductorId] || null)
      : null;

    const markPayload = {
      status: effectiveStatus,
      outcome: effectiveOutcome,
      conversation_date: markDate || null,
      conductor_id: resolvedConductorId,
      conductor_name: conductorName,
      notes: markNotes || null,
    };

    setLocalMarks((prev) => ({
      ...prev,
        [itemId]: {
          status: markPayload.status,
          outcome: markPayload.outcome,
          conversation_date: markPayload.conversation_date,
          conductor_name: markPayload.conductor_name,
          conductor_id: markPayload.conductor_id,
          notes: markPayload.notes,
        },
    }));
    setMarkItem(null);

    try {
      if (itemId.startsWith("local-")) {
        const ok = await updateStatus(itemId, markPayload.status);
        if (!ok) {
          revertOptimistic();
          toast.error("Nie udało się zapisać lokalnie");
          return;
        }
        saveLocalMarkDetails(itemId, markPayload);
        await refetch();
        toast.success("Rozmowa oznaczona");
        return;
      }

      // Update sent_date if changed
      if (markSentDate && markSentDate !== markItem.sent_date) {
        await (supabase as any)
          .from('conversation_scripts')
          .update({ sent_date: markSentDate })
          .eq('id', itemId);
      }

      const res = await markConversationOutcome(itemId, {
        status: markPayload.status,
        notes: markPayload.notes,
        conversation_date: markPayload.conversation_date,
        conductor_id: markPayload.conductor_id,
        conductor_name: markPayload.conductor_name,
        outcome: markPayload.outcome,
      });

      if (!res.success) {
        const statusOnlySaved = await updateStatus(itemId, markPayload.status);
        if (!statusOnlySaved) {
          revertOptimistic();
          toast.error("Nie udało się zapisać rozmowy");
          return;
        }
      }

      saveLocalMarkDetails(itemId, markPayload);
      await refetch();
      toast.success("Rozmowa oznaczona");
    } catch {
      revertOptimistic();
      toast.error("Błąd zapisu");
    }
  };

  // Quick mark: user picks an outcome from the dropdown on the card
  const quickMark = useCallback(async (item: ConversationScriptRow, outcome: string) => {
    const derivedStatus: ScriptStatus =
      outcome === "podjeto_wspolprace" ? "sprzedany"
      : ["brak_kontaktu", "odrzucone", "brak_zainteresowania"].includes(outcome) ? "zrealizowany"
      : item.status as ScriptStatus;

    const itemId = item.id;
    const previousLocalMark = localMarks[itemId];

    setLocalMarks((prev) => ({
      ...prev,
      [itemId]: {
        status: derivedStatus,
        outcome,
        conversation_date: prev[itemId]?.conversation_date || item.conversation_date || item.sent_date || null,
        conductor_name: prev[itemId]?.conductor_name || item.conductor_name || item.guardian_name || null,
        conductor_id: prev[itemId]?.conductor_id || item.conductor_id || null,
        notes: prev[itemId]?.notes || item.notes || null,
      },
    }));

    try {
      if (itemId.startsWith("local-")) {
        const ok = await updateStatus(itemId, derivedStatus);
        if (!ok) {
          setLocalMarks((prev) => previousLocalMark ? { ...prev, [itemId]: previousLocalMark } : (() => { const { [itemId]: _, ...rest } = prev; return rest; })());
          toast.error("Nie udało się zapisać");
          return;
        }
        saveLocalMarkDetails(itemId, { status: derivedStatus, outcome });
        await refetch();
        toast.success("Rozmowa oznaczona");
        return;
      }

      const res = await markConversationOutcome(itemId, {
        status: derivedStatus,
        outcome,
        conversation_date: item.conversation_date || item.sent_date || null,
        conductor_id: item.conductor_id || null,
        conductor_name: item.conductor_name || item.guardian_name || null,
        notes: item.notes || null,
      });

      if (!res.success) {
        await updateStatus(itemId, derivedStatus);
      }
      saveLocalMarkDetails(itemId, { status: derivedStatus, outcome });
      await refetch();
      toast.success("Rozmowa oznaczona");
    } catch {
      setLocalMarks((prev) => previousLocalMark ? { ...prev, [itemId]: previousLocalMark } : (() => { const { [itemId]: _, ...rest } = prev; return rest; })());
      toast.error("Błąd zapisu");
    }
  }, [localMarks, updateStatus, saveLocalMarkDetails, refetch]);

  const isLoading = loading || auditsLoading;

  const renderCurrentTab = () => {
    if (isLoading) {
      return (
        <div className="rounded-xl border border-border/50 bg-card p-10 flex items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Ładowanie schematów rozmów...
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case "dzisiaj":
        return (
          <ScriptBucketSection
            title="Na dziś"
            subtitle="Priorytetowe rozmowy do wykonania"
            icon={ClipboardCheck}
            bucket="today"
            items={buckets.today}
            audits={audits}
            history={history}
            creatorNames={creatorNames}
            localMarks={localMarks}
            outcomeLabels={outcomeLabels}
            typeColors={typeColors}
            emptyMessage="Brak schematów na dziś — wszystko ogarnięte! 🎉"
            onNavigate={(id) => navigate('/conversation-scripts/' + id)}
            onQuickMark={quickMark}
            onEdit={openMark}
          />
        );
      case "przyszly":
        return (
          <ScriptBucketSection
            title="Przyszłe"
            subtitle="Zaplanowane rozmowy"
            icon={Clock}
            bucket="future"
            items={buckets.future}
            audits={audits}
            history={history}
            creatorNames={creatorNames}
            localMarks={localMarks}
            outcomeLabels={outcomeLabels}
            typeColors={typeColors}
            emptyMessage="Brak zaplanowanych rozmów"
            onNavigate={(id) => navigate('/conversation-scripts/' + id)}
            onQuickMark={quickMark}
            onEdit={openMark}
          />
        );
      case "zalegle":
        return (
          <>
            {buckets.overdue.length > 0 && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center flex-shrink-0">
                  <Bell className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-red-400">
                    {buckets.overdue.length} {buckets.overdue.length === 1 ? "rozmowa zaległa" : buckets.overdue.length < 5 ? "rozmowy zaległe" : "rozmów zaległych"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Termin na te rozmowy już minął. Oznacz je jako wykonane lub skontaktuj się z salonem jak najszybciej.
                  </p>
                </div>
              </div>
            )}
            <ScriptBucketSection
              title="Zaległe"
              subtitle="Wymagają pilnej akcji"
              icon={AlertTriangle}
              bucket="overdue"
              items={buckets.overdue}
              audits={audits}
              history={history}
              creatorNames={creatorNames}
              localMarks={localMarks}
              outcomeLabels={outcomeLabels}
              typeColors={typeColors}
              emptyMessage="Brak zaległych rozmów — super! 💪"
              onNavigate={(id) => navigate('/conversation-scripts/' + id)}
              onQuickMark={quickMark}
              onEdit={openMark}
            />
          </>
        );
      case "historia":
        return (
          <ScriptBucketSection
            title="Historia"
            subtitle="Zakończone rozmowy"
            icon={History}
            bucket="history"
            items={buckets.history}
            audits={audits}
            history={history}
            creatorNames={creatorNames}
            localMarks={localMarks}
            outcomeLabels={outcomeLabels}
            typeColors={typeColors}
            emptyMessage="Brak zakończonych rozmów"
            onNavigate={(id) => navigate('/conversation-scripts/' + id)}
            onQuickMark={quickMark}
            onEdit={openMark}
          />
        );
    }
  };

  return (
    <AppLayout>
      <div className="w-full max-w-full">
        {/* Header */}
        <div className="border-b border-border/50 bg-card">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-pink-600 flex items-center justify-center shadow-lg shadow-primary/25">
                <Mic className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Schematy rozmów</h1>
                <p className="text-sm text-muted-foreground">Rozmowy na dziś, przyszłe i zaległe</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate('/conversation-scripts/history')}>
                  <History className="w-4 h-4 mr-1.5" /> Historia
                </Button>
                <Button size="sm" onClick={() => navigate('/audit-generator')}>
                  Generator audytu
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats cards */}
        {!isLoading && (
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 pt-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center">
                  <ClipboardCheck className="w-4.5 h-4.5 text-amber-400" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{bucketCounts.dzisiaj}</p>
                  <p className="text-[11px] text-muted-foreground">Na dziś</p>
                </div>
              </div>
              <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-3.5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-sky-500/15 flex items-center justify-center">
                  <CalendarClock className="w-4.5 h-4.5 text-sky-400" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{bucketCounts.przyszly}</p>
                  <p className="text-[11px] text-muted-foreground">Przyszłe</p>
                </div>
              </div>
              <div className={`rounded-xl border p-3.5 flex items-center gap-3 ${bucketCounts.zalegle > 0 ? "border-red-500/40 bg-red-500/10 ring-1 ring-red-500/20" : "border-border/50 bg-card"}`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${bucketCounts.zalegle > 0 ? "bg-red-500/20" : "bg-muted/30"}`}>
                  <AlertTriangle className={`w-4.5 h-4.5 ${bucketCounts.zalegle > 0 ? "text-red-400" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <p className={`text-lg font-bold ${bucketCounts.zalegle > 0 ? "text-red-400" : "text-foreground"}`}>{bucketCounts.zalegle}</p>
                  <p className="text-[11px] text-muted-foreground">Zaległe</p>
                </div>
              </div>
              <div className="rounded-xl border border-border/50 bg-card p-3.5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-muted/30 flex items-center justify-center">
                  <TrendingUp className="w-4.5 h-4.5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{bucketCounts.historia}</p>
                  <p className="text-[11px] text-muted-foreground">Zakończone</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-5 space-y-5">
          {/* Tabs + Search */}
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/30 border border-border/50">
              {tabs.map(({ key, label, icon: Icon }) => {
                const count = bucketCounts[key];
                const isActive = activeTab === key;
                const isOverdue = key === "zalegle" && count > 0;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`
                      relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200
                      ${isActive
                        ? isOverdue
                          ? "bg-red-500 text-white shadow-lg shadow-red-500/25"
                          : "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                        : isOverdue
                          ? "text-red-400 hover:bg-red-500/10"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                    {count > 0 && (
                      <span className={`
                        text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center
                        ${isActive
                          ? "bg-white/20 text-inherit"
                          : isOverdue
                            ? "bg-red-500/20 text-red-400"
                            : "bg-primary/15 text-primary"
                        }
                      `}>
                        {count}
                      </span>
                    )}
                    {isOverdue && !isActive && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="relative w-full md:w-72 md:ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Szukaj po nazwie salonu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Tab content */}
          {renderCurrentTab()}
        </div>
      </div>

      <MarkDialog
        open={!!markItem}
        onClose={() => setMarkItem(null)}
        markStatus={markStatus}
        setMarkStatus={setMarkStatus}
        markDate={markDate}
        setMarkDate={setMarkDate}
        markSentDate={markSentDate}
        setMarkSentDate={setMarkSentDate}
        markUserId={markUserId}
        setMarkUserId={setMarkUserId}
        markOutcome={markOutcome}
        setMarkOutcome={setMarkOutcome}
        markNotes={markNotes}
        setMarkNotes={setMarkNotes}
        teamMembers={teamMembers}
        onSave={saveMark}
      />
    </AppLayout>
  );
}