import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Download, FileImage, ArrowLeft, Building2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ContractPreview } from "@/components/contract/ContractPreview";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCloudDocumentHistory } from "@/hooks/useCloudDocumentHistory";
import { useThumbnailGenerator } from "@/hooks/useThumbnailGenerator";
import { supabase } from "@/integrations/supabase/client";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { DocumentFullscreenModal } from "@/components/document/DocumentFullscreenModal";
import jsPDF from "jspdf";
import { toPng, toJpeg } from "html-to-image";

interface ClientOption {
  id: string;
  salon_name: string;
  city?: string | null;
  owner_name?: string | null;
  email?: string | null;
  phone?: string | null;
}

const ContractGenerator = () => {
  const navigate = useNavigate();
  const { saveDocument, updateThumbnail } = useCloudDocumentHistory();
  const { generateThumbnail: genThumb } = useThumbnailGenerator();
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [previewScale, setPreviewScale] = useState(0.5);
  const [previewReady, setPreviewReady] = useState(false);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  
  // Load agency data from localStorage
  const loadAgencyData = () => {
    const saved = localStorage.getItem("contractAgencyData");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return {};
      }
    }
    return {};
  };

  const savedAgency = loadAgencyData();

  const [formData, setFormData] = useState({
    clientName: "",
    clientOwnerName: "",
    clientAddress: "",
    clientPhone: "",
    clientEmail: "",
    clientNip: "",
    signDate: new Date().toISOString().split("T")[0],
    signCity: "",
    contractValue: "",
    paymentType: "split50" as "split50" | "split30" | "full",
    agencyName: savedAgency.agencyName || "Agencja Marketingowa Aurine",
    agencyOwnerName: savedAgency.agencyOwnerName || "",
    agencyAddress: savedAgency.agencyAddress || "",
    agencyPhone: savedAgency.agencyPhone || "",
    agencyEmail: savedAgency.agencyEmail || "kontakt@aurine.pl",
    agencyNip: savedAgency.agencyNip || "",
  });

  // Save agency data to localStorage whenever it changes
  useEffect(() => {
    const agencyData = {
      agencyName: formData.agencyName,
      agencyOwnerName: formData.agencyOwnerName,
      agencyAddress: formData.agencyAddress,
      agencyPhone: formData.agencyPhone,
      agencyEmail: formData.agencyEmail,
      agencyNip: formData.agencyNip,
    };
    localStorage.setItem("contractAgencyData", JSON.stringify(agencyData));
  }, [formData.agencyName, formData.agencyOwnerName, formData.agencyAddress, formData.agencyPhone, formData.agencyEmail, formData.agencyNip]);

  useEffect(() => {
    const fetchClients = async () => {
      const { data } = await supabase
        .from('clients')
        .select('id, salon_name, city, owner_name, email, phone')
        .order('salon_name');
      setClients(data || []);
    };
    fetchClients();
  }, []);

  useEffect(() => {
    const stored = sessionStorage.getItem("loadDocument");
    if (stored) {
      try {
        const doc = JSON.parse(stored);
        if (doc.type === "contract") {
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
        const containerWidth = previewContainerRef.current.clientWidth - 48; // Account for padding
        const containerHeight = previewContainerRef.current.clientHeight - 80; // Account for header
        
        // Calculate scale to fit both width and height while maximizing size (same as Invoice)
        const scaleByWidth = containerWidth / 595;
        const scaleByHeight = containerHeight / 842;
        const newScale = Math.min(scaleByWidth, scaleByHeight, 1); // Max scale of 1
        
        setPreviewScale(Math.max(newScale, 0.4)); // Min scale of 0.4
        if (containerWidth > 0 && !previewReady) {
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

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    
    if (clientId) {
      const client = clients.find(c => c.id === clientId);
      if (client) {
        setFormData(prev => ({
          ...prev,
          clientName: client.salon_name,
          clientOwnerName: client.owner_name || "",
          clientPhone: client.phone || "",
          clientEmail: client.email || "",
          signCity: client.city || prev.signCity,
        }));
      }
    }
  };

  const hasRequiredFields = formData.clientName && formData.contractValue;

  const handleSave = async () => {
    if (!hasRequiredFields) {
      toast.error("Uzupełnij wszystkie wymagane pola");
      return;
    }

    const docId = await saveDocument(
      "contract",
      formData.clientName,
      `Umowa - ${formData.clientName}`,
      formData,
      undefined,
      selectedClientId || undefined,
      undefined
    );
    setCurrentDocId(docId);
    toast.success("Umowa zapisana!");

    if (docId) {
      const thumbnail = await genThumb({
        elementId: "contract-preview",
        backgroundColor: "#09090b",
        pixelRatio: 0.8,
        quality: 0.8,
        width: 595,
        height: 842
      });
      if (thumbnail) await updateThumbnail(docId, thumbnail);
    }
  };

  const generatePDF = async () => {
    if (!hasRequiredFields) {
      toast.error("Uzupełnij wszystkie wymagane pola");
      return;
    }

    const element = document.getElementById("contract-preview");
    if (!element) return;

    setIsGenerating(true);
    try {
      // Auto-save before download
      let docId = currentDocId;
      if (!docId) {
        docId = await saveDocument(
          "contract",
          formData.clientName,
          `Umowa - ${formData.clientName}`,
          formData,
          undefined,
          selectedClientId || undefined,
          undefined
        );
        setCurrentDocId(docId);
        
        if (docId) {
          const thumbnail = await genThumb({
            elementId: "contract-preview",
            backgroundColor: "#09090b",
            pixelRatio: 0.8,
            quality: 0.8,
            width: 595,
            height: 842
          });
          if (thumbnail) await updateThumbnail(docId, thumbnail);
        }
      }

      // A4 format: 210mm x 297mm = 595.28 x 841.89 pt
      const A4_WIDTH = 595.28;
      const A4_HEIGHT = 841.89;

      // Get all pages (children of contract-preview)
      const pages = element.querySelectorAll(':scope > div');
      const pdf = new jsPDF({ 
        orientation: "portrait", 
        unit: "pt", 
        format: "a4",
        compress: true 
      });

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as HTMLElement;
        const canvas = await toJpeg(page, { 
          cacheBust: true, 
          pixelRatio: 2, 
          backgroundColor: "#09090b", 
          quality: 0.95 
        });
        
        if (i > 0) {
          pdf.addPage();
        }
        pdf.addImage(canvas, "JPEG", 0, 0, A4_WIDTH, A4_HEIGHT);
      }
      
      const fileName = `Umowa_${formData.clientName.replace(/\s+/g, "_")}.pdf`;
      pdf.save(fileName);
      toast.success("Umowa PDF pobrana!");
    } catch (error) {
      toast.error("Nie udało się wygenerować PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadAsImage = async () => {
    const element = document.getElementById("contract-preview");
    if (!element) return;

    setIsGenerating(true);
    try {
      const imgData = await toPng(element, { cacheBust: true, pixelRatio: 2, backgroundColor: "#09090b" });
      const link = document.createElement("a");
      const fileName = `Umowa_${formData.clientName.replace(/\s+/g, "_")}.png`;
      link.download = fileName;
      link.href = imgData;
      link.click();
      toast.success("Umowa PNG pobrana!");
    } catch (error) {
      toast.error("Nie udało się pobrać obrazu");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AppLayout>
      <div className="h-full min-h-0 flex flex-col lg:flex-row w-full overflow-hidden">
        {/* Left Panel - Form */}
        <div className="w-full lg:w-[360px] xl:w-[400px] flex-1 lg:flex-none flex-shrink-0 lg:border-r border-border/50 bg-card/30 flex flex-col min-h-0">
          <div className="p-4 border-b border-border/50 sticky top-0 bg-card/95 backdrop-blur-sm z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold text-foreground">Generator Umów</h1>
                <p className="text-xs text-muted-foreground">Profesjonalne umowy marketingowe</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="p-4 space-y-4 overflow-y-auto flex-1 min-h-0">
            {/* Form Fields */}
            <div className="space-y-3">
              <div className="space-y-3">
                <div>
                  <Label className="text-xs flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-primary" />
                    Klient
                  </Label>
                  <SearchableSelect
                    options={clients.map(c => ({ value: c.id, label: c.salon_name, description: c.city || "" }))}
                    value={selectedClientId}
                    onValueChange={handleClientSelect}
                    placeholder="Wybierz klienta..."
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Nazwa Zleceniodawcy *</Label>
                <Input
                  value={formData.clientName}
                  onChange={(e) => handleInputChange("clientName", e.target.value)}
                  placeholder="Salon Beauty XYZ"
                  className="h-9 mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Imię i nazwisko właściciela</Label>
                <Input
                  value={formData.clientOwnerName}
                  onChange={(e) => handleInputChange("clientOwnerName", e.target.value)}
                  placeholder="Jan Kowalski"
                  className="h-9 mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Adres Zleceniodawcy</Label>
                <Input
                  value={formData.clientAddress}
                  onChange={(e) => handleInputChange("clientAddress", e.target.value)}
                  placeholder="ul. Przykładowa 123, 00-000 Warszawa"
                  className="h-9 mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Telefon</Label>
                  <Input
                    value={formData.clientPhone}
                    onChange={(e) => handleInputChange("clientPhone", e.target.value)}
                    placeholder="+48 123 456 789"
                    className="h-9 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">E-mail</Label>
                  <Input
                    value={formData.clientEmail}
                    onChange={(e) => handleInputChange("clientEmail", e.target.value)}
                    placeholder="kontakt@salon.pl"
                    className="h-9 mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">NIP</Label>
                <Input
                  value={formData.clientNip}
                  onChange={(e) => handleInputChange("clientNip", e.target.value)}
                  placeholder="123-456-78-90"
                  className="h-9 mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Data zawarcia</Label>
                  <Input
                    type="date"
                    value={formData.signDate}
                    onChange={(e) => handleInputChange("signDate", e.target.value)}
                    className="h-9 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Miejscowość</Label>
                  <Input
                    value={formData.signCity}
                    onChange={(e) => handleInputChange("signCity", e.target.value)}
                    placeholder="Warszawa"
                    className="h-9 mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Wynagrodzenie miesięczne (PLN brutto) *</Label>
                <Input
                  type="number"
                  value={formData.contractValue}
                  onChange={(e) => handleInputChange("contractValue", e.target.value)}
                  placeholder="1500"
                  className="h-9 mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Wariant płatności</Label>
                <div className="flex gap-1.5 mt-1">
                  <Button
                    type="button"
                    variant={formData.paymentType === "split50" ? "default" : "outline"}
                    size="sm"
                    className="flex-1 text-[10px] px-2"
                    onClick={() => handleInputChange("paymentType", "split50")}
                  >
                    50% + 50%
                  </Button>
                  <Button
                    type="button"
                    variant={formData.paymentType === "split30" ? "default" : "outline"}
                    size="sm"
                    className="flex-1 text-[10px] px-2"
                    onClick={() => handleInputChange("paymentType", "split30")}
                  >
                    30% + 70%
                  </Button>
                  <Button
                    type="button"
                    variant={formData.paymentType === "full" ? "default" : "outline"}
                    size="sm"
                    className="flex-1 text-[10px] px-2"
                    onClick={() => handleInputChange("paymentType", "full")}
                  >
                    100%
                  </Button>
                </div>
              </div>


              <div className="pt-2 border-t border-border/30">
                <p className="text-xs text-muted-foreground mb-2">Dane Wykonawcy (Aurine)</p>
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">Nazwa firmy</Label>
                    <Input
                      value={formData.agencyName}
                      onChange={(e) => handleInputChange("agencyName", e.target.value)}
                      placeholder="Agencja Marketingowa Aurine"
                      className="h-9 mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Imię i nazwisko właściciela</Label>
                    <Input
                      value={formData.agencyOwnerName}
                      onChange={(e) => handleInputChange("agencyOwnerName", e.target.value)}
                      placeholder="Anna Nowak"
                      className="h-9 mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Adres</Label>
                    <Input
                      value={formData.agencyAddress}
                      onChange={(e) => handleInputChange("agencyAddress", e.target.value)}
                      placeholder="ul. Agencyjna 1, 00-000 Warszawa"
                      className="h-9 mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Telefon</Label>
                      <Input
                        value={formData.agencyPhone}
                        onChange={(e) => handleInputChange("agencyPhone", e.target.value)}
                        placeholder="+48 123 456 789"
                        className="h-9 mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">E-mail</Label>
                      <Input
                        value={formData.agencyEmail}
                        onChange={(e) => handleInputChange("agencyEmail", e.target.value)}
                        placeholder="kontakt@aurine.pl"
                        className="h-9 mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">NIP</Label>
                    <Input
                      value={formData.agencyNip}
                      onChange={(e) => handleInputChange("agencyNip", e.target.value)}
                      placeholder="123-456-78-90"
                      className="h-9 mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-border/50 space-y-2">
              <Button onClick={handleSave} className="w-full" disabled={!hasRequiredFields}>
                Zapisz umowę
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={downloadAsImage} disabled={isGenerating || !hasRequiredFields} variant="outline" size="sm">
                  <FileImage className="w-4 h-4 mr-1" />
                  PNG
                </Button>
                <Button onClick={generatePDF} disabled={isGenerating || !hasRequiredFields} variant="secondary" size="sm">
                  <Download className="w-4 h-4 mr-1" />
                  PDF
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Live Preview */}
        <div ref={previewContainerRef} className="flex-1 flex flex-col bg-muted/30 p-4 lg:p-6 min-h-0 overflow-hidden">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <h2 className="text-sm font-medium text-muted-foreground">Podgląd na żywo (2 strony)</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsFullscreenOpen(true)}
              className="gap-2"
            >
              <Maximize2 className="w-4 h-4" />
              <span className="hidden sm:inline">Pełny ekran</span>
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="flex justify-center pb-8">
              {!previewReady ? (
                <div 
                  className="rounded-xl bg-muted/30 animate-pulse flex items-center justify-center"
                  style={{ 
                    width: `${595 * 0.6}px`,
                    height: `${842 * 0.6}px`,
                  }}
                >
                  <span className="text-muted-foreground text-sm">Ładowanie podglądu...</span>
                </div>
              ) : (
                <div 
                  className="rounded-xl shadow-2xl ring-1 ring-border/20 overflow-hidden"
                  style={{ 
                    width: `${595 * previewScale}px`,
                  }}
                >
                  <div 
                    style={{ 
                      width: '595px',
                      zoom: previewScale,
                    }}
                  >
                    <ContractPreview data={formData} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fullscreen Modal */}
        <DocumentFullscreenModal 
          open={isFullscreenOpen} 
          onClose={() => setIsFullscreenOpen(false)}
          title={`Umowa - ${formData.clientName}`}
        >
          <ContractPreview data={formData} />
        </DocumentFullscreenModal>
      </div>
    </AppLayout>
  );
};

export default ContractGenerator;
