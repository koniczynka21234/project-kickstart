import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Download, ChevronLeft, ChevronRight, ArrowLeft, Users, Save, Facebook, Instagram, Globe, Monitor, ChevronDown, Loader2, Check, X, GraduationCap, ThumbsUp, AlertTriangle, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SearchableSelect } from "@/components/ui/searchable-select";

import { toast } from "sonner";
import { AuditPreview } from "@/components/audit/AuditPreview";
import {
  AUDIT_CATEGORIES, generateAuditSlides, getDefaultEnabledCategories,
  getCategorySummary,
} from "@/components/audit/auditFindings";
import { CATEGORY_ICONS } from "@/components/audit/auditSections";
import { supabase } from "@/integrations/supabase/client";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useCloudDocumentHistory } from "@/hooks/useCloudDocumentHistory";
import { useThumbnailGenerator } from "@/hooks/useThumbnailGenerator";
import jsPDF from "jspdf";
import { toJpeg } from "html-to-image";
import { createConversationScriptForAudit } from "@/services/conversationScripts";

interface LeadOption {
  id: string;
  salon_name: string;
  owner_name: string | null;
  city: string | null;
}

const AuditGenerator = () => {
  const navigate = useNavigate();
  const { saveDocument, updateThumbnail } = useCloudDocumentHistory();
  const { generateThumbnail: genThumb } = useThumbnailGenerator();
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [currentSlide, setCurrentSlide] = useState(1);
  const [previewScale, setPreviewScale] = useState(0.5);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [linksOpen, setLinksOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingSlide, setGeneratingSlide] = useState(0);
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);

  const [enabledCategories, setEnabledCategories] = useState<Record<string, boolean>>(getDefaultEnabledCategories());
  const [checkedFindings, setCheckedFindings] = useState<Record<string, boolean>>({});
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [includeAcademy, setIncludeAcademy] = useState(true);
  const [findingsView, setFindingsView] = useState<"issues" | "positives">("issues");
  const [textOverrides, setTextOverrides] = useState<Record<string, { label?: string; description?: string; recommendation?: string }>>({});
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    ownerName: "",
    salonName: "",
    city: "",
    facebookUrl: "",
    instagramUrl: "",
    websiteUrl: "",
    sentDate: "",
  });

  const slides = generateAuditSlides(enabledCategories, checkedFindings);
  const TOTAL_SLIDES = slides.length;

  useEffect(() => {
    const fetchLeads = async () => {
      const { data } = await supabase.from('leads').select('id, salon_name, owner_name, city').order('salon_name');
      setLeads(data || []);
    };
    fetchLeads();
  }, []);

  // Load document from history
  useEffect(() => {
    const stored = sessionStorage.getItem("loadDocument");
    if (stored) {
      try {
        const doc = JSON.parse(stored);
        if (doc.type === "audit") {
          const d = doc.data;
          setFormData({
            ownerName: d.ownerName || "",
            salonName: d.salonName || "",
            city: d.city || "",
            facebookUrl: d.facebookUrl || "",
            instagramUrl: d.instagramUrl || "",
            websiteUrl: d.websiteUrl || "",
            sentDate: d.sentDate || "",
          });
          if (d.checkedFindings) {
            try { setCheckedFindings(JSON.parse(d.checkedFindings)); } catch {}
          }
          if (d.enabledCategories) {
            try { setEnabledCategories(JSON.parse(d.enabledCategories)); } catch {}
          }
          if (d.includeAcademy !== undefined) {
            setIncludeAcademy(d.includeAcademy === 'true');
          }
          if (d.textOverrides) {
            try { setTextOverrides(JSON.parse(d.textOverrides)); } catch {}
          }
        }
      } catch (e) {
        console.error("Error loading document:", e);
      }
      sessionStorage.removeItem("loadDocument");
    }
  }, []);

  useEffect(() => {
    const updateScale = () => {
      if (previewContainerRef.current) {
        const width = previewContainerRef.current.clientWidth - 48;
        const height = previewContainerRef.current.clientHeight - 100;
        const scaleByWidth = width / 1600;
        const scaleByHeight = height / 900;
        setPreviewScale(Math.min(scaleByWidth, scaleByHeight, 0.8));
      }
    };
    const rafId = requestAnimationFrame(updateScale);
    window.addEventListener('resize', updateScale);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updateScale);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextSlide();
      if (e.key === "ArrowLeft") prevSlide();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [TOTAL_SLIDES]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleCategory = (id: string) => {
    setEnabledCategories(prev => {
      const updated = { ...prev, [id]: !prev[id] };
      const newSlides = generateAuditSlides(updated, checkedFindings);
      if (currentSlide > newSlides.length) setCurrentSlide(Math.max(1, newSlides.length));
      return updated;
    });
  };

  // Multi-select: toggle individual findings
  // Selecting "positive" deselects all issues in subsection; selecting any issue deselects positive
  const selectFinding = (findingId: string, _subSectionId: string) => {
    setCheckedFindings(prev => {
      const updated = { ...prev };
      // Simple toggle — positive and issue findings are independent
      if (updated[findingId]) {
        delete updated[findingId];
      } else {
        updated[findingId] = true;
      }
      return updated;
    });
  };

  const nextSlide = () => setCurrentSlide(prev => (prev % TOTAL_SLIDES) + 1);
  const prevSlide = () => setCurrentSlide(prev => ((prev - 2 + TOTAL_SLIDES) % TOTAL_SLIDES) + 1);

  const handleLeadSelect = (leadId: string) => {
    setSelectedLeadId(leadId);
    if (leadId && leadId !== "none") {
      const lead = leads.find(l => l.id === leadId);
      if (lead) {
        setFormData(prev => ({
          ...prev,
          ownerName: lead.owner_name || "",
          salonName: lead.salon_name || "",
          city: lead.city || "",
        }));
      }
    }
  };

  const hasRequiredFields = formData.ownerName && formData.salonName;

  const buildSaveData = (): Record<string, string> => ({
    ...formData,
    checkedFindings: JSON.stringify(checkedFindings),
    enabledCategories: JSON.stringify(enabledCategories),
    includeAcademy: String(includeAcademy),
    textOverrides: JSON.stringify(textOverrides),
  });

  const handleSave = async () => {
    if (!hasRequiredFields) { toast.error("Uzupelnij wymagane pola"); return; }

    const docId = await saveDocument(
      "audit", formData.salonName, `Audyt dla ${formData.ownerName}`,
      buildSaveData(), undefined, undefined, selectedLeadId || undefined
    );
    setCurrentDocId(docId);
    if (!docId) {
      toast.error("Nie zapisano audytu w DB");
      return;
    }
    toast.success("Audyt zapisany!");

    if (docId) {
      const scriptIdEarly = await createConversationScriptForAudit({
        auditId: docId,
        salonName: formData.salonName,
        sentDate: formData.sentDate || null,
        leadId: selectedLeadId || null
      });
      if (!scriptIdEarly) {
        toast.error("Nie udało się utworzyć schematu rozmowy w DB");
      }
      const thumbnail = await genThumb({
        elementId: "capture-audit-slide-1",
        backgroundColor: "#000000", pixelRatio: 0.5, quality: 0.75, width: 1600, height: 900
      });
      if (thumbnail) await updateThumbnail(docId, thumbnail);
    }
  };

  const generatePDF = async () => {
    if (!hasRequiredFields) { toast.error("Uzupelnij wymagane pola"); return; }
    setIsGenerating(true);

    try {
      let docId = currentDocId;
      if (!docId) {
        docId = await saveDocument(
          "audit", formData.salonName, `Audyt dla ${formData.ownerName}`,
          buildSaveData(), undefined, undefined, selectedLeadId || undefined
        );
        setCurrentDocId(docId);
        if (docId) {
          const thumbnail = await genThumb({
            elementId: "capture-audit-slide-1",
            backgroundColor: "#000000", pixelRatio: 0.5, quality: 0.75, width: 1600, height: 900
          });
          if (thumbnail) await updateThumbnail(docId, thumbnail);
          await createConversationScriptForAudit({
            auditId: docId,
            salonName: formData.salonName,
            sentDate: formData.sentDate || null,
            leadId: selectedLeadId || null
          });
        }
      }

      const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [1600, 900], compress: true });

      for (let i = 0; i < TOTAL_SLIDES; i++) {
        setGeneratingSlide(i + 1);
        await new Promise(r => setTimeout(r, 0));

        const el = document.getElementById(`capture-audit-slide-${i + 1}`);
        if (!el) { console.error(`Audit slide ${i + 1} not found`); continue; }

        const imgData = await toJpeg(el, {
          width: 1600, height: 900, pixelRatio: 1.25,
          backgroundColor: "#000000", quality: 0.85, skipFonts: true,
        });

        if (i > 0) pdf.addPage([1600, 900], "landscape");
        pdf.addImage(imgData, "JPEG", 0, 0, 1600, 900, undefined, "FAST");
      }

      setGeneratingSlide(0);
      if (docId) {
        const scriptId = await createConversationScriptForAudit({
          auditId: docId,
          salonName: formData.salonName,
          sentDate: formData.sentDate || null
        });
        if (!scriptId) {
          toast.error("Nie udało się utworzyć schematu rozmowy w DB");
        }
      }
      const sanitizedName = formData.salonName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      pdf.save(`audyt-${sanitizedName}.pdf`);
      toast.success("Audyt PDF pobrany!");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Nie udalo sie wygenerowac PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  const currentSlideInfo = slides[currentSlide - 1];
  const enabledCount = Object.values(enabledCategories).filter(Boolean).length;
  const checkedCount = Object.keys(checkedFindings).length;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row w-full max-w-full overflow-x-hidden">
      {/* Left Panel */}
      <div className="w-full lg:w-[320px] xl:w-[360px] flex-shrink-0 lg:border-r border-border/50 overflow-y-auto bg-card/30 max-h-[40vh] lg:max-h-none lg:h-[calc(100vh-4rem)]">
        <div className="p-4 border-b border-border/50 sticky top-0 bg-card/95 backdrop-blur-sm z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-foreground">Generator Audytu</h1>
              <p className="text-xs text-muted-foreground">Analiza profilu klienta</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Lead Selection */}
          <div>
            <Label className="text-xs flex items-center gap-1">
              <Users className="w-3 h-3 text-primary" />
              Wybierz leada (auto-wypelni dane)
            </Label>
            <div className="mt-1">
              <SearchableSelect
                options={[
                  { value: "", label: "Wprowadz recznie" },
                  ...leads.map(l => ({
                    value: l.id,
                    label: l.salon_name,
                    sublabel: [l.owner_name, l.city].filter(Boolean).join(" \u2022 "),
                  })),
                ]}
                value={selectedLeadId}
                onValueChange={handleLeadSelect}
                placeholder="Szukaj leada..."
                searchPlaceholder="Wpisz nazwe salonu..."
                emptyMessage="Nie znaleziono leadow"
              />
            </div>
          </div>

          {/* Basic Info */}
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Imie wlascicielki *</Label>
              <Input value={formData.ownerName} onChange={e => handleInputChange("ownerName", e.target.value)} placeholder="np. Anna" className="h-9 mt-1" />
            </div>
            <div>
              <Label className="text-xs">Nazwa salonu *</Label>
              <Input value={formData.salonName} onChange={e => handleInputChange("salonName", e.target.value)} placeholder="np. Beauty Studio Anna" className="h-9 mt-1" />
            </div>
            <div>
              <Label className="text-xs">Miasto</Label>
              <Input value={formData.city} onChange={e => handleInputChange("city", e.target.value)} placeholder="np. Nowy Sacz" className="h-9 mt-1" />
            </div>
            <div>
              <Label className="text-xs">Data wyslania audytu (system)</Label>
              <Input type="date" value={formData.sentDate} onChange={e => handleInputChange("sentDate", e.target.value)} className="h-9 mt-1" />
            </div>
          </div>

          {/* Academy Toggle */}
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-fuchsia-500/10 to-pink-500/10 rounded-xl border border-fuchsia-500/30">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-fuchsia-400" />
              <div>
                <p className="text-xs font-medium text-foreground">Aurine Academy</p>
                <p className="text-[10px] text-muted-foreground">{includeAcademy ? "Widoczne w audycie" : "Ukryte"}</p>
              </div>
            </div>
            <Switch checked={includeAcademy} onCheckedChange={setIncludeAcademy} />
          </div>

          {/* Links - Collapsible */}
          <Collapsible open={linksOpen} onOpenChange={setLinksOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-secondary/50 border border-border/50 hover:bg-secondary/80 transition-colors">
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-medium text-foreground">Linki do profili</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${linksOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3 space-y-3">
              <div>
                <Label className="text-xs flex items-center gap-1">
                  <Facebook className="w-3 h-3 text-blue-400" /> Facebook
                </Label>
                <Input value={formData.facebookUrl} onChange={e => handleInputChange("facebookUrl", e.target.value)} placeholder="https://facebook.com/..." className="h-9 mt-1" />
              </div>
              <div>
                <Label className="text-xs flex items-center gap-1">
                  <Instagram className="w-3 h-3 text-purple-400" /> Instagram
                </Label>
                <Input value={formData.instagramUrl} onChange={e => handleInputChange("instagramUrl", e.target.value)} placeholder="https://instagram.com/..." className="h-9 mt-1" />
              </div>
              <div>
                <Label className="text-xs flex items-center gap-1">
                  <Monitor className="w-3 h-3 text-indigo-400" /> Strona www
                </Label>
                <Input value={formData.websiteUrl} onChange={e => handleInputChange("websiteUrl", e.target.value)} placeholder="https://..." className="h-9 mt-1" />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Categories with Findings */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-foreground">Sekcje audytu</p>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                {checkedCount} zaznaczonych · {TOTAL_SLIDES} slajdow
              </span>
            </div>

            {/* Toggle: Positives vs Issues */}
            <div className="flex rounded-lg bg-secondary/50 border border-border/50 p-0.5">
              <button
                onClick={() => setFindingsView("positives")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-medium transition-all ${
                  findingsView === "positives"
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ThumbsUp className="w-3 h-3" />
                Co działa dobrze
              </button>
              <button
                onClick={() => setFindingsView("issues")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-medium transition-all ${
                  findingsView === "issues"
                    ? "bg-red-500/15 text-red-400 border border-red-500/30"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <AlertTriangle className="w-3 h-3" />
                Do poprawy
              </button>
            </div>

            <div className="space-y-1">
              {/* Fixed: Intro */}
              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-primary/5 border border-primary/20">
                <div className="w-7 h-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                  <span className="text-xs">1</span>
                </div>
                <p className="text-xs font-medium text-foreground">Strona tytulowa</p>
              </div>

              {/* Dynamic categories */}
              {AUDIT_CATEGORIES.map((cat) => {
                const isEnabled = enabledCategories[cat.id];
                const summary = getCategorySummary(cat.id, checkedFindings);
                const checkedInCat = summary.positives + summary.issues;

                return (
                  <div key={cat.id}>
                    <div className={`group flex items-center gap-2.5 p-2 rounded-lg border transition-all ${
                      isEnabled
                        ? 'bg-primary/5 border-primary/20 hover:border-primary/40'
                        : 'bg-transparent border-transparent hover:bg-secondary/30 hover:border-border/30'
                    }`}>
                      {cat.subSections.length > 0 && (
                        <button
                          onClick={() => setExpandedCategories(prev => ({ ...prev, [cat.id]: !prev[cat.id] }))}
                          className="w-5 h-5 flex items-center justify-center flex-shrink-0"
                        >
                          <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${expandedCategories[cat.id] ? 'rotate-180' : ''}`} />
                        </button>
                      )}
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                        isEnabled ? 'bg-primary/15 text-primary' : 'bg-secondary/50 text-muted-foreground'
                      }`}>
                        {CATEGORY_ICONS[cat.id]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium leading-tight ${isEnabled ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {cat.name}
                        </p>
                        {checkedInCat > 0 && (
                          <p className="text-[10px] text-muted-foreground">
                            {summary.positives > 0 && <span className="text-emerald-400">{summary.positives} ok</span>}
                            {summary.positives > 0 && summary.issues > 0 && " · "}
                            {summary.issues > 0 && <span className="text-red-400">{summary.issues} do poprawy</span>}
                          </p>
                        )}
                      </div>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={() => toggleCategory(cat.id)}
                        className="scale-75"
                      />
                    </div>

                    {/* Sub-sections with findings — filtered by view */}
                    {isEnabled && cat.subSections.length > 0 && expandedCategories[cat.id] && (
                      <div className="ml-4 mt-1 mb-2 space-y-2 border-l-2 border-primary/10 pl-3">
                        {cat.subSections.map((sub) => {
                          const filteredFindings = sub.findings.filter(f =>
                            findingsView === "positives" ? f.type === "positive" : f.type === "issue"
                          );
                          const selectedInSub = filteredFindings.filter(f => checkedFindings[f.id]);
                          
                          if (filteredFindings.length === 0) return null;
                          
                          return (
                            <div key={sub.id}>
                              <p className="text-[11px] font-semibold text-muted-foreground mb-1.5 px-2 flex items-center justify-between">
                                {sub.name}
                                {selectedInSub.length > 0 && (
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                                    findingsView === "positives"
                                      ? 'bg-emerald-500/15 text-emerald-400'
                                      : 'bg-red-500/15 text-red-400'
                                  }`}>
                                    {selectedInSub.length} zaznaczonych
                                  </span>
                                )}
                              </p>
                              
                              {filteredFindings.map((finding) => {
                                const isPositive = finding.type === "positive";
                                const isChecked = checkedFindings[finding.id];
                                return (
                                  <div
                                    key={finding.id}
                                    className={`flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-colors ${
                                      isChecked
                                        ? isPositive
                                          ? 'bg-emerald-500/10 border border-emerald-500/20'
                                          : 'bg-red-500/10 border border-red-500/20'
                                        : 'hover:bg-secondary/30'
                                    }`}
                                    onClick={() => selectFinding(finding.id, sub.id)}
                                  >
                                    <div className={`w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                      isChecked
                                        ? isPositive ? 'border-emerald-400 bg-emerald-400' : 'border-red-400 bg-red-400'
                                        : isPositive ? 'border-emerald-500/30' : 'border-muted-foreground/40'
                                    }`}>
                                      {isChecked && <Check className="w-2.5 h-2.5 text-white" />}
                                    </div>
                                    <span className={`text-[11px] flex-1 ${
                                      isChecked
                                        ? isPositive ? 'text-emerald-300 font-medium' : 'text-red-300 font-medium'
                                        : 'text-muted-foreground'
                                    }`}>
                                      {finding.label}
                                    </span>
                                    {isPositive
                                      ? <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                                      : <X className="w-3 h-3 text-red-400 flex-shrink-0" />
                                    }
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Fixed: Recommendations + Summary */}
              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-primary/5 border border-primary/20">
                <div className="w-7 h-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                  <span className="text-[10px]">R</span>
                </div>
                <p className="text-xs font-medium text-foreground">Rekomendacje</p>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-primary/5 border border-primary/20">
                <div className="w-7 h-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                  <span className="text-[10px]">P</span>
                </div>
                <p className="text-xs font-medium text-foreground">Podsumowanie</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-border/50 space-y-2">
            <Button onClick={handleSave} className="w-full" disabled={!hasRequiredFields || isGenerating}>
              <Save className="w-4 h-4 mr-2" />
              Zapisz audyt
            </Button>
            <Button variant="secondary" className="w-full" disabled={!hasRequiredFields || isGenerating} onClick={generatePDF}>
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {generatingSlide > 0 ? `Slajd ${generatingSlide}/${TOTAL_SLIDES}...` : "Generuje..."}
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Pobierz PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Right Panel - Live Preview */}
      <div ref={previewContainerRef} className="flex-1 overflow-hidden bg-black/95 p-4 lg:p-6 flex flex-col">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Button onClick={prevSlide} size="icon" variant="outline" className="h-8 w-8" disabled={TOTAL_SLIDES === 0}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="text-center min-w-[160px]">
              <p className="text-xs text-muted-foreground">Slajd {currentSlide} z {TOTAL_SLIDES}</p>
              <p className="text-sm text-foreground font-medium">
                {currentSlideInfo?.categoryName || currentSlideInfo?.type || ""}
              </p>
            </div>
            <Button onClick={nextSlide} size="icon" variant="outline" className="h-8 w-8" disabled={TOTAL_SLIDES === 0}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant={isEditing ? "default" : "outline"}
              size="sm"
              className="gap-2 ml-2"
              onClick={() => {
                if (isEditing) {
                  toast.success("Zmiany w audycie zostały zapisane");
                }
                setIsEditing(!isEditing);
              }}
            >
              <Pencil className="w-3.5 h-3.5" />
              {isEditing ? "Zapisz zmiany" : "Edytuj teksty"}
            </Button>
          </div>

          <div className="flex gap-1.5 flex-wrap justify-end max-w-[200px]">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx + 1)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  currentSlide === idx + 1 ? "bg-primary scale-125" : "bg-muted hover:bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div
            className="rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10"
            style={{
              width: `${1600 * previewScale}px`,
              height: `${900 * previewScale}px`,
              backgroundColor: '#0a0a0a',
            }}
          >
            <div
              style={{
                transform: `scale(${previewScale})`,
                transformOrigin: 'top left',
                width: '1600px',
                height: '900px',
              }}
            >
              <AuditPreview
                data={formData}
                currentSlide={currentSlide}
                enabledCategories={enabledCategories}
                checkedFindings={checkedFindings}
                includeAcademy={includeAcademy}
                textOverrides={textOverrides}
                isEditing={isEditing}
                onTextChange={(findingId, field, value) => {
                  setTextOverrides(prev => ({
                    ...prev,
                    [findingId]: { ...prev[findingId], [field]: value }
                  }));
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Hidden capture elements for PDF */}
      <div
        style={{ position: 'fixed', left: '-99999px', top: 0, pointerEvents: 'none' }}
        aria-hidden="true"
      >
        {slides.map((_, idx) => (
          <div
            key={idx}
            id={`capture-audit-slide-${idx + 1}`}
            style={{ width: '1600px', height: '900px', backgroundColor: '#000000', overflow: 'hidden' }}
          >
            <AuditPreview
              data={formData}
              currentSlide={idx + 1}
              enabledCategories={enabledCategories}
              checkedFindings={checkedFindings}
              includeAcademy={includeAcademy}
              textOverrides={textOverrides}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default AuditGenerator;
