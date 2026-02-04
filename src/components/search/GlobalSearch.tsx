import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, FileText, Users, Target, Receipt, FileSignature, Presentation, Loader2, User, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface SearchResult {
  id: string;
  type: "client" | "document" | "campaign" | "lead" | "user";
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    const searchResults: SearchResult[] = [];
    const searchTerm = `%${searchQuery}%`;

    try {
      // Check if search query is a UUID (for ID search)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(searchQuery);
      
      // Search users/profiles
      let profileQuery = supabase
        .from("profiles")
        .select("id, full_name, email, position")
        .limit(5);
      
      if (isUUID) {
        profileQuery = profileQuery.eq("id", searchQuery);
      } else {
        profileQuery = profileQuery.or(`full_name.ilike.${searchTerm},email.ilike.${searchTerm}`);
      }
      
      const { data: profiles } = await profileQuery;

      profiles?.forEach((p) => {
        searchResults.push({
          id: p.id,
          type: "user",
          title: p.full_name || p.email || "Użytkownik",
          subtitle: p.position || p.email || "",
          icon: <User className="w-4 h-4 text-purple-400" />,
        });
      });

      // Search clients
      let clientQuery = supabase
        .from("clients")
        .select("id, salon_name, owner_name, city")
        .limit(5);
      
      if (isUUID) {
        clientQuery = clientQuery.eq("id", searchQuery);
      } else {
        clientQuery = clientQuery.or(`salon_name.ilike.${searchTerm},owner_name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm}`);
      }
      
      const { data: clients } = await clientQuery;

      clients?.forEach((c) => {
        searchResults.push({
          id: c.id,
          type: "client",
          title: c.salon_name,
          subtitle: `${c.owner_name || ""} · ${c.city || ""}`.trim().replace(/^·\s*|·\s*$/g, ''),
          icon: <Users className="w-4 h-4 text-pink-400" />,
        });
      });

      // Search leads
      let leadQuery = supabase
        .from("leads")
        .select("id, salon_name, owner_name, city")
        .limit(5);
      
      if (isUUID) {
        leadQuery = leadQuery.eq("id", searchQuery);
      } else {
        leadQuery = leadQuery.or(`salon_name.ilike.${searchTerm},owner_name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm}`);
      }
      
      const { data: leads } = await leadQuery;

      leads?.forEach((l) => {
        searchResults.push({
          id: l.id,
          type: "lead",
          title: l.salon_name,
          subtitle: `Lead · ${l.owner_name || l.city || ""}`.trim(),
          icon: <Building2 className="w-4 h-4 text-amber-400" />,
        });
      });

      // Search documents
      let docQuery = supabase
        .from("documents")
        .select("id, type, title, subtitle, created_by")
        .limit(5);
      
      if (isUUID) {
        // Search by document ID or created_by (user ID)
        docQuery = docQuery.or(`id.eq.${searchQuery},created_by.eq.${searchQuery}`);
      } else {
        docQuery = docQuery.or(`title.ilike.${searchTerm},subtitle.ilike.${searchTerm}`);
      }
      
      const { data: documents } = await docQuery;

      documents?.forEach((d) => {
        const iconMap: Record<string, React.ReactNode> = {
          report: <FileText className="w-4 h-4 text-blue-400" />,
          invoice: <Receipt className="w-4 h-4 text-green-400" />,
          contract: <FileSignature className="w-4 h-4 text-purple-400" />,
          presentation: <Presentation className="w-4 h-4 text-pink-400" />,
        };
        searchResults.push({
          id: d.id,
          type: "document",
          title: d.title,
          subtitle: d.subtitle || d.type,
          icon: iconMap[d.type] || <FileText className="w-4 h-4" />,
        });
      });

      // Search campaigns
      let campaignQuery = supabase
        .from("campaigns")
        .select("id, name")
        .limit(5);
      
      if (isUUID) {
        campaignQuery = campaignQuery.eq("id", searchQuery);
      } else {
        campaignQuery = campaignQuery.ilike("name", searchTerm);
      }
      
      const { data: campaigns } = await campaignQuery;

      campaigns?.forEach((c) => {
        searchResults.push({
          id: c.id,
          type: "campaign",
          title: c.name,
          subtitle: "Kampania",
          icon: <Target className="w-4 h-4 text-orange-400" />,
        });
      });

      setResults(searchResults);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, performSearch]);

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    setQuery("");
    
    switch (result.type) {
      case "client":
        navigate(`/clients/${result.id}`);
        break;
      case "lead":
        navigate(`/leads/${result.id}`);
        break;
      case "document":
        navigate(`/history`);
        break;
      case "campaign":
        navigate(`/campaigns`);
        break;
      case "user":
        navigate(`/profile/${result.id}`);
        break;
    }
  };

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Group results by type
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) acc[result.type] = [];
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  const typeLabels: Record<string, string> = {
    user: "Użytkownicy",
    client: "Klienci",
    lead: "Leady",
    document: "Dokumenty",
    campaign: "Kampanie",
  };

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-9 p-0 xl:h-10 xl:w-60 xl:justify-start xl:px-3 xl:py-2"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 xl:mr-2" />
        <span className="hidden xl:inline-flex text-muted-foreground">Szukaj...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg p-0 overflow-hidden">
          <DialogHeader className="px-4 pt-4">
            <DialogTitle className="text-lg">Wyszukiwarka globalna</DialogTitle>
          </DialogHeader>
          
          <div className="px-4 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Szukaj użytkowników, klientów, dokumentów..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 pr-10"
                autoFocus
              />
              {query && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="px-2 pb-4 max-h-96 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
            
            {!loading && query.length >= 2 && results.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Brak wyników dla "{query}"
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="space-y-4">
                {Object.entries(groupedResults).map(([type, items]) => (
                  <div key={type}>
                    <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {typeLabels[type] || type}
                    </p>
                    <div className="space-y-0.5">
                      {items.map((result) => (
                        <button
                          key={`${result.type}-${result.id}`}
                          onClick={() => handleSelect(result)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary/80 transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0">
                            {result.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{result.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && query.length < 2 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Wpisz minimum 2 znaki aby wyszukać
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}