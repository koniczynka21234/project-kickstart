import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Download, ChevronLeft, ChevronRight, ArrowLeft, Users, FileSearch, Target, TrendingUp, Users2, Palette, MessageSquare, BarChart3, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";

interface LeadOption {
  id: string;
  salon_name: string;
  owner_name: string | null;
  city: string | null;
}

interface AuditSection {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
}

const AuditGenerator = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [currentSlide, setCurrentSlide] = useState(1);
  const [previewScale, setPreviewScale] = useState(0.5);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    ownerName: "",
    salonName: "",
    city: "",
    facebookUrl: "",
    instagramUrl: "",
  });

  const [sections, setSections] = useState<AuditSection[]>([
    { id: "intro", name: "Strona tytułowa", description: "Powitanie i dane salonu", icon: <FileSearch className="w-4 h-4" />, enabled: true },
    { id: "goals", name: "Cele i oczekiwania", description: "Analiza celów biznesowych", icon: <Target className="w-4 h-4" />, enabled: true },
    { id: "audience", name: "Grupa docelowa", description: "Profil idealnego klienta", icon: <Users2 className="w-4 h-4" />, enabled: true },
    { id: "social", name: "Analiza social media", description: "Przegląd profili FB/IG", icon: <MessageSquare className="w-4 h-4" />, enabled: true },
    { id: "branding", name: "Spójność wizerunkowa", description: "Logo, kolory, styl", icon: <Palette className="w-4 h-4" />, enabled: true },
    { id: "competition", name: "Analiza konkurencji", description: "Porównanie z konkurentami", icon: <TrendingUp className="w-4 h-4" />, enabled: false },
    { id: "recommendations", name: "Rekomendacje", description: "Konkretne zalecenia", icon: <Settings2 className="w-4 h-4" />, enabled: true },
    { id: "summary", name: "Podsumowanie", description: "Wnioski i następne kroki", icon: <BarChart3 className="w-4 h-4" />, enabled: true },
  ]);

  const enabledSections = sections.filter(s => s.enabled);
  const TOTAL_SLIDES = enabledSections.length;

  useEffect(() => {
    const fetchLeads = async () => {
      const { data } = await supabase.from('leads').select('id, salon_name, owner_name, city').order('salon_name');
      setLeads(data || []);
    };
    fetchLeads();
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
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleSection = (id: string) => {
    setSections(prev => {
      const updated = prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s);
      // Reset slide if current is out of bounds
      const newEnabled = updated.filter(s => s.enabled).length;
      if (currentSlide > newEnabled) {
        setCurrentSlide(Math.max(1, newEnabled));
      }
      return updated;
    });
  };

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

  const hasRequiredFields = formData.ownerName && formData.salonName;

  const handleSave = async () => {
    if (!hasRequiredFields) {
      toast.error("Uzupełnij wymagane pola");
      return;
    }
    toast.success("Audyt zapisany!");
  };

  const currentSection = enabledSections[currentSlide - 1];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row w-full max-w-full overflow-x-hidden">
      {/* Left Panel - Form */}
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
          {/* Form Fields */}
          <div className="space-y-3">
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
              <Label className="text-xs">Miasto</Label>
              <Input
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
                placeholder="np. Nowy Sącz"
                className="h-9 mt-1"
              />
            </div>

            <div>
              <Label className="text-xs">URL profilu Facebook</Label>
              <Input
                value={formData.facebookUrl}
                onChange={(e) => handleInputChange("facebookUrl", e.target.value)}
                placeholder="https://facebook.com/..."
                className="h-9 mt-1"
              />
            </div>

            <div>
              <Label className="text-xs">URL profilu Instagram</Label>
              <Input
                value={formData.instagramUrl}
                onChange={(e) => handleInputChange("instagramUrl", e.target.value)}
                placeholder="https://instagram.com/..."
                className="h-9 mt-1"
              />
            </div>
          </div>

          {/* Sections Toggles */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-foreground">Sekcje audytu:</p>
            <div className="space-y-1.5">
              {sections.map((section) => (
                <div 
                  key={section.id}
                  className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                    section.enabled 
                      ? 'bg-primary/5 border-primary/30' 
                      : 'bg-secondary/30 border-border/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={section.enabled ? 'text-primary' : 'text-muted-foreground'}>
                      {section.icon}
                    </span>
                    <div>
                      <p className={`text-xs font-medium ${section.enabled ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {section.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{section.description}</p>
                    </div>
                  </div>
                  <Switch 
                    checked={section.enabled} 
                    onCheckedChange={() => toggleSection(section.id)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-border/50 space-y-2">
            <Button onClick={handleSave} className="w-full" disabled={!hasRequiredFields}>
              Zapisz audyt
            </Button>
            <Button variant="secondary" className="w-full" disabled={!hasRequiredFields}>
              <Download className="w-4 h-4 mr-2" />
              Pobierz PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Right Panel - Live Preview */}
      <div ref={previewContainerRef} className="flex-1 overflow-hidden bg-black/95 p-4 lg:p-6 flex flex-col">
        {/* Slide Navigation */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Button onClick={prevSlide} size="icon" variant="outline" className="h-8 w-8" disabled={TOTAL_SLIDES === 0}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="text-center min-w-[140px]">
              <p className="text-xs text-muted-foreground">Slajd {currentSlide} z {TOTAL_SLIDES}</p>
              <p className="text-sm text-foreground font-medium">{currentSection?.name || "Brak sekcji"}</p>
            </div>
            <Button onClick={nextSlide} size="icon" variant="outline" className="h-8 w-8" disabled={TOTAL_SLIDES === 0}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex gap-1.5">
            {enabledSections.map((section, idx) => (
              <button
                key={section.id}
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
              {/* Placeholder Slide Content */}
              <div className="w-full h-full bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 flex flex-col items-center justify-center text-white p-16">
                {currentSection ? (
                  <>
                    <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center mb-8 text-primary">
                      {currentSection.icon}
                    </div>
                    <h1 className="text-5xl font-bold mb-4 text-center">{currentSection.name}</h1>
                    <p className="text-2xl text-zinc-400 mb-8">{currentSection.description}</p>
                    
                    {currentSection.id === "intro" && formData.salonName && (
                      <div className="mt-8 text-center">
                        <p className="text-3xl font-medium text-primary">{formData.salonName}</p>
                        {formData.city && <p className="text-xl text-zinc-500 mt-2">{formData.city}</p>}
                        {formData.ownerName && <p className="text-lg text-zinc-600 mt-4">Przygotowane dla: {formData.ownerName}</p>}
                      </div>
                    )}
                    
                    <div className="absolute bottom-8 left-8 right-8 flex items-center justify-between text-sm text-zinc-600">
                      <span>Audyt Social Media</span>
                      <span>Aurine Agency</span>
                    </div>
                  </>
                ) : (
                  <p className="text-xl text-zinc-500">Włącz przynajmniej jedną sekcję</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditGenerator;
