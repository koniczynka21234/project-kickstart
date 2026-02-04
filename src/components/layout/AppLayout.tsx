import { Menu } from "lucide-react";
import { createContext, useContext, useState } from "react";
import { SidebarNav } from "./SidebarNav";
import { TeamChatPanel } from "@/components/chat/TeamChatPanel";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { useActivityStatus } from "@/hooks/useActivityStatus";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import agencyLogo from "@/assets/agency-logo.png";

interface AppLayoutProps {
  children: React.ReactNode;
  fullScreen?: boolean;
}

// When pages still render <AppLayout> internally, this prevents "double layout".
const AppLayoutNestingContext = createContext(false);

function AppLayoutShell({ children }: { children: React.ReactNode }) {
  useActivityStatus();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <AppLayoutNestingContext.Provider value={true}>
			<div className="h-screen h-[100dvh] bg-background flex w-full overflow-hidden">
        {/* Desktop sidebar - fixed position */}
        <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:z-50">
          <div className="flex flex-col flex-1 overflow-y-auto border-r border-sidebar-border bg-sidebar">
            <SidebarNav />
          </div>
        </aside>

        {/* Mobile header */}
        <header className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-2 px-3 h-14 border-b border-border/30 bg-background/95 backdrop-blur-xl safe-area-top">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] max-w-[80vw] p-0 bg-sidebar border-sidebar-border">
                <SidebarNav
                  onNavigate={() => setMobileMenuOpen(false)}
                  showCloseButton
                  onClose={() => setMobileMenuOpen(false)}
                />
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-2 min-w-0">
              <img src={agencyLogo} alt="Aurine" className="w-7 h-7 shrink-0" />
              <span className="text-sm font-bold text-foreground truncate">Aurine</span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <GlobalSearch />
            <NotificationBell />
          </div>
        </header>

				{/* Main content area - single scroll container */}
				<div className="flex-1 flex flex-col lg:pl-64 w-full min-w-0 overflow-x-hidden overflow-y-auto">
          {/* Desktop header with search and notifications */}
					<div className="hidden lg:flex justify-end items-center gap-3 p-4 sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border/20 flex-shrink-0">
            <GlobalSearch />
            <NotificationBell />
          </div>

          {/* Mobile spacer for fixed header */}
					<div className="lg:hidden h-14 flex-shrink-0" />

          {/* Page content - allow natural page scrolling, no nested scroll */}
					<main className="flex-1 w-full min-w-0 min-h-0">{children}</main>
        </div>

        {/* Team Chat - hidden on mobile */}
        <div className="hidden lg:block">
          <TeamChatPanel />
        </div>
      </div>
    </AppLayoutNestingContext.Provider>
  );
}

export function AppLayout({ children, fullScreen = false }: AppLayoutProps) {
  const isNested = useContext(AppLayoutNestingContext);

  if (fullScreen || isNested) {
    return <>{children}</>;
  }

  return <AppLayoutShell>{children}</AppLayoutShell>;
}