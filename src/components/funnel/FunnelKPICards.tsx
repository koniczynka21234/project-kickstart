import { Card, CardContent } from '@/components/ui/card';
import { 
  Users, TrendingUp, CheckCircle, XCircle, Clock, DollarSign 
} from 'lucide-react';

interface KPIData {
  active: number;
  converted: number;
  conversionRate: number;
  avgDays: number;
  pipelineValue: number;
  lost: number;
}

interface FunnelKPICardsProps {
  kpis: KPIData;
}

export function FunnelKPICards({ kpis }: FunnelKPICardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <Card className="border-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{kpis.active}</p>
              <p className="text-xs text-muted-foreground">Aktywne</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 bg-gradient-to-br from-green-500/10 to-green-600/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-400">{kpis.converted}</p>
              <p className="text-xs text-muted-foreground">Konwersje</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 bg-gradient-to-br from-pink-500/10 to-pink-600/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-pink-400">{kpis.conversionRate}%</p>
              <p className="text-xs text-muted-foreground">Konwersja</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 bg-gradient-to-br from-amber-500/10 to-amber-600/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{kpis.avgDays}</p>
              <p className="text-xs text-muted-foreground">Dni śr.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 bg-gradient-to-br from-violet-500/10 to-violet-600/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{Math.round(kpis.pipelineValue / 1000)}k</p>
              <p className="text-xs text-muted-foreground">Pipeline</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 bg-gradient-to-br from-red-500/10 to-red-600/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-400">{kpis.lost}</p>
              <p className="text-xs text-muted-foreground">Utracone</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
