import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Globe, TrendingUp, ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react';

interface SourceStats {
  source: string;
  total: number;
  converted: number;
  rate: number;
  avgDays: number;
}

interface SourceEffectivenessTableProps {
  sources: SourceStats[];
  overallRate: number;
}

export function SourceEffectivenessTable({ sources, overallRate }: SourceEffectivenessTableProps) {
  const sortedSources = [...sources].sort((a, b) => b.rate - a.rate);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Globe className="w-5 h-5 text-cyan-400" />
          Skuteczność źródeł leadów
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sortedSources.length > 0 ? (
          <div className="space-y-2">
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground px-2 pb-2 border-b border-border/50">
              <div className="col-span-4">Źródło</div>
              <div className="col-span-2 text-center">Leady</div>
              <div className="col-span-3 text-center">Konwersja</div>
              <div className="col-span-3 text-center">Śr. dni</div>
            </div>
            
            {/* Rows */}
            {sortedSources.map((source, idx) => {
              const diff = source.rate - overallRate;
              const isAboveAvg = diff > 0;
              const isBelowAvg = diff < 0;
              
              return (
                <div 
                  key={source.source}
                  className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg hover:bg-secondary/30 transition-colors"
                >
                  <div className="col-span-4 flex items-center gap-2">
                    {idx === 0 && sortedSources.length > 1 && (
                      <Badge variant="secondary" className="text-[10px] bg-green-500/20 text-green-400 px-1 py-0">
                        #1
                      </Badge>
                    )}
                    <span className="font-medium text-sm truncate">
                      {source.source || 'Nieznane'}
                    </span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="text-sm">{source.total}</span>
                    <span className="text-xs text-muted-foreground ml-1">
                      ({source.converted})
                    </span>
                  </div>
                  <div className="col-span-3">
                    <div className="flex items-center gap-1 justify-center">
                      <span className={`text-sm font-semibold ${
                        isAboveAvg ? 'text-green-400' : isBelowAvg ? 'text-red-400' : ''
                      }`}>
                        {source.rate}%
                      </span>
                      {isAboveAvg && <ArrowUpRight className="w-3 h-3 text-green-400" />}
                      {isBelowAvg && <ArrowDownRight className="w-3 h-3 text-red-400" />}
                    </div>
                  </div>
                  <div className="col-span-3 text-center text-sm text-muted-foreground">
                    {source.avgDays > 0 ? `${source.avgDays} dni` : '-'}
                  </div>
                </div>
              );
            })}

            {/* Average line */}
            <div className="mt-3 pt-3 border-t border-border/50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Średnia konwersja</span>
                <span className="font-semibold">{overallRate}%</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Brak danych o źródłach</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
