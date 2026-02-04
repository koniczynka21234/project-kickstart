import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Save, UserRound } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const CAMPAIGN_STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "draft", label: "Oczekuje na konfigurację" },
  { value: "active", label: "Aktywna" },
  { value: "paused", label: "Wstrzymana" },
  { value: "completed", label: "Zakończona" },
];

type GuardianProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type CampaignRow = {
  id: string;
  name: string;
  status: string;
  objective: string | null;
  start_date: string;
};

export function AcademyGuardianCampaignCard({ clientId }: { clientId: string }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: client } = useQuery({
    queryKey: ["academy-client", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, assigned_to")
        .eq("id", clientId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: guardians, isLoading: isLoadingGuardians } = useQuery({
    queryKey: ["academy-guardians"],
    queryFn: async (): Promise<GuardianProfile[]> => {
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .limit(1000);

      if (rolesError) throw rolesError;

      const ids = (roles || []).map((r) => r.user_id).filter(Boolean);
      if (ids.length === 0) return [];

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", ids)
        .order("full_name", { ascending: true });

      if (profilesError) throw profilesError;
      return (profiles || []) as GuardianProfile[];
    },
  });

  const { data: latestCampaign, isLoading: isLoadingCampaign } = useQuery({
    queryKey: ["academy-client-latest-campaign", clientId],
    queryFn: async (): Promise<CampaignRow | null> => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("id, name, status, objective, start_date")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return (data as CampaignRow) || null;
    },
  });

  const selectedGuardian = useMemo(() => {
    if (!client?.assigned_to) return null;
    return guardians?.find((g) => g.id === client.assigned_to) || null;
  }, [client?.assigned_to, guardians]);

  const [campaignName, setCampaignName] = useState("");
  const [campaignStatus, setCampaignStatus] = useState<string>("draft");
  const [campaignObjective, setCampaignObjective] = useState<string>("");

  useEffect(() => {
    if (latestCampaign) {
      setCampaignName(latestCampaign.name || "");
      setCampaignStatus(latestCampaign.status || "draft");
      setCampaignObjective(latestCampaign.objective || "");
    } else {
      setCampaignName("");
      setCampaignStatus("draft");
      setCampaignObjective("");
    }
  }, [latestCampaign?.id]);

  const updateGuardianMutation = useMutation({
    mutationFn: async (guardianId: string | null) => {
      const { error } = await supabase
        .from("clients")
        .update({ assigned_to: guardianId })
        .eq("id", clientId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academy-client", clientId] });
      queryClient.invalidateQueries({ queryKey: ["clients-academy"] });
      toast.success("Zapisano opiekuna");
    },
    onError: () => toast.error("Nie udało się zapisać opiekuna"),
  });

  const saveCampaignMutation = useMutation({
    mutationFn: async () => {
      const trimmedName = campaignName.trim();
      if (!trimmedName) throw new Error("Nazwa kampanii jest wymagana");

      if (latestCampaign?.id) {
        const { error } = await supabase
          .from("campaigns")
          .update({
            name: trimmedName,
            status: campaignStatus,
            objective: campaignObjective.trim() || null,
          })
          .eq("id", latestCampaign.id);
        if (error) throw error;
      } else {
        const today = new Date();
        const startDate = today.toISOString().slice(0, 10);

        const { error } = await supabase.from("campaigns").insert({
          client_id: clientId,
          name: trimmedName,
          status: campaignStatus,
          objective: campaignObjective.trim() || null,
          start_date: startDate,
          created_by: user?.id ?? null,
        });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academy-client-latest-campaign", clientId] });
      toast.success(latestCampaign ? "Zapisano kampanię" : "Dodano kampanię");
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : "Błąd";
      toast.error(msg);
    },
  });

  const guardianSelectValue = client?.assigned_to ?? "none";
  const campaignStatusLabel = CAMPAIGN_STATUS_OPTIONS.find((s) => s.value === (latestCampaign?.status ?? campaignStatus))
    ?.label;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <UserRound className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Opiekun i kampania</CardTitle>
        </div>
        <CardDescription>
          Dane, które mogą być wyświetlane w aplikacji klientki (zależnie od przełączników widoczności)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Opiekun</Label>
          <Select
            value={guardianSelectValue}
            onValueChange={(v) => updateGuardianMutation.mutate(v === "none" ? null : v)}
            disabled={isLoadingGuardians || updateGuardianMutation.isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="Wybierz opiekuna" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Brak przypisania</SelectItem>
              {(guardians || []).map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.full_name || g.email || g.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedGuardian ? (
            <p className="text-sm text-muted-foreground">
              Aktualnie: <span className="text-foreground font-medium">{selectedGuardian.full_name || selectedGuardian.email}</span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Brak przypisanego opiekuna</p>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <Label>Kampania (ostatnia)</Label>
            </div>
            <Badge variant="outline" className="shrink-0">
              {campaignStatusLabel || latestCampaign?.status || campaignStatus}
            </Badge>
          </div>

          <div className="grid gap-3">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Nazwa</Label>
              <Input
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder={latestCampaign ? "" : "np. Kampania Aurine Academy"}
                disabled={isLoadingCampaign}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Status</Label>
              <Select value={campaignStatus} onValueChange={setCampaignStatus} disabled={isLoadingCampaign}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CAMPAIGN_STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Cel kampanii</Label>
              <Textarea
                value={campaignObjective}
                onChange={(e) => setCampaignObjective(e.target.value)}
                placeholder="np. Zwiększenie liczby rezerwacji"
                rows={3}
                disabled={isLoadingCampaign}
              />
            </div>

            <Button
              onClick={() => saveCampaignMutation.mutate()}
              disabled={saveCampaignMutation.isPending || isLoadingCampaign}
              className="w-full"
            >
              <Save className={`h-4 w-4 mr-2 ${saveCampaignMutation.isPending ? "animate-spin" : ""}`} />
              {latestCampaign ? "Zapisz zmiany" : "Dodaj kampanię"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
