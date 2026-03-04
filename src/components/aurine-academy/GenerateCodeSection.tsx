import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Key, Copy, RefreshCw, UserPlus, Link2, CheckCircle2, Clock, XCircle, CalendarPlus, BarChart3, Zap, AlertTriangle, Hash } from "lucide-react";
import { toast } from "sonner";
import { format, addDays, isPast } from "date-fns";
import { pl } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";

const DURATION_OPTIONS = [
  { value: "7", label: "7 dni" },
  { value: "14", label: "14 dni" },
  { value: "30", label: "1 miesiąc" },
  { value: "90", label: "3 miesiące" },
  { value: "180", label: "6 miesięcy" },
  { value: "365", label: "12 miesięcy" },
];

const PREFIX_TEMPLATES = [
  { value: "none", label: "Bez prefixu" },
  { value: "AURINE-", label: "AURINE-" },
  { value: "ACADEMY-", label: "ACADEMY-" },
  { value: "VIP-", label: "VIP-" },
  { value: "BEAUTY-", label: "BEAUTY-" },
  { value: "custom", label: "Własny prefix..." },
];

interface UnassignedCode {
  id: string;
  code: string;
  is_active: boolean;
  valid_until: string;
  created_at: string;
  used_at: string | null;
  used_by_email: string | null;
}

interface AllCode {
  id: string;
  code: string;
  is_active: boolean;
  valid_until: string;
  created_at: string;
  used_at: string | null;
  client_id: string | null;
}

// Stats card component
function StatCard({ icon: Icon, label, value, color, subtext }: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  subtext?: string;
}) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl border bg-card">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
        {subtext && <p className="text-[10px] text-muted-foreground/70">{subtext}</p>}
      </div>
    </div>
  );
}

