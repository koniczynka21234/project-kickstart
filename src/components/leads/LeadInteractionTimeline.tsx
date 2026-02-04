import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Mail, 
  MessageSquare, 
  Phone, 
  Calendar, 
  FileText, 
  ArrowRight,
  Plus,
  User,
  Clock,
  Loader2
} from 'lucide-react';

interface Interaction {
  id: string;
  lead_id: string;
  type: string;
  title: string;
  content: string | null;
  old_value: string | null;
  new_value: string | null;
  created_by: string | null;
  created_at: string;
  creator_name?: string;
}

interface LeadInteractionTimelineProps {
  leadId: string;
  onInteractionAdded?: () => void;
}

const interactionTypes = [
  { value: 'cold_email', label: 'Cold email', icon: Mail, color: 'text-blue-400 bg-blue-500/10' },
  { value: 'sms', label: 'SMS', icon: MessageSquare, color: 'text-cyan-400 bg-cyan-500/10' },
  { value: 'email_follow_up_1', label: 'Email FU #1', icon: Mail, color: 'text-orange-400 bg-orange-500/10' },
  { value: 'email_follow_up_2', label: 'Email FU #2', icon: Mail, color: 'text-pink-400 bg-pink-500/10' },
  { value: 'call', label: 'Rozmowa telefoniczna', icon: Phone, color: 'text-green-400 bg-green-500/10' },
  { value: 'meeting', label: 'Spotkanie', icon: Calendar, color: 'text-purple-400 bg-purple-500/10' },
  { value: 'note', label: 'Notatka', icon: FileText, color: 'text-yellow-400 bg-yellow-500/10' },
  { value: 'status_change', label: 'Zmiana statusu', icon: ArrowRight, color: 'text-zinc-400 bg-zinc-500/10' },
  { value: 'response', label: 'Odpowiedź', icon: MessageSquare, color: 'text-emerald-400 bg-emerald-500/10' },
];

const getTypeConfig = (type: string) => {
  return interactionTypes.find(t => t.value === type) || interactionTypes[6]; // Default to 'note'
};

export function LeadInteractionTimeline({ leadId, onInteractionAdded }: LeadInteractionTimelineProps) {
  const { user } = useAuth();
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: 'note',
    title: '',
    content: '',
  });

  useEffect(() => {
    fetchInteractions();
  }, [leadId]);

  const fetchInteractions = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('lead_interactions')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching interactions:', error);
      toast.error('Błąd ładowania historii kontaktów');
    } else {
      // Fetch creator names
      const creatorIds = [...new Set(data?.map(i => i.created_by).filter(Boolean))];
      
      if (creatorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', creatorIds);

        const profileMap = (profiles || []).reduce((acc, p) => {
          acc[p.id] = p.full_name;
          return acc;
        }, {} as Record<string, string>);

        const interactionsWithNames = (data || []).map(i => ({
          ...i,
          creator_name: i.created_by ? profileMap[i.created_by] : null
        }));
        
        setInteractions(interactionsWithNames);
      } else {
        setInteractions(data || []);
      }
    }
    
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Podaj tytuł interakcji');
      return;
    }

    setSubmitting(true);

    const { error } = await supabase
      .from('lead_interactions')
      .insert({
        lead_id: leadId,
        type: formData.type,
        title: formData.title.trim(),
        content: formData.content.trim() || null,
        created_by: user?.id,
      });

    if (error) {
      console.error('Error creating interaction:', error);
      toast.error('Błąd dodawania interakcji');
    } else {
      toast.success('Interakcja dodana');
      setIsDialogOpen(false);
      setFormData({ type: 'note', title: '', content: '' });
      fetchInteractions();
      onInteractionAdded?.();
    }

    setSubmitting(false);
  };

  return (
    <Card className="border-border/50 bg-card/80">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Historia kontaktów
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Dodaj
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nowa interakcja</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Typ</label>
                <Select 
                  value={formData.type} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {interactionTypes.filter(t => t.value !== 'status_change').map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="w-4 h-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Tytuł</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="np. Rozmowa o ofercie"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Szczegóły (opcjonalne)</label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Dodatkowe informacje..."
                  rows={4}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Anuluj
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Dodaj
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : interactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Brak historii kontaktów</p>
            <p className="text-xs mt-1">Kliknij "Dodaj" aby dodać pierwszą interakcję</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border" />
            
            <div className="space-y-4">
              {interactions.map((interaction, index) => {
                const config = getTypeConfig(interaction.type);
                const Icon = config.icon;
                
                return (
                  <div key={interaction.id} className="relative flex gap-4">
                    {/* Icon */}
                    <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center ${config.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{interaction.title}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {config.label}
                        </Badge>
                      </div>
                      
                      {interaction.content && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {interaction.content}
                        </p>
                      )}
                      
                      {interaction.type === 'status_change' && interaction.old_value && interaction.new_value && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <Badge variant="outline" className="text-xs">{interaction.old_value}</Badge>
                          <ArrowRight className="w-3 h-3" />
                          <Badge variant="outline" className="text-xs">{interaction.new_value}</Badge>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(interaction.created_at), 'd MMM yyyy, HH:mm', { locale: pl })}
                        </span>
                        {interaction.creator_name && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {interaction.creator_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
