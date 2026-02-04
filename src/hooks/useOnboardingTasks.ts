import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_ONBOARDING_TASKS } from '@/lib/onboardingTasks';
import { toast } from 'sonner';

export function useOnboardingTasks() {
  const createOnboardingTasks = async (
    clientId: string,
    clientName: string,
    assignedTo: string | null,
    createdBy: string
  ) => {
    try {
      const tasksToInsert = DEFAULT_ONBOARDING_TASKS.map((task, index) => ({
        title: `[${clientName}] ${task.title}`,
        description: task.description,
        priority: task.priority,
        status: 'todo',
        client_id: clientId,
        assigned_to: assignedTo,
        created_by: createdBy,
        is_agency_task: false,
        due_date: calculateDueDate(index),
      }));

      const { error } = await supabase.from('tasks').insert(tasksToInsert);

      if (error) {
        console.error('Error creating onboarding tasks:', error);
        toast.error('Błąd tworzenia zadań onboardingowych');
        return false;
      }

      toast.success(`Utworzono ${tasksToInsert.length} zadań onboardingowych`);
      return true;
    } catch (err) {
      console.error('Unexpected error creating onboarding tasks:', err);
      toast.error('Nieoczekiwany błąd tworzenia zadań');
      return false;
    }
  };

  return { createOnboardingTasks };
}

// Calculate due date based on task order (spread over 2 weeks)
function calculateDueDate(index: number): string {
  const today = new Date();
  const daysToAdd = Math.floor(index / 2) + 1; // 2 tasks per day, starting tomorrow
  const dueDate = new Date(today);
  dueDate.setDate(today.getDate() + daysToAdd);
  return dueDate.toISOString().split('T')[0];
}
