import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import { X, Maximize2, FileText, Receipt, FileSignature, Presentation, GraduationCap, Calendar, User, Building2, Banknote, Clock, FileCheck, UserCircle, Trash2, Loader2, Link2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CloudDocumentItem } from "@/hooks/useCloudDocumentHistory";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface LinkedInvoice {
  id: string;
  title: string;
  type: 'advance' | 'final';
  exists: boolean;
}

interface DocumentMiniCardProps {
  document: CloudDocumentItem;
  onClose: () => void;
  onViewFullscreen: () => void;
  onDelete?: (id: string) => Promise<void>;
  canDelete?: boolean;
  onViewLinkedInvoice?: (documentId: string) => void;
}

const typeLabels: Record<string, string> = {
  report: "Raport",
  invoice: "Faktura",
  contract: "Umowa",
  presentation: "Prezentacja",
  welcomepack: "Welcome Pack",
};

const typeIcons: Record<string, React.ElementType> = {
  report: FileText,
  invoice: Receipt,
  contract: FileSignature,
  presentation: Presentation,
  welcomepack: GraduationCap,
};

const typeColors: Record<string, string> = {
  report: "bg-pink-500/10 text-pink-400 border-pink-500/30",
  invoice: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  contract: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  presentation: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  welcomepack: "bg-amber-500/10 text-amber-400 border-amber-500/30",
};

const invoiceTypeLabels: Record<string, string> = {
  full: "Całościowa",
  advance: "Zaliczkowa",
  final: "Końcowa",
};

const invoiceTypeColors: Record<string, string> = {
  full: "bg-emerald-500/20 text-emerald-400",
  advance: "bg-amber-500/20 text-amber-400",
  final: "bg-blue-500/20 text-blue-400",
};

