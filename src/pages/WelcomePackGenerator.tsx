import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Download, ChevronLeft, ChevronRight, ArrowLeft, Users, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { WelcomePackPreview } from "@/components/welcomepack/WelcomePackPreview";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCloudDocumentHistory } from "@/hooks/useCloudDocumentHistory";
import { useThumbnailGenerator } from "@/hooks/useThumbnailGenerator";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
import { toJpeg } from "html-to-image";

const TOTAL_SLIDES = 6;
const slideNames = ["Powitanie", "Twój opiekun", "Onboarding", "Ciągła obsługa", "Wymagania", "Kontakt"];

interface ClientOption {
  id: string;
  salon_name: string;
  owner_name: string | null;
  city: string | null;
  assigned_to: string | null;
}

interface ManagerOption {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
}

const WelcomePackGenerator = () => {
  const navigate = useNavigate();
  const { saveDocument, updateThumbnail } = useCloudDocumentHistory();
  const { generateThumbnail: genThumb } = useThumbnailGenerator();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingSlide, setGeneratingSlide] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(1);
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);
  const [previewScale, setPreviewScale] = useState(0.5);
  const [previewReady, setPreviewReady] = useState(false);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [managers, setManagers] = useState<ManagerOption[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedManagerId, setSelectedManagerId] = useState<string>("");
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    ownerName: "",
    salonName: "",
    city: "",
    startDate: "",
    managerName: "",
    managerPhone: "",
    managerEmail: "",
  });
  const [subscriptionCode, setSubscriptionCode] = useState<string | null>(null);

  useEffect(() => {
    const fetchClients = async () => {
      const { data } = await supabase.from('clients').select('id, salon_name, owner_name, city, assigned_to').order('salon_name');
      setClients(data || []);
    };
    
    const fetchManagers = async () => {
      const { data } = await supabase.from('profiles').select('id, full_name, phone, email').not('full_name', 'is', null).order('full_name');
      setManagers(data || []);
    };
    
    fetchClients();
    fetchManagers();
  }, []);

  useEffect(() => {
    const stored = sessionStorage.getItem("loadDocument");
    if (stored) {
      try {
        const doc = JSON.parse(stored);
        if (doc.type === "welcomepack") {
          setFormData(doc.data as typeof formData);
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
        if (width > 0 && height > 0 && !previewReady) {
          setPreviewReady(true);
        }
      }
    };
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

  const hasRequiredFields = formData.ownerName && formData.salonName;

  const nextSlide = () => setCurrentSlide((prev) => (prev % TOTAL_SLIDES) + 1);
  const prevSlide = () => setCurrentSlide((prev) => ((prev - 2 + TOTAL_SLIDES) % TOTAL_SLIDES) + 1);

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    if (clientId && clientId !== "none") {
      const client = clients.find(c => c.id === clientId);
      if (client) {
        setFormData(prev => ({
          ...prev,
          ownerName: client.owner_name || "",
          salonName: client.salon_name || "",
          city: client.city || "",
        }));
        
        // Auto-fill manager data based on client's assigned guardian
        if (client.assigned_to) {
          const manager = managers.find(m => m.id === client.assigned_to);
          if (manager) {
            setSelectedManagerId(manager.id);
            setFormData(prev => ({
              ...prev,
              managerName: manager.full_name || "",
              managerPhone: manager.phone || "",
              managerEmail: manager.email || "",
            }));
          }
        } else {
          // Warning if client has no assigned guardian
          toast.warning("Ten klient nie ma przypisanego opiekuna", {
            description: "Wybierz opiekuna ręcznie z listy poniżej"
          });
          setSelectedManagerId("");
          setFormData(prev => ({
            ...prev,
            managerName: "",
            managerPhone: "",
            managerEmail: "",
          }));
        }
      }
    }
  };

  const handleManagerSelect = (managerId: string) => {
    setSelectedManagerId(managerId);
    if (managerId) {
      const manager = managers.find(m => m.id === managerId);
      if (manager) {
        setFormData(prev => ({
          ...prev,
          managerName: manager.full_name || "",
          managerPhone: manager.phone || "",
          managerEmail: manager.email || "",
        }));
      }
    }
  };

  // Generate subscription code for client
  const generateSubscriptionCode = async (clientId: string): Promise<string | null> => {
    try {
      // Check if client already has an active code
      const { data: existingCodes } = await supabase
        .from('subscription_codes')
        .select('code')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .gte('valid_until', new Date().toISOString().split('T')[0])
        .limit(1);

      if (existingCodes && existingCodes.length > 0) {
        return existingCodes[0].code;
      }

      // Generate new code
      const { data: newCode, error } = await supabase.rpc('generate_subscription_code');
      if (error) throw error;

      // Calculate validity (1 year from now)
      const validUntil = new Date();
      validUntil.setFullYear(validUntil.getFullYear() + 1);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Insert code
      const { error: insertError } = await supabase
        .from('subscription_codes')
        .insert({
          client_id: clientId,
          code: newCode,
          valid_until: validUntil.toISOString().split('T')[0],
          created_by: user?.id,
        });

      if (insertError) throw insertError;

      return newCode;
    } catch (error) {
      console.error('Error generating subscription code:', error);
      return null;
    }
  };

  const handleSave = async () => {
    if (!hasRequiredFields) {
      toast.error("Uzupełnij wszystkie wymagane pola");
      return;
    }

    // Generate subscription code if client is selected
    let generatedCode: string | null = null;
    if (selectedClientId) {
      generatedCode = await generateSubscriptionCode(selectedClientId);
      if (generatedCode) {
        setSubscriptionCode(generatedCode);
        toast.success(`Wygenerowano kod dostępu: ${generatedCode}`);
      }
    }

    const docId = await saveDocument(
      "welcomepack",
      formData.salonName,
      `Welcome Pack dla ${formData.ownerName}`,
      { ...formData, subscriptionCode: generatedCode },
      selectedClientId || undefined,
      undefined,
      undefined
    );
    setCurrentDocId(docId);
    toast.success("Welcome Pack zapisany!");

    if (docId) {
      const thumbnail = await genThumb({
        elementId: "capture-welcomepack-slide-1",
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
      toast.error("Uzupełnij wszystkie wymagane pola");
      return;
    }

    setIsGenerating(true);
    
    try {
      // Generate subscription code if not already generated and client is selected
      let generatedCode = subscriptionCode;
      if (!generatedCode && selectedClientId) {
        generatedCode = await generateSubscriptionCode(selectedClientId);
        if (generatedCode) {
          setSubscriptionCode(generatedCode);
        }
      }

      let docId = currentDocId;
      if (!docId) {
        docId = await saveDocument(
          "welcomepack",
          formData.salonName,
          `Welcome Pack dla ${formData.ownerName}`,
          { ...formData, subscriptionCode: generatedCode },
          selectedClientId || undefined,
          undefined,
          undefined
        );
        setCurrentDocId(docId);
        
        if (docId) {
          const thumbnail = await genThumb({
            elementId: "capture-welcomepack-slide-1",
            backgroundColor: "#000000",
            pixelRatio: 0.5,
            quality: 0.75,
            width: 1600,
            height: 900
          });
          if (thumbnail) await updateThumbnail(docId, thumbnail);
        }
      }

      // Wait a bit for the subscription code to render in the slides
      if (generatedCode && !subscriptionCode) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [1600, 900],
        compress: true,
      });

      for (let i = 1; i <= TOTAL_SLIDES; i++) {
        setGeneratingSlide(i);
        
        const slideElement = document.getElementById(`capture-welcomepack-slide-${i}`);
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
      pdf.save(`welcome-pack-${sanitizedName}.pdf`);
      toast.success("Welcome Pack PDF pobrany!");
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
                <h1 className="text-lg font-bold text-foreground">Generator Welcome Pack</h1>
                <p className="text-xs text-muted-foreground">Harmonogram współpracy</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Client Selection */}
            <div>
              <Label className="text-xs flex items-center gap-1">
                <Users className="w-3 h-3 text-primary" />
                Wybierz klienta (auto-wypełni dane)
              </Label>
              <div className="mt-1">
                <SearchableSelect
                  options={[
                    { value: "", label: "Wprowadź ręcznie" },
                    ...clients.map((c) => ({
                      value: c.id,
                      label: c.salon_name,
                      sublabel: [c.owner_name, c.city].filter(Boolean).join(" • "),
                    })),
                  ]}
                  value={selectedClientId}
                  onValueChange={handleClientSelect}
                  placeholder="Szukaj klienta..."
                  searchPlaceholder="Wpisz nazwę salonu lub właściciela..."
                  emptyMessage="Nie znaleziono klientów"
                />
              </div>
            </div>

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
                <Label className="text-xs">Miasto</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  placeholder="np. Nowy Sącz"
                  className="h-9 mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Data startu współpracy</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange("startDate", e.target.value)}
                  className="h-9 mt-1"
                />
              </div>
            </div>

            {/* Manager Selection */}
            <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 space-y-3">
              <p className="text-xs font-medium text-foreground">Wybierz opiekuna</p>
              
              <div>
                <Label className="text-xs">Opiekun klienta</Label>
                <Select value={selectedManagerId} onValueChange={handleManagerSelect}>
                  <SelectTrigger className="h-9 mt-1">
                    <SelectValue placeholder="Wybierz opiekuna..." />
                  </SelectTrigger>
                  <SelectContent>
                    {managers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Imię opiekuna</Label>
                <Input
                  value={formData.managerName}
                  onChange={(e) => handleInputChange("managerName", e.target.value)}
                  placeholder="np. Przemek"
                  className="h-9 mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Telefon / WhatsApp</Label>
                <Input
                  value={formData.managerPhone}
                  onChange={(e) => handleInputChange("managerPhone", e.target.value)}
                  placeholder="+48 123 456 789"
                  className="h-9 mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Email</Label>
                <Input
                  value={formData.managerEmail}
                  onChange={(e) => handleInputChange("managerEmail", e.target.value)}
                  placeholder="kontakt@aurine.pl"
                  className="h-9 mt-1"
                />
              </div>
            </div>

            {/* Slide Info */}
            <div className="p-3 bg-secondary/50 rounded-xl border border-border/50">
              <p className="text-xs font-medium text-foreground mb-2">Welcome Pack zawiera:</p>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                {slideNames.map((name, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] flex items-center justify-center font-medium">
                      {idx + 1}
                    </span>
                    {name}
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-border/50 space-y-2">
              <Button onClick={handleSave} className="w-full" disabled={!hasRequiredFields}>
                <Save className="w-4 h-4 mr-2" />
                Zapisz Welcome Pack
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
                  id="welcomepack-preview"
                  style={{ 
                    transform: `scale(${previewScale})`,
                    transformOrigin: 'top left',
                    width: '1600px',
                    height: '900px',
                  }}
                >
                  <WelcomePackPreview data={formData} currentSlide={currentSlide} subscriptionCode={subscriptionCode} />
                </div>
              </div>
            )}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-3 flex-shrink-0">
            Użyj strzałek ← → do nawigacji
          </p>
        </div>

        {/* Hidden capture elements */}
        <div 
          style={{
            position: 'fixed',
            left: '-99999px',
            top: 0,
            pointerEvents: 'none',
          }}
          aria-hidden="true"
        >
          {[1, 2, 3, 4, 5, 6].map((slideNum) => (
            <div
              key={slideNum}
              id={`capture-welcomepack-slide-${slideNum}`}
              style={{
                width: '1600px',
                height: '900px',
                backgroundColor: '#000000',
                overflow: 'hidden',
              }}
            >
              <WelcomePackPreview data={formData} currentSlide={slideNum} subscriptionCode={subscriptionCode} />
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default WelcomePackGenerator;
