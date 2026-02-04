import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, 
  CreditCard, Clock, CheckCircle2, AlertCircle, Wallet, Receipt
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface RevenueStats {
  // Płatności w danym miesiącu
  paidInvoices: number;
  paidAmount: number;
  pendingInvoices: number;
  pendingAmount: number;
  overdueInvoices: number;
  overdueAmount: number;
  
  // Faktury zaliczkowe
  advanceInvoices: number;
  advanceAmount: number;
  remainingFromAdvances: number;
  
  // Pipeline i prognozy
  pipelineValue: number;
  expectedRevenue: number;
  
  // Porównanie z poprzednim miesiącem
  prevMonthPaid: number;
  prevMonthRevenue: number;
  monthOverMonthChange: number;
  
  // Suma przychodów
  totalMonthRevenue: number;
}

interface MonthlyRevenueSectionProps {
  stats: RevenueStats;
  monthLabel: string;
}

export const MonthlyRevenueSection = ({ stats, monthLabel }: MonthlyRevenueSectionProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const isPositiveChange = stats.monthOverMonthChange >= 0;
  const changePercent = stats.prevMonthRevenue > 0 
    ? Math.abs(Math.round((stats.monthOverMonthChange / stats.prevMonthRevenue) * 100))
    : 0;

  return (
    <div className="space-y-4">
      {/* Main Revenue Header */}
      <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            Podsumowanie finansowe – {monthLabel}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Przychód miesiąca */}
            <div className="bg-background/60 rounded-xl p-4 border border-border/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Przychód miesiąca</span>
                <Wallet className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-emerald-400">
                {formatCurrency(stats.totalMonthRevenue)}
              </p>
              {stats.prevMonthRevenue > 0 && (
                <div className={cn(
                  "flex items-center gap-1 mt-1 text-xs",
                  isPositiveChange ? "text-emerald-400" : "text-red-400"
                )}>
                  {isPositiveChange ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  <span>{changePercent}% vs poprzedni miesiąc</span>
                </div>
              )}
            </div>

            {/* Opłacone faktury */}
            <div className="bg-background/60 rounded-xl p-4 border border-border/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Opłacone</span>
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              </div>
              <p className="text-2xl font-bold text-green-400">
                {formatCurrency(stats.paidAmount)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.paidInvoices} faktur
              </p>
            </div>

            {/* Oczekujące */}
            <div className="bg-background/60 rounded-xl p-4 border border-border/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Oczekujące</span>
                <Clock className="w-4 h-4 text-yellow-400" />
              </div>
              <p className="text-2xl font-bold text-yellow-400">
                {formatCurrency(stats.pendingAmount)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.pendingInvoices} faktur
              </p>
            </div>

            {/* Zaległe */}
            <div className={cn(
              "bg-background/60 rounded-xl p-4 border",
              stats.overdueAmount > 0 ? "border-red-500/30" : "border-border/30"
            )}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Zaległe</span>
                <AlertCircle className={cn("w-4 h-4", stats.overdueAmount > 0 ? "text-red-400" : "text-muted-foreground")} />
              </div>
              <p className={cn(
                "text-2xl font-bold",
                stats.overdueAmount > 0 ? "text-red-400" : "text-muted-foreground"
              )}>
                {formatCurrency(stats.overdueAmount)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.overdueInvoices} faktur
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed breakdown */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Faktury zaliczkowe */}
        <Card className="border-border/50 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Receipt className="w-4 h-4 text-purple-400" />
              Faktury zaliczkowe
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Wystawione zaliczki</span>
              <span className="font-medium text-purple-400">{stats.advanceInvoices}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Wartość zaliczek</span>
              <span className="font-medium text-purple-400">{formatCurrency(stats.advanceAmount)}</span>
            </div>
            <div className="pt-2 border-t border-border/30">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Do wystawienia (końcowe)</span>
                <span className="font-medium text-orange-400">{formatCurrency(stats.remainingFromAdvances)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pipeline i prognozy */}
        <Card className="border-border/50 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              Pipeline i prognozy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Wartość pipeline</span>
              <span className="font-medium text-blue-400">{formatCurrency(stats.pipelineValue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Prognozowany przychód</span>
              <span className="font-medium text-cyan-400">{formatCurrency(stats.expectedRevenue)}</span>
            </div>
            <div className="pt-2 border-t border-border/30">
              <p className="text-xs text-muted-foreground">
                Na podstawie aktywnych leadów i średniej wartości klienta
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Porównanie m/m */}
        <Card className="border-border/50 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              {isPositiveChange ? (
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400" />
              )}
              Porównanie m/m
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Poprzedni miesiąc</span>
              <span className="font-medium text-muted-foreground">{formatCurrency(stats.prevMonthRevenue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Bieżący miesiąc</span>
              <span className="font-medium text-foreground">{formatCurrency(stats.totalMonthRevenue)}</span>
            </div>
            <div className="pt-2 border-t border-border/30">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Zmiana</span>
                <span className={cn(
                  "font-medium flex items-center gap-1",
                  isPositiveChange ? "text-emerald-400" : "text-red-400"
                )}>
                  {isPositiveChange ? "+" : ""}{formatCurrency(stats.monthOverMonthChange)}
                  {isPositiveChange ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
