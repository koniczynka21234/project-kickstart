import { useEffect, useState } from "react";

import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CalendarDays, UserRound, Building2, MapPin, ClipboardList, Loader2, GraduationCap, FileText, Eye, Pencil } from "lucide-react";
import { DocumentViewer } from "@/components/document/DocumentViewer";
import { DocumentThumbnail } from "@/components/document/DocumentThumbnail";
import { useConversationScriptsDB, ScriptStatus } from "@/hooks/useConversationScriptsDB";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { generateConversationGuide, type ConversationSection } from "@/lib/conversationGuide";
import { ConversationGuideView } from "@/components/conversation-scripts/ConversationGuideView";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const typeColors: Record<string, string> = {
  report: "bg-pink-500/10 text-pink-400 border-pink-500/30",
  invoice: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  contract: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  presentation: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  welcomepack: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  audit: "bg-orange-500/10 text-orange-400 border-orange-500/30",
};

const statusLabel: Record<ScriptStatus, string> = {
  dzisiaj: "Na dziś",
  przyszly: "Przyszłe",
  zrealizowany: "Zrealizowane",
  sprzedany: "Sprzedane",
};

const outcomeLabels: Record<string, string> = {
  brak_kontaktu: "Brak kontaktu",
  umowiony_followup: "Umówiony follow-up",
  odrzucone: "Odrzucone",
  prosba_o_oferte: "Prośba o ofertę",
  negocjacje: "Negocjacje",
  spotkanie: "Umówione spotkanie",
  podjeto_wspolprace: "Podjęto współpracę",
  do_zastanowienia: "Do zastanowienia",
  brak_zainteresowania: "Brak zainteresowania",
};

