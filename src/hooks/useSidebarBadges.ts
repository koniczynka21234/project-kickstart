import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SidebarBadges {
  incompleteTasks: number;
  pendingFollowUps: number;
  pendingSmsFollowUps: number;
  leadsNeedingAction: number;
  expiringContracts: number;
  clientsNeedingInvoice: number;
  upcomingPayments: number;
  pendingFinalInvoices: number;
  todayEvents: number;
  campaignsNeedingMetrics: number;
  hasCurrentMonthReport: boolean;
}

const initialBadges: SidebarBadges = {
  incompleteTasks: 0,
  pendingFollowUps: 0,
  pendingSmsFollowUps: 0,
  leadsNeedingAction: 0,
  expiringContracts: 0,
  clientsNeedingInvoice: 0,
  upcomingPayments: 0,
  pendingFinalInvoices: 0,
  todayEvents: 0,
  campaignsNeedingMetrics: 0,
  hasCurrentMonthReport: false,
};

export function useSidebarBadges(userId: string | undefined) {
  const [badges, setBadges] = useState<SidebarBadges>(initialBadges);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);
  const fetchingRef = useRef(false);

  const loadData = useCallback(async () => {
    if (!userId || fetchingRef.current) return;
    
    fetchingRef.current = true;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Calculate date for upcoming payments (3 days from now)
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      const threeDaysDate = threeDaysFromNow.toISOString().split('T')[0];

      // Parallel fetch all data
      const [
        userRolesResult,
        tasksResult,
        leadsResult,
        clientsResult,
        eventsResult,
        campaignsResult,
        allCampaignsResult,
        reportResult,
        paymentsResult,
        documentsResult,
        pendingFinalResult
      ] = await Promise.all([
        supabase.from('user_roles').select('role').eq('user_id', userId).maybeSingle(),
        supabase.from('tasks').select('id, status, assigned_to, is_agency_task, created_by').neq('status', 'completed'),
        supabase.from('leads').select('id, cold_email_sent, cold_email_date, sms_follow_up_sent, sms_follow_up_date, email_follow_up_1_sent, email_follow_up_1_date, email_follow_up_2_sent, email_follow_up_2_date, status').not('status', 'in', '("converted","lost")'),
        supabase.from('clients').select('id, status, contract_start_date, contract_end_date, contract_duration_months, contract_amount').in('status', ['active', 'paused']),
        supabase.from('calendar_events').select('id').gte('start_date', `${today}T00:00:00`).lte('start_date', `${today}T23:59:59`),
        supabase.from('campaigns').select('id, campaign_metrics!inner(id, period_start)').eq('status', 'active'),
        supabase.from('campaigns').select('id').eq('status', 'active'),
        supabase.from('monthly_reports').select('id').eq('month', new Date().getMonth() + 1).eq('year', new Date().getFullYear()).maybeSingle(),
        supabase.from('payments').select('id, client_id').eq('status', 'pending').lte('due_date', threeDaysDate).gte('due_date', today),
        supabase.from('documents').select('id, client_id').eq('type', 'invoice'),
        supabase.from('pending_final_invoices').select('id, client_id').eq('status', 'pending').lte('expected_date', threeDaysDate)
      ]);

      const isSzefUser = userRolesResult.data?.role === 'szef';

      // Calculate incomplete tasks
      let incompleteTasks = 0;
      if (tasksResult.data) {
        incompleteTasks = tasksResult.data.filter((task) => {
          if (isSzefUser) {
            return task.assigned_to === userId || task.is_agency_task || 
                   (task.created_by === userId && !task.assigned_to && !task.is_agency_task);
          }
          return task.assigned_to === userId || task.is_agency_task;
        }).length;
      }

      // Calculate leads needing action (cold mail, SMS, or email follow-ups)
      let leadsNeedingAction = 0;
      let pendingFollowUps = 0;
      let pendingSmsFollowUps = 0;
      
      if (leadsResult.data) {
        leadsResult.data.forEach(lead => {
          // Cold mail needs sending
          if (!lead.cold_email_sent && lead.cold_email_date && lead.cold_email_date <= today) {
            leadsNeedingAction++;
          }
          // SMS needs sending (only if cold mail already sent)
          if (lead.cold_email_sent && !lead.sms_follow_up_sent && lead.sms_follow_up_date && lead.sms_follow_up_date <= today) {
            leadsNeedingAction++;
            pendingSmsFollowUps++;
          }
          // Email follow-up 1 needs sending (only if cold mail AND SMS already sent)
          if (lead.cold_email_sent && lead.sms_follow_up_sent && !lead.email_follow_up_1_sent && lead.email_follow_up_1_date && lead.email_follow_up_1_date <= today) {
            leadsNeedingAction++;
            pendingFollowUps++;
          }
          // Email follow-up 2 needs sending (only if FU1 already sent)
          if (lead.cold_email_sent && lead.sms_follow_up_sent && lead.email_follow_up_1_sent && !lead.email_follow_up_2_sent && lead.email_follow_up_2_date && lead.email_follow_up_2_date <= today) {
            leadsNeedingAction++;
            pendingFollowUps++;
          }
        });
      }

      // Calculate expiring contracts
      let expiringContracts = 0;
      if (clientsResult.data) {
        const now = new Date();
        expiringContracts = clientsResult.data.filter(client => {
          if (!client.contract_start_date) return false;
          
          const startDate = new Date(client.contract_start_date);
          const endDate = client.contract_end_date 
            ? new Date(client.contract_end_date)
            : new Date(startDate.getTime() + (client.contract_duration_months || 1) * 30 * 24 * 60 * 60 * 1000);
          
          const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return daysRemaining <= 3;
        }).length;
      }

      // Clients needing invoice (have contract_amount but no invoices)
      let clientsNeedingInvoice = 0;
      if (clientsResult.data && documentsResult.data) {
        const clientsWithInvoices = new Set(
          documentsResult.data
            .filter(doc => doc.client_id)
            .map(doc => doc.client_id)
        );
        clientsNeedingInvoice = clientsResult.data.filter(client => 
          client.contract_amount && 
          client.contract_amount > 0 && 
          !clientsWithInvoices.has(client.id)
        ).length;
      }

      // Upcoming payments count
      const upcomingPayments = paymentsResult.data?.length || 0;

      // Pending final invoices count
      const pendingFinalInvoices = pendingFinalResult.data?.length || 0;

      // Today's events count
      const todayEvents = eventsResult.data?.length || 0;

      // Campaigns needing metrics
      const campaignsWithRecentMetrics = new Set(campaignsResult.data?.map(c => c.id) || []);
      const campaignsNeedingMetrics = (allCampaignsResult.data || []).filter(
        c => !campaignsWithRecentMetrics.has(c.id)
      ).length;

      // Current month report exists
      const hasCurrentMonthReport = !!reportResult.data;

      const newBadges: SidebarBadges = {
        incompleteTasks,
        pendingFollowUps,
        pendingSmsFollowUps,
        leadsNeedingAction,
        expiringContracts,
        clientsNeedingInvoice,
        upcomingPayments,
        pendingFinalInvoices,
        todayEvents,
        campaignsNeedingMetrics,
        hasCurrentMonthReport,
      };

      if (mountedRef.current) {
        setBadges(newBadges);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading sidebar badges:', error);
    } finally {
      fetchingRef.current = false;
    }
  }, [userId]);

  // Initial load
  useEffect(() => {
    mountedRef.current = true;
    loadData();

    return () => {
      mountedRef.current = false;
    };
  }, [loadData]);

  // Fallback polling + refresh on tab focus.
  // Realtime can be flaky depending on DB publication/replica identity/RLS;
  // this ensures badges converge quickly without requiring a full page refresh.
  useEffect(() => {
    if (!userId) return;

    const POLL_MS = 5000;
    const intervalId = window.setInterval(() => {
      loadData();
    }, POLL_MS);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        loadData();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", loadData);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", loadData);
    };
  }, [userId, loadData]);

  // Realtime subscriptions - refresh badges when data changes
  useEffect(() => {
    if (!userId) return;

    // Simple refresh function with minimal debounce
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const triggerRefresh = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        loadData();
      }, 100); // Short debounce - 100ms
    };

    // Subscribe to all relevant tables
    const channel = supabase
      .channel(`sidebar-badges-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, triggerRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, triggerRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, triggerRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_events' }, triggerRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campaigns' }, triggerRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campaign_metrics' }, triggerRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'monthly_reports' }, triggerRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'auto_followup_logs' }, triggerRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, triggerRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, triggerRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pending_final_invoices' }, triggerRefresh)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[SidebarBadges] Realtime subscription active');
        }
      });

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      supabase.removeChannel(channel);
    };
  }, [userId, loadData]);

  return { badges, loading, refresh: loadData };
}