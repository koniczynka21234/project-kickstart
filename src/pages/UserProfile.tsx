import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { 
  User, Mail, Phone, Briefcase, FileText, Calendar, 
  Save, Loader2, ArrowLeft, Clock, Trash2, AlertTriangle, Crown, Shield
} from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
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

interface UserProfileData {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
  position: string | null;
  status: string | null;
  last_seen_at: string | null;
  created_at: string;
}

interface UserDocument {
  id: string;
  type: string;
  title: string;
  created_at: string;
}

export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { isSzef } = useUserRole();
  
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Form state
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState("");

  const isOwnProfile = currentUser?.id === id;
  const canEdit = isOwnProfile || isSzef;
  const canDelete = isSzef && !isOwnProfile;

  useEffect(() => {
    if (id) {
      fetchProfile();
      fetchUserDocuments();
      fetchUserRole();
    }
  }, [id]);

  const fetchUserRole = async () => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", id)
      .single();
    
    setUserRole(data?.role || null);
  };

  const fetchProfile = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      toast.error("Nie znaleziono użytkownika");
      navigate("/");
      return;
    }

    setProfile(data);
    setFullName(data.full_name || "");
    setBio(data.bio || "");
    setPhone(data.phone || "");
    setPosition(data.position || "");
    setLoading(false);
  };

  const fetchUserDocuments = async () => {
    const { data } = await supabase
      .from("documents")
      .select("id, type, title, created_at")
      .eq("created_by", id)
      .order("created_at", { ascending: false })
      .limit(10);

    setDocuments(data || []);
  };

  const handleSave = async () => {
    if (!id) return;
    
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        bio,
        phone,
        position,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    setSaving(false);

    if (error) {
      toast.error("Błąd podczas zapisywania profilu");
      return;
    }

    toast.success("Profil zaktualizowany");
    fetchProfile();
  };

  const handleDeleteUser = async () => {
    if (!id || !canDelete) return;
    
    setDeleting(true);
    
    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error("No session");
      }
      
      // Call edge function to delete user
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ userId: id }),
        }
      );
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete user');
      }
      
      toast.success("Użytkownik został usunięty");
      navigate("/roles");
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Błąd podczas usuwania użytkownika");
    } finally {
      setDeleting(false);
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "online": return "bg-emerald-500";
      case "away": return "bg-amber-500";
      case "busy": return "bg-red-500";
      default: return "bg-zinc-500";
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case "online": return "Online";
      case "away": return "Zaraz wracam";
      case "busy": return "Zajęty";
      default: return "Offline";
    }
  };

  const typeLabels: Record<string, string> = {
    report: "Raport",
    invoice: "Faktura",
    contract: "Umowa",
    presentation: "Prezentacja",
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!profile) return null;

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">
              {isOwnProfile ? "Mój profil" : "Profil użytkownika"}
            </h1>
            <p className="text-muted-foreground">
              {canEdit ? "Zarządzaj informacjami profilu" : "Informacje o użytkowniku"}
            </p>
          </div>
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={deleting}>
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                  Usuń konto
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    Usunąć konto użytkownika?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Ta akcja jest nieodwracalna. Wszystkie dane użytkownika {profile.full_name || profile.email} zostaną trwale usunięte, w tym dokumenty, wiadomości i historia aktywności.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Anuluj</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteUser} 
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Usuń konto
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* Profile Card */}
        <Card className="bg-secondary/30 border-border/50">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="w-24 h-24 border-2 border-border">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="text-2xl bg-primary/20 text-primary">
                    {(profile.full_name || profile.email || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-background ${getStatusColor(profile.status)}`} />
              </div>

              {/* Info */}
              <div className="flex-1 text-center sm:text-left space-y-2">
                <h2 className="text-xl font-semibold text-foreground">
                  {profile.full_name || "Brak nazwy"}
                </h2>
                <p className="text-muted-foreground flex items-center justify-center sm:justify-start gap-2">
                  <Mail className="w-4 h-4" />
                  {profile.email}
                </p>
                {profile.position && (
                  <p className="text-muted-foreground flex items-center justify-center sm:justify-start gap-2">
                    <Briefcase className="w-4 h-4" />
                    {profile.position}
                  </p>
                )}
                <div className="flex items-center justify-center sm:justify-start gap-2 pt-2 flex-wrap">
                  {userRole && (
                    <Badge 
                      variant="outline" 
                      className={userRole === "szef" 
                        ? "gap-1 text-amber-500 border-amber-500/30 bg-amber-500/10" 
                        : "gap-1 text-blue-400 border-blue-400/30 bg-blue-500/10"
                      }
                    >
                      {userRole === "szef" ? <Crown className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                      {userRole === "szef" ? "Szef" : "Pracownik"}
                    </Badge>
                  )}
                  <Badge variant="outline" className="gap-1">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(profile.status)}`} />
                    {getStatusLabel(profile.status)}
                  </Badge>
                  {profile.last_seen_at && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Ostatnio: {format(new Date(profile.last_seen_at), "d MMM, HH:mm", { locale: pl })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="info" className="space-y-4">
          <TabsList>
            <TabsTrigger value="info">Informacje</TabsTrigger>
            <TabsTrigger value="documents">Dokumenty ({documents.length})</TabsTrigger>
          </TabsList>

          {/* Info Tab */}
          <TabsContent value="info" className="space-y-4">
            <Card className="bg-secondary/30 border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Dane osobowe
                </CardTitle>
                <CardDescription>
                  {canEdit ? "Edytuj informacje profilu" : "Informacje o użytkowniku"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Imię i nazwisko</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={!canEdit}
                      placeholder="Jan Kowalski"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Stanowisko</Label>
                    <Input
                      id="position"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      disabled={!canEdit}
                      placeholder="np. Specjalista ds. marketingu"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={!canEdit}
                    placeholder="+48 123 456 789"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">O mnie</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    disabled={!canEdit}
                    placeholder="Napisz coś o sobie..."
                    rows={4}
                  />
                </div>

                {canEdit && (
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Zapisz zmiany
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Account info */}
            <Card className="bg-secondary/30 border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Informacje o koncie
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Data rejestracji</p>
                    <p className="font-medium">
                      {format(new Date(profile.created_at), "d MMMM yyyy", { locale: pl })}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">ID użytkownika</p>
                    <p className="font-mono text-xs">{profile.id}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <Card className="bg-secondary/30 border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Ostatnie dokumenty
                </CardTitle>
                <CardDescription>
                  Dokumenty wygenerowane przez tego użytkownika
                </CardDescription>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Brak dokumentów
                  </p>
                ) : (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-colors cursor-pointer"
                        onClick={() => navigate("/history")}
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{doc.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {typeLabels[doc.type] || doc.type}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(doc.created_at), "d MMM yyyy", { locale: pl })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}