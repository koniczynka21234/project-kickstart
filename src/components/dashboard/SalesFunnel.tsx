import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingDown, 
  Users, 
  Mail, 
  MessageSquare, 
  Phone, 
  CheckCircle, 
  XCircle,
  AlertCircle
} from 'lucide-react';

interface FunnelData {
  new: number;
  contacted: number;
  follow_up: number;
  rozmowa: number;
  no_response: number;
  converted: number;
  lost: number;
}

const stages = [
  { key: 'new', label: 'Nowe', icon: Users, color: 'from-blue-500 to-blue-600' },
  { key: 'contacted', label: 'Skontaktowano', icon: Mail, color: 'from-yellow-500 to-yellow-600' },
  { key: 'follow_up', label: 'Follow-up', icon: MessageSquare, color: 'from-orange-500 to-orange-600' },
  { key: 'rozmowa', label: 'Rozmowa', icon: Phone, color: 'from-purple-500 to-purple-600' },
  { key: 'no_response', label: 'Brak odpowiedzi', icon: AlertCircle, color: 'from-zinc-500 to-zinc-600' },
  { key: 'converted', label: 'Skonwertowane', icon: CheckCircle, color: 'from-green-500 to-green-600' },
  { key: 'lost', label: 'Utracone', icon: XCircle, color: 'from-red-500 to-red-600' },
];

export function SalesFunnel() {
  const navigate = useNavigate();
  const [data, setData] = useState<FunnelData>({
    new: 0,
    contacted: 0,
    follow_up: 0,
    rozmowa: 0,
    no_response: 0,
    converted: 0,
    lost: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: leads, error } = await supabase
        .from('leads')
        .select('status');

      if (!error && leads) {
        const counts: FunnelData = {
          new: 0,
          contacted: 0,
          follow_up: 0,
          rozmowa: 0,
          no_response: 0,
          converted: 0,
          lost: 0,
        };

        leads.forEach((lead) => {
          // Map old status to new
          let status = lead.status;
          if (status === 'meeting_scheduled') status = 'rozmowa';
          
          if (status in counts) {
            counts[status as keyof FunnelData]++;
          }
        });

        setData(counts);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const total = data.new + data.contacted + data.follow_up + data.rozmowa + data.no_response;
  const maxCount = Math.max(...Object.values(data), 1);

  if (loading) {
    return (
      <div className="bg-secondary/30 border border-border/50 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-zinc-700 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="h-10 bg-zinc-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div 
      className="bg-secondary/30 border border-border/50 rounded-xl p-3 sm:p-4 cursor-pointer hover:border-primary/30 transition-colors w-full max-w-full overflow-hidden"
      onClick={() => navigate('/funnel')}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-pink-400 shrink-0" />
          <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">Lejek sprzedażowy</h3>
        </div>
        <span className="text-xs sm:text-sm text-muted-foreground shrink-0">
          {total} aktywnych
        </span>
      </div>

      <div className="space-y-2 w-full max-w-full overflow-hidden">
        {stages.map((stage, index) => {
          const count = data[stage.key as keyof FunnelData];
          const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
          const conversionRate = index === 0 
            ? 100 
            : data.new > 0 
              ? Math.round((count / data.new) * 100) 
              : 0;

          return (
            <div key={stage.key} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <stage.icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{stage.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {stage.key !== 'new' && stage.key !== 'converted' && stage.key !== 'lost' && `${conversionRate}%`}
                  </span>
                  <span className="text-sm font-medium text-foreground min-w-[2rem] text-right">
                    {count}
                  </span>
                </div>
              </div>
              <div className="h-6 bg-zinc-800/50 rounded-lg overflow-hidden relative">
                <div
                  className={`h-full bg-gradient-to-r ${stage.color} transition-all duration-500 rounded-lg flex items-center justify-end pr-2`}
                  style={{ 
                    width: `${Math.max(percentage, count > 0 ? 8 : 0)}%`,
                    minWidth: count > 0 ? '2rem' : '0'
                  }}
                >
                  {count > 0 && (
                    <span className="text-xs font-medium text-white drop-shadow">
                      {count}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Conversion Summary */}
      <div className="mt-4 pt-4 border-t border-border/30">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xl font-bold text-green-400">{data.converted}</p>
            <p className="text-[10px] text-muted-foreground">Klienci</p>
          </div>
          <div>
            <p className="text-xl font-bold text-foreground">
              {data.new > 0 ? Math.round((data.converted / data.new) * 100) : 0}%
            </p>
            <p className="text-[10px] text-muted-foreground">Konwersja</p>
          </div>
          <div>
            <p className="text-xl font-bold text-red-400">{data.lost}</p>
            <p className="text-[10px] text-muted-foreground">Utracone</p>
          </div>
        </div>
      </div>
    </div>
  );
}