import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  MoreVertical, 
  Pencil, 
  Trash2, 
  MessageSquare, 
  User, 
  Clock, 
  AlertCircle,
  Users,
  Building2,
  CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { TaskQuickActions } from './TaskQuickActions';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  assigned_to: string | null;
  created_by: string | null;
  is_agency_task: boolean;
  completed_at: string | null;
  completed_by: string | null;
  created_at: string;
  client_id: string | null;
}

interface Employee {
  id: string;
  email: string | null;
  full_name: string | null;
}

interface Client {
  id: string;
  salon_name: string;
}

interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  author_name?: string;
}

interface TaskListViewProps {
  tasks: Task[];
  employees: Employee[];
  clients: Client[];
  taskComments: Record<string, TaskComment[]>;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onToggleComplete: (task: Task, completed: boolean) => void;
  onOpenComments: (task: Task) => void;
  onStatusChange: (task: Task, newStatus: string) => void;
  showHistory?: boolean;
}

const statusConfig = {
  todo: { label: 'Do zrobienia', color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' },
  in_progress: { label: 'W trakcie', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  completed: { label: 'Ukończone', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
};

const priorityConfig = {
  low: { label: 'Niski', color: 'bg-emerald-500/20 text-emerald-400' },
  medium: { label: 'Średni', color: 'bg-amber-500/20 text-amber-400' },
  high: { label: 'Wysoki', color: 'bg-red-500/20 text-red-400' },
};

function safeFormat(dateString: string | null, pattern: string) {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return '';
    return format(d, pattern, { locale: pl });
  } catch {
    return '';
  }
}

export function TaskListView({
  tasks,
  employees,
  clients,
  taskComments,
  onEdit,
  onDelete,
  onToggleComplete,
  onOpenComments,
  onStatusChange,
  showHistory = false,
}: TaskListViewProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <CheckCircle2 className="w-16 h-16 mb-4 opacity-30" />
        <p className="text-lg font-medium">Brak zadań</p>
        <p className="text-sm">Wszystko zrobione!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map(task => {
        const assignedEmployee = employees.find(e => e.id === task.assigned_to);
        const creatorEmployee = employees.find(e => e.id === task.created_by);
        const completerEmployee = employees.find(e => e.id === task.completed_by);
        const client = clients.find(c => c.id === task.client_id);
        const status = statusConfig[task.status as keyof typeof statusConfig] || statusConfig.todo;
        const priority = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.medium;
        const isOverdue = task.due_date && task.status !== 'completed' && new Date(task.due_date) < new Date();
        const comments = taskComments[task.id] || [];

        return (
          <Card 
            key={task.id} 
            className="bg-zinc-900/60 border-zinc-700/50 hover:border-pink-500/30 transition-all group"
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">

                {/* Main content */}
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Title row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-medium ${
                        task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'
                      }`}>
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onOpenComments(task)}>
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Komentarze ({comments.length})
                        </DropdownMenuItem>
                        {!showHistory && (
                          <DropdownMenuItem onClick={() => onEdit(task)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edytuj
                          </DropdownMenuItem>
                        )}
                        {!showHistory && (
                          <DropdownMenuItem onClick={() => onDelete(task)} className="text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Usuń
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Quick Status Actions */}
                  {!showHistory && (
                    <TaskQuickActions
                      currentStatus={task.status}
                      onStatusChange={(newStatus) => onStatusChange(task, newStatus)}
                    />
                  )}

                  {/* Badges row */}
                  <div className="flex flex-wrap gap-2">
                    <Badge className={priority.color}>
                      {priority.label}
                    </Badge>
                    {task.is_agency_task && (
                      <Badge variant="outline" className="gap-1">
                        <Users className="w-3 h-3" />
                        Agencyjne
                      </Badge>
                    )}
                    {client && (
                      <Badge variant="outline" className="gap-1 text-pink-400 border-pink-500/30">
                        <Building2 className="w-3 h-3" />
                        {client.salon_name}
                      </Badge>
                    )}
                  </div>

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    {/* Creator */}
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-pink-500/20 flex items-center justify-center">
                        <User className="w-2.5 h-2.5 text-pink-400" />
                      </div>
                      <span>{creatorEmployee?.full_name || creatorEmployee?.email || 'Nieznany'}</span>
                    </div>

                    {/* Assigned */}
                    {assignedEmployee && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">→</span>
                        <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <User className="w-2.5 h-2.5 text-blue-400" />
                        </div>
                        <span className="text-blue-400">{assignedEmployee.full_name || assignedEmployee.email}</span>
                      </div>
                    )}

                    {/* Due date */}
                    {task.due_date && (
                      <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-400' : ''}`}>
                        {isOverdue ? <AlertCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                        <span>{safeFormat(task.due_date, 'd MMM yyyy')}</span>
                        {isOverdue && <span className="text-[10px]">(zaległe)</span>}
                      </div>
                    )}

                    {/* Comments count */}
                    {comments.length > 0 && (
                      <button 
                        onClick={() => onOpenComments(task)}
                        className="flex items-center gap-1 text-pink-400 hover:text-pink-300 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{comments.length}</span>
                      </button>
                    )}
                  </div>

                  {/* Completed info */}
                  {task.status === 'completed' && task.completed_at && (
                    <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 mt-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">
                        Ukończone przez {completerEmployee?.full_name || completerEmployee?.email || 'Nieznany'}
                      </span>
                      <span className="text-emerald-400/60">•</span>
                      <span className="text-emerald-400/60">{safeFormat(task.completed_at, 'dd.MM.yyyy HH:mm')}</span>
                    </div>
                  )}

                  {/* Last comment preview */}
                  {comments.length > 0 && (
                    <div 
                      className="flex items-start gap-2 border-t border-pink-500/20 pt-2 cursor-pointer hover:bg-pink-500/5 -mx-4 px-4 transition-colors"
                      onClick={() => onOpenComments(task)}
                    >
                      <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0 text-pink-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-pink-400">
                          {comments[0].author_name}
                        </p>
                        <p className="text-xs line-clamp-1 text-foreground/80">
                          {comments[0].comment}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
