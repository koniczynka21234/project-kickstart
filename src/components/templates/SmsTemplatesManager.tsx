import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { Copy, Edit, Loader2, MessageSquare, MoreVertical, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

interface SmsTemplate {
  id: string;
  template_name: string;
  content: string;
  created_by: string | null;
  created_at: string;
}

const smsPlaceholders = [
  { key: "{imie}", desc: "Imię właściciela" },
  { key: "{salon}", desc: "Nazwa salonu" },
  { key: "{miasto}", desc: "Miasto" },
];

export function SmsTemplatesManager() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SmsTemplate | null>(null);
  const [formData, setFormData] = useState({ template_name: "", content: "" });

  useEffect(() => {
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("sms_templates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error("Error fetching SMS templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (template?: SmsTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({ template_name: template.template_name, content: template.content });
    } else {
      setEditingTemplate(null);
      setFormData({ template_name: "", content: "" });
    }
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Czy na pewno chcesz usunąć ten szablon?")) return;
    try {
      const { error } = await supabase.from("sms_templates").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Sukces", description: "Szablon SMS usunięty" });
      fetchTemplates();
    } catch (error) {
      console.error("Error deleting SMS template:", error);
      toast({ title: "Błąd", description: "Nie udało się usunąć szablonu", variant: "destructive" });
    }
  };

  const handleCopy = async (content: string) => {
    await navigator.clipboard.writeText(content);
    toast({ title: "Skopiowano", description: "Treść skopiowana do schowka" });
  };

  const insertPlaceholder = (placeholder: string) => {
    setFormData((prev) => ({ ...prev, content: prev.content + placeholder }));
  };

  const { charCount, smsCount } = useMemo(() => {
    const count = formData.content.length;
    return { charCount: count, smsCount: Math.ceil(count / 160) || 1 };
  }, [formData.content]);

  const handleSubmit = async () => {
    if (!formData.template_name || !formData.content) {
      toast({ title: "Błąd", description: "Wypełnij wszystkie pola", variant: "destructive" });
      return;
    }

    try {
      if (editingTemplate) {
        const { error } = await supabase
          .from("sms_templates")
          .update({ template_name: formData.template_name, content: formData.content })
          .eq("id", editingTemplate.id);
        if (error) throw error;
        toast({ title: "Sukces", description: "Szablon SMS zaktualizowany" });
      } else {
        const { error } = await supabase.from("sms_templates").insert({
          template_name: formData.template_name,
          content: formData.content,
          created_by: user?.id,
        });
        if (error) throw error;
        toast({ title: "Sukces", description: "Szablon SMS dodany" });
      }

      setIsDialogOpen(false);
      setEditingTemplate(null);
      setFormData({ template_name: "", content: "" });
      fetchTemplates();
    } catch (error) {
      console.error("Error saving SMS template:", error);
      toast({ title: "Błąd", description: "Nie udało się zapisać szablonu SMS", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => openDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Nowy szablon SMS
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground border-border/50 col-span-full">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Brak szablonów SMS. Utwórz pierwszy szablon.</p>
          </Card>
        ) : (
          templates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow border-border/50 bg-card/80">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary" />
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
                      <DropdownMenuItem onClick={() => openDialog(template)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edytuj
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(template.id)}
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
                  <span>{format(new Date(template.created_at), "d MMM yyyy", { locale: pl })}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsDialogOpen(false);
            setEditingTemplate(null);
            setFormData({ template_name: "", content: "" });
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              {editingTemplate ? "Edytuj szablon SMS" : "Nowy szablon SMS"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Nazwa szablonu</Label>
              <Input
                placeholder='np. "Follow-up po rozmowie"'
                value={formData.template_name}
                onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Treść wiadomości</Label>
                <span className={"text-xs text-muted-foreground"}>
                  {charCount}/160 ({smsCount} SMS)
                </span>
              </div>
              <Textarea
                placeholder="Cześć {imie}, dziękuję za rozmowę..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
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
                    onClick={() => insertPlaceholder(p.key)}
                    className="text-xs"
                    type="button"
                  >
                    {p.key}
                    <span className="text-muted-foreground ml-1">({p.desc})</span>
                  </Button>
                ))}
              </div>
            </div>

            {formData.content && (
              <div className="p-3 bg-secondary/50 rounded-lg border border-border/50">
                <p className="text-xs text-muted-foreground mb-1">Podgląd:</p>
                <p className="text-sm">{formData.content}</p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} type="button">
                Anuluj
              </Button>
              <Button onClick={handleSubmit} type="button">
                {editingTemplate ? "Zapisz zmiany" : "Dodaj szablon"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
