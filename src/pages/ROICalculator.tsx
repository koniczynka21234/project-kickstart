import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Calculator, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  Users,
  Target,
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function ROICalculator() {
  const [inputs, setInputs] = useState({
    monthlyBudget: 2000,
    avgServiceValue: 200,
    conversionRate: 5,
    cpc: 1.5,
    ctr: 2,
    currentMonthlyClients: 50,
  });

  const results = useMemo(() => {
    const { monthlyBudget, avgServiceValue, conversionRate, cpc, ctr, currentMonthlyClients } = inputs;
    
    // Calculations
    const estimatedClicks = cpc > 0 ? monthlyBudget / cpc : 0;
    const estimatedImpressions = ctr > 0 ? (estimatedClicks / ctr) * 100 : 0;
    const estimatedBookings = (estimatedClicks * conversionRate) / 100;
    const estimatedRevenue = estimatedBookings * avgServiceValue;
    const roas = monthlyBudget > 0 ? estimatedRevenue / monthlyBudget : 0;
    const costPerBooking = estimatedBookings > 0 ? monthlyBudget / estimatedBookings : 0;
    const profit = estimatedRevenue - monthlyBudget;
    const clientGrowth = currentMonthlyClients > 0 ? ((currentMonthlyClients + estimatedBookings) / currentMonthlyClients - 1) * 100 : 0;
    
    // Yearly projections
    const yearlyRevenue = estimatedRevenue * 12;
    const yearlyProfit = profit * 12;
    const yearlyBookings = estimatedBookings * 12;

    return {
      estimatedClicks: Math.round(estimatedClicks),
      estimatedImpressions: Math.round(estimatedImpressions),
      estimatedBookings: Math.round(estimatedBookings * 10) / 10,
      estimatedRevenue: Math.round(estimatedRevenue),
      roas: Math.round(roas * 100) / 100,
      costPerBooking: Math.round(costPerBooking),
      profit: Math.round(profit),
      clientGrowth: Math.round(clientGrowth * 10) / 10,
      yearlyRevenue: Math.round(yearlyRevenue),
      yearlyProfit: Math.round(yearlyProfit),
      yearlyBookings: Math.round(yearlyBookings),
    };
  }, [inputs]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 }).format(value);
  };

  const InfoTooltip = ({ content }: { content: string }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help inline ml-1" />
        </TooltipTrigger>
        <TooltipContent className="max-w-[200px]">
          <p className="text-xs">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <AppLayout>
      <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 animate-fade-in max-w-6xl mx-auto w-full overflow-hidden">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm mb-4">
            <Calculator className="h-4 w-4" />
            Kalkulator ROI
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Oblicz zwrot z inwestycji w Facebook Ads
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Wprowadź parametry swojej kampanii, aby zobaczyć prognozowane wyniki i potencjalny zysk
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Parametry kampanii
              </CardTitle>
              <CardDescription>Dostosuj wartości do swojej sytuacji</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Monthly Budget */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="flex items-center">
                    Miesięczny budżet reklamowy
                    <InfoTooltip content="Kwota, którą planujesz wydać na reklamy Facebook Ads miesięcznie" />
                  </Label>
                  <span className="text-lg font-semibold text-primary">{formatCurrency(inputs.monthlyBudget)}</span>
                </div>
                <Slider
                  value={[inputs.monthlyBudget]}
                  onValueChange={([v]) => setInputs(p => ({ ...p, monthlyBudget: v }))}
                  min={500}
                  max={10000}
                  step={100}
                  className="py-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>500 zł</span>
                  <span>10 000 zł</span>
                </div>
              </div>

              {/* Average Service Value */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="flex items-center">
                    Średnia wartość usługi
                    <InfoTooltip content="Średnia kwota, którą klient wydaje na jedną wizytę" />
                  </Label>
                  <span className="text-lg font-semibold text-primary">{formatCurrency(inputs.avgServiceValue)}</span>
                </div>
                <Slider
                  value={[inputs.avgServiceValue]}
                  onValueChange={([v]) => setInputs(p => ({ ...p, avgServiceValue: v }))}
                  min={50}
                  max={1000}
                  step={10}
                  className="py-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>50 zł</span>
                  <span>1 000 zł</span>
                </div>
              </div>

              {/* Conversion Rate */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="flex items-center">
                    Współczynnik konwersji
                    <InfoTooltip content="Procent osób, które klikają reklamę i dokonują rezerwacji" />
                  </Label>
                  <span className="text-lg font-semibold text-primary">{inputs.conversionRate}%</span>
                </div>
                <Slider
                  value={[inputs.conversionRate]}
                  onValueChange={([v]) => setInputs(p => ({ ...p, conversionRate: v }))}
                  min={1}
                  max={20}
                  step={0.5}
                  className="py-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1%</span>
                  <span>20%</span>
                </div>
              </div>

              {/* CPC */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="flex items-center">
                    Koszt za kliknięcie (CPC)
                    <InfoTooltip content="Średni koszt jednego kliknięcia w reklamę" />
                  </Label>
                  <span className="text-lg font-semibold text-primary">{inputs.cpc.toFixed(2)} zł</span>
                </div>
                <Slider
                  value={[inputs.cpc]}
                  onValueChange={([v]) => setInputs(p => ({ ...p, cpc: v }))}
                  min={0.5}
                  max={5}
                  step={0.1}
                  className="py-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0,50 zł</span>
                  <span>5 zł</span>
                </div>
              </div>

              {/* Current Clients */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="flex items-center">
                    Obecna liczba klientów/mies.
                    <InfoTooltip content="Ilu klientów obsługujesz miesięcznie bez reklam" />
                  </Label>
                  <span className="text-lg font-semibold text-primary">{inputs.currentMonthlyClients}</span>
                </div>
                <Slider
                  value={[inputs.currentMonthlyClients]}
                  onValueChange={([v]) => setInputs(p => ({ ...p, currentMonthlyClients: v }))}
                  min={10}
                  max={200}
                  step={5}
                  className="py-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>10</span>
                  <span>200</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Panel */}
          <div className="space-y-4">
            {/* Main Results */}
            <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Prognozowane wyniki miesięczne
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-background/80 border border-border/50">
                    <p className="text-sm text-muted-foreground mb-1">Przychód</p>
                    <p className="text-2xl font-bold text-emerald-400">{formatCurrency(results.estimatedRevenue)}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-background/80 border border-border/50">
                    <p className="text-sm text-muted-foreground mb-1">Zysk netto</p>
                    <p className={`text-2xl font-bold ${results.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatCurrency(results.profit)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-4 py-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Inwestycja</p>
                    <p className="text-xl font-semibold text-foreground">{formatCurrency(inputs.monthlyBudget)}</p>
                  </div>
                  <ArrowRight className="h-6 w-6 text-primary" />
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">ROAS</p>
                    <p className={`text-3xl font-bold ${results.roas >= 3 ? 'text-emerald-400' : results.roas >= 1 ? 'text-amber-400' : 'text-red-400'}`}>
                      {results.roas}x
                    </p>
                  </div>
                  <ArrowRight className="h-6 w-6 text-primary" />
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Przychód</p>
                    <p className="text-xl font-semibold text-foreground">{formatCurrency(results.estimatedRevenue)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-secondary/30 text-center">
                    <Calendar className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                    <p className="text-lg font-semibold">{results.estimatedBookings}</p>
                    <p className="text-xs text-muted-foreground">Rezerwacji</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/30 text-center">
                    <DollarSign className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                    <p className="text-lg font-semibold">{formatCurrency(results.costPerBooking)}</p>
                    <p className="text-xs text-muted-foreground">Koszt/rezerwację</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/30 text-center">
                    <Users className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                    <p className="text-lg font-semibold text-emerald-400">+{results.clientGrowth}%</p>
                    <p className="text-xs text-muted-foreground">Wzrost klientów</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Yearly Projection */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Projekcja roczna
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-2xl font-bold text-emerald-400">{formatCurrency(results.yearlyRevenue)}</p>
                    <p className="text-sm text-muted-foreground">Przychód roczny</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-2xl font-bold text-primary">{formatCurrency(results.yearlyProfit)}</p>
                    <p className="text-sm text-muted-foreground">Zysk roczny</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <p className="text-2xl font-bold text-blue-400">{results.yearlyBookings}</p>
                    <p className="text-sm text-muted-foreground">Rezerwacji/rok</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Stats */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Szacowane kliknięcia:</span>
                    <span className="font-medium">{results.estimatedClicks.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Szacowane wyświetlenia:</span>
                    <span className="font-medium">{results.estimatedImpressions.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CTA */}
            <Card className="bg-gradient-to-r from-primary/20 to-accent/20 border-primary/30">
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-semibold mb-2">Chcesz osiągnąć takie wyniki?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Skontaktuj się z nami, a pomożemy Ci uruchomić skuteczną kampanię reklamową
                </p>
                <Button className="bg-primary hover:bg-primary/90">
                  Umów bezpłatną konsultację
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
