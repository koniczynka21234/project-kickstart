import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { format, differenceInDays, subDays, isToday, isPast, startOfWeek, endOfWeek } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Loader2, Target, Users, GraduationCap, Mail } from 'lucide-react';

// Components
import { FunnelKPICards } from '@/components/funnel/FunnelKPICards';
import { FunnelVisualization } from '@/components/funnel/FunnelVisualization';
import { ConversionEffectivenessCard } from '@/components/funnel/ConversionEffectivenessCard';
import { SourceEffectivenessTable } from '@/components/funnel/SourceEffectivenessTable';
import { ActivityTimelineCard } from '@/components/funnel/ActivityTimelineCard';
import { BottleneckAnalysisCard } from '@/components/funnel/BottleneckAnalysisCard';
import { QuickActionsCard } from '@/components/funnel/QuickActionsCard';

interface Lead {
  id: string;
  salon_name: string;
  owner_name: string | null;
  city: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  priority: string | null;
  next_follow_up_date: string | null;
  phone: string | null;
  email: string | null;
  industry: string | null;
  source: string | null;
  email_template: string | null;
  cold_email_sent: boolean | null;
  cold_email_date: string | null;
  sms_follow_up_sent: boolean | null;
  sms_follow_up_date: string | null;
  email_follow_up_1_sent: boolean | null;
  email_follow_up_1_date: string | null;
  email_follow_up_2_sent: boolean | null;
  email_follow_up_2_date: string | null;
}

interface PresentationDoc {
  id: string;
  lead_id: string | null;
  data: Record<string, unknown> | null;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  new: { label: 'Nowy', color: 'text-blue-400', bgColor: 'bg-blue-500' },
  contacted: { label: 'Kontakt', color: 'text-cyan-400', bgColor: 'bg-cyan-500' },
  follow_up: { label: 'Follow-up', color: 'text-amber-400', bgColor: 'bg-amber-500' },
  rozmowa: { label: 'Rozmowa', color: 'text-pink-400', bgColor: 'bg-pink-500' },
  no_response: { label: 'Brak odp.', color: 'text-zinc-400', bgColor: 'bg-zinc-500' },
};

const AVG_CLIENT_VALUE = 2500;

