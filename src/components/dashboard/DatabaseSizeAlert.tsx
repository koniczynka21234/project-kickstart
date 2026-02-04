import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Database, AlertTriangle, HardDrive, ChevronRight } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";

interface DatabaseSizeData {
  estimatedSizeMB: number;
  limitMB: number;
  usagePercent: number;
  status: 'ok' | 'warning' | 'critical';
  largestTables: { table: string; count: number }[];
}

export function DatabaseSizeAlert() {
  const navigate = useNavigate();
  const { isSzef } = useUserRole();
  const [sizeData, setSizeData] = useState<DatabaseSizeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only check for szef users
    if (!isSzef) {
      setLoading(false);
      return;
    }

    const checkSize = async () => {
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
        setLoading(false);
      }
    };

    checkSize();
  }, [isSzef]);

  // Don't show if not szef, loading, no data, or status is ok
  if (!isSzef || loading || !sizeData || sizeData.status === 'ok') {
    return null;
  }

  const isCritical = sizeData.status === 'critical';
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
  };

  return (
    <Alert 
      className={`border-2 ${
        isCritical 
          ? 'border-destructive/50 bg-destructive/10' 
          : 'border-amber-500/50 bg-amber-500/10'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isCritical ? 'bg-destructive/20' : 'bg-amber-500/20'
        }`}>
          {isCritical ? (
            <AlertTriangle className="w-5 h-5 text-destructive" />
          ) : (
            <Database className="w-5 h-5 text-amber-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <AlertTitle className={`font-semibold ${isCritical ? 'text-destructive' : 'text-amber-600 dark:text-amber-400'}`}>
            {isCritical 
              ? '⚠️ Baza danych prawie pełna!' 
              : '📊 Baza danych zapełnia się'
            }
          </AlertTitle>
          <AlertDescription className="mt-2 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Progress 
                  value={sizeData.usagePercent} 
                  className={`h-2 ${isCritical ? '[&>div]:bg-destructive' : '[&>div]:bg-amber-500'}`}
                />
              </div>
              <span className={`text-sm font-medium ${isCritical ? 'text-destructive' : 'text-amber-600 dark:text-amber-400'}`}>
                {sizeData.usagePercent.toFixed(1)}%
              </span>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <HardDrive className="w-4 h-4" />
                <span>~{sizeData.estimatedSizeMB.toFixed(1)} MB / {sizeData.limitMB} MB</span>
              </div>
            </div>

            {sizeData.largestTables.length > 0 && (
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">Największe tabele: </span>
                {sizeData.largestTables.slice(0, 3).map((t, i) => (
                  <span key={t.table}>
                    {tableNameMap[t.table] || t.table} ({t.count})
                    {i < 2 && sizeData.largestTables.length > i + 1 ? ', ' : ''}
                  </span>
                ))}
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              {isCritical 
                ? 'Zalecamy natychmiastowe wykonanie backupu i rozważenie usunięcia starych danych.'
                : 'Rozważ wykonanie backupu danych i przegląd starszych rekordów.'
              }
            </p>

            <Button 
              variant={isCritical ? "destructive" : "outline"}
              size="sm" 
              onClick={() => navigate("/admin?tab=backup")}
              className="mt-1"
            >
              Przejdź do backupu
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}
