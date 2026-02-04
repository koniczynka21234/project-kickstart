import { TrendingUp, Target, CheckCircle2, Sparkles, Phone, MessageCircle } from "lucide-react";
import { SimplePieChart, SimpleBarChart, SimpleLineChart } from "./SimpleCharts";
import agencyLogo from "@/assets/agency-logo.png";

interface ReportData {
  clientName?: string;
  city?: string;
  period?: string;
  budget?: string;
  impressions?: string;
  reach?: string;
  clicks?: string;
  ctr?: string;
  conversions?: string;
  costPerConversion?: string;
  bookings?: string;
  campaignObjective?: string;
  campaignStatus?: string;
  engagementRate?: string;
  weeklyReachData?: string;
  weeklyClicksData?: string;
  dailyBookingsData?: string;
  recommendations?: string;
}

interface ReportPreviewLandscapeProps {
  data: ReportData;
}

export const ReportPreviewLandscape = ({ data }: ReportPreviewLandscapeProps) => {
  const parseNumber = (str?: string): number => {
    if (!str) return 0;
    return parseFloat(str.replace(/,/g, "").replace(/\s/g, ""));
  };

  const engagementValue = data.engagementRate ? parseNumber(data.engagementRate) : 23;
  const engagementData = [
    { name: "Zaangażowani", value: engagementValue, color: "#3b82f6" },
    { name: "Pozostali", value: 100 - engagementValue, color: "#27272a" },
  ];

  const bookingsNum = parseNumber(data.bookings) || 33;
  const conversionsNum = parseNumber(data.conversions) || 50;
  // Cap at 100% to handle edge cases where bookings > conversions
  const conversionPercentage = conversionsNum > 0 ? Math.min((bookingsNum / conversionsNum) * 100, 100) : 66;
  const conversionData = [
    { name: "Rezerwacje", value: conversionPercentage, color: "#ec4899" },
    { name: "Pozostałe", value: 100 - conversionPercentage, color: "#27272a" },
  ];

  // Generate weekly trend data from total reach and clicks
  const generateWeeklyData = () => {
    if (data.weeklyReachData && data.weeklyClicksData) {
      return data.weeklyReachData.split(",").map((reach, i) => ({
        label: `T${i + 1}`,
        value1: parseNumber(reach),
        value2: parseNumber(data.weeklyClicksData!.split(",")[i] || "0"),
      }));
    }
    
    const totalReach = parseNumber(data.reach);
    const totalClicks = parseNumber(data.clicks);
    
    if (totalReach === 0 && totalClicks === 0) {
      return [
        { label: "T1", value1: 0, value2: 0 },
        { label: "T2", value1: 0, value2: 0 },
        { label: "T3", value1: 0, value2: 0 },
        { label: "T4", value1: 0, value2: 0 },
      ];
    }
    
    // Distribute with realistic variation pattern (gradual growth)
    const reachDistribution = [0.18, 0.23, 0.28, 0.31];
    const clicksDistribution = [0.20, 0.24, 0.27, 0.29];
    
    return [
      { label: "T1", value1: Math.round(totalReach * reachDistribution[0]), value2: Math.round(totalClicks * clicksDistribution[0]) },
      { label: "T2", value1: Math.round(totalReach * reachDistribution[1]), value2: Math.round(totalClicks * clicksDistribution[1]) },
      { label: "T3", value1: Math.round(totalReach * reachDistribution[2]), value2: Math.round(totalClicks * clicksDistribution[2]) },
      { label: "T4", value1: Math.round(totalReach * reachDistribution[3]), value2: Math.round(totalClicks * clicksDistribution[3]) },
    ];
  };
  
  const weeklyData = generateWeeklyData();

  const dailyBookings = data.dailyBookingsData
    ? data.dailyBookingsData.split(",").map((val, i) => ({
        label: ["Pn", "Wt", "Śr", "Cz", "Pt", "Sb", "Nd"][i] || `D${i + 1}`,
        value: parseNumber(val),
      }))
    : [
        { label: "Pn", value: 3 },
        { label: "Wt", value: 5 },
        { label: "Śr", value: 7 },
        { label: "Cz", value: 6 },
        { label: "Pt", value: 8 },
        { label: "Sb", value: 2 },
        { label: "Nd", value: 2 },
      ];

  return (
    <div
      id="report-preview-landscape"
      className="w-[1600px] h-[900px] bg-black text-white rounded-3xl shadow-2xl overflow-hidden"
      style={{ backgroundColor: '#000000' }}
    >
      <div className="flex h-full">
        {/* Sidebar */}
        <aside className="w-72 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border-r border-pink-900/20 flex flex-col justify-between p-8 shadow-2xl">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <img 
                src={agencyLogo} 
                alt="Aurine" 
                className="w-12 h-12 object-contain"
              />
              <div className="space-y-0.5">
                <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-light">
                  Aurine Agency
                </p>
                <p className="text-base font-semibold text-white">
                  Raport Kampanii
                </p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="pb-3 border-b border-zinc-800/50">
                <p className="font-semibold text-base text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-300">
                  {data.clientName || "Salon Beauty"}
                </p>
                <p className="text-zinc-400 text-xs mt-1">{data.city || "Lokalizacja"}</p>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Okres</span>
                  <span className="text-zinc-300 font-medium">{data.period || "—"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Budżet</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400 font-semibold">
                    {data.budget ? `${data.budget} PLN` : "—"}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-pink-500/10 to-rose-500/10 border border-pink-500/20">
                <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                <span className="text-[10px] uppercase tracking-widest text-pink-300">
                  Facebook Ads
                </span>
              </div>

              <div className="bg-zinc-900/50 rounded-xl p-4 space-y-2 border border-zinc-800/50">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-xs font-semibold text-white">Cel kampanii</p>
                </div>
                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  {data.campaignObjective || "Zwiększenie rezerwacji wizyt w salonie beauty poprzez targetowane kampanie Facebook Ads"}
                </p>
              </div>

              <div className="bg-zinc-900/50 rounded-xl p-4 space-y-2 border border-zinc-800/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-xs font-semibold text-white">Status</p>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                  <span className="text-[9px] text-emerald-300 font-medium">{data.campaignStatus || "Aktywna"}</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-950/30 via-purple-900/20 to-transparent rounded-xl p-4 border border-purple-700/30">
                <p className="text-[9px] uppercase tracking-wider text-purple-300 mb-3">Kluczowe wskaźniki</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-zinc-400">Średni koszt kliknięcia</span>
                    <span className="text-[11px] font-bold text-purple-300">
                      {data.clicks && data.budget && parseNumber(data.clicks) > 0 ?
                        `${(parseNumber(data.budget) / parseNumber(data.clicks)).toFixed(2)} PLN`
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-zinc-400">Współczynnik konwersji</span>
                    <span className="text-[11px] font-bold text-pink-300">
                      {data.conversions && data.clicks && parseNumber(data.clicks) > 0 ?
                        `${((parseNumber(data.conversions) / parseNumber(data.clicks)) * 100).toFixed(1)}%`
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-zinc-400">ROAS</span>
                    <span className="text-[11px] font-bold text-emerald-300">
                      {data.bookings && data.budget && parseNumber(data.budget) > 0 ?
                        `${((parseNumber(data.bookings) * 200) / parseNumber(data.budget)).toFixed(1)}x`
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 text-[10px] text-zinc-600 space-y-0.5">
            <p className="text-zinc-500">Powered by Aurine</p>
            <p className="text-zinc-700">aurine.pl</p>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 h-full bg-black p-6 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="flex items-start justify-between mb-3">
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
                Analytics Dashboard
              </h1>
              <p className="text-sm text-zinc-500 mt-2 max-w-2xl leading-relaxed">
                Kompleksowa analiza wyników kampanii reklamowej dla salonu beauty - kluczowe metryki efektywności i konwersji.
              </p>
            </div>
            <div className="text-right">
              <div className="inline-flex flex-col items-end gap-1 px-5 py-3 rounded-2xl bg-gradient-to-br from-pink-600 to-rose-700 shadow-xl shadow-pink-500/25">
                <span className="text-[10px] uppercase tracking-[0.25em] text-pink-100 font-light">
                  Wizyty
                </span>
                <p className="text-3xl font-bold text-white">
                  {data.bookings || "—"}
                </p>
              </div>
            </div>
          </header>

          {/* KPI Cards */}
          <section className="grid grid-cols-4 gap-4 mb-3">
            <div className="bg-zinc-950 rounded-2xl border border-zinc-800/50 p-5 backdrop-blur">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Wyświetlenia</span>
                <TrendingUp className="w-4 h-4 text-pink-400" />
              </div>
              <p className="text-2xl font-bold text-white mb-1">{data.impressions || "—"}</p>
              <p className="text-[10px] text-zinc-600">Łączna liczba wyświetleń reklam</p>
            </div>

            <div className="bg-zinc-950 rounded-2xl border border-zinc-800/50 p-5 backdrop-blur">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Zasięg</span>
                <Target className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-white mb-1">{data.reach || "—"}</p>
              <p className="text-[10px] text-zinc-600">Unikalne osoby objęte kampanią</p>
            </div>

            <div className="bg-zinc-950 rounded-2xl border border-zinc-800/50 p-5 backdrop-blur">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Kliknięcia</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-white mb-1">{data.clicks || "—"}</p>
              <p className="text-[10px] text-zinc-600">Interakcje z reklamami</p>
            </div>

            <div className="bg-gradient-to-br from-pink-600/20 to-rose-600/20 rounded-2xl border border-pink-500/30 p-5 backdrop-blur shadow-lg shadow-pink-500/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-pink-300 uppercase tracking-wider">CTR</span>
                <TrendingUp className="w-4 h-4 text-pink-300" />
              </div>
              <p className="text-2xl font-bold text-white mb-1">{data.ctr ? `${data.ctr}%` : "—"}</p>
              <p className="text-[10px] text-pink-200/60">Współczynnik klikalności</p>
            </div>
          </section>

          {/* Secondary metrics */}
          <section className="grid grid-cols-3 gap-4 mb-3">
            <div className="bg-zinc-950/50 rounded-xl border border-zinc-800/30 px-5 py-3 backdrop-blur">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Konwersje</p>
              <p className="text-xl font-bold text-white">{data.conversions || "—"}</p>
            </div>
            <div className="bg-zinc-950/50 rounded-xl border border-zinc-800/30 px-5 py-3 backdrop-blur">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Koszt / konwersja</p>
              <p className="text-xl font-bold text-pink-400">{data.costPerConversion ? `${data.costPerConversion} PLN` : "—"}</p>
            </div>
            <div className="bg-zinc-950/50 rounded-xl border border-zinc-800/30 px-5 py-3 backdrop-blur">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Rezerwacje</p>
              <p className="text-xl font-bold text-white">{data.bookings || "—"}</p>
            </div>
          </section>

          {/* Charts and recommendations row */}
          <div className="flex gap-4 flex-1 min-h-0">
            {/* Charts grid 2x2 */}
            <div className="grid grid-cols-2 gap-4 min-h-0 flex-1">
              {/* Left column */}
              <div className="flex flex-col gap-4 min-h-0">
                <div className="bg-gradient-to-br from-pink-950/20 via-zinc-950/50 to-zinc-950/50 rounded-2xl border border-pink-800/20 p-4 flex flex-col flex-1 min-h-0 backdrop-blur shadow-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="bg-gradient-to-br from-pink-500 to-rose-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/30">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Efektywność rezerwacji</h4>
                      <p className="text-[10px] text-pink-300">
                        {bookingsNum} z {conversionsNum} konwersji
                      </p>
                    </div>
                  </div>
                  <div className="flex-1 min-h-0 flex items-center justify-center">
                    <SimplePieChart data={conversionData} size={160} />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-950/20 via-zinc-950/50 to-zinc-950/50 rounded-2xl border border-blue-800/20 p-4 flex flex-col flex-1 min-h-0 backdrop-blur shadow-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Zaangażowanie</h4>
                      <p className="text-[10px] text-blue-300">
                        {engagementValue}% zaangażowanych odbiorców
                      </p>
                    </div>
                  </div>
                  <div className="flex-1 min-h-0 flex items-center justify-center">
                    <SimplePieChart data={engagementData} size={160} />
                  </div>
                </div>
              </div>

              {/* Right column */}
              <div className="flex flex-col gap-4 min-h-0">
                <div className="bg-gradient-to-br from-purple-950/20 via-zinc-950/50 to-zinc-950/50 rounded-2xl border border-purple-800/20 p-4 flex flex-col flex-1 min-h-0 backdrop-blur shadow-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Trend tygodniowy</h4>
                      <p className="text-[10px] text-purple-300">Zasięg i kliknięcia</p>
                    </div>
                  </div>
                  <div className="flex-1 min-h-0 flex items-center justify-center">
                    <SimpleLineChart
                      data={weeklyData}
                      width={350}
                      height={150}
                      color1="#ec4899"
                      color2="#3b82f6"
                    />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-rose-950/20 via-zinc-950/50 to-zinc-950/50 rounded-2xl border border-rose-800/20 p-4 flex flex-col flex-1 min-h-0 backdrop-blur shadow-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="bg-gradient-to-br from-rose-500 to-pink-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/30">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Rezerwacje dzienne</h4>
                      <p className="text-[10px] text-rose-300">Rozkład tygodniowy</p>
                    </div>
                  </div>
                  <div className="flex-1 min-h-0 flex items-center justify-center">
                    <SimpleBarChart
                      data={dailyBookings}
                      width={350}
                      height={150}
                      color="#ec4899"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations panel */}
            <div className="w-[340px] flex-shrink-0 bg-gradient-to-br from-emerald-950/30 via-zinc-950/60 to-zinc-950/50 rounded-2xl border border-emerald-800/30 p-5 flex flex-col backdrop-blur shadow-xl overflow-hidden">
              <div className="flex items-center gap-3 mb-4 flex-shrink-0">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Rekomendacje</h4>
                  <p className="text-[10px] text-emerald-300">Dalsze działania oparte na danych</p>
                </div>
              </div>
              <div className="space-y-3 flex-1 overflow-hidden flex flex-col justify-start">
                {data.recommendations ? (
                  data.recommendations
                    .split("\n")
                    .filter((line) => line.trim())
                    .slice(0, 7)
                    .map((rec, idx) => (
                      <div key={idx} className="flex gap-2">
                        <div className="w-5 h-5 rounded-md bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-[10px] font-bold text-emerald-400">{idx + 1}</span>
                        </div>
                        <p className="text-[11px] text-zinc-200 leading-relaxed">{rec}</p>
                      </div>
                    ))
                ) : (
                  <>
                    <div className="flex gap-2">
                      <div className="w-5 h-5 rounded-md bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-emerald-400">1</span>
                      </div>
                      <p className="text-[11px] text-zinc-200 leading-relaxed">
                        Zwiększ budżet w piątki i soboty o 40% - to szczytowe dni rezerwacji w branży beauty
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-5 h-5 rounded-md bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-emerald-400">2</span>
                      </div>
                      <p className="text-[11px] text-zinc-200 leading-relaxed">
                        Dodaj remarketing 3-7 dni dla osób które nie dokończyły rezerwacji
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-5 h-5 rounded-md bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-emerald-400">3</span>
                      </div>
                      <p className="text-[11px] text-zinc-200 leading-relaxed">
                        Stwórz karuzelę z efektami przed/po z 3 najpopularniejszych zabiegów
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-5 h-5 rounded-md bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-emerald-400">4</span>
                      </div>
                      <p className="text-[11px] text-zinc-200 leading-relaxed">
                        Przetestuj węższą grupę docelową 25-40 lat zamiast szerokiego targetowania
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-5 h-5 rounded-md bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-emerald-400">5</span>
                      </div>
                      <p className="text-[11px] text-zinc-200 leading-relaxed">
                        Włącz targetowanie geograficzne 10km od salonu dla lepszego ROI
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-5 h-5 rounded-md bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-emerald-400">6</span>
                      </div>
                      <p className="text-[11px] text-zinc-200 leading-relaxed">
                        Uruchom kampanię lookalike 1% na bazie obecnych klientek
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-5 h-5 rounded-md bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-emerald-400">7</span>
                      </div>
                      <p className="text-[11px] text-zinc-200 leading-relaxed">
                        Dodaj pilność i limitowane oferty w komunikatach reklamowych
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="border-t border-zinc-900 flex items-center justify-between text-[9px] text-zinc-700 flex-shrink-0 pt-2">
            <p>© 2025 Aurine Agency · Kampanie Facebook ads dla salonów beauty</p>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-pink-500/10 border border-pink-500/40">
                  <MessageCircle className="w-2.5 h-2.5 text-pink-400" />
                </span>
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-pink-500/10 border border-pink-500/40">
                  <Phone className="w-2.5 h-2.5 text-pink-400" />
                </span>
              </div>
              <p className="text-zinc-600">+48 731 856 524</p>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};
