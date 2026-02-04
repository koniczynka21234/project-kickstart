import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Key, CheckCircle2, XCircle, Clock, User, Users, Plus } from "lucide-react";
import { ClientAcademyProfile } from "@/components/aurine-academy/ClientAcademyProfile";
import { GenerateCodeSection } from "@/components/aurine-academy/GenerateCodeSection";
import { isPast } from "date-fns";

interface ClientWithAcademy {
  id: string;
  salon_name: string;
  owner_name: string | null;
  assigned_to: string | null;
  status: string;
  subscription_code?: {
    code: string;
    is_active: boolean;
    valid_until: string;
    used_at: string | null;
  } | null;
  guardian?: {
    full_name: string | null;
  } | null;
}

const AurineAcademy = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("clients");

  const { data: clients, isLoading } = useQuery({
    queryKey: ["clients-academy"],
    queryFn: async () => {
      // Pobierz klientów
      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select("id, salon_name, owner_name, assigned_to, status")
        .eq("status", "active")
        .order("salon_name");

      if (clientsError) throw clientsError;

      // Pobierz kody subskrypcji
      const { data: codesData } = await supabase
        .from("subscription_codes")
        .select("client_id, code, is_active, valid_until, used_at")
        .eq("is_active", true);

      // Pobierz profile opiekunów
      const guardianIds = [...new Set(clientsData?.filter(c => c.assigned_to).map(c => c.assigned_to))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", guardianIds);

      // Połącz dane
      return clientsData?.map(client => {
        const code = codesData?.find(c => c.client_id === client.id);
        const guardian = profilesData?.find(p => p.id === client.assigned_to);
        return {
          ...client,
          subscription_code: code || null,
          guardian: guardian || null,
        };
      }) as ClientWithAcademy[];
    },
  });

  const getCodeStatus = (code: ClientWithAcademy["subscription_code"]) => {
    if (!code) return { label: "Brak kodu", icon: XCircle, color: "text-muted-foreground" };
    if (!code.is_active) return { label: "Nieaktywny", icon: XCircle, color: "text-muted-foreground" };
    if (isPast(new Date(code.valid_until))) return { label: "Wygasł", icon: Clock, color: "text-amber-500" };
    return { label: "Aktywny", icon: CheckCircle2, color: "text-green-500" };
  };

  const filteredClients = clients?.filter(client =>
    client.salon_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.owner_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedClient = clients?.find(c => c.id === selectedClientId);

  return (
    <AppLayout>
      <div className="h-[calc(100vh-4rem)]">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          {/* Nagłówek z zakładkami */}
          <div className="border-b bg-background px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Aurine Academy</h1>
              <TabsList>
                <TabsTrigger value="clients" className="gap-2">
                  <Users className="h-4 w-4" />
                  Klientki
                </TabsTrigger>
                <TabsTrigger value="codes" className="gap-2">
                  <Key className="h-4 w-4" />
                  Generuj kody
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          {/* Zakładka: Klientki */}
          <TabsContent value="clients" className="flex-1 m-0 overflow-hidden">
            <div className="flex h-full">
              {/* Lista klientek - lewa strona */}
              <div className="w-80 border-r bg-muted/30 flex flex-col">
                <div className="p-4 border-b">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Szukaj klientki..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {isLoading ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      Ładowanie...
                    </div>
                  ) : filteredClients?.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      Brak klientek
                    </div>
                  ) : (
                    filteredClients?.map(client => {
                      const status = getCodeStatus(client.subscription_code);
                      const isSelected = selectedClientId === client.id;
                      
                      return (
                        <button
                          key={client.id}
                          onClick={() => setSelectedClientId(client.id)}
                          className={`w-full p-3 rounded-lg text-left transition-colors ${
                            isSelected 
                              ? "bg-primary/10 border border-primary/30" 
                              : "hover:bg-muted border border-transparent"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10 shrink-0">
                              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                {client.salon_name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{client.salon_name}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {client.owner_name || "Brak właściciela"}
                              </p>
                              <div className="flex items-center gap-1 mt-1">
                                <status.icon className={`h-3 w-3 ${status.color}`} />
                                <span className={`text-xs ${status.color}`}>{status.label}</span>
                                {client.subscription_code && (
                                  <code className="text-xs font-mono bg-muted px-1 rounded ml-auto">
                                    {client.subscription_code.code}
                                  </code>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Profil klientki - prawa strona */}
              <div className="flex-1 overflow-y-auto">
                {selectedClientId && selectedClient ? (
                  <ClientAcademyProfile 
                    clientId={selectedClientId} 
                    clientName={selectedClient.salon_name}
                    ownerName={selectedClient.owner_name}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Wybierz klientkę z listy</p>
                      <p className="text-sm">aby zarządzać jej profilem w Aurine Academy</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Zakładka: Generuj kody */}
          <TabsContent value="codes" className="flex-1 m-0 overflow-y-auto p-6">
            <GenerateCodeSection />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default AurineAcademy;
