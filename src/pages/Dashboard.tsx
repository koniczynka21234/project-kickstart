import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, Target, CheckCircle, Briefcase, TrendingUp, Activity,
  Bell, ChevronRight, ArrowUpRight, Clock, Loader2, User,
  Calendar, FileText, Zap, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCloudDocumentHistory } from "@/hooks/useCloudDocumentHistory";
import { supabase } from "@/integrations/supabase/client";
import { isToday, formatDistanceToNow, format } from "date-fns";
import { pl } from "date-fns/locale";
import { AnnouncementBanner } from "@/components/dashboard/AnnouncementBanner";
import { ImportantNotifications } from "@/components/dashboard/ImportantNotifications";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { SalesFunnel } from "@/components/dashboard/SalesFunnel";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { OverduePaymentsAlert } from "@/components/dashboard/OverduePaymentsAlert";
import { PendingFinalInvoicesAlert } from "@/components/dashboard/PendingFinalInvoicesAlert";
import { DatabaseSizeAlert } from "@/components/dashboard/DatabaseSizeAlert";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface LeadReminder {
  id: string;
  salon_name: string;
  owner_name: string | null;
  next_follow_up_date: string;
  follow_up_count: number;
  status: string;
}

interface DashboardStats {
  totalLeads: number;
  activeLeads: number;
  totalClients: number;
  activeTasks: number;
  completedTasks: number;
  conversionRate: number;
  thisWeekLeads: number;
  thisWeekClients: number;
  thisMonthDocuments: number;
  pipelineValue: number;
  upcomingEvents: number;
  teamMessages: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getStats, loading, userId } = useCloudDocumentHistory();
  const [followUpReminders, setFollowUpReminders] = useState<LeadReminder[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [userFullName, setUserFullName] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    activeLeads: 0,
    totalClients: 0,
    activeTasks: 0,
    completedTasks: 0,
    conversionRate: 0,
    thisWeekLeads: 0,
    thisWeekClients: 0,
    thisMonthDocuments: 0,
    pipelineValue: 0,
    upcomingEvents: 0,
    teamMessages: 0,
  });
  
  const docStats = getStats(userId);

  // Fetch user's full name from profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();
      if (data?.full_name) {
        setUserFullName(data.full_name);
      }
    };
    fetchUserProfile();
  }, [user?.id]);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const [remindersRes, leadsRes, clientsRes, tasksRes, docsRes, eventsRes, messagesRes] = await Promise.all([
        supabase
          .from('leads')
          .select('id, salon_name, owner_name, next_follow_up_date, follow_up_count, status')
          .not('next_follow_up_date', 'is', null)
          .lte('next_follow_up_date', today)
          .not('status', 'in', '("converted","lost")')
          .order('next_follow_up_date', { ascending: true })
          .limit(5),
        supabase.from('leads').select('id, status, created_at'),
        supabase.from('clients').select('id, created_at, monthly_budget'),
        supabase.from('tasks').select('id, status, title, created_at, completed_at'),
        supabase.from('documents').select('id, title, type, created_at, created_by').order('created_at', { ascending: false }).limit(10),
        supabase.from('calendar_events').select('id').gte('start_date', today).lte('start_date', weekFromNow),
        supabase.from('team_messages').select('id').gte('created_at', weekAgo),
      ]);

      if (remindersRes.data) {
        setFollowUpReminders(remindersRes.data as LeadReminder[]);
      }

      const leads = leadsRes.data || [];
      const clients = clientsRes.data || [];
      const tasks = tasksRes.data || [];
      const docs = docsRes.data || [];
      
      const activeLeads = leads.filter(l => !['converted', 'lost'].includes(l.status)).length;
      const convertedLeads = leads.filter(l => l.status === 'converted').length;
      const thisWeekLeads = leads.filter(l => new Date(l.created_at) >= new Date(weekAgo)).length;
      const thisWeekClients = clients.filter(c => new Date(c.created_at) >= new Date(weekAgo)).length;
      const thisMonthDocuments = docs.filter(d => new Date(d.created_at) >= new Date(monthAgo)).length;
      const activeTasks = tasks.filter(t => t.status !== 'done').length;
      const completedTasks = tasks.filter(t => t.status === 'done').length;
      const pipelineValue = clients.reduce((sum, c) => sum + (c.monthly_budget || 0), 0);

      setStats({
        totalLeads: leads.length,
        activeLeads,
        totalClients: clients.length,
        activeTasks,
        completedTasks,
        conversionRate: leads.length > 0 ? Math.round((convertedLeads / leads.length) * 100) : 0,
        thisWeekLeads,
        thisWeekClients,
        thisMonthDocuments,
        pipelineValue,
        upcomingEvents: eventsRes.data?.length || 0,
        teamMessages: messagesRes.data?.length || 0,
      });

      setLoadingData(false);
    };

    fetchData();
  }, []);

  if (loading || loadingData) {
    return (
      <AppLayout>
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Ładowanie dashboardu...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mobile-page py-4 space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden box-border">
        {/* Header with greeting */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">
              Cześć{userFullName ? `, ${userFullName.split(' ')[0]}` : (user?.email ? `, ${user.email.split('@')[0]}` : '')}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {format(new Date(), "EEEE, d MMMM yyyy", { locale: pl })}
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/calendar")} className="gap-2 shrink-0 w-full sm:w-auto">
            <Calendar className="w-4 h-4" />
            <span className="sm:inline">Kalendarz</span>
          </Button>
        </div>

        {/* Announcements - TOP PRIORITY */}
        <AnnouncementBanner />

        {/* Important Notifications - Contract alerts etc. */}
        <ImportantNotifications />

        {/* Follow-up Reminders - IMPORTANT */}
        {followUpReminders.length > 0 && (
          <Card className="border-pink-500/30 bg-gradient-to-r from-pink-500/10 via-pink-500/5 to-transparent overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center animate-pulse-glow">
                    <Bell className="w-5 h-5 text-pink-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Follow-upy do wykonania</h3>
                    <p className="text-xs text-muted-foreground">{followUpReminders.length} leadów czeka na kontakt</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate("/leads")} className="text-pink-400 hover:text-pink-300 hover:bg-pink-500/10">
                  Zobacz wszystkie <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                {followUpReminders.map((lead) => (
                  <div 
                    key={lead.id}
                    className="flex items-center gap-3 bg-background/60 rounded-xl p-3 cursor-pointer hover:bg-background/80 transition-all hover:scale-[1.02] border border-border/30 hover:border-pink-500/30"
                    onClick={() => navigate(`/leads/${lead.id}`)}
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500/30 to-rose-500/20 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-pink-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-foreground truncate">{lead.salon_name}</p>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-pink-400 font-medium">
                          {isToday(new Date(lead.next_follow_up_date)) ? "Dzisiaj" : formatDistanceToNow(new Date(lead.next_follow_up_date), { locale: pl, addSuffix: true })}
                        </span>
                        <span className="text-muted-foreground">• FU #{(lead.follow_up_count || 0) + 1}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4 w-full">
          <StatsCard 
            title="Aktywne leady" 
            value={stats.activeLeads} 
            icon={Users} 
            color="pink"
            subtitle={stats.thisWeekLeads > 0 ? `+${stats.thisWeekLeads} tyg` : undefined}
            onClick={() => navigate("/leads")}
          />
          <StatsCard 
            title="Klienci" 
            value={stats.totalClients} 
            icon={Briefcase} 
            color="emerald"
            subtitle={stats.thisWeekClients > 0 ? `+${stats.thisWeekClients} tyg` : undefined}
            onClick={() => navigate("/clients")}
          />
          <StatsCard 
            title="Konwersja" 
            value={`${stats.conversionRate}%`} 
            icon={Target}
            color="blue"
          />
          <StatsCard 
            title="Aktywne zadania" 
            value={stats.activeTasks} 
            icon={CheckCircle} 
            color="purple"
            subtitle={`${stats.completedTasks} done`}
            onClick={() => navigate("/tasks")}
          />
          <StatsCard 
            title="Dokumenty" 
            value={docStats.total} 
            icon={FileText}
            color="orange"
            subtitle={stats.thisMonthDocuments > 0 ? `+${stats.thisMonthDocuments} mies` : undefined}
            onClick={() => navigate("/history")}
          />
          <StatsCard 
            title="Pipeline" 
            value={`${Math.round(stats.pipelineValue / 1000)}k zł`} 
            icon={TrendingUp}
            color="cyan"
          />
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-12 gap-4 sm:gap-6 w-full">
          {/* Left Column - Charts */}
          <div className="lg:col-span-8 space-y-6">
            {/* Performance Chart */}
            <Card className="border-border/50 overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                      <Activity className="w-4 h-4 text-primary" />
                    </div>
                    Aktywność (7 dni)
                  </CardTitle>
                  <div className="flex gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-pink-500" />
                      <span className="text-muted-foreground">Leady</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-muted-foreground">Dokumenty</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-muted-foreground">Zadania</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <PerformanceChart />
              </CardContent>
            </Card>

            {/* Funnel + Quick Stats */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Sales Funnel */}
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-primary" />
                      </div>
                      Lejek sprzedaży
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => navigate("/funnel")} className="text-xs h-7 px-2">
                      <ArrowUpRight className="w-3 h-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <SalesFunnel />
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-primary" />
                    </div>
                    Szybki podgląd
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center">
                          <Calendar className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Wydarzenia (7 dni)</p>
                          <p className="text-xs text-muted-foreground">Nadchodzące spotkania</p>
                        </div>
                      </div>
                      <span className="text-xl font-bold text-blue-400">{stats.upcomingEvents}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-purple-500/15 flex items-center justify-center">
                          <Users className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Wiadomości (tydzień)</p>
                          <p className="text-xs text-muted-foreground">Aktywność zespołu</p>
                        </div>
                      </div>
                      <span className="text-xl font-bold text-purple-400">{stats.teamMessages}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Ukończone zadania</p>
                          <p className="text-xs text-muted-foreground">Całkowita liczba</p>
                        </div>
                      </div>
                      <span className="text-xl font-bold text-emerald-400">{stats.completedTasks}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Column - Actions & Activity */}
          <div className="lg:col-span-4 space-y-6">
            {/* Database Size Alert - for szef only */}
            <DatabaseSizeAlert />
            
            {/* Pending Final Invoices Alert */}
            <PendingFinalInvoicesAlert />
            
            {/* Overdue Payments Alert - for szef only */}
            <OverduePaymentsAlert />
            
            {/* Quick Actions */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-primary" />
                  </div>
                  Szybkie akcje
                </CardTitle>
              </CardHeader>
              <CardContent>
                <QuickActions />
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-primary" />
                    </div>
                    Ostatnia aktywność
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => navigate("/team")} className="text-xs h-7 px-2">
                    <ArrowUpRight className="w-3 h-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ActivityFeed />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}