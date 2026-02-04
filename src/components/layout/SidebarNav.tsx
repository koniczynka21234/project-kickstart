import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useEffect, useState, useRef, useLayoutEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSidebarBadges } from "@/hooks/useSidebarBadges";
import { 
  LayoutDashboard, FileText, Receipt, FileSignature, Presentation,
  History, Users, UserPlus, LogOut, User, Shield, Crown,
  Target, Mail, CheckSquare, TrendingDown, Bell, UsersRound, Calendar,
  Settings, Zap, X, MailCheck, Sparkles, Gift, Megaphone, Wand2, Share2,
  Smartphone, BarChart3, PieChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import agencyLogo from "@/assets/agency-logo.png";

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

interface SidebarNavProps {
  onNavigate?: () => void;
  showCloseButton?: boolean;
  onClose?: () => void;
}

// Store scroll position in sessionStorage to persist across re-renders and navigations
const SCROLL_KEY = 'sidebar-scroll-position';

// Global cache for user profile to prevent flickering on remount
const userProfileCache = new Map<string, string>();

export function SidebarNav({ onNavigate, showCloseButton, onClose }: SidebarNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isSzef, role, loading: roleLoading } = useUserRole();
  const currentPath = location.pathname;
  
  // Use cached badge hook to prevent flickering
  const { badges } = useSidebarBadges(user?.id);
  
  // Initialize from cache to prevent flickering
  const [userFullName, setUserFullName] = useState<string | null>(() => {
    if (user?.id) {
      return userProfileCache.get(user.id) ?? null;
    }
    return null;
  });
  const navRef = useRef<HTMLElement>(null);
  const isRestoringScroll = useRef(false);
  const fetchedProfileRef = useRef<string | null>(null);

  const isActive = (path: string) => currentPath === path;

  // Fetch user's full name from profile - with caching
  useEffect(() => {
    if (!user?.id) return;
    
    // Check cache first
    const cached = userProfileCache.get(user.id);
    if (cached) {
      setUserFullName(cached);
    }
    
    // Don't refetch if already fetched for this user
    if (fetchedProfileRef.current === user.id) return;
    
    const fetchUserProfile = async () => {
      fetchedProfileRef.current = user.id;
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();
      if (data?.full_name) {
        setUserFullName(data.full_name);
        userProfileCache.set(user.id, data.full_name);
      }
    };
    fetchUserProfile();
  }, [user?.id]);

  // Restore scroll position only on mount (e.g. when sidebar gets remounted)
  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    
    const savedPosition = sessionStorage.getItem(SCROLL_KEY);
    if (savedPosition) {
      isRestoringScroll.current = true;
      const position = parseInt(savedPosition, 10);
      // Use multiple frames to ensure DOM is fully ready
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          nav.scrollTop = position;
          isRestoringScroll.current = false;
        });
      });
    }
  }, []);

  // Check if today is the last day of the month
  const isLastDayOfMonth = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.getDate() === 1;
  };
  
  // Show report reminder only if it's last day of month AND report not yet saved
  const showReportReminder = isLastDayOfMonth() && !badges.hasCurrentMonthReport;

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleNavigate = useCallback((url: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    // Save scroll position before navigation
    if (navRef.current) {
      sessionStorage.setItem(SCROLL_KEY, navRef.current.scrollTop.toString());
    }
    navigate(url);
    onNavigate?.();
  }, [navigate, onNavigate]);

  // Save scroll position on scroll - debounced to avoid excessive writes
  const scrollTimeoutRef = useRef<number | null>(null);
  const handleScroll = useCallback(() => {
    if (navRef.current && !isRestoringScroll.current) {
      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
      // Debounce the sessionStorage write
      scrollTimeoutRef.current = window.setTimeout(() => {
        if (navRef.current) {
          sessionStorage.setItem(SCROLL_KEY, navRef.current.scrollTop.toString());
        }
      }, 100);
    }
  }, []);

  // Prevent menu flicker: keep Szef-only items visible while role is loading.
  // If the user is not a szef, they will disappear once roleLoading finishes.
  const showSzefNavItems = isSzef || (!!user && roleLoading);

  const mainItems: NavItem[] = [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Raport miesięczny", url: "/monthly-report", icon: BarChart3, badge: showReportReminder ? "!" : undefined },
    { title: "Statystyki", url: "/statistics", icon: PieChart },
    { title: "Zadania", url: "/tasks", icon: CheckSquare, badge: badges.incompleteTasks || undefined },
    { title: "Zespół", url: "/team", icon: UsersRound },
    { title: "Powiadomienia", url: "/notifications", icon: Bell },
  ];

  // Calculate total client issues (expiring contracts + missing invoices + upcoming payments + pending final invoices)
  const clientBadgeCount = badges.expiringContracts + badges.clientsNeedingInvoice + badges.upcomingPayments + badges.pendingFinalInvoices;

  const crmItems: NavItem[] = [
    { title: "Leady", url: "/leads", icon: UserPlus, badge: badges.leadsNeedingAction || undefined },
    { title: "Klienci", url: "/clients", icon: Users, badge: clientBadgeCount || undefined },
    { title: "Lejek", url: "/funnel", icon: TrendingDown },
    { title: "Kalendarz", url: "/calendar", icon: Calendar, badge: badges.todayEvents || undefined },
    { title: "Kampanie", url: "/campaigns", icon: Target, badge: badges.campaignsNeedingMetrics || undefined },
    { title: "Auto Follow-up", url: "/auto-followups", icon: MailCheck, badge: badges.pendingFollowUps || undefined },
    { title: "Aurine Academy", url: "/aurine-academy", icon: Smartphone },
    { title: "Obsługa klienta", url: "/client-service", icon: Sparkles },
    { title: "Social Media", url: "/social-media", icon: Share2 },
    { title: "Szablony", url: "/templates", icon: Mail },
  ];

  const toolItems: NavItem[] = [
    { title: "Raporty", url: "/report-generator", icon: FileText },
    { title: "Faktury", url: "/invoice-generator", icon: Receipt },
    { title: "Umowy", url: "/contract-generator", icon: FileSignature },
    { title: "Prezentacje", url: "/presentation-generator", icon: Presentation },
    { title: "Welcome Pack", url: "/welcome-pack-generator", icon: Gift },
    { title: "Kampanie AI", url: "/campaign-generator", icon: Megaphone },
    { title: "Grafiki", url: "/graphics-creator", icon: Wand2 },
    { title: "Historia", url: "/history", icon: History },
  ];

  const sections: NavSection[] = [
    { label: "Menu", items: mainItems },
    { label: "CRM", items: crmItems },
    { label: "Generatory", items: toolItems },
  ];

  if (isSzef) {
    sections.push({
      label: "Admin",
      items: [
        { title: "Panel admina", url: "/admin", icon: Shield },
      ],
    });
  }

  return (
    <div className="h-full flex flex-col bg-sidebar">
      {/* Header */}
      <div className="flex-shrink-0 p-3 border-b border-sidebar-border/50">
        <div className="flex items-center justify-between">
          <button 
            type="button"
            className="flex items-center gap-2.5 group"
            onClick={(e) => handleNavigate("/", e)}
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center overflow-hidden">
              <img src={agencyLogo} alt="Aurine" className="w-5 h-5 object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-sidebar-foreground">Aurine</span>
              <span className="text-[9px] text-primary font-semibold uppercase tracking-wider">CRM</span>
            </div>
          </button>
          {showCloseButton && (
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav 
        ref={navRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto custom-scrollbar p-2"
      >
        {sections.map((section, sectionIndex) => (
          <div key={section.label} className={cn(sectionIndex > 0 && "mt-4")}>
            <p className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <button
                  type="button"
                  key={item.url}
                  onClick={(e) => handleNavigate(item.url, e)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                    isActive(item.url)
                      ? "bg-primary/15 text-primary font-medium"
                      : "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
                  )}
                >
                  <item.icon className={cn(
                    "w-4 h-4 flex-shrink-0",
                    isActive(item.url) ? "text-primary" : "text-muted-foreground"
                  )} />
                  <span className="flex-1 text-left truncate">{item.title}</span>
                  {item.badge && (typeof item.badge === 'string' || item.badge > 0) && (
                    <span className="min-w-[18px] h-[18px] px-1 text-[10px] font-bold bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="flex-shrink-0 border-t border-sidebar-border/50 p-2 space-y-1">
        <button
          type="button"
          onClick={(e) => handleNavigate("/settings", e)}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          <Settings className="w-4 h-4" />
          <span>Ustawienia</span>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="w-full h-auto p-2 justify-start gap-2.5 bg-sidebar-accent/40 hover:bg-sidebar-accent/70 rounded-lg"
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                isSzef 
                  ? "bg-amber-500/20 border border-amber-500/30" 
                  : "bg-primary/20 border border-primary/30"
              )}>
                {isSzef ? <Crown className="w-4 h-4 text-amber-400" /> : <User className="w-4 h-4 text-primary" />}
              </div>
              <div className="flex-1 text-left overflow-hidden min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {userFullName || user?.email?.split('@')[0] || 'Użytkownik'}
                </p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  {isSzef && <Zap className="w-2.5 h-2.5 text-amber-400" />}
                  {roleLoading ? '' : role === 'szef' ? 'Admin' : role === 'pracownik' ? 'Pracownik' : 'Brak roli'}
                </p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-48">
            <DropdownMenuItem onClick={() => handleNavigate(`/profile/${user?.id}`)} className="cursor-pointer">
              <User className="w-4 h-4 mr-2" />
              Mój profil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
              <LogOut className="w-4 h-4 mr-2" />
              Wyloguj
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
