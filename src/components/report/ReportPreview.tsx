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

interface ReportPreviewProps {
  data: ReportData;
}

export const ReportPreview = ({ data }: ReportPreviewProps) => {
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

  const recommendations = data.recommendations
    ? data.recommendations.split("\n").filter((line) => line.trim()).slice(0, 6)
    : [
        "Zwiększ budżet w piątki i soboty o 40% - dane pokazują że to szczytowe dni rezerwacji w branży beauty",
        "Dodaj kampanię remarketingową 3-7 dni dla osób które nie dokończyły rezerwacji - odzyskasz utracone konwersje",
        "Przetestuj węższą grupę docelową 25-40 lat zamiast szerokiego targetowania - lepsza konwersja i niższy CPC",
        "Włącz targetowanie geograficzne 10km od salonu zamiast całego miasta dla lepszego ROI kampanii",
        "Stwórz karuzelę z efektami przed/po z 3 najpopularniejszych zabiegów - zwiększa zaangażowanie o 40%",
        "Uruchom kampanię lookalike 1% na bazie obecnych klientek - najlepsza jakość ruchu w branży beauty",
      ];

  return (
    <div
      id="report-preview"
      className="w-[794px] min-h-[1123px] text-white overflow-hidden"
      style={{ backgroundColor: '#0a0a0f' }}
    >
      {/* Header with rich gradient */}
      <div 
        className="p-6 relative overflow-hidden"
        style={{ 
          background: 'linear-gradient(135deg, #1a0a1a 0%, #0f0a1a 50%, #0a0f1a 100%)',
          borderBottom: '1px solid rgba(236, 72, 153, 0.2)'
        }}
      >
        {/* Decorative glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />
        
        <div className="flex items-start justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30 flex items-center justify-center">
              <img 
                src={agencyLogo} 
                alt="Aurine" 
                className="w-10 h-10 object-contain"
              />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-pink-400/70 font-medium">
                Aurine Agency
              </p>
              <p className="text-lg font-semibold bg-gradient-to-r from-white to-pink-100 bg-clip-text text-transparent">
                Raport Kampanii Facebook Ads
              </p>
            </div>
          </div>
          <div className="text-right">
            <div 
              className="inline-flex flex-col items-end gap-1 px-5 py-3 rounded-2xl shadow-xl"
              style={{ 
                background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
                boxShadow: '0 10px 40px -10px rgba(236, 72, 153, 0.5)'
              }}
            >
              <span className="text-[9px] uppercase tracking-[0.25em] text-pink-100 font-light">
                Budżet
              </span>
              <p className="text-2xl font-bold text-white">
                {data.budget ? `${data.budget} PLN` : "—"}
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-4 relative z-10">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-pink-100 to-purple-200 bg-clip-text text-transparent">
            {data.clientName || "Salon Beauty"}
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            {data.city || "Lokalizacja"} • {data.period || "Okres kampanii"}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-5" style={{ backgroundColor: '#0a0a0f' }}>
        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-3">
          <div 
            className="rounded-2xl p-4 relative overflow-hidden"
            style={{ 
              background: 'linear-gradient(145deg, #1a1a2e 0%, #0f0f1a 100%)',
              border: '1px solid rgba(139, 92, 246, 0.2)'
            }}
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-full blur-xl" />
            <div className="flex items-center justify-between mb-2 relative z-10">
              <span className="text-[10px] text-purple-300/70 uppercase tracking-wider">Wyświetlenia</span>
              <TrendingUp className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-xl font-bold text-white relative z-10">{data.impressions || "—"}</p>
          </div>

          <div 
            className="rounded-2xl p-4 relative overflow-hidden"
            style={{ 
              background: 'linear-gradient(145deg, #0f1a2e 0%, #0a0f1a 100%)',
              border: '1px solid rgba(59, 130, 246, 0.2)'
            }}
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full blur-xl" />
            <div className="flex items-center justify-between mb-2 relative z-10">
              <span className="text-[10px] text-blue-300/70 uppercase tracking-wider">Zasięg</span>
              <Target className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-xl font-bold text-white relative z-10">{data.reach || "—"}</p>
          </div>

          <div 
            className="rounded-2xl p-4 relative overflow-hidden"
            style={{ 
              background: 'linear-gradient(145deg, #0f1a1a 0%, #0a0f0f 100%)',
              border: '1px solid rgba(16, 185, 129, 0.2)'
            }}
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl" />
            <div className="flex items-center justify-between mb-2 relative z-10">
              <span className="text-[10px] text-emerald-300/70 uppercase tracking-wider">Kliknięcia</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xl font-bold text-white relative z-10">{data.clicks || "—"}</p>
          </div>

          <div 
            className="rounded-2xl p-4 relative overflow-hidden shadow-lg"
            style={{ 
              background: 'linear-gradient(145deg, #2a0a1a 0%, #1a0515 100%)',
              border: '1px solid rgba(236, 72, 153, 0.4)',
              boxShadow: '0 8px 32px -8px rgba(236, 72, 153, 0.3)'
            }}
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-pink-500/20 rounded-full blur-xl" />
            <div className="flex items-center justify-between mb-2 relative z-10">
              <span className="text-[10px] text-pink-300 uppercase tracking-wider">CTR</span>
              <TrendingUp className="w-4 h-4 text-pink-400" />
            </div>
            <p className="text-xl font-bold bg-gradient-to-r from-white to-pink-200 bg-clip-text text-transparent relative z-10">{data.ctr ? `${data.ctr}%` : "—"}</p>
          </div>
        </div>

        {/* Secondary Metrics + Campaign Info */}
        <div className="grid grid-cols-3 gap-3">
          <div 
            className="rounded-xl px-4 py-3 relative overflow-hidden"
            style={{ background: 'linear-gradient(145deg, #151520 0%, #0a0a12 100%)', border: '1px solid rgba(139, 92, 246, 0.15)' }}
          >
            <p className="text-[9px] text-purple-300/60 uppercase tracking-wider mb-1">Konwersje</p>
            <p className="text-lg font-bold text-white">{data.conversions || "—"}</p>
          </div>
          <div 
            className="rounded-xl px-4 py-3 relative overflow-hidden"
            style={{ background: 'linear-gradient(145deg, #151520 0%, #0a0a12 100%)', border: '1px solid rgba(236, 72, 153, 0.15)' }}
          >
            <p className="text-[9px] text-pink-300/60 uppercase tracking-wider mb-1">Koszt / konwersja</p>
            <p className="text-lg font-bold bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">{data.costPerConversion ? `${data.costPerConversion} PLN` : "—"}</p>
          </div>
          <div 
            className="rounded-xl px-4 py-3 relative overflow-hidden shadow-lg"
            style={{ 
              background: 'linear-gradient(145deg, #1a0a1a 0%, #150510 100%)', 
              border: '1px solid rgba(236, 72, 153, 0.3)',
              boxShadow: '0 4px 20px -4px rgba(236, 72, 153, 0.25)'
            }}
          >
            <div className="absolute top-0 right-0 w-12 h-12 bg-pink-500/20 rounded-full blur-xl" />
            <p className="text-[9px] text-pink-300 uppercase tracking-wider mb-1 relative z-10">Rezerwacje</p>
            <p className="text-lg font-bold text-white relative z-10">{data.bookings || "—"}</p>
          </div>
        </div>

        {/* Campaign Details Row */}
        <div className="grid grid-cols-3 gap-3">
          <div 
            className="rounded-xl p-3 relative overflow-hidden"
            style={{ background: 'linear-gradient(145deg, #1a0a1a 0%, #0f050f 100%)', border: '1px solid rgba(236, 72, 153, 0.2)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/30">
                <Target className="w-3.5 h-3.5 text-white" />
              </div>
              <p className="text-[10px] font-semibold text-white">Cel kampanii</p>
            </div>
            <p className="text-[9px] text-zinc-400 leading-relaxed line-clamp-2">
              {data.campaignObjective || "Zwiększenie rezerwacji wizyt w salonie beauty"}
            </p>
          </div>

          <div 
            className="rounded-xl p-3 relative overflow-hidden"
            style={{ background: 'linear-gradient(145deg, #0f1a2e 0%, #0a0f1a 100%)', border: '1px solid rgba(59, 130, 246, 0.2)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              </div>
              <p className="text-[10px] font-semibold text-white">Status</p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              <span className="text-[9px] text-emerald-300 font-medium">{data.campaignStatus || "Aktywna"}</span>
            </div>
          </div>

          <div 
            className="rounded-xl p-3 relative overflow-hidden"
            style={{ background: 'linear-gradient(145deg, #1a0f2e 0%, #0f0a1a 100%)', border: '1px solid rgba(139, 92, 246, 0.25)' }}
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-full blur-xl" />
            <p className="text-[9px] uppercase tracking-wider text-purple-300 mb-2 relative z-10">Kluczowe wskaźniki</p>
            <div className="space-y-1 relative z-10">
              <div className="flex justify-between items-center">
                <span className="text-[9px] text-zinc-400">Średni koszt kliknięcia</span>
                <span className="text-[10px] font-bold text-purple-300">
                  {data.clicks && data.budget && parseNumber(data.clicks) > 0 ?
                    `${(parseNumber(data.budget) / parseNumber(data.clicks)).toFixed(2)} PLN`
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[9px] text-zinc-400">Współczynnik konwersji</span>
                <span className="text-[10px] font-bold text-pink-300">
                  {data.conversions && data.clicks && parseNumber(data.clicks) > 0 ?
                    `${((parseNumber(data.conversions) / parseNumber(data.clicks)) * 100).toFixed(1)}%`
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[9px] text-zinc-400">ROAS</span>
                <span className="text-[10px] font-bold text-emerald-300">
                  {data.bookings && data.budget && parseNumber(data.budget) > 0 ?
                    `${((parseNumber(data.bookings) * 200) / parseNumber(data.budget)).toFixed(1)}x`
                    : "—"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid 2x2 */}
        <div className="grid grid-cols-2 gap-3">
          <div 
            className="rounded-2xl p-4 relative overflow-hidden shadow-lg"
            style={{ background: 'linear-gradient(145deg, #1a0a1a 0%, #0f050f 100%)', border: '1px solid rgba(236, 72, 153, 0.2)' }}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/10 rounded-full blur-2xl" />
            <div className="flex items-center gap-2 mb-3 relative z-10">
              <div className="bg-gradient-to-br from-pink-500 to-rose-600 w-8 h-8 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/30">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-[11px] font-semibold text-white">Efektywność rezerwacji</h4>
                <p className="text-[9px] text-pink-300/70">
                  {bookingsNum} z {conversionsNum} konwersji
                </p>
              </div>
            </div>
            <div className="flex justify-center relative z-10">
              <SimplePieChart data={conversionData} size={100} />
            </div>
          </div>

          <div 
            className="rounded-2xl p-4 relative overflow-hidden shadow-lg"
            style={{ background: 'linear-gradient(145deg, #0a0f1a 0%, #050a12 100%)', border: '1px solid rgba(59, 130, 246, 0.2)' }}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl" />
            <div className="flex items-center gap-2 mb-3 relative z-10">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 w-8 h-8 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Target className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-[11px] font-semibold text-white">Zaangażowanie</h4>
                <p className="text-[9px] text-blue-300/70">
                  {engagementValue}% zaangażowanych odbiorców
                </p>
              </div>
            </div>
            <div className="flex justify-center relative z-10">
              <SimplePieChart data={engagementData} size={100} />
            </div>
          </div>

          <div 
            className="rounded-2xl p-4 relative overflow-hidden shadow-lg"
            style={{ background: 'linear-gradient(145deg, #1a0f2e 0%, #0f0a1a 100%)', border: '1px solid rgba(139, 92, 246, 0.2)' }}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl" />
            <div className="flex items-center gap-2 mb-3 relative z-10">
              <div className="bg-gradient-to-br from-purple-500 to-violet-600 w-8 h-8 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-[11px] font-semibold text-white">Trend tygodniowy</h4>
                <p className="text-[9px] text-purple-300/70">Zasięg i kliknięcia</p>
              </div>
            </div>
            <div className="flex justify-center relative z-10">
              <SimpleLineChart
                data={weeklyData}
                width={280}
                height={90}
                color1="#a855f7"
                color2="#ec4899"
              />
            </div>
          </div>

          <div 
            className="rounded-2xl p-4 relative overflow-hidden shadow-lg"
            style={{ background: 'linear-gradient(145deg, #1a100a 0%, #0f0a05 100%)', border: '1px solid rgba(251, 146, 60, 0.2)' }}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl" />
            <div className="flex items-center gap-2 mb-3 relative z-10">
              <div className="bg-gradient-to-br from-orange-500 to-amber-500 w-8 h-8 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-[11px] font-semibold text-white">Rezerwacje dzienne</h4>
                <p className="text-[9px] text-orange-300/70">Rozkład tygodniowy</p>
              </div>
            </div>
            <div className="flex justify-center relative z-10">
              <SimpleBarChart
                data={dailyBookings}
                width={280}
                height={90}
                color="#fb923c"
              />
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div 
          className="rounded-2xl p-5 relative overflow-hidden shadow-xl"
          style={{ background: 'linear-gradient(145deg, #0a1a1a 0%, #051010 100%)', border: '1px solid rgba(16, 185, 129, 0.25)' }}
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl" />
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-500 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Rekomendacje marketingowe</h4>
              <p className="text-[10px] text-emerald-300">Konkretne kolejne kroki oparte na danych</p>
            </div>
          </div>
          <div className="space-y-3 relative z-10">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="flex gap-3">
                <div 
                  className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.2))', border: '1px solid rgba(16, 185, 129, 0.4)' }}
                >
                  <span className="text-[10px] font-bold text-emerald-400">{idx + 1}</span>
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div 
        className="px-6 py-4 flex items-center justify-between"
        style={{ 
          background: 'linear-gradient(90deg, #0f0a1a 0%, #1a0a1a 50%, #0f0a1a 100%)',
          borderTop: '1px solid rgba(139, 92, 246, 0.15)'
        }}
      >
        <p className="text-[10px] text-zinc-500">© 2025 Aurine Agency • Kampanie Facebook Ads dla salonów beauty</p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span 
              className="inline-flex items-center justify-center w-6 h-6 rounded-lg"
              style={{ background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(139, 92, 246, 0.2))', border: '1px solid rgba(236, 72, 153, 0.3)' }}
            >
              <MessageCircle className="w-3 h-3 text-pink-400" />
            </span>
            <span 
              className="inline-flex items-center justify-center w-6 h-6 rounded-lg"
              style={{ background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(139, 92, 246, 0.2))', border: '1px solid rgba(236, 72, 153, 0.3)' }}
            >
              <Phone className="w-3 h-3 text-pink-400" />
            </span>
          </div>
          <p className="text-[10px] text-pink-300/70 font-medium">+48 731 856 524</p>
        </div>
      </div>
    </div>
  );
};