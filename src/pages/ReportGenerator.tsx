import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Sparkles, Download, Maximize2, FileImage, Link, 
  ChevronDown, ChevronUp, Eye, EyeOff, Wand2, Settings2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ReportPreview } from "@/components/report/ReportPreview";
import { ReportPreviewLandscape } from "@/components/report/ReportPreviewLandscape";
import { AppLayout } from "@/components/layout/AppLayout";
import { useThumbnailGenerator } from "@/hooks/useThumbnailGenerator";
import { useCloudDocumentHistory } from "@/hooks/useCloudDocumentHistory";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import { toPng } from "html-to-image";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface ClientOption {
  id: string;
  salon_name: string;
  city: string | null;
}

const reportSchema = z.object({
  clientName: z.string().min(1, "Nazwa klienta wymagana").max(100),
  city: z.string().min(1, "Miasto salonu wymagane").max(100),
  period: z.string().min(1, "Pole wymagane"),
  budget: z.string().min(1, "Pole wymagane"),
  impressions: z.string().min(1, "Pole wymagane"),
  reach: z.string().min(1, "Pole wymagane"),
  clicks: z.string().min(1, "Pole wymagane"),
  ctr: z.string().min(1, "Pole wymagane"),
  conversions: z.string().min(1, "Pole wymagane"),
  costPerConversion: z.string().min(1, "Pole wymagane"),
  bookings: z.string().min(1, "Pole wymagane"),
  campaignObjective: z.string().optional(),
  campaignStatus: z.string().optional(),
  engagementRate: z.string().optional(),
  weeklyReachData: z.string().optional(),
  weeklyClicksData: z.string().optional(),
  dailyBookingsData: z.string().optional(),
  recommendations: z.string().optional(),
});

type ReportFormData = z.infer<typeof reportSchema>;

