import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageSquare, Phone, Copy, Check, User, MapPin, Loader2, 
  RefreshCw, CheckCircle2, Download, Upload, FileText 
} from 'lucide-react';
import { declineCityToLocative, getOwnerFirstName, declineSalonNameToGenitive, formatPhoneNumber } from '@/lib/polishDeclension';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface Lead {
  id: string;
  salon_name: string;
  owner_name: string | null;
  city: string | null;
  phone: string | null;
  sms_follow_up_date: string | null;
}

interface SmsTemplate {
  id: string;
  template_name: string;
  content: string;
}

interface GeneratedSms {
  leadId: string;
  salonName: string;
  ownerName: string | null;
  city: string | null;
  phone: string;
  message: string;
  selected: boolean;
}

export function SmsFollowUpToday() {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [generatedSmsList, setGeneratedSmsList] = useState<GeneratedSms[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);
  const [markingAsSent, setMarkingAsSent] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-generate all SMS when template changes
  useEffect(() => {
    if (selectedTemplate && leads.length > 0) {
      generateAllSms();
    }
  }, [selectedTemplate, leads]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      const [leadsRes, templatesRes] = await Promise.all([
        supabase
          .from('leads')
          .select('id, salon_name, owner_name, city, phone, sms_follow_up_date')
          .lte('sms_follow_up_date', today) // Include overdue SMS too
          .eq('sms_follow_up_sent', false)
          .eq('cold_email_sent', true) // SMS only after cold email sent
          .not('status', 'in', '("converted","lost")') // Exclude converted/lost leads
          .order('sms_follow_up_date', { ascending: true }),
        supabase
          .from('sms_templates')
          .select('*')
          .order('template_name')
      ]);

      setLeads(leadsRes.data || []);
      setTemplates(templatesRes.data || []);
      
      // Auto-select first template if available
      if (templatesRes.data && templatesRes.data.length > 0 && !selectedTemplate) {
        setSelectedTemplate(templatesRes.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilledTemplate = (lead: Lead): string => {
    const template = templates.find(t => t.id === selectedTemplate);
    if (!template) return '';

    let content = template.content;
    
    // Replace placeholders with properly formatted values
    const ownerFirstName = getOwnerFirstName(lead.owner_name || '');
    const declinedCity = lead.city ? declineCityToLocative(lead.city) : '';
    const declinedSalon = declineSalonNameToGenitive(lead.salon_name || '');
    
    // Support both Polish and English placeholder names
    content = content.replace(/{imie}/gi, ownerFirstName);
    content = content.replace(/{salon}/gi, declinedSalon);
    content = content.replace(/{salonu}/gi, declinedSalon);
    content = content.replace(/{miasto}/gi, declinedCity);
    content = content.replace(/{owner_name}/gi, ownerFirstName);
    content = content.replace(/{salon_name}/gi, declinedSalon);
    content = content.replace(/{city}/gi, declinedCity);

    return content;
  };

  const generateAllSms = () => {
    const generated: GeneratedSms[] = leads.map(lead => ({
      leadId: lead.id,
      salonName: lead.salon_name,
      ownerName: lead.owner_name,
      city: lead.city,
      phone: lead.phone || '',
      message: getFilledTemplate(lead),
      selected: true
    }));
    setGeneratedSmsList(generated);
  };

  const toggleSelection = (leadId: string) => {
    setGeneratedSmsList(prev => 
      prev.map(sms => 
        sms.leadId === leadId ? { ...sms, selected: !sms.selected } : sms
      )
    );
  };

  const selectAll = () => {
    setGeneratedSmsList(prev => prev.map(sms => ({ ...sms, selected: true })));
  };

  const deselectAll = () => {
    setGeneratedSmsList(prev => prev.map(sms => ({ ...sms, selected: false })));
  };

  const markSelectedAsSent = async () => {
    const selectedIds = generatedSmsList.filter(sms => sms.selected).map(sms => sms.leadId);
    if (selectedIds.length === 0) {
      toast({ title: "Błąd", description: "Nie wybrano żadnych SMS-ów", variant: "destructive" });
      return;
    }

    setMarkingAsSent(true);
    try {
      const { error } = await supabase
        .from('leads')
        .update({ sms_follow_up_sent: true })
        .in('id', selectedIds);

      if (error) throw error;

      toast({ 
        title: "Sukces", 
        description: `Oznaczono ${selectedIds.length} SMS-ów jako wysłane` 
      });
      
      // Refresh data
      fetchData();
    } catch (error) {
      console.error('Error marking as sent:', error);
      toast({ title: "Błąd", description: "Nie udało się oznaczyć jako wysłane", variant: "destructive" });
    } finally {
      setMarkingAsSent(false);
    }
  };

  const markSingleAsSent = async (leadId: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ sms_follow_up_sent: true })
        .eq('id', leadId);

      if (error) throw error;

      toast({ title: "Sukces", description: "SMS oznaczony jako wysłany" });
      fetchData();
    } catch (error) {
      console.error('Error marking as sent:', error);
      toast({ title: "Błąd", description: "Nie udało się oznaczyć jako wysłany", variant: "destructive" });
    }
  };

  const copyMessage = async (sms: GeneratedSms) => {
    await navigator.clipboard.writeText(sms.message);
    setCopiedId(sms.leadId);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Skopiowano", description: "Wiadomość skopiowana do schowka" });
  };

  const copyPhone = async (sms: GeneratedSms) => {
    if (!sms.phone) return;
    const formatted = formatPhoneNumber(sms.phone);
    await navigator.clipboard.writeText(formatted.replace(/\s/g, ''));
    setCopiedPhoneId(sms.leadId);
    setTimeout(() => setCopiedPhoneId(null), 2000);
    toast({ title: "Skopiowano", description: "Numer telefonu skopiowany" });
  };

  const exportData = () => {
    const selectedSms = generatedSmsList.filter(sms => sms.selected && sms.phone);
    
    if (selectedSms.length === 0) {
      toast({ title: "Błąd", description: "Brak wybranych SMS-ów do eksportu", variant: "destructive" });
      return;
    }

    // Create CSV format for easy import on phone
    const csvContent = selectedSms.map(sms => {
      const phone = formatPhoneNumber(sms.phone).replace(/\s/g, '');
      return `${phone}\t${sms.salonName}\t${sms.message.replace(/\n/g, ' ')}`;
    }).join('\n');

    // Also create a more readable format
    const readableContent = selectedSms.map(sms => {
      const phone = formatPhoneNumber(sms.phone);
      return `📱 ${phone}\n🏪 ${sms.salonName}\n💬 ${sms.message}\n${'─'.repeat(40)}`;
    }).join('\n\n');

    // Create and download file
    const blob = new Blob([readableContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sms_followup_${format(new Date(), 'yyyy-MM-dd')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({ 
      title: "Wyeksportowano", 
      description: `Pobrano ${selectedSms.length} SMS-ów do pliku` 
    });
  };

  const copyAllToClipboard = async () => {
    const selectedSms = generatedSmsList.filter(sms => sms.selected && sms.phone);
    
    if (selectedSms.length === 0) {
      toast({ title: "Błąd", description: "Brak wybranych SMS-ów", variant: "destructive" });
      return;
    }

    const content = selectedSms.map(sms => {
      const phone = formatPhoneNumber(sms.phone);
      return `📱 ${phone}\n🏪 ${sms.salonName}\n💬 ${sms.message}`;
    }).join('\n\n' + '─'.repeat(40) + '\n\n');

    await navigator.clipboard.writeText(content);
    toast({ 
      title: "Skopiowano", 
      description: `Skopiowano ${selectedSms.length} SMS-ów do schowka` 
    });
  };

  const selectedCount = generatedSmsList.filter(sms => sms.selected).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px] max-w-xs">
          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <SelectTrigger>
              <SelectValue placeholder="Wybierz szablon SMS" />
            </SelectTrigger>
            <SelectContent>
              {templates.map(template => (
                <SelectItem key={template.id} value={template.id}>
                  {template.template_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button variant="outline" size="icon" onClick={fetchData}>
          <RefreshCw className="w-4 h-4" />
        </Button>
        
        <Badge variant="secondary" className="gap-1">
          <MessageSquare className="w-3 h-3" />
          {leads.length} na dziś
        </Badge>
      </div>

      {/* Bulk actions */}
      {generatedSmsList.length > 0 && (
        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  Zaznacz wszystkie
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAll}>
                  Odznacz wszystkie
                </Button>
                <span className="text-sm text-muted-foreground">
                  Wybrano: {selectedCount} / {generatedSmsList.length}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={copyAllToClipboard}
                  disabled={selectedCount === 0}
                >
                  <Copy className="w-4 h-4" />
                  Kopiuj wszystkie
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={exportData}
                  disabled={selectedCount === 0}
                >
                  <Download className="w-4 h-4" />
                  Eksportuj
                </Button>
                
                <Button 
                  size="sm" 
                  className="gap-2 bg-green-600 hover:bg-green-700"
                  onClick={markSelectedAsSent}
                  disabled={selectedCount === 0 || markingAsSent}
                >
                  {markingAsSent ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  Oznacz jako wysłane ({selectedCount})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {templates.length === 0 && (
        <Card className="border-dashed border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="p-6 text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-yellow-500 opacity-50" />
            <p className="text-muted-foreground">
              Brak szablonów SMS. Najpierw utwórz szablon w zakładce "Szablony SMS".
            </p>
          </CardContent>
        </Card>
      )}

      {leads.length === 0 && templates.length > 0 && (
        <Card className="border-dashed border-border/50">
          <CardContent className="p-8 text-center">
            <Check className="w-12 h-12 mx-auto mb-4 text-green-500 opacity-50" />
            <p className="text-muted-foreground">
              Brak leadów z SMS follow-up zaplanowanym na dziś.
            </p>
          </CardContent>
        </Card>
      )}

      {/* SMS list */}
      <div className="grid gap-4">
        {generatedSmsList.map(sms => (
          <Card 
            key={sms.leadId} 
            className={`hover:shadow-lg transition-all border-border/50 bg-card/80 ${
              sms.selected ? 'border-green-500/30 ring-1 ring-green-500/20' : ''
            }`}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={sms.selected}
                    onCheckedChange={() => toggleSelection(sms.leadId)}
                    className="mt-1"
                  />
                  <div>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-green-400" />
                      {sms.salonName}
                    </CardTitle>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      {sms.ownerName && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {sms.ownerName}
                        </span>
                      )}
                      {sms.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {sms.city}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {sms.phone ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 border-green-500/30 hover:bg-green-500/10"
                      onClick={() => copyPhone(sms)}
                    >
                      {copiedPhoneId === sms.leadId ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Phone className="w-4 h-4" />
                      )}
                      {formatPhoneNumber(sms.phone)}
                    </Button>
                  ) : (
                    <Badge variant="destructive" className="gap-1">
                      <Phone className="w-3 h-3" />
                      Brak numeru
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={sms.message}
                readOnly
                className="min-h-[100px] bg-muted/30 resize-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {sms.message.length} znaków • {Math.ceil(sms.message.length / 160)} SMS
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => copyMessage(sms)}
                  >
                    {copiedId === sms.leadId ? (
                      <>
                        <Check className="w-4 h-4 text-green-500" />
                        Skopiowano
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Kopiuj
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    className="gap-2 bg-green-600 hover:bg-green-700"
                    onClick={() => markSingleAsSent(sms.leadId)}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Wysłane
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
