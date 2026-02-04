import { useRef, useEffect, useState } from "react";
import { X, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ReportPreviewLandscape } from "@/components/report/ReportPreviewLandscape";
import { InvoicePreview } from "@/components/invoice/InvoicePreview";
import { ContractPreview } from "@/components/contract/ContractPreview";
import { PresentationPreview } from "@/components/presentation/PresentationPreview";
import { WelcomePackPreview } from "@/components/welcomepack/WelcomePackPreview";
import { CloudDocumentItem } from "@/hooks/useCloudDocumentHistory";
import jsPDF from "jspdf";
import { toJpeg } from "html-to-image";
import { useToast } from "@/hooks/use-toast";

interface DocumentViewerProps {
  document: CloudDocumentItem | null;
  open: boolean;
  onClose: () => void;
}

const PRESENTATION_SLIDES_WITH_ACADEMY = 7;
const PRESENTATION_SLIDES_WITHOUT_ACADEMY = 6;
const WELCOMEPACK_SLIDES = 5;
const WELCOMEPACK_SLIDES_ARRAY = [1, 2, 3, 4, 5];

export const DocumentViewer = ({ document, open, onClose }: DocumentViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const hiddenSlidesRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingSlide, setGeneratingSlide] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(1);
  const { toast } = useToast();

  // Determine if presentation includes Academy from saved data
  const includeAcademy = document?.type === "presentation" 
    ? document.data?.includeAcademy !== "false" 
    : true;

  // Calculate slides count based on document type and Academy setting
  const getPresentationSlidesCount = () => includeAcademy ? PRESENTATION_SLIDES_WITH_ACADEMY : PRESENTATION_SLIDES_WITHOUT_ACADEMY;
  const getPresentationSlidesArray = () => Array.from({ length: getPresentationSlidesCount() }, (_, i) => i + 1);

  // Reset slide when document changes
  useEffect(() => {
    if (document?.type === "presentation" || document?.type === "welcomepack") {
      setCurrentSlide(1);
    }
  }, [document?.id, document?.type]);

  useEffect(() => {
    if (!open || !document) return;

    const updateScale = () => {
      const viewportWidth = window.innerWidth * 0.85;
      const viewportHeight = window.innerHeight * 0.7;
      
      let docWidth = 1600;
      let docHeight = 900;
      
      if (document.type === "invoice" || document.type === "contract") {
        docWidth = 595;
        docHeight = 842;
      }
      
      const scaleByWidth = viewportWidth / docWidth;
      const scaleByHeight = viewportHeight / docHeight;
      const newScale = Math.min(scaleByWidth, scaleByHeight);
      setScale(newScale);
    };

    const timer = setTimeout(updateScale, 100);
    window.addEventListener('resize', updateScale);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateScale);
    };
  }, [open, document]);

  // Keyboard navigation for presentations and welcomepacks
  useEffect(() => {
    if (!open || (document?.type !== "presentation" && document?.type !== "welcomepack")) return;

    const maxSlides = document?.type === "welcomepack" ? WELCOMEPACK_SLIDES : getPresentationSlidesCount();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        setCurrentSlide(prev => Math.min(prev + 1, maxSlides));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setCurrentSlide(prev => Math.max(prev - 1, 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, document?.type]);

  const generatePDF = async () => {
    if (!document) return;
    setIsGenerating(true);
    setGeneratingSlide(0);

    try {
      let orientation: "landscape" | "portrait" = "landscape";
      let width = 1600;
      let height = 900;
      let bgColor = "#000000";

      if (document.type === "invoice" || document.type === "contract") {
        orientation = "portrait";
        width = 595;
        height = 842;
        bgColor = "#09090b";
      }

      // For presentations and welcomepacks, capture from pre-rendered hidden slides
      if (document.type === "presentation" || document.type === "welcomepack") {
        const hiddenContainer = hiddenSlidesRef.current;
        if (!hiddenContainer) {
          toast({ title: "Błąd", description: "Brak elementu do eksportu", variant: "destructive" });
          setIsGenerating(false);
          return;
        }

        const pdf = new jsPDF({
          orientation: "landscape",
          unit: "px",
          format: [1600, 900],
          compress: true,
        });

        const totalSlides = document.type === "welcomepack" ? WELCOMEPACK_SLIDES : getPresentationSlidesCount();
        for (let i = 0; i < totalSlides; i++) {
          setGeneratingSlide(i + 1);
          
          const slideElement = hiddenContainer.children[i] as HTMLElement;
          if (!slideElement) continue;

          await new Promise(resolve => setTimeout(resolve, 100));

          const dataUrl = await toJpeg(slideElement, {
            width: 1600,
            height: 900,
            pixelRatio: 2,
            backgroundColor: "#000000",
            quality: 0.92,
            skipFonts: true,
          });

          if (i > 0) pdf.addPage([1600, 900], "landscape");
          pdf.addImage(dataUrl, "JPEG", 0, 0, 1600, 900, undefined, "FAST");
        }

        pdf.save(`${document.title.replace(/\s+/g, "-")}.pdf`);
      } else {
        // For other documents, capture from the display element
        const elementId = document.type === "report" ? "report-preview-landscape" 
          : document.type === "invoice" ? "invoice-preview" 
          : "contract-preview";
        
        const element = window.document.getElementById(elementId);
        if (!element) {
          toast({ title: "Błąd", description: "Brak elementu do eksportu", variant: "destructive" });
          setIsGenerating(false);
          return;
        }

        const dataUrl = await toJpeg(element, {
          width,
          height,
          pixelRatio: 2,
          backgroundColor: bgColor,
          quality: 0.92,
          skipFonts: true,
        });

        const pdf = new jsPDF({
          orientation,
          unit: "px",
          format: [width, height],
          compress: true,
        });

        pdf.addImage(dataUrl, "JPEG", 0, 0, width, height, undefined, "FAST");
        pdf.save(`${document.title.replace(/\s+/g, "-")}.pdf`);
      }

      toast({ title: "Sukces", description: "PDF został wygenerowany" });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast({ title: "Błąd", description: "Nie udało się wygenerować PDF", variant: "destructive" });
    } finally {
      setIsGenerating(false);
      setGeneratingSlide(0);
    }
  };

  if (!document) return null;

  const getDocumentDimensions = () => {
    switch (document.type) {
      case "report":
      case "presentation":
      case "welcomepack":
        return { width: 1600, height: 900 };
      case "invoice":
      case "contract":
        return { width: 595, height: 842 };
      default:
        return { width: 1600, height: 900 };
    }
  };

  const slidesCount = document.type === "welcomepack" ? WELCOMEPACK_SLIDES : getPresentationSlidesCount();
  const slidesArray = document.type === "welcomepack" ? WELCOMEPACK_SLIDES_ARRAY : getPresentationSlidesArray();

  const dims = getDocumentDimensions();

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-zinc-950 border-zinc-800">
        <DialogTitle className="sr-only">Podgląd dokumentu: {document.title}</DialogTitle>
        
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-zinc-950 to-transparent">
          <div>
            <h2 className="text-lg font-semibold text-white">{document.title}</h2>
            <p className="text-sm text-zinc-400">{document.subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={generatePDF}
              disabled={isGenerating}
              size="sm"
              className="bg-pink-600 hover:bg-pink-700 min-w-[120px]"
            >
              <Download className="w-4 h-4 mr-1.5" />
              {isGenerating 
                ? (generatingSlide > 0 ? `Slajd ${generatingSlide}/${slidesCount}` : "Generuję...")
                : "Pobierz PDF"}
            </Button>
            <Button
              onClick={onClose}
              size="icon"
              variant="ghost"
              className="text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Presentation/WelcomePack Navigation */}
        {(document.type === "presentation" || document.type === "welcomepack") && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-4 bg-zinc-900/90 backdrop-blur-sm rounded-full px-4 py-2 border border-zinc-800">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentSlide(prev => Math.max(prev - 1, 1))}
              disabled={currentSlide === 1}
              className="h-8 w-8 text-zinc-400 hover:text-white disabled:opacity-30"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            
            <div className="flex items-center gap-2">
              {slidesArray.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i + 1)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    currentSlide === i + 1 
                      ? "bg-pink-500 w-6" 
                      : "bg-zinc-600 hover:bg-zinc-500"
                  }`}
                />
              ))}
            </div>
            
            <span className="text-sm text-zinc-400 min-w-[60px] text-center">
              {currentSlide} / {slidesCount}
            </span>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentSlide(prev => Math.min(prev + 1, slidesCount))}
              disabled={currentSlide === slidesCount}
              className="h-8 w-8 text-zinc-400 hover:text-white disabled:opacity-30"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        )}

        {/* Document Container */}
        <div 
          ref={containerRef}
          className="w-full h-full flex items-center justify-center overflow-hidden py-20 px-8"
        >
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'center center',
              width: dims.width,
              height: dims.height,
              flexShrink: 0,
            }}
          >
            {document.type === "report" && (
              <ReportPreviewLandscape data={document.data as any} />
            )}
            {document.type === "invoice" && (
              <InvoicePreview data={document.data as any} />
            )}
            {document.type === "contract" && (
              <ContractPreview data={document.data as any} />
            )}
            {document.type === "presentation" && (
              <PresentationPreview data={document.data as any} currentSlide={currentSlide} includeAcademy={includeAcademy} />
            )}
            {document.type === "welcomepack" && (
              <WelcomePackPreview data={document.data as any} currentSlide={currentSlide} />
            )}
          </div>
        </div>

        {/* Hidden pre-rendered slides for PDF generation */}
        {document.type === "presentation" && (
          <div 
            ref={hiddenSlidesRef}
            style={{
              position: 'fixed',
              left: '-99999px',
              top: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {getPresentationSlidesArray().map((slideNum) => (
              <div
                key={slideNum}
                style={{
                  width: '1600px',
                  height: '900px',
                  backgroundColor: '#000000',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                <PresentationPreview data={document.data as any} currentSlide={slideNum} includeAcademy={includeAcademy} />
              </div>
            ))}
          </div>
        )}

        {document.type === "welcomepack" && (
          <div 
            ref={hiddenSlidesRef}
            style={{
              position: 'fixed',
              left: '-99999px',
              top: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {WELCOMEPACK_SLIDES_ARRAY.map((slideNum) => (
              <div
                key={slideNum}
                style={{
                  width: '1600px',
                  height: '900px',
                  backgroundColor: '#000000',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                <WelcomePackPreview data={document.data as any} currentSlide={slideNum} />
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};