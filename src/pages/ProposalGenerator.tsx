import { useState, useEffect, useRef } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  FileText, 
  Download, 
  Eye, 
  Sparkles,
  Building2,
  Target,
  DollarSign,
  CheckCircle2,
  ArrowRight,
  Loader2
} from 'lucide-react';
import jsPDF from 'jspdf';
import * as htmlToImage from 'html-to-image';
import agencyLogo from '@/assets/agency-logo.png';

interface Lead {
  id: string;
  salon_name: string;
  owner_name: string | null;
  city: string | null;
  email: string | null;
  phone: string | null;
  industry: string | null;
}

interface ProposalData {
  leadId: string;
  salonName: string;
  ownerName: string;
  city: string;
  industry: string;
  packageType: 'basic' | 'standard' | 'premium';
  customServices: string[];
  monthlyBudget: number;
  campaignGoals: string;
  additionalNotes: string;
}

const packages = {
  basic: {
    name: 'Podstawowy',
    price: 1500,
    features: [
      'Zarządzanie 1 kampanią',
      'Raport miesięczny',
      'Optymalizacja budżetu',
      'Targetowanie lokalne',
    ],
  },
  standard: {
    name: 'Standard',
    price: 2500,
    features: [
      'Zarządzanie 2-3 kampaniami',
      'Raporty tygodniowe',
      'A/B testy reklam',
      'Remarketing',
      'Kreacje graficzne (4/mies)',
    ],
  },
  premium: {
    name: 'Premium',
    price: 4000,
    features: [
      'Nieograniczone kampanie',
      'Dedykowany opiekun',
      'Raporty na żądanie',
      'Pełna obsługa kreatywna',
      'Strategia marketingowa',
      'Priorytetowe wsparcie',
    ],
  },
};

