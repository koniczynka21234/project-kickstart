import { useEffect, useMemo, useState, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { taskSchema } from '@/lib/validationSchemas';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { notifyTaskCompleted, notifyTaskAssigned, processMentions } from '@/lib/notifications';
import {
  Plus,
  CheckCircle2,
  Users,
  User,
  Loader2,
  LayoutGrid,
  List,
  History,
} from 'lucide-react';

import { TaskStatsCards } from '@/components/tasks/TaskStatsCards';
import { TaskKanbanBoard } from '@/components/tasks/TaskKanbanBoard';
import { TaskListView } from '@/components/tasks/TaskListView';
import { TaskDialog } from '@/components/tasks/TaskDialog';
import { TaskCommentsDialog } from '@/components/tasks/TaskCommentsDialog';

interface TaskRow {
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
  updated_at: string;
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

interface TaskCommentRow {
  id: string;
  task_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  updated_at: string;
  author_name?: string;
  user?: {
    email: string | null;
    full_name: string | null;
  } | null;
}

const UNASSIGNED_VALUE = 'unassigned';

export default function Tasks() {
  const { user } = useAuth();
  const { isSzef } = useUserRole();

  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskRow | null>(null);
  const [activeTab, setActiveTab] = useState<'my' | 'agency' | 'team' | 'history'>('my');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const [userFilter, setUserFilter] = useState<string>('all');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    due_date: '',
    assigned_to: UNASSIGNED_VALUE,
    is_agency_task: false,
    client_id: '',
  });

  const [isCommentsDialogOpen, setIsCommentsDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskRow | null>(null);
  const [comments, setComments] = useState<TaskCommentRow[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [taskComments, setTaskComments] = useState<Record<string, TaskCommentRow[]>>({});

  // ---------- DATA LOADING ----------

  useEffect(() => {
    void loadInitialData();
    
    if (!user) return;
    
    const channel = supabase
      .channel('task-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tasks',
          filter: `assigned_to=eq.${user.id}`,
        },
        (payload) => {
          const newTask = payload.new as TaskRow;
          if (newTask.created_by !== user.id) {
            toast.info(`Nowe zadanie przypisane: "${newTask.title}"`, { duration: 5000 });
            void loadInitialData();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [tasksRes, employeesRes, clientsRes] = await Promise.all([
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('id, email, full_name').order('full_name'),
        supabase.from('clients').select('id, salon_name').order('salon_name'),
      ]);

      if (tasksRes.error) {
        console.error('Error loading tasks', tasksRes.error);
        toast.error('Błąd ładowania zadań');
      } else {
        setTasks(tasksRes.data || []);
        void loadTaskComments(tasksRes.data || []);
      }

      if (!employeesRes.error) setEmployees(employeesRes.data || []);
      if (!clientsRes.error) setClients(clientsRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  const loadTaskComments = async (tasksList: TaskRow[]) => {
    const taskIds = tasksList.map(t => t.id);
    if (taskIds.length === 0) return;

    try {
      const { data, error } = await supabase
        .from('task_comments')
        .select('id, task_id, user_id, comment, created_at, updated_at')
        .in('task_id', taskIds)
        .order('created_at', { ascending: false });

      if (error) return;

      const commentsByTask: Record<string, TaskCommentRow[]> = {};
      const userIds = new Set<string>();

      (data || []).forEach((c: any) => {
        if (!commentsByTask[c.task_id]) commentsByTask[c.task_id] = [];
        commentsByTask[c.task_id].push(c);
        userIds.add(c.user_id);
      });

      if (userIds.size > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', Array.from(userIds));

        const profilesById = Object.fromEntries(
          (profilesData || []).map(p => [p.id, { full_name: p.full_name, email: p.email }])
        );

        Object.keys(commentsByTask).forEach(taskId => {
          commentsByTask[taskId] = commentsByTask[taskId].map(c => ({
            ...c,
            author_name: profilesById[c.user_id]?.full_name || profilesById[c.user_id]?.email || 'Nieznany'
          }));
        });
      }

      setTaskComments(commentsByTask);
    } catch (err) {
      console.error('Unexpected error loading task comments', err);
    }
  };

  // ---------- TASK CRUD ----------

  const openNewTaskDialog = () => {
    setEditingTask(null);
    setFormData({
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      due_date: '',
      assigned_to: UNASSIGNED_VALUE,
      is_agency_task: false,
      client_id: '',
    });
    setIsTaskDialogOpen(true);
  };

  const openEditTaskDialog = (task: TaskRow) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      due_date: task.due_date || '',
      assigned_to: task.assigned_to || UNASSIGNED_VALUE,
      is_agency_task: task.is_agency_task,
      client_id: task.client_id || '',
    });
    setIsTaskDialogOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      toast.error('Musisz być zalogowany');
      return;
    }

    const dataToValidate = {
      ...formData,
      assigned_to: formData.assigned_to === UNASSIGNED_VALUE ? null : formData.assigned_to || null,
      client_id: formData.client_id || null,
    };
    
    const validationResult = taskSchema.safeParse(dataToValidate);
    if (!validationResult.success) {
      toast.error(validationResult.error.errors[0].message);
      return;
    }

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      status: formData.status,
      priority: formData.priority,
      due_date: formData.due_date || null,
      assigned_to: formData.assigned_to === UNASSIGNED_VALUE ? null : formData.assigned_to || null,
      is_agency_task: formData.is_agency_task,
      created_by: editingTask?.created_by || user.id,
      client_id: formData.client_id || null,
    };

    try {
      if (editingTask) {
        const { error } = await supabase.from('tasks').update(payload).eq('id', editingTask.id);
        if (error) {
          toast.error('Błąd aktualizacji zadania: ' + error.message);
        } else {
          toast.success('Zadanie zaktualizowane');
          void loadInitialData();
          setIsTaskDialogOpen(false);
        }
      } else {
        const { data, error } = await supabase.from('tasks').insert({ ...payload, created_by: user.id }).select();
        if (error) {
          toast.error('Błąd dodawania zadania: ' + error.message);
        } else {
          const newTask = data?.[0];
          if (payload.assigned_to && payload.assigned_to !== user.id && newTask) {
            const currentUserProfile = employees.find(e => e.id === user.id);
            const assignerName = currentUserProfile?.full_name || currentUserProfile?.email || 'Użytkownik';
            await notifyTaskAssigned(newTask.id, formData.title, payload.assigned_to, assignerName, user.id);
          }
          toast.success('Zadanie dodane');
          void loadInitialData();
          setIsTaskDialogOpen(false);
        }
      }
    } catch (err) {
      toast.error('Nieoczekiwany błąd przy zapisie zadania');
    }
  };

  const handleDeleteTask = async (task: TaskRow) => {
    if (!confirm('Czy na pewno chcesz usunąć to zadanie?')) return;

    try {
      const { error } = await supabase.from('tasks').delete().eq('id', task.id);
      if (error) {
        toast.error('Błąd usuwania zadania: ' + error.message);
      } else {
        toast.success('Zadanie usunięte');
        void loadInitialData();
      }
    } catch (err) {
      toast.error('Nieoczekiwany błąd usuwania zadania');
    }
  };

  const handleToggleCompleted = async (task: TaskRow, completed: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          status: completed ? 'completed' : 'todo',
          completed_at: completed ? new Date().toISOString() : null,
          completed_by: completed ? user.id : null,
        })
        .eq('id', task.id);

      if (error) {
        toast.error('Błąd aktualizacji statusu');
      } else {
        toast.success(completed ? 'Zadanie ukończone' : 'Zadanie wznowione');
        if (completed) {
          const currentUserProfile = employees.find(e => e.id === user.id);
          const completedByName = currentUserProfile?.full_name || currentUserProfile?.email || 'Użytkownik';
          await notifyTaskCompleted(task.id, task.title, user.id, completedByName, task.created_by, task.assigned_to);
        }
        void loadInitialData();
      }
    } catch (err) {
      toast.error('Nieoczekiwany błąd aktualizacji statusu');
    }
  };

  const handleStatusChange = async (task: TaskRow, newStatus: string) => {
    if (!user) return;
    
    const updateData: any = { status: newStatus };
    if (newStatus === 'completed') {
      updateData.completed_at = new Date().toISOString();
      updateData.completed_by = user.id;
    } else if (task.status === 'completed') {
      updateData.completed_at = null;
      updateData.completed_by = null;
    }

    try {
      const { error } = await supabase.from('tasks').update(updateData).eq('id', task.id);
      if (!error) {
        toast.success('Status zaktualizowany');
        void loadInitialData();
      }
    } catch (err) {
      toast.error('Błąd zmiany statusu');
    }
  };

  // ---------- COMMENTS ----------

  const openComments = async (task: TaskRow) => {
    setSelectedTask(task);
    setIsCommentsDialogOpen(true);
    setComments([]);
    setNewComment('');
    setEditingCommentId(null);
    setEditingCommentText('');
    await loadComments(task.id);
  };

  const loadComments = async (taskId: string) => {
    setCommentsLoading(true);
    try {
      const { data, error } = await supabase
        .from('task_comments')
        .select('id, task_id, user_id, comment, created_at, updated_at')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) {
        toast.error('Błąd ładowania komentarzy');
        return;
      }

      const userIds = Array.from(new Set((data || []).map(c => c.user_id)));
      let profilesById: Record<string, { full_name: string | null; email: string | null }> = {};

      if (userIds.length) {
        const { data: profilesData } = await supabase.from('profiles').select('id, full_name, email').in('id', userIds);
        profilesById = Object.fromEntries((profilesData || []).map(p => [p.id, { full_name: p.full_name, email: p.email }]));
      }

      const mapped: TaskCommentRow[] = (data || []).map((c: any) => ({
        ...c,
        user: profilesById[c.user_id] || null,
      }));

      setComments(mapped);
    } catch (err) {
      toast.error('Nieoczekiwany błąd ładowania komentarzy');
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!user?.id || !selectedTask) return;
    const text = newComment.trim();
    if (!text) return;

    try {
      const { error } = await supabase.from('task_comments').insert({
        task_id: selectedTask.id,
        user_id: user.id,
        comment: text,
      });

      if (error) {
        toast.error('Błąd dodawania komentarza: ' + error.message);
      } else {
        const profiles = employees.map(e => ({ id: e.id, full_name: e.full_name, email: e.email }));
        await processMentions(text, profiles, user.id, `komentarzu do zadania "${selectedTask.title}"`, 'task_comment', selectedTask.id);
        setNewComment('');
        await loadComments(selectedTask.id);
      }
    } catch (err) {
      toast.error('Nieoczekiwany błąd dodawania komentarza');
    }
  };

  const handleStartEditComment = (comment: TaskCommentRow) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.comment);
  };

  const handleSaveComment = async () => {
    if (!editingCommentId || !editingCommentText.trim() || !selectedTask) return;

    try {
      const { error } = await supabase.from('task_comments').update({ comment: editingCommentText.trim() }).eq('id', editingCommentId);
      if (!error) {
        setEditingCommentId(null);
        setEditingCommentText('');
        await loadComments(selectedTask.id);
      }
    } catch (err) {
      toast.error('Nieoczekiwany błąd aktualizacji komentarza');
    }
  };

  const handleDeleteComment = async (comment: TaskCommentRow) => {
    if (!selectedTask || !confirm('Czy na pewno chcesz usunąć ten komentarz?')) return;

    try {
      const { error } = await supabase.from('task_comments').delete().eq('id', comment.id);
      if (!error) await loadComments(selectedTask.id);
    } catch (err) {
      toast.error('Nieoczekiwany błąd usuwania komentarza');
    }
  };

  // ---------- DERIVED DATA ----------

  const stats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'completed').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      overdue: tasks.filter(t => t.due_date && t.status !== 'completed' && new Date(t.due_date) < now).length,
      highPriority: tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length,
      completedToday: tasks.filter(t => t.completed_at && new Date(t.completed_at) >= todayStart).length,
    };
  }, [tasks]);

  const activeTasks = useMemo(() => tasks.filter(t => t.status !== 'completed'), [tasks]);
  const completedTasks = useMemo(() => tasks.filter(t => t.status === 'completed'), [tasks]);

  const myTasks = useMemo(
    () => activeTasks.filter(t => t.assigned_to === user?.id || (t.created_by === user?.id && !t.is_agency_task && !t.assigned_to)),
    [activeTasks, user?.id]
  );

  const agencyTasks = useMemo(() => activeTasks.filter(t => t.is_agency_task), [activeTasks]);

  const teamTasks = useMemo(() => {
    if (userFilter === 'all') return activeTasks;
    return activeTasks.filter(t => t.assigned_to === userFilter || t.created_by === userFilter);
  }, [activeTasks, userFilter]);

  const filteredHistoryTasks = useMemo(() => {
    if (userFilter === 'all') return completedTasks;
    return completedTasks.filter(t => t.assigned_to === userFilter || t.created_by === userFilter);
  }, [completedTasks, userFilter]);

  const visibleTasks = useMemo(() => {
    switch (activeTab) {
      case 'agency': return agencyTasks;
      case 'team': return teamTasks;
      case 'history': return filteredHistoryTasks;
      default: return myTasks;
    }
  }, [activeTab, agencyTasks, teamTasks, filteredHistoryTasks, myTasks]);

  // ---------- RENDER ----------

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mobile-page py-4 space-y-4 sm:space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold text-foreground">Zadania</h1>
            <p className="text-muted-foreground text-sm">Zarządzaj zadaniami swoimi i zespołu</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90 w-full sm:w-auto" onClick={openNewTaskDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Nowe zadanie
          </Button>
        </div>

        {/* Stats */}
        <TaskStatsCards stats={stats} />

        {/* Tabs & Controls */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <div className="flex flex-col gap-3 sm:gap-4 mb-4">
            <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
              <TabsList className="bg-zinc-900/50 border border-zinc-700/50 w-max sm:w-auto">
                <TabsTrigger value="my" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-400">
                  <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Moje</span> ({myTasks.length})
                </TabsTrigger>
                <TabsTrigger value="agency" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-400">
                  <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Agencyjne</span> ({agencyTasks.length})
                </TabsTrigger>
                {isSzef && (
                  <TabsTrigger value="team" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-400">
                    <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Zespół</span> ({activeTasks.length})
                  </TabsTrigger>
                )}
                <TabsTrigger value="history" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-400">
                  <History className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Historia</span> ({completedTasks.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
              {/* User filter */}
              {(activeTab === 'history' || (activeTab === 'team' && isSzef)) && (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Label className="text-sm text-muted-foreground whitespace-nowrap hidden sm:block">Filtruj:</Label>
                  <Select value={userFilter} onValueChange={setUserFilter}>
                    <SelectTrigger className="w-full sm:w-48 bg-zinc-900 border-zinc-700">
                      <SelectValue placeholder="Wszyscy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Wszyscy</SelectItem>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.full_name || emp.email || 'Nieznany'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* View toggle */}
              {activeTab !== 'history' && (
                <div className="flex items-center bg-zinc-900 border border-zinc-700 rounded-lg p-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-8 px-3 ${viewMode === 'kanban' ? 'bg-pink-500/20 text-pink-400' : ''}`}
                    onClick={() => setViewMode('kanban')}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-8 px-3 ${viewMode === 'list' ? 'bg-pink-500/20 text-pink-400' : ''}`}
                    onClick={() => setViewMode('list')}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <TabsContent value="my" className="mt-0 overflow-x-hidden">
            {viewMode === 'kanban' ? (
              <TaskKanbanBoard
                tasks={myTasks}
                employees={employees}
                clients={clients}
                taskComments={taskComments}
                onEdit={openEditTaskDialog}
                onDelete={handleDeleteTask}
                onToggleComplete={handleToggleCompleted}
                onOpenComments={openComments}
                onStatusChange={handleStatusChange}
              />
            ) : (
              <TaskListView
                tasks={myTasks}
                employees={employees}
                clients={clients}
                taskComments={taskComments}
                onEdit={openEditTaskDialog}
                onDelete={handleDeleteTask}
                onToggleComplete={handleToggleCompleted}
                onOpenComments={openComments}
                onStatusChange={handleStatusChange}
              />
            )}
          </TabsContent>

          <TabsContent value="agency" className="mt-0">
            {viewMode === 'kanban' ? (
              <TaskKanbanBoard
                tasks={agencyTasks}
                employees={employees}
                clients={clients}
                taskComments={taskComments}
                onEdit={openEditTaskDialog}
                onDelete={handleDeleteTask}
                onToggleComplete={handleToggleCompleted}
                onOpenComments={openComments}
                onStatusChange={handleStatusChange}
              />
            ) : (
              <TaskListView
                tasks={agencyTasks}
                employees={employees}
                clients={clients}
                taskComments={taskComments}
                onEdit={openEditTaskDialog}
                onDelete={handleDeleteTask}
                onToggleComplete={handleToggleCompleted}
                onOpenComments={openComments}
                onStatusChange={handleStatusChange}
              />
            )}
          </TabsContent>

          {isSzef && (
            <TabsContent value="team" className="mt-0">
              {viewMode === 'kanban' ? (
                <TaskKanbanBoard
                  tasks={teamTasks}
                  employees={employees}
                  clients={clients}
                  taskComments={taskComments}
                  onEdit={openEditTaskDialog}
                  onDelete={handleDeleteTask}
                  onToggleComplete={handleToggleCompleted}
                  onOpenComments={openComments}
                  onStatusChange={handleStatusChange}
                />
              ) : (
                <TaskListView
                  tasks={teamTasks}
                  employees={employees}
                  clients={clients}
                  taskComments={taskComments}
                  onEdit={openEditTaskDialog}
                  onDelete={handleDeleteTask}
                  onToggleComplete={handleToggleCompleted}
                  onOpenComments={openComments}
                  onStatusChange={handleStatusChange}
                />
              )}
            </TabsContent>
          )}

          <TabsContent value="history" className="mt-0">
            <TaskListView
              tasks={filteredHistoryTasks}
              employees={employees}
              clients={clients}
              taskComments={taskComments}
              onEdit={openEditTaskDialog}
              onDelete={handleDeleteTask}
              onToggleComplete={handleToggleCompleted}
              onOpenComments={openComments}
              onStatusChange={handleStatusChange}
              showHistory
            />
          </TabsContent>
        </Tabs>

        {/* Task Dialog */}
        <TaskDialog
          open={isTaskDialogOpen}
          onOpenChange={(open) => {
            setIsTaskDialogOpen(open);
            if (!open) setEditingTask(null);
          }}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSaveTask}
          isEditing={!!editingTask}
          employees={employees}
          clients={clients}
          isSzef={isSzef}
          currentUserId={user?.id}
        />

        {/* Comments Dialog */}
        <TaskCommentsDialog
          open={isCommentsDialogOpen}
          onOpenChange={(open) => {
            setIsCommentsDialogOpen(open);
            if (!open) {
              setSelectedTask(null);
              setComments([]);
              setNewComment('');
              setEditingCommentId(null);
              setEditingCommentText('');
            }
          }}
          task={selectedTask}
          comments={comments}
          loading={commentsLoading}
          currentUserId={user?.id}
          newComment={newComment}
          setNewComment={setNewComment}
          editingCommentId={editingCommentId}
          editingCommentText={editingCommentText}
          setEditingCommentText={setEditingCommentText}
          onAddComment={handleAddComment}
          onStartEdit={handleStartEditComment}
          onSaveEdit={handleSaveComment}
          onCancelEdit={() => {
            setEditingCommentId(null);
            setEditingCommentText('');
          }}
          onDelete={handleDeleteComment}
        />
      </div>
    </AppLayout>
  );
}