export function GenerateCodeSection() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedDuration, setSelectedDuration] = useState("30");
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedCode, setSelectedCode] = useState<UnassignedCode | null>(null);
  const [showAddClientDialog, setShowAddClientDialog] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newOwnerName, setNewOwnerName] = useState("");
  const [extendDuration, setExtendDuration] = useState("30");
  const [selectedPrefix, setSelectedPrefix] = useState("none");
  const [customPrefix, setCustomPrefix] = useState("");
  const [showCustomPrefix, setShowCustomPrefix] = useState(false);

  // Get effective prefix
  const effectivePrefix = showCustomPrefix ? customPrefix.toUpperCase().replace(/[^A-Z0-9-]/g, '') : (selectedPrefix === "none" ? "" : selectedPrefix);

  // Fetch all codes for statistics
  const { data: allCodes } = useQuery({
    queryKey: ["all-codes-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_codes")
        .select("id, code, is_active, valid_until, created_at, used_at, client_id");
      if (error) throw error;
      return data as AllCode[];
    },
  });

  // Compute stats
  const stats = {
    total: allCodes?.length || 0,
    active: allCodes?.filter(c => c.is_active && !isPast(new Date(c.valid_until))).length || 0,
    expired: allCodes?.filter(c => isPast(new Date(c.valid_until))).length || 0,
    unassigned: allCodes?.filter(c => !c.client_id).length || 0,
    assigned: allCodes?.filter(c => c.client_id).length || 0,
    used: allCodes?.filter(c => c.used_at).length || 0,
  };

  // Pobierz nieprzypisane kody
  const { data: unassignedCodes, isLoading } = useQuery({
    queryKey: ["unassigned-codes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_codes")
        .select("*")
        .is("client_id", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as UnassignedCode[];
    },
  });

  // Pobierz klientów do przypisania
  const { data: clients } = useQuery({
    queryKey: ["clients-for-assign"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, salon_name, owner_name")
        .eq("status", "active")
        .order("salon_name");

      if (error) throw error;
      return data;
    },
  });

  // Generuj nowy kod z opcjonalnym prefixem
  const generateCodeMutation = useMutation({
    mutationFn: async ({ durationDays, prefix }: { durationDays: number; prefix: string }) => {
      const { data: rawCode, error: codeError } = await supabase.rpc("generate_subscription_code");
      if (codeError) throw codeError;

      const finalCode = prefix ? `${prefix}${rawCode}` : rawCode;
      const validUntil = addDays(new Date(), durationDays);
      const { error: insertError } = await supabase.from("subscription_codes").insert({
        client_id: null,
        code: finalCode,
        valid_until: validUntil.toISOString(),
        is_active: true,
        created_by: user?.id,
      });

      if (insertError) throw insertError;
      return finalCode;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unassigned-codes"] });
      queryClient.invalidateQueries({ queryKey: ["all-codes-stats"] });
    },
    onError: () => toast.error("Błąd podczas generowania kodu"),
  });

  // Przypisz kod do istniejącego klienta
  const assignCodeMutation = useMutation({
    mutationFn: async ({ codeId, clientId }: { codeId: string; clientId: string }) => {
      await supabase
        .from("subscription_codes")
        .update({ is_active: false })
        .eq("client_id", clientId);

      const { error } = await supabase
        .from("subscription_codes")
        .update({ client_id: clientId })
        .eq("id", codeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unassigned-codes"] });
      queryClient.invalidateQueries({ queryKey: ["clients-academy"] });
      queryClient.invalidateQueries({ queryKey: ["all-codes-stats"] });
      setShowAssignDialog(false);
      setSelectedCode(null);
      toast.success("Kod przypisany do klienta");
    },
    onError: () => toast.error("Błąd podczas przypisywania kodu"),
  });

  // Dodaj nowego klienta i przypisz kod
  const addClientAndAssignMutation = useMutation({
    mutationFn: async ({ codeId, salonName, ownerName }: { codeId: string; salonName: string; ownerName: string }) => {
      const { data: newClient, error: clientError } = await supabase
        .from("clients")
        .insert({
          salon_name: salonName,
          owner_name: ownerName || null,
          status: "active",
          created_by: user?.id,
        })
        .select("id")
        .single();

      if (clientError) throw clientError;

      const { error: codeError } = await supabase
        .from("subscription_codes")
        .update({ client_id: newClient.id })
        .eq("id", codeId);

      if (codeError) throw codeError;
      return newClient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unassigned-codes"] });
      queryClient.invalidateQueries({ queryKey: ["clients-academy"] });
      queryClient.invalidateQueries({ queryKey: ["clients-for-assign"] });
      queryClient.invalidateQueries({ queryKey: ["all-codes-stats"] });
      setShowAddClientDialog(false);
      setShowAssignDialog(false);
      setSelectedCode(null);
      setNewClientName("");
      setNewOwnerName("");
      toast.success("Klient dodany i kod przypisany");
    },
    onError: () => toast.error("Błąd podczas dodawania klienta"),
  });

  // Przedłuż kod
  const extendCodeMutation = useMutation({
    mutationFn: async ({ codeId, durationDays, currentValidUntil }: { codeId: string; durationDays: number; currentValidUntil: string }) => {
      const currentDate = new Date(currentValidUntil);
      const baseDate = isPast(currentDate) ? new Date() : currentDate;
      const newValidUntil = addDays(baseDate, durationDays);

      const { error } = await supabase
        .from("subscription_codes")
        .update({ 
          valid_until: newValidUntil.toISOString(),
          is_active: true 
        })
        .eq("id", codeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unassigned-codes"] });
      queryClient.invalidateQueries({ queryKey: ["all-codes-stats"] });
      toast.success("Przedłużono ważność kodu");
    },
    onError: () => toast.error("Błąd podczas przedłużania kodu"),
  });

  // Usuń kod
  const deleteCodeMutation = useMutation({
    mutationFn: async (codeId: string) => {
      const { error } = await supabase
        .from("subscription_codes")
        .delete()
        .eq("id", codeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unassigned-codes"] });
      queryClient.invalidateQueries({ queryKey: ["all-codes-stats"] });
      toast.success("Kod usunięty");
    },
    onError: () => toast.error("Błąd podczas usuwania kodu"),
  });

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  const getCodeStatus = (code: UnassignedCode) => {
    if (!code.is_active) return { label: "Nieaktywny", variant: "secondary" as const, icon: XCircle };
    if (isPast(new Date(code.valid_until))) return { label: "Wygasł", variant: "destructive" as const, icon: Clock };
    return { label: "Aktywny", variant: "default" as const, icon: CheckCircle2 };
  };

  const openAssignDialog = (code: UnassignedCode) => {
    setSelectedCode(code);
    setShowAssignDialog(true);
  };

  const handlePrefixChange = (value: string) => {
    if (value === "custom") {
      setShowCustomPrefix(true);
      setSelectedPrefix("none");
    } else {
      setShowCustomPrefix(false);
      setSelectedPrefix(value);
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics Dashboard */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Statystyki kodów
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard icon={Hash} label="Wszystkie kody" value={stats.total} color="bg-primary" />
          <StatCard icon={CheckCircle2} label="Aktywne" value={stats.active} color="bg-green-500" />
          <StatCard icon={Clock} label="Wygasłe" value={stats.expired} color="bg-amber-500" />
          <StatCard icon={Link2} label="Przypisane" value={stats.assigned} color="bg-blue-500" />
          <StatCard icon={AlertTriangle} label="Nieprzypisane" value={stats.unassigned} color="bg-orange-500" />
          <StatCard icon={Zap} label="Użyte" value={stats.used} color="bg-fuchsia-500" subtext="aktywowane przez klientki" />
        </div>
      </div>

      {/* Generowanie nowego kodu */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            <CardTitle>Generuj nowy kod</CardTitle>
          </div>
          <CardDescription>
            Wygeneruj kod dostępu z opcjonalnym prefixem
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="min-w-[160px]">
              <Label className="text-sm text-muted-foreground mb-2 block">Ważność kodu</Label>
              <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                <SelectTrigger>
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
            </div>

            <div className="min-w-[160px]">
              <Label className="text-sm text-muted-foreground mb-2 block">Szablon prefixu</Label>
              <Select value={showCustomPrefix ? "custom" : selectedPrefix} onValueChange={handlePrefixChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Bez prefixu" />
                </SelectTrigger>
                <SelectContent>
                  {PREFIX_TEMPLATES.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {showCustomPrefix && (
              <div className="min-w-[140px]">
                <Label className="text-sm text-muted-foreground mb-2 block">Własny prefix</Label>
                <Input
                  value={customPrefix}
                  onChange={(e) => setCustomPrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
                  placeholder="np. SALON-"
                  maxLength={10}
                />
              </div>
            )}

            <Button
              onClick={() => generateCodeMutation.mutate({ durationDays: parseInt(selectedDuration), prefix: effectivePrefix })}
              disabled={generateCodeMutation.isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${generateCodeMutation.isPending ? "animate-spin" : ""}`} />
              Generuj kod
            </Button>
          </div>

          {effectivePrefix && (
            <p className="text-xs text-muted-foreground mt-2">
              Podgląd: <code className="font-mono bg-muted px-1.5 py-0.5 rounded">{effectivePrefix}XXXXXXXX</code>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Lista nieprzypisanych kodów */}
      <Card>
        <CardHeader>
          <CardTitle>Nieprzypisane kody</CardTitle>
          <CardDescription>
            Kody oczekujące na przypisanie do klienta
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Ładowanie...</div>
          ) : unassignedCodes?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Brak nieprzypisanych kodów
            </div>
          ) : (
            <div className="space-y-3">
              {unassignedCodes?.map((code) => {
                const status = getCodeStatus(code);
                const isExpired = isPast(new Date(code.valid_until));

                return (
                  <div
                    key={code.id}
                    className="flex items-center gap-4 p-4 rounded-lg border bg-card"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <code className="text-xl font-mono tracking-[0.2em] font-bold">
                          {code.code}
                        </code>
                        <Button variant="ghost" size="icon" onClick={() => copyCode(code.code)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Badge variant={status.variant} className="gap-1">
                          <status.icon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>
                          Ważny do: <span className={isExpired ? "text-destructive" : ""}>
                            {format(new Date(code.valid_until), "d MMM yyyy", { locale: pl })}
                          </span>
                        </span>
                        <span>•</span>
                        <span>
                          Utworzono: {format(new Date(code.created_at), "d MMM yyyy, HH:mm", { locale: pl })}
                        </span>
                        {code.used_at && (
                          <>
                            <span>•</span>
                            <span className="text-green-600">
                              Użyty: {format(new Date(code.used_at), "d MMM yyyy", { locale: pl })}
                              {code.used_by_email && ` (${code.used_by_email})`}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Przedłuż */}
                      <div className="flex gap-1">
                        <Select value={extendDuration} onValueChange={setExtendDuration}>
                          <SelectTrigger className="w-28">
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
                          size="sm"
                          onClick={() => extendCodeMutation.mutate({
                            codeId: code.id,
                            durationDays: parseInt(extendDuration),
                            currentValidUntil: code.valid_until,
                          })}
                          disabled={extendCodeMutation.isPending}
                        >
                          <CalendarPlus className="h-4 w-4" />
                        </Button>
                      </div>

                      <Button
                        variant="outline"
                        onClick={() => openAssignDialog(code)}
                      >
                        <Link2 className="h-4 w-4 mr-2" />
                        Przypisz
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteCodeMutation.mutate(code.id)}
                        disabled={deleteCodeMutation.isPending}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog przypisania kodu */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Przypisz kod do klienta</DialogTitle>
            <DialogDescription>
              Kod: <code className="font-mono font-bold">{selectedCode?.code}</code>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Wybierz istniejącego klienta</Label>
              <Select
                onValueChange={(clientId) => {
                  if (selectedCode) {
                    assignCodeMutation.mutate({ codeId: selectedCode.id, clientId });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz klienta..." />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.salon_name} {client.owner_name && `(${client.owner_name})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">lub</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowAddClientDialog(true)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Dodaj nowego klienta
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog dodawania nowego klienta */}
      <Dialog open={showAddClientDialog} onOpenChange={setShowAddClientDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dodaj nowego klienta</DialogTitle>
            <DialogDescription>
              Kod <code className="font-mono font-bold">{selectedCode?.code}</code> zostanie automatycznie przypisany
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="salonName">Nazwa salonu *</Label>
              <Input
                id="salonName"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="np. Studio Urody Anna"
              />
            </div>
            <div>
              <Label htmlFor="ownerName">Imię właściciela</Label>
              <Input
                id="ownerName"
                value={newOwnerName}
                onChange={(e) => setNewOwnerName(e.target.value)}
                placeholder="np. Anna Kowalska"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddClientDialog(false)}>
              Anuluj
            </Button>
            <Button
              onClick={() => {
                if (selectedCode && newClientName.trim()) {
                  addClientAndAssignMutation.mutate({
                    codeId: selectedCode.id,
                    salonName: newClientName.trim(),
                    ownerName: newOwnerName.trim(),
                  });
                }
              }}
              disabled={!newClientName.trim() || addClientAndAssignMutation.isPending}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Dodaj i przypisz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
