import { useState, useEffect } from "react";
import { Download, Upload, Trash2, Loader2, AlertTriangle, Check, FileJson, HardDrive, Users, Database, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface BackupResult {
  success: boolean;
  totalRecords?: number;
  totalDeleted?: number;
  totalImported?: number;
  preservedClients?: number;
  results?: Record<string, { deleted?: number; imported?: number; error?: string }>;
}

interface Client {
  id: string;
  salon_name: string;
  owner_name: string | null;
  status: string;
}

interface DatabaseSizeData {
  estimatedSizeMB: number;
  limitMB: number;
  usagePercent: number;
  status: 'ok' | 'warning' | 'critical';
  tableCounts: Record<string, number>;
  largestTables: { table: string; count: number }[];
}

export function BackupRestoreSection() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [includeFiles, setIncludeFiles] = useState(true);
  const [resetConfirmPhrase, setResetConfirmPhrase] = useState("");
  const [lastResult, setLastResult] = useState<BackupResult | null>(null);
  
  // Client selection for reset
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [excludeClientIds, setExcludeClientIds] = useState<string[]>([]);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  
  // Database size
  const [sizeData, setSizeData] = useState<DatabaseSizeData | null>(null);
  const [loadingSize, setLoadingSize] = useState(true);

  // Fetch database size on mount
  useEffect(() => {
    fetchDatabaseSize();
  }, []);

  // Fetch clients when reset dialog opens
  useEffect(() => {
    if (resetDialogOpen) {
      fetchClients();
    }
  }, [resetDialogOpen]);

  const fetchDatabaseSize = async () => {
    setLoadingSize(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-database-size');
      
      if (error) {
        console.error('Error checking database size:', error);
        return;
      }

      if (data?.success && data?.data) {
        setSizeData(data.data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoadingSize(false);
    }
  };

  const fetchClients = async () => {
    setLoadingClients(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, salon_name, owner_name, status')
        .order('salon_name');
      
      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoadingClients(false);
    }
  };

  const toggleClientExclusion = (clientId: string) => {
    setExcludeClientIds(prev => 
      prev.includes(clientId) 
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const handleExport = async () => {
    setExporting(true);
    setLastResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Brak sesji");
      }

      const response = await supabase.functions.invoke('export-data', {
        body: { includeFiles },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const data = response.data;
      
      // Calculate total records
      const totalRecords = Object.values(data.tables as Record<string, unknown[]>).reduce(
        (sum, arr) => sum + arr.length, 
        0
      );

      // Create downloadable file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setLastResult({ success: true, totalRecords });
      toast.success(`Wyeksportowano ${totalRecords} rekordów`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Błąd eksportu: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setLastResult({ success: false });
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setLastResult(null);

    try {
      const text = await file.text();
      const importData = JSON.parse(text);

      if (!importData.tables || !importData.version) {
        throw new Error("Nieprawidłowy format pliku backup");
      }

      const response = await supabase.functions.invoke('import-data', {
        body: importData,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data;
      setLastResult({ 
        success: true, 
        totalImported: result.totalImported,
        results: result.results 
      });
      toast.success(`Zaimportowano ${result.totalImported} rekordów`);
    } catch (error) {
      console.error('Import error:', error);
      toast.error(`Błąd importu: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setLastResult({ success: false });
    } finally {
      setImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleReset = async () => {
    if (resetConfirmPhrase !== 'RESET DANYCH') {
      toast.error('Nieprawidłowa fraza potwierdzająca');
      return;
    }

    setResetting(true);
    setLastResult(null);

    try {
      const response = await supabase.functions.invoke('reset-data', {
        body: { 
          confirmPhrase: resetConfirmPhrase,
          includeFiles,
          excludeClientIds
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data;
      setLastResult({ 
        success: true, 
        totalDeleted: result.totalDeleted,
        preservedClients: result.preservedClients,
        results: result.results 
      });
      setResetConfirmPhrase("");
      setExcludeClientIds([]);
      setResetDialogOpen(false);
      
      const message = result.preservedClients > 0
        ? `Usunięto ${result.totalDeleted} rekordów (zachowano ${result.preservedClients} klientów)`
        : `Usunięto ${result.totalDeleted} rekordów`;
      toast.success(message);
    } catch (error) {
      console.error('Reset error:', error);
      toast.error(`Błąd resetu: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setLastResult({ success: false });
    } finally {
      setResetting(false);
    }
  };

  const tableNameMap: Record<string, string> = {
    leads: 'Leady',
    clients: 'Klienci',
    documents: 'Dokumenty',
    tasks: 'Zadania',
    campaigns: 'Kampanie',
    notifications: 'Powiadomienia',
    team_messages: 'Wiadomości',
    calendar_events: 'Kalendarz',
    lead_interactions: 'Interakcje',
    payments: 'Płatności',
    campaign_metrics: 'Metryki kampanii',
  };

  const getProgressColor = () => {
    if (!sizeData) return '';
    if (sizeData.status === 'critical') return '[&>div]:bg-destructive';
    if (sizeData.status === 'warning') return '[&>div]:bg-amber-500';
    return '[&>div]:bg-emerald-500';
  };

  const getStatusBadge = () => {
    if (!sizeData) return null;
    if (sizeData.status === 'critical') {
      return <Badge variant="destructive">Krytyczny</Badge>;
    }
    if (sizeData.status === 'warning') {
      return <Badge className="bg-amber-500 hover:bg-amber-600">Ostrzeżenie</Badge>;
    }
    return <Badge className="bg-emerald-500 hover:bg-emerald-600">OK</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Database Size Card */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              Wykorzystanie bazy danych
            </CardTitle>
            <div className="flex items-center gap-2">
              {getStatusBadge()}
              <Button
                variant="ghost"
                size="icon"
                onClick={fetchDatabaseSize}
                disabled={loadingSize}
                className="h-8 w-8"
              >
                <RefreshCw className={`w-4 h-4 ${loadingSize ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          <CardDescription>
            Szacunkowe wykorzystanie miejsca w bazie danych (limit: 500 MB)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingSize ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : sizeData ? (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Zajęte miejsce</span>
                  <span className="font-medium">
                    ~{sizeData.estimatedSizeMB.toFixed(1)} MB / {sizeData.limitMB} MB
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Progress 
                    value={sizeData.usagePercent} 
                    className={`h-3 flex-1 ${getProgressColor()}`}
                  />
                  <span className={`text-sm font-semibold min-w-[3.5rem] text-right ${
                    sizeData.status === 'critical' ? 'text-destructive' :
                    sizeData.status === 'warning' ? 'text-amber-500' :
                    'text-emerald-500'
                  }`}>
                    {sizeData.usagePercent.toFixed(1)}%
                  </span>
                </div>
              </div>

              {sizeData.largestTables.length > 0 && (
                <div className="bg-secondary/30 rounded-lg p-4 space-y-3">
                  <p className="text-sm font-medium">Największe tabele:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {sizeData.largestTables.slice(0, 6).map((t) => (
                      <div 
                        key={t.table}
                        className="flex items-center justify-between bg-background/50 rounded-md px-3 py-2 text-sm"
                      >
                        <span className="text-muted-foreground">
                          {tableNameMap[t.table] || t.table}
                        </span>
                        <span className="font-medium">{t.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {sizeData.status !== 'ok' && (
                <div className={`rounded-lg p-3 text-sm ${
                  sizeData.status === 'critical' 
                    ? 'bg-destructive/10 border border-destructive/30 text-destructive' 
                    : 'bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400'
                }`}>
                  {sizeData.status === 'critical' 
                    ? '⚠️ Baza danych jest prawie pełna! Zalecamy wykonanie backupu i usunięcie starych danych.'
                    : '📊 Baza danych zapełnia się. Rozważ przegląd i usunięcie niepotrzebnych rekordów.'
                  }
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-4 text-muted-foreground text-sm">
              Nie udało się pobrać informacji o bazie danych
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Card */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            Eksport danych
          </CardTitle>
          <CardDescription>
            Pobierz kopię zapasową wszystkich danych biznesowych systemu
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="includeFilesExport" 
              checked={includeFiles}
              onCheckedChange={(checked) => setIncludeFiles(checked === true)}
            />
            <Label htmlFor="includeFilesExport" className="text-sm">
              Dołącz informacje o plikach ze Storage (linki do miniaturek, dokumentów)
            </Label>
          </div>

          <div className="bg-secondary/30 rounded-lg p-4 text-sm space-y-2">
            <p className="font-medium">Eksportowane dane:</p>
            <ul className="text-muted-foreground list-disc list-inside space-y-1">
              <li>Leady i historia interakcji</li>
              <li>Klienci i ich ustawienia</li>
              <li>Kampanie i metryki</li>
              <li>Dokumenty (raporty, faktury, umowy)</li>
              <li>Zadania i komentarze</li>
              <li>Wiadomości zespołu i ogłoszenia</li>
              <li>Szablony email/SMS</li>
              <li>Wszystkie inne dane biznesowe</li>
            </ul>
          </div>

          <Button 
            onClick={handleExport} 
            disabled={exporting}
            className="w-full"
          >
            {exporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Eksportowanie...
              </>
            ) : (
              <>
                <FileJson className="w-4 h-4 mr-2" />
                Pobierz backup (JSON)
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Import Card */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-400" />
            Import danych
          </CardTitle>
          <CardDescription>
            Przywróć dane z wcześniej utworzonej kopii zapasowej
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-sm">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-amber-500">Uwaga</p>
                <p className="text-muted-foreground">
                  Import nadpisze istniejące dane o tych samych ID. Zalecamy najpierw wykonać eksport aktualnych danych.
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            <Input
              type="file"
              accept=".json"
              onChange={handleImport}
              disabled={importing}
              className="cursor-pointer"
            />
          </div>

          {importing && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Importowanie danych...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reset Card */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="w-5 h-5" />
            Reset danych
          </CardTitle>
          <CardDescription>
            Usuń wszystkie dane biznesowe i zacznij od nowa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-sm">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-destructive">Operacja nieodwracalna!</p>
                <p className="text-muted-foreground">
                  Ta operacja usunie wszystkie leady, klientów, kampanie, dokumenty, zadania i inne dane biznesowe.
                  Użytkownicy i ich role zostaną zachowane.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="includeFilesReset" 
              checked={includeFiles}
              onCheckedChange={(checked) => setIncludeFiles(checked === true)}
            />
            <Label htmlFor="includeFilesReset" className="text-sm">
              Usuń również pliki ze Storage (miniaturki, dokumenty)
            </Label>
          </div>

          <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <Trash2 className="w-4 h-4 mr-2" />
                Resetuj system
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  Potwierdzenie resetu
                </AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-4">
                    <p>
                      Ta operacja <strong>trwale usunie</strong> wszystkie dane biznesowe z systemu.
                      Operacji nie można cofnąć.
                    </p>
                    
                    {/* Client selection section */}
                    {clients.length > 0 && (
                      <div className="border border-border/50 rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-primary" />
                          <span className="font-medium text-foreground">Zachowaj wybranych klientów</span>
                          {excludeClientIds.length > 0 && (
                            <Badge variant="secondary" className="ml-auto">
                              {excludeClientIds.length} zaznaczonych
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Zaznacz klientów, których chcesz zachować wraz z ich danymi (kampanie, dokumenty, płatności, itp.)
                        </p>
                        <ScrollArea className="h-48 border rounded-md">
                          {loadingClients ? (
                            <div className="flex items-center justify-center h-full">
                              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                            </div>
                          ) : (
                            <div className="p-3 space-y-2">
                              {clients.map((client) => (
                                <div
                                  key={client.id}
                                  className={`flex items-center gap-3 p-2 rounded-md transition-colors cursor-pointer hover:bg-secondary/50 ${
                                    excludeClientIds.includes(client.id) ? 'bg-primary/10 border border-primary/30' : ''
                                  }`}
                                  onClick={() => toggleClientExclusion(client.id)}
                                >
                                  <Checkbox
                                    checked={excludeClientIds.includes(client.id)}
                                    onCheckedChange={() => toggleClientExclusion(client.id)}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm text-foreground truncate">
                                      {client.salon_name}
                                    </p>
                                    {client.owner_name && (
                                      <p className="text-xs text-muted-foreground truncate">
                                        {client.owner_name}
                                      </p>
                                    )}
                                  </div>
                                  <Badge 
                                    variant={client.status === 'active' ? 'default' : 'secondary'}
                                    className="text-xs"
                                  >
                                    {client.status === 'active' ? 'Aktywny' : client.status}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          )}
                        </ScrollArea>
                        {excludeClientIds.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExcludeClientIds([])}
                            className="text-xs"
                          >
                            Odznacz wszystkich
                          </Button>
                        )}
                      </div>
                    )}
                    
                    <div>
                      <p className="mb-2">
                        Wpisz <strong>RESET DANYCH</strong> aby potwierdzić:
                      </p>
                      <Input
                        value={resetConfirmPhrase}
                        onChange={(e) => setResetConfirmPhrase(e.target.value)}
                        placeholder="RESET DANYCH"
                        className="font-mono"
                      />
                    </div>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => {
                  setResetConfirmPhrase("");
                  setExcludeClientIds([]);
                }}>
                  Anuluj
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleReset}
                  disabled={resetConfirmPhrase !== 'RESET DANYCH' || resetting}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {resetting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Usuwanie...
                    </>
                  ) : excludeClientIds.length > 0 ? (
                    `Reset (zachowaj ${excludeClientIds.length} klientów)`
                  ) : (
                    "Potwierdzam reset"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* Last Result */}
      {lastResult && (
        <Card className={`border-${lastResult.success ? 'green-500/30' : 'destructive/30'}`}>
          <CardContent className="py-4">
            <div className="flex items-center gap-2">
              {lastResult.success ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-destructive" />
              )}
              <span className="font-medium">
                {lastResult.success ? 'Operacja zakończona pomyślnie' : 'Operacja nie powiodła się'}
              </span>
            </div>
            {lastResult.totalRecords !== undefined && (
              <p className="text-sm text-muted-foreground mt-1">
                Wyeksportowano {lastResult.totalRecords} rekordów
              </p>
            )}
            {lastResult.totalImported !== undefined && (
              <p className="text-sm text-muted-foreground mt-1">
                Zaimportowano {lastResult.totalImported} rekordów
              </p>
            )}
            {lastResult.totalDeleted !== undefined && (
              <p className="text-sm text-muted-foreground mt-1">
                Usunięto {lastResult.totalDeleted} rekordów
                {lastResult.preservedClients !== undefined && lastResult.preservedClients > 0 && (
                  <span className="text-green-500"> (zachowano {lastResult.preservedClients} klientów)</span>
                )}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