export default function SalesFunnelPage() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [presentations, setPresentations] = useState<PresentationDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [leadsRes, presRes] = await Promise.all([
      supabase.from('leads').select('*').order('updated_at', { ascending: false }),
      supabase.from('documents').select('id, lead_id, data').eq('type', 'presentation').not('lead_id', 'is', null)
    ]);

    if (leadsRes.data) setLeads(leadsRes.data);
    if (presRes.data) setPresentations(presRes.data as PresentationDoc[]);
    setLoading(false);
  };

  // Calculate funnel stages
  const funnelData = useMemo(() => {
    const activeLeads = leads.filter(l => !['converted', 'lost'].includes(l.status));
    return Object.entries(statusConfig).map(([key, config]) => ({
      key,
      ...config,
      count: activeLeads.filter(l => l.status === key).length
    }));
  }, [leads]);

  // KPIs
  const kpis = useMemo(() => {
    const total = leads.length;
    const converted = leads.filter(l => l.status === 'converted');
    const lost = leads.filter(l => l.status === 'lost');
    const active = leads.filter(l => !['converted', 'lost'].includes(l.status));
    
    const weekAgo = subDays(new Date(), 7);
    const weeklyNew = leads.filter(l => new Date(l.created_at) >= weekAgo).length;
    const weeklyConverted = converted.filter(l => new Date(l.updated_at) >= weekAgo).length;

    const conversionRate = total > 0 ? Math.round((converted.length / total) * 100) : 0;
    const avgDays = converted.length > 0
      ? Math.round(converted.reduce((sum, l) => 
          sum + differenceInDays(new Date(l.updated_at), new Date(l.created_at)), 0) / converted.length)
      : 0;

    const pipelineValue = active
      .filter(l => ['rozmowa', 'follow_up'].includes(l.status))
      .length * AVG_CLIENT_VALUE * (conversionRate / 100);

    return {
      total,
      active: active.length,
      converted: converted.length,
      lost: lost.length,
      conversionRate,
      avgDays,
      pipelineValue,
      weeklyNew,
      weeklyConverted,
    };
  }, [leads]);

  // Presentation effectiveness stats (Academy vs non-Academy)
  const presentationStats = useMemo(() => {
    const leadPresentations = new Map<string, { hasAcademy: boolean; hasNonAcademy: boolean }>();
    
    presentations.forEach(pres => {
      if (!pres.lead_id) return;
      const existing = leadPresentations.get(pres.lead_id) || { hasAcademy: false, hasNonAcademy: false };
      const includeAcademy = pres.data?.includeAcademy === 'true';
      if (includeAcademy) existing.hasAcademy = true;
      else existing.hasNonAcademy = true;
      leadPresentations.set(pres.lead_id, existing);
    });

    let academyTotal = 0, academyConverted = 0, nonAcademyTotal = 0, nonAcademyConverted = 0;

    leads.forEach(lead => {
      const presInfo = leadPresentations.get(lead.id);
      if (!presInfo) return;

      if (presInfo.hasAcademy) {
        academyTotal++;
        if (lead.status === 'converted') academyConverted++;
      }
      if (presInfo.hasNonAcademy && !presInfo.hasAcademy) {
        nonAcademyTotal++;
        if (lead.status === 'converted') nonAcademyConverted++;
      }
    });

    return [
      {
        name: 'Z Aurine Academy',
        icon: 'academy' as const,
        total: academyTotal,
        converted: academyConverted,
        rate: academyTotal > 0 ? Math.round((academyConverted / academyTotal) * 100) : 0,
        color: 'text-fuchsia-400',
        bgColor: 'bg-fuchsia-500/10',
        borderColor: 'border-fuchsia-500/20',
      },
      {
        name: 'Bez Academy',
        icon: 'presentation' as const,
        total: nonAcademyTotal,
        converted: nonAcademyConverted,
        rate: nonAcademyTotal > 0 ? Math.round((nonAcademyConverted / nonAcademyTotal) * 100) : 0,
        color: 'text-zinc-400',
        bgColor: 'bg-zinc-500/10',
        borderColor: 'border-zinc-500/20',
      }
    ];
  }, [leads, presentations]);

  // Email template effectiveness stats
  // ONLY count leads where cold_email_sent = true (explicitly marked as sent)
  const emailTemplateStats = useMemo(() => {
    const templateStats = new Map<string, { total: number; converted: number }>();
    
    leads.forEach(lead => {
      // Only count if cold_email_sent is explicitly true
      if (!lead.email_template || !lead.cold_email_sent) return;
      
      const existing = templateStats.get(lead.email_template) || { total: 0, converted: 0 };
      existing.total++;
      if (lead.status === 'converted') existing.converted++;
      templateStats.set(lead.email_template, existing);
    });

    const colors = [
      { color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/20' },
      { color: 'text-violet-400', bgColor: 'bg-violet-500/10', borderColor: 'border-violet-500/20' },
      { color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20' },
      { color: 'text-orange-400', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/20' },
      { color: 'text-pink-400', bgColor: 'bg-pink-500/10', borderColor: 'border-pink-500/20' },
    ];

    return Array.from(templateStats.entries()).map(([name, stats], idx) => ({
      name,
      icon: 'email' as const,
      total: stats.total,
      converted: stats.converted,
      rate: stats.total > 0 ? Math.round((stats.converted / stats.total) * 100) : 0,
      ...colors[idx % colors.length],
    }));
  }, [leads]);

  // Source effectiveness
  const sourceStats = useMemo(() => {
    const sources = new Map<string, { total: number; converted: number; totalDays: number; convertedCount: number }>();
    
    leads.forEach(lead => {
      const source = lead.source || 'Nieznane';
      const existing = sources.get(source) || { total: 0, converted: 0, totalDays: 0, convertedCount: 0 };
      existing.total++;
      
      if (lead.status === 'converted') {
        existing.converted++;
        existing.totalDays += differenceInDays(new Date(lead.updated_at), new Date(lead.created_at));
        existing.convertedCount++;
      }
      sources.set(source, existing);
    });

    return Array.from(sources.entries()).map(([source, stats]) => ({
      source,
      total: stats.total,
      converted: stats.converted,
      rate: stats.total > 0 ? Math.round((stats.converted / stats.total) * 100) : 0,
      avgDays: stats.convertedCount > 0 ? Math.round(stats.totalDays / stats.convertedCount) : 0,
    }));
  }, [leads]);

  // Weekly activity data
  const weeklyData = useMemo(() => {
    const weeks: { weekLabel: string; newLeads: number; conversions: number; lost: number }[] = [];
    
    for (let i = 3; i >= 0; i--) {
      const weekStart = startOfWeek(subDays(new Date(), i * 7), { locale: pl });
      const weekEnd = endOfWeek(subDays(new Date(), i * 7), { locale: pl });
      
      const newLeads = leads.filter(l => {
        const date = new Date(l.created_at);
        return date >= weekStart && date <= weekEnd;
      }).length;
      
      const conversions = leads.filter(l => {
        if (l.status !== 'converted') return false;
        const date = new Date(l.updated_at);
        return date >= weekStart && date <= weekEnd;
      }).length;
      
      const lost = leads.filter(l => {
        if (l.status !== 'lost') return false;
        const date = new Date(l.updated_at);
        return date >= weekStart && date <= weekEnd;
      }).length;

      weeks.push({
        weekLabel: format(weekStart, 'd MMM', { locale: pl }),
        newLeads,
        conversions,
        lost,
      });
    }
    
    return weeks;
  }, [leads]);

  // Bottleneck analysis
  const stageAnalysis = useMemo(() => {
    const activeLeads = leads.filter(l => !['converted', 'lost'].includes(l.status));
    
    return Object.entries(statusConfig).map(([key, config]) => {
      const stageLeads = activeLeads.filter(l => l.status === key);
      
      // Calculate average days in stage based on updated_at (when status last changed)
      const avgDays = stageLeads.length > 0
        ? Math.round(stageLeads.reduce((sum, l) => 
            sum + differenceInDays(new Date(), new Date(l.updated_at)), 0) / stageLeads.length)
        : 0;

      return {
        stage: key,
        stageLabel: config.label,
        count: stageLeads.length,
        avgDaysInStage: avgDays,
        dropOffRate: 0, // Would need lead_interactions history to calculate accurately
      };
    });
  }, [leads]);

  // Hot leads and urgent follow-ups
  const hotLeads = useMemo(() => {
    return leads
      .filter(l => (l.priority === 'high' || l.status === 'rozmowa') && !['converted', 'lost'].includes(l.status))
      .slice(0, 5);
  }, [leads]);

  // Urgent follow-ups - leads that have overdue or today's sequence dates
  const urgentFollowUps = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return leads.filter(l => {
      if (['converted', 'lost'].includes(l.status)) return false;
      
      // Check sequence dates - find the next pending action
      // Cold email not sent but date is today or past
      if (!l.cold_email_sent && l.cold_email_date) {
        const date = new Date(l.cold_email_date);
        date.setHours(0, 0, 0, 0);
        if (date <= today) return true;
      }
      
      // SMS follow-up: cold email sent, but SMS not sent and date is today or past
      if (l.cold_email_sent && !l.sms_follow_up_sent && l.sms_follow_up_date) {
        const date = new Date(l.sms_follow_up_date);
        date.setHours(0, 0, 0, 0);
        if (date <= today) return true;
      }
      
      // Email follow-up 1: SMS sent, but FU1 not sent and date is today or past
      if (l.sms_follow_up_sent && !l.email_follow_up_1_sent && l.email_follow_up_1_date) {
        const date = new Date(l.email_follow_up_1_date);
        date.setHours(0, 0, 0, 0);
        if (date <= today) return true;
      }
      
      // Email follow-up 2: FU1 sent, but FU2 not sent and date is today or past
      if (l.email_follow_up_1_sent && !l.email_follow_up_2_sent && l.email_follow_up_2_date) {
        const date = new Date(l.email_follow_up_2_date);
        date.setHours(0, 0, 0, 0);
        if (date <= today) return true;
      }
      
      // Also check next_follow_up_date as fallback
      if (l.next_follow_up_date) {
        const date = new Date(l.next_follow_up_date);
        date.setHours(0, 0, 0, 0);
        if (date <= today) return true;
      }
      
      return false;
    }).slice(0, 5);
  }, [leads]);

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-5 animate-fade-in w-full max-w-full overflow-hidden">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/25">
                <Target className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              Analityka Sprzedaży
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">Kompleksowy dashboard konwersji i aktywności</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/leads')}>
              <Users className="w-4 h-4 mr-2" />
              Leady
            </Button>
            <Button 
              size="sm"
              onClick={() => navigate('/leads')}
              className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white border-0"
            >
              <Target className="w-4 h-4 mr-2" />
              Nowy lead
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <FunnelKPICards kpis={kpis} />

        {/* Main Grid - 3 columns */}
        <div className="grid lg:grid-cols-12 gap-4 sm:gap-5">
          {/* Left Column - Funnel + Activity */}
          <div className="lg:col-span-4 space-y-4">
            <FunnelVisualization 
              stages={funnelData} 
              converted={kpis.converted} 
              lost={kpis.lost} 
            />
            <ActivityTimelineCard 
              weeklyData={weeklyData}
              currentWeek={{ newLeads: kpis.weeklyNew, conversions: kpis.weeklyConverted }}
            />
          </div>

          {/* Middle Column - Effectiveness Cards */}
          <div className="lg:col-span-5 space-y-4">
            {/* Presentation Effectiveness */}
            <ConversionEffectivenessCard
              title="Skuteczność prezentacji"
              icon={<GraduationCap className="w-5 h-5 text-fuchsia-400" />}
              stats={presentationStats}
              emptyMessage="Brak danych"
              emptySubMessage="Wyślij prezentacje do leadów"
            />

            {/* Email Template Effectiveness */}
            <ConversionEffectivenessCard
              title="Skuteczność szablonów maili"
              icon={<Mail className="w-5 h-5 text-cyan-400" />}
              stats={emailTemplateStats}
              emptyMessage="Brak danych"
              emptySubMessage="Wyślij cold maile z różnych szablonów"
            />

            {/* Source Effectiveness Table */}
            <SourceEffectivenessTable 
              sources={sourceStats}
              overallRate={kpis.conversionRate}
            />
          </div>

          {/* Right Column - Bottlenecks + Quick Actions */}
          <div className="lg:col-span-3 space-y-4">
            <BottleneckAnalysisCard stages={stageAnalysis} />
            <QuickActionsCard 
              hotLeads={hotLeads}
              urgentFollowUps={urgentFollowUps}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
