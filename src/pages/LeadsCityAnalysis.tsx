import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  MapPin, 
  ArrowLeft, 
  Users, 
  UserCheck, 
  UserX, 
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Building2,
  Search,
  ArrowUpRight,
  Target,
  Loader2,
  BarChart3,
  Star,
  Zap
} from 'lucide-react';

interface Lead {
  id: string;
  salon_name: string;
  owner_name: string | null;
  city: string | null;
  status: string;
  priority: string | null;
  industry: string | null;
  cold_email_sent: boolean | null;
  sms_follow_up_sent: boolean | null;
  email_follow_up_1_sent: boolean | null;
  email_follow_up_2_sent: boolean | null;
  response: string | null;
  created_at: string;
  source: string | null;
}

interface CityData {
  city: string;
  total: number;
  newLeads: number;
  contacted: number;
  inConversation: number;
  converted: number;
  lost: number;
  noResponse: number;
  responded: number;
  conversionRate: number;
  responseRate: number;
  lossRate: number;
  potential: 'high' | 'medium' | 'low';
  potentialScore: number;
  industries: Record<string, number>;
  topIndustry: string | null;
  sources: Record<string, number>;
  sequenceCompletion: number;
  avgSequenceStep: number;
}

type SortKey = 'total' | 'conversionRate' | 'responseRate' | 'potential' | 'city';