const ReportGenerator = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [reportData, setReportData] = useState<ReportFormData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [scale, setScale] = useState(1);
  const [previewScale, setPreviewScale] = useState(1);
  const [previewReady, setPreviewReady] = useState(false);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [livePreview, setLivePreview] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const { saveDocument, updateThumbnail } = useCloudDocumentHistory();
  const { generateThumbnail } = useThumbnailGenerator();

  useEffect(() => {
    const fetchClients = async () => {
      const { data } = await supabase
        .from('clients')
        .select('id, salon_name, city')
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
        if (doc.type === "report") {
          reset(doc.data);
          setReportData(doc.data);
        }
      } catch (e) {
        console.error("Error loading document:", e);
      }
      sessionStorage.removeItem("loadDocument");
    }
  }, []);

  // Scale for landscape fullscreen
  useEffect(() => {
    if (!isLandscape || !containerRef.current) return;
    
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;
        const scaleByWidth = containerWidth / 1600;
        const scaleByHeight = containerHeight / 900;
        const newScale = Math.min(scaleByWidth, scaleByHeight, 1);
        setScale(newScale);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [isLandscape]);

  // Live preview scale
  useEffect(() => {
    if (!previewContainerRef.current) return;
    
    const updatePreviewScale = () => {
      const container = previewContainerRef.current;
      if (!container) return;
      const parentWidth = container.clientWidth;
      // Landscape: 1600x900, fit to container
      const newScale = Math.min(parentWidth / 1600, 0.6);
      setPreviewScale(Math.max(newScale, 0.25));
      if (parentWidth > 0 && !previewReady) {
        setPreviewReady(true);
      }
    };

    const rafId = requestAnimationFrame(() => {
      updatePreviewScale();
    });
    
    const resizeObserver = new ResizeObserver(updatePreviewScale);
    resizeObserver.observe(previewContainerRef.current);
    
    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
    };
  }, [previewReady]);

  const parseReportPeriod = (period: string): string => {
    const monthMap: { [key: string]: string } = {
      "styczeń": "01", "styczen": "01", "luty": "02", "marzec": "03",
      "kwiecień": "04", "kwiecien": "04", "maj": "05", "czerwiec": "06",
      "lipiec": "07", "sierpień": "08", "sierpien": "08", "wrzesień": "09",
      "wrzesien": "09", "październik": "10", "pazdziernik": "10",
      "listopad": "11", "grudzień": "12", "grudzien": "12",
    };
    const normalized = period.toLowerCase().trim();
    const parts = normalized.split(/\s+/);
    let month = "01";
    let year = new Date().getFullYear().toString();
    for (const part of parts) {
      if (monthMap[part]) month = monthMap[part];
      if (/^\d{4}$/.test(part)) year = part;
    }
    return `${year}-${month}`;
  };

  const sanitizeSalonName = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
  });

  // Auto-fill form when client is selected
  useEffect(() => {
    if (!selectedClientId) return;
    
    const selectedClient = clients.find(c => c.id === selectedClientId);
    if (selectedClient) {
      setValue('clientName', selectedClient.salon_name);
      if (selectedClient.city) {
        setValue('city', selectedClient.city);
      }
    }
  }, [selectedClientId, clients, setValue]);

  // Live preview data from watched form
  const formValues = watch();
  // Check if at least clientName is filled to show preview
  const hasAnyData = Boolean(formValues.clientName?.trim());
  const liveData = livePreview && hasAnyData ? formValues : reportData;

  const generateAIRecommendations = async () => {
    setIsGeneratingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-recommendations', {
        body: { campaignData: formValues }
      });
      if (error) throw error;
      if (data.recommendations) {
        setValue('recommendations', data.recommendations);
        toast({ title: "Rekomendacje wygenerowane!", description: "AI przygotowało rekomendacje" });
      }
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
      toast({ title: "Błąd", description: "Nie udało się wygenerować rekomendacji AI", variant: "destructive" });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const onSubmit = async (data: ReportFormData) => {
    setReportData(data);
    
    const docId = await saveDocument(
      "report",
      data.clientName,
      `Raport ${data.period}`,
      data as Record<string, string>,
      undefined,
      selectedClientId || undefined
    );
    
    toast({ title: "Raport zapisany!", description: "Możesz teraz pobrać PDF" });
    
    if (docId) {
      // Use thumbnail generator hook with retry logic
      const thumbnail = await generateThumbnail({
        elementId: "report-thumbnail-source",
        backgroundColor: "#000000",
        pixelRatio: 0.5,
        quality: 0.85,
        width: 1600,
        height: 900,
      });
      
      if (thumbnail) await updateThumbnail(docId, thumbnail);
    }
  };

  const autoSaveIfNeeded = async () => {
    if (!reportData) return;
    
    const docId = await saveDocument(
      "report",
      reportData.clientName,
      `Raport ${reportData.period}`,
      reportData as Record<string, string>,
      undefined,
      selectedClientId || undefined
    );
    
    if (docId) {
      const thumbnail = await generateThumbnail({
        elementId: "report-thumbnail-source",
        backgroundColor: "#000000",
        pixelRatio: 0.5,
        quality: 0.85,
        width: 1600,
        height: 900,
      });
      
      if (thumbnail) await updateThumbnail(docId, thumbnail);
    }
  };

  const generatePDF = async () => {
    const element = document.getElementById("report-preview-pdf") || document.getElementById("report-preview");
    if (!element || !reportData) return;

    setIsGenerating(true);
    try {
      // Auto-save before download
      await autoSaveIfNeeded();

      // Fixed A4-like dimensions for consistent PDF output
      const pdfWidth = 794;
      const pdfHeight = 1123;
      
      const canvas = await toPng(element, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#0a0a0f",
        width: pdfWidth,
        height: pdfHeight,
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [pdfWidth, pdfHeight],
        compress: true,
      });

      pdf.addImage(canvas, "PNG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");

      const periodCode = parseReportPeriod(reportData.period || "");
      const salonName = sanitizeSalonName(reportData.clientName);
      pdf.save(`${periodCode}-${salonName}-pionowy.pdf`);

      toast({ title: "PDF wygenerowany!", description: "Raport został pobrany" });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({ title: "Błąd", description: "Nie udało się wygenerować PDF", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateLandscapePDF = async () => {
    const element = document.getElementById("report-preview-landscape");
    if (!element || !reportData) return;

    setIsGenerating(true);
    try {
      // Auto-save before download
      await autoSaveIfNeeded();

      const imgData = await toPng(element, {
        cacheBust: true,
        pixelRatio: 1,
        backgroundColor: "#050509",
      });

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: [1600, 900],
        compress: true,
      });

      pdf.addImage(imgData, "PNG", 0, 0, 1600, 900, undefined, "FAST");

      const periodCode = parseReportPeriod(reportData.period || "");
      const salonName = sanitizeSalonName(reportData.clientName);
      pdf.save(`${periodCode}-${salonName}-16-9.pdf`);

      toast({ title: "PDF 16:9 wygenerowany!" });
    } catch (error) {
      toast({ title: "Błąd", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadAsImage = async () => {
    const element = document.getElementById("report-preview-landscape");
    if (!element || !reportData) return;

    setIsGenerating(true);
    try {
      // Auto-save before download
      await autoSaveIfNeeded();

      const imgData = await toPng(element, {
        cacheBust: true,
        pixelRatio: 1,
        backgroundColor: "#050509",
      });

      const periodCode = parseReportPeriod(reportData.period || "");
      const salonName = sanitizeSalonName(reportData.clientName);

      const link = document.createElement("a");
      link.download = `${periodCode}-${salonName}.png`;
      link.href = imgData;
      link.click();

      toast({ title: "Obraz pobrany!" });
    } catch (error) {
      toast({ title: "Błąd", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  // Fullscreen landscape mode
  if (isLandscape && reportData) {
    return (
      <div className="fixed inset-0 bg-background overflow-hidden" style={{ backgroundColor: 'hsl(var(--background))' }}>
        <div className="h-full flex flex-col px-4 py-3">
          <div className="flex justify-between items-center flex-wrap gap-2 mb-3 flex-shrink-0">
            <h2 className="text-lg font-semibold text-foreground">Podgląd pełnoekranowy</h2>
            <div className="flex items-center gap-2">
              <Button onClick={() => setIsLandscape(false)} size="sm" variant="outline">
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Powrót
              </Button>
              <div className="h-6 w-px bg-border" />
              <Button onClick={downloadAsImage} disabled={isGenerating} size="sm" variant="secondary">
                <FileImage className="w-4 h-4 mr-1.5" />
                PNG
              </Button>
              <Button onClick={generateLandscapePDF} disabled={isGenerating} size="sm">
                <Download className="w-4 h-4 mr-1.5" />
                PDF 16:9
              </Button>
              <Button onClick={generatePDF} disabled={isGenerating} size="sm" variant="outline">
                <Download className="w-4 h-4 mr-1.5" />
                Pionowy
              </Button>
            </div>
          </div>

          <div ref={containerRef} className="flex-1 flex items-center justify-center overflow-hidden">
            <div 
              className="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/5"
              style={{ backgroundColor: '#000000', width: `${1600 * scale}px`, height: `${900 * scale}px` }}
            >
              <div 
                id="report-preview-landscape"
                className="w-[1600px] h-[900px] origin-top-left"
                style={{ backgroundColor: '#000000', transform: `scale(${scale})` }}
              >
                <ReportPreviewLandscape data={reportData} />
              </div>
            </div>
          </div>

          <div className="text-center py-2 text-xs text-muted-foreground flex-shrink-0">
            Powered by <span className="text-primary font-medium">Aurine</span>
          </div>
        </div>

        <div className="fixed pointer-events-none" style={{ left: '-9999px', top: 0 }}>
          <div id="report-preview-pdf" style={{ width: 794, height: 1123, backgroundColor: '#0a0a0f' }}>
            <ReportPreview data={reportData} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row w-full max-w-full overflow-x-hidden">
        {/* Left Panel - Form */}
        <div className="w-full lg:w-[380px] xl:w-[420px] flex-shrink-0 lg:border-r border-border/50 overflow-y-auto custom-scrollbar bg-card/30 max-h-[50vh] lg:max-h-none lg:h-[calc(100vh-4rem)]">
          <div className="p-4 border-b border-border/50 sticky top-0 bg-card/95 backdrop-blur-sm z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold text-foreground">Generator Raportów</h1>
                <p className="text-xs text-muted-foreground">Raporty kampanii Facebook Ads</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
            {/* Basic Info */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Nazwa salonu *</Label>
                <Input {...register("clientName")} placeholder="Beauty Studio" className="h-9 mt-1" />
                {errors.clientName && <p className="text-destructive text-xs mt-1">{errors.clientName.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Miasto *</Label>
                  <Input {...register("city")} placeholder="Warszawa" className="h-9 mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Okres *</Label>
                  <Input {...register("period")} placeholder="Styczeń 2024" className="h-9 mt-1" />
                </div>
              </div>

              <div>
                <Label className="text-xs flex items-center gap-1">
                  <Link className="w-3 h-3 text-primary" />
                  Wybierz klienta (autouzupełnianie)
                </Label>
                <Select value={selectedClientId || "none"} onValueChange={(v) => setSelectedClientId(v === "none" ? "" : v)}>
                  <SelectTrigger className="h-9 mt-1">
                    <SelectValue placeholder="Wybierz klienta..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Bez powiązania</SelectItem>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.salon_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Metrics */}
            <div className="pt-3 border-t border-border/50">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Metryki kampanii</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Budżet (PLN) *</Label>
                  <Input {...register("budget")} placeholder="5,000" className="h-9 mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Wyświetlenia *</Label>
                  <Input {...register("impressions")} placeholder="150,000" className="h-9 mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Zasięg *</Label>
                  <Input {...register("reach")} placeholder="85,000" className="h-9 mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Kliknięcia *</Label>
                  <Input {...register("clicks")} placeholder="3,500" className="h-9 mt-1" />
                </div>
                <div>
                  <Label className="text-xs">CTR (%) *</Label>
                  <Input {...register("ctr")} placeholder="2.33" className="h-9 mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Konwersje *</Label>
                  <Input {...register("conversions")} placeholder="245" className="h-9 mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Koszt/konwersja *</Label>
                  <Input {...register("costPerConversion")} placeholder="20.41" className="h-9 mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Rezerwacje *</Label>
                  <Input {...register("bookings")} placeholder="178" className="h-9 mt-1" />
                </div>
              </div>
            </div>

            {/* Advanced Options */}
            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
              <CollapsibleTrigger asChild>
                <button type="button" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full pt-3 border-t border-border/50">
                  <Settings2 className="w-3.5 h-3.5" />
                  <span>Opcje zaawansowane</span>
                  {showAdvanced ? <ChevronUp className="w-3.5 h-3.5 ml-auto" /> : <ChevronDown className="w-3.5 h-3.5 ml-auto" />}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Cel kampanii</Label>
                    <Input {...register("campaignObjective")} placeholder="Rezerwacje" className="h-9 mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Status</Label>
                    <Select value={watch("campaignStatus") || ""} onValueChange={(v) => setValue("campaignStatus", v)}>
                      <SelectTrigger className="h-9 mt-1">
                        <SelectValue placeholder="Wybierz..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Aktywna">Aktywna</SelectItem>
                        <SelectItem value="Zakończona">Zakończona</SelectItem>
                        <SelectItem value="Wstrzymana">Wstrzymana</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Zaangażowanie (%)</Label>
                  <Input {...register("engagementRate")} placeholder="65" className="h-9 mt-1" />
                </div>

                <div>
                  <Label className="text-xs">Zasięg tygodniowy (4 wartości)</Label>
                  <Input {...register("weeklyReachData")} placeholder="15000,19000,25000,26000" className="h-9 mt-1" />
                </div>

                <div>
                  <Label className="text-xs">Kliknięcia tygodniowe (4 wartości)</Label>
                  <Input {...register("weeklyClicksData")} placeholder="650,820,1100,930" className="h-9 mt-1" />
                </div>

                <div>
                  <Label className="text-xs">Rezerwacje dzienne (7 dni)</Label>
                  <Input {...register("dailyBookingsData")} placeholder="22,28,32,35,38,42,25" className="h-9 mt-1" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-xs">Rekomendacje</Label>
                    <Button
                      type="button"
                      onClick={generateAIRecommendations}
                      disabled={isGeneratingAI}
                      size="sm"
                      variant="ghost"
                      className="h-6 text-xs px-2"
                    >
                      <Wand2 className="w-3 h-3 mr-1" />
                      {isGeneratingAI ? "..." : "AI"}
                    </Button>
                  </div>
                  <textarea
                    {...register("recommendations")}
                    rows={3}
                    placeholder="Rekomendacje marketingowe..."
                    className="w-full px-3 py-2 text-sm bg-secondary/30 border border-border/50 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Submit */}
            <div className="pt-4 space-y-2">
              <Button type="submit" className="w-full">
                <Sparkles className="w-4 h-4 mr-2" />
                Zapisz i generuj
              </Button>
              
              {reportData && (
                <div className="grid grid-cols-2 gap-2">
                  <Button type="button" onClick={() => setIsLandscape(true)} variant="outline" size="sm">
                    <Maximize2 className="w-4 h-4 mr-1" />
                    16:9
                  </Button>
                  <Button type="button" onClick={generatePDF} disabled={isGenerating} size="sm">
                    <Download className="w-4 h-4 mr-1" />
                    PDF
                  </Button>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Right Panel - Preview */}
        <div className="flex-1 overflow-hidden bg-background/50 flex flex-col">
          {/* Preview Header */}
          <div className="p-3 border-b border-border/50 flex items-center justify-between flex-shrink-0 bg-card/30">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-medium text-foreground">Podgląd na żywo</h2>
              <button
                onClick={() => setLivePreview(!livePreview)}
                className={cn(
                  "flex items-center gap-1.5 text-xs px-2 py-1 rounded-md transition-colors",
                  livePreview ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                )}
              >
                {livePreview ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                {livePreview ? "Live" : "Zapisany"}
              </button>
            </div>
            {liveData && (
              <div className="flex items-center gap-2">
                <Button onClick={() => setIsLandscape(true)} size="sm" variant="ghost" className="h-7 text-xs">
                  <Maximize2 className="w-3.5 h-3.5 mr-1" />
                  Pełny ekran
                </Button>
              </div>
            )}
          </div>

          {/* Preview Content */}
          <div 
            ref={previewContainerRef}
            className="flex-1 overflow-auto p-4 flex items-start justify-center"
          >
            {liveData ? (
              !previewReady ? (
                <div 
                  className="rounded-xl bg-muted/30 animate-pulse flex items-center justify-center"
                  style={{
                    width: `${1600 * 0.4}px`,
                    height: `${900 * 0.4}px`,
                  }}
                >
                  <span className="text-muted-foreground text-sm">Ładowanie podglądu...</span>
                </div>
              ) : (
                <div 
                  className="rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 origin-top"
                  style={{
                    width: `${1600 * previewScale}px`,
                    height: `${900 * previewScale}px`,
                    backgroundColor: '#000000',
                  }}
                >
                  <div 
                    className="w-[1600px] h-[900px] origin-top-left"
                    style={{ transform: `scale(${previewScale})`, backgroundColor: '#000000' }}
                  >
                    <ReportPreviewLandscape data={liveData} />
                  </div>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-20 text-muted-foreground">
                <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                  <Eye className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <p className="text-sm">Wypełnij formularz, aby zobaczyć podgląd raportu</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Podgląd aktualizuje się na żywo podczas pisania</p>
              </div>
            )}
          </div>
        </div>

        {/* Hidden elements for PDF/thumbnail generation */}
        {reportData && (
          <>
            <div className="fixed pointer-events-none" style={{ left: '-9999px', top: 0 }}>
              <div id="report-preview-pdf" style={{ width: 794, backgroundColor: '#09090b' }}>
                <ReportPreview data={reportData} />
              </div>
            </div>
            
            <div 
              style={{ 
                position: 'fixed', top: 0, left: 0, width: 1600, height: 900,
                overflow: 'hidden', pointerEvents: 'none', clipPath: 'inset(100%)', zIndex: -9999,
              }}
            >
              <div id="report-thumbnail-source" style={{ width: 1600, height: 900, backgroundColor: '#000000', overflow: 'hidden' }}>
                <ReportPreviewLandscape data={reportData} />
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default ReportGenerator;
