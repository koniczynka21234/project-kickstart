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
import { Key, Copy, RefreshCw, UserPlus, Link2, CheckCircle2, Clock, XCircle, CalendarPlus } from "lucide-react";
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

interface UnassignedCode {
  id: string;
  code: string;
  is_active: boolean;
  valid_until: string;
  created_at: string;
  used_at: string | null;
  used_by_email: string | null;
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

  // Generuj nowy kod (nieprzypisany)
  const generateCodeMutation = useMutation({
    mutationFn: async (durationDays: number) => {
      const { data: newCode, error: codeError } = await supabase.rpc("generate_subscription_code");
      if (codeError) throw codeError;

      const validUntil = addDays(new Date(), durationDays);
      const { error: insertError } = await supabase.from("subscription_codes").insert({
        client_id: null,
        code: newCode,
        valid_until: validUntil.toISOString(),
        is_active: true,
        created_by: user?.id,
      });

      if (insertError) throw insertError;
      return newCode;
    },
    onSuccess: (code) => {
      queryClient.invalidateQueries({ queryKey: ["unassigned-codes"] });
      toast.success(`Wygenerowano kod: ${code}`);
    },
    onError: () => toast.error("Błąd podczas generowania kodu"),
  });

  // Przypisz kod do istniejącego klienta
  const assignCodeMutation = useMutation({
    mutationFn: async ({ codeId, clientId }: { codeId: string; clientId: string }) => {
      // Dezaktywuj stare kody klienta
      await supabase
        .from("subscription_codes")
        .update({ is_active: false })
        .eq("client_id", clientId);

      // Przypisz nowy kod
      const { error } = await supabase
        .from("subscription_codes")
        .update({ client_id: clientId })
        .eq("id", codeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unassigned-codes"] });
      queryClient.invalidateQueries({ queryKey: ["clients-academy"] });
      setShowAssignDialog(false);
      setSelectedCode(null);
      toast.success("Kod przypisany do klienta");
    },
    onError: () => toast.error("Błąd podczas przypisywania kodu"),
  });

  // Dodaj nowego klienta i przypisz kod
  const addClientAndAssignMutation = useMutation({
    mutationFn: async ({ codeId, salonName, ownerName }: { codeId: string; salonName: string; ownerName: string }) => {
      // Utwórz nowego klienta
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

      // Przypisz kod do nowego klienta
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
      toast.success("Kod usunięty");
    },
    onError: () => toast.error("Błąd podczas usuwania kodu"),
  });

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Skopiowano kod");
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

  return (
    <div className="space-y-6">
      {/* Generowanie nowego kodu */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            <CardTitle>Generuj nowy kod</CardTitle>
          </div>
          <CardDescription>
            Wygeneruj kod dostępu niezwiązany z konkretnym klientem
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 items-end">
            <div className="flex-1 max-w-xs">
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
            <Button
              onClick={() => generateCodeMutation.mutate(parseInt(selectedDuration))}
              disabled={generateCodeMutation.isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${generateCodeMutation.isPending ? "animate-spin" : ""}`} />
              Generuj kod
            </Button>
          </div>
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
