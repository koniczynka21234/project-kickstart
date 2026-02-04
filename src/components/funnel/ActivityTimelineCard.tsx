import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, TrendingUp, TrendingDown, Minus, Calendar
} from 'lucide-react';

interface WeekData {
  weekLabel: string;
  newLeads: number;
  conversions: number;
  lost: number;
}

interface ActivityTimelineCardProps {
  weeklyData: WeekData[];
  currentWeek: {
    newLeads: number;
    conversions: number;
  };
}

export function ActivityTimelineCard({ weeklyData, currentWeek }: ActivityTimelineCardProps) {
  // Calculate trend
  const lastWeek = weeklyData[weeklyData.length - 2];
  const thisWeek = weeklyData[weeklyData.length - 1];
  
  const leadsTrend = lastWeek && thisWeek 
    ? thisWeek.newLeads - lastWeek.newLeads 
    : 0;
  const conversionsTrend = lastWeek && thisWeek 
    ? thisWeek.conversions - lastWeek.conversions 
    : 0;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-400" />
          Aktywność tygodniowa
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Current week highlights */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Nowe leady</span>
              {leadsTrend !== 0 && (
                <Badge 
                  variant="secondary" 
                  className={`text-[10px] px-1 py-0 ${
                    leadsTrend > 0 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {leadsTrend > 0 ? '+' : ''}{leadsTrend}
                </Badge>
              )}
            </div>
            <p className="text-2xl font-bold text-blue-400">+{currentWeek.newLeads}</p>
          </div>
          <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Konwersje</span>
              {conversionsTrend !== 0 && (
                <Badge 
                  variant="secondary" 
                  className={`text-[10px] px-1 py-0 ${
                    conversionsTrend > 0 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {conversionsTrend > 0 ? '+' : ''}{conversionsTrend}
                </Badge>
              )}
            </div>
            <p className="text-2xl font-bold text-green-400">+{currentWeek.conversions}</p>
          </div>
        </div>

        {/* Mini chart / bars */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground mb-2">Ostatnie 4 tygodnie</p>
          {weeklyData.slice(-4).map((week, idx) => {
            const maxLeads = Math.max(...weeklyData.map(w => w.newLeads), 1);
            const barWidth = (week.newLeads / maxLeads) * 100;
            
            return (
              <div key={week.weekLabel} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-12">{week.weekLabel}</span>
                <div className="flex-1 h-6 bg-secondary/30 rounded-full overflow-hidden relative">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all"
                    style={{ width: `${barWidth}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-end pr-2">
                    <span className="text-[10px] font-medium">
                      {week.newLeads} / {week.conversions}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2 mt-3 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-400" />
            <span>Nowe leady</span>
          </div>
          <span>/</span>
          <div className="flex items-center gap-1">
            <span>Konwersje</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
