import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Trash2, User, Edit2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import { toast } from "sonner";
import { processMentions } from "@/lib/notifications";
import { renderMentions } from "@/components/ui/Mention";

interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  profile?: {
    full_name: string | null;
    email: string | null;
  };
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface AnnouncementCommentsProps {
  announcementId: string;
}

export function AnnouncementComments({ announcementId }: AnnouncementCommentsProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchComments = async () => {
    const { data: commentsData, error } = await supabase
      .from("announcement_comments")
      .select("*")
      .eq("announcement_id", announcementId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching comments:", error);
      return;
    }

    const { data: profilesData } = await supabase.from("profiles").select("id, full_name, email");

    setProfiles(profilesData || []);

    const commentsWithProfiles = (commentsData || []).map((comment) => {
      const profile = profilesData?.find((p) => p.id === comment.user_id);
      return { ...comment, profile };
    });

    setComments(commentsWithProfiles);
    setLoading(false);
  };

  useEffect(() => {
    fetchComments();

    const channel = supabase
      .channel(`announcement-comments-${announcementId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "announcement_comments",
          filter: `announcement_id=eq.${announcementId}`,
        },
        () => fetchComments()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [announcementId]);

  const handleSubmit = async () => {
    if (!newComment.trim() || !user) return;

    const { error } = await supabase.from("announcement_comments").insert({
      announcement_id: announcementId,
      user_id: user.id,
      content: newComment.trim(),
    });

    if (error) {
      toast.error("Błąd podczas dodawania komentarza");
      return;
    }

    // Process mentions
    await processMentions(
      newComment,
      profiles,
      user.id,
      "komentarzu do komunikatu",
      "announcement",
      announcementId
    );

    setNewComment("");
    toast.success("Komentarz dodany");
  };

  const handleEdit = async () => {
    if (!editContent.trim() || !editingId) return;

    const { error } = await supabase
      .from("announcement_comments")
      .update({ content: editContent.trim() })
      .eq("id", editingId);

    if (error) {
      toast.error("Błąd podczas edycji");
      return;
    }

    setEditingId(null);
    setEditContent("");
    toast.success("Komentarz zaktualizowany");
  };

  const handleDelete = async (id: string) => {
    // Optimistic update - remove immediately from UI
    setComments(prev => prev.filter(c => c.id !== id));
    
    const { error } = await supabase.from("announcement_comments").delete().eq("id", id);

    if (error) {
      toast.error("Błąd podczas usuwania");
      // Revert on error
      fetchComments();
      return;
    }

    toast.success("Komentarz usunięty");
  };

  if (loading) {
    return <div className="text-xs text-muted-foreground">Ładowanie...</div>;
  }

  return (
    <div className="space-y-3 mt-3 pt-3 border-t border-border/50">
      {comments.length > 0 && (
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {comments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-2">
              <Avatar className="w-6 h-6 flex-shrink-0">
                <AvatarFallback className="bg-secondary text-[10px]">
                  <User className="w-3 h-3" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                {editingId === comment.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-[60px] text-xs"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleEdit} className="h-6 text-xs">
                        Zapisz
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingId(null)}
                        className="h-6 text-xs"
                      >
                        Anuluj
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-foreground">
                        {comment.profile?.full_name || comment.profile?.email?.split("@")[0] || "Użytkownik"}
                      </span>
                      <span className="text-[10px] text-muted-foreground/70">
                        {formatDistanceToNow(new Date(comment.created_at), {
                          locale: pl,
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {renderMentions(comment.content)}
                    </p>
                    {user?.id === comment.user_id && (
                      <div className="flex gap-1 mt-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-5 w-5"
                          onClick={() => {
                            setEditingId(comment.id);
                            setEditContent(comment.content);
                          }}
                        >
                          <Edit2 className="w-2.5 h-2.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-5 w-5 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(comment.id)}
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Textarea
          placeholder="Dodaj komentarz... (użyj @imię aby oznaczyć)"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[40px] text-xs resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        <Button size="icon" onClick={handleSubmit} disabled={!newComment.trim()} className="flex-shrink-0">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
