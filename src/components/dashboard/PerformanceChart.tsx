import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { subDays, format, startOfDay, eachDayOfInterval } from "date-fns";
import { pl } from "date-fns/locale";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface ChartData {
  date: string;
  leads: number;
  documents: number;
  tasks: number;
}

export function PerformanceChart() {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChartData();
  }, []);

  const fetchChartData = async () => {
    const days = 7;
    const startDate = startOfDay(subDays(new Date(), days - 1));
    const endDate = new Date();

    const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
    
    const [leadsRes, docsRes, tasksRes] = await Promise.all([
      supabase
        .from("leads")
        .select("created_at")
        .gte("created_at", startDate.toISOString()),
      supabase
        .from("documents")
        .select("created_at")
        .gte("created_at", startDate.toISOString()),
      supabase
        .from("tasks")
        .select("created_at")
        .gte("created_at", startDate.toISOString()),
    ]);

    const chartData: ChartData[] = dateRange.map(date => {
      const dateStr = format(date, "yyyy-MM-dd");
      const dayStart = startOfDay(date).getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;

      return {
        date: format(date, "EEE", { locale: pl }),
        leads: leadsRes.data?.filter(l => {
          const t = new Date(l.created_at).getTime();
          return t >= dayStart && t < dayEnd;
        }).length || 0,
        documents: docsRes.data?.filter(d => {
          const t = new Date(d.created_at).getTime();
          return t >= dayStart && t < dayEnd;
        }).length || 0,
        tasks: tasksRes.data?.filter(t => {
          const time = new Date(t.created_at).getTime();
          return time >= dayStart && time < dayEnd;
        }).length || 0,
      };
    });

    setData(chartData);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="h-[200px] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-medium text-foreground">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(330, 100%, 60%)" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="hsl(330, 100%, 60%)" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorDocs" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(160, 70%, 45%)" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="hsl(160, 70%, 45%)" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(220, 70%, 50%)" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="hsl(220, 70%, 50%)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="date" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: "hsl(0, 0%, 55%)", fontSize: 12 }}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: "hsl(0, 0%, 55%)", fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="leads"
            name="Leady"
            stroke="hsl(330, 100%, 60%)"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorLeads)"
          />
          <Area
            type="monotone"
            dataKey="documents"
            name="Dokumenty"
            stroke="hsl(160, 70%, 45%)"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorDocs)"
          />
          <Area
            type="monotone"
            dataKey="tasks"
            name="Zadania"
            stroke="hsl(220, 70%, 50%)"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorTasks)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