export default function LeadsCityAnalysis() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('potential');
  const [expandedCity, setExpandedCity] = useState<string | null>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('leads')
      .select('id, salon_name, owner_name, city, status, priority, industry, cold_email_sent, sms_follow_up_sent, email_follow_up_1_sent, email_follow_up_2_sent, response, created_at, source')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Błąd ładowania danych');
    } else {
      setLeads((data as Lead[]) || []);
    }
    setLoading(false);
  };

  const cityData = useMemo(() => {
    const cityMap = new Map<string, Lead[]>();
    leads.forEach(lead => {
      const city = lead.city?.trim() || 'Nieznane';
      if (!cityMap.has(city)) cityMap.set(city, []);
      cityMap.get(city)!.push(lead);
    });

    const data: CityData[] = Array.from(cityMap.entries()).map(([city, cityLeads]) => {
      const converted = cityLeads.filter(l => l.status === 'converted').length;
      const lost = cityLeads.filter(l => l.status === 'lost').length;
      const responded = cityLeads.filter(l => !!l.response).length;
      const newLeads = cityLeads.filter(l => l.status === 'new').length;
      const contacted = cityLeads.filter(l => l.status === 'contacted').length;
      const inConversation = cityLeads.filter(l => l.status === 'rozmowa').length;
      const noResponse = cityLeads.filter(l => l.status === 'no_response').length;
      const finished = converted + lost;

      const industries: Record<string, number> = {};
      cityLeads.forEach(l => {
        if (l.industry) industries[l.industry] = (industries[l.industry] || 0) + 1;
      });
      const topIndustry = Object.entries(industries).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

      const sources: Record<string, number> = {};
      cityLeads.forEach(l => {
        if (l.source) sources[l.source] = (sources[l.source] || 0) + 1;
      });

      // Sequence completion
      let totalSteps = 0;
      let completedSteps = 0;
      cityLeads.forEach(l => {
        if (l.status !== 'converted' && l.status !== 'lost') {
          totalSteps += 4;
          if (l.cold_email_sent) completedSteps++;
          if (l.sms_follow_up_sent) completedSteps++;
          if (l.email_follow_up_1_sent) completedSteps++;
          if (l.email_follow_up_2_sent) completedSteps++;
        }
      });

      const conversionRate = finished > 0 ? (converted / finished) * 100 : 0;
      const responseRate = cityLeads.length > 0 ? (responded / cityLeads.length) * 100 : 0;
      const lossRate = finished > 0 ? (lost / finished) * 100 : 0;

      // Potential scoring: high response + active leads + good conversion = high potential
      let potentialScore = 0;
      potentialScore += responseRate * 0.3;
      potentialScore += conversionRate * 0.25;
      potentialScore += (newLeads + contacted + inConversation) * 5; // active pipeline
      potentialScore += cityLeads.length * 2; // market size
      potentialScore -= lossRate * 0.15;

      const potential: 'high' | 'medium' | 'low' = 
        potentialScore >= 40 ? 'high' : potentialScore >= 15 ? 'medium' : 'low';

      return {
        city,
        total: cityLeads.length,
        newLeads,
        contacted,
        inConversation,
        converted,
        lost,
        noResponse,
        responded,
        conversionRate,
        responseRate,
        lossRate,
        potential,
        potentialScore,
        industries,
        topIndustry,
        sources,
        sequenceCompletion: totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0,
        avgSequenceStep: totalSteps > 0 ? completedSteps / (totalSteps / 4) : 0,
      };
    });

    return data;
  }, [leads]);

  const filtered = useMemo(() => {
    let result = cityData.filter(c => 
      c.city.toLowerCase().includes(search.toLowerCase())
    );

    result.sort((a, b) => {
      switch (sortBy) {
        case 'total': return b.total - a.total;
        case 'conversionRate': return b.conversionRate - a.conversionRate;
        case 'responseRate': return b.responseRate - a.responseRate;
        case 'potential': return b.potentialScore - a.potentialScore;
        case 'city': return a.city.localeCompare(b.city);
        default: return 0;
      }
    });

    return result;
  }, [cityData, search, sortBy]);

  // Global stats
  const globalStats = useMemo(() => {
    const totalLeads = leads.length;
    const converted = leads.filter(l => l.status === 'converted').length;
    const responded = leads.filter(l => !!l.response).length;
    const active = leads.filter(l => !['converted', 'lost'].includes(l.status)).length;
    const cities = new Set(leads.filter(l => l.city?.trim()).map(l => l.city!.trim())).size;
    const highPotential = filtered.filter(c => c.potential === 'high').length;
    return { totalLeads, converted, responded, active, cities, highPotential };
  }, [leads, filtered]);

  const potentialConfig = {
    high: { label: 'Wysoki', color: 'text-green-400', bg: 'bg-green-500/20 border-green-500/30', icon: Star },
    medium: { label: 'Średni', color: 'text-yellow-400', bg: 'bg-yellow-500/20 border-yellow-500/30', icon: Target },
    low: { label: 'Niski', color: 'text-zinc-400', bg: 'bg-zinc-500/20 border-zinc-500/30', icon: TrendingDown },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mobile-page py-4 space-y-6 animate-fade-in w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/leads')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
              <MapPin className="w-6 h-6 text-primary" />
              Analiza miast
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Potencjał sprzedażowy, konwersja i dane per miasto
            </p>
          </div>
        </div>
      </div>

      {/* Global KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Miasta', value: globalStats.cities, icon: MapPin, color: 'text-primary' },
          { label: 'Leady', value: globalStats.totalLeads, icon: Users, color: 'text-blue-400' },
          { label: 'Aktywne', value: globalStats.active, icon: Zap, color: 'text-yellow-400' },
          { label: 'Skonwert.', value: globalStats.converted, icon: UserCheck, color: 'text-green-400' },
          { label: 'Odpowiedzi', value: globalStats.responded, icon: MessageSquare, color: 'text-purple-400' },
          { label: 'Wysoki potencjał', value: globalStats.highPotential, icon: Star, color: 'text-amber-400' },
        ].map(stat => (
          <Card key={stat.label} className="border-border/50 bg-card/80">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                <div>
                  <p className="text-xl font-bold">{stat.value}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Szukaj miasta..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 form-input-elegant"
          />
        </div>
        <Select value={sortBy} onValueChange={(v: SortKey) => setSortBy(v)}>
          <SelectTrigger className="w-[200px] form-input-elegant">
            <BarChart3 className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Sortuj" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="potential">Potencjał</SelectItem>
            <SelectItem value="total">Liczba leadów</SelectItem>
            <SelectItem value="conversionRate">Konwersja</SelectItem>
            <SelectItem value="responseRate">Odpowiedzi</SelectItem>
            <SelectItem value="city">Nazwa A-Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* City Cards */}
      <div className="space-y-3">
        {filtered.map(city => {
          const config = potentialConfig[city.potential];
          const PotentialIcon = config.icon;
          const isExpanded = expandedCity === city.city;

          return (
            <Card 
              key={city.city} 
              className={`border-border/50 bg-card/80 hover:bg-card/95 transition-all overflow-hidden ${
                city.potential === 'high' ? 'ring-1 ring-green-500/20' : ''
              }`}
            >
              <CardContent className="p-0">
                {/* Main row */}
                <div 
                  className="p-4 sm:p-5 cursor-pointer"
                  onClick={() => setExpandedCity(isExpanded ? null : city.city)}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* City name + potential */}
                    <div className="flex items-center gap-3 lg:w-[240px] shrink-0">
                      <div className={`p-2.5 rounded-xl ${city.potential === 'high' ? 'bg-green-500/10' : city.potential === 'medium' ? 'bg-yellow-500/10' : 'bg-zinc-500/10'}`}>
                        <MapPin className={`w-5 h-5 ${config.color}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                          {city.city}
                          <Badge className={`text-[10px] ${config.bg}`}>
                            <PotentialIcon className="w-3 h-3 mr-1" />
                            {config.label}
                          </Badge>
                        </h3>
                        {city.topIndustry && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3 h-3" />
                            {city.topIndustry}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Quick stats */}
                    <div className="flex-1 grid grid-cols-3 sm:grid-cols-6 gap-3 text-sm">
                      <div>
                        <p className="text-[10px] text-muted-foreground">Leady</p>
                        <p className="font-bold text-lg">{city.total}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Aktywne</p>
                        <p className="font-semibold text-yellow-400">{city.newLeads + city.contacted + city.inConversation}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Rozmowy</p>
                        <p className="font-semibold text-purple-400">{city.inConversation}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Konwersja</p>
                        <p className={`font-semibold ${city.conversionRate >= 50 ? 'text-green-400' : city.conversionRate >= 20 ? 'text-yellow-400' : 'text-muted-foreground'}`}>
                          {city.conversionRate.toFixed(0)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Odpowiedzi</p>
                        <p className={`font-semibold ${city.responseRate >= 30 ? 'text-purple-400' : 'text-muted-foreground'}`}>
                          {city.responseRate.toFixed(0)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Skonwert.</p>
                        <p className="font-semibold text-green-400">{city.converted}</p>
                      </div>
                    </div>

                    {/* Conversion bar */}
                    <div className="lg:w-[120px] shrink-0">
                      <Progress value={city.conversionRate} className="h-2" />
                      <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                        <span>{city.converted} ✓</span>
                        <span>{city.lost} ✗</span>
                      </div>
                    </div>

                    <ArrowUpRight className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-border/30 p-4 sm:p-5 bg-secondary/10 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Status breakdown */}
                      <Card className="border-border/30 bg-card/50">
                        <CardHeader className="p-3 pb-2">
                          <CardTitle className="text-xs font-medium text-muted-foreground">Pipeline</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 pt-0 space-y-2">
                          {[
                            { label: 'Nowe', value: city.newLeads, color: 'bg-blue-400' },
                            { label: 'Skontaktowane', value: city.contacted, color: 'bg-yellow-400' },
                            { label: 'Rozmowa', value: city.inConversation, color: 'bg-purple-400' },
                            { label: 'Brak odpowiedzi', value: city.noResponse, color: 'bg-zinc-400' },
                            { label: 'Skonwertowane', value: city.converted, color: 'bg-green-400' },
                            { label: 'Utracone', value: city.lost, color: 'bg-red-400' },
                          ].map(item => (
                            <div key={item.label} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${item.color}`} />
                                <span className="text-muted-foreground">{item.label}</span>
                              </div>
                              <span className="font-medium">{item.value}</span>
                            </div>
                          ))}
                        </CardContent>
                      </Card>

                      {/* Industries */}
                      <Card className="border-border/30 bg-card/50">
                        <CardHeader className="p-3 pb-2">
                          <CardTitle className="text-xs font-medium text-muted-foreground">Branże</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 pt-0 space-y-2">
                          {Object.entries(city.industries)
                            .sort((a, b) => b[1] - a[1])
                            .map(([industry, count]) => (
                              <div key={industry} className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">{industry}</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{count}</span>
                                  <span className="text-muted-foreground/60">
                                    ({((count / city.total) * 100).toFixed(0)}%)
                                  </span>
                                </div>
                              </div>
                            ))}
                          {Object.keys(city.industries).length === 0 && (
                            <p className="text-xs text-muted-foreground/50">Brak danych o branżach</p>
                          )}
                        </CardContent>
                      </Card>

                      {/* Insights */}
                      <Card className="border-border/30 bg-card/50">
                        <CardHeader className="p-3 pb-2">
                          <CardTitle className="text-xs font-medium text-muted-foreground">Wnioski</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 pt-0 space-y-2">
                          <div className="text-xs space-y-2">
                            {(() => {
                              const insights = [];
                              // Conversion insight
                              const convGood = city.conversionRate >= 50;
                              const convMid = city.conversionRate >= 20;
                              const convBad = city.converted === 0 && city.total >= 3;
                              insights.push({
                                icon: TrendingUp,
                                active: convGood || convMid,
                                color: convGood ? 'text-green-400' : convMid ? 'text-yellow-400' : 'text-muted-foreground/40',
                                bg: convGood ? 'bg-green-500/10' : convMid ? 'bg-yellow-500/10' : '',
                                text: convGood 
                                  ? `Świetna konwersja (${city.conversionRate.toFixed(0)}%) — warto zwiększyć zasięg cold maili`
                                  : convMid 
                                    ? `Dobra konwersja (${city.conversionRate.toFixed(0)}%) — utrzymaj tempo follow-upów`
                                    : convBad
                                      ? `Brak konwersji z ${city.total} leadów — rozważ zmianę podejścia`
                                      : `Konwersja ${city.conversionRate.toFixed(0)}% — za mało danych lub trudny rynek`,
                              });
                              // Response insight
                              const respHigh = city.responseRate >= 40;
                              const respMid = city.responseRate >= 15;
                              insights.push({
                                icon: MessageSquare,
                                active: respHigh || respMid,
                                color: respHigh ? 'text-purple-400' : respMid ? 'text-blue-400' : 'text-muted-foreground/40',
                                bg: respHigh ? 'bg-purple-500/10' : respMid ? 'bg-blue-500/10' : '',
                                text: respHigh
                                  ? `Wysoka responsywność (${city.responseRate.toFixed(0)}%) — miasto reaguje dobrze`
                                  : respMid
                                    ? `Średnia responsywność (${city.responseRate.toFixed(0)}%) — testuj nowe szablony`
                                    : `Niska responsywność (${city.responseRate.toFixed(0)}%) — spróbuj innego kanału`,
                              });
                              // Sequence insight  
                              const seqGood = city.sequenceCompletion >= 75;
                              const seqMid = city.sequenceCompletion >= 50;
                              insights.push({
                                icon: Zap,
                                active: seqGood || seqMid,
                                color: seqGood ? 'text-yellow-400' : seqMid ? 'text-orange-400' : 'text-muted-foreground/40',
                                bg: seqGood ? 'bg-yellow-500/10' : seqMid ? 'bg-orange-500/10' : '',
                                text: seqGood
                                  ? `Sekwencja ukończona w ${city.sequenceCompletion.toFixed(0)}% — prawie pełne pokrycie`
                                  : seqMid
                                    ? `Sekwencja w ${city.sequenceCompletion.toFixed(0)}% — część leadów wymaga follow-upów`
                                    : `Sekwencja tylko ${city.sequenceCompletion.toFixed(0)}% — dużo leadów czeka na follow-upy`,
                              });
                              return insights.map((ins, i) => (
                                <div key={i} className={`flex items-start gap-2 p-1.5 rounded-lg transition-colors ${ins.bg}`}>
                                  <ins.icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${ins.color}`} />
                                  <span className={ins.active ? 'text-foreground/80' : 'text-muted-foreground/50'}>
                                    {ins.text}
                                  </span>
                                </div>
                              ));
                            })()}
                          </div>
                          <div className="pt-2 border-t border-border/20">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/leads?city=${encodeURIComponent(city.city)}`);
                              }}
                            >
                              <Users className="w-3.5 h-3.5 mr-1.5" />
                              Zobacz leady z {city.city}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <MapPin className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>Brak miast do wyświetlenia</p>
        </div>
      )}
    </div>
  );
}
