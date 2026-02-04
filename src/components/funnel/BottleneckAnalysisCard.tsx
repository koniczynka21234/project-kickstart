import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, Clock, TrendingDown, ArrowRight
} from 'lucide-react';

interface StageAnalysis {
  stage: string;
  stageLabel: string;
  count: number;
  avgDaysInStage: number;
  dropOffRate: number; // % that go to 'lost' from this stage
}

interface BottleneckAnalysisCardProps {
  stages: StageAnalysis[];
}

export function BottleneckAnalysisCard({ stages }: BottleneckAnalysisCardProps) {
  // Find bottleneck (highest avg days or drop-off)
  const sortedByDays = [...stages].filter(s => s.count > 0).sort((a, b) => b.avgDaysInStage - a.avgDaysInStage);
  const sortedByDropOff = [...stages].filter(s => s.count > 0).sort((a, b) => b.dropOffRate - a.dropOffRate);
  
  const slowestStage = sortedByDays[0];
  const highestDropOff = sortedByDropOff[0];

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          Analiza wąskich gardeł
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Slowest stage */}
        {slowestStage && slowestStage.avgDaysInStage > 0 && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-muted-foreground">Najwolniejszy etap</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">{slowestStage.stageLabel}</span>
              <Badge variant="secondary" className="bg-amber-500/20 text-amber-400">
                śr. {slowestStage.avgDaysInStage} dni
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {slowestStage.count} leadów aktualnie na tym etapie
            </p>
          </div>
        )}

        {/* Highest drop-off */}
        {highestDropOff && highestDropOff.dropOffRate > 0 && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-red-400" />
              <span className="text-xs text-muted-foreground">Największy odpływ</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">{highestDropOff.stageLabel}</span>
              <Badge variant="secondary" className="bg-red-500/20 text-red-400">
                {highestDropOff.dropOffRate}% utraty
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Leady najczęściej tracone po tym etapie
            </p>
          </div>
        )}

        {/* Flow visualization */}
        <div className="pt-3 border-t border-border/50">
          <p className="text-xs text-muted-foreground mb-2">Przepływ przez etapy</p>
          <div className="flex items-center justify-between text-xs">
            {stages.slice(0, 4).map((stage, idx) => (
              <div key={stage.stage} className="flex items-center">
                <div className="text-center">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center mb-1">
                    <span className="font-semibold">{stage.count}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {stage.stageLabel.slice(0, 4)}
                  </span>
                </div>
                {idx < stages.slice(0, 4).length - 1 && (
                  <ArrowRight className="w-3 h-3 text-muted-foreground mx-1" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* No bottlenecks message */}
        {(!slowestStage || slowestStage.avgDaysInStage === 0) && 
         (!highestDropOff || highestDropOff.dropOffRate === 0) && (
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">Brak wystarczających danych</p>
            <p className="text-xs mt-1">Potrzeba więcej historii leadów do analizy</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