export default function ProposalGenerator() {
  const { user } = useAuth();
  const previewRef = useRef<HTMLDivElement>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('form');
  
  const [formData, setFormData] = useState<ProposalData>({
    leadId: '',
    salonName: '',
    ownerName: '',
    city: '',
    industry: '',
    packageType: 'standard',
    customServices: [],
    monthlyBudget: 2000,
    campaignGoals: '',
    additionalNotes: '',
  });

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    const { data, error } = await supabase
      .from('leads')
      .select('id, salon_name, owner_name, city, email, phone, industry')
      .in('status', ['new', 'contacted', 'interested', 'rozmowa'])
      .order('created_at', { ascending: false });

    if (!error && data) {
      setLeads(data);
    }
    setLoading(false);
  };

  const handleLeadSelect = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      setFormData(prev => ({
        ...prev,
        leadId,
        salonName: lead.salon_name,
        ownerName: lead.owner_name || '',
        city: lead.city || '',
        industry: lead.industry || '',
      }));
    }
  };

  const selectedPackage = packages[formData.packageType];
  const totalMonthly = selectedPackage.price + formData.monthlyBudget;

  const generatePDF = async () => {
    if (!previewRef.current) return;
    
    setGenerating(true);
    try {
      const element = previewRef.current;
      const canvas = await htmlToImage.toCanvas(element, {
        backgroundColor: '#09090b',
        pixelRatio: 2,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2],
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`Oferta_${formData.salonName.replace(/\s+/g, '_')}.pdf`);
      
      // Save to documents
      await supabase.from('documents').insert([{
        title: `Oferta dla ${formData.salonName}`,
        subtitle: selectedPackage.name,
        type: 'proposal',
        data: JSON.parse(JSON.stringify(formData)),
        created_by: user?.id,
      }]);
      
      toast.success('Oferta wygenerowana i zapisana');
    } catch (error) {
      console.error(error);
      toast.error('Błąd generowania PDF');
    }
    setGenerating(false);
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 space-y-6 animate-fade-in w-full max-w-full overflow-hidden">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Generator Ofert</h1>
            <p className="text-muted-foreground">Twórz profesjonalne propozycje współpracy dla klientów</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="form">
              <FileText className="h-4 w-4 mr-2" />
              Formularz
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Eye className="h-4 w-4 mr-2" />
              Podgląd
            </TabsTrigger>
          </TabsList>

          <TabsContent value="form" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Client Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Dane klienta
                  </CardTitle>
                  <CardDescription>Wybierz lead lub wprowadź dane ręcznie</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Wybierz z leadów</Label>
                    <Select value={formData.leadId} onValueChange={handleLeadSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Wybierz lead..." />
                      </SelectTrigger>
                      <SelectContent>
                        {leads.map(lead => (
                          <SelectItem key={lead.id} value={lead.id}>
                            {lead.salon_name} {lead.city && `(${lead.city})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Nazwa salonu *</Label>
                      <Input 
                        value={formData.salonName}
                        onChange={(e) => setFormData(p => ({ ...p, salonName: e.target.value }))}
                        placeholder="np. Beauty Studio"
                      />
                    </div>
                    <div>
                      <Label>Właściciel</Label>
                      <Input 
                        value={formData.ownerName}
                        onChange={(e) => setFormData(p => ({ ...p, ownerName: e.target.value }))}
                        placeholder="np. Anna Kowalska"
                      />
                    </div>
                    <div>
                      <Label>Miasto</Label>
                      <Input 
                        value={formData.city}
                        onChange={(e) => setFormData(p => ({ ...p, city: e.target.value }))}
                        placeholder="np. Warszawa"
                      />
                    </div>
                    <div>
                      <Label>Branża</Label>
                      <Select value={formData.industry} onValueChange={(v) => setFormData(p => ({ ...p, industry: v }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Wybierz..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fryzjerstwo">Fryzjerstwo</SelectItem>
                          <SelectItem value="kosmetyka">Kosmetyka</SelectItem>
                          <SelectItem value="paznokcie">Paznokcie</SelectItem>
                          <SelectItem value="spa">SPA & Wellness</SelectItem>
                          <SelectItem value="barber">Barber Shop</SelectItem>
                          <SelectItem value="inne">Inne</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Package Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Wybierz pakiet
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    {(Object.entries(packages) as [keyof typeof packages, typeof packages.basic][]).map(([key, pkg]) => (
                      <button
                        key={key}
                        onClick={() => setFormData(p => ({ ...p, packageType: key }))}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          formData.packageType === key 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <p className="font-semibold text-foreground">{pkg.name}</p>
                        <p className="text-lg font-bold text-primary mt-1">{pkg.price} zł</p>
                        <p className="text-xs text-muted-foreground">/ miesiąc</p>
                      </button>
                    ))}
                  </div>

                  <div className="p-4 rounded-lg bg-secondary/30">
                    <p className="font-medium mb-2">Zawiera:</p>
                    <ul className="space-y-1.5">
                      {selectedPackage.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Campaign Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Szczegóły kampanii
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Miesięczny budżet reklamowy (PLN)</Label>
                    <Input 
                      type="number"
                      value={formData.monthlyBudget}
                      onChange={(e) => setFormData(p => ({ ...p, monthlyBudget: parseInt(e.target.value) || 0 }))}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Kwota przeznaczona na reklamy Facebook</p>
                  </div>

                  <div>
                    <Label>Cele kampanii</Label>
                    <Textarea 
                      value={formData.campaignGoals}
                      onChange={(e) => setFormData(p => ({ ...p, campaignGoals: e.target.value }))}
                      placeholder="np. Zwiększenie liczby rezerwacji, promocja nowej usługi..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>Dodatkowe uwagi</Label>
                    <Textarea 
                      value={formData.additionalNotes}
                      onChange={(e) => setFormData(p => ({ ...p, additionalNotes: e.target.value }))}
                      placeholder="np. Specjalne wymagania, preferencje..."
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Summary */}
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    Podsumowanie
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pakiet {selectedPackage.name}:</span>
                      <span className="font-medium">{selectedPackage.price} zł</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Budżet reklamowy:</span>
                      <span className="font-medium">{formData.monthlyBudget} zł</span>
                    </div>
                    <div className="border-t border-border pt-2 flex justify-between">
                      <span className="font-semibold">Razem miesięcznie:</span>
                      <span className="text-xl font-bold text-primary">{totalMonthly} zł</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setActiveTab('preview')}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Podgląd
                    </Button>
                    <Button 
                      className="flex-1"
                      onClick={generatePDF}
                      disabled={generating || !formData.salonName}
                    >
                      {generating ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      Generuj PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="preview">
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-end mb-4">
                  <Button onClick={generatePDF} disabled={generating || !formData.salonName}>
                    {generating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Pobierz PDF
                  </Button>
                </div>

                {/* Proposal Preview */}
                <div 
                  ref={previewRef}
                  className="bg-zinc-950 text-white p-8 rounded-xl max-w-2xl mx-auto"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-8 pb-6 border-b border-zinc-800">
                    <img src={agencyLogo} alt="Aurine" className="h-12" />
                    <div className="text-right">
                      <p className="text-sm text-zinc-400">Oferta współpracy</p>
                      <p className="text-xs text-zinc-500">{new Date().toLocaleDateString('pl-PL')}</p>
                    </div>
                  </div>

                  {/* Client */}
                  <div className="mb-8">
                    <p className="text-sm text-zinc-400 mb-1">Przygotowano dla:</p>
                    <h2 className="text-2xl font-bold text-pink-400">{formData.salonName || 'Nazwa salonu'}</h2>
                    {formData.ownerName && <p className="text-zinc-300">{formData.ownerName}</p>}
                    {formData.city && <p className="text-zinc-500">{formData.city}</p>}
                  </div>

                  {/* Package */}
                  <div className="mb-8 p-6 rounded-xl bg-gradient-to-br from-pink-500/20 to-pink-500/5 border border-pink-500/30">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/30 mb-2">
                          Pakiet {selectedPackage.name}
                        </Badge>
                        <p className="text-3xl font-bold">{selectedPackage.price} zł<span className="text-lg text-zinc-400">/mies</span></p>
                      </div>
                    </div>
                    <ul className="space-y-2">
                      {selectedPackage.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-pink-400" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Budget */}
                  <div className="mb-8 grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-zinc-900">
                      <p className="text-sm text-zinc-400">Budżet reklamowy</p>
                      <p className="text-xl font-bold">{formData.monthlyBudget} zł<span className="text-sm text-zinc-400">/mies</span></p>
                    </div>
                    <div className="p-4 rounded-lg bg-zinc-900">
                      <p className="text-sm text-zinc-400">Razem miesięcznie</p>
                      <p className="text-xl font-bold text-pink-400">{totalMonthly} zł</p>
                    </div>
                  </div>

                  {/* Goals */}
                  {formData.campaignGoals && (
                    <div className="mb-8">
                      <h3 className="font-semibold mb-2 text-zinc-300">Cele kampanii:</h3>
                      <p className="text-zinc-400 text-sm">{formData.campaignGoals}</p>
                    </div>
                  )}

                  {/* CTA */}
                  <div className="text-center pt-6 border-t border-zinc-800">
                    <p className="text-zinc-400 mb-2">Zainteresowany/a?</p>
                    <p className="font-semibold">Skontaktuj się z nami:</p>
                    <p className="text-pink-400">kontakt@aurine.pl | +48 731 856 524</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