export default function ConversationScriptDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { updateStatus } = useConversationScriptsDB();
  

  const [script, setScript] = useState<any | null>(null);
  const [auditDoc, setAuditDoc] = useState<any | null>(null);
  const [creatorName, setCreatorName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [guideSections, setGuideSections] = useState<ConversationSection[]>([]);
  const [auditViewerOpen, setAuditViewerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Load saved edits from localStorage
  const loadSavedSections = (scriptId: string): ConversationSection[] | null => {
    try {
      const raw = localStorage.getItem(`script_edits_${scriptId}`);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  };

  const saveSections = (scriptId: string, sections: ConversationSection[]) => {
    try {
      localStorage.setItem(`script_edits_${scriptId}`, JSON.stringify(sections));
    } catch {}
  };

  useEffect(() => {
    if (!id) return;

    const run = async () => {
      try {
        setLoading(true);
        setLoadError(null);

        // Fetch conversation script directly
        const { data: s } = await (supabase as any)
          .from("conversation_scripts")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        // Merge local marks
        const localMarks = (() => {
          try {
            const raw = localStorage.getItem("conversation_scripts_marks");
            return raw ? (JSON.parse(raw) as Record<string, any>) : {};
          } catch {
            return {} as Record<string, any>;
          }
        })();

        const scriptWithLocal = s
          ? {
              ...s,
              ...(localMarks[id] || {}),
              status: (localMarks[id]?.status || s.status) as ScriptStatus,
            }
          : null;

        setScript(scriptWithLocal || null);

        // Fetch audit document directly from DB (no useCloudDocumentHistory dependency)
        let resolvedDoc: any = null;
        if (scriptWithLocal?.audit_id) {
          const { data: d } = await supabase
            .from("documents")
            .select("id, type, title, subtitle, data, thumbnail, created_at, created_by, client_id")
            .eq("id", scriptWithLocal.audit_id)
            .maybeSingle();
          resolvedDoc = d || null;
        }

        setAuditDoc(resolvedDoc);

        // Generate conversation guide from audit data
        if (resolvedDoc?.data) {
          const auditData = resolvedDoc.data as any;
          let enabledCategories: Record<string, boolean> = {};
          let checkedFindings: Record<string, boolean> = {};

          // Parse enabledCategories - may be string or object
          try {
            let raw = auditData.enabledCategories;
            if (typeof raw === "string") raw = JSON.parse(raw);
            if (typeof raw === "string") raw = JSON.parse(raw); // double-encoded
            enabledCategories = raw || {};
          } catch {}

          // Parse checkedFindings - may be string or object
          try {
            let raw = auditData.checkedFindings;
            if (typeof raw === "string") raw = JSON.parse(raw);
            if (typeof raw === "string") raw = JSON.parse(raw); // double-encoded
            checkedFindings = raw || {};
          } catch {}

          console.log("[ConversationScript] enabledCategories:", enabledCategories);
          console.log("[ConversationScript] checkedFindings:", checkedFindings);

          // If enabledCategories is empty, use defaults
          const hasAnyEnabled = Object.values(enabledCategories).some(v => !!v);
          if (!hasAnyEnabled) {
            console.warn("[ConversationScript] No enabled categories found");
            setGuideSections([]);
            return;
          }

          // Only use actually checked findings
          const hasAnyChecked = Object.values(checkedFindings).some(v => !!v);
          if (!hasAnyChecked) {
            console.warn("[ConversationScript] No checked findings found");
            setGuideSections([]);
            return;
          }

          const includeAcademyFlag = auditData.includeAcademy === true || auditData.includeAcademy === "true";

          // Check for saved edits first
          const savedSections = id ? loadSavedSections(id) : null;
          if (savedSections && savedSections.length > 0) {
            setGuideSections(savedSections);
          } else {
            const sections = generateConversationGuide(enabledCategories, checkedFindings, includeAcademyFlag);
            setGuideSections(sections);
          }
        }

        // Fetch creator name
        const authorId = resolvedDoc?.created_by || scriptWithLocal?.guardian_id || scriptWithLocal?.created_by || null;
        if (authorId) {
          const { data: p } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", authorId)
            .maybeSingle();
          setCreatorName((p as any)?.full_name || scriptWithLocal?.guardian_name || null);
        } else {
          setCreatorName(scriptWithLocal?.guardian_name || null);
        }
      } catch {
        setLoadError("Nie udało się wczytać schematu rozmowy");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [id]);

  const handleStatusChange = async (nextStatus: ScriptStatus) => {
    if (!script?.id) return;
    const previousStatus = script.status;
    setScript((prev: any) => (prev ? { ...prev, status: nextStatus } : prev));
    setSavingStatus(true);

    const ok = await updateStatus(script.id, nextStatus);
    if (!ok) {
      setScript((prev: any) => (prev ? { ...prev, status: previousStatus } : prev));
      toast.error("Nie udało się zapisać statusu");
    } else {
      toast.success("Status zaktualizowany");
    }

    setSavingStatus(false);
  };

  const sentDateLabel = script?.sent_date
    ? new Date(script.sent_date).toLocaleDateString("pl-PL")
    : "brak daty";
  const conversationDateLabel = script?.conversation_date
    ? new Date(script.conversation_date).toLocaleDateString("pl-PL")
    : "—";
  const conductorDisplay = script?.conductor_name || creatorName || script?.guardian_name || "—";
  const outcomeLabel = script?.outcome ? (outcomeLabels[script.outcome] || script.outcome) : "—";
  const includeAcademy = (auditDoc?.data as any)?.includeAcademy;
  const hasAcademy = includeAcademy === true || includeAcademy === "true";
  const ownerName = (auditDoc?.data as any)?.ownerName || script?.salon_name || "Klientka";
  const salonName = (auditDoc?.data as any)?.salonName || script?.salon_name || "Salon";

  return (
    <AppLayout>
      <div className="w-full max-w-full">
        {/* Header */}
        <div className="border-b border-border/50 bg-card">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-5">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-foreground">Schemat rozmowy</h1>
                <p className="text-sm text-muted-foreground">{salonName} — {ownerName}</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Badge variant="outline" className="text-xs">{sentDateLabel}</Badge>
                <Badge variant="secondary" className="text-xs">{script?.status ? statusLabel[script.status as ScriptStatus] : "—"}</Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
          {loading ? (
            <div className="rounded-xl border border-border/50 bg-card p-10 flex items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Ładowanie…
              </div>
            </div>
          ) : loadError ? (
            <div className="rounded-xl border border-destructive/30 bg-card p-10 text-center text-sm text-destructive">
              {loadError}
            </div>
          ) : (
            <Tabs defaultValue="guide" className="space-y-5">
              <TabsList className="bg-muted/50">
                <TabsTrigger value="guide" className="gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Schemat rozmowy
                </TabsTrigger>
                <TabsTrigger value="info" className="gap-1.5">
                  <ClipboardList className="w-3.5 h-3.5" />
                  Informacje
                </TabsTrigger>
              </TabsList>

              {/* ── Tab: Conversation Guide ── */}
              <TabsContent value="guide">
                {guideSections.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <Button
                        variant={isEditing ? "default" : "outline"}
                        size="sm"
                        className="gap-2"
                        onClick={() => {
                          if (isEditing && id) {
                            saveSections(id, guideSections);
                            toast.success("Zmiany w schemacie zostały zapisane");
                          }
                          setIsEditing(!isEditing);
                        }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        {isEditing ? "Zapisz zmiany" : "Edytuj schemat"}
                      </Button>
                    </div>
                    <ConversationGuideView
                      sections={guideSections}
                      salonName={salonName}
                      ownerName={ownerName}
                      isEditing={isEditing}
                      onSectionsChange={(updated) => setGuideSections(updated)}
                    />
                  </div>
                ) : (
                  <div className="rounded-2xl border border-border/50 bg-card p-10 text-center">
                    <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Brak zaznaczonych wyników w audycie — upewnij się, że w generatorze audytu zaznaczono konkretne znaleziska (pozytywne i problemy).
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* ── Tab: Info & Status ── */}
              <TabsContent value="info">
                <div className="grid grid-cols-1 xl:grid-cols-[320px,1fr] gap-5">
                  {/* Sidebar */}
                  <div className="rounded-2xl border border-border/50 bg-card p-4 space-y-4">
                    <div className="rounded-xl overflow-hidden border border-border/40 bg-muted/20">
                      {auditDoc?.thumbnail ? (
                        <DocumentThumbnail doc={auditDoc} typeColors={typeColors} onClick={() => setAuditViewerOpen(true)} />
                      ) : (
                        <div className="aspect-[4/3]" />
                      )}
                    </div>

                    {auditDoc && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2"
                        onClick={() => setAuditViewerOpen(true)}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Zobacz audyt
                      </Button>
                    )}

                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <UserRound className="w-3.5 h-3.5" />
                        <span>Wygenerował: <span className="text-foreground">{creatorName || script?.guardian_name || "—"}</span></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Właściciel: <span className="text-foreground">{ownerName}</span></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Miasto: <span className="text-foreground">{(auditDoc?.data as any)?.city || "—"}</span></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span>Aurine Academy: <span className="text-foreground">{hasAcademy ? "Tak" : "Nie"}</span></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-3.5 h-3.5" />
                        <span>Data kontaktu: <span className="text-foreground">{sentDateLabel}</span></span>
                      </div>
                    </div>
                  </div>

                  {/* Status & result */}
                  <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-5">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <h2 className="text-base font-semibold text-foreground">Status i wynik rozmowy</h2>
                        <p className="text-xs text-muted-foreground">Zmień status i sprawdź zapisane dane rozmowy.</p>
                      </div>
                      <Select
                        value={script?.status || undefined}
                        onValueChange={(v) => handleStatusChange(v as ScriptStatus)}
                        disabled={savingStatus}
                      >
                        <SelectTrigger className="h-9 w-[220px]">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dzisiaj">Na dziś</SelectItem>
                          <SelectItem value="przyszly">Przyszłe</SelectItem>
                          <SelectItem value="zrealizowany">Zrealizowane</SelectItem>
                          <SelectItem value="sprzedany">Sprzedane</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="rounded-xl border border-border/50 p-4 space-y-1">
                        <p className="text-xs text-muted-foreground">Wynik</p>
                        <p className="text-sm text-foreground">{outcomeLabel}</p>
                      </div>
                      <div className="rounded-xl border border-border/50 p-4 space-y-1">
                        <p className="text-xs text-muted-foreground">Rozmowę przeprowadził</p>
                        <p className="text-sm text-foreground">{conductorDisplay}</p>
                      </div>
                      <div className="rounded-xl border border-border/50 p-4 space-y-1 md:col-span-2">
                        <p className="text-xs text-muted-foreground">Data rozmowy</p>
                        <p className="text-sm text-foreground">{conversationDateLabel}</p>
                      </div>
                      <div className="rounded-xl border border-border/50 p-4 space-y-1 md:col-span-2">
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                          <ClipboardList className="w-3.5 h-3.5" /> Notatki
                        </p>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{script?.notes || "Brak notatek"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
      {auditDoc && (
        <DocumentViewer
          document={auditDoc}
          open={auditViewerOpen}
          onClose={() => setAuditViewerOpen(false)}
        />
      )}
    </AppLayout>
  );
}
