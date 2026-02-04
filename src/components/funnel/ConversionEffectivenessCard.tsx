import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  GraduationCap, Presentation, Mail, TrendingUp, TrendingDown, Minus
} from 'lucide-react';

interface EffectivenessStats {
  name: string;
  icon: 'academy' | 'presentation' | 'email';
  total: number;
  converted: number;
  rate: number;
  color: string;
  bgColor: string;
  borderColor: string;
}

interface ConversionEffectivenessCardProps {
  title: string;
  icon: React.ReactNode;
  stats: EffectivenessStats[];
  emptyMessage: string;
  emptySubMessage?: string;
}

const iconMap = {
  academy: GraduationCap,
  presentation: Presentation,
  email: Mail,
};

export function ConversionEffectivenessCard({ 
  title, 
  icon,
  stats, 
  emptyMessage,
  emptySubMessage
}: ConversionEffectivenessCardProps) {
  const hasData = stats.some(s => s.total > 0);
  
  // Find best performer
  const sortedStats = [...stats].filter(s => s.total > 0).sort((a, b) => b.rate - a.rate);
  const bestPerformer = sortedStats[0];
  const secondBest = sortedStats[1];
  const difference = bestPerformer && secondBest 
    ? bestPerformer.rate - secondBest.rate 
    : 0;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="space-y-3">
            {stats.filter(s => s.total > 0).map((stat, idx) => {
              const IconComponent = iconMap[stat.icon];
              const isBest = bestPerformer && stat.name === bestPerformer.name && sortedStats.length > 1;
              
              return (
                <div 
                  key={stat.name}
                  className={`p-3 rounded-xl border transition-all ${stat.bgColor} ${stat.borderColor} ${
                    isBest ? 'ring-2 ring-offset-2 ring-offset-background ring-green-500/50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <IconComponent className={`w-4 h-4 ${stat.color}`} />
                      <span className="font-medium text-sm">{stat.name}</span>
                      {isBest && (
                        <Badge variant="secondary" className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0">
                          TOP
                        </Badge>
                      )}
                    </div>
                    <span className={`text-xl font-bold ${stat.color}`}>{stat.rate}%</span>
                  </div>
                  <Progress value={stat.rate} className="h-1.5 mb-1.5" />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>{stat.converted} konwersji</span>
                    <span>z {stat.total} leadów</span>
                  </div>
                </div>
              );
            })}

            {/* Comparison indicator */}
            {sortedStats.length >= 2 && difference > 0 && (
              <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-green-500/10 text-green-400 text-xs">
                <TrendingUp className="w-3 h-3" />
                <span>
                  <strong>{bestPerformer?.name}</strong> +{difference}% skuteczniejsze
                </span>
              </div>
            )}
            {sortedStats.length >= 2 && difference === 0 && (
              <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-secondary text-muted-foreground text-xs">
                <Minus className="w-3 h-3" />
                <span>Równa skuteczność</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{emptyMessage}</p>
            {emptySubMessage && <p className="text-xs mt-1">{emptySubMessage}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
