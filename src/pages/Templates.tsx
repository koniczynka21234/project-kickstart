import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Mail, MessageSquare, MailOpen, MoreVertical, Copy, Loader2, Calendar } from 'lucide-react';
import { emailTemplateSchema } from '@/lib/validationSchemas';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { SmsFollowUpToday } from '@/components/templates/SmsFollowUpToday';

interface EmailTemplate {
  id: string;
  template_name: string;
  subject: string;
  body: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface SmsTemplate {
  id: string;
  template_name: string;
  content: string;
  created_by: string | null;
  created_at: string;
}

const emailPlaceholders = [
  { key: '{salon_name}', desc: 'Nazwa salonu' },
  { key: '{owner_name}', desc: 'Imię właściciela' },
  { key: '{city}', desc: 'Miasto' },
  { key: '{email}', desc: 'Email' },
  { key: '{phone}', desc: 'Telefon' },
];

const smsPlaceholders = [
  { key: '{imie}', desc: 'Imię właściciela' },
  { key: '{salon}', desc: 'Nazwa salonu' },
  { key: '{miasto}', desc: 'Miasto' },
];

export default function Templates() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('sms-today');
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [smsTemplates, setSmsTemplates] = useState<SmsTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'cold-email' | 'follow-up-email' | 'sms'>('cold-email');
  const [editingEmailTemplate, setEditingEmailTemplate] = useState<EmailTemplate | null>(null);
  const [editingSmsTemplate, setEditingSmsTemplate] = useState<SmsTemplate | null>(null);
  
  const [emailFormData, setEmailFormData] = useState({
    template_name: '',
    subject: '',
    body: ''
  });

  const [smsFormData, setSmsFormData] = useState({
    template_name: '',
    content: ''
  });

  useEffect(() => {
    fetchAllTemplates();
  }, []);

