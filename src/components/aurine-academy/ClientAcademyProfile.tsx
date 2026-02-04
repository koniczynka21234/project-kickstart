import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Key, Copy, RefreshCw, Target, User, FileText,
  Upload, Trash2, Download, CheckCircle2, XCircle, Clock,
  Eye, EyeOff, CalendarPlus
} from "lucide-react";
import { toast } from "sonner";
import { format, addMonths, addDays, isPast } from "date-fns";
import { pl } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import { DocumentUploadDialog } from "./DocumentUploadDialog";
import { AcademyGuardianCampaignCard } from "./AcademyGuardianCampaignCard";
import { ClientActivityHistory } from "./ClientActivityHistory";

interface ClientAcademyProfileProps {
  clientId: string;
  clientName: string;
  ownerName: string | null;
}

const DURATION_OPTIONS = [
  { value: "7", label: "7 dni" },
  { value: "14", label: "14 dni" },
  { value: "30", label: "1 miesiąc" },
  { value: "90", label: "3 miesiące" },
  { value: "180", label: "6 miesięcy" },
  { value: "365", label: "12 miesięcy" },
];

export function ClientAcademyProfile({ clientId, clientName, ownerName }: ClientAcademyProfileProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState("30");
  const [extendDuration, setExtendDuration] = useState("30");

  // Pobierz kod subskrypcji
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

  // Pobierz ustawienia widoczności
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

  // Pobierz dokumenty
  const { data: documents } = useQuery({
    queryKey: ["client-documents", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_app_documents")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Generuj nowy kod
  const generateCodeMutation = useMutation({
    mutationFn: async (durationDays: number) => {
      // Dezaktywuj stare kody
      await supabase
        .from("subscription_codes")
        .update({ is_active: false })
        .eq("client_id", clientId);

      // Wygeneruj nowy kod
      const { data: newCode, error: codeError } = await supabase.rpc("generate_subscription_code");
      if (codeError) throw codeError;

      // Zapisz kod
      const validUntil = addDays(new Date(), durationDays);
      const { error: insertError } = await supabase.from("subscription_codes").insert({
        client_id: clientId,
        code: newCode,
        valid_until: validUntil.toISOString(),
        is_active: true,
        created_by: user?.id,
      });

      if (insertError) throw insertError;
      return newCode;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-code", clientId] });
      queryClient.invalidateQueries({ queryKey: ["clients-academy"] });
      toast.success("Wygenerowano nowy kod dostępu");
    },
    onError: () => toast.error("Błąd podczas generowania kodu"),
  });

  // Przedłuż istniejący kod
  const extendCodeMutation = useMutation({
    mutationFn: async (durationDays: number) => {
      if (!subscriptionCode) throw new Error("Brak kodu");
      
      // Oblicz nową datę ważności - od aktualnej daty ważności lub od teraz, jeśli już wygasł
      const currentValidUntil = new Date(subscriptionCode.valid_until);
      const baseDate = isPast(currentValidUntil) ? new Date() : currentValidUntil;
      const newValidUntil = addDays(baseDate, durationDays);

      const { error } = await supabase
        .from("subscription_codes")
        .update({ 
          valid_until: newValidUntil.toISOString(),
          is_active: true 
        })
        .eq("id", subscriptionCode.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-code", clientId] });
      queryClient.invalidateQueries({ queryKey: ["clients-academy"] });
      toast.success("Przedłużono ważność kodu");
    },
    onError: () => toast.error("Błąd podczas przedłużania kodu"),
  });

  // Aktualizuj widoczność
  const updateVisibilityMutation = useMutation({
    mutationFn: async (field: "show_campaigns" | "show_guardian" | "show_documents") => {
      const currentValue = visibility?.[field] ?? false;
      
      if (visibility) {
        const { error } = await supabase
          .from("client_visibility_settings")
          .update({ [field]: !currentValue })
          .eq("client_id", clientId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("client_visibility_settings").insert({
          client_id: clientId,
          show_campaigns: field === "show_campaigns" ? true : false,
          show_guardian: field === "show_guardian" ? true : false,
          show_documents: field === "show_documents" ? true : false,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visibility-settings", clientId] });
      toast.success("Zapisano ustawienia");
    },
    onError: () => toast.error("Błąd podczas zapisywania"),
  });

  // Usuń dokument
  const deleteDocumentMutation = useMutation({
    mutationFn: async (doc: { id: string; storage_path: string | null }) => {
      if (doc.storage_path) {
        await supabase.storage.from("client_documents").remove([doc.storage_path]);
      }
      const { error } = await supabase.from("client_app_documents").delete().eq("id", doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-documents", clientId] });
      toast.success("Dokument usunięty");
    },
    onError: () => toast.error("Błąd podczas usuwania"),
  });

  const copyCode = () => {
    if (subscriptionCode?.code) {
      navigator.clipboard.writeText(subscriptionCode.code);
      toast.success("Skopiowano kod");
    }
  };

  const getCodeStatus = () => {
    if (!subscriptionCode) return null;
    if (!subscriptionCode.is_active) return { label: "Nieaktywny", variant: "secondary" as const, icon: XCircle };
    if (isPast(new Date(subscriptionCode.valid_until))) return { label: "Wygasł", variant: "destructive" as const, icon: Clock };
    return { label: "Aktywny", variant: "default" as const, icon: CheckCircle2 };
  };

  const getDocTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      invoice: "Faktura",
      contract: "Umowa",
      report: "Raport",
      terms: "Regulamin",
      other: "Inny",
    };
    return types[type] || type;
  };

  const status = getCodeStatus();
  const isCodeExpired = subscriptionCode && isPast(new Date(subscriptionCode.valid_until));

  return (
    <div className="p-6 space-y-6">
      {/* Nagłówek */}
      <div>
        <h2 className="text-2xl font-bold">{clientName}</h2>
        <p className="text-muted-foreground">{ownerName || "Brak właściciela"}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Sekcja: Kod dostępu */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Kod dostępu</CardTitle>
            </div>
            <CardDescription>
              Kod do logowania w aplikacji Aurine Academy
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscriptionCode ? (
              <>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-3 bg-muted rounded-lg font-mono text-xl text-center tracking-[0.3em]">
                    {subscriptionCode.code}
                  </code>
                  <Button variant="outline" size="icon" onClick={copyCode}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  {status && (
                    <Badge variant={status.variant} className="gap-1">
                      <status.icon className="h-3 w-3" />
                      {status.label}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Ważny do:</span>
                  <span className={`font-medium ${isCodeExpired ? "text-destructive" : ""}`}>
                    {format(new Date(subscriptionCode.valid_until), "d MMMM yyyy", { locale: pl })}
                  </span>
                </div>

                {subscriptionCode.used_at && (
                  <div className="text-sm text-muted-foreground">
                    Użyty: {format(new Date(subscriptionCode.used_at), "d MMM yyyy, HH:mm", { locale: pl })}
                    {subscriptionCode.used_by_email && ` (${subscriptionCode.used_by_email})`}
                  </div>
                )}

                {/* Przedłuż kod */}
                <Separator className="my-2" />
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Przedłuż ważność</Label>
                  <div className="flex gap-2">
                    <Select value={extendDuration} onValueChange={setExtendDuration}>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DURATION_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      onClick={() => extendCodeMutation.mutate(parseInt(extendDuration))}
                      disabled={extendCodeMutation.isPending}
                    >
                      <CalendarPlus className={`h-4 w-4 mr-2 ${extendCodeMutation.isPending ? "animate-spin" : ""}`} />
                      Przedłuż
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                Brak kodu dostępu
              </p>
            )}

            <Separator className="my-2" />

            {/* Generuj nowy kod */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                {subscriptionCode ? "Wygeneruj nowy kod" : "Ważność kodu"}
              </Label>
              <div className="flex gap-2">
                <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => generateCodeMutation.mutate(parseInt(selectedDuration))}
                  disabled={generateCodeMutation.isPending}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${generateCodeMutation.isPending ? "animate-spin" : ""}`} />
                  {subscriptionCode ? "Nowy kod" : "Generuj"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <AcademyGuardianCampaignCard clientId={clientId} />

        {/* Sekcja: Widoczność */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Co widzi klientka</CardTitle>
            </div>
            <CardDescription>
              Zarządzaj widocznością sekcji w aplikacji
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <Label>Kampanie</Label>
              </div>
              <Switch
                checked={visibility?.show_campaigns ?? false}
                onCheckedChange={() => updateVisibilityMutation.mutate("show_campaigns")}
                disabled={updateVisibilityMutation.isPending}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <Label>Opiekun</Label>
              </div>
              <Switch
                checked={visibility?.show_guardian ?? false}
                onCheckedChange={() => updateVisibilityMutation.mutate("show_guardian")}
                disabled={updateVisibilityMutation.isPending}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <Label>Dokumenty</Label>
              </div>
              <Switch
                checked={visibility?.show_documents ?? false}
                onCheckedChange={() => updateVisibilityMutation.mutate("show_documents")}
                disabled={updateVisibilityMutation.isPending}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sekcja: Dokumenty */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-lg">Dokumenty klientki</CardTitle>
                <CardDescription>
                  Faktury, umowy, raporty widoczne w aplikacji
                </CardDescription>
              </div>
            </div>
            <Button onClick={() => setShowUploadDialog(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Dodaj dokument
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {documents?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Brak dokumentów. Kliknij "Dodaj dokument" aby przesłać.
            </div>
          ) : (
            <div className="space-y-2">
              {documents?.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <FileText className="h-8 w-8 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{doc.title}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {getDocTypeLabel(doc.type)}
                      </Badge>
                      <span>•</span>
                      <span>{format(new Date(doc.created_at), "d MMM yyyy", { locale: pl })}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" asChild>
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteDocumentMutation.mutate({ id: doc.id, storage_path: doc.storage_path })}
                      disabled={deleteDocumentMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sekcja: Historia aktywności */}
      <ClientActivityHistory clientId={clientId} />

      <DocumentUploadDialog
        open={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        clientId={clientId}
      />
    </div>
  );
}
