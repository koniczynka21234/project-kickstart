import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Key, Copy, CheckCircle2, XCircle, Clock, ExternalLink, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { format, isPast } from "date-fns";
import { pl } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface ClientAcademyCardProps {
  clientId: string;
}

export function ClientAcademyCard({ clientId }: ClientAcademyCardProps) {
  const navigate = useNavigate();

  const { data: subscriptionCode } = useQuery({
    queryKey: ["subscription-code", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_codes")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const { data: visibility } = useQuery({
    queryKey: ["visibility-settings", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_visibility_settings")
        .select("*")
        .eq("client_id", clientId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const copyCode = () => {
    if (subscriptionCode?.code) {
      navigator.clipboard.writeText(subscriptionCode.code);
      toast.success("Skopiowano kod");
    }
  };

  const getCodeStatus = () => {
    if (!subscriptionCode) return null;
    if (!subscriptionCode.is_active) return { label: "Nieaktywny", variant: "secondary" as const, icon: XCircle, color: "text-muted-foreground" };
    if (isPast(new Date(subscriptionCode.valid_until))) return { label: "Wygasł", variant: "destructive" as const, icon: Clock, color: "text-destructive" };
    return { label: "Aktywny", variant: "default" as const, icon: CheckCircle2, color: "text-emerald-400" };
  };

  const status = getCodeStatus();
  const isCodeExpired = subscriptionCode && isPast(new Date(subscriptionCode.valid_until));

  const visibleSections = [
    visibility?.show_campaigns && "Kampanie",
    visibility?.show_guardian && "Opiekun",
    visibility?.show_documents && "Dokumenty",
  ].filter(Boolean);

  return (
    <Card className="border-border/50 bg-card/80">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-primary" />
            Aurine Academy
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/aurine-academy")}
            className="text-primary hover:text-primary"
          >
            Zarządzaj
            <ExternalLink className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {subscriptionCode ? (
          <>
            {/* Kod dostępu */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <div className="flex items-center gap-2 mb-3">
                <Key className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Kod dostępu</span>
                {status && (
                  <Badge variant={status.variant} className="ml-auto gap-1">
                    <status.icon className="h-3 w-3" />
                    {status.label}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-3 bg-background/50 rounded-lg font-mono text-xl text-center tracking-[0.3em] text-foreground">
                  {subscriptionCode.code}
                </code>
                <Button variant="outline" size="icon" onClick={copyCode} className="shrink-0">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between mt-3 text-sm">
                <span className="text-muted-foreground">Ważny do:</span>
                <span className={`font-medium ${isCodeExpired ? "text-destructive" : "text-foreground"}`}>
                  {format(new Date(subscriptionCode.valid_until), "d MMMM yyyy", { locale: pl })}
                </span>
              </div>
              {subscriptionCode.used_at && (
                <div className="mt-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                  Użyty: {format(new Date(subscriptionCode.used_at), "d MMM yyyy, HH:mm", { locale: pl })}
                  {subscriptionCode.used_by_email && ` przez ${subscriptionCode.used_by_email}`}
                </div>
              )}
            </div>

            {/* Widoczne sekcje */}
            {visibleSections.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Widoczne w aplikacji:</p>
                <div className="flex flex-wrap gap-2">
                  {visibleSections.map((section) => (
                    <Badge key={section} variant="outline" className="bg-secondary/50">
                      {section}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
              <Key className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm mb-3">
              Brak kodu dostępu do aplikacji
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/aurine-academy")}
            >
              Wygeneruj kod
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
