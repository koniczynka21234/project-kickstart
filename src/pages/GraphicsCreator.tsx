import { useState, useRef } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Download, RotateCcw, Upload, X, Loader2, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import FabricCanvasComponent, { FabricCanvasRef } from '@/components/graphics/FabricCanvas';
import { fabricTemplates, getTemplateById } from '@/components/graphics/fabricTemplates';

export default function GraphicsCreator() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('before-after');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.5);
  const canvasRef = useRef<FabricCanvasRef>(null);

  const currentTemplate = getTemplateById(selectedTemplateId);

  // Get image fields from template
  const imageFields = currentTemplate?.elements
    .filter(el => el.type === 'image' && el.props.name)
    .map(el => ({ name: el.props.name as string })) || [];

  // Get text fields from template
  const textFields = currentTemplate?.elements
    .filter(el => el.type === 'text' && el.props.name)
    .map(el => ({
      name: el.props.name as string,
      defaultValue: el.props.text as string,
    })) || [];

  const handleImageUpload = (fieldName: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Max 10MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setFormData(prev => ({ ...prev, [fieldName]: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleFieldChange = (fieldName: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleDownload = async () => {
    if (!canvasRef.current) return;
    setIsGenerating(true);
    try {
      const dataUrl = await canvasRef.current.exportImage();
      if (dataUrl) {
        const a = document.createElement('a');
        a.download = `${selectedTemplateId}-${Date.now()}.png`;
        a.href = dataUrl;
        a.click();
        toast.success('Pobrano!');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Błąd eksportu');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setFormData({});
  };

  const getFieldLabel = (name: string): string => {
    const labels: Record<string, string> = {
      mainImage: 'Zdjęcie',
      beforeImage: 'Zdjęcie PRZED',
      afterImage: 'Zdjęcie PO',
      treatmentName: 'Nazwa zabiegu',
      serviceName: 'Nazwa usługi',
      salonName: 'Nazwa salonu',
      description: 'Opis',
      price: 'Cena',
      discountValue: 'Rabat (np. -30%)',
      discountOn: 'Na co rabat',
      validUntil: 'Ważne do',
      tagline: 'Hasło',
      offerName: 'Nazwa oferty',
      oldPrice: 'Stara cena',
      newPrice: 'Nowa cena',
      cta: 'Przycisk',
    };
    return labels[name] || name;
  };

  return (
    <AppLayout>
      <div className="min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row w-full max-w-full overflow-x-hidden">
        {/* Sidebar - Mobile: collapsible, Desktop: fixed */}
        <div className="w-full lg:w-[360px] border-b lg:border-b-0 lg:border-r border-border bg-card/50 flex flex-col max-h-[35vh] lg:max-h-none lg:h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="p-3 lg:p-4 border-b border-border flex items-center justify-between">
            <h1 className="text-base lg:text-lg font-semibold">Kreator Grafik</h1>
            {/* Mobile: Action buttons in header */}
            <div className="flex lg:hidden gap-2">
              <Button size="sm" onClick={handleDownload} disabled={isGenerating}>
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-3 lg:p-4 space-y-4 lg:space-y-6">
              {/* Template selection */}
              <div>
                <Label className="text-xs lg:text-sm font-medium mb-2 block">Szablon</Label>
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-1 lg:space-y-1">
                  {fabricTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateChange(template.id)}
                      className={cn(
                        "w-full p-2 lg:p-3 rounded-lg border text-left transition-all",
                        selectedTemplateId === template.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <span className="text-xs lg:text-sm font-medium">{template.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Image uploads */}
              {imageFields.length > 0 && (
                <div className="space-y-2 lg:space-y-3">
                  <Label className="text-xs lg:text-sm font-medium">Zdjęcia</Label>
                  <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 lg:gap-3">
                    {imageFields.map((field) => (
                      <div key={field.name}>
                        <label className="text-[10px] lg:text-xs text-muted-foreground mb-1 block">
                          {getFieldLabel(field.name)}
                        </label>
                        <div className={cn(
                          "relative h-16 lg:h-24 rounded-lg border-2 border-dashed overflow-hidden",
                          formData[field.name] ? "border-primary/50" : "border-border hover:border-primary/30"
                        )}>
                          {formData[field.name] ? (
                            <>
                              <img src={formData[field.name]} alt="" className="w-full h-full object-cover" />
                              <button
                                onClick={() => {
                                  setFormData(prev => {
                                    const n = { ...prev };
                                    delete n[field.name];
                                    return n;
                                  });
                                }}
                                className="absolute top-1 right-1 w-5 h-5 lg:w-6 lg:h-6 bg-black/70 rounded-full flex items-center justify-center hover:bg-black"
                              >
                                <X className="w-2.5 h-2.5 lg:w-3 lg:h-3 text-white" />
                              </button>
                            </>
                          ) : (
                            <label className="flex flex-col items-center justify-center h-full cursor-pointer">
                              <Upload className="w-4 h-4 lg:w-5 lg:h-5 text-muted-foreground mb-1" />
                              <span className="text-[10px] lg:text-xs text-muted-foreground text-center px-1">Dodaj</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageUpload(field.name)}
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Text fields */}
              {textFields.length > 0 && (
                <div className="space-y-2 lg:space-y-3">
                  <Label className="text-xs lg:text-sm font-medium">Teksty</Label>
                  {textFields.map((field) => (
                    <div key={field.name}>
                      <label className="text-[10px] lg:text-xs text-muted-foreground mb-1 block">
                        {getFieldLabel(field.name)}
                      </label>
                      <Input
                        value={formData[field.name] ?? ''}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        placeholder={field.defaultValue}
                        className="h-8 lg:h-9 text-xs lg:text-sm"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Actions - Desktop only, mobile has buttons in header */}
          <div className="hidden lg:block p-4 border-t border-border space-y-2">
            <Button onClick={handleDownload} disabled={isGenerating} className="w-full">
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
              Pobierz PNG
            </Button>
            <Button variant="outline" onClick={() => setFormData({})} className="w-full">
              <RotateCcw className="w-4 h-4 mr-2" />Reset
            </Button>
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 bg-zinc-950 flex flex-col min-h-0">
          <div className="h-10 lg:h-11 border-b border-border px-3 lg:px-4 flex items-center justify-between bg-card/30 flex-shrink-0">
            <span className="text-xs lg:text-sm truncate">{currentTemplate?.name} • {currentTemplate?.width}x{currentTemplate?.height}</span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-6 w-6 lg:h-7 lg:w-7" onClick={() => setPreviewScale(Math.max(0.15, previewScale - 0.1))}>
                <ZoomOut className="w-3 h-3" />
              </Button>
              <span className="text-[10px] lg:text-xs w-8 lg:w-10 text-center">{Math.round(previewScale * 100)}%</span>
              <Button variant="ghost" size="icon" className="h-6 w-6 lg:h-7 lg:w-7" onClick={() => setPreviewScale(Math.min(1, previewScale + 0.1))}>
                <ZoomIn className="w-3 h-3" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-3 lg:p-6 flex items-start justify-center mobile-scroll">
            {currentTemplate && (
              <div style={{ transform: `scale(${previewScale})`, transformOrigin: 'top center' }}>
                <FabricCanvasComponent
                  key={`${selectedTemplateId}-${JSON.stringify(formData)}`}
                  ref={canvasRef}
                  template={currentTemplate}
                  formData={formData}
                />
              </div>
            )}
          </div>

          {/* Mobile bottom actions */}
          <div className="lg:hidden flex gap-2 p-3 border-t border-border bg-card/30 safe-area-bottom">
            <Button variant="outline" onClick={() => setFormData({})} className="flex-1" size="sm">
              <RotateCcw className="w-4 h-4 mr-2" />Reset
            </Button>
            <Button onClick={handleDownload} disabled={isGenerating} className="flex-1" size="sm">
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
              Pobierz
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}