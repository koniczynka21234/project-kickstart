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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Mail, MailOpen, MoreVertical, Copy, Loader2, AlertCircle } from 'lucide-react';
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

// Fixed follow-up template names that the backend expects
const FOLLOW_UP_TEMPLATES = [
  { value: 'follow_up_1', label: 'Follow-up #1', description: 'Pierwszy follow-up (wysyłany ~3 dni po cold mailu)' },
  { value: 'follow_up_2', label: 'Follow-up #2', description: 'Drugi follow-up (wysyłany ~4 dni po FU1)' },
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

  // For follow-up: which slot are we creating/editing
  const [selectedFollowUpSlot, setSelectedFollowUpSlot] = useState<string>('');

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

  // Check which follow-up slots are already taken
  const existingFollowUpSlots = followUpEmailTemplates.map(t => t.template_name.toLowerCase());
  const hasFollowUp1 = existingFollowUpSlots.includes('follow_up_1');
  const hasFollowUp2 = existingFollowUpSlots.includes('follow_up_2');

  const openEmailDialog = (type: 'cold-email' | 'follow-up-email', template?: EmailTemplate) => {
    setDialogType(type);
    if (template) {
      setEditingEmailTemplate(template);
      setEmailFormData({
        template_name: template.template_name,
        subject: template.subject,
        body: template.body
      });
      // For follow-up editing, set the slot based on template name
      if (type === 'follow-up-email') {
        const slot = template.template_name.toLowerCase();
        setSelectedFollowUpSlot(slot);
      }
    } else {
      setEditingEmailTemplate(null);
      setEmailFormData({ template_name: '', subject: '', body: '' });
      // For new follow-up, pre-select first available slot
      if (type === 'follow-up-email') {
        if (!hasFollowUp1) {
          setSelectedFollowUpSlot('follow_up_1');
        } else if (!hasFollowUp2) {
          setSelectedFollowUpSlot('follow_up_2');
        } else {
          setSelectedFollowUpSlot('');
        }
      }
    }
    setIsDialogOpen(true);
  };


  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // For follow-up, use selected slot as template_name
    const finalTemplateName = dialogType === 'follow-up-email' 
      ? selectedFollowUpSlot 
      : emailFormData.template_name;

    const dataToValidate = {
      ...emailFormData,
      template_name: finalTemplateName
    };

    const validationResult = emailTemplateSchema.safeParse(dataToValidate);
    if (!validationResult.success) {
      toast({
        title: "Błąd walidacji",
        description: validationResult.error.errors[0].message,
        variant: "destructive"
      });
      return;
    }

    // For follow-up: check for duplicates (unless editing the same one)
    if (dialogType === 'follow-up-email' && !editingEmailTemplate) {
      const exists = emailTemplates.some(t => 
        t.template_name.toLowerCase() === selectedFollowUpSlot.toLowerCase()
      );
      if (exists) {
        toast({
          title: "Szablon już istnieje",
          description: `Szablon ${selectedFollowUpSlot} już istnieje. Edytuj istniejący zamiast tworzyć nowy.`,
          variant: "destructive"
        });
        return;
      }
    }

    try {
      if (editingEmailTemplate) {
        const { error } = await supabase
          .from('email_templates')
          .update({
            template_name: finalTemplateName,
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
            template_name: finalTemplateName,
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
      setSelectedFollowUpSlot('');
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

  // Check if all follow-up slots are taken
  const allFollowUpSlotsTaken = hasFollowUp1 && hasFollowUp2;

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
            {/* Info about required templates */}
            <Card className="mb-4 border-amber-500/30 bg-amber-500/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-foreground mb-1">Wymagane szablony dla automatycznych follow-upów:</p>
                    <div className="flex gap-4 text-muted-foreground">
                      <span className={hasFollowUp1 ? 'text-green-400' : 'text-amber-400'}>
                        {hasFollowUp1 ? '✓' : '○'} follow_up_1
                      </span>
                      <span className={hasFollowUp2 ? 'text-green-400' : 'text-amber-400'}>
                        {hasFollowUp2 ? '✓' : '○'} follow_up_2
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end mb-4">
              <Button 
                onClick={() => openEmailDialog('follow-up-email')} 
                className="gap-2 bg-orange-600 hover:bg-orange-700"
                disabled={allFollowUpSlotsTaken}
              >
                <Plus className="h-4 w-4" />
                {allFollowUpSlotsTaken ? 'Wszystkie szablony utworzone' : 'Nowy szablon'}
              </Button>
            </div>
            <div className="grid gap-4">
              {followUpEmailTemplates.length === 0 ? (
                <Card className="p-8 text-center text-muted-foreground border-border/50">
                  <MailOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Brak szablonów follow-up. Utwórz follow_up_1 i follow_up_2.</p>
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
            setSelectedFollowUpSlot('');
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
              {dialogType === 'cold-email' ? (
                <div>
                  <Label htmlFor="template_name">Nazwa szablonu</Label>
                  <Input
                    id="template_name"
                    value={emailFormData.template_name}
                    onChange={(e) => setEmailFormData({ ...emailFormData, template_name: e.target.value })}
                    placeholder="np. cold_mail_beauty"
                    required
                  />
                </div>
              ) : (
                <div>
                  <Label>Typ szablonu follow-up</Label>
                  <Select 
                    value={selectedFollowUpSlot} 
                    onValueChange={setSelectedFollowUpSlot}
                    disabled={!!editingEmailTemplate}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Wybierz typ follow-up" />
                    </SelectTrigger>
                    <SelectContent>
                      {FOLLOW_UP_TEMPLATES.map(fu => {
                        const isExisting = existingFollowUpSlots.includes(fu.value);
                        const isCurrentlyEditing = editingEmailTemplate?.template_name.toLowerCase() === fu.value;
                        const isDisabled = isExisting && !isCurrentlyEditing;
                        
                        return (
                          <SelectItem 
                            key={fu.value} 
                            value={fu.value}
                            disabled={isDisabled}
                          >
                            <div className="flex items-center gap-2">
                              <span>{fu.label}</span>
                              {isExisting && !isCurrentlyEditing && (
                                <span className="text-xs text-muted-foreground">(już istnieje)</span>
                              )}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {selectedFollowUpSlot && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {FOLLOW_UP_TEMPLATES.find(f => f.value === selectedFollowUpSlot)?.description}
                    </p>
                  )}
                </div>
              )}
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
                <Button 
                  type="submit" 
                  className={dialogType === 'follow-up-email' ? 'bg-orange-600 hover:bg-orange-700' : ''}
                  disabled={dialogType === 'follow-up-email' && !selectedFollowUpSlot}
                >
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
