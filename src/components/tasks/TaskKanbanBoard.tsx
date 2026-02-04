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
  Building2
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

interface TaskKanbanBoardProps {
  tasks: Task[];
  employees: Employee[];
  clients: Client[];
  taskComments: Record<string, TaskComment[]>;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onToggleComplete: (task: Task, completed: boolean) => void;
  onOpenComments: (task: Task) => void;
  onStatusChange: (task: Task, newStatus: string) => void;
}

const priorityConfig = {
  low: { label: 'Niski', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  medium: { label: 'Średni', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  high: { label: 'Wysoki', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

const columns = [
  { id: 'todo', title: 'Do zrobienia', color: 'from-zinc-500/20 to-zinc-600/10', borderColor: 'border-zinc-500/30' },
  { id: 'in_progress', title: 'W trakcie', color: 'from-blue-500/20 to-blue-600/10', borderColor: 'border-blue-500/30' },
  { id: 'completed', title: 'Ukończone', color: 'from-emerald-500/20 to-emerald-600/10', borderColor: 'border-emerald-500/30' },
];

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

export function TaskKanbanBoard({
  tasks,
  employees,
  clients,
  taskComments,
  onEdit,
  onDelete,
  onToggleComplete,
  onOpenComments,
  onStatusChange,
}: TaskKanbanBoardProps) {
  const getTasksByStatus = (status: string) => tasks.filter(t => t.status === status);

  const renderTaskCard = (task: Task) => {
    const assignedEmployee = employees.find(e => e.id === task.assigned_to);
    const client = clients.find(c => c.id === task.client_id);
    const priority = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.medium;
    const isOverdue = task.due_date && task.status !== 'completed' && new Date(task.due_date) < new Date();
    const comments = taskComments[task.id] || [];

    return (
      <Card 
        key={task.id} 
        className="bg-zinc-900/80 border-zinc-700/50 hover:border-pink-500/30 transition-all group cursor-pointer"
      >
        <CardContent className="p-3 space-y-2">
          {/* Header with title */}
          <div className="flex items-start justify-between gap-2">
            <h4 className={`text-sm font-medium leading-tight flex-1 ${
              task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'
            }`}>
              {task.title}
            </h4>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onOpenComments(task)}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Komentarze ({comments.length})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(task)}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edytuj
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(task)} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Usuń
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Quick Status Actions */}
          <TaskQuickActions
            currentStatus={task.status}
            onStatusChange={(newStatus) => onStatusChange(task, newStatus)}
          />

          {/* Description */}
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
          )}

          {/* Badges */}
          <div className="flex flex-wrap gap-1">
            <Badge className={`text-[10px] px-1.5 py-0 ${priority.color}`}>
              {priority.label}
            </Badge>
            {task.is_agency_task && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5">
                <Users className="w-2.5 h-2.5" />
                Agencyjne
              </Badge>
            )}
          </div>

          {/* Client */}
          {client && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Building2 className="w-3 h-3 text-pink-400" />
              <span className="truncate">{client.salon_name}</span>
            </div>
          )}

          {/* Due date */}
          {task.due_date && (
            <div className={`flex items-center gap-1.5 text-xs ${isOverdue ? 'text-red-400' : 'text-muted-foreground'}`}>
              {isOverdue ? <AlertCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
              <span>{safeFormat(task.due_date, 'd MMM')}</span>
              {isOverdue && <span className="text-[10px]">(zaległe)</span>}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
            {assignedEmployee ? (
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-pink-500/20 flex items-center justify-center">
                  <User className="w-2.5 h-2.5 text-pink-400" />
                </div>
                <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">
                  {assignedEmployee.full_name || assignedEmployee.email}
                </span>
              </div>
            ) : (
              <span className="text-[10px] text-muted-foreground">Nieprzypisane</span>
            )}
            
            {comments.length > 0 && (
              <div className="flex items-center gap-1 text-pink-400">
                <MessageSquare className="w-3 h-3" />
                <span className="text-[10px]">{comments.length}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[500px]">
      {columns.map(column => {
        const columnTasks = getTasksByStatus(column.id);
        
        return (
          <div key={column.id} className="flex flex-col">
            {/* Column Header */}
            <div className={`p-3 rounded-t-lg bg-gradient-to-r ${column.color} border ${column.borderColor} border-b-0`}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">{column.title}</h3>
                <Badge variant="secondary" className="bg-zinc-800/50 text-xs">
                  {columnTasks.length}
                </Badge>
              </div>
            </div>

            {/* Column Content */}
            <div className={`flex-1 p-2 rounded-b-lg border ${column.borderColor} border-t-0 bg-zinc-950/50 space-y-2 min-h-[400px]`}>
              {columnTasks.length === 0 ? (
                <div className="flex items-center justify-center h-24 text-muted-foreground text-xs">
                  Brak zadań
                </div>
              ) : (
                columnTasks.map(renderTaskCard)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
