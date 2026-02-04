import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  Send, 
  FileText, 
  Users, 
  UserPlus,
  Target,
  Reply,
  Trash2,
  Search,
  Smile,
  CheckSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, isToday, isYesterday } from "date-fns";
import { pl } from "date-fns/locale";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { renderMentions } from "@/components/ui/Mention";

interface Reaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  profile?: {
    full_name: string | null;
  };
}

interface TeamMessage {
  id: string;
  user_id: string;
  content: string;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
  reply_to_id: string | null;
  profile?: {
    full_name: string | null;
    email: string | null;
  };
  reactions?: Reaction[];
  referenceName?: string;
}

interface ReferenceItem {
  id: string;
  name: string;
}

const EMOJI_OPTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "👏", "🎉"];

const getInitials = (name: string | null | undefined, email: string | null | undefined) => {
  if (name) {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return "??";
};

const formatMessageDate = (dateStr: string) => {
  const date = new Date(dateStr);
  if (isToday(date)) return "Dzisiaj";
  if (isYesterday(date)) return "Wczoraj";
  return format(date, "d MMMM yyyy", { locale: pl });
};

const groupMessagesByDate = (messages: TeamMessage[]) => {
  const groups: { date: string; messages: TeamMessage[] }[] = [];
  let currentDate = "";
  
  messages.forEach(msg => {
    const msgDate = formatMessageDate(msg.created_at);
    if (msgDate !== currentDate) {
      currentDate = msgDate;
      groups.push({ date: msgDate, messages: [msg] });
    } else {
      groups[groups.length - 1].messages.push(msg);
    }
  });
  
  return groups;
};

export function EmbeddedTeamChat() {
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [selectedReference, setSelectedReference] = useState<{
    type: string;
    id: string;
    name: string;
  } | null>(null);
  const [replyTo, setReplyTo] = useState<TeamMessage | null>(null);
  const [references, setReferences] = useState<{
    documents: ReferenceItem[];
    clients: ReferenceItem[];
    leads: ReferenceItem[];
    campaigns: ReferenceItem[];
    tasks: ReferenceItem[];
  }>({ documents: [], clients: [], leads: [], campaigns: [], tasks: [] });
  const [teamMembers, setTeamMembers] = useState<{ id: string; name: string }[]>([]);
  
  const { user } = useAuth();
  const { isSzef } = useUserRole();
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const fetchMessages = useCallback(async () => {
    const { data: messagesData, error } = await supabase
      .from("team_messages")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(200);

    if (error) {
      console.error("Error fetching messages:", error);
      return;
    }

    const userIds = [...new Set(messagesData?.map(m => m.user_id) || [])];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]));

    const messageIds = messagesData?.map(m => m.id) || [];
    const { data: reactionsData } = await supabase
      .from("message_reactions")
      .select("*")
      .in("message_id", messageIds);

    const referenceGroups = {
      document: new Set<string>(),
      client: new Set<string>(),
      lead: new Set<string>(),
      campaign: new Set<string>(),
      task: new Set<string>(),
    };

    messagesData?.forEach(msg => {
      if (msg.reference_type && msg.reference_id) {
        referenceGroups[msg.reference_type as keyof typeof referenceGroups]?.add(msg.reference_id);
      }
    });

    const [docsRes, clientsRes, leadsRes, campaignsRes, tasksRes] = await Promise.all([
      referenceGroups.document.size > 0 
        ? supabase.from("documents").select("id, title").in("id", [...referenceGroups.document])
        : { data: [] },
      referenceGroups.client.size > 0
        ? supabase.from("clients").select("id, salon_name").in("id", [...referenceGroups.client])
        : { data: [] },
      referenceGroups.lead.size > 0
        ? supabase.from("leads").select("id, salon_name").in("id", [...referenceGroups.lead])
        : { data: [] },
      referenceGroups.campaign.size > 0
        ? supabase.from("campaigns").select("id, name").in("id", [...referenceGroups.campaign])
        : { data: [] },
      referenceGroups.task.size > 0
        ? supabase.from("tasks").select("id, title").in("id", [...referenceGroups.task])
        : { data: [] },
    ]);

    const referenceNames = new Map<string, string>();
    docsRes.data?.forEach(d => referenceNames.set(d.id, d.title));
    clientsRes.data?.forEach(c => referenceNames.set(c.id, c.salon_name));
    leadsRes.data?.forEach(l => referenceNames.set(l.id, l.salon_name));
    campaignsRes.data?.forEach(c => referenceNames.set(c.id, c.name));
    tasksRes.data?.forEach(t => referenceNames.set(t.id, t.title));

    const reactionsMap = new Map<string, Reaction[]>();
    reactionsData?.forEach(r => {
      const existing = reactionsMap.get(r.message_id) || [];
      existing.push({
        ...r,
        profile: profileMap.get(r.user_id),
      });
      reactionsMap.set(r.message_id, existing);
    });

    const enrichedMessages = (messagesData || []).map(msg => ({
      ...msg,
      profile: profileMap.get(msg.user_id),
      reactions: reactionsMap.get(msg.id) || [],
      referenceName: msg.reference_id ? referenceNames.get(msg.reference_id) : undefined,
    }));

    setMessages(enrichedMessages);
    setLoading(false);

    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 100);
  }, []);

  const fetchReferences = async () => {
    const [docsRes, clientsRes, leadsRes, campaignsRes, tasksRes, profilesRes] = await Promise.all([
      supabase.from("documents").select("id, title").order("created_at", { ascending: false }).limit(15),
      supabase.from("clients").select("id, salon_name").order("created_at", { ascending: false }).limit(15),
      supabase.from("leads").select("id, salon_name").order("created_at", { ascending: false }).limit(15),
      supabase.from("campaigns").select("id, name").order("created_at", { ascending: false }).limit(15),
      supabase.from("tasks").select("id, title").order("created_at", { ascending: false }).limit(15),
      supabase.from("profiles").select("id, full_name, email"),
    ]);

    setReferences({
      documents: docsRes.data?.map(d => ({ id: d.id, name: d.title })) || [],
      clients: clientsRes.data?.map(c => ({ id: c.id, name: c.salon_name })) || [],
      leads: leadsRes.data?.map(l => ({ id: l.id, name: l.salon_name })) || [],
      campaigns: campaignsRes.data?.map(c => ({ id: c.id, name: c.name })) || [],
      tasks: tasksRes.data?.map(t => ({ id: t.id, name: t.title })) || [],
    });

    setTeamMembers(
      profilesRes.data?.map(p => ({ 
        id: p.id, 
        name: p.full_name || p.email?.split("@")[0] || "Użytkownik" 
      })) || []
    );
  };

  useEffect(() => {
    fetchMessages();
    fetchReferences();

    const channel = supabase
      .channel("embedded-team-chat")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "team_messages" },
        () => fetchMessages()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "message_reactions" },
        () => fetchMessages()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMessages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user) return;

    setSending(true);
    const messageContent = newMessage.trim();
    
    const { data: messageData, error } = await supabase.from("team_messages").insert({
      user_id: user.id,
      content: messageContent,
      reference_type: selectedReference?.type || null,
      reference_id: selectedReference?.id || null,
      reply_to_id: replyTo?.id || null,
    }).select().single();

    if (error) {
      toast.error("Błąd wysyłania wiadomości");
    } else {
      // Check for mentions and create notifications
      const mentionRegex = /@(\w+)/g;
      let match;
      const mentionedNames: string[] = [];
      
      while ((match = mentionRegex.exec(messageContent)) !== null) {
        mentionedNames.push(match[1].toLowerCase());
      }
      
      if (mentionedNames.length > 0) {
        const mentionedUsers = teamMembers.filter(m => 
          mentionedNames.some(name => 
            m.name.toLowerCase().replace(/\s/g, "").includes(name) ||
            name.includes(m.name.toLowerCase().replace(/\s/g, ""))
          )
        );
        
        for (const mentionedUser of mentionedUsers) {
          if (mentionedUser.id !== user.id) {
            await supabase.from("notifications").insert({
              user_id: mentionedUser.id,
              type: "mention",
              title: `${user.email?.split("@")[0] || "Użytkownik"} oznaczył/a Cię w wiadomości`,
              content: messageContent.slice(0, 100) + (messageContent.length > 100 ? "..." : ""),
              reference_type: "chat",
              reference_id: messageData?.id || null,
              created_by: user.id,
            });
          }
        }
      }
      
      setNewMessage("");
      setSelectedReference(null);
      setReplyTo(null);
    }
    setSending(false);
  };

  const handleDelete = async (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
    const { error } = await supabase.from("team_messages").delete().eq("id", id);
    if (error) {
      toast.error("Błąd usuwania");
      fetchMessages();
    } else {
      toast.success("Wiadomość usunięta");
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;

    const existingReaction = messages
      .find(m => m.id === messageId)
      ?.reactions?.find(r => r.user_id === user.id && r.emoji === emoji);

    if (existingReaction) {
      await supabase.from("message_reactions").delete().eq("id", existingReaction.id);
    } else {
      await supabase.from("message_reactions").insert({
        message_id: messageId,
        user_id: user.id,
        emoji,
      });
    }
  };

  const handleReferenceClick = (type: string | null, id: string | null) => {
    if (!type || !id) return;
    
    switch (type) {
      case "document":
        navigate("/document-history");
        break;
      case "client":
        navigate(`/clients/${id}`);
        break;
      case "lead":
        navigate(`/leads/${id}`);
        break;
      case "campaign":
        navigate("/campaigns");
        break;
      case "task":
        navigate("/tasks");
        break;
    }
  };

  const getRefIcon = (type: string | null) => {
    switch (type) {
      case "document": return <FileText className="w-3.5 h-3.5" />;
      case "client": return <Users className="w-3.5 h-3.5" />;
      case "lead": return <UserPlus className="w-3.5 h-3.5" />;
      case "campaign": return <Target className="w-3.5 h-3.5" />;
      case "task": return <CheckSquare className="w-3.5 h-3.5" />;
      default: return null;
    }
  };

  const getRefLabel = (type: string | null) => {
    switch (type) {
      case "document": return "Dokument";
      case "client": return "Klient";
      case "lead": return "Lead";
      case "campaign": return "Kampania";
      case "task": return "Zadanie";
      default: return "";
    }
  };

  const filteredMessages = searchQuery
    ? messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  const groupedMessages = groupMessagesByDate(filteredMessages);

  const groupReactions = (reactions: Reaction[]) => {
    const grouped: { emoji: string; count: number; users: string[]; userIds: string[] }[] = [];
    reactions.forEach(r => {
      const existing = grouped.find(g => g.emoji === r.emoji);
      if (existing) {
        existing.count++;
        existing.users.push(r.profile?.full_name || "Użytkownik");
        existing.userIds.push(r.user_id);
      } else {
        grouped.push({ 
          emoji: r.emoji, 
          count: 1, 
          users: [r.profile?.full_name || "Użytkownik"],
          userIds: [r.user_id] 
        });
      }
    });
    return grouped;
  };

  const findReplyMessage = (replyToId: string | null) => {
    if (!replyToId) return null;
    return messages.find(m => m.id === replyToId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Ładowanie czatu...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="p-3 border-b border-border/50">
        {showSearch ? (
          <div className="flex gap-2">
            <Input
              placeholder="Szukaj wiadomości..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
              autoFocus
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowSearch(false);
                setSearchQuery("");
              }}
            >
              Anuluj
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowSearch(true)}
            className="w-full justify-start text-muted-foreground"
          >
            <Search className="w-4 h-4 mr-2" />
            Szukaj wiadomości
          </Button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {groupedMessages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Brak wiadomości. Rozpocznij rozmowę!
          </div>
        ) : (
          groupedMessages.map((group, gi) => (
            <div key={gi}>
              <div className="flex items-center gap-2 my-4">
                <div className="flex-1 h-px bg-border/50" />
                <span className="text-xs text-muted-foreground px-2">{group.date}</span>
                <div className="flex-1 h-px bg-border/50" />
              </div>
              {group.messages.map((msg) => {
                const isOwn = msg.user_id === user?.id;
                const replyMessage = findReplyMessage(msg.reply_to_id);
                const groupedReactions = groupReactions(msg.reactions || []);

                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex gap-2 mb-3 group",
                      isOwn ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarFallback className={isOwn ? "bg-pink-500/20 text-pink-400" : "bg-secondary"}>
                        {getInitials(msg.profile?.full_name, msg.profile?.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className={cn("flex flex-col max-w-[70%]", isOwn ? "items-end" : "items-start")}>
                      <span className="text-xs text-muted-foreground mb-1">
                        {msg.profile?.full_name || msg.profile?.email?.split("@")[0] || "Użytkownik"}
                        <span className="mx-1">•</span>
                        {format(new Date(msg.created_at), "HH:mm")}
                      </span>

                      {replyMessage && (
                        <div className={cn(
                          "text-xs px-2 py-1 rounded mb-1 opacity-70 border-l-2 border-pink-500",
                          isOwn ? "bg-pink-500/10" : "bg-secondary/50"
                        )}>
                          <span className="font-medium">
                            {replyMessage.profile?.full_name || "Użytkownik"}:
                          </span>{" "}
                          {replyMessage.content.slice(0, 50)}
                          {replyMessage.content.length > 50 && "..."}
                        </div>
                      )}

                      {msg.reference_type && msg.referenceName && (
                        <button
                          onClick={() => handleReferenceClick(msg.reference_type, msg.reference_id)}
                          className={cn(
                            "flex items-center gap-1.5 text-xs px-2 py-1 rounded mb-1 hover:opacity-80 transition-opacity",
                            isOwn ? "bg-pink-500/20 text-pink-300" : "bg-secondary text-muted-foreground"
                          )}
                        >
                          {getRefIcon(msg.reference_type)}
                          <span>{getRefLabel(msg.reference_type)}:</span>
                          <span className="font-medium truncate max-w-[150px]">{msg.referenceName}</span>
                        </button>
                      )}

                      <div
                        className={cn(
                          "px-3 py-2 rounded-xl text-sm",
                          isOwn
                            ? "bg-pink-500/20 text-foreground rounded-tr-none"
                            : "bg-secondary text-foreground rounded-tl-none"
                        )}
                      >
                        {renderMentions(msg.content, isOwn ? "chat-own" : "chat-other")}
                      </div>

                      {groupedReactions.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {groupedReactions.map((r, ri) => (
                            <button
                              key={ri}
                              onClick={() => handleReaction(msg.id, r.emoji)}
                              className={cn(
                                "text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1 transition-colors",
                                r.userIds.includes(user?.id || "")
                                  ? "bg-pink-500/30 border border-pink-500/50"
                                  : "bg-secondary/80 hover:bg-secondary"
                              )}
                              title={r.users.join(", ")}
                            >
                              <span>{r.emoji}</span>
                              {r.count > 1 && <span>{r.count}</span>}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className={cn(
                        "flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity",
                        isOwn ? "flex-row-reverse" : "flex-row"
                      )}>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-6 w-6">
                              <Smile className="w-3 h-3" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-2" side="top">
                            <div className="flex gap-1">
                              {EMOJI_OPTIONS.map(emoji => (
                                <button
                                  key={emoji}
                                  onClick={() => handleReaction(msg.id, emoji)}
                                  className="text-lg hover:scale-125 transition-transform p-1"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>

                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => setReplyTo(msg)}
                        >
                          <Reply className="w-3 h-3" />
                        </Button>

                        {(isOwn || isSzef) && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(msg.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </ScrollArea>

      {/* Reply indicator */}
      {replyTo && (
        <div className="px-4 py-2 border-t border-border/50 bg-secondary/30 flex items-center justify-between">
          <div className="text-xs">
            <span className="text-muted-foreground">Odpowiedź do </span>
            <span className="font-medium">{replyTo.profile?.full_name || "Użytkownik"}</span>
            <span className="text-muted-foreground">: {replyTo.content.slice(0, 30)}...</span>
          </div>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setReplyTo(null)}>
            ×
          </Button>
        </div>
      )}

      {/* Reference indicator */}
      {selectedReference && (
        <div className="px-4 py-2 border-t border-border/50 bg-pink-500/10 flex items-center justify-between">
          <div className="text-xs flex items-center gap-2">
            {getRefIcon(selectedReference.type)}
            <span className="font-medium">{selectedReference.name}</span>
          </div>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setSelectedReference(null)}>
            ×
          </Button>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-border/50">
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="flex-shrink-0">
                <FileText className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <FileText className="w-4 h-4 mr-2" />
                  Dokumenty
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {references.documents.slice(0, 5).map(item => (
                    <DropdownMenuItem
                      key={item.id}
                      onClick={() => setSelectedReference({ type: "document", id: item.id, name: item.name })}
                    >
                      {item.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Users className="w-4 h-4 mr-2" />
                  Klienci
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {references.clients.slice(0, 5).map(item => (
                    <DropdownMenuItem
                      key={item.id}
                      onClick={() => setSelectedReference({ type: "client", id: item.id, name: item.name })}
                    >
                      {item.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Leady
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {references.leads.slice(0, 5).map(item => (
                    <DropdownMenuItem
                      key={item.id}
                      onClick={() => setSelectedReference({ type: "lead", id: item.id, name: item.name })}
                    >
                      {item.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Target className="w-4 h-4 mr-2" />
                  Kampanie
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {references.campaigns.slice(0, 5).map(item => (
                    <DropdownMenuItem
                      key={item.id}
                      onClick={() => setSelectedReference({ type: "campaign", id: item.id, name: item.name })}
                    >
                      {item.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <CheckSquare className="w-4 h-4 mr-2" />
                  Zadania
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {references.tasks.slice(0, 5).map(item => (
                    <DropdownMenuItem
                      key={item.id}
                      onClick={() => setSelectedReference({ type: "task", id: item.id, name: item.name })}
                    >
                      {item.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>

          <Input
            placeholder="Napisz wiadomość... (@ aby oznaczyć)"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={sending}
            className="flex-1"
          />

          <Button size="icon" onClick={handleSend} disabled={!newMessage.trim() || sending}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
