import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { 
  Users, MessageSquare, Crown, User, Search, Circle, Shield, 
  FileText, CheckCircle2, Clock, TrendingUp, Activity, Mail, Phone,
  Briefcase, Calendar, BarChart3, Target, Award, Zap, UserCheck,
  ArrowUpRight, Sparkles, Trophy
} from "lucide-react";
import { formatDistanceToNow, format, subDays, isAfter } from "date-fns";
import { pl } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { EmbeddedTeamChat } from "@/components/chat/EmbeddedTeamChat";
import { isUserOnline } from "@/hooks/useActivityStatus";

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  position: string | null;
  status: string | null;
  last_seen_at: string | null;
  bio: string | null;
  phone: string | null;
  created_at: string;
}

interface UserWithRole extends Profile {
  role: string | null;
}

interface UserStats {
  userId: string;
  documentsCount: number;
  tasksCompleted: number;
  messagesCount: number;
  recentDocuments: number;
  recentTasks: number;
}

interface RecentActivity {
  id: string;
  type: 'document' | 'task' | 'message';
  title: string;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  createdAt: string;
}

export default function Team() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<UserWithRole[]>([]);
  const [userStats, setUserStats] = useState<Record<string, UserStats>>({});
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("members");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchProfiles = async () => {
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .order("full_name");

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      setLoading(false);
      return;
    }

    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("user_id, role");

    const profilesWithRoles = (profilesData || []).map((profile) => {
      const userRole = rolesData?.find((r) => r.user_id === profile.id);
      return {
        ...profile,
        role: userRole?.role || null,
      };
    });

    setProfiles(profilesWithRoles);
    setLoading(false);
  };

  const fetchUserStats = async () => {
    const sevenDaysAgo = subDays(new Date(), 7).toISOString();
    
    const [docsData, tasksData, messagesData, recentDocsData, recentTasksData] = await Promise.all([
      supabase.from("documents").select("created_by"),
      supabase.from("tasks").select("completed_by").not("completed_by", "is", null),
      supabase.from("team_messages").select("user_id"),
      supabase.from("documents").select("created_by, created_at").gte("created_at", sevenDaysAgo),
      supabase.from("tasks").select("completed_by, completed_at").not("completed_by", "is", null).gte("completed_at", sevenDaysAgo),
    ]);

    const stats: Record<string, UserStats> = {};
    
    docsData.data?.forEach(d => {
      if (d.created_by) {
        if (!stats[d.created_by]) {
          stats[d.created_by] = { userId: d.created_by, documentsCount: 0, tasksCompleted: 0, messagesCount: 0, recentDocuments: 0, recentTasks: 0 };
        }
        stats[d.created_by].documentsCount++;
      }
    });

    tasksData.data?.forEach(t => {
      if (t.completed_by) {
        if (!stats[t.completed_by]) {
          stats[t.completed_by] = { userId: t.completed_by, documentsCount: 0, tasksCompleted: 0, messagesCount: 0, recentDocuments: 0, recentTasks: 0 };
        }
        stats[t.completed_by].tasksCompleted++;
      }
    });

    messagesData.data?.forEach(m => {
      if (m.user_id) {
        if (!stats[m.user_id]) {
          stats[m.user_id] = { userId: m.user_id, documentsCount: 0, tasksCompleted: 0, messagesCount: 0, recentDocuments: 0, recentTasks: 0 };
        }
        stats[m.user_id].messagesCount++;
      }
    });

    recentDocsData.data?.forEach(d => {
      if (d.created_by && stats[d.created_by]) {
        stats[d.created_by].recentDocuments++;
      }
    });

    recentTasksData.data?.forEach(t => {
      if (t.completed_by && stats[t.completed_by]) {
        stats[t.completed_by].recentTasks++;
      }
    });

    setUserStats(stats);
  };

  const fetchRecentActivities = async () => {
    const [docsRes, tasksRes, messagesRes, profilesRes] = await Promise.all([
      supabase.from("documents").select("id, title, created_by, created_at").order("created_at", { ascending: false }).limit(10),
      supabase.from("tasks").select("id, title, completed_by, completed_at").not("completed_by", "is", null).order("completed_at", { ascending: false }).limit(10),
      supabase.from("team_messages").select("id, content, user_id, created_at").order("created_at", { ascending: false }).limit(10),
      supabase.from("profiles").select("id, full_name, email, avatar_url"),
    ]);

    const profileMap = new Map(profilesRes.data?.map(p => [p.id, { name: p.full_name || p.email?.split("@")[0] || "Użytkownik", avatar: p.avatar_url }]));

    const activities: RecentActivity[] = [];

    docsRes.data?.forEach(d => {
      if (d.created_by) {
        const profile = profileMap.get(d.created_by);
        activities.push({
          id: d.id,
          type: 'document',
          title: `Utworzono dokument "${d.title}"`,
          userId: d.created_by,
          userName: profile?.name || "Użytkownik",
          userAvatar: profile?.avatar,
          createdAt: d.created_at,
        });
      }
    });

    tasksRes.data?.forEach(t => {
      if (t.completed_by && t.completed_at) {
        const profile = profileMap.get(t.completed_by);
        activities.push({
          id: t.id,
          type: 'task',
          title: `Ukończono zadanie "${t.title}"`,
          userId: t.completed_by,
          userName: profile?.name || "Użytkownik",
          userAvatar: profile?.avatar,
          createdAt: t.completed_at,
        });
      }
    });

    messagesRes.data?.forEach(m => {
      const profile = profileMap.get(m.user_id);
      activities.push({
        id: m.id,
        type: 'message',
        title: m.content.length > 50 ? m.content.slice(0, 50) + "..." : m.content,
        userId: m.user_id,
        userName: profile?.name || "Użytkownik",
        userAvatar: profile?.avatar,
        createdAt: m.created_at,
      });
    });

    activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setRecentActivities(activities.slice(0, 15));
  };

  useEffect(() => {
    fetchProfiles();
    fetchUserStats();
    fetchRecentActivities();

    const channel = supabase
      .channel("profiles-changes-team")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => fetchProfiles()
      )
      .subscribe();

    // Refresh stats every 30 seconds
    const statsInterval = setInterval(() => {
      fetchUserStats();
      fetchRecentActivities();
    }, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(statsInterval);
    };
  }, []);

  const filteredProfiles = profiles.filter((profile) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      profile.full_name?.toLowerCase().includes(searchLower) ||
      profile.email?.toLowerCase().includes(searchLower) ||
      profile.position?.toLowerCase().includes(searchLower);
    
    // Use the computed status instead of stored status
    const computedStatus = isUserOnline(profile.last_seen_at, profile.status);
    const matchesStatus = statusFilter === "all" || computedStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (profile: UserWithRole) => {
    const status = isUserOnline(profile.last_seen_at, profile.status);
    switch (status) {
      case "online": return "bg-emerald-500";
      case "away": return "bg-amber-500";
      default: return "bg-zinc-500";
    }
  };

  const getStatusLabel = (profile: UserWithRole) => {
    const status = isUserOnline(profile.last_seen_at, profile.status);
    switch (status) {
      case "online": return "Online";
      case "away": return "Zaraz wracam";
      default: return "Offline";
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'document': return <FileText className="w-4 h-4 text-blue-400" />;
      case 'task': return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'message': return <MessageSquare className="w-4 h-4 text-pink-400" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const onlineCount = profiles.filter(p => isUserOnline(p.last_seen_at, p.status) === "online").length;
  const awayCount = profiles.filter(p => isUserOnline(p.last_seen_at, p.status) === "away").length;
  const totalDocuments = Object.values(userStats).reduce((sum, s) => sum + s.documentsCount, 0);
  const totalTasksCompleted = Object.values(userStats).reduce((sum, s) => sum + s.tasksCompleted, 0);
  const totalMessages = Object.values(userStats).reduce((sum, s) => sum + s.messagesCount, 0);
  const weeklyDocuments = Object.values(userStats).reduce((sum, s) => sum + (s.recentDocuments || 0), 0);
  const weeklyTasks = Object.values(userStats).reduce((sum, s) => sum + (s.recentTasks || 0), 0);

  // Top performers
  const topPerformers = profiles
    .map(p => ({
      ...p,
      totalActivity: (userStats[p.id]?.documentsCount || 0) + 
                     (userStats[p.id]?.tasksCompleted || 0) + 
                     (userStats[p.id]?.messagesCount || 0),
      weeklyActivity: (userStats[p.id]?.recentDocuments || 0) + 
                      (userStats[p.id]?.recentTasks || 0)
    }))
    .sort((a, b) => b.totalActivity - a.totalActivity)
    .slice(0, 5);

  return (
    <AppLayout>
      <div className="px-3 sm:px-4 lg:container lg:mx-auto py-4 sm:py-8 space-y-4 sm:space-y-8 animate-fade-in max-w-full overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-pink-400 via-rose-400 to-pink-500 bg-clip-text text-transparent">
              Zespół
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Zarządzaj zespołem i śledź aktywność
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="gap-1.5 px-2 py-1 border-emerald-500/30 bg-emerald-500/10 text-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-400">{onlineCount} online</span>
            </Badge>
            {awayCount > 0 && (
              <Badge variant="outline" className="gap-1.5 px-2 py-1 border-amber-500/30 bg-amber-500/10 text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span className="text-amber-400">{awayCount} away</span>
              </Badge>
            )}
            <Badge variant="secondary" className="gap-1.5 px-2 py-1 text-xs">
              <Users className="w-3 h-3" />
              {profiles.length}
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4 overflow-x-hidden">
          <Card className="bg-gradient-to-br from-pink-500/10 to-rose-500/5 border-pink-500/20 hover:border-pink-500/40 transition-colors">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{profiles.length}</p>
                  <p className="text-xs text-muted-foreground">Członków</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-emerald-500/20 hover:border-emerald-500/40 transition-colors">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{onlineCount}</p>
                  <p className="text-xs text-muted-foreground">Online</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border-blue-500/20 hover:border-blue-500/40 transition-colors">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{totalDocuments}</p>
                  <p className="text-xs text-muted-foreground">Dokumentów</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/5 border-violet-500/20 hover:border-violet-500/40 transition-colors">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{totalTasksCompleted}</p>
                  <p className="text-xs text-muted-foreground">Zadań</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20 hover:border-amber-500/40 transition-colors">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{totalMessages}</p>
                  <p className="text-xs text-muted-foreground">Wiadomości</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-500/10 to-sky-500/5 border-cyan-500/20 hover:border-cyan-500/40 transition-colors">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{weeklyDocuments + weeklyTasks}</p>
                  <p className="text-xs text-muted-foreground">Ten tydzień</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 bg-secondary/50">
            <TabsTrigger value="members" className="gap-2">
              <Users className="w-4 h-4" />
              Członkowie
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <Activity className="w-4 h-4" />
              Aktywność
            </TabsTrigger>
            <TabsTrigger value="rankings" className="gap-2">
              <Trophy className="w-4 h-4" />
              Ranking
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Czat
            </TabsTrigger>
          </TabsList>

          {/* Members Tab */}
          <TabsContent value="members">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Szukaj członka zespołu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-secondary/30 border-border/50"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  variant={statusFilter === "all" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setStatusFilter("all")}
                  className={statusFilter === "all" ? "bg-pink-600 hover:bg-pink-700" : ""}
                >
                  Wszyscy
                </Button>
                <Button 
                  variant={statusFilter === "online" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setStatusFilter("online")}
                  className={statusFilter === "online" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                >
                  <Circle className="w-2 h-2 mr-1.5 fill-emerald-400 text-emerald-400" />
                  Online
                </Button>
                <Button 
                  variant={statusFilter === "away" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setStatusFilter("away")}
                  className={statusFilter === "away" ? "bg-amber-600 hover:bg-amber-700" : ""}
                >
                  <Circle className="w-2 h-2 mr-1.5 fill-amber-400 text-amber-400" />
                  Away
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                Ładowanie...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredProfiles.map((profile) => {
                  const stats = userStats[profile.id] || { documentsCount: 0, tasksCompleted: 0, messagesCount: 0, recentDocuments: 0, recentTasks: 0 };
                  const totalActivity = stats.documentsCount + stats.tasksCompleted + stats.messagesCount;
                  const maxActivity = Math.max(...Object.values(userStats).map(s => s.documentsCount + s.tasksCompleted + s.messagesCount), 1);
                  const activityPercent = (totalActivity / maxActivity) * 100;
                  
                  return (
                    <Card 
                      key={profile.id}
                      className="cursor-pointer hover:border-pink-500/50 transition-all hover:shadow-lg hover:shadow-pink-500/5 group overflow-hidden"
                      onClick={() => navigate(`/profile/${profile.id}`)}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <div className="relative">
                            <Avatar className="w-14 h-14 border-2 border-border group-hover:border-pink-500/50 transition-colors">
                              <AvatarImage src={profile.avatar_url || ""} />
                              <AvatarFallback className={cn(
                                "text-lg",
                                profile.role === "szef" ? "bg-amber-500/20 text-amber-400" : "bg-pink-500/20 text-pink-400"
                              )}>
                                {profile.role === "szef" ? (
                                  <Crown className="w-6 h-6" />
                                ) : (
                                  <User className="w-6 h-6" />
                                )}
                              </AvatarFallback>
                            </Avatar>
                          <div className={cn(
                              "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-background",
                              getStatusColor(profile)
                            )} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-foreground truncate group-hover:text-pink-400 transition-colors">
                                {profile.full_name || profile.email?.split("@")[0] || "Użytkownik"}
                              </h3>
                              <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            {profile.position && (
                              <p className="text-sm text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                                <Briefcase className="w-3 h-3" />
                                {profile.position}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              {profile.role === "szef" && (
                                <Badge variant="outline" className="text-amber-500 border-amber-500/30 bg-amber-500/10 text-xs gap-1">
                                  <Crown className="w-3 h-3" />
                                  Szef
                                </Badge>
                              )}
                              {profile.role === "pracownik" && (
                                <Badge variant="outline" className="text-blue-400 border-blue-400/30 bg-blue-500/10 text-xs gap-1">
                                  <Shield className="w-3 h-3" />
                                  Pracownik
                                </Badge>
                              )}
                              <Badge variant="outline" className={cn(
                                "text-xs gap-1",
                                isUserOnline(profile.last_seen_at, profile.status) === "online" ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" :
                                isUserOnline(profile.last_seen_at, profile.status) === "away" ? "text-amber-400 border-amber-500/30 bg-amber-500/10" : 
                                "text-zinc-400 border-zinc-500/30"
                              )}>
                                <Circle className="w-2 h-2 fill-current" />
                                {getStatusLabel(profile)}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Activity Progress */}
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-muted-foreground">Aktywność</span>
                            <span className="text-pink-400 font-medium">{totalActivity} działań</span>
                          </div>
                          <Progress value={activityPercent} className="h-1.5 bg-secondary" />
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border/50">
                          <div className="text-center p-2 rounded-lg bg-blue-500/5 hover:bg-blue-500/10 transition-colors">
                            <p className="text-lg font-bold text-blue-400">{stats.documentsCount}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Dokumenty</p>
                          </div>
                          <div className="text-center p-2 rounded-lg bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors">
                            <p className="text-lg font-bold text-emerald-400">{stats.tasksCompleted}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Zadania</p>
                          </div>
                          <div className="text-center p-2 rounded-lg bg-pink-500/5 hover:bg-pink-500/10 transition-colors">
                            <p className="text-lg font-bold text-pink-400">{stats.messagesCount}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Wiadomości</p>
                          </div>
                        </div>

                        {profile.last_seen_at && profile.status !== "online" && (
                          <p className="text-xs text-muted-foreground/70 mt-3 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Ostatnio: {formatDistanceToNow(new Date(profile.last_seen_at), { locale: pl, addSuffix: true })}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {!loading && filteredProfiles.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-muted-foreground">Nie znaleziono członków zespołu</p>
              </div>
            )}
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-pink-400" />
                  Ostatnia aktywność zespołu
                </CardTitle>
                <CardDescription>
                  Przegląd najnowszych działań wszystkich członków
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  {recentActivities.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="w-12 h-12 mx-auto mb-4 opacity-30" />
                      Brak aktywności do wyświetlenia
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentActivities.map((activity) => (
                        <div 
                          key={`${activity.type}-${activity.id}`}
                          className="flex items-start gap-3 p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors border border-transparent hover:border-pink-500/20"
                        >
                          <Avatar className="w-10 h-10 border border-border">
                            <AvatarImage src={activity.userAvatar || ""} />
                            <AvatarFallback className="bg-pink-500/20 text-pink-400 text-sm">
                              {activity.userName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-pink-400">{activity.userName}</span>
                              <Badge variant="outline" className={cn(
                                "text-[10px] px-1.5 py-0",
                                activity.type === 'document' ? "text-blue-400 border-blue-500/30" :
                                activity.type === 'task' ? "text-emerald-400 border-emerald-500/30" :
                                "text-pink-400 border-pink-500/30"
                              )}>
                                {activity.type === 'document' ? 'Dokument' : activity.type === 'task' ? 'Zadanie' : 'Wiadomość'}
                              </Badge>
                            </div>
                            <p className="text-sm text-foreground/80 mt-1 line-clamp-2">
                              {activity.title}
                            </p>
                            <p className="text-xs text-muted-foreground/70 mt-1.5 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDistanceToNow(new Date(activity.createdAt), { locale: pl, addSuffix: true })}
                            </p>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                            {getActivityIcon(activity.type)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rankings Tab */}
          <TabsContent value="rankings">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Performers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    Najbardziej aktywni
                  </CardTitle>
                  <CardDescription>
                    Ranking na podstawie całkowitej aktywności
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topPerformers.map((profile, index) => (
                      <div 
                        key={profile.id}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors cursor-pointer group"
                        onClick={() => navigate(`/profile/${profile.id}`)}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold",
                          index === 0 ? "bg-amber-500/20 text-amber-400 ring-2 ring-amber-500/30" :
                          index === 1 ? "bg-zinc-400/20 text-zinc-300" :
                          index === 2 ? "bg-orange-500/20 text-orange-400" :
                          "bg-secondary text-muted-foreground"
                        )}>
                          {index === 0 ? <Trophy className="w-5 h-5" /> : index + 1}
                        </div>
                        <Avatar className="w-12 h-12 border-2 border-border group-hover:border-pink-500/50 transition-colors">
                          <AvatarImage src={profile.avatar_url || ""} />
                          <AvatarFallback className="bg-pink-500/20 text-pink-400">
                            {(profile.full_name || profile.email || "U").charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate group-hover:text-pink-400 transition-colors">
                            {profile.full_name || profile.email?.split("@")[0]}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-1">
                              <FileText className="w-3 h-3 text-blue-400" />
                              {userStats[profile.id]?.documentsCount || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              {userStats[profile.id]?.tasksCompleted || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3 text-pink-400" />
                              {userStats[profile.id]?.messagesCount || 0}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-foreground">{profile.totalActivity}</p>
                          <p className="text-[10px] text-muted-foreground uppercase">działań</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Team Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-cyan-400" />
                    Statystyki zespołu
                  </CardTitle>
                  <CardDescription>
                    Podsumowanie aktywności całego zespołu
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* This week progress */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-pink-500/10 to-rose-500/5 border border-pink-500/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-pink-400" />
                        <span className="font-medium">Ten tydzień</span>
                      </div>
                      <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/30">
                        +{weeklyDocuments + weeklyTasks} nowych
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-background/50">
                        <p className="text-2xl font-bold text-blue-400">{weeklyDocuments}</p>
                        <p className="text-xs text-muted-foreground">Dokumentów</p>
                      </div>
                      <div className="p-3 rounded-lg bg-background/50">
                        <p className="text-2xl font-bold text-emerald-400">{weeklyTasks}</p>
                        <p className="text-xs text-muted-foreground">Zadań ukończonych</p>
                      </div>
                    </div>
                  </div>

                  {/* Average stats */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-400" />
                        Śr. dokumentów / osoba
                      </span>
                      <span className="font-bold text-lg">
                        {profiles.length > 0 ? (totalDocuments / profiles.length).toFixed(1) : 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Śr. zadań / osoba
                      </span>
                      <span className="font-bold text-lg">
                        {profiles.length > 0 ? (totalTasksCompleted / profiles.length).toFixed(1) : 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-pink-400" />
                        Śr. wiadomości / osoba
                      </span>
                      <span className="font-bold text-lg">
                        {profiles.length > 0 ? (totalMessages / profiles.length).toFixed(1) : 0}
                      </span>
                    </div>
                  </div>

                  {/* Total summary */}
                  <div className="p-4 rounded-xl bg-secondary/30 border border-border/50">
                    <p className="text-sm text-muted-foreground mb-2">Łączna aktywność zespołu</p>
                    <p className="text-4xl font-bold bg-gradient-to-r from-pink-400 to-rose-500 bg-clip-text text-transparent">
                      {totalDocuments + totalTasksCompleted + totalMessages}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">wszystkich działań</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat">
            <Card className="overflow-hidden">
              <CardHeader className="pb-0">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-pink-400" />
                  Czat zespołowy
                </CardTitle>
                <CardDescription>
                  Komunikuj się z zespołem w czasie rzeczywistym
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[600px]">
                  <EmbeddedTeamChat />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
