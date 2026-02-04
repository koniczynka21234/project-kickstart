import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Download, FileImage, ArrowLeft, Link, Building2, Plus, Trash2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { InvoicePreview, InvoiceService } from "@/components/invoice/InvoicePreview";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCloudDocumentHistory } from "@/hooks/useCloudDocumentHistory";
import { useThumbnailGenerator } from "@/hooks/useThumbnailGenerator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { DocumentFullscreenModal } from "@/components/document/DocumentFullscreenModal";
import jsPDF from "jspdf";
import { toPng, toJpeg } from "html-to-image";

type InvoiceType = "advance" | "final" | "full";

interface ClientOption {
  id: string;
  salon_name: string;
  owner_name?: string | null;
  city?: string | null;
  email?: string | null;
  phone?: string | null;
  contract_amount?: number | null;
}

const AGENCY_STORAGE_KEY = "aurine_agency_data";

const createDefaultService = (): InvoiceService => ({
  id: crypto.randomUUID(),
  description: "Usługi marketingowe Facebook Ads",
  quantity: 1,
  price: "",
});

const InvoiceGenerator = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isSzef } = useUserRole();
  const { saveDocument, updateThumbnail } = useCloudDocumentHistory();
  const { generateThumbnail: genThumb } = useThumbnailGenerator();
  const [invoiceType, setInvoiceType] = useState<InvoiceType>("full");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);
  const [paymentCreated, setPaymentCreated] = useState(false);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [previewScale, setPreviewScale] = useState(0.5);
  const [previewReady, setPreviewReady] = useState(false);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [pendingFinalInvoiceId, setPendingFinalInvoiceId] = useState<string | null>(null);
  
  const getStoredAgencyData = () => {
    try {
      const stored = localStorage.getItem(AGENCY_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {
      agencyName: "Aurine",
      agencyOwner: "",
      agencyAddress: "",
      agencyNIP: "",
      bankName: "",
      bankAccount: "",
    };
  };

  const storedAgency = getStoredAgencyData();

  const [services, setServices] = useState<InvoiceService[]>([createDefaultService()]);

  const [formData, setFormData] = useState({
    clientName: "",
    clientOwnerName: "",
    clientAddress: "",
    clientNIP: "",
    clientPhone: "",
    clientEmail: "",
    invoiceNumber: "",
    issueDate: new Date().toISOString().split("T")[0],
    advanceAmount: "",
    totalContractAmount: "", // Full contract amount for advance invoices
    paymentDue: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    bankName: storedAgency.bankName,
    bankAccount: storedAgency.bankAccount,
    agencyName: storedAgency.agencyName,
    agencyOwner: storedAgency.agencyOwner,
    agencyAddress: storedAgency.agencyAddress,
    agencyNIP: storedAgency.agencyNIP,
    agencyPhone: storedAgency.agencyPhone || "",
    agencyEmail: storedAgency.agencyEmail || "",
  });

  // Generate next invoice number
  const [invoiceCount, setInvoiceCount] = useState<number>(1);

  useEffect(() => {
    const fetchInvoiceCount = async () => {
      const { count } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'invoice');
      const nextNum = (count || 0) + 1;
      setInvoiceCount(nextNum);
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      setFormData(prev => ({ 
        ...prev, 
        invoiceNumber: prev.invoiceNumber || `FV/${year}/${month}/${String(nextNum).padStart(3, '0')}`
      }));
    };
    fetchInvoiceCount();
  }, []);

  // Save agency data when it changes
  useEffect(() => {
    const agencyData = {
      agencyName: formData.agencyName,
      agencyOwner: formData.agencyOwner,
      agencyAddress: formData.agencyAddress,
      agencyNIP: formData.agencyNIP,
      agencyPhone: formData.agencyPhone,
      agencyEmail: formData.agencyEmail,
      bankName: formData.bankName,
      bankAccount: formData.bankAccount,
    };
    localStorage.setItem(AGENCY_STORAGE_KEY, JSON.stringify(agencyData));
  }, [formData.agencyName, formData.agencyOwner, formData.agencyAddress, formData.agencyNIP, formData.agencyPhone, formData.agencyEmail, formData.bankName, formData.bankAccount]);

  useEffect(() => {
    const fetchData = async () => {
      const clientsRes = await supabase.from('clients').select('id, salon_name, owner_name, city, email, phone, contract_amount').order('salon_name');
      setClients(clientsRes.data || []);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const stored = sessionStorage.getItem("loadDocument");
    if (stored) {
      try {
        const doc = JSON.parse(stored);
        if (doc.type === "invoice") {
          const loadedData = doc.data;
          
          // If clientId is provided, auto-select the client and populate data
          if (loadedData.clientId) {
            setSelectedClientId(loadedData.clientId);
            // Fetch full client data to populate all fields
            const fetchClientData = async () => {
              const { data: client } = await supabase
                .from('clients')
                .select('salon_name, owner_name, city, email, phone, contract_amount')
                .eq('id', loadedData.clientId)
                .single();
              
              if (client) {
                setFormData(prev => ({
                  ...prev,
                  clientName: client.salon_name || loadedData.clientName || "",
                  clientOwnerName: client.owner_name || loadedData.clientOwnerName || "",
                  clientAddress: client.city || loadedData.clientAddress || "",
                  clientPhone: client.phone || "",
                  clientEmail: client.email || "",
                  // Auto-fill contract amount for advance invoices
                  totalContractAmount: loadedData.totalContractAmount || (client.contract_amount ? String(client.contract_amount) : prev.totalContractAmount),
                }));
                
                // For advance invoice type, set service price to 50% of contract
                if (loadedData.invoiceType === 'advance' && client.contract_amount && !loadedData.services) {
                  const halfAmount = Math.round(client.contract_amount / 2);
                  setServices([{
                    id: crypto.randomUUID(),
                    description: 'Obsługa marketingowa – zaliczka',
                    quantity: 1,
                    price: String(halfAmount),
                  }]);
                }
              }
            };
            fetchClientData();
          }
          
          setFormData(prev => ({
            ...prev,
            clientName: loadedData.clientName || prev.clientName || "",
            clientOwnerName: loadedData.clientOwnerName || prev.clientOwnerName || "",
            clientAddress: loadedData.clientAddress || prev.clientAddress || "",
            clientNIP: loadedData.clientNIP || "",
            invoiceNumber: loadedData.invoiceNumber || "",
            issueDate: loadedData.issueDate || prev.issueDate,
            advanceAmount: loadedData.advanceAmount || "",
            totalContractAmount: loadedData.totalContractAmount || prev.totalContractAmount,
            paymentDue: loadedData.paymentDue || prev.paymentDue,
            bankName: loadedData.bankName || prev.bankName,
            bankAccount: loadedData.bankAccount || prev.bankAccount,
            agencyName: loadedData.agencyName || prev.agencyName,
            agencyOwner: loadedData.agencyOwner || prev.agencyOwner,
            agencyAddress: loadedData.agencyAddress || prev.agencyAddress,
            agencyNIP: loadedData.agencyNIP || prev.agencyNIP,
          }));
          // Parse services from JSON string if stored that way
          if (loadedData.services) {
            const parsedServices = typeof loadedData.services === 'string' 
              ? JSON.parse(loadedData.services) 
              : loadedData.services;
            if (Array.isArray(parsedServices)) setServices(parsedServices);
          }
          if (loadedData.invoiceType) setInvoiceType(loadedData.invoiceType as InvoiceType);
          // Track pending final invoice ID if creating final from advance
          if (loadedData.pendingFinalInvoiceId) {
            setPendingFinalInvoiceId(loadedData.pendingFinalInvoiceId);
            setInvoiceType("final");
          }
        }
      } catch (e) {
        console.error("Error loading document:", e);
      }
      sessionStorage.removeItem("loadDocument");
    }
  }, [clients]);

  useEffect(() => {
    const updateScale = () => {
      if (previewContainerRef.current) {
        const containerWidth = previewContainerRef.current.clientWidth - 48; // Account for padding
        const containerHeight = previewContainerRef.current.clientHeight - 80; // Account for header
        
        // Calculate scale to fit both width and height while maximizing size
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

  const handleServiceChange = (id: string, field: keyof InvoiceService, value: string | number) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const addService = () => {
    setServices(prev => [...prev, createDefaultService()]);
  };

  const removeService = (id: string) => {
    if (services.length > 1) {
      setServices(prev => prev.filter(s => s.id !== id));
    }
  };

  const totalAmount = services.reduce((sum, s) => sum + (parseFloat(s.price || "0") * s.quantity), 0);
  const hasRequiredFields = formData.clientName && formData.invoiceNumber && totalAmount > 0;

  // Create payment record for invoice
  const createPaymentForInvoice = async (docId: string, clientId: string, amount: number, dueDate: string) => {
    if (!isSzef || paymentCreated) return; // Only szef can create payments, prevent duplicates
    
    const invoiceTypeLabel = invoiceType === 'advance' ? 'zaliczkowa' :
      invoiceType === 'final' ? 'końcowa' : 'pełna';
    
    try {
      const { error } = await supabase.from('payments').insert({
        document_id: docId,
        client_id: clientId,
        amount: amount,
        due_date: dueDate,
        status: 'pending',
        notes: `Faktura ${invoiceTypeLabel} ${formData.invoiceNumber}`,
        created_by: user?.id,
      });
      
      if (error) {
        console.error('Error creating payment:', error);
        // Don't show error to user - payment creation is secondary
      } else {
        setPaymentCreated(true);
      }
    } catch (err) {
      console.error('Payment creation failed:', err);
    }
  };

  // Create pending final invoice record when advance invoice is saved
  const createPendingFinalInvoice = async (docId: string, clientId: string, advanceAmount: number, fullAmount: number) => {
    if (!user) return;
    
    try {
      // Expected date is contract end date if available, or 30 days from now
      const client = clients.find(c => c.id === clientId);
      let expectedDate: string | null = null;
      
      // For now, set expected date to 30 days from now
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      expectedDate = thirtyDaysFromNow.toISOString().split('T')[0];
      
      const { error } = await supabase.from('pending_final_invoices').insert({
        advance_invoice_id: docId,
        client_id: clientId,
        advance_amount: advanceAmount,
        total_amount: fullAmount,
        remaining_amount: fullAmount - advanceAmount,
        expected_date: expectedDate,
        created_by: user.id,
        notes: `Faktura zaliczkowa ${formData.invoiceNumber}`,
      });
      
      if (error) {
        console.error('Error creating pending final invoice:', error);
      }
    } catch (err) {
      console.error('Pending final invoice creation failed:', err);
    }
  };

  // Mark pending final invoice as completed
  const completePendingFinalInvoice = async (pendingId: string, finalDocId: string) => {
    try {
      const { error } = await supabase
        .from('pending_final_invoices')
        .update({
          status: 'completed',
          final_invoice_id: finalDocId,
          completed_at: new Date().toISOString(),
        })
        .eq('id', pendingId);
      
      if (error) {
        console.error('Error completing pending final invoice:', error);
      }
    } catch (err) {
      console.error('Complete pending final invoice failed:', err);
    }
  };

  const handleSave = async () => {
    if (!hasRequiredFields) {
      toast.error("Uzupełnij wszystkie wymagane pola");
      return;
    }

    if (invoiceType === "final" && !formData.advanceAmount) {
      toast.error("Podaj kwotę zaliczki dla faktury końcowej");
      return;
    }

    const docData: Record<string, string> = {
      ...formData,
      services: JSON.stringify(services),
      invoiceType,
      amount: String(totalAmount),
    };
    
    const docId = await saveDocument(
      "invoice",
      formData.clientName,
      `Faktura ${formData.invoiceNumber}`,
      docData,
      undefined,
      selectedClientId || undefined,
      undefined
    );
    setCurrentDocId(docId);
    
    if (docId) {
      toast.success("Faktura została zapisana");
    }

    // Auto-create payment if client selected and szef role
    if (docId && selectedClientId && isSzef && !paymentCreated) {
      await createPaymentForInvoice(docId, selectedClientId, totalAmount, formData.paymentDue);
    }

    // If this is an advance invoice, create a pending final invoice record
    if (docId && selectedClientId && invoiceType === "advance") {
      const fullAmount = formData.totalContractAmount 
        ? parseFloat(formData.totalContractAmount) 
        : totalAmount * 2; // Default to double if not specified
      await createPendingFinalInvoice(docId, selectedClientId, totalAmount, fullAmount);
    }

    // If this is a final invoice linked to a pending record, mark it as completed
    if (docId && pendingFinalInvoiceId && invoiceType === "final") {
      await completePendingFinalInvoice(pendingFinalInvoiceId, docId);
    }

    if (docId) {
      const thumbnail = await genThumb({
        elementId: "invoice-preview",
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

    const element = document.getElementById("invoice-preview");
    if (!element) return;

    setIsGenerating(true);
    try {
      // Auto-save before download
      let docId = currentDocId;
      if (!docId) {
        const docData: Record<string, string> = {
          ...formData,
          services: JSON.stringify(services),
          invoiceType,
          amount: String(totalAmount),
        };
        docId = await saveDocument(
          "invoice",
          formData.clientName,
          `Faktura ${formData.invoiceNumber}`,
          docData,
          undefined,
          selectedClientId || undefined,
          undefined
        );
        setCurrentDocId(docId);
        
        // Auto-create payment if client selected and szef role
        if (docId && selectedClientId && isSzef && !paymentCreated) {
          await createPaymentForInvoice(docId, selectedClientId, totalAmount, formData.paymentDue);
        }
        
        if (docId) {
          const thumbnail = await genThumb({
            elementId: "invoice-preview",
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
      
      const canvas = await toJpeg(element, { 
        cacheBust: true, 
        pixelRatio: 2, 
        backgroundColor: "#09090b", 
        quality: 0.95 
      });
      const pdf = new jsPDF({ 
        orientation: "portrait", 
        unit: "pt", 
        format: "a4",
        compress: true 
      });
      pdf.addImage(canvas, "JPEG", 0, 0, A4_WIDTH, A4_HEIGHT);
      pdf.save(`${formData.invoiceNumber.replace(/\//g, "-")}.pdf`);
      // Silent download - no toast notification
    } catch (error) {
      toast.error("Nie udało się wygenerować PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadAsImage = async () => {
    const element = document.getElementById("invoice-preview");
    if (!element) return;

    setIsGenerating(true);
    try {
      const imgData = await toPng(element, { cacheBust: true, pixelRatio: 2, backgroundColor: "#1f1f23" });
      const link = document.createElement("a");
      link.download = `${formData.invoiceNumber.replace(/\//g, "-")}.png`;
      link.href = imgData;
      link.click();
      // Silent download - no toast notification
    } catch (error) {
      toast.error("Nie udało się pobrać obrazu");
    } finally {
      setIsGenerating(false);
    }
  };

  const invoiceTypes = [
    { id: "advance" as InvoiceType, label: "Zaliczkowa" },
    { id: "final" as InvoiceType, label: "Końcowa" },
    { id: "full" as InvoiceType, label: "Pełna" },
  ];

  return (
    <AppLayout>
      <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row w-full overflow-hidden">
        {/* Left Panel - Form */}
        <div className="w-full lg:w-[360px] xl:w-[400px] flex-shrink-0 lg:border-r border-border/50 bg-card/30 flex flex-col h-[50vh] lg:h-full">
          <div className="p-4 border-b border-border/50 sticky top-0 bg-card/95 backdrop-blur-sm z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold text-foreground">Generator Faktur</h1>
                <p className="text-xs text-muted-foreground">Faktury bez VAT</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="p-4 space-y-4 overflow-y-auto flex-1">
            {/* Invoice Type */}
            <div>
              <Label className="text-xs mb-2 block">Typ faktury</Label>
              <div className="grid grid-cols-3 gap-2">
                {invoiceTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setInvoiceType(type.id)}
                    className={`p-2 rounded-lg border text-xs font-medium transition-all ${
                      invoiceType === type.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/50 hover:border-primary/30 text-muted-foreground"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Nazwa salonu / firmy *</Label>
                <Input
                  value={formData.clientName}
                  onChange={(e) => handleInputChange("clientName", e.target.value)}
                  placeholder="Salon Beauty XYZ"
                  className="h-9 mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Imię i nazwisko właścicielki</Label>
                <Input
                  value={formData.clientOwnerName}
                  onChange={(e) => handleInputChange("clientOwnerName", e.target.value)}
                  placeholder="Anna Kowalska"
                  className="h-9 mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Numer faktury *</Label>
                <Input
                  value={formData.invoiceNumber}
                  onChange={(e) => handleInputChange("invoiceNumber", e.target.value)}
                  placeholder="FV/2025/01/001"
                  className="h-9 mt-1"
                />
              </div>

              {invoiceType === "advance" && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 space-y-3">
                  <p className="text-xs text-amber-400 font-medium flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px]">!</span>
                    Pełna kwota umowy (do śledzenia faktury końcowej)
                  </p>
                  <Input
                    type="number"
                    value={formData.totalContractAmount}
                    onChange={(e) => handleInputChange("totalContractAmount", e.target.value)}
                    placeholder={`np. ${totalAmount * 2} (domyślnie 2x zaliczka)`}
                    className="h-9 bg-background/50"
                  />
                </div>
              )}

              {invoiceType === "final" && (
                <div>
                  <Label className="text-xs">Zaliczka (PLN) *</Label>
                  <Input
                    type="number"
                    value={formData.advanceAmount}
                    onChange={(e) => handleInputChange("advanceAmount", e.target.value)}
                    placeholder="2000"
                    className="h-9 mt-1"
                  />
                </div>
              )}

              <div>
                <Label className="text-xs flex items-center gap-1">
                  <Link className="w-3 h-3 text-primary" />
                  Wybierz klienta
                </Label>
                <Select 
                  value={selectedClientId || "none"} 
                  onValueChange={(v) => { 
                    setSelectedClientId(v === "none" ? "" : v); 
                    if (v !== "none") {
                      const client = clients.find(c => c.id === v);
                      if (client) {
                        setFormData(prev => ({
                          ...prev,
                          clientName: client.salon_name,
                          clientOwnerName: client.owner_name || "",
                          clientAddress: client.city ? `${client.city}` : prev.clientAddress,
                          clientPhone: client.phone || "",
                          clientEmail: client.email || "",
                          // Auto-fill contract amount when selecting client
                          totalContractAmount: client.contract_amount ? String(client.contract_amount) : prev.totalContractAmount,
                        }));
                        
                        // If advance invoice, pre-fill service with 50% of contract amount
                        if (invoiceType === 'advance' && client.contract_amount) {
                          const halfAmount = Math.round(client.contract_amount / 2);
                          setServices([{
                            id: crypto.randomUUID(),
                            description: 'Obsługa marketingowa – zaliczka',
                            quantity: 1,
                            price: String(halfAmount),
                          }]);
                        }
                      }
                    }
                  }}
                >
                  <SelectTrigger className="h-9 mt-1">
                    <SelectValue placeholder="Wybierz klienta..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Bez powiązania</SelectItem>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.salon_name} {c.owner_name ? `(${c.owner_name})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Adres klienta</Label>
                <Input
                  value={formData.clientAddress}
                  onChange={(e) => handleInputChange("clientAddress", e.target.value)}
                  placeholder="ul. Przykładowa 123, 00-000 Warszawa"
                  className="h-9 mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">NIP klienta</Label>
                  <Input
                    value={formData.clientNIP}
                    onChange={(e) => handleInputChange("clientNIP", e.target.value)}
                    placeholder="1234567890"
                    className="h-9 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Telefon klienta</Label>
                  <Input
                    value={formData.clientPhone}
                    onChange={(e) => handleInputChange("clientPhone", e.target.value)}
                    placeholder="+48 123 456 789"
                    className="h-9 mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Email klienta</Label>
                <Input
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => handleInputChange("clientEmail", e.target.value)}
                  placeholder="klient@example.com"
                  className="h-9 mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Data wystawienia</Label>
                  <Input
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => handleInputChange("issueDate", e.target.value)}
                    className="h-9 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Termin płatności</Label>
                  <Input
                    type="date"
                    value={formData.paymentDue}
                    onChange={(e) => handleInputChange("paymentDue", e.target.value)}
                    className="h-9 mt-1"
                  />
                </div>
              </div>


              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Nazwa banku</Label>
                  <Input
                    value={formData.bankName}
                    onChange={(e) => handleInputChange("bankName", e.target.value)}
                    placeholder="mBank"
                    className="h-9 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Numer konta</Label>
                  <Input
                    value={formData.bankAccount}
                    onChange={(e) => handleInputChange("bankAccount", e.target.value)}
                    placeholder="00 0000 0000 0000 0000 0000"
                    className="h-9 mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Services Section */}
            <div className="p-4 border-t border-border/50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-foreground">Usługi *</h3>
                <Button variant="ghost" size="sm" onClick={addService} className="h-7 text-xs">
                  <Plus className="w-3 h-3 mr-1" />
                  Dodaj
                </Button>
              </div>
              <div className="space-y-3">
                {services.map((service, index) => (
                  <div key={service.id} className="p-3 rounded-lg border border-border/50 bg-muted/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Usługa {index + 1}</span>
                      {services.length > 1 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeService(service.id)}
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    <Input
                      value={service.description}
                      onChange={(e) => handleServiceChange(service.id, "description", e.target.value)}
                      placeholder="Opis usługi"
                      className="h-8 text-sm"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Ilość</Label>
                        <Input
                          type="number"
                          min="1"
                          value={service.quantity}
                          onChange={(e) => handleServiceChange(service.id, "quantity", parseInt(e.target.value) || 1)}
                          className="h-8 text-sm mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Cena (PLN)</Label>
                        <Input
                          type="number"
                          value={service.price}
                          onChange={(e) => handleServiceChange(service.id, "price", e.target.value)}
                          placeholder="0"
                          className="h-8 text-sm mt-1"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 border-t border-border/30">
                  <span className="text-sm text-muted-foreground">Suma</span>
                  <span className="text-sm font-bold text-primary">{totalAmount.toLocaleString("pl-PL", { minimumFractionDigits: 2 })} zł</span>
                </div>
              </div>
            </div>

            {/* Agency Data Section */}
            <div className="p-4 border-t border-border/50">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-medium text-foreground">Dane agencji (zapamiętywane)</h3>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Nazwa firmy</Label>
                    <Input
                      value={formData.agencyName}
                      onChange={(e) => handleInputChange("agencyName", e.target.value)}
                      placeholder="Aurine"
                      className="h-9 mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Imię i nazwisko</Label>
                    <Input
                      value={formData.agencyOwner}
                      onChange={(e) => handleInputChange("agencyOwner", e.target.value)}
                      placeholder="Jan Kowalski"
                      className="h-9 mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Adres agencji</Label>
                  <Input
                    value={formData.agencyAddress}
                    onChange={(e) => handleInputChange("agencyAddress", e.target.value)}
                    placeholder="ul. Przykładowa 123, 00-000 Miasto"
                    className="h-9 mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">NIP agencji</Label>
                    <Input
                      value={formData.agencyNIP}
                      onChange={(e) => handleInputChange("agencyNIP", e.target.value)}
                      placeholder="1234567890"
                      className="h-9 mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Telefon agencji</Label>
                    <Input
                      value={formData.agencyPhone}
                      onChange={(e) => handleInputChange("agencyPhone", e.target.value)}
                      placeholder="+48 123 456 789"
                      className="h-9 mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Email agencji</Label>
                  <Input
                    type="email"
                    value={formData.agencyEmail}
                    onChange={(e) => handleInputChange("agencyEmail", e.target.value)}
                    placeholder="kontakt@aurine.pl"
                    className="h-9 mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-border/50 space-y-2">
              <Button onClick={handleSave} className="w-full" disabled={!hasRequiredFields}>
                Zapisz fakturę
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
        <div ref={previewContainerRef} className="flex-1 flex flex-col bg-muted/30 p-4 lg:p-6 h-[50vh] lg:h-full overflow-hidden">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <h2 className="text-sm font-medium text-muted-foreground">Podgląd na żywo</h2>
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
          
          <div className="flex-1 flex items-center justify-center min-h-0">
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
                className="rounded-xl shadow-2xl ring-1 ring-border/20"
                style={{ 
                  backgroundColor: '#09090b',
                  width: `${595 * previewScale}px`,
                }}
              >
                <div 
                  style={{ 
                    width: '595px',
                    zoom: previewScale,
                  }}
                >
                  <InvoicePreview data={{ ...formData, services, invoiceType, amount: String(totalAmount) }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fullscreen Modal */}
        <DocumentFullscreenModal 
          open={isFullscreenOpen} 
          onClose={() => setIsFullscreenOpen(false)}
          title={`Faktura ${formData.invoiceNumber}`}
        >
          <div style={{ backgroundColor: '#09090b' }}>
            <InvoicePreview data={{ ...formData, services, invoiceType, amount: String(totalAmount) }} />
          </div>
        </DocumentFullscreenModal>
      </div>
    </AppLayout>
  );
};

export default InvoiceGenerator;