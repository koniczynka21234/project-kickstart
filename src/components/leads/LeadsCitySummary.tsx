import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  MapPin, 
  Users, 
  UserCheck, 
  MessageSquare,
  ArrowUpRight,
  Building2
} from 'lucide-react';

interface Lead {
  id: string;
  salon_name: string;
  owner_name: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  instagram: string | null;
  facebook_page: string | null;
  status: string;
  priority: string | null;
  source: string | null;
  industry: string | null;
  cold_email_sent: boolean | null;
  sms_follow_up_sent: boolean | null;
  email_follow_up_1_sent: boolean | null;
  email_follow_up_2_sent: boolean | null;
  email_template: string | null;
  response: string | null;
  created_at: string;
}

interface CityStats {
  city: string;
  total: number;
  newLeads: number;
  contacted: number;
  converted: number;
  lost: number;
  responded: number;
  conversionRate: number;
  responseRate: number;
  industries: Record<string, number>;
  topIndustry: string | null;
}

interface LeadsCitySummaryProps {
  leads: Lead[];
  onCityClick?: (city: string) => void;
}

export function LeadsCitySummary({ leads, onCityClick }: LeadsCitySummaryProps) {
  const cityStats = useMemo(() => {
    const cityMap = new Map<string, Lead[]>();

    leads.forEach(lead => {
      const city = lead.city?.trim() || 'Nieznane';
      if (!cityMap.has(city)) cityMap.set(city, []);
      cityMap.get(city)!.push(lead);
    });

    const stats: CityStats[] = Array.from(cityMap.entries()).map(([city, cityLeads]) => {
      const converted = cityLeads.filter(l => l.status === 'converted').length;
      const lost = cityLeads.filter(l => l.status === 'lost').length;
      const responded = cityLeads.filter(l => !!l.response).length;
      const newLeads = cityLeads.filter(l => l.status === 'new').length;
      const contacted = cityLeads.filter(l => ['contacted', 'follow_up', 'rozmowa'].includes(l.status)).length;
      const finished = converted + lost;

      const industries: Record<string, number> = {};
      cityLeads.forEach(l => {
        if (l.industry) {
          industries[l.industry] = (industries[l.industry] || 0) + 1;
        }
      });
      const topIndustry = Object.entries(industries).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

      return {
        city,
        total: cityLeads.length,
        newLeads,
        contacted,
        converted,
        lost,
        responded,
        conversionRate: finished > 0 ? (converted / finished) * 100 : 0,
        responseRate: cityLeads.length > 0 ? (responded / cityLeads.length) * 100 : 0,
        industries,
        topIndustry,
      };
    });

    return stats.sort((a, b) => b.total - a.total);
  }, [leads]);

  const totalLeads = leads.length;
  const totalConverted = leads.filter(l => l.status === 'converted').length;
  const totalResponded = leads.filter(l => !!l.response).length;
  const uniqueCities = cityStats.filter(c => c.city !== 'Nieznane').length;

  return (
    <div className="space-y-6">
      {/* Global summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{uniqueCities}</p>
                <p className="text-xs text-muted-foreground">Miast</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalLeads}</p>
                <p className="text-xs text-muted-foreground">Łącznie leadów</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <UserCheck className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-400">{totalConverted}</p>
                <p className="text-xs text-muted-foreground">Skonwertowane</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <MessageSquare className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalResponded}</p>
                <p className="text-xs text-muted-foreground">Z odpowiedzią</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* City cards */}
      <div className="space-y-3">
        {cityStats.map(city => {
          const barWidth = totalLeads > 0 ? (city.total / totalLeads) * 100 : 0;

          return (
            <Card 
              key={city.city} 
              className="border-border/50 bg-card/80 hover:bg-card/95 transition-all cursor-pointer group"
              onClick={() => onCityClick?.(city.city)}
            >
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* City name + top industry */}
                  <div className="flex items-center gap-3 sm:w-[220px] shrink-0">
                    <div className="p-2.5 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        {city.city}
                        <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </h3>
                      {city.topIndustry && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {city.topIndustry}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Leady</p>
                      <p className="font-bold text-lg">{city.total}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Nowe</p>
                      <p className="font-semibold text-blue-400">{city.newLeads}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">W kontakcie</p>
                      <p className="font-semibold text-yellow-400">{city.contacted}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Skonwert.</p>
                      <p className="font-semibold text-green-400">{city.converted}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Utracone</p>
                      <p className="font-semibold text-red-400">{city.lost}</p>
                    </div>
                  </div>

                  {/* Conversion + response rates */}
                  <div className="sm:w-[200px] shrink-0 space-y-2">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Konwersja</span>
                        <span className={`font-medium ${city.conversionRate >= 50 ? 'text-green-400' : city.conversionRate >= 20 ? 'text-yellow-400' : 'text-muted-foreground'}`}>
                          {city.conversionRate.toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={city.conversionRate} className="h-1.5" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Odpowiedzi</span>
                        <span className={`font-medium ${city.responseRate >= 30 ? 'text-purple-400' : 'text-muted-foreground'}`}>
                          {city.responseRate.toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={city.responseRate} className="h-1.5" />
                    </div>
                  </div>

                  {/* Share bar */}
                  <div className="hidden lg:block sm:w-[80px] shrink-0">
                    <p className="text-[10px] text-muted-foreground text-center mb-1">Udział</p>
                    <div className="w-full bg-secondary/30 rounded-full h-2">
                      <div 
                        className="bg-primary/60 h-2 rounded-full transition-all"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center mt-0.5">{barWidth.toFixed(0)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {cityStats.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <MapPin className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>Brak danych o miastach</p>
          <p className="text-sm mt-1">Dodaj miasta do leadów, aby zobaczyć podsumowanie</p>
        </div>
      )}
    </div>
  );
}
