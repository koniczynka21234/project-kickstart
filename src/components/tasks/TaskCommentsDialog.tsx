import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  MessageSquare, 
  User, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  Send, 
  Loader2 
} from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { renderMentions } from '@/components/ui/Mention';

interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  updated_at: string;
  user?: {
    email: string | null;
    full_name: string | null;
  } | null;
}

interface Task {
  id: string;
  title: string;
}

interface TaskCommentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  comments: TaskComment[];
  loading: boolean;
  currentUserId?: string;
  newComment: string;
  setNewComment: (value: string) => void;
  editingCommentId: string | null;
  editingCommentText: string;
  setEditingCommentText: (value: string) => void;
  onAddComment: () => void;
  onStartEdit: (comment: TaskComment) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: (comment: TaskComment) => void;
}

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

export function TaskCommentsDialog({
  open,
  onOpenChange,
  task,
  comments,
  loading,
  currentUserId,
  newComment,
  setNewComment,
  editingCommentId,
  editingCommentText,
  setEditingCommentText,
  onAddComment,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: TaskCommentsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 border-b border-zinc-800">
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <p className="font-semibold">Komentarze</p>
              <p className="text-sm text-muted-foreground font-normal">{task?.title}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <MessageSquare className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-lg font-medium">Brak komentarzy</p>
              <p className="text-sm">Dodaj pierwszy komentarz</p>
            </div>
          ) : (
            comments.map((comment) => {
              const isOwn = comment.user_id === currentUserId;
              const author = comment.user?.full_name || comment.user?.email || 'Użytkownik';

              return (
                <Card
                  key={comment.id}
                  className="p-4 bg-gradient-to-br from-zinc-900 to-zinc-800 border-zinc-700/50 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500/20 to-rose-500/20 border border-pink-500/30 flex items-center justify-center">
                        <User className="w-4 h-4 text-pink-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{author}</p>
                        <p className="text-xs text-muted-foreground">
                          {safeFormat(comment.created_at, 'd MMMM yyyy, HH:mm')}
                          {comment.updated_at !== comment.created_at && ' (edytowany)'}
                        </p>
                      </div>
                    </div>
                    
                    {isOwn && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onStartEdit(comment)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edytuj
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDelete(comment)} className="text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Usuń
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  {editingCommentId === comment.id ? (
                    <div className="space-y-3">
                      <Textarea
                        value={editingCommentText}
                        onChange={(e) => setEditingCommentText(e.target.value)}
                        className="form-input-elegant"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={onSaveEdit}>
                          Zapisz
                        </Button>
                        <Button size="sm" variant="outline" onClick={onCancelEdit}>
                          Anuluj
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {renderMentions(comment.comment)}
                    </p>
                  )}
                </Card>
              );
            })
          )}
        </div>

        {/* New comment input */}
        <div className="pt-4 border-t border-zinc-800 space-y-3">
          <Label className="text-sm font-medium">Dodaj komentarz</Label>
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Wpisz komentarz... (użyj @nazwa aby wspomnieć)"
            className="form-input-elegant"
            rows={3}
          />
          <Button
            onClick={onAddComment}
            disabled={!newComment.trim() || !task}
            className="w-full"
          >
            <Send className="w-4 h-4 mr-2" />
            Wyślij komentarz
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
