import { cn } from '@/lib/utils';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Target,
  Users,
  DollarSign,
  BarChart3,
  Settings,
  PlayCircle,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface FunnelStage {
  stage: string;
  objective: string;
  budget: string;
  duration: string;
  kpis: string[];
}

interface ImplementationPlanCardProps {
  stages?: FunnelStage[];
  totalBudget?: string;
  duration?: string;
  className?: string;
}

const defaultSteps = [
  { id: 1, title: 'Utworzenie kampanii w Ads Manager', icon: Settings, time: '5 min' },
  { id: 2, title: 'Konfiguracja Piksela Facebook', icon: Target, time: '10 min' },
  { id: 3, title: 'Setup grup odbiorców', icon: Users, time: '15 min' },
  { id: 4, title: 'Ustawienie budżetu i harmonogramu', icon: DollarSign, time: '5 min' },
  { id: 5, title: 'Wgranie kreacji reklamowych', icon: PlayCircle, time: '20 min' },
  { id: 6, title: 'Przegląd i publikacja', icon: CheckCircle2, time: '10 min' },
];

const stageIcons: Record<string, any> = {
  'awareness': Target,
  'consideration': Users,
  'conversion': TrendingUp,
  'świadomość': Target,
  'rozważanie': Users,
  'konwersja': TrendingUp,
};

function getStageIcon(stageName: string) {
  const lowerName = stageName.toLowerCase();
  for (const [key, icon] of Object.entries(stageIcons)) {
    if (lowerName.includes(key)) return icon;
  }
  return Target;
}

function getStageColor(index: number): string {
  const colors = ['bg-blue-500', 'bg-amber-500', 'bg-green-500', 'bg-purple-500'];
  return colors[index % colors.length];
}

export function ImplementationPlanCard({ 
  stages, 
  totalBudget, 
  duration,
  className 
}: ImplementationPlanCardProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Implementation Steps Checklist */}
      <Card className="border-border/50 bg-gradient-to-br from-card to-primary/5">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Settings className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <span>Plan wdrożenia w Ads Manager</span>
              <p className="text-sm font-normal text-muted-foreground mt-0.5">
                Krok po kroku ~ 65 min
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {defaultSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div 
                  key={step.id}
                  className="flex items-center gap-4 p-3 rounded-xl bg-secondary/30 border border-border/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-foreground font-bold text-sm">
                    {index + 1}
                  </div>
                  <Icon className="w-5 h-5 text-primary shrink-0" />
                  <span className="flex-1 text-foreground text-sm font-medium">{step.title}</span>
                  <Badge variant="outline" className="text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    {step.time}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Funnel Stages with KPIs */}
      {stages && stages.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-success to-success/60 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-success-foreground" />
              </div>
              <div>
                <span>Etapy lejka kampanii</span>
                <p className="text-sm font-normal text-muted-foreground mt-0.5">
                  {totalBudget && `Budżet: ${totalBudget}`} {duration && `• Czas: ${duration}`}
                </p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stages.map((stage, index) => {
                const Icon = getStageIcon(stage.stage);
                const stageColor = getStageColor(index);
                const progress = ((index + 1) / stages.length) * 100;
                
                return (
                  <div 
                    key={index}
                    className="p-4 rounded-xl bg-secondary/30 border border-border/30"
                  >
                    <div className="flex items-start gap-4 mb-3">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white", stageColor)}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-foreground">{stage.stage}</h4>
                          <Badge variant="outline" className="text-xs">
                            {stage.duration}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{stage.objective}</p>
                      </div>
                      <Badge className="bg-primary/20 text-primary border-primary/30">
                        {stage.budget}
                      </Badge>
                    </div>
                    
                    {/* KPIs */}
                    {stage.kpis && stage.kpis.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/30">
                        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          KPIs do monitorowania:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {stage.kpis.map((kpi, kpiIndex) => (
                            <Badge key={kpiIndex} variant="secondary" className="text-xs">
                              {kpi}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Tips */}
      <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground text-sm mb-1">Ważne przed startem</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Sprawdź czy Piksel Facebook jest poprawnie zainstalowany</li>
                <li>• Przygotuj minimum 3-5 wariantów kreacji do testów A/B</li>
                <li>• Upewnij się że strona docelowa ładuje się &lt;3 sekundy</li>
                <li>• Ustaw konwersje niestandardowe dla rezerwacji</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
