import { useState, useEffect } from "react";
import { Shield, Plus, Trash2, Crown, User, Settings, Check, X, Loader2, AlertTriangle, Key, Database, Activity, Users, Mail, Eye, EyeOff, Save, BarChart3, FileText, Calendar, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { AppLayout } from "@/components/layout/AppLayout";
import { useUserRole, AppRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Navigate, useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { BackupRestoreSection } from "@/components/admin/BackupRestoreSection";

interface TeamMember {
  id: string;
  email: string | null;
  fullName: string | null;
  role: AppRole | null;
  roleId: string | null;
  customRoleId: string | null;
}

interface CustomRole {
  id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  created_at: string;
}

interface RolePermission {
  id: string;
  role_id: string;
  permission: string;
}

interface ZohoCredentials {
  id?: string;
  email_account: string;
  client_id: string;
  client_secret: string;
  refresh_token: string;
}

interface SystemStats {
  totalLeads: number;
  totalClients: number;
  totalCampaigns: number;
  totalDocuments: number;
  totalTasks: number;
  totalUsers: number;
}

const PERMISSION_LABELS: Record<string, { label: string; category: string }> = {
  leads_view: { label: "Przeglądanie leadów", category: "Leady" },
  leads_create: { label: "Tworzenie leadów", category: "Leady" },
  leads_edit: { label: "Edycja leadów", category: "Leady" },
  leads_delete: { label: "Usuwanie leadów", category: "Leady" },
  clients_view: { label: "Przeglądanie klientów", category: "Klienci" },
  clients_create: { label: "Tworzenie klientów", category: "Klienci" },
  clients_edit: { label: "Edycja klientów", category: "Klienci" },
  clients_delete: { label: "Usuwanie klientów", category: "Klienci" },
  campaigns_view: { label: "Przeglądanie kampanii", category: "Kampanie" },
  campaigns_create: { label: "Tworzenie kampanii", category: "Kampanie" },
  campaigns_edit: { label: "Edycja kampanii", category: "Kampanie" },
  campaigns_delete: { label: "Usuwanie kampanii", category: "Kampanie" },
  documents_view: { label: "Przeglądanie dokumentów", category: "Dokumenty" },
  documents_create: { label: "Tworzenie dokumentów", category: "Dokumenty" },
  documents_edit: { label: "Edycja dokumentów", category: "Dokumenty" },
  documents_delete: { label: "Usuwanie dokumentów", category: "Dokumenty" },
  tasks_view: { label: "Przeglądanie zadań", category: "Zadania" },
  tasks_create: { label: "Tworzenie zadań", category: "Zadania" },
  tasks_edit: { label: "Edycja zadań", category: "Zadania" },
  tasks_delete: { label: "Usuwanie zadań", category: "Zadania" },
  calendar_view: { label: "Przeglądanie kalendarza", category: "Kalendarz" },
  calendar_manage: { label: "Zarządzanie wydarzeniami", category: "Kalendarz" },
  templates_manage: { label: "Zarządzanie szablonami", category: "Szablony" },
  reports_generate: { label: "Generowanie raportów", category: "Generatory" },
  invoices_generate: { label: "Generowanie faktur", category: "Generatory" },
  contracts_generate: { label: "Generowanie umów", category: "Generatory" },
  presentations_generate: { label: "Generowanie prezentacji", category: "Generatory" },
  team_manage: { label: "Zarządzanie zespołem", category: "Administracja" },
  roles_manage: { label: "Zarządzanie rolami", category: "Administracja" },
};

const ALL_PERMISSIONS = Object.keys(PERMISSION_LABELS);

export default function AdminPanel() {
  const { user } = useAuth();
  const { isSzef, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalLeads: 0,
    totalClients: 0,
    totalCampaigns: 0,
    totalDocuments: 0,
    totalTasks: 0,
    totalUsers: 0,
  });
  
  // Zoho credentials
  const [savingCredentials, setSavingCredentials] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [kontaktCreds, setKontaktCreds] = useState<ZohoCredentials>({
    email_account: 'kontakt@aurine.pl',
    client_id: '',
    client_secret: '',
    refresh_token: '',
  });
  const [biuroCreds, setBiuroCreds] = useState<ZohoCredentials>({
    email_account: 'biuro@aurine.pl',
    client_id: '',
    client_secret: '',
    refresh_token: '',
  });
  
  // New role form
  const [isNewRoleDialogOpen, setIsNewRoleDialogOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [newRolePermissions, setNewRolePermissions] = useState<string[]>([]);
  
  // Edit permissions
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<string[]>([]);

  useEffect(() => {
    if (!isSzef) return;
    fetchAll();
  }, [isSzef]);

  const fetchAll = async () => {
    await Promise.all([
      fetchMembers(), 
      fetchCustomRoles(), 
      fetchRolePermissions(),
      fetchZohoCredentials(),
      fetchSystemStats()
    ]);
    setLoading(false);
  };

  const fetchSystemStats = async () => {
    const [leads, clients, campaigns, documents, tasks, users] = await Promise.all([
      supabase.from('leads').select('id', { count: 'exact', head: true }),
      supabase.from('clients').select('id', { count: 'exact', head: true }),
      supabase.from('campaigns').select('id', { count: 'exact', head: true }),
      supabase.from('documents').select('id', { count: 'exact', head: true }),
      supabase.from('tasks').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
    ]);
    
    setSystemStats({
      totalLeads: leads.count || 0,
      totalClients: clients.count || 0,
      totalCampaigns: campaigns.count || 0,
      totalDocuments: documents.count || 0,
      totalTasks: tasks.count || 0,
      totalUsers: users.count || 0,
    });
  };

  const fetchZohoCredentials = async () => {
    const { data, error } = await supabase
      .from('zoho_credentials')
      .select('*');
    
    if (!error && data) {
      const kontakt = data.find(c => c.email_account === 'kontakt@aurine.pl');
      const biuro = data.find(c => c.email_account === 'biuro@aurine.pl');
      
      if (kontakt) {
        setKontaktCreds({
          id: kontakt.id,
          email_account: kontakt.email_account,
          client_id: kontakt.client_id,
          client_secret: kontakt.client_secret,
          refresh_token: kontakt.refresh_token,
        });
      }
      if (biuro) {
        setBiuroCreds({
          id: biuro.id,
          email_account: biuro.email_account,
          client_id: biuro.client_id,
          client_secret: biuro.client_secret,
          refresh_token: biuro.refresh_token,
        });
      }
    }
  };

  const saveZohoCredentials = async (creds: ZohoCredentials) => {
    setSavingCredentials(true);
    try {
      if (creds.id) {
        const { error } = await supabase
          .from('zoho_credentials')
          .update({
            client_id: creds.client_id,
            client_secret: creds.client_secret,
            refresh_token: creds.refresh_token,
          })
          .eq('id', creds.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('zoho_credentials')
          .insert({
            email_account: creds.email_account,
            client_id: creds.client_id,
            client_secret: creds.client_secret,
            refresh_token: creds.refresh_token,
          });
        
        if (error) throw error;
      }
      
      toast.success(`Zapisano kredencjały dla ${creds.email_account}`);
      fetchZohoCredentials();
    } catch (error: any) {
      toast.error(`Błąd: ${error.message}`);
    }
    setSavingCredentials(false);
  };

  const handleDeleteUser = async (memberId: string) => {
    if (memberId === user?.id) {
      toast.error("Nie możesz usunąć własnego konta");
      return;
    }
    
    setDeletingUserId(memberId);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error("No session");
      }
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ userId: memberId }),
        }
      );
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete user');
      }
      
      toast.success("Użytkownik został usunięty");
      fetchMembers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Błąd podczas usuwania użytkownika");
    } finally {
      setDeletingUserId(null);
    }
  };

  const fetchMembers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name');

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('id, user_id, role, custom_role_id');

      if (rolesError) throw rolesError;

      const rolesMap = (roles || []).reduce((acc, r) => {
        acc[r.user_id] = { role: r.role as AppRole, roleId: r.id, customRoleId: r.custom_role_id };
        return acc;
      }, {} as Record<string, { role: AppRole; roleId: string; customRoleId: string | null }>);

      const formattedMembers: TeamMember[] = (profiles || []).map(p => ({
        id: p.id,
        email: p.email,
        fullName: p.full_name,
        role: rolesMap[p.id]?.role || null,
        roleId: rolesMap[p.id]?.roleId || null,
        customRoleId: rolesMap[p.id]?.customRoleId || null
      }));

      setMembers(formattedMembers);
    } catch (err) {
      console.error('Error fetching members:', err);
      toast.error('Błąd podczas pobierania użytkowników');
    }
  };

  const fetchCustomRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_roles')
        .select('*')
        .order('is_system', { ascending: false })
        .order('name');

      if (error) throw error;
      setCustomRoles(data || []);
    } catch (err) {
      console.error('Error fetching custom roles:', err);
    }
  };

  const fetchRolePermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*');

      if (error) throw error;
      setRolePermissions(data || []);
    } catch (err) {
      console.error('Error fetching role permissions:', err);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: AppRole | 'none', customRoleId?: string) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    try {
      if (newRole === 'none') {
        if (member.roleId) {
          const { error } = await supabase
            .from('user_roles')
            .delete()
            .eq('id', member.roleId);

          if (error) throw error;
        }
      } else if (member.roleId) {
        const { error } = await supabase
          .from('user_roles')
          .update({ role: newRole, custom_role_id: customRoleId || null })
          .eq('id', member.roleId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: memberId, role: newRole, custom_role_id: customRoleId || null });

        if (error) throw error;
      }

      toast.success('Rola została zaktualizowana');
      fetchMembers();
    } catch (err) {
      console.error('Error updating role:', err);
      toast.error('Błąd podczas aktualizacji roli');
    }
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) {
      toast.error('Podaj nazwę roli');
      return;
    }

    try {
      const { data: newRole, error: roleError } = await supabase
        .from('custom_roles')
        .insert({
          name: newRoleName.trim(),
          description: newRoleDescription.trim() || null,
          created_by: user?.id
        })
        .select()
        .single();

      if (roleError) throw roleError;

      if (newRolePermissions.length > 0) {
        const permissionInserts = newRolePermissions.map(p => ({
          role_id: newRole.id,
          permission: p as any
        }));

        const { error: permError } = await supabase
          .from('role_permissions')
          .insert(permissionInserts);

        if (permError) throw permError;
      }

      toast.success('Rola została utworzona');
      setIsNewRoleDialogOpen(false);
      setNewRoleName("");
      setNewRoleDescription("");
      setNewRolePermissions([]);
      fetchAll();
    } catch (err: any) {
      console.error('Error creating role:', err);
      if (err.code === '23505') {
        toast.error('Rola o takiej nazwie już istnieje');
      } else {
        toast.error('Błąd podczas tworzenia roli');
      }
    }
  };

  const handleDeleteRole = async (role: CustomRole) => {
    if (role.is_system) {
      toast.error('Nie można usunąć systemowej roli');
      return;
    }

    try {
      const { error } = await supabase
        .from('custom_roles')
        .delete()
        .eq('id', role.id);

      if (error) throw error;

      toast.success('Rola została usunięta');
      fetchAll();
    } catch (err) {
      console.error('Error deleting role:', err);
      toast.error('Błąd podczas usuwania roli');
    }
  };

  const handleEditPermissions = (role: CustomRole) => {
    const perms = rolePermissions
      .filter(rp => rp.role_id === role.id)
      .map(rp => rp.permission);
    setEditingRoleId(role.id);
    setEditingPermissions(perms);
  };

  const handleSavePermissions = async () => {
    if (!editingRoleId) return;

    try {
      await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', editingRoleId);

      if (editingPermissions.length > 0) {
        const permissionInserts = editingPermissions.map(p => ({
          role_id: editingRoleId,
          permission: p as any
        }));

        const { error } = await supabase
          .from('role_permissions')
          .insert(permissionInserts);

        if (error) throw error;
      }

      toast.success('Uprawnienia zostały zapisane');
      setEditingRoleId(null);
      fetchRolePermissions();
    } catch (err) {
      console.error('Error saving permissions:', err);
      toast.error('Błąd podczas zapisywania uprawnień');
    }
  };

  const toggleNewRolePermission = (permission: string) => {
    setNewRolePermissions(prev =>
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const toggleEditingPermission = (permission: string) => {
    setEditingPermissions(prev =>
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const getPermissionsByCategory = () => {
    const categories: Record<string, string[]> = {};
    ALL_PERMISSIONS.forEach(p => {
      const cat = PERMISSION_LABELS[p]?.category || 'Inne';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(p);
    });
    return categories;
  };

  const getRolePermissionCount = (roleId: string) => {
    return rolePermissions.filter(rp => rp.role_id === roleId).length;
  };

  const getCustomRoleForMember = (member: TeamMember) => {
    if (member.customRoleId) {
      return customRoles.find(r => r.id === member.customRoleId);
    }
    if (member.role) {
      return customRoles.find(r => r.name.toLowerCase() === member.role);
    }
    return null;
  };

  if (roleLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!isSzef) {
    return <Navigate to="/" replace />;
  }

  const permissionCategories = getPermissionsByCategory();

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 w-full max-w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Panel administracyjny</h1>
              <p className="text-muted-foreground">
                Zarządzaj użytkownikami, rolami i ustawieniami systemu
              </p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Przegląd
            </TabsTrigger>
            <TabsTrigger value="members" className="gap-2">
              <Users className="w-4 h-4" />
              Użytkownicy
            </TabsTrigger>
            <TabsTrigger value="roles" className="gap-2">
              <Shield className="w-4 h-4" />
              Role
            </TabsTrigger>
            <TabsTrigger value="integrations" className="gap-2">
              <Key className="w-4 h-4" />
              Integracje
            </TabsTrigger>
            <TabsTrigger value="backup" className="gap-2">
              <HardDrive className="w-4 h-4" />
              Backup
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Użytkownicy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{systemStats.totalUsers}</p>
                </CardContent>
              </Card>
              
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Leady
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{systemStats.totalLeads}</p>
                </CardContent>
              </Card>
              
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    Klienci
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{systemStats.totalClients}</p>
                </CardContent>
              </Card>
              
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Kampanie
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{systemStats.totalCampaigns}</p>
                </CardContent>
              </Card>
              
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Dokumenty
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{systemStats.totalDocuments}</p>
                </CardContent>
              </Card>
              
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Zadania
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{systemStats.totalTasks}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Informacje o systemie</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">CRON Follow-upy</span>
                  <span className="text-green-400">Aktywny (10:00 codziennie)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Integracja Zoho</span>
                  <span className={kontaktCreds.client_id ? "text-green-400" : "text-amber-400"}>
                    {kontaktCreds.client_id ? "Skonfigurowana" : "Wymaga konfiguracji"}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Liczba ról</span>
                  <span>{customRoles.length}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Członkowie zespołu ({members.length})</CardTitle>
                <CardDescription>Zarządzaj użytkownikami i ich rolami</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="p-8 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                  </div>
                ) : members.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    Brak użytkowników w systemie
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {members.map((member) => {
                      const customRole = getCustomRoleForMember(member);
                      return (
                        <div key={member.id} className="py-4 flex items-center justify-between gap-4">
                          <div 
                            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => navigate(`/profile/${member.id}`)}
                          >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              member.role === 'szef' ? 'bg-amber-500/20' : 'bg-secondary'
                            }`}>
                              {member.role === 'szef' ? (
                                <Crown className="w-5 h-5 text-amber-500" />
                              ) : (
                                <User className="w-5 h-5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-foreground truncate hover:text-primary transition-colors">
                                {member.fullName || 'Brak imienia'}
                                {member.id === user?.id && (
                                  <span className="text-xs text-muted-foreground ml-2">(Ty)</span>
                                )}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                              {customRole && (
                                <p className="text-xs text-primary mt-0.5">
                                  {getRolePermissionCount(customRole.id)} uprawnień
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Select
                              value={member.customRoleId || member.role || 'none'}
                              onValueChange={(value) => {
                                const selectedRole = customRoles.find(r => r.id === value);
                                if (selectedRole) {
                                  const appRole = selectedRole.name.toLowerCase() === 'szef' ? 'szef' : 'pracownik';
                                  handleRoleChange(member.id, appRole as AppRole, value);
                                } else if (value === 'none') {
                                  handleRoleChange(member.id, 'none');
                                }
                              }}
                              disabled={member.id === user?.id}
                            >
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Wybierz rolę" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Brak roli</SelectItem>
                                {customRoles.map(role => (
                                  <SelectItem key={role.id} value={role.id}>
                                    {role.name}
                                    {role.is_system && " (systemowa)"}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            {member.id !== user?.id && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="text-destructive hover:text-destructive"
                                    disabled={deletingUserId === member.id}
                                  >
                                    {deletingUserId === member.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-4 h-4" />
                                    )}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="flex items-center gap-2">
                                      <AlertTriangle className="w-5 h-5 text-destructive" />
                                      Usunąć konto użytkownika?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Ta akcja jest nieodwracalna. Wszystkie dane użytkownika {member.fullName || member.email} zostaną trwale usunięte.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Anuluj</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleDeleteUser(member.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Usuń konto
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Roles Tab */}
          <TabsContent value="roles" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={isNewRoleDialogOpen} onOpenChange={setIsNewRoleDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Nowa rola
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Utwórz nową rolę</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nazwa roli</Label>
                      <Input
                        value={newRoleName}
                        onChange={(e) => setNewRoleName(e.target.value)}
                        placeholder="np. Manager, Stażysta"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Opis (opcjonalnie)</Label>
                      <Textarea
                        value={newRoleDescription}
                        onChange={(e) => setNewRoleDescription(e.target.value)}
                        placeholder="Opis roli..."
                        rows={2}
                      />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Uprawnienia</Label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setNewRolePermissions(ALL_PERMISSIONS)}
                          >
                            Zaznacz wszystkie
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setNewRolePermissions([])}
                          >
                            Odznacz
                          </Button>
                        </div>
                      </div>
                      {Object.entries(permissionCategories).map(([category, permissions]) => (
                        <div key={category} className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">{category}</p>
                          <div className="grid grid-cols-2 gap-2">
                            {permissions.map(permission => (
                              <label
                                key={permission}
                                className="flex items-center gap-2 text-sm cursor-pointer hover:bg-secondary/50 p-2 rounded-md"
                              >
                                <Checkbox
                                  checked={newRolePermissions.includes(permission)}
                                  onCheckedChange={() => toggleNewRolePermission(permission)}
                                />
                                {PERMISSION_LABELS[permission]?.label || permission}
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsNewRoleDialogOpen(false)}>
                        Anuluj
                      </Button>
                      <Button onClick={handleCreateRole}>
                        Utwórz rolę
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {customRoles.map(role => {
                const isEditing = editingRoleId === role.id;
                const permCount = getRolePermissionCount(role.id);
                
                return (
                  <Card key={role.id} className={isEditing ? 'ring-2 ring-primary' : ''}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            role.name === 'Szef' ? 'bg-amber-500/20' : 'bg-primary/10'
                          }`}>
                            {role.name === 'Szef' ? (
                              <Crown className="w-4 h-4 text-amber-500" />
                            ) : (
                              <Shield className="w-4 h-4 text-primary" />
                            )}
                          </div>
                          <div>
                            <CardTitle className="text-base flex items-center gap-2">
                              {role.name}
                              {role.is_system && (
                                <span className="text-xs font-normal text-muted-foreground">(systemowa)</span>
                              )}
                            </CardTitle>
                            {role.description && (
                              <p className="text-xs text-muted-foreground">{role.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {isEditing ? (
                            <>
                              <Button size="icon" variant="ghost" onClick={handleSavePermissions}>
                                <Check className="w-4 h-4 text-green-500" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => setEditingRoleId(null)}>
                                <X className="w-4 h-4 text-red-500" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button size="icon" variant="ghost" onClick={() => handleEditPermissions(role)}>
                                <Settings className="w-4 h-4" />
                              </Button>
                              {!role.is_system && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="icon" variant="ghost" className="text-destructive">
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Usunąć rolę?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Czy na pewno chcesz usunąć rolę "{role.name}"?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Anuluj</AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={() => handleDeleteRole(role)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Usuń
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {isEditing ? (
                        <div className="space-y-3">
                          <div className="flex gap-2 mb-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingPermissions(ALL_PERMISSIONS)}
                            >
                              Wszystkie
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingPermissions([])}
                            >
                              Odznacz
                            </Button>
                          </div>
                          {Object.entries(permissionCategories).map(([category, permissions]) => (
                            <div key={category} className="space-y-1">
                              <p className="text-xs font-medium text-muted-foreground">{category}</p>
                              <div className="grid grid-cols-2 gap-1">
                                {permissions.map(permission => (
                                  <label
                                    key={permission}
                                    className="flex items-center gap-2 text-xs cursor-pointer hover:bg-secondary/50 p-1.5 rounded"
                                  >
                                    <Checkbox
                                      checked={editingPermissions.includes(permission)}
                                      onCheckedChange={() => toggleEditingPermission(permission)}
                                    />
                                    {PERMISSION_LABELS[permission]?.label || permission}
                                  </label>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            {permCount} {permCount === 1 ? 'uprawnienie' : permCount < 5 ? 'uprawnienia' : 'uprawnień'}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {rolePermissions
                              .filter(rp => rp.role_id === role.id)
                              .slice(0, 5)
                              .map(rp => (
                                <span
                                  key={rp.id}
                                  className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                                >
                                  {PERMISSION_LABELS[rp.permission]?.label || rp.permission}
                                </span>
                              ))}
                            {permCount > 5 && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                                +{permCount - 5} więcej
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Zoho Mail API
                </CardTitle>
                <CardDescription>
                  Konfiguracja integracji z Zoho Mail do automatycznych follow-upów
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* kontakt@aurine.pl */}
                <div className="space-y-4 p-4 rounded-lg border border-border/50 bg-secondary/20">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">kontakt@aurine.pl</p>
                      <p className="text-xs text-muted-foreground">Główne konto kontaktowe</p>
                    </div>
                  </div>
                  
                  <div className="grid gap-3">
                    <div>
                      <Label className="text-xs">Client ID</Label>
                      <Input
                        value={kontaktCreds.client_id}
                        onChange={(e) => setKontaktCreds(p => ({ ...p, client_id: e.target.value }))}
                        placeholder="Zoho Client ID"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Client Secret</Label>
                      <div className="relative">
                        <Input
                          type={showSecrets['kontakt_secret'] ? 'text' : 'password'}
                          value={kontaktCreds.client_secret}
                          onChange={(e) => setKontaktCreds(p => ({ ...p, client_secret: e.target.value }))}
                          placeholder="Zoho Client Secret"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0"
                          onClick={() => setShowSecrets(p => ({ ...p, kontakt_secret: !p.kontakt_secret }))}
                        >
                          {showSecrets['kontakt_secret'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Refresh Token</Label>
                      <div className="relative">
                        <Input
                          type={showSecrets['kontakt_token'] ? 'text' : 'password'}
                          value={kontaktCreds.refresh_token}
                          onChange={(e) => setKontaktCreds(p => ({ ...p, refresh_token: e.target.value }))}
                          placeholder="Zoho Refresh Token"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0"
                          onClick={() => setShowSecrets(p => ({ ...p, kontakt_token: !p.kontakt_token }))}
                        >
                          {showSecrets['kontakt_token'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    <Button 
                      onClick={() => saveZohoCredentials(kontaktCreds)}
                      disabled={savingCredentials}
                      className="w-full"
                    >
                      {savingCredentials ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                      Zapisz
                    </Button>
                  </div>
                </div>

                {/* biuro@aurine.pl */}
                <div className="space-y-4 p-4 rounded-lg border border-border/50 bg-secondary/20">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-amber-500" />
                    </div>
                    <div>
                      <p className="font-medium">biuro@aurine.pl</p>
                      <p className="text-xs text-muted-foreground">Konto biurowe</p>
                    </div>
                  </div>
                  
                  <div className="grid gap-3">
                    <div>
                      <Label className="text-xs">Client ID</Label>
                      <Input
                        value={biuroCreds.client_id}
                        onChange={(e) => setBiuroCreds(p => ({ ...p, client_id: e.target.value }))}
                        placeholder="Zoho Client ID"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Client Secret</Label>
                      <div className="relative">
                        <Input
                          type={showSecrets['biuro_secret'] ? 'text' : 'password'}
                          value={biuroCreds.client_secret}
                          onChange={(e) => setBiuroCreds(p => ({ ...p, client_secret: e.target.value }))}
                          placeholder="Zoho Client Secret"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0"
                          onClick={() => setShowSecrets(p => ({ ...p, biuro_secret: !p.biuro_secret }))}
                        >
                          {showSecrets['biuro_secret'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Refresh Token</Label>
                      <div className="relative">
                        <Input
                          type={showSecrets['biuro_token'] ? 'text' : 'password'}
                          value={biuroCreds.refresh_token}
                          onChange={(e) => setBiuroCreds(p => ({ ...p, refresh_token: e.target.value }))}
                          placeholder="Zoho Refresh Token"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0"
                          onClick={() => setShowSecrets(p => ({ ...p, biuro_token: !p.biuro_token }))}
                        >
                          {showSecrets['biuro_token'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    <Button 
                      onClick={() => saveZohoCredentials(biuroCreds)}
                      disabled={savingCredentials}
                      className="w-full"
                    >
                      {savingCredentials ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                      Zapisz
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Backup Tab */}
          <TabsContent value="backup" className="space-y-6">
            <BackupRestoreSection />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
