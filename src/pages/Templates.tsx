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
import { Plus, Edit, Trash2, Mail, MailOpen, MoreVertical, Copy, Loader2 } from 'lucide-react';
import { emailTemplateSchema } from '@/lib/validationSchemas';

interface EmailTemplate {
  id: string;
  template_name: string;
  subject: string;
  body: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

const emailPlaceholders = [
  { key: '{salon_name}', desc: 'Nazwa salonu' },
  { key: '{owner_name}', desc: 'Imię właściciela' },
  { key: '{city}', desc: 'Miasto' },
  { key: '{email}', desc: 'Email' },
  { key: '{phone}', desc: 'Telefon' },
];

export default function Templates() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('cold-email');
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'cold-email' | 'follow-up-email'>('cold-email');
  const [editingEmailTemplate, setEditingEmailTemplate] = useState<EmailTemplate | null>(null);
  
  const [emailFormData, setEmailFormData] = useState({
    template_name: '',
    subject: '',
    body: ''
  });

  useEffect(() => {
    fetchAllTemplates();
  }, []);

  const fetchAllTemplates = async () => {
    setLoading(true);
    try {
      const [emailRes] = await Promise.all([
        supabase.from('email_templates').select('*').order('template_name'),
      ]);

      setEmailTemplates(emailRes.data || []);
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

  return (
    <AppLayout>
      <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 animate-fade-in w-full max-w-full overflow-hidden">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent mb-2">
            Szablony Wiadomości
          </h1>
          <p className="text-muted-foreground">Zarządzaj szablonami cold maili i follow-upów email</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
            <TabsTrigger value="cold-email" className="gap-2">
              <Mail className="w-4 h-4" />
              Cold Email
            </TabsTrigger>
            <TabsTrigger value="follow-up-email" className="gap-2">
              <MailOpen className="w-4 h-4" />
              Follow-up Email
            </TabsTrigger>
          </TabsList>

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

      </div>
    </AppLayout>
  );
}
