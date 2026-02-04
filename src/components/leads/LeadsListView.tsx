import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Phone, 
  Mail, 
  MapPin, 
  MoreVertical,
  Pencil,
  Trash2,
  UserCheck,
  Building2,
  Instagram,
  Facebook,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';

interface Lead {
  id: string;
  salon_name: string;
  owner_name: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  instagram: string | null;
  facebook_page: string | null;
  status: string;
  priority: string | null;
  source: string | null;
  industry: string | null;
  cold_email_sent: boolean | null;
  sms_follow_up_sent: boolean | null;
  email_follow_up_1_sent: boolean | null;
  email_follow_up_2_sent: boolean | null;
  email_template: string | null;
  response: string | null;
  created_at: string;
}

interface LeadsListViewProps {
  leads: Lead[];
  selectedLeads: Set<string>;
  onSelectLead: (id: string) => void;
  onLeadClick: (id: string) => void;
  onEdit: (lead: Lead) => void;
  onDelete: (id: string) => void;
  onConvert: (lead: Lead) => void;
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  contacted: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  follow_up: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  rozmowa: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  no_response: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
  converted: 'bg-green-500/20 text-green-400 border-green-500/30',
  lost: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const statusLabels: Record<string, string> = {
  new: 'Nowy',
  contacted: 'Skontaktowano',
  follow_up: 'Follow-up',
  rozmowa: 'Rozmowa',
  no_response: 'Brak odpowiedzi',
  converted: 'Skonwertowany',
  lost: 'Utracony',
};

const priorityColors: Record<string, string> = {
  low: 'text-zinc-400',
  medium: 'text-blue-400',
  high: 'text-pink-400',
};

export function LeadsListView({ 
  leads, 
  selectedLeads,
  onSelectLead,
  onLeadClick,
  onEdit,
  onDelete,
  onConvert
}: LeadsListViewProps) {
  if (leads.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Brak leadów do wyświetlenia
      </div>
    );
  }

  const getSequenceProgress = (lead: Lead) => {
    // Don't show sequence for converted or lost leads
    if (lead.status === 'converted' || lead.status === 'lost') {
      return null;
    }
    // Show template name if assigned (even if not sent yet)
    const coldMailLabel = lead.email_template 
      ? lead.email_template.replace('szablon', 'S') 
      : 'CM';
    const steps = [
      { done: lead.cold_email_sent, label: coldMailLabel },
      { done: lead.sms_follow_up_sent, label: 'SMS' },
      { done: lead.email_follow_up_1_sent, label: 'FU1' },
      { done: lead.email_follow_up_2_sent, label: 'FU2' },
    ];
    return steps;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border/50">
            <th className="w-10 p-3 text-left"></th>
            <th className="p-3 text-left text-xs font-medium text-muted-foreground uppercase">Salon</th>
            <th className="p-3 text-left text-xs font-medium text-muted-foreground uppercase">Kontakt</th>
            <th className="p-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
            <th className="p-3 text-left text-xs font-medium text-muted-foreground uppercase">Sekwencja</th>
            <th className="p-3 text-left text-xs font-medium text-muted-foreground uppercase">Social</th>
            <th className="p-3 text-left text-xs font-medium text-muted-foreground uppercase">Data</th>
            <th className="w-10 p-3"></th>
          </tr>
        </thead>
        <tbody>
          {leads.map(lead => {
            const sequenceSteps = getSequenceProgress(lead);
            
            return (
              <tr 
                key={lead.id} 
                className="border-b border-border/30 hover:bg-card/50 transition-colors group"
              >
                {/* Checkbox */}
                <td className="p-3">
                  <Checkbox
                    checked={selectedLeads.has(lead.id)}
                    onCheckedChange={() => onSelectLead(lead.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>

                {/* Salon info */}
                <td 
                  className="p-3 cursor-pointer"
                  onClick={() => onLeadClick(lead.id)}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${priorityColors[lead.priority || 'medium'].replace('text-', 'bg-')}`} />
                      <span className="font-medium text-foreground">{lead.salon_name}</span>
                    </div>
                    {lead.owner_name && (
                      <p className="text-xs text-muted-foreground">{lead.owner_name}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {lead.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {lead.city}
                        </span>
                      )}
                      {lead.industry && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {lead.industry}
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                {/* Contact */}
                <td className="p-3">
                  <div className="space-y-1 text-xs">
                    {lead.phone && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        {lead.phone}
                      </div>
                    )}
                    {lead.email && (
                      <div className="flex items-center gap-1.5 text-muted-foreground truncate max-w-[180px]">
                        <Mail className="w-3 h-3 shrink-0" />
                        {lead.email}
                      </div>
                    )}
                  </div>
                </td>

                {/* Status */}
                <td className="p-3">
                  <div className="flex flex-col gap-1">
                    <Badge className={statusColors[lead.status]}>
                      {statusLabels[lead.status]}
                    </Badge>
                    {lead.response && (
                      <span className="flex items-center gap-1 text-[10px] text-green-400">
                        <CheckCircle2 className="w-3 h-3" />
                        Odpowiedź
                      </span>
                    )}
                  </div>
                </td>

                {/* Sequence */}
                <td className="p-3">
                  {sequenceSteps ? (
                    <div className="flex items-center gap-1">
                      {sequenceSteps.map((step, idx) => (
                        <span 
                          key={idx}
                          className={`text-[10px] px-1.5 py-0.5 rounded ${
                            step.done 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-zinc-800 text-zinc-500'
                          }`}
                        >
                          {step.label}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>

                {/* Social */}
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    {lead.instagram && (
                      <a 
                        href={lead.instagram.startsWith('http') ? lead.instagram : `https://instagram.com/${lead.instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-pink-400 hover:text-pink-300 transition-colors"
                      >
                        <Instagram className="w-4 h-4" />
                      </a>
                    )}
                    {lead.facebook_page && (
                      <a 
                        href={lead.facebook_page.startsWith('http') ? lead.facebook_page : `https://facebook.com/${lead.facebook_page}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <Facebook className="w-4 h-4" />
                      </a>
                    )}
                    {!lead.instagram && !lead.facebook_page && (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>
                </td>

                {/* Date */}
                <td className="p-3">
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(lead.created_at), 'd MMM yyyy', { locale: pl })}
                  </span>
                </td>

                {/* Actions */}
                <td className="p-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(lead)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Edytuj
                      </DropdownMenuItem>
                      {lead.status !== 'converted' && (
                        <DropdownMenuItem 
                          onClick={() => onConvert(lead)}
                          className="text-green-400"
                        >
                          <UserCheck className="w-4 h-4 mr-2" />
                          Konwertuj na klienta
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onDelete(lead.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Usuń
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}