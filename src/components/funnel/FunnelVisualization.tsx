import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target, CheckCircle, XCircle } from 'lucide-react';

interface FunnelStage {
  key: string;
  label: string;
  color: string;
  bgColor: string;
  count: number;
}

interface FunnelVisualizationProps {
  stages: FunnelStage[];
  converted: number;
  lost: number;
}

export function FunnelVisualization({ stages, converted, lost }: FunnelVisualizationProps) {
  const navigate = useNavigate();
  const totalInFunnel = stages.reduce((sum, s) => sum + s.count, 0);

  return (
    <Card className="border-border/50">
      <CardHeader className="border-b border-border/50 pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="w-5 h-5 text-pink-400" />
          Lejek konwersji
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          {stages.map((stage) => {
            const percentage = totalInFunnel > 0 ? Math.round((stage.count / totalInFunnel) * 100) : 0;
            
            return (
              <div 
                key={stage.key}
                className="group cursor-pointer"
                onClick={() => navigate('/leads')}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${stage.bgColor}`} />
                    <span className="text-sm font-medium">{stage.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{percentage}%</span>
                    <span className="text-sm font-bold">{stage.count}</span>
                  </div>
                </div>
                <Progress 
                  value={percentage} 
                  className="h-6 bg-secondary/50"
                />
              </div>
            );
          })}
        </div>

        {/* Conversion Results */}
        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border/50">
          <div 
            className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 cursor-pointer hover:bg-green-500/15 transition-all"
            onClick={() => navigate('/clients')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-sm font-medium">Klienci</p>
                </div>
              </div>
              <span className="text-xl font-bold text-green-400">{converted}</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-400" />
                <div>
                  <p className="text-sm font-medium">Utracone</p>
                </div>
              </div>
              <span className="text-xl font-bold text-red-400">{lost}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
