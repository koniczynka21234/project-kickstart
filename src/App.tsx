import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppErrorBoundary } from "@/components/layout/AppErrorBoundary";
import { useAppSettings } from "@/hooks/useAppSettings";
import { AppLayout } from "@/components/layout/AppLayout";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import DocumentHistory from "./pages/DocumentHistory";
import ReportGenerator from "./pages/ReportGenerator";
import InvoiceGenerator from "./pages/InvoiceGenerator";
import ContractGenerator from "./pages/ContractGenerator";
import PresentationGenerator from "./pages/PresentationGenerator";
import Leads from "./pages/Leads";
import LeadProfile from "./pages/LeadProfile";
import Clients from "./pages/Clients";
import ClientProfile from "./pages/ClientProfile";
import Campaigns from "./pages/Campaigns";
import CampaignDetails from "./pages/CampaignDetails";
import Templates from "./pages/Templates";
import FollowUpSms from "./pages/FollowUpSms";
import Tasks from "./pages/Tasks";
import AdminPanel from "./pages/AdminPanel";
import SalesFunnelPage from "./pages/SalesFunnelPage";
import UserProfile from "./pages/UserProfile";
import Notifications from "./pages/Notifications";
import Team from "./pages/Team";
import Calendar from "./pages/Calendar";
import MonthlyReport from "./pages/MonthlyReport";
import Settings from "./pages/Settings";
import ROICalculator from "./pages/ROICalculator";
import ProposalGenerator from "./pages/ProposalGenerator";
import CampaignGenerator from "./pages/CampaignGenerator";
import GraphicsCreator from "./pages/GraphicsCreator";
import AutoFollowUps from "./pages/AutoFollowUps";
import ClientService from "./pages/ClientService";
import WelcomePackGenerator from "./pages/WelcomePackGenerator";
import SocialMediaLibrary from "./pages/SocialMediaLibrary";
import AurineAcademy from "./pages/AurineAcademy";
import Statistics from "./pages/Statistics";
import AuditGenerator from "./pages/AuditGenerator";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedAppShell() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </ProtectedRoute>
  );
}

function AppContent() {
  useAppSettings();
  
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AppErrorBoundary>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route element={<ProtectedAppShell />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/history" element={<DocumentHistory />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/leads/:id" element={<LeadProfile />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/clients/:id" element={<ClientProfile />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/campaigns/:id" element={<CampaignDetails />} />
            <Route path="/funnel" element={<SalesFunnelPage />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/followup-sms" element={<FollowUpSms />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/profile/:id" element={<UserProfile />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/team" element={<Team />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/monthly-report" element={<MonthlyReport />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/report-generator" element={<ReportGenerator />} />
            <Route path="/invoice-generator" element={<InvoiceGenerator />} />
            <Route path="/contract-generator" element={<ContractGenerator />} />
            <Route path="/presentation-generator" element={<PresentationGenerator />} />
            <Route path="/roi-calculator" element={<ROICalculator />} />
            <Route path="/proposal-generator" element={<ProposalGenerator />} />
            <Route path="/campaign-generator" element={<CampaignGenerator />} />
            <Route path="/graphics-creator" element={<GraphicsCreator />} />
            <Route path="/auto-followups" element={<AutoFollowUps />} />
            <Route path="/client-service" element={<ClientService />} />
            <Route path="/welcome-pack-generator" element={<WelcomePackGenerator />} />
            <Route path="/social-media" element={<SocialMediaLibrary />} />
            <Route path="/aurine-academy" element={<AurineAcademy />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/audit-generator" element={<AuditGenerator />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppErrorBoundary>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
