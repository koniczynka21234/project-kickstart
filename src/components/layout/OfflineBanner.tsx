import { useEffect, useState } from "react";
import { WifiOff, RefreshCw } from "lucide-react";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    const goOffline = () => {
      setIsOffline(true);
      setIsReconnecting(true);
    };
    const goOnline = () => {
      setIsOffline(false);
      setIsReconnecting(false);
    };

    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-md">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-border/40 bg-card/90 backdrop-blur-xl p-8 shadow-[0_8px_40px_hsl(0_0%_0%/0.5),0_0_30px_hsl(330_100%_60%/0.15)] max-w-sm mx-4 text-center">
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-destructive/15 border border-destructive/30">
          <WifiOff className="w-7 h-7 text-destructive" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1">Brak połączenia</h3>
          <p className="text-sm text-muted-foreground">
            Sprawdź swoje połączenie internetowe
          </p>
        </div>
        {isReconnecting && (
          <div className="flex items-center gap-2 text-sm text-primary">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Próba ponownego połączenia…</span>
          </div>
        )}
      </div>
    </div>
  );
}
