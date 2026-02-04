import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, Users, Mail, Building2, ChevronRight, Flame, AlertCircle
} from 'lucide-react';

interface Lead {
  id: string;
  salon_name: string;
  city: string | null;
  priority: string | null;
  status: string;
}

interface QuickActionsCardProps {
  hotLeads: Lead[];
  urgentFollowUps: Lead[];
}

export function QuickActionsCard({ hotLeads, urgentFollowUps }: QuickActionsCardProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      {/* Urgent Follow-ups */}
      <Card className="border-border/50 border-l-4 border-l-amber-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            Pilne follow-upy
            {urgentFollowUps.length > 0 && (
              <Badge variant="secondary" className="ml-auto bg-amber-500/20 text-amber-400 text-[10px]">
                {urgentFollowUps.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {urgentFollowUps.length > 0 ? (
            <div className="space-y-1.5">
              {urgentFollowUps.slice(0, 3).map(lead => (
                <div 
                  key={lead.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-all"
                  onClick={() => navigate(`/leads/${lead.id}`)}
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs font-medium truncate max-w-[120px]">{lead.salon_name}</span>
                  </div>
                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                </div>
              ))}
              {urgentFollowUps.length > 3 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full h-7 text-xs"
                  onClick={() => navigate('/leads')}
                >
                  +{urgentFollowUps.length - 3} więcej
                </Button>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-2">Brak pilnych</p>
          )}
        </CardContent>
      </Card>

      {/* Hot Leads */}
      <Card className="border-border/50 border-l-4 border-l-pink-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Flame className="w-4 h-4 text-pink-400" />
            Hot Leads
            {hotLeads.length > 0 && (
              <Badge variant="secondary" className="ml-auto bg-pink-500/20 text-pink-400 text-[10px]">
                {hotLeads.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {hotLeads.length > 0 ? (
            <div className="space-y-1.5">
              {hotLeads.slice(0, 3).map(lead => (
                <div 
                  key={lead.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-all"
                  onClick={() => navigate(`/leads/${lead.id}`)}
                >
                  <div className="flex items-center gap-2">
                    <Flame className="w-3 h-3 text-pink-400" />
                    <span className="text-xs font-medium truncate max-w-[120px]">{lead.salon_name}</span>
                  </div>
                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-2">Brak hot leadów</p>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Szybkie akcje</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-1.5">
          <Button 
            variant="outline" 
            size="sm"
            className="w-full justify-start h-8 text-xs"
            onClick={() => navigate('/leads')}
          >
            <Eye className="w-3 h-3 mr-2" />
            Wszystkie leady
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="w-full justify-start h-8 text-xs"
            onClick={() => navigate('/clients')}
          >
            <Users className="w-3 h-3 mr-2" />
            Lista klientów
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="w-full justify-start h-8 text-xs"
            onClick={() => navigate('/auto-followups')}
          >
            <Mail className="w-3 h-3 mr-2" />
            Auto follow-upy
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
