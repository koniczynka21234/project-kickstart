import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Download, ChevronLeft, ChevronRight, ArrowLeft, Users, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { toast } from "sonner";
import { PresentationPreview } from "@/components/presentation/PresentationPreview";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCloudDocumentHistory } from "@/hooks/useCloudDocumentHistory";
import { useThumbnailGenerator } from "@/hooks/useThumbnailGenerator";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
import { toJpeg } from "html-to-image";

const SLIDES_WITH_ACADEMY = 7;
const SLIDES_WITHOUT_ACADEMY = 6;
const slideNamesWithAcademy = ["Powitanie", "Wyzwania salonów", "Jak pomagamy", "Przebieg współpracy", "Aurine Academy", "Specjalna oferta", "Kontakt"];
const slideNamesWithoutAcademy = ["Powitanie", "Wyzwania salonów", "Jak pomagamy", "Przebieg współpracy", "Specjalna oferta", "Kontakt"];

interface LeadOption {
  id: string;
  salon_name: string;
  owner_name: string | null;
  city: string | null;
}

const PresentationGenerator = () => {
  const navigate = useNavigate();
  const { saveDocument, updateThumbnail } = useCloudDocumentHistory();
  const { generateThumbnail: genThumb } = useThumbnailGenerator();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingSlide, setGeneratingSlide] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(1);
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);
  const [previewScale, setPreviewScale] = useState(0.5);
  const [previewReady, setPreviewReady] = useState(false);
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [includeAcademy, setIncludeAcademy] = useState(true);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const TOTAL_SLIDES = includeAcademy ? SLIDES_WITH_ACADEMY : SLIDES_WITHOUT_ACADEMY;
  const slideNames = includeAcademy ? slideNamesWithAcademy : slideNamesWithoutAcademy;

  const [formData, setFormData] = useState({
    ownerName: "",
    salonName: "",
    city: "",
    includeAcademy: true,
  });

  useEffect(() => {
    const fetchLeads = async () => {
      const { data } = await supabase.from('leads').select('id, salon_name, owner_name, city').order('salon_name');
      setLeads(data || []);
    };
    fetchLeads();
  }, []);

  useEffect(() => {
    const stored = sessionStorage.getItem("loadDocument");
    if (stored) {
      try {
        const doc = JSON.parse(stored);
        if (doc.type === "presentation") {
          const loadedData = doc.data;
          setFormData({
            ownerName: loadedData.ownerName || "",
            salonName: loadedData.salonName || "",
            city: loadedData.city || "",
            includeAcademy: loadedData.includeAcademy !== "false", // Default to true if not set
          });
          // Restore includeAcademy from saved data
          setIncludeAcademy(loadedData.includeAcademy !== "false");
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
        const newScale = Math.min(scaleByWidth, scaleByHeight, 0.8);
        setPreviewScale(newScale);
        // Mark as ready only when we have valid dimensions
        if (width > 0 && height > 0 && !previewReady) {
          setPreviewReady(true);
        }
      }
    };
    // Use requestAnimationFrame to ensure container is rendered
    const rafId = requestAnimationFrame(() => {
      updateScale();
    });
    window.addEventListener('resize', updateScale);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updateScale);
    };
  }, [previewReady]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextSlide();
      if (e.key === "ArrowLeft") prevSlide();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Data for PresentationPreview (without includeAcademy)
  const presentationData = {
    ownerName: formData.ownerName,
    salonName: formData.salonName,
    city: formData.city,
  };

  const hasRequiredFields = formData.ownerName && formData.salonName && formData.city;

  const nextSlide = () => setCurrentSlide((prev) => (prev % TOTAL_SLIDES) + 1);
  const prevSlide = () => setCurrentSlide((prev) => ((prev - 2 + TOTAL_SLIDES) % TOTAL_SLIDES) + 1);

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

  const handleSave = async () => {
    if (!hasRequiredFields) {
      toast.error("Uzupełnij wszystkie pola");
      return;
    }

    // Include the academy toggle state in saved data (as string for DB compatibility)
    const dataToSave = {
      ownerName: formData.ownerName,
      salonName: formData.salonName,
      city: formData.city,
      includeAcademy: includeAcademy ? "true" : "false",
    };

    const docId = await saveDocument(
      "presentation",
      formData.salonName,
      `Prezentacja dla ${formData.ownerName}${includeAcademy ? '' : ' (bez Academy)'}`,
      dataToSave,
      undefined,
      undefined,
      selectedLeadId || undefined
    );
    setCurrentDocId(docId);
    toast.success("Prezentacja zapisana!");

    if (docId) {
      const thumbnail = await genThumb({
        elementId: "capture-slide-1",
        backgroundColor: "#000000",
        pixelRatio: 0.5,
        quality: 0.75,
        width: 1600,
        height: 900
      });
      if (thumbnail) await updateThumbnail(docId, thumbnail);
    }
  };

  const generatePDF = async () => {
    if (!hasRequiredFields) {
      toast.error("Uzupełnij wszystkie pola");
      return;
    }

    setIsGenerating(true);
    
    try {
      // Auto-save before download
      let docId = currentDocId;
      if (!docId) {
        const dataToSave = {
          ownerName: formData.ownerName,
          salonName: formData.salonName,
          city: formData.city,
          includeAcademy: includeAcademy ? "true" : "false",
        };
        docId = await saveDocument(
          "presentation",
          formData.salonName,
          `Prezentacja dla ${formData.ownerName}${includeAcademy ? '' : ' (bez Academy)'}`,
          dataToSave,
          undefined,
          undefined,
          selectedLeadId || undefined
        );
        setCurrentDocId(docId);
        
        if (docId) {
          const thumbnail = await genThumb({
            elementId: "capture-slide-1",
            backgroundColor: "#000000",
            pixelRatio: 0.5,
            quality: 0.75,
            width: 1600,
            height: 900
          });
          if (thumbnail) await updateThumbnail(docId, thumbnail);
        }
      }

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [1600, 900],
        compress: true,
      });

      // Capture all slides from hidden pre-rendered elements - NO slide switching!
      for (let i = 1; i <= TOTAL_SLIDES; i++) {
        setGeneratingSlide(i);
        
        const slideElement = document.getElementById(`capture-slide-${i}`);
        if (!slideElement) {
          console.error(`Slide ${i} element not found`);
          continue;
        }

        const imgData = await toJpeg(slideElement, {
          width: 1600,
          height: 900,
          pixelRatio: 2,
          backgroundColor: "#000000",
          quality: 0.92,
        });

        if (i > 1) pdf.addPage([1600, 900], "landscape");
        pdf.addImage(imgData, "JPEG", 0, 0, 1600, 900, undefined, "FAST");
      }
      
      setGeneratingSlide(0);

      const sanitizedName = formData.salonName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      pdf.save(`prezentacja-${sanitizedName}.pdf`);
      toast.success("Prezentacja PDF pobrana!");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Nie udało się wygenerować PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AppLayout>
      <div className="min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row w-full max-w-full overflow-x-hidden">
        {/* Left Panel - Form */}
        <div className="w-full lg:w-[320px] xl:w-[360px] flex-shrink-0 lg:border-r border-border/50 overflow-y-auto bg-card/30 max-h-[40vh] lg:max-h-none lg:h-[calc(100vh-4rem)]">
          <div className="p-4 border-b border-border/50 sticky top-0 bg-card/95 backdrop-blur-sm z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold text-foreground">Generator Prezentacji</h1>
                <p className="text-xs text-muted-foreground">Cold mail slides</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Form Fields */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Imię właścicielki *</Label>
                <Input
                  value={formData.ownerName}
                  onChange={(e) => handleInputChange("ownerName", e.target.value)}
                  placeholder="np. Anna"
                  className="h-9 mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Nazwa salonu *</Label>
                <Input
                  value={formData.salonName}
                  onChange={(e) => handleInputChange("salonName", e.target.value)}
                  placeholder="np. Beauty Studio Anna"
                  className="h-9 mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Miasto *</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  placeholder="np. Nowy Sącz"
                  className="h-9 mt-1"
                />
              </div>

              <div>
                <Label className="text-xs flex items-center gap-1">
                  <Users className="w-3 h-3 text-primary" />
                  Wybierz leada (auto-wypełni dane)
                </Label>
                <div className="mt-1">
                  <SearchableSelect
                    options={[
                      { value: "", label: "Wprowadź ręcznie" },
                      ...leads.map((l) => ({
                        value: l.id,
                        label: l.salon_name,
                        sublabel: [l.owner_name, l.city].filter(Boolean).join(" • "),
                      })),
                    ]}
                    value={selectedLeadId}
                    onValueChange={handleLeadSelect}
                    placeholder="Szukaj leada..."
                    searchPlaceholder="Wpisz nazwę salonu lub właściciela..."
                    emptyMessage="Nie znaleziono leadów"
                  />
                </div>
              </div>
            </div>

            {/* Academy Toggle */}
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-fuchsia-500/10 to-pink-500/10 rounded-xl border border-fuchsia-500/30">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-fuchsia-400" />
                <div>
                  <p className="text-xs font-medium text-foreground">Aurine Academy</p>
                  <p className="text-[10px] text-muted-foreground">Dodaj slajd z aplikacją</p>
                </div>
              </div>
              <Switch 
                checked={includeAcademy} 
                onCheckedChange={(checked) => {
                  setIncludeAcademy(checked);
                  // Reset to slide 1 when toggling to avoid out of bounds
                  setCurrentSlide(1);
                }} 
              />
            </div>

            {/* Slide Info */}
            <div className="p-3 bg-secondary/50 rounded-xl border border-border/50">
              <p className="text-xs font-medium text-foreground mb-2">Prezentacja zawiera ({TOTAL_SLIDES} slajdów):</p>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                {slideNames.map((name, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-medium ${name === "Aurine Academy" ? 'bg-fuchsia-500/20 text-fuchsia-400' : 'bg-primary/20 text-primary'}`}>
                      {idx + 1}
                    </span>
                    <span className={name === "Aurine Academy" ? 'text-fuchsia-400' : ''}>{name}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-border/50 space-y-2">
              <Button onClick={handleSave} className="w-full" disabled={!hasRequiredFields}>
                Zapisz prezentację
              </Button>
              <Button onClick={generatePDF} disabled={isGenerating || !hasRequiredFields} variant="secondary" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                {isGenerating 
                  ? generatingSlide > 0 
                    ? `Generuję slajd ${generatingSlide}/${TOTAL_SLIDES}...` 
                    : "Przygotowuję..."
                  : "Pobierz PDF"}
              </Button>
            </div>
          </div>
        </div>

        {/* Right Panel - Live Preview */}
        <div ref={previewContainerRef} className="flex-1 overflow-hidden bg-black/95 p-4 lg:p-6 flex flex-col">
          {/* Slide Navigation */}
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              <Button onClick={prevSlide} size="icon" variant="outline" className="h-8 w-8">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="text-center min-w-[140px]">
                <p className="text-xs text-muted-foreground">Slajd {currentSlide} z {TOTAL_SLIDES}</p>
                <p className="text-sm text-foreground font-medium">{slideNames[currentSlide - 1]}</p>
              </div>
              <Button onClick={nextSlide} size="icon" variant="outline" className="h-8 w-8">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex gap-1.5">
              {slideNames.map((_, idx) => (
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
          
          {/* Preview */}
          <div className="flex-1 flex items-center justify-center">
            {!previewReady ? (
              <div 
                className="rounded-xl bg-black/50 animate-pulse flex items-center justify-center"
                style={{ 
                  width: `${1600 * 0.5}px`,
                  height: `${900 * 0.5}px`,
                }}
              >
                <span className="text-muted-foreground text-sm">Ładowanie podglądu...</span>
              </div>
            ) : (
              <div 
                className="rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10"
                style={{ 
                  width: `${1600 * previewScale}px`,
                  height: `${900 * previewScale}px`,
                  backgroundColor: '#000',
                }}
              >
                <div 
                  id="presentation-preview"
                  style={{ 
                    transform: `scale(${previewScale})`,
                    transformOrigin: 'top left',
                    width: '1600px',
                    height: '900px',
                  }}
                >
                  <PresentationPreview data={presentationData} currentSlide={currentSlide} includeAcademy={includeAcademy} />
                </div>
              </div>
            )}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-3 flex-shrink-0">
            Użyj strzałek ← → do nawigacji
          </p>
        </div>

        {/* Hidden capture elements - ALL slides pre-rendered for instant PDF generation */}
        <div 
          style={{
            position: 'fixed',
            left: '-99999px',
            top: 0,
            pointerEvents: 'none',
          }}
          aria-hidden="true"
        >
          {Array.from({ length: TOTAL_SLIDES }, (_, i) => i + 1).map((slideNum) => (
            <div
              key={slideNum}
              id={`capture-slide-${slideNum}`}
              style={{
                width: '1600px',
                height: '900px',
                backgroundColor: '#000000',
                overflow: 'hidden',
              }}
            >
              <PresentationPreview data={presentationData} currentSlide={slideNum} includeAcademy={includeAcademy} />
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default PresentationGenerator;