import { Card } from '@/components/ui/card';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  TrendingUp,
  ListTodo,
  Zap
} from 'lucide-react';

interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  overdue: number;
  highPriority: number;
  completedToday: number;
}

interface TaskStatsCardsProps {
  stats: TaskStats;
}

export function TaskStatsCards({ stats }: TaskStatsCardsProps) {
  const completionRate = stats.total > 0 
    ? Math.round((stats.completed / stats.total) * 100) 
    : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <Card className="p-4 bg-gradient-to-br from-zinc-900 to-zinc-800 border-zinc-700/50 hover:border-pink-500/30 transition-all">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
            <ListTodo className="w-5 h-5 text-pink-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Wszystkie</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-gradient-to-br from-emerald-950/50 to-zinc-900 border-emerald-500/20 hover:border-emerald-500/40 transition-all">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-400">{stats.completed}</p>
            <p className="text-xs text-muted-foreground">Ukończone</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-gradient-to-br from-blue-950/50 to-zinc-900 border-blue-500/20 hover:border-blue-500/40 transition-all">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Clock className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-400">{stats.inProgress}</p>
            <p className="text-xs text-muted-foreground">W trakcie</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-gradient-to-br from-red-950/50 to-zinc-900 border-red-500/20 hover:border-red-500/40 transition-all">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-red-400">{stats.overdue}</p>
            <p className="text-xs text-muted-foreground">Zaległe</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-gradient-to-br from-amber-950/50 to-zinc-900 border-amber-500/20 hover:border-amber-500/40 transition-all">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-400">{stats.highPriority}</p>
            <p className="text-xs text-muted-foreground">Wysokie</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-gradient-to-br from-purple-950/50 to-zinc-900 border-purple-500/20 hover:border-purple-500/40 transition-all">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-400">{completionRate}%</p>
            <p className="text-xs text-muted-foreground">Realizacja</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
