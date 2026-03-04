import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CalendarPlus, RefreshCw, FileText, Download, X, Maximize2, Building2, Clock, Calendar, UserCircle, FileCheck, Link2, ExternalLink } from 'lucide-react';
import { format, addMonths } from 'date-fns';
import { pl } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { AnnexPreview } from '@/components/contract/AnnexPreview';
import { DocumentFullscreenModal } from '@/components/document/DocumentFullscreenModal';
import jsPDF from 'jspdf';
import { toJpeg } from 'html-to-image';

interface RenewContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  currentEndDate: Date | null;
  onSuccess: () => void;
}

interface AnnexFormData {
  clientName: string;
  clientOwnerName: string;
  clientAddress: string;
  clientNip: string;
  agencyName: string;
  agencyOwnerName: string;
  agencyAddress: string;
  agencyNip: string;
  originalContractDate: string;
  newStartDate: string;
  newEndDate: string;
  durationMonths: number;
  contractAmount: number | null;
  signDate: string;
  signCity: string;
}

export function RenewContractDialog({
  open,
  onOpenChange,
  clientId,
  clientName,
  currentEndDate,
  onSuccess,
}: RenewContractDialogProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [durationMonths, setDurationMonths] = useState('1');
  const [contractAmount, setContractAmount] = useState('');
  const [generateAnnex, setGenerateAnnex] = useState(true);
  const [annexData, setAnnexData] = useState<AnnexFormData | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [showMiniCard, setShowMiniCard] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [originalContract, setOriginalContract] = useState<{ id: string; title: string } | null>(null);
  const annexRef = useRef<HTMLDivElement>(null);
  const [newStartDate, setNewStartDate] = useState(() => {
    if (currentEndDate) {
      const nextDay = new Date(currentEndDate);
      nextDay.setDate(nextDay.getDate() + 1);
      return format(nextDay, 'yyyy-MM-dd');
    }
    return format(new Date(), 'yyyy-MM-dd');
  });

  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      if (currentEndDate) {
        const nextDay = new Date(currentEndDate);
        nextDay.setDate(nextDay.getDate() + 1);
        setNewStartDate(format(nextDay, 'yyyy-MM-dd'));
      } else {
        setNewStartDate(format(new Date(), 'yyyy-MM-dd'));
      }
      setDurationMonths('1');
      setContractAmount('');
      setGenerateAnnex(true);
      setAnnexData(null);
      setPdfBlob(null);
      setShowMiniCard(false);
      setShowFullscreen(false);
      setThumbnailUrl(null);
      setOriginalContract(null);

      // Pre-fill contract amount from client data
      supabase
        .from('clients')
        .select('contract_amount')
        .eq('id', clientId)
        .single()
        .then(({ data }) => {
          if (data?.contract_amount) {
            setContractAmount(String(data.contract_amount));
          }
        });
    }
    prevOpenRef.current = open;
  }, [open, currentEndDate, clientId]);

  const calculateNewEndDate = () => {
    if (!newStartDate) return null;
    const start = new Date(newStartDate);
    return addMonths(start, parseInt(durationMonths));
  };

  const newEndDate = calculateNewEndDate();

  const loadAgencyData = () => {
    try {
      const saved = localStorage.getItem('contractAgencyData');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  };

  // Generate PDF, upload, and save to DB - called from handleRenew after annexData is ready
  const generateUploadAndSave = async (data: AnnexFormData) => {
    setGeneratingPdf(true);
    // Wait for the AnnexPreview to render
    await new Promise(resolve => setTimeout(resolve, 800));

    // Generate thumbnail
    let thumbBlob: Blob | null = null;
    const wrapperEl = annexRef.current;
    const element = document.getElementById('annex-preview');
    console.log('[Annex] Thumbnail attempt - wrapper:', !!wrapperEl, 'element:', !!element, 'element size:', element?.scrollWidth, 'x', element?.scrollHeight);
    if (element && wrapperEl) {
      try {
        const target = (element.querySelector(':scope > div') as HTMLElement) || element;
        console.log('[Annex] Target:', target.tagName, target.scrollWidth, 'x', target.scrollHeight, 'offsetW:', target.offsetWidth);
        const thumb = await toJpeg(target, { 
          cacheBust: true, 
          pixelRatio: 0.5, 
          backgroundColor: '#09090b', 
          quality: 0.7,
          width: target.scrollWidth || 794,
          height: target.scrollHeight || 1123,
        });
        // Hide wrapper after capture
        wrapperEl.style.display = 'none';
        console.log('[Annex] Thumbnail result length:', thumb?.length);
        if (thumb && thumb.length > 500) {
          setThumbnailUrl(thumb);
          const res = await fetch(thumb);
          thumbBlob = await res.blob();
        }
      } catch (e) {
        wrapperEl.style.display = 'none';
        console.error('[Annex] Thumbnail error:', e);
      }
    }

    const blob = await generatePdfFromPreview();
    if (blob) {
      setPdfBlob(blob);

      const ts = format(new Date(), 'yyyy-MM-dd_HHmmss');
      const fileName = `${clientId}/aneks_${ts}.pdf`;
      const thumbFileName = `${clientId}/aneks_${ts}_thumb.jpg`;

      // Upload PDF and thumbnail in parallel
      const uploads: Promise<any>[] = [
        supabase.storage.from('client_documents').upload(fileName, blob, { contentType: 'application/pdf' }),
      ];
      if (thumbBlob) {
        uploads.push(
          supabase.storage.from('client_documents').upload(thumbFileName, thumbBlob, { contentType: 'image/jpeg' })
        );
      }
      const results = await Promise.all(uploads);
      results.forEach((r: any, i: number) => { if (r.error) console.error(`Upload ${i} error:`, r.error); });

      const { error: insertError } = await supabase.from('client_app_documents').insert({
        client_id: clientId,
        title: `Aneks - przedłużenie umowy (${format(new Date(data.newStartDate), 'MM/yyyy')})`,
        type: 'contract',
        file_url: fileName,
        storage_path: fileName,
        file_size: blob.size,
        created_by: user?.id,
      });

      if (insertError) {
        console.error('Insert error:', insertError);
        toast.error('Błąd zapisu aneksu do bazy danych');
      } else {
        toast.success('Aneks został zapisany');
      }
    } else {
      toast.error('Nie udało się wygenerować PDF');
    }
    setGeneratingPdf(false);
  };

  const handleRenew = async () => {
    if (!newStartDate) {
      toast.error('Wybierz datę rozpoczęcia');
      return;
    }

    setSaving(true);
    try {
      const endDateStr = newEndDate ? format(newEndDate, 'yyyy-MM-dd') : null;

      // Fetch client data BEFORE updating so we get the original contract_start_date
      let builtAnnexData: AnnexFormData | null = null;
      if (generateAnnex && newEndDate) {
        const [{ data: clientData }, { data: contractDoc }] = await Promise.all([
          supabase
            .from('clients')
            .select('salon_name, owner_name, city, email, phone, contract_amount, contract_start_date')
            .eq('id', clientId)
            .single(),
          supabase
            .from('documents')
            .select('id, title, data')
            .eq('client_id', clientId)
            .eq('type', 'contract')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        if (contractDoc) {
          setOriginalContract({ id: contractDoc.id, title: contractDoc.title });
        }

        // Use data from saved contract document (has full agency + client details)
        const contractData = (contractDoc?.data || {}) as Record<string, any>;
        const cd = clientData as any;
        const agency = loadAgencyData();

        builtAnnexData = {
          clientName: contractData.clientName || cd?.salon_name || clientName,
          clientOwnerName: contractData.clientOwnerName || cd?.owner_name || '',
          clientAddress: contractData.clientAddress || cd?.city || '',
          clientNip: contractData.clientNip || '',
          agencyName: contractData.agencyName || agency.agencyName || 'Agencja Marketingowa Aurine',
          agencyOwnerName: contractData.agencyOwnerName || agency.agencyOwnerName || '',
          agencyAddress: contractData.agencyAddress || agency.agencyAddress || '',
          agencyNip: contractData.agencyNip || agency.agencyNip || '',
          originalContractDate: cd?.contract_start_date || '',
          newStartDate,
          newEndDate: endDateStr || '',
          durationMonths: parseInt(durationMonths),
          contractAmount: contractAmount ? parseFloat(contractAmount) : cd?.contract_amount || null,
          signDate: format(new Date(), 'yyyy-MM-dd'),
          signCity: contractData.signCity || cd?.city || '',
        };
      }

      const { error } = await supabase
        .from('clients')
        .update({
          contract_start_date: newStartDate,
          contract_end_date: endDateStr,
          contract_duration_months: parseInt(durationMonths),
          ...(contractAmount ? { contract_amount: parseFloat(contractAmount) } : {}),
          status: 'active',
        })
        .eq('id', clientId);

      if (error) throw error;

      if (builtAnnexData) {
        setAnnexData(builtAnnexData);
        onOpenChange(false);
        setShowMiniCard(true);
        toast.success('Umowa przedłużona! Generowanie aneksu...');
        // Use requestAnimationFrame + delay to ensure AnnexPreview is fully rendered
        requestAnimationFrame(() => {
          setTimeout(async () => {
            try {
              await generateUploadAndSave(builtAnnexData);
            } catch (e) {
              console.error('generateUploadAndSave failed:', e);
            }
          }, 600);
        });
      } else {
        toast.success('Umowa została przedłużona');
        onSuccess();
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error renewing contract:', error);
      toast.error('Błąd podczas przedłużania umowy');
    } finally {
      setSaving(false);
    }
  };

  const generatePdfFromPreview = async (): Promise<Blob | null> => {
    const element = document.getElementById('annex-preview');
    if (!element) {
      console.error('Annex preview element not found');
      return null;
    }

    try {
      const page = element.querySelector(':scope > div') as HTMLElement;
      if (!page) return null;

      const A4_WIDTH = 595.28;
      const A4_HEIGHT = 841.89;

      const canvas = await toJpeg(page, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#09090b',
        quality: 0.95,
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
        compress: true,
      });

      pdf.addImage(canvas, 'JPEG', 0, 0, A4_WIDTH, A4_HEIGHT);
      return pdf.output('blob');
    } catch (err) {
      console.error('Error generating annex PDF:', err);
      toast.error('Błąd generowania aneksu');
      return null;
    }
  };

  const handleDownload = () => {
    if (!pdfBlob) return;
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Aneks_${clientName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCloseMiniCard = () => {
    if (generatingPdf) return; // Don't close while still saving
    setShowMiniCard(false);
    setShowFullscreen(false);
    onSuccess();
  };

  const handleOpenFullscreen = () => {
    setShowFullscreen(true);
  };

  const handleCloseFullscreen = () => {
    setShowFullscreen(false);
  };

  const handleCloseForm = () => {
    onOpenChange(false);
  };

  const formatAnnexDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'd MMMM yyyy', { locale: pl });
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      {/* Hidden annex preview for PDF generation */}
      {annexData && (
        <div
          ref={annexRef}
          style={{
            position: 'fixed',
            top: '-9999px',
            left: '-9999px',
            width: '794px',
            height: '1123px',
            overflow: 'visible',
            pointerEvents: 'none',
            zIndex: -1,
            background: '#09090b',
          }}
          className="annex-offscreen-render"
        >
          <AnnexPreview data={annexData} />
        </div>
      )}

      {/* Form dialog */}
      <Dialog open={open} onOpenChange={handleCloseForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-primary" />
              Przedłuż umowę
            </DialogTitle>
            <DialogDescription>
              Przedłużasz umowę dla: <span className="font-medium text-foreground">{clientName}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {currentEndDate && (
              <div className="p-3 rounded-lg bg-secondary/50 border border-border/50">
                <p className="text-xs text-muted-foreground mb-1">Obecna data zakończenia</p>
                <p className="font-medium">{format(currentEndDate, 'd MMMM yyyy')}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="start-date">Nowa data rozpoczęcia</Label>
              <Input
                id="start-date"
                type="date"
                value={newStartDate}
                onChange={(e) => setNewStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Okres trwania</Label>
              <Select value={durationMonths} onValueChange={setDurationMonths}>
                <SelectTrigger id="duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 miesiąc</SelectItem>
                  <SelectItem value="2">2 miesiące</SelectItem>
                  <SelectItem value="3">3 miesiące</SelectItem>
                  <SelectItem value="6">6 miesięcy</SelectItem>
                  <SelectItem value="12">12 miesięcy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contract-amount">Kwota miesięczna (zł)</Label>
              <Input
                id="contract-amount"
                type="number"
                placeholder="np. 1500"
                value={contractAmount}
                onChange={(e) => setContractAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Pozostaw puste, aby zachować obecną kwotę</p>
            </div>

            {newEndDate && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-xs text-muted-foreground mb-1">Nowa data zakończenia</p>
                <p className="font-medium text-primary">{format(newEndDate, 'd MMMM yyyy')}</p>
              </div>
            )}

            <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <Checkbox
                id="generate-annex"
                checked={generateAnnex}
                onCheckedChange={(checked) => setGenerateAnnex(checked === true)}
                className="mt-0.5"
              />
              <div className="space-y-1">
                <Label htmlFor="generate-annex" className="flex items-center gap-2 cursor-pointer">
                  <FileText className="w-4 h-4 text-primary" />
                  Wygeneruj aneks PDF
                </Label>
                <p className="text-xs text-muted-foreground">
                  PDF w stylu umowy — zapisany w dokumentach klienta
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseForm} disabled={saving}>
              Anuluj
            </Button>
            <Button onClick={handleRenew} disabled={saving}>
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CalendarPlus className="w-4 h-4 mr-2" />
              )}
              {saving ? 'Generowanie...' : 'Przedłuż umowę'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mini card dialog — like DocumentMiniCard */}
      <Dialog open={showMiniCard} onOpenChange={(v) => { if (!v) handleCloseMiniCard(); }}>
        <DialogContent className="sm:max-w-md p-0 gap-0 border-border/60">
          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-lg border bg-blue-500/10 text-blue-400 border-blue-500/30">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{clientName}</h3>
                    <p className="text-sm text-muted-foreground truncate">Aneks do umowy - {clientName}</p>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Thumbnail */}
              {thumbnailUrl ? (
                <div className="aspect-[16/9] rounded-lg overflow-hidden bg-background border border-border/40">
                  <img
                    src={thumbnailUrl}
                    alt="Podgląd aneksu"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              ) : generatingPdf ? (
                <div className="aspect-[16/9] rounded-lg overflow-hidden bg-background border border-border/40 flex items-center justify-center">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generowanie podglądu...
                  </div>
                </div>
              ) : null}

              {/* Badge */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                  Aneks
                </Badge>
              </div>

              {/* Details */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-3 text-sm">
                  <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Klient:</span>
                  <span className="text-foreground font-medium truncate">{clientName}</span>
                </div>
                {annexData && (
                  <>
                    <div className="flex items-center gap-3 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">Okres:</span>
                      <span className="text-foreground font-medium">
                        {formatAnnexDate(annexData.newStartDate)} — {formatAnnexDate(annexData.newEndDate)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">Czas trwania:</span>
                      <span className="text-foreground font-medium">{annexData.durationMonths} mies.</span>
                    </div>
                    {/* Link to original contract */}
                    {originalContract && (
                      <div className="flex items-center gap-3 text-sm pt-2 border-t border-border/40">
                        <Link2 className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">Aneks do:</span>
                        <button
                          onClick={() => {
                            handleCloseMiniCard();
                            navigate(`/history?document=${originalContract.id}`);
                          }}
                          className="text-primary font-medium truncate hover:underline flex items-center gap-1"
                        >
                          {originalContract.title}
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </button>
                      </div>
                    )}
                    {!originalContract && annexData.originalContractDate && (
                      <div className="flex items-center gap-3 text-sm">
                        <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">Umowa z:</span>
                        <span className="text-foreground font-medium">{formatAnnexDate(annexData.originalContractDate)}</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Created date */}
              <div className="flex items-center gap-3 text-sm pt-2 border-t border-border/40">
                <FileCheck className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Utworzono:</span>
                <span className="text-foreground">{format(new Date(), 'd MMMM yyyy, HH:mm', { locale: pl })}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button className="flex-1 gap-2" onClick={handleOpenFullscreen}>
                  <Maximize2 className="w-4 h-4" />
                  Otwórz pełny podgląd
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleDownload}
                  disabled={!pdfBlob || generatingPdf}
                  className="shrink-0"
                >
                  {generatingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>

      {/* Fullscreen preview modal — opened from mini card */}
      <DocumentFullscreenModal
        open={showFullscreen}
        onClose={handleCloseFullscreen}
        title={`Aneks - ${clientName}`}
      >
        <div className="relative">
          {annexData && <AnnexPreview data={annexData} />}
          
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
            <Button 
              onClick={handleDownload} 
              disabled={!pdfBlob || generatingPdf}
              size="lg"
              className="shadow-xl"
            >
              <Download className="w-4 h-4 mr-2" />
              Pobierz PDF
            </Button>
          </div>
        </div>
      </DocumentFullscreenModal>
    </>
  );
}