export function DocumentMiniCard({ document, onClose, onViewFullscreen, onDelete, canDelete = false, onViewLinkedInvoice }: DocumentMiniCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [linkedInvoice, setLinkedInvoice] = useState<LinkedInvoice | null>(null);
  const [loadingLinked, setLoadingLinked] = useState(false);
  const Icon = typeIcons[document.type] || FileText;
  const data = document.data as Record<string, any>;

  // Fetch linked invoice for advance/final invoices
  useEffect(() => {
    const fetchLinkedInvoice = async () => {
      if (document.type !== 'invoice') return;
      
      const invoiceType = data?.invoiceType;
      if (invoiceType !== 'advance' && invoiceType !== 'final') return;

      setLoadingLinked(true);
      try {
        if (invoiceType === 'advance') {
          // Look for pending_final_invoices where this is the advance invoice
          const { data: pending } = await supabase
            .from('pending_final_invoices')
            .select('final_invoice_id, status')
            .eq('advance_invoice_id', document.id)
            .maybeSingle();

          if (pending) {
            if (pending.final_invoice_id) {
              // Final invoice exists
              const { data: finalDoc } = await supabase
                .from('documents')
                .select('id, title')
                .eq('id', pending.final_invoice_id)
                .maybeSingle();

              setLinkedInvoice({
                id: finalDoc?.id || pending.final_invoice_id,
                title: finalDoc?.title || 'Faktura końcowa',
                type: 'final',
                exists: true
              });
            } else {
              // No final invoice yet
              setLinkedInvoice({
                id: '',
                title: 'Nie wystawiono',
                type: 'final',
                exists: false
              });
            }
          }
        } else if (invoiceType === 'final') {
          // Look for pending_final_invoices where this is the final invoice
          const { data: pending } = await supabase
            .from('pending_final_invoices')
            .select('advance_invoice_id')
            .eq('final_invoice_id', document.id)
            .maybeSingle();

          if (pending?.advance_invoice_id) {
            const { data: advanceDoc } = await supabase
              .from('documents')
              .select('id, title')
              .eq('id', pending.advance_invoice_id)
              .maybeSingle();

            setLinkedInvoice({
              id: advanceDoc?.id || pending.advance_invoice_id,
              title: advanceDoc?.title || 'Faktura zaliczkowa',
              type: 'advance',
              exists: true
            });
          }
        }
      } catch (err) {
        console.error('Error fetching linked invoice:', err);
      } finally {
        setLoadingLinked(false);
      }
    };

    fetchLinkedInvoice();
  }, [document.id, document.type, data?.invoiceType]);

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(document.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };
  
  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "d MMMM yyyy, HH:mm", { locale: pl });
    } catch {
      return dateStr;
    }
  };

  // Extract details based on document type
  const getDocumentDetails = () => {
    const details: { icon: React.ElementType; label: string; value: string }[] = [];

    // Common: Client name
    if (data?.clientName || data?.salonName) {
      details.push({
        icon: Building2,
        label: "Klient",
        value: data.clientName || data.salonName,
      });
    }

    // Common: Owner name
    if (data?.ownerName) {
      details.push({
        icon: User,
        label: "Właściciel",
        value: data.ownerName,
      });
    }

    // Invoice specific
    if (document.type === "invoice") {
      if (data?.amount || data?.totalAmount) {
        details.push({
          icon: Banknote,
          label: "Kwota",
          value: `${data.amount || data.totalAmount} zł`,
        });
      }
      if (data?.paymentDue) {
        details.push({
          icon: Clock,
          label: "Termin płatności",
          value: data.paymentDue,
        });
      }
    }

    // Contract specific
    if (document.type === "contract") {
      if (data?.contractDuration) {
        details.push({
          icon: Clock,
          label: "Okres umowy",
          value: `${data.contractDuration} mies.`,
        });
      }
      if (data?.monthlyBudget) {
        details.push({
          icon: Banknote,
          label: "Budżet miesięczny",
          value: `${data.monthlyBudget} zł`,
        });
      }
    }

    // Report specific
    if (document.type === "report") {
      if (data?.month && data?.year) {
        const monthNames = ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", 
                          "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"];
        details.push({
          icon: Calendar,
          label: "Okres",
          value: `${monthNames[parseInt(data.month) - 1]} ${data.year}`,
        });
      }
    }

    // Presentation specific
    if (document.type === "presentation") {
      if (data?.includeAcademy !== undefined) {
        details.push({
          icon: GraduationCap,
          label: "Aurine Academy",
          value: data.includeAcademy === "true" || data.includeAcademy === true ? "Tak" : "Nie",
        });
      }
    }

    return details;
  };

  const details = getDocumentDetails();
  const invoiceType = document.type === "invoice" ? data?.invoiceType : null;

  return (
    <Card className="w-full max-w-md bg-card border-border/60 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2.5 rounded-lg border ${typeColors[document.type]}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground truncate">{document.title}</h3>
              {document.subtitle && (
                <p className="text-sm text-muted-foreground truncate">{document.subtitle}</p>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Thumbnail */}
        {document.thumbnail && (
          <div className="aspect-[16/9] rounded-lg overflow-hidden bg-background border border-border/40">
            <img
              src={document.thumbnail}
              alt={document.title}
              className="w-full h-full object-cover object-top"
            />
          </div>
        )}

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={typeColors[document.type]}>
            {typeLabels[document.type]}
          </Badge>
          {invoiceType && (
            <Badge className={invoiceTypeColors[invoiceType] || "bg-secondary"}>
              {invoiceTypeLabels[invoiceType] || invoiceType}
            </Badge>
          )}
        </div>

        {/* Details */}
        {details.length > 0 && (
          <div className="space-y-2.5">
            {details.map((detail, idx) => (
              <div key={idx} className="flex items-center gap-3 text-sm">
                <detail.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">{detail.label}:</span>
                <span className="text-foreground font-medium truncate">{detail.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Linked invoice section for advance/final invoices */}
        {document.type === 'invoice' && (data?.invoiceType === 'advance' || data?.invoiceType === 'final') && (
          <div className="pt-2 border-t border-border/40">
            {loadingLinked ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Ładowanie powiązań...</span>
              </div>
            ) : linkedInvoice ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm min-w-0">
                  <Link2 className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground shrink-0">
                    {linkedInvoice.type === 'final' ? 'Faktura końcowa:' : 'Faktura zaliczkowa:'}
                  </span>
                  {linkedInvoice.exists ? (
                    <span className="text-foreground font-medium truncate">{linkedInvoice.title}</span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Nie wystawiono
                    </span>
                  )}
                </div>
                {linkedInvoice.exists && onViewLinkedInvoice && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="shrink-0 h-7 text-xs"
                    onClick={() => onViewLinkedInvoice(linkedInvoice.id)}
                  >
                    Zobacz
                  </Button>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* Creator info with role badge */}
        {document.creatorName && (
          <div className={`flex items-center gap-3 text-sm ${!(document.type === 'invoice' && (data?.invoiceType === 'advance' || data?.invoiceType === 'final')) ? 'pt-2 border-t border-border/40' : ''}`}>
            <UserCircle className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">Utworzył:</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              document.creatorRole === 'szef' 
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' 
                : 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
            }`}>
              {document.creatorName}
            </span>
          </div>
        )}

        {/* Created date */}
        <div className={`flex items-center gap-3 text-sm ${!document.creatorName ? 'pt-2 border-t border-border/40' : ''}`}>
          <FileCheck className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">Utworzono:</span>
          <span className="text-foreground">{formatDate(document.createdAt)}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button className="flex-1 gap-2" onClick={onViewFullscreen}>
            <Maximize2 className="w-4 h-4" />
            Otwórz pełny podgląd
          </Button>
          
          {canDelete && onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="icon" className="text-destructive hover:text-destructive shrink-0" disabled={isDeleting}>
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Usunąć dokument?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Czy na pewno chcesz usunąć "{document.title}"? Ta operacja jest nieodwracalna.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Anuluj</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Usuń
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
