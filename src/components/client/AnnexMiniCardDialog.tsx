import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { ScrollText, Building2, FileText, Calendar, Download, Loader2, Maximize2, Clock, Link2, ExternalLink } from 'lucide-react';
import { DocumentFullscreenModal } from '@/components/document/DocumentFullscreenModal';
import { AnnexPreview } from '@/components/contract/AnnexPreview';

interface AnnexMiniCardDialogProps {
  annex: { id: string; title: string; created_at: string; storage_path: string | null };
  clientName: string;
  contractStartDate: string | null;
  onClose: () => void;
}

export function AnnexMiniCardDialog({ annex, clientName, contractStartDate, onClose }: AnnexMiniCardDialogProps) {
  const navigate = useNavigate();
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [annexPreviewData, setAnnexPreviewData] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [originalContract, setOriginalContract] = useState<{ id: string; title: string; subtitle: string | null } | null>(null);
  const [previewScale, setPreviewScale] = useState(0.67);
  const previewContainerRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      setPreviewScale(node.offsetWidth / 595);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!annex.id) return;

      // Load thumbnail from storage (thumb file is stored next to the PDF)
      if (annex.storage_path) {
        const thumbPath = annex.storage_path.replace('.pdf', '_thumb.jpg');
        try {
          const { data: signedData, error } = await supabase.storage
            .from('client_documents')
            .createSignedUrl(thumbPath, 3600);
          if (signedData?.signedUrl && !error) {
            // Verify the thumbnail actually exists by trying to fetch it
            const checkResponse = await fetch(signedData.signedUrl, { method: 'HEAD' });
            if (checkResponse.ok) {
              setThumbnailUrl(signedData.signedUrl);
            } else {
              console.log('[AnnexMiniCard] Thumbnail not found in storage for:', thumbPath);
            }
          }
        } catch (err) {
          console.log('[AnnexMiniCard] Thumbnail fetch error:', err);
        }
      }

      // Get client_id from client_app_documents to find original contract
      const { data: annexDoc } = await supabase
        .from('client_app_documents')
        .select('client_id')
        .eq('id', annex.id)
        .maybeSingle();

      if (annexDoc?.client_id) {
        const { data: contractDoc } = await supabase
          .from('documents')
          .select('id, title, subtitle')
          .eq('client_id', annexDoc.client_id)
          .eq('type', 'contract')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (contractDoc) {
          setOriginalContract({ id: contractDoc.id, title: contractDoc.title, subtitle: contractDoc.subtitle });
        }
      }
    };
    fetchData();
  }, [annex.id, annex.storage_path]);

  // Auto-load preview data for fallback thumbnail
  useEffect(() => {
    if (thumbnailUrl || annexPreviewData || loadingPreview) return;
    
    const loadPreviewData = async () => {
      try {
        const { data: annexDoc } = await supabase
          .from('client_app_documents')
          .select('client_id')
          .eq('id', annex.id)
          .maybeSingle();

        if (annexDoc?.client_id) {
          const [{ data: clientData }, { data: contractDoc }] = await Promise.all([
            supabase
              .from('clients')
              .select('salon_name, owner_name, city, contract_amount, contract_start_date')
              .eq('id', annexDoc.client_id)
              .single(),
            supabase
              .from('documents')
              .select('data')
              .eq('client_id', annexDoc.client_id)
              .eq('type', 'contract')
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle(),
          ]);

          const contractData = (contractDoc?.data || {}) as Record<string, any>;
          const cd = clientData as any;
          const agency = (() => { try { return JSON.parse(localStorage.getItem('contractAgencyData') || '{}'); } catch { return {}; } })();

          setAnnexPreviewData({
            clientName: contractData.clientName || cd?.salon_name || clientName,
            clientOwnerName: contractData.clientOwnerName || cd?.owner_name || '',
            clientAddress: contractData.clientAddress || cd?.city || '',
            clientNip: contractData.clientNip || '',
            agencyName: contractData.agencyName || agency.agencyName || 'Agencja Marketingowa Aurine',
            agencyOwnerName: contractData.agencyOwnerName || agency.agencyOwnerName || '',
            agencyAddress: contractData.agencyAddress || agency.agencyAddress || '',
            agencyNip: contractData.agencyNip || agency.agencyNip || '',
            originalContractDate: cd?.contract_start_date || '',
            newStartDate: '',
            newEndDate: '',
            durationMonths: 1,
            contractAmount: cd?.contract_amount || null,
            signDate: annex.created_at,
            signCity: contractData.signCity || cd?.city || '',
          });
        }
      } catch (err) {
        console.error('[AnnexMiniCard] Failed to load preview data for fallback:', err);
      }
    };

    // Small delay to allow thumbnail URL to be set first
    const timer = setTimeout(loadPreviewData, 500);
    return () => clearTimeout(timer);
  }, [annex.id, thumbnailUrl, annexPreviewData, loadingPreview, clientName]);

  const handleDownload = async () => {
    if (!annex.storage_path) {
      toast.error('Brak pliku do pobrania');
      return;
    }
    setDownloading(true);
    try {
      const { data, error } = await supabase.storage
        .from('client_documents')
        .download(annex.storage_path);
      
      if (data) {
        const url = URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${annex.title.replace(/\s+/g, '_')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        console.error('Download error:', error);
        toast.error('Nie udało się pobrać aneksu');
      }
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Błąd podczas pobierania');
    } finally {
      setDownloading(false);
    }
  };

  const handleOpenFullscreen = async () => {
    if (annexPreviewData) {
      setShowFullscreen(true);
      return;
    }
    setLoadingPreview(true);
    try {
      const { data: annexDoc } = await supabase
        .from('client_app_documents')
        .select('client_id')
        .eq('id', annex.id)
        .maybeSingle();

      if (annexDoc?.client_id) {
        const [{ data: clientData }, { data: contractDoc }] = await Promise.all([
          supabase
            .from('clients')
            .select('salon_name, owner_name, city, contract_amount, contract_start_date')
            .eq('id', annexDoc.client_id)
            .single(),
          supabase
            .from('documents')
            .select('data')
            .eq('client_id', annexDoc.client_id)
            .eq('type', 'contract')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        const contractData = (contractDoc?.data || {}) as Record<string, any>;
        const cd = clientData as any;
        const agency = (() => { try { return JSON.parse(localStorage.getItem('contractAgencyData') || '{}'); } catch { return {}; } })();

        setAnnexPreviewData({
          clientName: contractData.clientName || cd?.salon_name || clientName,
          clientOwnerName: contractData.clientOwnerName || cd?.owner_name || '',
          clientAddress: contractData.clientAddress || cd?.city || '',
          clientNip: contractData.clientNip || '',
          agencyName: contractData.agencyName || agency.agencyName || 'Agencja Marketingowa Aurine',
          agencyOwnerName: contractData.agencyOwnerName || agency.agencyOwnerName || '',
          agencyAddress: contractData.agencyAddress || agency.agencyAddress || '',
          agencyNip: contractData.agencyNip || agency.agencyNip || '',
          originalContractDate: cd?.contract_start_date || '',
          newStartDate: '',
          newEndDate: '',
          durationMonths: 1,
          contractAmount: cd?.contract_amount || null,
          signDate: annex.created_at,
          signCity: contractData.signCity || cd?.city || '',
        });
        setShowFullscreen(true);
      }
    } catch (err) {
      console.error(err);
      toast.error('Nie udało się załadować podglądu');
    } finally {
      setLoadingPreview(false);
    }
  };

  return (
    <>
      <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
        <DialogContent className="sm:max-w-md p-0 gap-0 border-border/60">
          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-lg border bg-blue-500/10 text-blue-400 border-blue-500/30">
                    <ScrollText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{clientName}</h3>
                    <p className="text-sm text-muted-foreground truncate">{annex.title}</p>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Thumbnail - from storage or live preview fallback */}
              {thumbnailUrl ? (
                <div className="aspect-[16/9] bg-muted rounded-lg overflow-hidden">
                  <img
                    src={thumbnailUrl}
                    alt={annex.title}
                    className="w-full h-full object-cover object-top"
                    onError={() => setThumbnailUrl(null)}
                  />
                </div>
              ) : annexPreviewData ? (
                <div className="aspect-[16/9] bg-muted rounded-lg overflow-hidden relative">
                  <div ref={previewContainerRef} className="absolute inset-0">
                    <div className="origin-top-left" style={{ transform: `scale(${previewScale})`, width: '595px' }}>
                      <AnnexPreview data={annexPreviewData} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="aspect-[16/9] bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                  <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
                    <ScrollText className="w-8 h-8 text-primary/60" />
                  </div>
                </div>
              )}

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

                {/* Link to original contract */}
                {originalContract && (
                  <div className="flex items-center gap-3 text-sm">
                    <Link2 className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Aneks do:</span>
                    <button
                      onClick={() => {
                        onClose();
                        navigate(`/history?document=${originalContract.id}`);
                      }}
                      className="text-primary font-medium truncate hover:underline flex items-center gap-1"
                    >
                      {originalContract.subtitle || `Umowa - ${originalContract.title}`}
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </button>
                  </div>
                )}

                {contractStartDate && !originalContract && (
                  <div className="flex items-center gap-3 text-sm">
                    <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Umowa z:</span>
                    <span className="text-foreground font-medium">
                      {format(new Date(contractStartDate), 'd MMMM yyyy', { locale: pl })}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Utworzono:</span>
                  <span className="text-foreground font-medium">
                    {format(new Date(annex.created_at), 'd MMMM yyyy, HH:mm', { locale: pl })}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button className="flex-1 gap-2" onClick={handleOpenFullscreen} disabled={loadingPreview}>
                  {loadingPreview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Maximize2 className="w-4 h-4" />}
                  Otwórz pełny podgląd
                </Button>
                {annex.storage_path && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleDownload}
                    disabled={downloading}
                    className="shrink-0"
                  >
                    {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>

      {/* Fullscreen preview */}
      {showFullscreen && annexPreviewData && (
        <DocumentFullscreenModal
          open={showFullscreen}
          onClose={() => setShowFullscreen(false)}
          title={`Aneks - ${clientName}`}
        >
          <div className="relative">
            <AnnexPreview data={annexPreviewData} />
            <div className="fixed bottom-6 right-6 z-50">
              <Button onClick={handleDownload} disabled={downloading} size="lg" className="shadow-xl">
                <Download className="w-4 h-4 mr-2" />
                Pobierz PDF
              </Button>
            </div>
          </div>
        </DocumentFullscreenModal>
      )}
    </>
  );
}
