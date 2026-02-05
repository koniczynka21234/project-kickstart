import { cn } from '@/lib/utils';
import { 
  ChevronDown, 
  ChevronRight, 
  MoreHorizontal, 
  Eye,
  MousePointerClick,
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  Target,
  Globe,
  Layers,
  Play,
  CheckCircle2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AdSet {
  name: string;
  audience: string;
  placement: string;
  dailyBudget?: string;
  status?: 'active' | 'paused' | 'draft';
  estimatedReach?: string;
}

interface Campaign {
  name: string;
  objective: string;
  status?: 'active' | 'paused' | 'draft';
  budget: string;
  schedule?: string;
  adSets: AdSet[];
}

interface AdsManagerMockupProps {
  campaign: Campaign;
  className?: string;
}

export function AdsManagerMockup({ campaign, className }: AdsManagerMockupProps) {
  const status = campaign.status || 'draft';
  
  return (
    <div className={cn(
      "bg-card rounded-2xl border border-border/50 shadow-2xl overflow-hidden",
      "hover:shadow-primary/5 transition-shadow duration-300",
      className
    )}>
      {/* Header - Meta Ads Manager style */}
      <div className="px-5 py-4 bg-gradient-to-r from-primary/10 via-card to-accent/5 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25">
            <Target className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-lg">Meta Ads Manager</h3>
            <p className="text-muted-foreground text-sm">Podgląd struktury kampanii</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={cn(
            "px-3 py-1",
            status === 'active' && "bg-success/10 text-success border-success/30",
            status === 'paused' && "bg-amber-500/10 text-amber-500 border-amber-500/30",
            status === 'draft' && "bg-muted text-muted-foreground border-border"
          )}>
            {status === 'active' ? '● Aktywna' : status === 'paused' ? '◐ Wstrzymana' : '○ Wersja robocza'}
          </Badge>
        </div>
      </div>
      
      {/* Campaign level */}
      <div className="border-b border-border/50">
        <div className="px-5 py-4 flex items-center gap-4 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer group">
          <ChevronDown className="w-5 h-5 text-primary transition-transform group-hover:scale-110" />
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
            <Layers className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">{campaign.name}</p>
            <p className="text-muted-foreground text-sm">{campaign.objective}</p>
          </div>
          <div className="flex items-center gap-5 text-sm">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success/10 text-success">
              <DollarSign className="w-4 h-4" />
              <span className="font-semibold">{campaign.budget}</span>
            </div>
            {campaign.schedule && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{campaign.schedule}</span>
              </div>
            )}
          </div>
          <button className="p-2 hover:bg-muted rounded-lg transition-colors">
            <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        
        {/* Ad Sets */}
        <div className="pl-10 bg-muted/20">
          {campaign.adSets.map((adSet, index) => (
            <div key={index} className="border-t border-border/30">
              <div className="px-5 py-4 flex items-center gap-4 hover:bg-muted/30 transition-colors cursor-pointer group">
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-amber-500 transition-colors" />
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500/30 to-amber-500/10 flex items-center justify-center">
                  <Users className="w-4 h-4 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{adSet.name}</p>
                  <p className="text-muted-foreground text-sm truncate">{renderValue(adSet.audience)}</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  {adSet.dailyBudget && (
                    <span className="text-muted-foreground font-medium">{adSet.dailyBudget}/dzień</span>
                  )}
                  {adSet.estimatedReach && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-success/10 text-success">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span className="font-medium">{adSet.estimatedReach}</span>
                    </div>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {renderValue(adSet.placement)}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Stats preview */}
      <div className="p-5 grid grid-cols-4 gap-4">
        {[
          { label: 'Szacowany zasięg', value: '15K-45K', icon: Eye, bgColor: 'bg-primary/10', iconColor: 'text-primary' },
          { label: 'Kliknięcia', value: '~450', icon: MousePointerClick, bgColor: 'bg-amber-500/10', iconColor: 'text-amber-500' },
          { label: 'CTR', value: '~1.2%', icon: TrendingUp, bgColor: 'bg-success/10', iconColor: 'text-success' },
          { label: 'Koszt/klik', value: '~2.50 PLN', icon: DollarSign, bgColor: 'bg-muted', iconColor: 'text-muted-foreground' },
        ].map((stat, i) => (
          <div key={i} className="p-4 rounded-xl bg-muted/30 border border-border/50 text-center hover:bg-muted/50 transition-colors">
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-3", stat.bgColor)}>
              <stat.icon className={cn("w-5 h-5", stat.iconColor)} />
            </div>
            <p className="text-foreground font-bold text-lg">{stat.value}</p>
            <p className="text-muted-foreground text-xs mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>
      
      {/* Footer */}
      <div className="px-5 py-3 bg-muted/30 border-t border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <CheckCircle2 className="w-4 h-4 text-success" />
          <span>Szacowane dane · Wyniki mogą się różnić</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Globe className="w-4 h-4 text-primary" />
          <span className="text-foreground font-medium">Facebook & Instagram</span>
        </div>
      </div>
    </div>
  );
}

// Helper function to safely render values that might be objects
function renderValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object') {
    try {
      return Object.entries(value as Record<string, unknown>)
        .map(([key, val]) => `${key}: ${typeof val === 'object' ? JSON.stringify(val) : val}`)
        .join(', ');
    } catch {
      return JSON.stringify(value);
    }
  }
  return String(value);
}