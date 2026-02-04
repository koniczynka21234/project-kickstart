import { useState, useMemo, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Trash2, Search, Filter, Calendar, User, Loader2, Download, Upload, Users, ArrowUpDown, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCloudDocumentHistory, CloudDocumentItem } from "@/hooks/useCloudDocumentHistory";
import { DocumentViewer } from "@/components/document/DocumentViewer";
import { DocumentMiniCard } from "@/components/document/DocumentMiniCard";
import { DocumentThumbnail } from "@/components/document/DocumentThumbnail";
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { pl } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const typeLabels: Record<string, string> = {
  report: "Raport",
  invoice: "Faktura",
  contract: "Umowa",
  presentation: "Prezentacja",
  welcomepack: "Welcome Pack",
};

const typeColors: Record<string, string> = {
  report: "bg-pink-500/10 text-pink-400 border-pink-500/30",
  invoice: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  contract: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  presentation: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  welcomepack: "bg-amber-500/10 text-amber-400 border-amber-500/30",
};

const filterOptions = [
  { value: "all", label: "Wszystkie" },
  { value: "report", label: "Raporty" },
  { value: "invoice", label: "Faktury" },
  { value: "contract", label: "Umowy" },
  { value: "presentation", label: "Prezentacje" },
  { value: "presentation-academy", label: "Prezentacje z Academy" },
  { value: "presentation-no-academy", label: "Prezentacje bez Academy" },
  { value: "welcomepack", label: "Welcome Pack" },
];

type SortOption = "date-desc" | "date-asc" | "name-asc" | "name-desc" | "type-asc" | "type-desc";

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "date-desc", label: "Data (najnowsze)" },
  { value: "date-asc", label: "Data (najstarsze)" },
  { value: "name-asc", label: "Nazwa (A-Z)" },
  { value: "name-desc", label: "Nazwa (Z-A)" },
  { value: "type-asc", label: "Typ (A-Z)" },
  { value: "type-desc", label: "Typ (Z-A)" },
];

interface ClientOption {
  id: string;
  salon_name: string;
}

