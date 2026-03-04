import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, Loader2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useConversationScriptsDB } from "@/hooks/useConversationScriptsDB";
import { useCloudDocumentHistory } from "@/hooks/useCloudDocumentHistory";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { ScriptCard } from "@/components/conversation-scripts/ScriptCard";

const outcomeLabels: Record<string, string> = {
  brak_kontaktu: "Brak kontaktu",
  umowiony_followup: "Umówiony follow-up",
  odrzucone: "Odrzucone",
  prosba_o_oferte: "Prośba o ofertę",
  negocjacje: "Negocjacje",
  spotkanie: "Umówione spotkanie",
};

const typeColors: Record<string, string> = {
  report: "bg-pink-500/10 text-pink-400 border-pink-500/30",
  invoice: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  contract: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  presentation: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  welcomepack: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  audit: "bg-orange-500/10 text-orange-400 border-orange-500/30",
};

export default function ConversationScriptsHistory() {
  const navigate = useNavigate();
  const { scripts, loading } = useConversationScriptsDB();
  const { history } = useCloudDocumentHistory();
  const [audits, setAudits] = useState<any[]>([]);
  const [auditsLoading, setAuditsLoading] = useState(true);
  const [creatorNames, setCreatorNames] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "sprzedany" | "nie_sprzedany">("all");
  const [academyFilter, setAcademyFilter] = useState<"all" | "with" | "without">("all");
  const [userFilter, setUserFilter] = useState<string>("all");

  const historyScripts = (scripts || []).filter(s => s.status === "zrealizowany" || s.status === "sprzedany");

  const getAuditData = (doc: any) => ((doc?.data as any) || {});
  const getAuditCreatorId = (doc: any) => doc?.created_by || doc?.createdBy || null;
  const hasAcademyFlag = (doc: any) => {
    const value = getAuditData(doc)?.includeAcademy;
    return value === true || value === "true";
  };

  useEffect(() => {
    const run = async () => {
      try {
        const ids = Array.from(new Set(historyScripts.map(s => s.audit_id).filter(Boolean)));
        if (ids.length === 0) {
          setAudits([]);
          return;
        }
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
              ...docs.map(d => getAuditCreatorId(d)),
              ...historyScripts.map(s => s.guardian_id),
              ...historyScripts.map(s => s.created_by),
            ].filter(Boolean)
          )
        );
        if (creatorIds.length > 0) {
          const profs = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', creatorIds);
          const map: Record<string, string> = {};
          for (const p of (profs.data || [])) {
            map[p.id] = p.full_name || 'Nieznany';
          }
          setCreatorNames(map);
        } else {
          setCreatorNames({});
        }
      } finally {
        setAuditsLoading(false);
      }
    };
    run();
  }, [scripts]);

  const isLoading = loading || auditsLoading;

  const filtered = historyScripts.filter((s) => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length === 0) return true;
    const name = (s.salon_name || "").toLowerCase();
    const dtStr = s.sent_date ? new Date(s.sent_date).toLocaleDateString("pl-PL") : "";
    return name.includes(q) || dtStr.includes(q);
  });

  const filteredByStatus = filtered.filter(s => {
    if (statusFilter === "all") return true;
    if (statusFilter === "sprzedany") return s.status === "sprzedany";
    return s.status !== "sprzedany";
  });

  const filteredByAcademy = filteredByStatus.filter(s => {
    const auditDoc = audits.find(a => a.id === s.audit_id);
    const hasAcademy = hasAcademyFlag(auditDoc);
    if (academyFilter === "all") return true;
    if (academyFilter === "with") return hasAcademy;
    return !hasAcademy;
  });

  const filteredFinal = filteredByAcademy.filter(s => {
    if (userFilter === "all") return true;
    const auditDoc = audits.find(a => a.id === s.audit_id);
    const id = getAuditCreatorId(auditDoc) || s.guardian_id || s.created_by;
    return id === userFilter;
  });

  const userOptions = Array.from(
    new Set([
      ...audits.map(a => getAuditCreatorId(a)),
      ...historyScripts.map(s => s.guardian_id),
      ...historyScripts.map(s => s.created_by),
    ].filter(Boolean))
  ).map(id => ({ id, name: creatorNames[id] || 'Nieznany' }));

  return (
    <AppLayout>
      <div className="w-full max-w-full">
        {/* Header */}
        <div className="border-b border-border/50 bg-card">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-pink-600 flex items-center justify-center shadow-lg shadow-primary/25">
                <History className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Historia schematów rozmów</h1>
                <p className="text-sm text-muted-foreground">Zrealizowane i sprzedane rozmowy</p>
              </div>
              <div className="ml-auto">
                <Button variant="outline" size="sm" onClick={() => navigate('/conversation-scripts')}>
                  ← Wróć do schematów
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-border/50 bg-card p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{historyScripts.length}</div>
              <div className="text-xs text-muted-foreground">Łącznie</div>
            </div>
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-center">
              <div className="text-2xl font-bold text-emerald-400">{historyScripts.filter(s => s.status === "sprzedany").length}</div>
              <div className="text-xs text-muted-foreground">Sprzedane</div>
            </div>
            <div className="rounded-xl border border-border/50 bg-card p-4 text-center">
              <div className="text-2xl font-bold text-muted-foreground">{historyScripts.filter(s => s.status === "zrealizowany").length}</div>
              <div className="text-xs text-muted-foreground">Nie sprzedane</div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Szukaj historii..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie statusy</SelectItem>
                <SelectItem value="sprzedany">Sprzedane</SelectItem>
                <SelectItem value="nie_sprzedany">Nie sprzedane</SelectItem>
              </SelectContent>
            </Select>
            <Select value={academyFilter} onValueChange={(v) => setAcademyFilter(v as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Academy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Academy: wszystkie</SelectItem>
                <SelectItem value="with">Z Academy</SelectItem>
                <SelectItem value="without">Bez Academy</SelectItem>
              </SelectContent>
            </Select>
            {userOptions.length > 0 && (
              <Select value={userFilter} onValueChange={(v) => setUserFilter(v)}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Użytkownik" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszyscy użytkownicy</SelectItem>
                  {userOptions.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Results */}
          {isLoading ? (
            <div className="rounded-xl border border-border/50 bg-card p-10 flex items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Ładowanie historii…
              </div>
            </div>
          ) : filteredFinal.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-primary/15 text-primary border-primary/30 text-xs">
                  {filteredFinal.length} wyników
                </Badge>
              </div>
              {filteredFinal.map(item => {
                const auditDocHist = history.find(h => h.id === item.audit_id && h.type === "audit");
                const auditDocRaw = audits.find(a => a.id === item.audit_id);
                const auditDoc = auditDocHist || auditDocRaw;
                const auditData = getAuditData(auditDoc);
                const owner = auditData?.ownerName;
                const city = auditData?.city;
                const hasAcademy = hasAcademyFlag(auditDoc);
                const creatorId = getAuditCreatorId(auditDoc) || item.guardian_id || item.created_by;
                const creatorName = creatorId ? creatorNames[creatorId] || item.guardian_name || null : (item.guardian_name || null);

                return (
                  <ScriptCard
                    key={item.id}
                    item={item}
                    bucket="history"
                    auditDoc={auditDoc}
                    owner={owner}
                    city={city}
                    creatorName={creatorName}
                    hasAcademy={hasAcademy}
                    localMark={null}
                    outcomeLabels={outcomeLabels}
                    typeColors={typeColors}
                    onNavigate={(id) => navigate('/conversation-scripts/' + id)}
                    onQuickMark={() => {}}
                    onEdit={() => {}}
                  />
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border/50 p-10 text-center text-sm text-muted-foreground">
              Brak historii schematów
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
