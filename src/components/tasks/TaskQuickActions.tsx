import { Button } from '@/components/ui/button';
import { 
  Play, 
  CheckCircle2, 
  RotateCcw,
  Circle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskQuickActionsProps {
  currentStatus: string;
  onStatusChange: (newStatus: string) => void;
  disabled?: boolean;
}

export function TaskQuickActions({ 
  currentStatus, 
  onStatusChange,
  disabled = false 
}: TaskQuickActionsProps) {
  const actions = [
    { 
      status: 'todo', 
      label: 'Do zrobienia', 
      icon: Circle, 
      activeColor: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/50',
      hoverColor: 'hover:bg-zinc-500/10 hover:text-zinc-400'
    },
    { 
      status: 'in_progress', 
      label: 'W trakcie', 
      icon: Play, 
      activeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
      hoverColor: 'hover:bg-blue-500/10 hover:text-blue-400'
    },
    { 
      status: 'completed', 
      label: 'Ukończone', 
      icon: CheckCircle2, 
      activeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
      hoverColor: 'hover:bg-emerald-500/10 hover:text-emerald-400'
    },
  ];

  return (
    <div className="flex items-center gap-1">
      {actions.map(action => {
        const Icon = action.icon;
        const isActive = currentStatus === action.status;
        
        return (
          <Button
            key={action.status}
            variant="ghost"
            size="sm"
            disabled={disabled || isActive}
            onClick={(e) => {
              e.stopPropagation();
              onStatusChange(action.status);
            }}
            className={cn(
              "h-7 px-2 text-xs font-medium border transition-all",
              isActive 
                ? action.activeColor
                : `border-transparent text-muted-foreground ${action.hoverColor}`
            )}
          >
            <Icon className="w-3.5 h-3.5 mr-1" />
            {action.label}
          </Button>
        );
      })}
    </div>
  );
}