  const fetchAllTemplates = async () => {
    setLoading(true);
    try {
      const [emailRes, smsRes] = await Promise.all([
        supabase.from('email_templates').select('*').order('template_name'),
        supabase.from('sms_templates').select('*').order('created_at', { ascending: false })
      ]);

      setEmailTemplates(emailRes.data || []);
      setSmsTemplates(smsRes.data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter email templates by type
  const coldEmailTemplates = emailTemplates.filter(t => 
    !t.template_name.toLowerCase().includes('follow') && 
    !t.template_name.toLowerCase().includes('follow_up')
  );
  
  const followUpEmailTemplates = emailTemplates.filter(t => 
    t.template_name.toLowerCase().includes('follow') || 
    t.template_name.toLowerCase().includes('follow_up')
  );

  const openEmailDialog = (type: 'cold-email' | 'follow-up-email', template?: EmailTemplate) => {
    setDialogType(type);
    if (template) {
      setEditingEmailTemplate(template);
      setEmailFormData({
        template_name: template.template_name,
        subject: template.subject,
        body: template.body
      });
    } else {
      setEditingEmailTemplate(null);
      setEmailFormData({ template_name: '', subject: '', body: '' });
    }
    setIsDialogOpen(true);
  };

  const openSmsDialog = (template?: SmsTemplate) => {
    setDialogType('sms');
    if (template) {
      setEditingSmsTemplate(template);
      setSmsFormData({
        template_name: template.template_name,
        content: template.content
      });
    } else {
      setEditingSmsTemplate(null);
      setSmsFormData({ template_name: '', content: '' });
    }
    setIsDialogOpen(true);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationResult = emailTemplateSchema.safeParse(emailFormData);
    if (!validationResult.success) {
      toast({
        title: "Błąd walidacji",
        description: validationResult.error.errors[0].message,
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingEmailTemplate) {
        const { error } = await supabase
          .from('email_templates')
          .update({
            template_name: emailFormData.template_name,
            subject: emailFormData.subject,
            body: emailFormData.body
          })
          .eq('id', editingEmailTemplate.id);

        if (error) throw error;
        toast({ title: "Sukces", description: "Szablon został zaktualizowany" });
      } else {
        const { error } = await supabase
          .from('email_templates')
          .insert({
            template_name: emailFormData.template_name,
            subject: emailFormData.subject,
            body: emailFormData.body,
            created_by: user?.id
          });

        if (error) throw error;
        toast({ title: "Sukces", description: "Szablon został utworzony" });
      }

      setIsDialogOpen(false);
      setEditingEmailTemplate(null);
      setEmailFormData({ template_name: '', subject: '', body: '' });
      fetchAllTemplates();
    } catch (error) {
      console.error('Error saving email template:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się zapisać szablonu",
        variant: "destructive"
      });
    }
  };

  const handleSmsSubmit = async () => {
    if (!smsFormData.template_name || !smsFormData.content) {
      toast({
        title: "Błąd",
        description: "Wypełnij wszystkie pola",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingSmsTemplate) {
        const { error } = await supabase
          .from('sms_templates')
          .update({
            template_name: smsFormData.template_name,
            content: smsFormData.content
          })
          .eq('id', editingSmsTemplate.id);

        if (error) throw error;
        toast({ title: "Sukces", description: "Szablon SMS zaktualizowany" });
      } else {
        const { error } = await supabase.from('sms_templates').insert({
          template_name: smsFormData.template_name,
          content: smsFormData.content,
          created_by: user?.id
        });

        if (error) throw error;
        toast({ title: "Sukces", description: "Szablon SMS dodany" });
      }

      setIsDialogOpen(false);
      setEditingSmsTemplate(null);
      setSmsFormData({ template_name: '', content: '' });
      fetchAllTemplates();
    } catch (error) {
      console.error('Error saving SMS template:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się zapisać szablonu SMS",
        variant: "destructive"
      });
    }
  };

  const handleDeleteEmail = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten szablon?')) return;

    try {
      const { error } = await supabase.from('email_templates').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Sukces", description: "Szablon usunięty" });
      fetchAllTemplates();
    } catch (error) {
      toast({ title: "Błąd", description: "Nie udało się usunąć szablonu", variant: "destructive" });
    }
  };

  const handleDeleteSms = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten szablon?')) return;

    try {
      const { error } = await supabase.from('sms_templates').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Sukces", description: "Szablon SMS usunięty" });
      fetchAllTemplates();
    } catch (error) {
      toast({ title: "Błąd", description: "Nie udało się usunąć szablonu", variant: "destructive" });
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({ title: "Skopiowano", description: "Treść skopiowana do schowka" });
  };

  const insertEmailPlaceholder = (placeholder: string) => {
    setEmailFormData(prev => ({
      ...prev,
      body: prev.body + placeholder
    }));
  };

  const insertSmsPlaceholder = (placeholder: string) => {
    setSmsFormData(prev => ({
      ...prev,
      content: prev.content + placeholder
    }));
  };

  const charCount = smsFormData.content.length;
  const smsCount = Math.ceil(charCount / 160) || 1;

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const renderEmailTemplateCard = (template: EmailTemplate, type: 'cold-email' | 'follow-up-email') => (
    <Card key={template.id} className="hover:shadow-lg transition-shadow border-border/50 bg-card/80">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {type === 'cold-email' ? (
                <Mail className="h-5 w-5 text-primary" />
              ) : (
                <MailOpen className="h-5 w-5 text-orange-400" />
              )}
              <h3 className="text-lg font-semibold">{template.template_name}</h3>
            </div>
            <p className="text-sm font-medium text-foreground mb-2">
              Temat: {template.subject}
            </p>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {template.body.replace(/<[^>]*>/g, '')}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleCopy(template.body)}>
                <Copy className="w-4 h-4 mr-2" />
                Kopiuj treść
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openEmailDialog(type, template)}>
                <Edit className="w-4 h-4 mr-2" />
                Edytuj
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleDeleteEmail(template.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Usuń
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );

  const renderSmsTemplateCard = (template: SmsTemplate) => (
    <Card key={template.id} className="hover:shadow-lg transition-shadow border-border/50 bg-card/80 hover:border-green-500/30">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-green-400" />
            {template.template_name}
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleCopy(template.content)}>
                <Copy className="w-4 h-4 mr-2" />
                Kopiuj treść
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openSmsDialog(template)}>
                <Edit className="w-4 h-4 mr-2" />
                Edytuj
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleDeleteSms(template.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Usuń
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{template.content}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{template.content.length} znaków</span>
          <span>{format(new Date(template.created_at), 'd MMM yyyy', { locale: pl })}</span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AppLayout>
      <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 animate-fade-in w-full max-w-full overflow-hidden">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent mb-2">
            Szablony Wiadomości
          </h1>
          <p className="text-muted-foreground">
            Zarządzaj szablonami cold maili, follow-upów i SMS
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="sms-today" className="gap-2">
              <Calendar className="w-4 h-4" />
              SMS na dziś
            </TabsTrigger>
            <TabsTrigger value="cold-email" className="gap-2">
              <Mail className="w-4 h-4" />
              Cold Email
            </TabsTrigger>
            <TabsTrigger value="follow-up-email" className="gap-2">
              <MailOpen className="w-4 h-4" />
              Follow-up Email
            </TabsTrigger>
            <TabsTrigger value="sms" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Szablony SMS
            </TabsTrigger>
          </TabsList>

          {/* SMS Today Tab */}
          <TabsContent value="sms-today" className="mt-6">
            <SmsFollowUpToday />
          </TabsContent>

          {/* Cold Email Tab */}
          <TabsContent value="cold-email" className="mt-6">
            <div className="flex justify-end mb-4">
              <Button onClick={() => openEmailDialog('cold-email')} className="gap-2">
                <Plus className="h-4 w-4" />
                Nowy szablon
              </Button>
            </div>
            <div className="grid gap-4">
              {coldEmailTemplates.length === 0 ? (
                <Card className="p-8 text-center text-muted-foreground border-border/50">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Brak szablonów cold maili. Utwórz pierwszy szablon.</p>
                </Card>
              ) : (
                coldEmailTemplates.map(t => renderEmailTemplateCard(t, 'cold-email'))
              )}
            </div>
          </TabsContent>

          {/* Follow-up Email Tab */}
          <TabsContent value="follow-up-email" className="mt-6">
            <div className="flex justify-end mb-4">
              <Button onClick={() => openEmailDialog('follow-up-email')} className="gap-2 bg-orange-600 hover:bg-orange-700">
                <Plus className="h-4 w-4" />
                Nowy szablon
              </Button>
            </div>
            <div className="grid gap-4">
              {followUpEmailTemplates.length === 0 ? (
                <Card className="p-8 text-center text-muted-foreground border-border/50">
                  <MailOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Brak szablonów follow-up. Utwórz pierwszy szablon (nazwa powinna zawierać "follow_up").</p>
                </Card>
              ) : (
                followUpEmailTemplates.map(t => renderEmailTemplateCard(t, 'follow-up-email'))
              )}
            </div>
          </TabsContent>

          {/* SMS Tab */}
          <TabsContent value="sms" className="mt-6">
            <div className="flex justify-end mb-4">
              <Button onClick={() => openSmsDialog()} className="gap-2 bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4" />
                Nowy szablon
              </Button>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {smsTemplates.length === 0 ? (
                <Card className="p-8 text-center text-muted-foreground border-border/50 col-span-full">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Brak szablonów SMS. Utwórz pierwszy szablon.</p>
                </Card>
              ) : (
                smsTemplates.map(t => renderSmsTemplateCard(t))
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Dialog for Email Templates */}
        <Dialog open={isDialogOpen && (dialogType === 'cold-email' || dialogType === 'follow-up-email')} onOpenChange={(open) => {
          if (!open) {
            setIsDialogOpen(false);
            setEditingEmailTemplate(null);
            setEmailFormData({ template_name: '', subject: '', body: '' });
          }
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {dialogType === 'cold-email' ? (
                  <><Mail className="w-5 h-5 text-primary" /> {editingEmailTemplate ? 'Edytuj szablon cold mail' : 'Nowy szablon cold mail'}</>
                ) : (
                  <><MailOpen className="w-5 h-5 text-orange-400" /> {editingEmailTemplate ? 'Edytuj szablon follow-up' : 'Nowy szablon follow-up'}</>
                )}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <Label htmlFor="template_name">Nazwa szablonu</Label>
                <Input
                  id="template_name"
                  value={emailFormData.template_name}
                  onChange={(e) => setEmailFormData({ ...emailFormData, template_name: e.target.value })}
                  placeholder={dialogType === 'follow-up-email' ? "np. follow_up_1" : "np. cold_mail_beauty"}
                  required
                />
                {dialogType === 'follow-up-email' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Dla automatycznych follow-upów użyj: follow_up_1 lub follow_up_2
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="subject">Temat wiadomości</Label>
                <Input
                  id="subject"
                  value={emailFormData.subject}
                  onChange={(e) => setEmailFormData({ ...emailFormData, subject: e.target.value })}
                  placeholder="Temat email"
                  required
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label htmlFor="body">Treść wiadomości (HTML)</Label>
                </div>
                <Textarea
                  id="body"
                  value={emailFormData.body}
                  onChange={(e) => setEmailFormData({ ...emailFormData, body: e.target.value })}
                  placeholder="<p>Cześć {owner_name},</p><p>Treść wiadomości...</p>"
                  rows={10}
                  required
                />
              </div>
              <div>
                <Label className="mb-2 block">Wstaw placeholder</Label>
                <div className="flex flex-wrap gap-2">
                  {emailPlaceholders.map((p) => (
                    <Button
                      key={p.key}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => insertEmailPlaceholder(p.key)}
                      className="text-xs"
                    >
                      {p.key}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Anuluj
                </Button>
                <Button type="submit" className={dialogType === 'follow-up-email' ? 'bg-orange-600 hover:bg-orange-700' : ''}>
                  {editingEmailTemplate ? 'Zapisz zmiany' : 'Utwórz szablon'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog for SMS Templates */}
        <Dialog open={isDialogOpen && dialogType === 'sms'} onOpenChange={(open) => {
          if (!open) {
            setIsDialogOpen(false);
            setEditingSmsTemplate(null);
            setSmsFormData({ template_name: '', content: '' });
          }
        }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-green-400" />
                {editingSmsTemplate ? 'Edytuj szablon SMS' : 'Nowy szablon SMS'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Nazwa szablonu</Label>
                <Input
                  placeholder="np. Follow-up po rozmowie"
                  value={smsFormData.template_name}
                  onChange={(e) => setSmsFormData({ ...smsFormData, template_name: e.target.value })}
                  className="mt-1"
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label>Treść wiadomości</Label>
                  <span className={`text-xs ${charCount > 160 ? 'text-yellow-400' : 'text-muted-foreground'}`}>
                    {charCount}/160 ({smsCount} SMS)
                  </span>
                </div>
                <Textarea
                  placeholder="Cześć {imie}, dziękuję za rozmowę..."
                  value={smsFormData.content}
                  onChange={(e) => setSmsFormData({ ...smsFormData, content: e.target.value })}
                  rows={5}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="mb-2 block">Wstaw placeholder</Label>
                <div className="flex flex-wrap gap-2">
                  {smsPlaceholders.map((p) => (
                    <Button
                      key={p.key}
                      variant="outline"
                      size="sm"
                      onClick={() => insertSmsPlaceholder(p.key)}
                      className="text-xs"
                    >
                      {p.key}
                      <span className="text-muted-foreground ml-1">({p.desc})</span>
                    </Button>
                  ))}
                </div>
              </div>

              {smsFormData.content && (
                <div className="p-3 bg-secondary/50 rounded-lg border border-border/50">
                  <p className="text-xs text-muted-foreground mb-1">Podgląd:</p>
                  <p className="text-sm">{smsFormData.content}</p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Anuluj
                </Button>
                <Button onClick={handleSmsSubmit} className="bg-green-600 hover:bg-green-700">
                  {editingSmsTemplate ? 'Zapisz zmiany' : 'Dodaj szablon'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