export default function DocumentHistory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [userFilter, setUserFilter] = useState<string | null>(null);
  const { history, loading, teamMembers, isSzef, userId, deleteDocument, clearHistory, saveDocument, getDocumentById } = useCloudDocumentHistory(userFilter);
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");

  // Fetch clients for filter
  useEffect(() => {
    const fetchClients = async () => {
      const { data } = await supabase
        .from('clients')
        .select('id, salon_name')
        .order('salon_name');
      setClients(data || []);
    };
    fetchClients();
  }, []);

  // Handle opening document from URL param (opens mini card first)
  useEffect(() => {
    const documentId = searchParams.get('document');
    if (documentId && !loading && history.length > 0) {
      const doc = getDocumentById(documentId);
      if (doc) {
        setMiniCardDocument(doc);
        // Clear the URL param after opening
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, loading, history, getDocumentById, setSearchParams]);

  // Export history as JSON
  const handleExport = () => {
    const exportData = history.map(doc => ({
      type: doc.type,
      title: doc.title,
      subtitle: doc.subtitle,
      data: doc.data,
      thumbnail: doc.thumbnail,
      createdAt: doc.createdAt
    }));
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `historia-dokumentow-${format(new Date(), "yyyy-MM-dd")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Historia wyeksportowana pomyślnie");
  };

  // Import history from JSON
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const importedData = JSON.parse(content);
        
        if (!Array.isArray(importedData)) {
          toast.error("Nieprawidłowy format pliku");
          return;
        }

        let importedCount = 0;
        for (const doc of importedData) {
          if (doc.type && doc.title && doc.data) {
            await saveDocument(doc.type, doc.title, doc.subtitle || "", doc.data, doc.thumbnail);
            importedCount++;
          }
        }

        toast.success(`Zaimportowano ${importedCount} dokumentów`);
      } catch (err) {
        toast.error("Błąd podczas importu pliku");
        console.error("Import error:", err);
      }
    };
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  const [filterType, setFilterType] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [selectedDocument, setSelectedDocument] = useState<CloudDocumentItem | null>(null);
  const [miniCardDocument, setMiniCardDocument] = useState<CloudDocumentItem | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  // Generate available months from history
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    history.forEach((doc) => {
      const date = parseISO(doc.createdAt);
      const monthKey = format(date, "yyyy-MM");
      monthsSet.add(monthKey);
    });
    return Array.from(monthsSet).sort().reverse();
  }, [history]);

  const filteredAndSortedHistory = useMemo(() => {
    // First filter
    const filtered = history.filter((doc) => {
      const matchesSearch = 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.subtitle?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        (doc.clientId?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      // Type filter with Academy sub-filters
      let matchesFilter = false;
      if (filterType === "all") {
        matchesFilter = true;
      } else if (filterType === "presentation-academy") {
        matchesFilter = doc.type === "presentation" && doc.data?.includeAcademy === "true";
      } else if (filterType === "presentation-no-academy") {
        matchesFilter = doc.type === "presentation" && doc.data?.includeAcademy !== "true";
      } else {
        matchesFilter = doc.type === filterType;
      }
      const matchesClient = clientFilter === "all" || doc.clientId === clientFilter;
      
      // Month filter
      let matchesMonth = true;
      if (monthFilter !== "all") {
        const docDate = parseISO(doc.createdAt);
        const [year, month] = monthFilter.split("-").map(Number);
        const filterDate = new Date(year, month - 1, 1);
        const monthStart = startOfMonth(filterDate);
        const monthEnd = endOfMonth(filterDate);
        matchesMonth = isWithinInterval(docDate, { start: monthStart, end: monthEnd });
      }
      
      return matchesSearch && matchesFilter && matchesMonth && matchesClient;
    });

    // Then sort
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "date-asc":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "name-asc":
          return a.title.localeCompare(b.title, 'pl');
        case "name-desc":
          return b.title.localeCompare(a.title, 'pl');
        case "type-asc":
          return (typeLabels[a.type] || a.type).localeCompare(typeLabels[b.type] || b.type, 'pl');
        case "type-desc":
          return (typeLabels[b.type] || b.type).localeCompare(typeLabels[a.type] || a.type, 'pl');
        default:
          return 0;
      }
    });
  }, [history, searchQuery, filterType, clientFilter, monthFilter, sortBy]);

  // Click on document -> show mini card
  const handleDocumentClick = (doc: CloudDocumentItem) => {
    setMiniCardDocument(doc);
  };

  // From mini card -> open fullscreen viewer
  const handleOpenFullscreen = () => {
    if (miniCardDocument) {
      setSelectedDocument(miniCardDocument);
      setViewerOpen(true);
      setMiniCardDocument(null);
    }
  };

  // Close mini card
  const handleCloseMiniCard = () => {
    setMiniCardDocument(null);
  };

  const handleCloseViewer = () => {
    setViewerOpen(false);
    setSelectedDocument(null);
  };

  // View linked invoice (advance <-> final)
  const handleViewLinkedInvoice = async (linkedDocumentId: string) => {
    const linkedDoc = getDocumentById(linkedDocumentId);
    if (linkedDoc) {
      setMiniCardDocument(linkedDoc);
    } else {
      // Document not in current history (might be filtered out), fetch directly
      const { data } = await supabase
        .from('documents')
        .select('*')
        .eq('id', linkedDocumentId)
        .maybeSingle();
      
      if (data) {
        setMiniCardDocument({
          id: data.id,
          type: data.type as any,
          title: data.title,
          subtitle: data.subtitle,
          data: data.data as Record<string, string>,
          thumbnail: data.thumbnail,
          createdAt: data.created_at,
          createdBy: data.created_by,
          clientId: data.client_id
        });
      }
    }
  };


  const formatMonthLabel = (monthKey: string) => {
    const [year, month] = monthKey.split("-").map(Number);
    const date = new Date(year, month - 1, 1);
    return format(date, "LLLL yyyy", { locale: pl });
  };

  // selectedDocument is already a CloudDocumentItem, pass directly
  const viewerDocument = selectedDocument;

  return (
    <AppLayout>
      <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-full overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Historia dokumentów</h1>
            <p className="text-muted-foreground text-sm">
              {loading ? "Ładowanie..." : `${history.length} dokumentów w historii`}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Import */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            
            {/* Export */}
            {history.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Eksport
              </Button>
            )}
            
            {/* Clear */}
            {history.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Wyczyść
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Wyczyścić historię?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Ta akcja usunie {isSzef ? "wszystkie dokumenty" : "twoje dokumenty"} z historii. Tej operacji nie można cofnąć.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Anuluj</AlertDialogCancel>
                    <AlertDialogAction onClick={() => clearHistory()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Wyczyść
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-4">
          {/* Search and dropdown filters row */}
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Szukaj dokumentów..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            
            <div className="flex flex-wrap gap-3">
              {/* User filter for szef */}
              {isSzef && teamMembers.length > 0 && (
                <Select value={userFilter || "all"} onValueChange={(v) => setUserFilter(v === "all" ? null : v)}>
                  <SelectTrigger className="w-[180px]">
                    <User className="w-4 h-4 mr-2 text-muted-foreground shrink-0" />
                    <SelectValue placeholder="Użytkownik" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Wszyscy użytkownicy</SelectItem>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              {/* Client filter */}
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger className="w-[180px]">
                  <Users className="w-4 h-4 mr-2 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Klient" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszyscy klienci</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.salon_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Month filter */}
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger className="w-[180px]">
                  <Calendar className="w-4 h-4 mr-2 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Miesiąc" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie miesiące</SelectItem>
                  {availableMonths.map((monthKey) => (
                    <SelectItem key={monthKey} value={monthKey}>
                      {formatMonthLabel(monthKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Type filter buttons and Sort */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2 flex-wrap">
              {filterOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={filterType === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
            
            {/* Sort dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <ArrowUpDown className="w-4 h-4" />
                  Sortuj
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {sortOptions.map((option) => (
                  <DropdownMenuItem 
                    key={option.value} 
                    onClick={() => setSortBy(option.value)}
                    className={sortBy === option.value ? "bg-secondary" : ""}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Documents Grid */}
        {loading ? (
          <div className="bg-card border border-border/60 rounded-xl p-12 text-center">
            <Loader2 className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-spin" />
            <p className="text-lg text-muted-foreground">Ładowanie dokumentów...</p>
          </div>
        ) : filteredAndSortedHistory.length === 0 ? (
          <div className="bg-card border border-border/60 rounded-xl p-12 text-center">
            <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Brak dokumentów</p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              {searchQuery || filterType !== "all" || monthFilter !== "all" || userFilter
                ? "Spróbuj zmienić filtry wyszukiwania"
                : "Wygenerowane dokumenty pojawią się tutaj"
              }
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredAndSortedHistory.map((doc) => (
              <div
                key={doc.id}
                className="bg-card border border-border/60 rounded-xl overflow-hidden hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 group"
              >
                {/* Thumbnail - larger landscape display with full visibility */}
                <DocumentThumbnail
                  doc={doc}
                  typeColors={typeColors}
                  onClick={() => handleDocumentClick(doc)}
                />
                
                {/* Info */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${typeColors[doc.type]}`}>
                        {typeLabels[doc.type]}
                      </span>
                      {/* Invoice type badge */}
                      {doc.type === "invoice" && doc.data?.invoiceType && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          doc.data.invoiceType === "advance" ? "bg-amber-500/20 text-amber-400" :
                          doc.data.invoiceType === "final" ? "bg-blue-500/20 text-blue-400" :
                          "bg-emerald-500/20 text-emerald-400"
                        }`}>
                          {doc.data.invoiceType === "advance" ? "Zaliczkowa" :
                           doc.data.invoiceType === "final" ? "Końcowa" : "Całościowa"}
                        </span>
                      )}
                      {/* Academy badge for presentations */}
                      {doc.type === "presentation" && doc.data && (
                        <span className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border ${
                          doc.data.includeAcademy === "true" 
                            ? "bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30" 
                            : "bg-zinc-500/15 text-zinc-400 border-zinc-500/30"
                        }`}>
                          <GraduationCap className="w-3 h-3" />
                          {doc.data.includeAcademy === "true" ? "Academy" : "bez Academy"}
                        </span>
                      )}
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Usunąć dokument?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Czy na pewno chcesz usunąć "{doc.title}"? Tej operacji nie można cofnąć.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Anuluj</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteDocument(doc.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Usuń
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  <h3 
                    className="font-medium text-foreground truncate cursor-pointer hover:text-primary transition-colors"
                    onClick={() => handleDocumentClick(doc)}
                  >
                    {doc.title}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">{doc.subtitle}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-muted-foreground/60">
                      {format(new Date(doc.createdAt), "d MMMM yyyy, HH:mm", { locale: pl })}
                    </p>
                    {isSzef && doc.creatorName && (
                      <div className={`text-xs flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${
                        doc.creatorRole === 'szef' 
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                          : 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                      }`}>
                        <User className="w-3 h-3" />
                        <span>{doc.creatorName}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mini Card Overlay */}
      {miniCardDocument && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          onClick={handleCloseMiniCard}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <DocumentMiniCard
              document={miniCardDocument}
              onClose={handleCloseMiniCard}
              onViewFullscreen={handleOpenFullscreen}
              onDelete={deleteDocument}
              canDelete={isSzef || miniCardDocument.createdBy === userId}
              onViewLinkedInvoice={handleViewLinkedInvoice}
            />
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      <DocumentViewer
        document={viewerDocument}
        open={viewerOpen}
        onClose={handleCloseViewer}
      />
    </AppLayout>
  );
}
