import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, Mail, MapPin, GripVertical, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Lead {
  id: string;
  salon_name: string;
  owner_name: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  priority: string | null;
  industry: string | null;
}

interface LeadsKanbanProps {
  leads: Lead[];
  onLeadClick: (id: string) => void;
  onRefresh: () => void;
}

const statusColumns = [
  { id: 'new', label: 'Nowe', color: 'bg-blue-500' },
  { id: 'contacted', label: 'Skontaktowano', color: 'bg-yellow-500' },
  { id: 'follow_up', label: 'Follow-up', color: 'bg-orange-500' },
  { id: 'rozmowa', label: 'Rozmowa', color: 'bg-purple-500' },
  { id: 'no_response', label: 'Brak odpowiedzi', color: 'bg-zinc-500' },
  { id: 'converted', label: 'Skonwertowany', color: 'bg-green-500' },
  { id: 'lost', label: 'Utracony', color: 'bg-red-500' },
];

const priorityColors: Record<string, string> = {
  low: 'border-zinc-500',
  medium: 'border-blue-500',
  high: 'border-pink-500',
};

export function LeadsKanban({ leads, onLeadClick, onRefresh }: LeadsKanbanProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggingId(leadId);
    e.dataTransfer.setData('leadId', leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId');
    
    if (!leadId || leads.find(l => l.id === leadId)?.status === newStatus) {
      setDraggingId(null);
      return;
    }

    const { error } = await supabase
      .from('leads')
      .update({ status: newStatus })
      .eq('id', leadId);

    if (error) {
      toast.error('Błąd zmiany statusu');
    } else {
      toast.success('Status zmieniony');
      onRefresh();
    }
    
    setDraggingId(null);
  };

  const getLeadsByStatus = (status: string) => {
    return leads.filter(lead => lead.status === status);
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 min-h-[600px] -mx-3 px-3 sm:-mx-0 sm:px-0">
      {statusColumns.map(column => (
        <div
          key={column.id}
          className="flex-shrink-0 w-72"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, column.id)}
        >
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className={`w-3 h-3 rounded-full ${column.color}`} />
            <h3 className="font-medium text-sm text-zinc-200">{column.label}</h3>
            <Badge variant="secondary" className="ml-auto text-xs">
              {getLeadsByStatus(column.id).length}
            </Badge>
          </div>
          
          <div className="bg-zinc-900/50 rounded-xl p-2 min-h-[500px] border border-zinc-800/50">
            <div className="space-y-2">
              {getLeadsByStatus(column.id).map(lead => (
                <Card
                  key={lead.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, lead.id)}
                  onClick={() => onLeadClick(lead.id)}
                  className={`cursor-pointer transition-all hover:scale-[1.02] border-l-4 ${
                    priorityColors[lead.priority || 'medium']
                  } ${draggingId === lead.id ? 'opacity-50 rotate-2' : ''}`}
                >
                  <CardContent className="p-3 bg-zinc-800/50">
                    <div className="flex items-start gap-2">
                      <GripVertical className="w-4 h-4 text-zinc-600 mt-0.5 flex-shrink-0 cursor-grab" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-zinc-100 truncate">
                          {lead.salon_name}
                        </h4>
                        {lead.owner_name && (
                          <p className="text-xs text-zinc-400 truncate">{lead.owner_name}</p>
                        )}
                        
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {lead.city && (
                            <span className="flex items-center gap-1 text-[10px] text-zinc-500">
                              <MapPin className="w-3 h-3" />
                              {lead.city}
                            </span>
                          )}
                          {lead.industry && (
                            <span className="flex items-center gap-1 text-[10px] text-zinc-500">
                              <Building2 className="w-3 h-3" />
                              {lead.industry}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 mt-2">
                          {lead.phone && (
                            <Phone className="w-3 h-3 text-emerald-500" />
                          )}
                          {lead.email && (
                            <Mail className="w-3 h-3 text-blue-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {getLeadsByStatus(column.id).length === 0 && (
                <div className="text-center py-8 text-zinc-600 text-xs">
                  Brak leadów
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
